import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, CheckCircle2, XCircle, Send, ListChecks, Gauge } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { QUESTION_COUNT } from '../../../lib/adaptiveQuiz';
import { submitQuizAttempt } from '../../../lib/quizSubmit';
import QuizResult from './QuizResult';

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// `engine` is a started AdaptiveEngine; `first` is its first question (both from QuizRunner).
function AdaptiveQuizRunner({ resourceName, engine, first }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [current, setCurrent] = useState(first); // { prompt, options[4], correctIndex, explanation, difficulty }
  const [index, setIndex] = useState(0);         // 0-based position, 0..QUESTION_COUNT-1
  const [selected, setSelected] = useState(null); // chosen option index for the current question
  const [revealed, setRevealed] = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [interrupted, setInterrupted] = useState(false);

  const answersRef = useRef([]); // accumulates per-question records
  const correctRef = useRef(0);
  const startRef = useRef(0);
  const busyRef = useRef(false); // synchronous re-entry guard for advance()

  useEffect(() => {
    startRef.current = performance.now();
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (result) {
    return <QuizResult result={result} resourceName={resourceName} onRetake={() => window.location.reload()} />;
  }

  if (interrupted) {
    return (
      <div className="dash-page">
        <div className="coming-soon">
          <h2>Quiz interrupted</h2>
          <p>We couldn't generate the next question. Your attempt was not recorded — please retake the quiz.</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Retake quiz</button>
        </div>
      </div>
    );
  }

  const choose = (optIndex) => {
    if (revealed) return;
    setSelected(optIndex);
    setRevealed(true);
    const wasCorrect = optIndex === current.correctIndex;
    if (wasCorrect) correctRef.current += 1;
    answersRef.current.push({
      questionId: `${resourceName}-a${index}`,
      type: 'mcq',
      prompt: current.prompt,
      options: current.options,
      given: optIndex,
      correct: current.correctIndex,
      isCorrect: wasCorrect,
      difficulty: current.difficulty,
      explanation: current.explanation,
      marksPossible: 1,
      marksAwarded: wasCorrect ? 1 : 0,
    });
  };

  const finish = async () => {
    setSubmitting(true);
    const timeTaken = Math.round((performance.now() - startRef.current) / 1000);
    const correct = correctRef.current;
    const graded = {
      resource_name: resourceName,
      score: correct,
      max_score: QUESTION_COUNT,
      percentage: Math.round((correct / QUESTION_COUNT) * 100),
      correct_count: correct,
      wrong_count: QUESTION_COUNT - correct,
      time_taken_s: timeTaken,
      status: 'completed',
      open_pending: 0,
      total_max: QUESTION_COUNT,
      answers: answersRef.current,
    };
    await submitQuizAttempt(user, graded);
    setSubmitting(false);
    setResult(graded);
  };

  const advance = async () => {
    if (busyRef.current) return; // guard against double-clicks (state updates are async)
    busyRef.current = true;
    try {
      const isLast = index === QUESTION_COUNT - 1;
      if (isLast) { await finish(); return; }
      setLoadingNext(true);
      const wasCorrect = selected === current.correctIndex;
      const nextQ = await engine.next(wasCorrect);
      if (!nextQ) {
        // Mid-quiz generation failure: don't persist a partial/failing attempt —
        // let the student retake with a clean slate.
        setInterrupted(true);
        return;
      }
      setLoadingNext(false);
      setCurrent(nextQ);
      setIndex((i) => i + 1);
      setSelected(null);
      setRevealed(false);
    } finally {
      busyRef.current = false;
    }
  };

  const total = QUESTION_COUNT;

  return (
    <div className="dash-page">
      <div className="quiz-runner-head">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard/quizzes')}><ArrowLeft size={15} /> Exit</button>
        <div className="quiz-runner-title">
          <h2>{resourceName} — Assessment</h2>
          <span className="dash-muted">Question {index + 1} of {total}</span>
        </div>
        <div className="quiz-timer"><Clock size={15} /> {formatTime(elapsed)}</div>
      </div>

      <div className="quiz-progress"><div className="quiz-progress-fill" style={{ width: `${((index + 1) / total) * 100}%` }} /></div>

      <div className="quiz-question-card">
        <div className="quiz-qtype" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Gauge size={13} /> Level {current.difficulty} · Multiple choice
        </div>
        <h3 className="quiz-prompt">{current.prompt}</h3>

        <div className="quiz-options">
          {current.options.map((opt, i) => {
            const isSel = selected === i;
            let cls = 'quiz-option';
            if (revealed) {
              if (i === current.correctIndex) cls += ' correct';
              else if (isSel) cls += ' wrong';
            } else if (isSel) cls += ' selected';
            return (
              <button key={i} className={cls} disabled={revealed} onClick={() => choose(i)}>
                <span className="quiz-option-mark">{String.fromCharCode(65 + i)}</span>
                <span className="quiz-option-text">{opt}</span>
                {revealed && i === current.correctIndex && <CheckCircle2 size={17} className="quiz-opt-icon ok" />}
                {revealed && isSel && i !== current.correctIndex && <XCircle size={17} className="quiz-opt-icon no" />}
              </button>
            );
          })}
        </div>

        {revealed && (
          <div className={`quiz-feedback ${selected === current.correctIndex ? 'ok' : 'no'}`}>
            {selected === current.correctIndex ? 'Correct!' : 'Not quite — the correct answer is highlighted.'}
            {current.explanation ? ` ${current.explanation}` : ''}
          </div>
        )}
      </div>

      {!revealed && <p className="quiz-must-answer">Select an answer to continue — questions can't be skipped.</p>}

      <div className="quiz-nav">
        <span className="quiz-answered"><ListChecks size={15} /> {index + (revealed ? 1 : 0)}/{total} answered</span>
        {index === total - 1 ? (
          <button className="btn btn-primary" onClick={advance} disabled={!revealed || submitting}>
            <Send size={15} /> {submitting ? 'Submitting…' : 'Submit quiz'}
          </button>
        ) : (
          <button className="btn btn-primary" onClick={advance} disabled={!revealed || loadingNext || submitting}>
            {loadingNext ? 'Loading…' : 'Next'} <ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

export default AdaptiveQuizRunner;
