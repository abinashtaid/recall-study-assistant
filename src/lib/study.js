export function validateStudySet(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("The study set must be a JSON object.");
  }

  const title = cleanText(value.title, 80);
  if (!Array.isArray(value.cards) || value.cards.length < 3 || value.cards.length > 12) {
    throw new Error("The study set needs between 3 and 12 flashcards.");
  }
  if (!Array.isArray(value.quiz) || value.quiz.length < 3 || value.quiz.length > 12) {
    throw new Error("The study set needs between 3 and 12 quiz questions.");
  }

  const cards = value.cards.map((card, index) => {
    if (!card || typeof card !== "object") {
      throw new Error(`Flashcard ${index + 1} is not valid.`);
    }
    return {
      question: cleanText(card.question, 240),
      answer: cleanText(card.answer, 600),
    };
  });

  const quiz = value.quiz.map((question, index) => {
    if (!question || typeof question !== "object" || !Array.isArray(question.choices)) {
      throw new Error(`Quiz question ${index + 1} is not valid.`);
    }
    if (question.choices.length !== 4) {
      throw new Error(`Quiz question ${index + 1} must have four answer choices.`);
    }
    const correctIndex = question.correctIndex;
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
      throw new Error(`Quiz question ${index + 1} has no valid correct answer.`);
    }
    return {
      question: cleanText(question.question, 240),
      choices: question.choices.map((choice) => cleanText(choice, 180)),
      correctIndex,
      explanation: cleanText(question.explanation, 400),
    };
  });

  return { title, cards, quiz };
}

function cleanText(value, maxLength) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("The study set contains a missing or empty text field.");
  }
  return value.trim().slice(0, maxLength);
}

export const SAMPLE_SET = {
  title: "The science of sleep",
  cards: [
    { question: "What is the circadian rhythm?", answer: "The body's internal roughly 24-hour clock, which helps coordinate sleep, alertness, and other daily patterns." },
    { question: "What happens during REM sleep?", answer: "Brain activity becomes more similar to waking levels, vivid dreaming is common, and most muscles are temporarily relaxed." },
    { question: "How does sleep pressure build?", answer: "Adenosine accumulates in the brain while you are awake, increasing the drive to sleep; it falls during sleep." },
    { question: "Why does morning light matter?", answer: "Light reaching the eyes helps synchronize the circadian clock, supporting alertness during the day and sleepiness at night." },
  ],
  quiz: [
    {
      question: "Which process helps set the body's daily timing?",
      choices: ["Circadian rhythm", "Digestive cycle", "Reflex arc", "Immune response"],
      correctIndex: 0,
      explanation: "The circadian rhythm is the internal clock that coordinates many roughly 24-hour patterns.",
    },
    {
      question: "What tends to happen to adenosine during waking hours?",
      choices: ["It builds up", "It disappears", "It turns into melatonin", "It blocks all dreams"],
      correctIndex: 0,
      explanation: "Adenosine gradually accumulates during wakefulness and contributes to sleep pressure.",
    },
    {
      question: "Which sleep stage is often associated with vivid dreams?",
      choices: ["REM sleep", "Only the first minute of sleep", "Quiet wakefulness", "None of the sleep stages"],
      correctIndex: 0,
      explanation: "Vivid dreaming is common during REM sleep, though dreams can occur in other stages too.",
    },
    {
      question: "What is one way morning light supports healthy sleep timing?",
      choices: ["It helps synchronize the circadian clock", "It removes the need for sleep", "It stops adenosine production", "It causes REM sleep immediately"],
      correctIndex: 0,
      explanation: "Morning light helps keep the circadian clock aligned with the day-night cycle.",
    },
  ],
};
