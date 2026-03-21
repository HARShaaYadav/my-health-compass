const MedicalReport = require("../models/MedicalReport");

exports.getReports = async (req, res) => {
  try {
    const reports = await MedicalReport.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createReport = async (req, res) => {
  try {
    const { reportType, results, aiSummary } = req.body;
    const report = await MedicalReport.create({
      userId: req.user._id,
      reportType: reportType || "",
      results: results || [],
      aiSummary: aiSummary || "",
    });
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCount = async (req, res) => {
  try {
    const count = await MedicalReport.countDocuments({ userId: req.user._id });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
