const Consultation = require("../models/Consultation");

exports.getConsultations = async (req, res) => {
  try {
    const consultations = await Consultation.find({ userId: req.user._id }).sort({ appointmentTime: 1 });
    res.json(consultations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createConsultation = async (req, res) => {
  try {
    const { doctorName, specialty, appointmentTime, fee, notes } = req.body;
    if (!doctorName || !specialty || !appointmentTime) {
      return res.status(400).json({ error: "doctorName, specialty, and appointmentTime required" });
    }
    const consultation = await Consultation.create({
      userId: req.user._id,
      doctorName,
      specialty,
      appointmentTime,
      fee: fee || null,
      notes: notes || null,
    });
    res.status(201).json(consultation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!consultation) return res.status(404).json({ error: "Consultation not found" });
    res.json(consultation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCount = async (req, res) => {
  try {
    const count = await Consultation.countDocuments({ userId: req.user._id });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
