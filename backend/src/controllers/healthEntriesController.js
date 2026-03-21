const HealthEntry = require("../models/HealthEntry");

exports.getEntries = async (req, res) => {
  try {
    const entries = await HealthEntry.find({ userId: req.user._id }).sort({ entryDate: -1, createdAt: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createEntry = async (req, res) => {
  try {
    const { entryType, title, detail, entryDate } = req.body;
    if (!entryType || !title) return res.status(400).json({ error: "entryType and title required" });
    const entry = await HealthEntry.create({
      userId: req.user._id,
      entryType,
      title,
      detail: detail || null,
      entryDate: entryDate || new Date(),
    });
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteEntry = async (req, res) => {
  try {
    const entry = await HealthEntry.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!entry) return res.status(404).json({ error: "Entry not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCount = async (req, res) => {
  try {
    const count = await HealthEntry.countDocuments({ userId: req.user._id });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
