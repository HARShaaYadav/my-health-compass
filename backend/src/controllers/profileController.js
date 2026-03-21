const User = require("../models/User");

exports.getProfile = async (req, res) => {
  const u = req.user;
  res.json({ id: u._id, email: u.email, displayName: u.displayName, avatarUrl: u.avatarUrl, createdAt: u.createdAt });
};

exports.updateProfile = async (req, res) => {
  try {
    const { displayName, avatarUrl } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { displayName, avatarUrl },
      { new: true, runValidators: true }
    ).select("-password");
    res.json({ id: user._id, email: user.email, displayName: user.displayName, avatarUrl: user.avatarUrl, createdAt: user.createdAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
