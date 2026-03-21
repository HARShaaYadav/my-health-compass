const mongoose = require("mongoose");

const medicalReportSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reportType: { type: String, default: "" },
    results: { type: mongoose.Schema.Types.Mixed, default: [] },
    aiSummary: { type: String, default: "" },
    fileUrl: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicalReport", medicalReportSchema);
