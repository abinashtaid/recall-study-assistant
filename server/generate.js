import { validateStudySet } from "../src/lib/study.js";

const responseSchema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    cards: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          question: { type: "STRING" },
          answer: { type: "STRING" },
        },
        required: ["question", "answer"],
      },
    },
    quiz: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          question: { type: "STRING" },
          choices: { type: "ARRAY", items: { type: "STRING" } },
          correctIndex: { type: "INTEGER" },
          explanation: { type: "STRING" },
        },
        required: ["question", "choices", "correctIndex", "explanation"],
      },
    },
  },
  required: ["title", "cards", "quiz"],
};

export async function generateStudySet(notes) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error("Add GEMINI_API_KEY to your .env file to generate a study set.");
    error.status = 503;
    throw error;
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(45000),
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{
            text: [
              "Create a useful study set from the learner's notes below.",
              "Return 4-8 accurate, concise flashcards and 4-8 multiple-choice quiz questions.",
              "Every quiz question must have exactly four distinct choices and one correct choice.",
              "correctIndex is the zero-based index of the correct choice. Include a short explanation.",
              "Use only information supported by the notes; do not invent facts. If the notes are sparse, ask foundational questions about their stated topic.",
              `Learner's notes:\n${notes}`,
            ].join("\n\n"),
          }],
        }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.35,
        },
      }),
    });
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      const timeoutError = new Error("The AI request took too long. Please try again.");
      timeoutError.status = 504;
      throw timeoutError;
    }
    console.error("Gemini request failed:", error.message);
    const requestError = new Error("Could not reach the AI service. Check your connection and try again.");
    requestError.status = 502;
    throw requestError;
  }

  if (!response.ok) {
    const details = await response.text();
    console.error(`Gemini returned HTTP ${response.status}:`, details.slice(0, 1000));
    const providerError = new Error(
      response.status === 429
        ? "The AI service is busy right now. Please wait a moment and retry."
        : "The AI service could not generate a study set. Check your API key and try again.",
    );
    providerError.status = response.status === 429 ? 429 : 502;
    throw providerError;
  }

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();
  if (!text) {
    const emptyError = new Error("The AI returned an empty response. Please try again.");
    emptyError.status = 502;
    throw emptyError;
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const malformedError = new Error("The AI returned unreadable data. Please retry to generate a fresh study set.");
    malformedError.status = 502;
    throw malformedError;
  }

  try {
    return validateStudySet(parsed);
  } catch (error) {
    const shapeError = new Error(`The AI response did not match the study format: ${error.message}`);
    shapeError.status = 502;
    throw shapeError;
  }
}
