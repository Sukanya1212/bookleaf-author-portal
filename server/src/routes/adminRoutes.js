import express from 'express';
import {
  getTicketsQueue,
  getTicketDetail,
  updateTicket,
  sendAdminMessage,
  addInternalNote,
  regenerateDraft
} from '../controllers/adminController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('ADMIN'));

router.get('/tickets', getTicketsQueue);
router.get('/tickets/:id', getTicketDetail);
router.patch('/tickets/:id', updateTicket);
router.post('/tickets/:id/messages', sendAdminMessage);
router.post('/tickets/:id/notes', addInternalNote);
router.post('/tickets/:id/regenerate-draft', regenerateDraft);

export default router;
