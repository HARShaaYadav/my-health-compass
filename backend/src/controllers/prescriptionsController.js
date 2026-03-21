const Prescription = require("../models/Prescription");

exports.getPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createPrescription = async (req, res) => {
  try {
    const { extractedText, medicines } = req.body;
    const prescription = await Prescription.create({
      userId: req.user._id,
      extractedText: extractedText || "",
      medicines: medicines || [],
    });
    res.status(201).json(prescription);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
