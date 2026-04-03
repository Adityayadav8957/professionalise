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
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    // Hit Gemini REST API directly for true streaming
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:streamGenerateContent?alt=sse&key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.9 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errBody = await geminiRes.json();
      const status = geminiRes.status;

      let errorMessage = "Something went wrong with the AI. Try again!";
      if (status === 429) {
        errorMessage =
          "Slow down! You're hitting Gemini's rate limit. Wait a few seconds and try again. 🐢";
      }

      res.write(
        `event: error\ndata: ${JSON.stringify({ error: errorMessage })}\n\n`
      );
      res.end();
      return;
    }

    // Send label immediately
    res.write(`event: meta\ndata: ${JSON.stringify({ level: label })}\n\n`);
    res.flushHeaders();

    const reader = geminiRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // keep incomplete line

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (!jsonStr || jsonStr === "[DONE]") continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const chunkText = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (chunkText) {
            res.write(
              `event: chunk\ndata: ${JSON.stringify({ text: chunkText })}\n\n`
            );
            // force flush after every single chunk
            if (res.socket) {
              res.socket.write("");
            }
          }
        } catch {
          // skip malformed chunk
        }
      }
    }

    res.write(`event: done\ndata: {}\n\n`);
    res.end();
  } catch (err) {
    console.error("Gemini API error:", err.message);
    if (res.headersSent) {
      res.write(
        `event: error\ndata: ${JSON.stringify({
          error: "Something went wrong with the AI. Try again!",
        })}\n\n`
      );
      res.end();
    } else {
      res
        .status(500)
        .json({ error: "Something went wrong with the AI. Try again!" });
    }
  }
};

module.exports = { translate };
