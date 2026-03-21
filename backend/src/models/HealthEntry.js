const mongoose = require("mongoose");

const healthEntrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    entryType: {
      type: String,
      enum: ["visit", "note", "prescription", "symptom", "report"],
      required: true,
    },
    title: { type: String, required: true },
    detail: { type: String, default: null },
    entryDate: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HealthEntry", healthEntrySchema);
