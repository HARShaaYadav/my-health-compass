const router = require("express").Router();
const { createCheck, getCount } = require("../controllers/symptomChecksController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.post("/", createCheck);
router.get("/count", getCount);

module.exports = router;
