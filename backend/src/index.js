require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

app.use(cors({ origin: [process.env.FRONTEND_URL, "http://localhost:5173", "http://localhost:8080"].filter(Boolean), credentials: true }));
app.use(express.json({ limit: "20mb" }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/reminders", require("./routes/reminders"));
app.use("/api/health-entries", require("./routes/healthEntries"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/prescriptions", require("./routes/prescriptions"));
app.use("/api/symptom-checks", require("./routes/symptomChecks"));
app.use("/api/consultations", require("./routes/consultations"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/ai", require("./routes/ai"));

app.get("/api/health", (_, res) => res.json({ status: "ok" }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
});
