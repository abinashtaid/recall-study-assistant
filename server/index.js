import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateStudySet } from "./generate.js";

const app = express();
const port = Number(process.env.PORT) || 3001;
const currentDir = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json({ limit: "20kb" }));

app.post("/api/generate", async (request, response) => {
  const notes = request.body?.notes;
  if (typeof notes !== "string" || !notes.trim()) {
    return response.status(400).json({ error: "Add some notes or a topic before generating." });
  }
  if (notes.trim().length > 4000) {
    return response.status(400).json({ error: "Keep your notes under 4,000 characters." });
  }

  try {
    const studySet = await generateStudySet(notes.trim());
    return response.json(studySet);
  } catch (error) {
    console.error("Study set generation failed:", error.message);
    return response.status(error.status || 500).json({
      error: error.status ? error.message : "Something went wrong while generating your study set. Please try again.",
    });
  }
});

app.use(express.static(path.resolve(currentDir, "../dist")));
app.get("*", (_request, response) => {
  response.sendFile(path.resolve(currentDir, "../dist/index.html"), (error) => {
    if (error) {
      response.status(404).send("Build the app with `npm run build` before serving the production frontend.");
    }
  });
});

app.listen(port, () => {
  console.log(`Recall API ready at http://localhost:${port}`);
});
