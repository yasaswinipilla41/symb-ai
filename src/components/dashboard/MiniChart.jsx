// Dependency-free SVG charts (bar + line) so analytics work offline and keep
// the bundle light. Colors come from CSS custom properties for theme support.

import React from 'react';

export function BarChart({ data, height = 180, unit = '' }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="chart bar-chart" style={{ height }}>
      {data.map((d) => (
        <div className="bar-col" key={d.label} title={`${d.label}: ${d.value}${unit}`}>
          <div className="bar-track">
            <div className="bar-fill" style={{ height: `${(d.value / max) * 100}%` }} />
          </div>
          <span className="bar-value">{d.value}{unit}</span>
          <span className="bar-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function LineChart({ data, height = 180 }) {
  const w = 480;
  const h = height;
  const pad = 24;
  const max = Math.max(1, ...data.map((d) => d.value));
  const stepX = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;
  const points = data.map((d, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (d.value / max) * (h - pad * 2);
    return [x, y];
  });
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${path} L ${pad + (data.length - 1) * stepX} ${h - pad} L ${pad} ${h - pad} Z`;

  return (
    <div className="chart line-chart">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" width="100%" height={h}>
        <path d={area} className="line-area" />
        <path d={path} className="line-stroke" fill="none" />
        {points.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" className="line-dot" />)}
      </svg>
      <div className="line-labels">
        {data.map((d) => <span key={d.label}>{d.label}</span>)}
      </div>
    </div>
  );
}
