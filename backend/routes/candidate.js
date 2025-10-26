import express from 'express';
import {
  addCandidate,
  getAllCandidates,
  getCandidateById,
  updateCandidate,
  deleteCandidate,
} from '../controllers/candidateController.js';

const router = express.Router();

// Routes
router.post('/add', addCandidate);          // POST /api/candidates/add
router.get('/', getAllCandidates);          // GET /api/candidates
router.get('/:id', getCandidateById);       // GET /api/candidates/:id
router.put('/:id', updateCandidate);        // PUT /api/candidates/:id
router.delete('/:id', deleteCandidate);     // DELETE /api/candidates/:id

export default router;
