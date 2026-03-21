const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    extractedText: { type: String, default: "" },
    medicines: { type: mongoose.Schema.Types.Mixed, default: [] },
    imageUrl: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prescription", prescriptionSchema);
