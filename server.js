const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const translateRoute = require("./routes/translate");
const { rateLimiter } = require("./middleware/rateLimiter");

const app = express();
const PORT = process.env.PORT || 3000;

// Security
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
      },
    },
  }),
);

app.use(cors());
app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, "public")));

// API routes
app.use("/api/translate", rateLimiter, translateRoute);

// Fallback to frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
