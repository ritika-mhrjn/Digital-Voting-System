const express = require("express");
const {
  createElection,
  getElections,
  getElectionById,
  updateElection,
  deleteElection,
  endElection,
} = require("../controllers/electionController.js");
const { protect } = require("../middleware/authMiddleware.js");
const { roleMiddleware } = require("../middleware/roleMiddleware.js");

const router = express.Router();

/**
 * ELECTION ROUTES
 * Base path: /api/elections
 */

router.post(
  "/create",
  protect,
  roleMiddleware(["admin", "electoral_committee"]),
  createElection
);


router.get("/", getElections);


router.get("/:id", getElectionById);


router.put(
  "/:id",
  protect,
  roleMiddleware(["admin", "electoral_committee"]),
  updateElection
);

router.delete(
  "/:id",
  protect,
  roleMiddleware(["admin", "electoral_committee"]),
  deleteElection
);

router.put(
  "/:id/end",
  protect,
  roleMiddleware(["admin", "electoral_committee"]),
  endElection
);

module.exports = router;
