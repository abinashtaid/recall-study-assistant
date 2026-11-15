import { useEffect, useRef, useState } from "react";
import { SAMPLE_SET, validateStudySet } from "./lib/study.js";

const ideas = ["Photosynthesis", "World War II", "JavaScript closures"];

function App() {
  const [notes, setNotes] = useState("");
  const [studySet, setStudySet] = useState(null);
  const [isSample, setIsSample] = useState(false);
  const [activeTab, setActiveTab] = useState("cards");
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answers, setAnswers] = useState({});
  const [retestAnswers, setRetestAnswers] = useState({});
  const [isRetest, setIsRetest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const controller = useRef(null);

  useEffect(() => () => controller.current?.abort(), []);

  async function createStudySet(event) {
    event.preventDefault();
    const prompt = notes.trim();
    if (!prompt || loading) return;

    controller.current?.abort();
    const currentRequest = ++requestId.current;
    const nextController = new AbortController();
    controller.current = nextController;
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: prompt }),
        signal: nextController.signal,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "The server returned an unreadable response. Please try again.");
      if (!data) throw new Error("The server returned an unreadable response. Please try again.");
      const checked = validateStudySet(data);
      if (currentRequest !== requestId.current) return;
      setStudySet(checked);
      setIsSample(false);
      resetSession();
    } catch (requestError) {
      if (requestError.name !== "AbortError" && currentRequest === requestId.current) {
        setError(requestError.message || "Couldn't reach the server. Please try again.");
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }

  function resetSession() {
    setCardIndex(0);
    setFlipped(false);
    setAnswers({});
    setRetestAnswers({});
    setIsRetest(false);
    setActiveTab("cards");
  }

  function loadSample() {
    controller.current?.abort();
    requestId.current += 1;
    setLoading(false);
    setError("");
    setStudySet(validateStudySet(SAMPLE_SET));
    setIsSample(true);
    resetSession();
  }

  function selectAnswer(questionIndex, answerIndex) {
    if (isRetest) {
      if (retestAnswers[questionIndex] !== undefined) return;
      setRetestAnswers((current) => ({ ...current, [questionIndex]: answerIndex }));
      return;
    }
    if (answers[questionIndex] !== undefined) return;
    setAnswers((current) => ({ ...current, [questionIndex]: answerIndex }));
  }

  const wrongQuestions = studySet?.quiz
    .map((question, index) => ({ question, index }))
    .filter(({ question, index }) => answers[index] !== undefined && answers[index] !== question.correctIndex) || [];
  const visibleQuiz = isRetest
    ? wrongQuestions.map(({ question }) => question)
    : studySet?.quiz || [];
  const answeredCount = isRetest
    ? visibleQuiz.filter((_, index) => retestAnswers[wrongQuestions[index]?.index] !== undefined).length
    : Object.keys(answers).length;
  const correctCount = studySet
    ? studySet.quiz.filter((question, index) => answers[index] === question.correctIndex).length
    : 0;
  const currentCard = studySet?.cards[cardIndex];
  const quizComplete = !isRetest && studySet && Object.keys(answers).length === studySet.quiz.length;

  function answerForVisibleQuestion(visibleIndex) {
    const originalIndex = isRetest ? wrongQuestions[visibleIndex]?.index : visibleIndex;
    return isRetest ? retestAnswers[originalIndex] : answers[originalIndex];
  }

  function chooseVisibleAnswer(visibleIndex, answerIndex) {
    const originalIndex = isRetest ? wrongQuestions[visibleIndex]?.index : visibleIndex;
    if (originalIndex !== undefined) selectAnswer(originalIndex, answerIndex);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Recall home" onClick={(event) => event.preventDefault()}>
          <span className="brand-mark">r</span>
          <span>recall<span className="brand-period">.</span></span>
        </a>
        <div className="topbar-note"><span className="status-dot" /> your personal study space</div>
        <a className="topbar-link" href="#how-it-works">How it works <span aria-hidden="true">↗</span></a>
      </header>

      <main>
        <section className="intro">
          <div className="eyebrow"><span className="eyebrow-star">✳</span> A LITTLE LESS CRAMMING, A LOT MORE KNOWING</div>
          <h1>Make knowledge<br /><span>stick.</span></h1>
          <p className="intro-copy">Drop in your notes, a topic, or that thing you keep forgetting.<br className="desktop-break" /> We’ll turn it into a study session made for you.</p>
        </section>

        <section className="workspace" aria-label="Create a study set">
          <form className="prompt-card" onSubmit={createStudySet}>
            <label htmlFor="study-notes">WHAT ARE WE LEARNING TODAY?</label>
            <textarea
              id="study-notes"
              maxLength={4000}
              placeholder="Paste your notes or describe a topic…&#10;&#10;The more you share, the more tailored your study set."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={loading}
            />
            <div className="prompt-footer">
              <span className="character-count">{notes.length.toLocaleString()} / 4,000</span>
              <button className="generate-button" type="submit" disabled={!notes.trim() || loading}>
                {loading ? <><span className="spinner" /> Making your set</> : <>Make my study set <span aria-hidden="true">↗</span></>}
              </button>
            </div>
          </form>

          <div className="suggestions">
            <span>NEED A STARTING POINT?</span>
            {ideas.map((idea) => (
              <button key={idea} type="button" onClick={() => setNotes(idea)} disabled={loading}>{idea}</button>
            ))}
          </div>

          {error && (
            <div className="error-banner" role="alert">
              <span className="error-icon">!</span>
              <div><strong>That didn’t quite work.</strong><p>{error}</p></div>
              <button type="button" onClick={createStudySet} disabled={loading || !notes.trim()}>Try again</button>
            </div>
          )}
        </section>

        {loading && (
          <section className="loading-panel" role="status" aria-live="polite">
            <div className="loading-orbit"><span>✳</span></div>
            <div><h2>Putting the pieces together</h2><p>Finding the ideas worth remembering…</p></div>
          </section>
        )}

        {!studySet && !loading && (
          <section className="empty-panel">
            <div className="empty-illustration" aria-hidden="true">
              <div className="orbit orbit-one" /><div className="orbit orbit-two" />
              <div className="mini-card mini-card-back" /><div className="mini-card mini-card-front"><span>✳</span><i /><i /><i /></div>
              <span className="sparkle sparkle-one">✦</span><span className="sparkle sparkle-two">✳</span>
            </div>
            <h2>Your next “oh, I get it” moment starts here.</h2>
            <p>Your flashcards and quiz will show up right here.<br className="desktop-break" /> No study set yet? Take a peek at a sample.</p>
            <button type="button" className="sample-button" onClick={loadSample}>Explore a sample set <span aria-hidden="true">→</span></button>
          </section>
        )}

        {studySet && (
          <section className="study-panel" aria-label="Your interactive study set">
            <div className="study-heading">
              <div>
                <div className="set-label"><span className="set-spark">✳</span> YOUR STUDY SET {isSample && <span className="sample-tag">SAMPLE</span>}</div>
                <h2>{studySet.title}</h2>
              </div>
              <button className="new-set-button" onClick={() => { controller.current?.abort(); requestId.current += 1; setLoading(false); setError(""); setStudySet(null); resetSession(); }} type="button">Start fresh <span aria-hidden="true">↗</span></button>
            </div>
            <div className="study-tabs" role="tablist" aria-label="Study modes">
              <button id="cards-tab" type="button" role="tab" aria-selected={activeTab === "cards"} aria-controls="cards-panel" onClick={() => setActiveTab("cards")}>
                <span className="tab-icon">▤</span> Flashcards <span className="tab-count">{studySet.cards.length}</span>
              </button>
              <button id="quiz-tab" type="button" role="tab" aria-selected={activeTab === "quiz"} aria-controls="quiz-panel" onClick={() => setActiveTab("quiz")}>
                <span className="tab-icon">◉</span> Quick quiz <span className="tab-count">{studySet.quiz.length}</span>
              </button>
            </div>

            {activeTab === "cards" ? (
              <div id="cards-panel" role="tabpanel" aria-labelledby="cards-tab" className="cards-panel">
                <div className="card-progress"><span>YOUR FLASHCARDS</span><span>{cardIndex + 1} <i>/</i> {studySet.cards.length}</span></div>
                <button className={`flashcard${flipped ? " is-flipped" : ""}`} type="button" onClick={() => setFlipped((value) => !value)} aria-label={flipped ? "Show question" : "Reveal answer"}>
                  <span className="flashcard-top"><span>{flipped ? "THE ANSWER" : "QUESTION"}</span><span className="flip-hint">{flipped ? "↻ flip back" : "↻ tap to flip"}</span></span>
                  <span className="flashcard-content">{flipped ? currentCard.answer : currentCard.question}</span>
                  <span className="flashcard-bottom"><span>✳</span><span>{flipped ? "Nice. Let it sink in." : "Take a guess before you flip."}</span></span>
                </button>
                <div className="card-controls">
                  <button type="button" aria-label="Previous card" disabled={cardIndex === 0} onClick={() => { setCardIndex((i) => i - 1); setFlipped(false); }}>←</button>
                  <div className="progress-dots" aria-label={`Card ${cardIndex + 1} of ${studySet.cards.length}`}>
                    {studySet.cards.map((_, index) => <button key={index} type="button" className={index === cardIndex ? "active" : ""} aria-label={`Go to card ${index + 1}`} onClick={() => { setCardIndex(index); setFlipped(false); }} />)}
                  </div>
                  <button type="button" aria-label="Next card" disabled={cardIndex === studySet.cards.length - 1} onClick={() => { setCardIndex((i) => i + 1); setFlipped(false); }}>→</button>
                </div>
              </div>
            ) : (
              <div id="quiz-panel" role="tabpanel" aria-labelledby="quiz-tab" className="quiz-panel">
                <div className="quiz-summary">
                  <span>{isRetest ? "A SECOND LOOK" : "QUICK KNOWLEDGE CHECK"}</span>
                  <span>{answeredCount} <i>/</i> {visibleQuiz.length} answered</span>
                </div>
                {visibleQuiz.length === 0 ? (
                  <div className="quiz-empty"><span>✳</span><h3>Nothing to retest. You got them all!</h3><button type="button" onClick={() => { setIsRetest(false); setAnswers({}); }}>Take the full quiz again →</button></div>
                ) : (
                  <>
                    {visibleQuiz.map((item, index) => {
                      const answer = answerForVisibleQuestion(index);
                      const originalIndex = isRetest ? wrongQuestions[index]?.index : index;
                      return (
                        <article className="quiz-question" key={`${originalIndex}-${isRetest ? "retest" : "full"}`}>
                          <div className="question-number">QUESTION {String(index + 1).padStart(2, "0")}</div>
                          <h3>{item.question}</h3>
                          <div className="answer-options">
                            {item.choices.map((choice, choiceIndex) => {
                              const selected = answer === choiceIndex;
                              const answered = answer !== undefined;
                              const isCorrect = choiceIndex === item.correctIndex;
                              const optionClass = answered && isCorrect ? " correct" : selected ? " incorrect" : "";
                              return (
                                <button key={choiceIndex} type="button" className={`answer-option${optionClass}`} disabled={answered} onClick={() => chooseVisibleAnswer(index, choiceIndex)}>
                                  <span className="option-letter">{String.fromCharCode(65 + choiceIndex)}</span><span>{choice}</span>
                                  {answered && isCorrect && <span className="answer-mark">✓</span>}
                                  {selected && !isCorrect && <span className="answer-mark">×</span>}
                                </button>
                              );
                            })}
                          </div>
                          {answer !== undefined && (
                            <p className={`answer-feedback${answer === item.correctIndex ? " is-correct" : ""}`}>
                              <strong>{answer === item.correctIndex ? "That’s right." : "Not quite."}</strong> {item.explanation}
                            </p>
                          )}
                        </article>
                      );
                    })}
                    {quizComplete && !isRetest && (
                      <div className="quiz-results" role="status">
                        <div><span className="result-score">{correctCount}<i>/{studySet.quiz.length}</i></span><span className="result-copy">correct answers<br />You’ve got this.</span></div>
                        {wrongQuestions.length > 0
                            ? <button type="button" onClick={() => { setRetestAnswers({}); setIsRetest(true); }}>Retry {wrongQuestions.length} missed {wrongQuestions.length === 1 ? "question" : "questions"} <span aria-hidden="true">→</span></button>
                            : <button type="button" onClick={() => { setAnswers({}); setRetestAnswers({}); }}>Take it again <span aria-hidden="true">↻</span></button>}
                      </div>
                    )}
                      {isRetest && Object.keys(retestAnswers).length >= wrongQuestions.length && (
                      <div className="quiz-results" role="status">
                        <div><span className="result-score">✳</span><span className="result-copy">Retest complete<br />Keep that momentum.</span></div>
                          <button type="button" onClick={() => { setIsRetest(false); setAnswers({}); setRetestAnswers({}); }}>Back to full quiz <span aria-hidden="true">→</span></button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </section>
        )}

        <section className="how-it-works" id="how-it-works">
          <div className="how-title"><span>STUDY, BUT MAKE IT STICK</span><h2>Small steps.<br />Stronger recall.</h2></div>
          <div className="how-step"><span>01</span><h3>Bring your material</h3><p>Your class notes, a tricky concept, a whole chapter. Start wherever you are.</p></div>
          <div className="how-step"><span>02</span><h3>Get a study set</h3><p>We turn your notes into clear flashcards and a quick, low-pressure quiz.</p></div>
          <div className="how-step"><span>03</span><h3>Practice what you missed</h3><p>Flip through, check your understanding, and give the tricky bits another go.</p></div>
        </section>
      </main>
      <footer className="footer"><a className="brand footer-brand" href="#" onClick={(event) => event.preventDefault()}><span className="brand-mark">r</span><span>recall<span className="brand-period">.</span></span></a><span>Made for curious minds, one card at a time.</span><span>Learn it. Remember it. <b>✳</b></span></footer>
    </div>
  );
}

export default App;
