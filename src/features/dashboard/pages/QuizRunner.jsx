import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, CheckCircle2, XCircle, Send, ListChecks } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { getQuizForResource, gradeQuiz } from '../../../lib/quizStore';
import { quizAttempts, history } from '../../../lib/backend';
import { certificateId, PASS_PERCENT } from '../../../lib/certificates';
import QuizResult from './QuizResult';

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function QuizRunner() {
  const { resource } = useParams();
  const resourceName = decodeURIComponent(resource);
  const navigate = useNavigate();
  const { user } = useAuth();

  const quiz = useMemo(() => getQuizForResource(resourceName), [resourceName]);
  const [idx, setIdx] = useState(0);
  const [responses, setResponses] = useState({});
  const [revealed, setRevealed] = useState({}); // instant MCQ/TF validation
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const startRef = useRef(0);

  useEffect(() => {
    startRef.current = performance.now();
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (!quiz) {
    return (
      <div className="dash-page">
        <div className="coming-soon">
          <h2>Quiz not found</h2>
          <p>We couldn't find a quiz for “{resourceName}”.</p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard/quizzes')}>Back to quizzes</button>
        </div>
      </div>
    );
  }

  if (result) {
    return <QuizResult result={result} resourceName={resourceName} onRetake={() => window.location.reload()} />;
  }

  const q = quiz.questions[idx];
  const total = quiz.questions.length;
  const answeredCount = Object.keys(responses).filter((k) => responses[k] !== undefined && responses[k] !== '').length;

  const setAnswer = (value) => {
    setResponses((r) => ({ ...r, [q.id]: value }));
    if (q.type === 'mcq' || q.type === 'truefalse') {
      setRevealed((rv) => ({ ...rv, [q.id]: true })); // instant validation
    }
  };

  const isRevealed = revealed[q.id];
  const given = responses[q.id];
  // A question counts as answered before you can advance / submit.
  const currentAnswered = q.type === 'open'
    ? typeof given === 'string' && given.trim() !== ''
    : given !== undefined && given !== null;
  const allAnswered = quiz.questions.every((qq) => {
    const g = responses[qq.id];
    return qq.type === 'open' ? typeof g === 'string' && g.trim() !== '' : g !== undefined && g !== null;
  });

  const submit = async () => {
    setSaving(true);
    const timeTaken = Math.round((performance.now() - startRef.current) / 1000);
    const graded = gradeQuiz(quiz, responses, timeTaken);
    // Persist permanently
    if (user) {
      const { data, error } = await quizAttempts.insert({
        user_id: user.id,
        resource_name: graded.resource_name,
        score: graded.score,
        max_score: graded.max_score,
        percentage: graded.percentage,
        correct_count: graded.correct_count,
        wrong_count: graded.wrong_count,
        time_taken_s: graded.time_taken_s,
        status: 'completed',
        answers: graded.answers,
        cert_id: graded.percentage >= PASS_PERCENT ? certificateId(user.id, graded.resource_name) : null,
      });
      if (error) {
        alert('Failed to save quiz attempt: ' + (error.message || JSON.stringify(error)));
      }
      if (data) {
        graded.id = data.id;
        graded.user_id = user.id;
        graded.cert_id = data.cert_id || (graded.percentage >= PASS_PERCENT ? certificateId(user.id, graded.resource_name) : null);
        graded.cert_status = data.cert_status || 'none';
      }
      await history.log(user.id, 'quiz', `Completed quiz: ${resourceName}`, { percentage: graded.percentage });
    }
    setSaving(false);
    setResult(graded);
  };

  const isLast = idx === total - 1;

  return (
    <div className="dash-page">
      <div className="quiz-runner-head">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard/quizzes')}><ArrowLeft size={15} /> Exit</button>
        <div className="quiz-runner-title">
          <h2>{resourceName} — Assessment</h2>
          <span className="dash-muted">Question {idx + 1} of {total}</span>
        </div>
        <div className="quiz-timer"><Clock size={15} /> {formatTime(elapsed)}</div>
      </div>

      <div className="quiz-progress"><div className="quiz-progress-fill" style={{ width: `${((idx + 1) / total) * 100}%` }} /></div>

      <div className="quiz-question-card">
        <div className="quiz-qtype">{q.type === 'mcq' ? 'Multiple choice' : q.type === 'truefalse' ? 'True / False' : `Open-ended · ${q.marks} marks`}</div>
        <h3 className="quiz-prompt">{q.prompt}</h3>

        {q.type === 'open' ? (
          <>
            <textarea rows={6} className="quiz-open" placeholder="Type your answer… (saved automatically, reviewed by an admin)"
              value={given || ''} onChange={(e) => setResponses((r) => ({ ...r, [q.id]: e.target.value }))} />
            <p className="quiz-open-hint">Your answer is saved with this attempt for admin review.</p>
          </>
        ) : (
          <div className="quiz-options">
            {q.options.map((opt, i) => {
              const value = q.type === 'truefalse' ? (opt === 'True') : i;
              const selected = given === value;
              let cls = 'quiz-option';
              if (isRevealed) {
                const correctVal = q.type === 'truefalse' ? q.correct : q.correct;
                const isCorrectOpt = q.type === 'truefalse' ? (value === correctVal) : (i === correctVal);
                if (isCorrectOpt) cls += ' correct';
                else if (selected) cls += ' wrong';
              } else if (selected) {
                cls += ' selected';
              }
              return (
                <button key={i} className={cls} disabled={isRevealed} onClick={() => setAnswer(value)}>
                  <span className="quiz-option-mark">{String.fromCharCode(65 + i)}</span>
                  <span className="quiz-option-text">{opt}</span>
                  {isRevealed && (q.type === 'truefalse' ? value === q.correct : i === q.correct) && <CheckCircle2 size={17} className="quiz-opt-icon ok" />}
                  {isRevealed && selected && !(q.type === 'truefalse' ? value === q.correct : i === q.correct) && <XCircle size={17} className="quiz-opt-icon no" />}
                </button>
              );
            })}
          </div>
        )}

        {isRevealed && (q.type === 'mcq' || q.type === 'truefalse') && (
          <div className={`quiz-feedback ${(q.type === 'truefalse' ? given === q.correct : given === q.correct) ? 'ok' : 'no'}`}>
            {(q.type === 'truefalse' ? given === q.correct : given === q.correct) ? 'Correct!' : 'Not quite — the correct answer is highlighted.'}
          </div>
        )}
      </div>

      {!currentAnswered && (
        <p className="quiz-must-answer">Select an answer to continue — questions can't be skipped.</p>
      )}

      <div className="quiz-nav">
        <button className="btn btn-outline" disabled={idx === 0} onClick={() => setIdx((i) => i - 1)}><ArrowLeft size={15} /> Previous</button>
        <span className="quiz-answered"><ListChecks size={15} /> {answeredCount}/{total} answered</span>
        {isLast ? (
          <button className="btn btn-primary" onClick={submit} disabled={saving || !allAnswered} title={!allAnswered ? 'Answer every question before submitting' : undefined}><Send size={15} /> {saving ? 'Submitting…' : 'Submit quiz'}</button>
        ) : (
          <button className="btn btn-primary" disabled={!currentAnswered} onClick={() => setIdx((i) => i + 1)}>Next <ArrowRight size={15} /></button>
        )}
      </div>
    </div>
  );
}

export default QuizRunner;
