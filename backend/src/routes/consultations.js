const router = require("express").Router();
const { getConsultations, createConsultation, updateConsultation, getCount } = require("../controllers/consultationsController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/", getConsultations);
router.get("/count", getCount);
router.post("/", createConsultation);
router.put("/:id", updateConsultation);

module.exports = router;
