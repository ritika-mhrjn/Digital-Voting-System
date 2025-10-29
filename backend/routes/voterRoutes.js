import express from "express";
import { addVoter } from "../controllers/voterController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Only admin can add voters
router.post("/add", authMiddleware, roleMiddleware(["admin"]), addVoter);

export default router;
