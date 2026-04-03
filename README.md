# 💼 Professionalize It

> Turn your unfiltered rants into corporate gold. Powered by Gemini AI.

## Features
- 🎯 Converts blunt/frustrated text into professional language
- 📊 5 formality levels: Professional → Corporate Overlord
- ⚡ Rate limited (10 req/min per IP)
- 📋 Copy to clipboard
- 💡 Example phrases to get started

---

## 📁 Folder Structure

```
professionalize-it/
├── server.js                  # Express entry point
├── package.json
├── .env.example               # Copy to .env and fill in your key
├── .gitignore
│
├── routes/
│   └── translate.js           # POST /api/translate route
│
├── controllers/
│   └── translateController.js # Gemini API logic + formality prompts
│
├── middleware/
│   └── rateLimiter.js         # 10 requests/min per IP
│
└── public/                    # Static frontend (served by Express)
    ├── index.html
    ├── css/
    │   └── style.css
    └── js/
        └── main.js
```

---

## 🚀 Local Setup

### 1. Clone and install
```bash
git clone https://github.com/yourusername/professionalize-it.git
cd professionalize-it
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env`:
```
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

Get your free Gemini API key at: https://aistudio.google.com/app/apikey

### 3. Run locally
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Open http://localhost:3000

---

## ☁️ Deploy to Railway (Recommended)

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your repo
4. Add environment variable: `GEMINI_API_KEY=your_key_here`
5. Railway auto-detects Node.js and deploys!

Your app will be live at `https://your-app.up.railway.app` 🎉

---

## ☁️ Deploy to Render (Alternative)

1. Push to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add env var: `GEMINI_API_KEY=your_key_here`
7. Deploy!

---

## 🛡️ Rate Limiting

- **10 requests per minute** per IP address
- Returns a friendly 429 error when exceeded
- Configurable in `middleware/rateLimiter.js`

---

## 📝 API

### POST `/api/translate`

**Request body:**
```json
{
  "text": "My boss sucks",
  "level": 3
}
```

**Levels:**
| Level | Name |
|-------|------|
| 1 | Professional |
| 2 | Business Formal |
| 3 | Corporate Speak |
| 4 | LinkedIn Guru |
| 5 | Corporate Overlord 🤣 |

**Response:**
```json
{
  "result": "I am experiencing some misalignment with my supervisor's leadership methodology.",
  "level": "Corporate Speak"
}
```

---

Made with 😂 for LinkedIn clout