import express from 'express';
import {
  getAuthorBooks,
  getAuthorTickets,
  getAuthorTicketById,
  createTicket,
  addAuthorMessage
} from '../controllers/authorController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('AUTHOR'));

router.get('/books', getAuthorBooks);
router.get('/tickets', getAuthorTickets);
router.post('/tickets', createTicket);
router.get('/tickets/:id', getAuthorTicketById);
router.post('/tickets/:id/messages', addAuthorMessage);

export default router;
