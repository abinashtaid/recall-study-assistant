# Recall — a personal study assistant

Recall turns notes or a topic into a structured study set: interactive flashcards and a multiple-choice quiz. Missed quiz questions can be retested without repeating the ones you already know.

## Run locally

Requirements: Node.js 20 or newer.

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and add a Gemini API key to `GEMINI_API_KEY`.
3. Start the frontend and backend: `npm start`
4. Open the Vite URL printed in the terminal (usually `http://localhost:5173`).

You can explore the included sleep-science sample without an API key. To generate a fresh study set, configure a Gemini API key; the key stays on the server and is never sent to the browser. `GEMINI_MODEL` and `PORT` can be set in `.env` if needed.

Run checks with `npm test` and create a production frontend build with `npm run build`. To serve that build, run `npm run build` followed by `npm run server` and open `http://localhost:3001`.

## AI usage

The app sends the submitted notes to Google's Gemini API from the Express backend. The request asks Gemini for JSON with a title, 4–8 flashcards, and 4–8 four-choice quiz questions, and requests Gemini's JSON response mode/schema. The backend parses and validates the response before returning it; the React client validates it again before rendering. No conversation history or notes are stored by this app.

AI assistance (Copilot) was used to help implement the app and its tests. The API integration, schema checks, and UI behavior are visible in this repository and should be reviewed before extending the project.

## Failure handling

- Missing API keys, invalid input, provider errors, rate limits, timeouts, empty model responses, malformed JSON, and invalid response shapes return visible, actionable errors.
- Generate requests are bounded by a server timeout; a newer request or sample selection aborts the previous browser request so stale results cannot replace the current study set.
- The client validates the response before rendering. Validation errors are shown with a retry option instead of crashing the app.
- A bundled sample set is available for trying the interactive UI without an API key.

## Known limitations

- Model answers can still be inaccurate; verify important material against trusted sources.
- This is a single-user demo with no accounts, saved sessions, streaming, or refinement flow.
- Quiz and flashcard content is limited to 3–12 items per type, and input is limited to 4,000 characters.
- Gemini model availability and free-tier quotas depend on your Google AI Studio account and may change.
- A short screen recording should be captured separately before submitting the assignment.

## Time spent

Approximately 15 minutes of AI-assisted implementation and verification in this session. Update this estimate to reflect your own actual working time before submitting.
