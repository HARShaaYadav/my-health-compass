const router = require("express").Router();
const { getEntries, createEntry, deleteEntry, getCount } = require("../controllers/healthEntriesController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/", getEntries);
router.get("/count", getCount);
router.post("/", createEntry);
router.delete("/:id", deleteEntry);

module.exports = router;
