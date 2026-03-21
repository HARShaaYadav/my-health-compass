const router = require("express").Router();
const { getReports, createReport, getCount } = require("../controllers/reportsController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/", getReports);
router.get("/count", getCount);
router.post("/", createReport);

module.exports = router;
