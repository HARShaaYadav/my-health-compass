const router = require("express").Router();
const { getPrescriptions, createPrescription } = require("../controllers/prescriptionsController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/", getPrescriptions);
router.post("/", createPrescription);

module.exports = router;
