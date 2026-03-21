const SymptomCheck = require("../models/SymptomCheck");

exports.createCheck = async (req, res) => {
  try {
    const { symptoms, results } = req.body;
    if (!symptoms || !Array.isArray(symptoms)) return res.status(400).json({ error: "symptoms array required" });
    const check = await SymptomCheck.create({ userId: req.user._id, symptoms, results: results || [] });
    res.status(201).json(check);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCount = async (req, res) => {
  try {
    const count = await SymptomCheck.countDocuments({ userId: req.user._id });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
