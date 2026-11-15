import { describe, expect, it } from "vitest";
import { SAMPLE_SET, validateStudySet } from "../src/lib/study.js";

describe("validateStudySet", () => {
  it("accepts and normalizes a valid generated study set", () => {
    expect(validateStudySet(SAMPLE_SET)).toEqual(SAMPLE_SET);
  });

  it("rejects malformed or incomplete AI output with a useful message", () => {
    expect(() => validateStudySet(null)).toThrow("JSON object");
    expect(() => validateStudySet({ title: "Empty", cards: [], quiz: [] })).toThrow("between 3 and 12 flashcards");
    expect(() => validateStudySet({
      ...SAMPLE_SET,
      quiz: [{ question: "Question", choices: ["A", "B"], correctIndex: 4, explanation: "Why" }, ...SAMPLE_SET.quiz.slice(1)],
    })).toThrow("must have four answer choices");
  });

  it("rejects out-of-range correct answers", () => {
    const malformed = {
      ...SAMPLE_SET,
      quiz: [{ ...SAMPLE_SET.quiz[0], correctIndex: 4 }, ...SAMPLE_SET.quiz.slice(1)],
    };
    expect(() => validateStudySet(malformed)).toThrow("no valid correct answer");
  });

  it("trims text and bounds unusually long fields", () => {
    const normalized = validateStudySet({
      ...SAMPLE_SET,
      title: `  ${"a".repeat(100)}  `,
    });
    expect(normalized.title).toHaveLength(80);
  });
});
