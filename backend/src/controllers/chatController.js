const ChatConversation = require("../models/ChatConversation");
const ChatMessage = require("../models/ChatMessage");

exports.getConversations = async (req, res) => {
  try {
    const conversations = await ChatConversation.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(20);
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createConversation = async (req, res) => {
  try {
    const { title } = req.body;
    const conversation = await ChatConversation.create({ userId: req.user._id, title: title || null });
    res.status(201).json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    const conversation = await ChatConversation.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    await ChatMessage.deleteMany({ conversationId: req.params.id });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    // Verify ownership
    const conversation = await ChatConversation.findOne({ _id: req.params.id, userId: req.user._id });
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    const messages = await ChatMessage.find({ conversationId: req.params.id }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addMessage = async (req, res) => {
  try {
    const { role, content } = req.body;
    if (!role || !content) return res.status(400).json({ error: "role and content required" });
    // Verify ownership
    const conversation = await ChatConversation.findOne({ _id: req.params.id, userId: req.user._id });
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    const message = await ChatMessage.create({ conversationId: req.params.id, role, content });
    // Touch updatedAt on conversation
    await ChatConversation.findByIdAndUpdate(req.params.id, { updatedAt: new Date() });
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
