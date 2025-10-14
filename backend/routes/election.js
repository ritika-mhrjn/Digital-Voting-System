import express from "express";
import { createElection, getElections, getElectionById, endElection } from "../controllers/electionController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Create new election
router.post("/create", authMiddleware, createElection);

// Get all elections
router.get("/", getElections);

// Get one election
router.get("/:id", getElectionById);

// End election
router.put("/:id/end", authMiddleware, endElection);

export default router;
