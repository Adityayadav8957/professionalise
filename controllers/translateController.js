const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const formalityLevels = {
  1: {
    label: "Professional",
    instruction:
      "Rewrite this in a polite, professional workplace tone. Keep it simple and respectful.",
  },
  2: {
    label: "Business Formal",
    instruction:
      "Rewrite this in a formal business tone. Use proper corporate language, structured sentences, and professional vocabulary.",
  },
  3: {
    label: "Corporate Speak",
    instruction:
      "Rewrite this in heavy corporate jargon. Use buzzwords like 'synergy', 'leverage', 'alignment', 'bandwidth', 'circle back', 'move the needle', 'deep dive', 'actionable insights'. Make it sound like a LinkedIn post by a startup founder.",
  },
  4: {
    label: "LinkedIn Guru",
    instruction:
      "Rewrite this as an over-the-top LinkedIn thought leader post. Use excessive corporate buzzwords, add fake humility, mention 'the journey', 'growth mindset', 'ecosystem', 'paradigm shift'. Start with a hook. End with a lesson. Make it absurdly inspirational.",
  },
  5: {
    label: "Corporate Overlord 🤣",
    instruction:
      "Rewrite this in the most ridiculously pompous, over-engineered corporate language possible. Use maximum buzzwords, passive-aggressive politeness, committee-speak, bureaucratic padding, and make even the most trivial complaint sound like a formal UN resolution. The funnier and more absurd, the better.",
  },
};

const translate = async (req, res) => {
  const { text, level } = req.body;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res
      .status(400)
      .json({ error: "Please provide some text to translate." });
  }

  if (text.trim().length > 500) {
    return res
      .status(400)
      .json({ error: "Text too long. Keep it under 500 characters." });
  }

  const formalityLevel = parseInt(level);
  if (!formalityLevels[formalityLevel]) {
    return res
      .status(400)
      .json({ error: "Invalid formality level. Must be 1–5." });
  }

  const { label, instruction } = formalityLevels[formalityLevel];

  const prompt = `You are a professional language translator that rewrites casual, frustrated, or blunt statements into workplace-appropriate language.

Formality Level: ${label}
Instruction: ${instruction}

User's original message: "${text.trim()}"

Rules:
- Preserve the core meaning/complaint but reframe it professionally
- Do NOT add any explanation or meta-commentary
- Return ONLY the rewritten text, nothing else
- Make it funny if the level is 4 or 5`;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    const response = result.text.trim();

    return res.json({ result: response, level: label });
  } catch (err) {
    console.error("Gemini API error:", err.message);
    return res
      .status(500)
      .json({ error: "Something went wrong with the AI. Try again!" });
  }
};

module.exports = { translate };
