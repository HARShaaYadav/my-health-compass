const router = require("express").Router();
const { signup, login, me, updatePassword } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", protect, me);
router.put("/password", protect, updatePassword);

module.exports = router;
