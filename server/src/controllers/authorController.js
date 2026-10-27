import prisma from '../config/db.js';
import { classifyTicket } from '../services/aiClassifier.js';
import { generateDraftResponse } from '../services/aiDraftResponder.js';
import { sseService } from '../services/sseService.js';

/**
 * Get Author's Published and In-Production Books
 */
export async function getAuthorBooks(req, res) {
  try {
    const books = await prisma.book.findMany({
      where: { authorId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    const parsedBooks = books.map(book => ({
      ...book,
      availableOn: typeof book.availableOn === 'string' ? JSON.parse(book.availableOn || '[]') : book.availableOn
    }));

    // Calculate aggregated metrics for the author's dashboard cards
    const summary = {
      totalBooks: parsedBooks.length,
      publishedCount: parsedBooks.filter(b => b.status === 'Published & Live').length,
      inProductionCount: parsedBooks.filter(b => b.status.startsWith('In Production')).length,
      totalCopiesSold: parsedBooks.reduce((sum, b) => sum + (b.totalCopiesSold || 0), 0),
      totalRoyaltyEarned: parsedBooks.reduce((sum, b) => sum + (b.totalRoyaltyEarned || 0), 0),
      royaltyPaid: parsedBooks.reduce((sum, b) => sum + (b.royaltyPaid || 0), 0),
      royaltyPending: parsedBooks.reduce((sum, b) => sum + (b.royaltyPending || 0), 0)
    };

    return res.json({ books: parsedBooks, summary });
  } catch (err) {
    console.error('getAuthorBooks error:', err);
    return res.status(500).json({ error: 'Failed to fetch author books.' });
  }
}

/**
 * Get All Tickets Submitted by Author
 */
export async function getAuthorTickets(req, res) {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { authorId: req.user.id },
      include: {
        book: {
          select: { id: true, title: true, status: true, isbn: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: { select: { messages: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ tickets });
  } catch (err) {
    console.error('getAuthorTickets error:', err);
    return res.status(500).json({ error: 'Failed to fetch author tickets.' });
  }
}

/**
 * Get Single Ticket Details with Message Thread
 */
export async function getAuthorTicketById(req, res) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: {
        book: true,
        messages: {
          include: {
            sender: {
              select: { id: true, name: true, role: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    if (ticket.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this ticket.' });
    }

    return res.json({ ticket });
  } catch (err) {
    console.error('getAuthorTicketById error:', err);
    return res.status(500).json({ error: 'Failed to fetch ticket.' });
  }
}

/**
 * Submit a New Support Query / Ticket
 * Features:
 * - Select associated book or general/account level
 * - Optional attachment support (UI link/name)
 * - Automatic AI Classification + Priority Evaluation
 * - Contextual AI-Drafted Response Generation
 * - Real-time SSE alert to Ops Admin
 */
export async function createTicket(req, res) {
  try {
    const { subject, description, bookId, attachmentUrl } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: 'Subject is required.' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Description is required.' });
    }

    // Verify book belongs to author if provided
    let book = null;
    if (bookId && bookId !== 'general') {
      book = await prisma.book.findFirst({
        where: { id: bookId, authorId: req.user.id }
      });
      if (!book) {
        return res.status(400).json({ error: 'Selected book does not exist or belong to your account.' });
      }
    }

    // Fetch author profile
    const author = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // 1. Run AI Classifier (with resilient fallback)
    const { category, priority, reasoning } = await classifyTicket({
      subject: subject.trim(),
      description: description.trim(),
      book
    });

    // 2. Run Grounded AI Draft Generator (with BookLeaf KB + Author data context)
    let aiDraftResponse = null;
    try {
      aiDraftResponse = await generateDraftResponse({
        author,
        book,
        subject: subject.trim(),
        description: description.trim(),
        category
      });
    } catch (aiErr) {
      console.warn('AI draft generation encountered error:', aiErr.message);
    }

    // Generate unique Ticket ID: TKT-100X
    const ticketCount = await prisma.ticket.count();
    const ticketNumber = `TKT-${1000 + ticketCount + 1}`;

    const newTicket = await prisma.ticket.create({
      data: {
        ticketNumber,
        authorId: req.user.id,
        bookId: book ? book.id : null,
        subject: subject.trim(),
        description: description.trim(),
        attachmentUrl: attachmentUrl || null,
        status: 'Open',
        category,
        priority,
        aiReasoning: reasoning,
        aiDraftResponse
      },
      include: {
        book: true,
        author: { select: { id: true, name: true, email: true, authorId: true } }
      }
    });

    // Real-Time Notification: Broadcast to connected Admins via SSE
    sseService.broadcastToAdmin('TICKET_CREATED', newTicket);

    return res.status(201).json({
      message: 'Support ticket submitted successfully.',
      ticket: newTicket
    });
  } catch (err) {
    console.error('createTicket error:', err);
    return res.status(500).json({ error: 'Failed to create support ticket.' });
  }
}

/**
 * Author Adds Message / Reply to Ticket
 */
export async function addAuthorMessage(req, res) {
  try {
    const { message } = req.body;
    const ticketId = req.params.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    if (ticket.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const newMessage = await prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: req.user.id,
        message: message.trim()
      },
      include: {
        sender: { select: { id: true, name: true, role: true } }
      }
    });

    // If ticket was resolved/closed, reopen it to In Progress
    if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: 'In Progress' }
      });
    }

    // Broadcast message via SSE to ticket viewers and admins
    sseService.broadcastToTicket(ticketId, 'NEW_MESSAGE', newMessage);

    return res.status(201).json({ message: newMessage });
  } catch (err) {
    console.error('addAuthorMessage error:', err);
    return res.status(500).json({ error: 'Failed to post message.' });
  }
}
