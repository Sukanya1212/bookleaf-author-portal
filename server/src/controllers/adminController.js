import prisma from '../config/db.js';
import { generateDraftResponse } from '../services/aiDraftResponder.js';
import { sseService } from '../services/sseService.js';

/**
 * Get Admin Ticket Queue
 * Supports multi-filter: status, category, priority, search
 * Easily spots urgent and oldest unresolved queries
 */
export async function getTicketsQueue(req, res) {
  try {
    const { status, category, priority, search, sortBy } = req.query;

    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }
    if (category && category !== 'all') {
      where.category = category;
    }
    if (priority && priority !== 'all') {
      where.priority = priority;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { ticketNumber: { contains: q } },
        { subject: { contains: q } },
        { description: { contains: q } },
        { author: { name: { contains: q } } },
        { author: { email: { contains: q } } }
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        author: {
          select: { id: true, authorId: true, name: true, email: true, phone: true }
        },
        book: {
          select: { id: true, bookId: true, title: true, status: true, royaltyPending: true }
        },
        assignedToAdmin: {
          select: { id: true, name: true }
        },
        _count: {
          select: { messages: true, internalNotes: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Custom sorting: Urgency first (Critical -> High -> Medium -> Low), then oldest unresolved
    const priorityWeights = { Critical: 4, High: 3, Medium: 2, Low: 1 };

    let sortedTickets = [...tickets];

    if (sortBy === 'oldest') {
      sortedTickets.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'newest') {
      sortedTickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      // Default: Urgency priority, prioritizing open/unresolved
      sortedTickets.sort((a, b) => {
        const aOpen = a.status !== 'Resolved' && a.status !== 'Closed';
        const bOpen = b.status !== 'Resolved' && b.status !== 'Closed';

        if (aOpen && !bOpen) return -1;
        if (!aOpen && bOpen) return 1;

        const weightA = priorityWeights[a.priority] || 0;
        const weightB = priorityWeights[b.priority] || 0;

        if (weightA !== weightB) {
          return weightB - weightA; // higher priority first
        }

        // if same priority, older tickets first (oldest unresolved)
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
    }

    // Flag urgent and stale tickets (> 48 hours unresolved)
    const now = new Date();
    const enrichedTickets = sortedTickets.map(t => {
      const ageHours = (now - new Date(t.createdAt)) / (1000 * 60 * 60);
      return {
        ...t,
        isUrgent: t.priority === 'Critical' || t.priority === 'High',
        isStale: (t.status === 'Open' || t.status === 'In Progress') && ageHours > 48,
        ageHours: Math.round(ageHours)
      };
    });

    // Summary counters for queue header
    const queueStats = {
      total: enrichedTickets.length,
      openCount: enrichedTickets.filter(t => t.status === 'Open').length,
      criticalCount: enrichedTickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved' && t.status !== 'Closed').length,
      highCount: enrichedTickets.filter(t => t.priority === 'High' && t.status !== 'Resolved' && t.status !== 'Closed').length,
      inProgressCount: enrichedTickets.filter(t => t.status === 'In Progress').length,
      resolvedCount: enrichedTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length
    };

    return res.json({ tickets: enrichedTickets, stats: queueStats });
  } catch (err) {
    console.error('getTicketsQueue error:', err);
    return res.status(500).json({ error: 'Failed to retrieve ticket queue.' });
  }
}

/**
 * Get Full Ticket Detail for Admin Triage
 */
export async function getTicketDetail(req, res) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: {
        author: {
          select: {
            id: true,
            authorId: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            joinedDate: true,
            books: {
              select: { id: true, bookId: true, title: true, status: true, royaltyPending: true }
            }
          }
        },
        book: true,
        assignedToAdmin: {
          select: { id: true, name: true, email: true }
        },
        messages: {
          include: {
            sender: { select: { id: true, name: true, role: true } }
          },
          orderBy: { createdAt: 'asc' }
        },
        internalNotes: {
          include: {
            admin: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    // Parse book availableOn if present
    if (ticket.book && typeof ticket.book.availableOn === 'string') {
      try {
        ticket.book.availableOn = JSON.parse(ticket.book.availableOn);
      } catch (e) {
        ticket.book.availableOn = [];
      }
    }

    // Get list of all admins for assignment dropdown
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, name: true, email: true }
    });

    return res.json({ ticket, admins });
  } catch (err) {
    console.error('getTicketDetail error:', err);
    return res.status(500).json({ error: 'Failed to retrieve ticket details.' });
  }
}

/**
 * Update Ticket Properties (Status, Category override, Priority override, Assignment)
 */
export async function updateTicket(req, res) {
  try {
    const ticketId = req.params.id;
    const { status, category, priority, assignedToAdminId } = req.body;

    const existing = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!existing) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    const dataToUpdate = {};
    let overridden = existing.isOverridden;

    if (status) dataToUpdate.status = status;
    if (category && category !== existing.category) {
      dataToUpdate.category = category;
      overridden = true;
    }
    if (priority && priority !== existing.priority) {
      dataToUpdate.priority = priority;
      overridden = true;
    }
    if (assignedToAdminId !== undefined) {
      dataToUpdate.assignedToAdminId = assignedToAdminId || null;
    }

    dataToUpdate.isOverridden = overridden;

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: dataToUpdate,
      include: {
        assignedToAdmin: { select: { id: true, name: true } }
      }
    });

    // Notify ticket room via SSE
    sseService.broadcastToTicket(ticketId, 'TICKET_UPDATED', updated);

    return res.json({ message: 'Ticket updated successfully.', ticket: updated });
  } catch (err) {
    console.error('updateTicket error:', err);
    return res.status(500).json({ error: 'Failed to update ticket.' });
  }
}

/**
 * Admin Sends Official Response to Author
 * Updates ticket view in real time for author
 */
export async function sendAdminMessage(req, res) {
  try {
    const ticketId = req.params.id;
    const { message, newStatus } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Response content is required.' });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    const createdMessage = await prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: req.user.id,
        message: message.trim()
      },
      include: {
        sender: { select: { id: true, name: true, role: true } }
      }
    });

    // Update ticket status
    const statusToSet = newStatus || (ticket.status === 'Open' ? 'In Progress' : ticket.status);
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: statusToSet,
        assignedToAdminId: ticket.assignedToAdminId || req.user.id
      }
    });

    // Broadcast in real-time to author's open ticket page!
    sseService.broadcastToTicket(ticketId, 'NEW_MESSAGE', createdMessage);
    sseService.broadcastToTicket(ticketId, 'STATUS_CHANGED', { status: statusToSet });

    return res.status(201).json({ message: createdMessage, newStatus: statusToSet });
  } catch (err) {
    console.error('sendAdminMessage error:', err);
    return res.status(500).json({ error: 'Failed to send response.' });
  }
}

/**
 * Add Internal Note (Only visible to BookLeaf Ops team)
 */
export async function addInternalNote(req, res) {
  try {
    const ticketId = req.params.id;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ error: 'Note text cannot be empty.' });
    }

    const createdNote = await prisma.internalNote.create({
      data: {
        ticketId,
        adminId: req.user.id,
        note: note.trim()
      },
      include: {
        admin: { select: { id: true, name: true } }
      }
    });

    return res.status(201).json({ note: createdNote });
  } catch (err) {
    console.error('addInternalNote error:', err);
    return res.status(500).json({ error: 'Failed to add internal note.' });
  }
}

/**
 * Manually Regenerate AI Draft for a Ticket
 */
export async function regenerateDraft(req, res) {
  try {
    const ticketId = req.params.id;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { author: true, book: true }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    const aiDraftResponse = await generateDraftResponse({
      author: ticket.author,
      book: ticket.book,
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category
    });

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { aiDraftResponse }
    });

    return res.json({ aiDraftResponse: updated.aiDraftResponse });
  } catch (err) {
    console.error('regenerateDraft error:', err);
    return res.status(500).json({ error: 'Failed to regenerate AI draft.' });
  }
}
