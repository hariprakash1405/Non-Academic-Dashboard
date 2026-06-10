import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const dailyFlow = [
  { date: '2026-05-06', inlet: 420, treated: 405, energy: 1180 },
  { date: '2026-05-07', inlet: 435, treated: 418, energy: 1210 },
  { date: '2026-05-08', inlet: 428, treated: 412, energy: 1195 },
  { date: '2026-05-09', inlet: 440, treated: 425, energy: 1225 },
  { date: '2026-05-10', inlet: 432, treated: 419, energy: 1200 },
  { date: '2026-05-11', inlet: 438, treated: 422, energy: 1215 },
  { date: '2026-05-12', inlet: 430, treated: 416, energy: 1190 },
];

const waterQuality = [
  { param: 'BOD', before: 210, after: 18 },
  { param: 'COD', before: 380, after: 42 },
  { param: 'TSS', before: 165, after: 22 },
];

export default function STPDetail() {
  return (
    <div className="unit-detail-container">
      <h2>STP (Sewage Treatment Plant) Dashboard</h2>
      <p style={{ marginBottom: 20, color: '#555' }}>
        Sewage in vs treated out uses the same units (KLD) side by side. Energy is shown in a separate chart so
        you do not need two different Y-axes on one picture.
      </p>

      <div className="detail-kpi-row">
        <div className="detail-kpi-card">
          <div className="kpi-label">Design capacity</div>
          <div className="kpi-value">500 KLD</div>
          <div className="kpi-label">Rated KLD (one-time)</div>
        </div>
        <div className="detail-kpi-card">
          <div className="kpi-label">Treated water reuse</div>
          <div className="kpi-value">180 KLD</div>
          <div className="kpi-label">Gardening + flushing (wk)</div>
        </div>
        <div className="detail-kpi-card">
          <div className="kpi-label">CPCB / TNPCB</div>
          <div className="kpi-value">Compliant</div>
          <div className="kpi-label">Last insp. 2026-03-12</div>
        </div>
      </div>

      <div className="detail-chart-block">
        <h4>Daily sewage in vs treated water out (KLD)</h4>
        <p className="detail-visual-hint">
          <strong>How to read:</strong> for each day, brown = raw inlet, blue = treated output. Treated should
          usually be a little below inlet (losses/sludge).
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={dailyFlow}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip formatter={(v) => [`${v} KLD`, 'Flow']} />
            <Legend />
            <Bar dataKey="inlet" fill="#6d4c41" name="Inlet KLD" radius={[4, 4, 0, 0]} />
            <Bar dataKey="treated" fill="#1976d2" name="Treated KLD" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="detail-chart-block">
        <h4>Plant electricity use per day (kWh)</h4>
        <p className="detail-visual-hint">
          <strong>How to read:</strong> each bar is total kWh for that day — taller bar = more power used by pumps
          and blowers.
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={dailyFlow}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip formatter={(v) => [`${v} kWh`, 'Energy']} />
            <Legend />
            <Bar dataKey="energy" fill="#fbc02d" name="Energy (kWh)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="detail-chart-block">
        <h4>Water quality — before vs after treatment (mg/L)</h4>
        <p className="detail-visual-hint">
          <strong>How to read:</strong> for each test name, left bar = dirty water in, right bar = cleaned water
          out. Green should be much shorter than brown when treatment is working.
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={waterQuality}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="param" />
            <YAxis label={{ value: 'mg/L', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="before" fill="#8d6e63" name="Before" radius={[4, 4, 0, 0]} />
            <Bar dataKey="after" fill="#43a047" name="After" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h4>Maintenance log (event-based)</h4>
        <ul>
          <li>2026-04-28 — diffuser inspection &amp; cleaning</li>
          <li>2026-04-05 — pump bearing replacement (MCC-2)</li>
        </ul>
      </div>
    </div>
  );
}
