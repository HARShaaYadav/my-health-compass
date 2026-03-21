const mongoose = require("mongoose");

const medicineReminderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    medicineName: { type: String, required: true },
    dosage: { type: String, default: null },
    frequency: { type: String, default: "daily" },
    times: { type: [String], default: ["08:00"] },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicineReminder", medicineReminderSchema);
