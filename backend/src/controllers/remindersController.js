const MedicineReminder = require("../models/MedicineReminder");

exports.getReminders = async (req, res) => {
  try {
    const reminders = await MedicineReminder.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createReminder = async (req, res) => {
  try {
    const { medicineName, dosage, times, endDate } = req.body;
    if (!medicineName) return res.status(400).json({ error: "Medicine name required" });
    const reminder = await MedicineReminder.create({
      userId: req.user._id,
      medicineName,
      dosage: dosage || null,
      times: times || ["08:00"],
      endDate: endDate || null,
    });
    res.status(201).json(reminder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateReminder = async (req, res) => {
  try {
    const reminder = await MedicineReminder.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!reminder) return res.status(404).json({ error: "Reminder not found" });
    res.json(reminder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteReminder = async (req, res) => {
  try {
    const reminder = await MedicineReminder.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!reminder) return res.status(404).json({ error: "Reminder not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getActiveCount = async (req, res) => {
  try {
    const count = await MedicineReminder.countDocuments({ userId: req.user._id, isActive: true });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
