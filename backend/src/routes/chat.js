const router = require("express").Router();
const { getConversations, createConversation, deleteConversation, getMessages, addMessage } = require("../controllers/chatController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/conversations", getConversations);
router.post("/conversations", createConversation);
router.delete("/conversations/:id", deleteConversation);
router.get("/conversations/:id/messages", getMessages);
router.post("/conversations/:id/messages", addMessage);

module.exports = router;
