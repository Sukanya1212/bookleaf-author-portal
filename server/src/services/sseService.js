/**
 * Real-Time Server-Sent Events (SSE) Manager
 * Enables live ticket thread and queue updates without page refreshes.
 */

class SSEService {
  constructor() {
    // Map of ticketId -> Set of response objects
    this.ticketClients = new Map();
    // Set of admin response objects
    this.adminClients = new Set();
  }

  // Subscribe a client to a specific ticket thread
  subscribeTicket(ticketId, res) {
    if (!this.ticketClients.has(ticketId)) {
      this.ticketClients.set(ticketId, new Set());
    }
    const clients = this.ticketClients.get(ticketId);
    clients.add(res);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', ticketId })}\n\n`);

    reqCloseHandler:
    res.on('close', () => {
      clients.delete(res);
      if (clients.size === 0) {
        this.ticketClients.delete(ticketId);
      }
    });
  }

  // Subscribe an admin to the admin queue stream
  subscribeAdmin(res) {
    this.adminClients.add(res);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    res.write(`data: ${JSON.stringify({ type: 'CONNECTED_ADMIN' })}\n\n`);

    res.on('close', () => {
      this.adminClients.delete(res);
    });
  }

  // Broadcast event to clients watching a specific ticket
  broadcastToTicket(ticketId, eventType, data) {
    const clients = this.ticketClients.get(ticketId);
    if (clients) {
      const payload = JSON.stringify({ type: eventType, ticketId, data, timestamp: new Date().toISOString() });
      for (const res of clients) {
        res.write(`data: ${payload}\n\n`);
      }
    }

    // Also notify admins if a new message or update arrives
    this.broadcastToAdmin(eventType, { ticketId, ...data });
  }

  // Broadcast event to all admins
  broadcastToAdmin(eventType, data) {
    const payload = JSON.stringify({ type: eventType, data, timestamp: new Date().toISOString() });
    for (const res of this.adminClients) {
      res.write(`data: ${payload}\n\n`);
    }
  }
}

export const sseService = new SSEService();
