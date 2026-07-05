import React from 'react';
import { Link } from 'react-router-dom';
import { Rocket, ArrowRight } from 'lucide-react';

// Placeholder for modules landing in the next build phase (quizzes, editable
// learning materials, full resource browser). Keeps navigation complete and
// communicates what's coming without dead links.
function ComingSoon({ title, note, cta }) {
  return (
    <div className="dash-page">
      <div className="coming-soon">
        <div className="coming-soon-icon"><Rocket size={30} /></div>
        <h2>{title}</h2>
        <p>{note}</p>
        {cta && <Link to={cta} className="btn btn-primary">Go to resources <ArrowRight size={16} /></Link>}
        <span className="coming-badge">Next phase</span>
      </div>
    </div>
  );
}

export default ComingSoon;
