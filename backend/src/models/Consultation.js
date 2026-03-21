const mongoose = require("mongoose");

const consultationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctorName: { type: String, required: true },
    specialty: { type: String, required: true },
    appointmentTime: { type: Date, required: true },
    fee: { type: String, default: null },
    notes: { type: String, default: null },
    status: { type: String, enum: ["booked", "cancelled", "completed"], default: "booked" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Consultation", consultationSchema);
