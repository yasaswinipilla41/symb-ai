import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  FileText, Presentation, Download, Printer, Trophy, ChevronLeft, ChevronRight,
  Target, Lightbulb, ListChecks, CheckCircle2, Workflow, Pencil, Save, RotateCcw,
} from 'lucide-react';
import {
  getMaterial, getMaterialDocOverride, saveMaterialDocOverride, clearMaterialDocOverride,
} from '../../../lib/materials';
import { downloadMaterialPDF, downloadMaterialPPTX } from '../../../lib/materialExport';
import { useAuth } from '../../../lib/AuthContext';
import { history, downloads as downloadsApi } from '../../../lib/backend';

function MaterialViewer() {
  const { resource } = useParams();
  const resourceName = decodeURIComponent(resource);
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminView = location.pathname.startsWith('/admin');
  const base = isAdminView ? '/admin' : '/dashboard';
  const { user, isAdmin } = useAuth();

  const material = useMemo(() => getMaterial(resourceName), [resourceName]);
  const [tab, setTab] = useState('pdf'); // 'pdf' | 'ppt'
  const [slide, setSlide] = useState(0);
  const [busy, setBusy] = useState('');

  // Admin document editing. `override` holds saved rich-text HTML (or null for
  // the generated original); `editing` toggles inline contentEditable.
  const [override, setOverride] = useState(() => getMaterialDocOverride(resourceName));
  const [editing, setEditing] = useState(false);
  const docRef = useRef(null);

  // Keep the override in sync when navigating between materials.
  useEffect(() => {
    setOverride(getMaterialDocOverride(resourceName));
    setEditing(false);
  }, [resourceName]);

  const saveDoc = () => {
    if (docRef.current) {
      const html = docRef.current.innerHTML;
      saveMaterialDocOverride(resourceName, html);
      setOverride(html);
    }
    setEditing(false);
  };

  const resetDoc = () => {
    if (!window.confirm('Discard your edits and restore the original document?')) return;
    clearMaterialDocOverride(resourceName);
    setOverride(null);
    setEditing(false);
  };

  useEffect(() => {
    if (material && user) history.log(user.id, 'view', `Studied material: ${resourceName}`, { kind: 'material' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceName]);

  if (!material) {
    return (
      <div className="dash-page">
        <div className="coming-soon">
          <h2>Material not found</h2>
          <p>We couldn't find a learning material for “{resourceName}”.</p>
          <button className="btn btn-primary" onClick={() => navigate(`${base}/materials`)}>Back to materials</button>
        </div>
      </div>
    );
  }

  const onDownload = async (kind) => {
    setBusy(kind);
    try {
      if (kind === 'pdf') await downloadMaterialPDF(material);
      else await downloadMaterialPPTX(material);
      if (user) await downloadsApi.insert({ user_id: user.id, resource_name: resourceName, kind });
    } catch (e) {
      window.alert('Sorry, the download could not be generated.');
    } finally {
      setBusy('');
    }
  };

  const slides = material.slides;

  return (
    <div className="dash-page material-viewer">
      <div className="material-head">
        <div>
          <span className="material-eyebrow">{material.categoryLabel} · Learning Material</span>
          <h2 className="dash-h2">{resourceName}</h2>
        </div>
        <div className="material-actions">
          <div className="material-tabs no-print">
            <button className={`material-tab ${tab === 'pdf' ? 'active' : ''}`} onClick={() => setTab('pdf')}><FileText size={15} /> Document</button>
            <button className={`material-tab ${tab === 'ppt' ? 'active' : ''}`} onClick={() => setTab('ppt')}><Presentation size={15} /> Slides</button>
          </div>
          <button className="btn btn-outline btn-sm no-print" disabled={busy === 'pdf'} onClick={() => onDownload('pdf')}>
            <Download size={15} /> {busy === 'pdf' ? 'Preparing…' : 'PDF'}
          </button>
          <button className="btn btn-outline btn-sm no-print" disabled={busy === 'ppt'} onClick={() => onDownload('ppt')}>
            <Download size={15} /> {busy === 'ppt' ? 'Preparing…' : 'PPT'}
          </button>
          <button className="btn btn-ghost btn-sm no-print" onClick={() => window.print()}><Printer size={15} /> Print</button>
          {isAdmin && tab === 'pdf' && (
            editing ? (
              <>
                <button className="btn btn-primary btn-sm no-print" onClick={saveDoc}><Save size={15} /> Save</button>
                <button className="btn btn-ghost btn-sm no-print" onClick={() => setEditing(false)}>Cancel</button>
              </>
            ) : (
              <>
                <button className="btn btn-outline btn-sm no-print" onClick={() => setEditing(true)}><Pencil size={15} /> Edit</button>
                {override && (
                  <button className="btn btn-ghost btn-sm no-print" onClick={resetDoc} title="Restore original"><RotateCcw size={15} /> Reset</button>
                )}
              </>
            )
          )}
          {!isAdminView && (
            <button className="btn btn-primary btn-sm no-print" onClick={() => navigate(`${base}/quizzes/${encodeURIComponent(resourceName)}`)}>
              <Trophy size={15} /> Take quiz
            </button>
          )}
        </div>
      </div>

      {tab === 'pdf' ? (
        override ? (
          <article
            className={`doc-sheet ${editing ? 'doc-editing' : ''}`}
            id="printable-material"
            ref={docRef}
            contentEditable={editing}
            suppressContentEditableWarning
            dangerouslySetInnerHTML={{ __html: override }}
          />
        ) : (
        <article
          className={`doc-sheet ${editing ? 'doc-editing' : ''}`}
          id="printable-material"
          ref={docRef}
          contentEditable={editing}
          suppressContentEditableWarning
        >
          <header className="doc-header">
            <span className="doc-brand">Symbiosis Technology · AI Learning Platform</span>
            <h1>{resourceName}</h1>
            <p className="doc-sub">{material.categoryLabel} · Intermediate Learning Material</p>
          </header>

          <section className="doc-section">
            <h3><Lightbulb size={16} /> Introduction</h3>
            <p>{material.intro}</p>
          </section>

          <section className="doc-section">
            <h3><Target size={16} /> Learning Objectives</h3>
            <ul className="doc-list">{material.objectives.map((o, i) => <li key={i}>{o}</li>)}</ul>
          </section>

          <section className="doc-section">
            <h3><ListChecks size={16} /> Concepts &amp; Detailed Explanations</h3>
            {material.concepts.map((c, i) => (
              <div className="doc-concept" key={i}>
                <h4>{c.title}</h4>
                <p>{c.body}</p>
              </div>
            ))}
          </section>

          <section className="doc-section">
            <h3><Lightbulb size={16} /> Practical Examples</h3>
            {material.examples.map((e, i) => (
              <div className="doc-concept" key={i}>
                <h4>{e.title}</h4>
                <p>{e.body}</p>
              </div>
            ))}
          </section>

          {material.diagram && (
            <section className="doc-section">
              <h3><Workflow size={16} /> {material.diagram.title}</h3>
              <div className="doc-flow">
                {material.diagram.steps.map((s, i) => (
                  <React.Fragment key={i}>
                    <span className="doc-flow-step">{s}</span>
                    {i < material.diagram.steps.length - 1 && <span className="doc-flow-arrow">→</span>}
                  </React.Fragment>
                ))}
              </div>
            </section>
          )}

          <section className="doc-section">
            <h3><CheckCircle2 size={16} /> Best Practices</h3>
            <ul className="doc-list">{material.bestPractices.map((b, i) => <li key={i}>{b}</li>)}</ul>
          </section>

          <section className="doc-section">
            <h3><Target size={16} /> Key Takeaways</h3>
            <ul className="doc-list">{material.keyTakeaways.map((k, i) => <li key={i}>{k}</li>)}</ul>
          </section>

          <section className="doc-section">
            <h3><ListChecks size={16} /> Summary</h3>
            <p>{material.summary}</p>
          </section>

          <footer className="doc-footer">Successfully studied — Certified by Symbiosis Technology</footer>
        </article>
        )
      ) : (
        <div className="slides-viewer no-print">
          <div className="slide-stage">
            <div className="slide-canvas">
              {slide === 0 ? (
                <div className="slide-title-layout">
                  <h1>{slides[0].title}</h1>
                  {slides[0].bullets.map((b, i) => <p key={i} className={i === 0 ? 'slide-kicker' : ''}>{b}</p>)}
                </div>
              ) : (
                <>
                  <h2 className="slide-heading">{slides[slide].title}</h2>
                  <ul className="slide-bullets">
                    {slides[slide].bullets.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </>
              )}
              <span className="slide-foot">Symbiosis Technology · AI Learning Platform</span>
            </div>
          </div>
          <div className="slide-controls">
            <button className="btn btn-outline btn-sm" disabled={slide === 0} onClick={() => setSlide((s) => s - 1)}><ChevronLeft size={16} /> Prev</button>
            <span className="slide-count">Slide {slide + 1} of {slides.length}</span>
            <button className="btn btn-outline btn-sm" disabled={slide === slides.length - 1} onClick={() => setSlide((s) => s + 1)}>Next <ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MaterialViewer;
