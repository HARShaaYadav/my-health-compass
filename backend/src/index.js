require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const compression = require("compression");
const connectDB = require("./config/db");

const app = express();
const isProd = process.env.NODE_ENV === "production";

// Security headers
app.use(helmet());

// Compression
app.use(compression());

// Logging — concise in prod, verbose in dev
app.use(morgan(isProd ? "combined" : "dev"));

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:8080",
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // allow non-browser requests (curl, Postman)
    if (!origin) return cb(null, true);
    // allow exact matches
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // allow any vercel.app subdomain (preview deployments)
    if (origin.endsWith(".vercel.app")) return cb(null, true);
    // allow any render.com subdomain
    if (origin.endsWith(".onrender.com")) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Global rate limiter — 200 req / 15 min per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
}));

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: "Too many auth attempts, please try again later." },
});

// Routes
app.use("/api/auth", authLimiter, require("./routes/auth"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/reminders", require("./routes/reminders"));
app.use("/api/health-entries", require("./routes/healthEntries"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/prescriptions", require("./routes/prescriptions"));
app.use("/api/symptom-checks", require("./routes/symptomChecks"));
app.use("/api/consultations", require("./routes/consultations"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/ai", require("./routes/ai"));

// Health check
app.get("/api/health", (_, res) => res.json({ status: "ok", env: process.env.NODE_ENV }));

// 404
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// Global error handler
app.use((err, req, res, next) => {
  // Don't leak stack traces in production
  if (isProd) {
    console.error(`[${new Date().toISOString()}] ${err.message}`);
    res.status(err.status || 500).json({ error: err.message || "Internal server error" });
  } else {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message, stack: err.stack });
  }
});

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Backend running on port ${PORT} [${process.env.NODE_ENV || "development"}]`));
});
