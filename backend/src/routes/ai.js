const router = require("express").Router();
const { chat, analyzeSymptoms, symptomChat, analyzeImage, analyzeReport, analyzePrescription, analyzeInsurance, checkInteractions } = require("../controllers/aiController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.post("/chat", chat);
router.post("/symptom-chat", symptomChat);
router.post("/analyze-symptoms", analyzeSymptoms);
router.post("/analyze-image", analyzeImage);
router.post("/analyze-report", analyzeReport);
router.post("/analyze-prescription", analyzePrescription);
router.post("/analyze-insurance", analyzeInsurance);
router.post("/check-interactions", checkInteractions);

module.exports = router;
