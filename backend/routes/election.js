import express from "express";
import {
  createElection,
  getElections,
  getElectionById,
  endElection,
} from "../controllers/electionController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

// 🗳️ Create new election — only admin
router.post("/create", authMiddleware, roleMiddleware(["admin"]), createElection);

// 📋 Get all elections — public
router.get("/", getElections);

// 🔍 Get one election by ID — public
router.get("/:id", getElectionById);

// 🚫 End an election — only admin
router.put("/:id/end", authMiddleware, roleMiddleware(["admin"]), endElection);

export default router;
