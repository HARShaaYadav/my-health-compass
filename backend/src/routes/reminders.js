const router = require("express").Router();
const { getReminders, createReminder, updateReminder, deleteReminder, getActiveCount } = require("../controllers/remindersController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/", getReminders);
router.get("/count", getActiveCount);
router.post("/", createReminder);
router.put("/:id", updateReminder);
router.delete("/:id", deleteReminder);

module.exports = router;
