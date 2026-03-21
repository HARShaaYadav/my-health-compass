const mongoose = require("mongoose");

const chatConversationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatConversation", chatConversationSchema);
