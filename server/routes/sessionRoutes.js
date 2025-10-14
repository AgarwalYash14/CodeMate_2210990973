const express = require("express");
const router = express.Router();

const { authMiddleware, checkRole } = require("../middlewares/authmiddleware");
const {
    createSession,
    joinSession,
    sessionHistory,
    getUserSessions,
    endSession,
    deleteSession,
    saveCode,
    getParticipants,
    leaveSession,
    raiseHand,
    lowerHand,
    getRaisedHands,
    getAllRaisedHands,
} = require("../controllers/sessionController");

// Basic session routes
router.post("/create", authMiddleware, createSession);
router.get("/join/:roomId", authMiddleware, joinSession);
router.get("/history/:roomId", authMiddleware, sessionHistory);
router.get("/my-sessions", authMiddleware, getUserSessions);
router.delete("/:roomId", authMiddleware, endSession);
router.delete("/delete/:roomId", authMiddleware, deleteSession);

// Code
router.put("/:roomId/code", authMiddleware, saveCode);

//Participants
router.get("/:roomId/participants", authMiddleware, getParticipants);
router.post("/:roomId/leave", authMiddleware, leaveSession);

// Raise Hand feature
router.post("/:roomId/raise-hand", authMiddleware, raiseHand);
router.delete("/:roomId/raise-hand", authMiddleware, lowerHand);
router.get("/:roomId/raised-hands", authMiddleware, getRaisedHands);

// TeachingAssistant
router.get(
    "/ta/raisedHands",
    authMiddleware,
    checkRole("teaching_assistant"),
    getAllRaisedHands
);

module.exports = router;
