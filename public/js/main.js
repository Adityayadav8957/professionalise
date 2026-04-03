const formalityLabels = {
  1: "Professional",
  2: "Business Formal",
  3: "Corporate Speak",
  4: "LinkedIn Guru",
  5: "Corporate Overlord",
};

const inputText = document.getElementById("inputText");
const charCount = document.getElementById("charCount");
const slider = document.getElementById("formalitySlider");
const levelPill = document.getElementById("levelPill");
const translateBtn = document.getElementById("translateBtn");
const btnText = document.getElementById("btnText");
const placeholder = document.getElementById("placeholder");
const resultText = document.getElementById("resultText");
const resultBadge = document.getElementById("resultBadge");
const copyBtn = document.getElementById("copyBtn");
const copyText = document.getElementById("copyText");
const errorCard = document.getElementById("errorCard");
const errorTextEl = document.getElementById("errorText");

// Char counter
inputText.addEventListener("input", () => {
  charCount.textContent = inputText.value.length;
});

// Slider
slider.addEventListener("input", () => {
  levelPill.textContent = formalityLabels[slider.value];
});

// Example chips
document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    inputText.value = chip.dataset.text;
    charCount.textContent = chip.dataset.text.length;
    inputText.focus();
  });
});

// Translate
translateBtn.addEventListener("click", async () => {
  const text = inputText.value.trim();
  if (!text) {
    showError("Please type something first!");
    return;
  }

  hideError();
  hideResult();
  setLoading(true);

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, level: parseInt(slider.value) }),
    });

    if (!res.ok) {
      const data = await res.json();
      showError(data.error || "Something went wrong. Try again!");
      setLoading(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";
    let streamStarted = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE messages are separated by double newline
      const messages = buffer.split("\n\n");
      buffer = messages.pop(); // last item may be incomplete, keep in buffer

      for (const message of messages) {
        if (!message.trim()) continue;

        // Parse event type and data from the message block
        const lines = message.split("\n");
        let eventType = "message";
        let dataLine = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            dataLine = line.slice(6).trim();
          }
        }

        if (!dataLine) continue;

        try {
          const payload = JSON.parse(dataLine);

          if (eventType === "meta") {
            // Show result box as soon as stream starts
            showResult("", payload.level);
            setLoading(false);
            streamStarted = true;
          }

          if (eventType === "chunk" && payload.text) {
            if (!streamStarted) {
              showResult("", formalityLabels[slider.value]);
              setLoading(false);
              streamStarted = true;
            }
            fullText += payload.text;
            resultText.textContent = fullText;
          }

          if (eventType === "error") {
            showError(payload.error);
            setLoading(false);
            return;
          }
        } catch {
          // malformed JSON, skip
        }
      }
    }
  } catch {
    showError("Network error. Check your connection.");
    setLoading(false);
  }
});

// Copy
copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(resultText.textContent).then(() => {
    copyBtn.classList.add("copied");
    copyText.textContent = "Copied!";
    setTimeout(() => {
      copyBtn.classList.remove("copied");
      copyText.textContent = "Copy";
    }, 2000);
  });
});

function setLoading(isLoading) {
  translateBtn.disabled = isLoading;
  btnText.innerHTML = isLoading
    ? '<span class="spinner"></span> Washing...'
    : "🧼 Wash My Rant";
}

function showResult(text, level) {
  placeholder.style.display = "none";
  resultText.textContent = text;
  resultText.classList.add("visible");
  resultBadge.textContent = level;
  resultBadge.style.display = "inline-block";
  copyBtn.style.display = "inline-flex";
}

function hideResult() {
  placeholder.style.display = "";
  resultText.textContent = "";
  resultText.classList.remove("visible");
  resultBadge.style.display = "none";
  copyBtn.style.display = "none";
}

function showError(msg) {
  errorTextEl.textContent = msg;
  errorCard.style.display = "flex";
}

function hideError() {
  errorCard.style.display = "none";
}
