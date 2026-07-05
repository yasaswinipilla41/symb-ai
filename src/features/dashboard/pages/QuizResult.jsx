import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, ListChecks, Percent, RotateCcw, Award, ArrowLeft, HelpCircle } from 'lucide-react';
import { PASS_PERCENT } from '../../../lib/quizStore';
import { quizAttempts } from '../../../lib/backend';
import { certificateId } from '../../../lib/certificates';

function QuizResult({ result: initialResult, resourceName, onRetake }) {
  const navigate = useNavigate();
  const [result, setResult] = useState(initialResult);
  const [requesting, setRequesting] = useState(false);
  const passed = result.percentage >= PASS_PERCENT;
  const totalQuestions = result.answers?.length || 0;

  const handleRequestCert = async () => {
    setRequesting(true);
    const certId = result.cert_id || certificateId(result.user_id, resourceName);
    const { error } = await quizAttempts.update(result.id, { cert_status: 'pending', cert_id: certId });
    if (error) {
      console.error(error);
      alert(`Failed to request certificate. Error: ${error.message || JSON.stringify(error)}`);
    } else {
      setResult({ ...result, cert_status: 'pending', cert_id: certId });
    }
    setRequesting(false);
  };

  return (
    <div className="dash-page">
      <div className={`result-hero ${passed ? 'pass' : 'fail'}`}>
        <div className="result-ring" style={{ '--pct': result.percentage }}>
          <span>{result.percentage}%</span>
        </div>
        <div>
          <h2>{passed ? '🎉 Congratulations, you passed!' : 'Not quite — keep practicing'}</h2>
          <p>You completed the <strong>{resourceName}</strong> assessment.</p>
          <span className={`result-status ${passed ? 'ok' : 'no'}`}>
            {passed ? `Passed · ${PASS_PERCENT}% required` : `Failed · ${PASS_PERCENT}% required to pass`}
          </span>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card tone-blue"><div className="stat-icon"><HelpCircle size={20} /></div><div className="stat-body"><span className="stat-value">{totalQuestions}</span><span className="stat-label">Total questions</span></div></div>
        <div className="stat-card tone-green"><div className="stat-icon"><CheckCircle2 size={20} /></div><div className="stat-body"><span className="stat-value">{result.correct_count}</span><span className="stat-label">Correct answers</span></div></div>
        <div className="stat-card tone-amber"><div className="stat-icon"><XCircle size={20} /></div><div className="stat-body"><span className="stat-value">{result.wrong_count}</span><span className="stat-label">Incorrect answers</span></div></div>
        <div className="stat-card tone-violet"><div className="stat-icon"><Percent size={20} /></div><div className="stat-body"><span className="stat-value">{result.percentage}%</span><span className="stat-label">Score</span></div></div>
      </div>

      <div className={`result-verdict ${passed ? 'pass' : 'fail'}`}>
        {passed ? (
          <>
            <Award size={22} />
            <div>
              <strong>Course completed!</strong>
              <span>You've earned your Course Completion Certificate for {resourceName}.</span>
            </div>
            {result.cert_status === 'approved' ? (
              <button className="btn btn-primary" onClick={() => navigate(`/dashboard/certificate/${encodeURIComponent(resourceName)}`)}>
                <Award size={16} /> View certificate
              </button>
            ) : result.cert_status === 'pending' ? (
              <span className="dash-muted">Certificate request pending approval...</span>
            ) : (
              <button className="btn btn-primary" disabled={requesting} onClick={handleRequestCert}>
                <Award size={16} /> {requesting ? 'Requesting...' : 'Request Certificate Download'}
              </button>
            )}
          </>
        ) : (
          <>
            <XCircle size={22} />
            <div>
              <strong>Score below {PASS_PERCENT}%</strong>
              <span>Review the learning material and retake the quiz to earn your certificate.</span>
            </div>
            <button className="btn btn-outline" onClick={() => navigate(`/dashboard/materials/${encodeURIComponent(resourceName)}`)}>
              Study material
            </button>
          </>
        )}
      </div>

      <div className="result-actions">
        <button className="btn btn-primary" onClick={onRetake}><RotateCcw size={16} /> Retake quiz</button>
        <button className="btn btn-outline" onClick={() => navigate('/dashboard/quizzes')}><ListChecks size={16} /> All quizzes</button>
        <button className="btn btn-ghost" onClick={() => navigate('/dashboard/results')}>View my results</button>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
      </div>
    </div>
  );
}

export default QuizResult;
