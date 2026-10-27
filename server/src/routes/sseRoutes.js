import express from 'express';
import { sseService } from '../services/sseService.js';

const router = express.Router();

// Real-Time stream for a specific ticket (Authors and Admins)
router.get('/tickets/:id', (req, res) => {
  const ticketId = req.params.id;
  sseService.subscribeTicket(ticketId, res);
});

// Real-Time stream for admin queue dashboard
router.get('/admin', (req, res) => {
  sseService.subscribeAdmin(res);
});

export default router;
