import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ResponsiveContainer,
} from 'recharts';

const roDaily = [
  { date: '2026-05-01', output: 12000, tds: 80, rejection: 2.0, energy: 318 },
  { date: '2026-05-02', output: 11800, tds: 85, rejection: 2.5, energy: 322 },
  { date: '2026-05-03', output: 12100, tds: 78, rejection: 2.2, energy: 315 },
  { date: '2026-05-04', output: 11900, tds: 82, rejection: 2.1, energy: 320 },
  { date: '2026-05-05', output: 12050, tds: 80, rejection: 2.3, energy: 319 },
  { date: '2026-05-06', output: 11950, tds: 81, rejection: 2.2, energy: 321 },
  { date: '2026-05-07', output: 12080, tds: 79, rejection: 2.1, energy: 317 },
];

const recoveryWeekly = [
  { week: 'W1', recovery: 76 },
  { week: 'W2', recovery: 77 },
  { week: 'W3', recovery: 75 },
  { week: 'W4', recovery: 78 },
];

export default function ROPlantDetail() {
  return (
    <div className="unit-detail-container">
      <h2>RO Plant Dashboard</h2>
      <p style={{ marginBottom: 20, color: '#555' }}>
        Water output and quality in simple bar form. Taller bars usually mean more water produced or higher
        readings — each section explains what “good” looks like.
      </p>

      <div className="detail-kpi-row">
        <div className="detail-kpi-card">
          <div className="kpi-label">Design capacity</div>
          <div className="kpi-value">15,000 L/day</div>
          <div className="kpi-label">Rated output</div>
        </div>
        <div className="detail-kpi-card">
          <div className="kpi-label">Last membrane / filter</div>
          <div className="kpi-value">01 May 2026</div>
          <div className="kpi-label">Stage-2 swap</div>
        </div>
        <div className="detail-kpi-card">
          <div className="kpi-label">Permeate TDS target</div>
          <div className="kpi-value">≤ 100 mg/L</div>
          <div className="kpi-label">IS 10500 ref.</div>
        </div>
        <div className="detail-kpi-card">
          <div className="kpi-label">Energy (typical)</div>
          <div className="kpi-value">~320 kWh/day</div>
          <div className="kpi-label">HP pump + UV</div>
        </div>
      </div>

      <div className="detail-chart-block">
        <h4>Clean water produced each day (litres)</h4>
        <p className="detail-visual-hint">
          <strong>How to read:</strong> each bar is total litres produced that day. Compare heights across the week.
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={roDaily}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : `${v}`)} />
            <Tooltip formatter={(v) => [`${Number(v).toLocaleString()} L`, 'Output']} />
            <Legend />
            <Bar dataKey="output" fill="#1976d2" name="Output (L)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="detail-chart-block">
        <h4>Water purity (TDS) and reject water % — by day</h4>
        <p className="detail-visual-hint">
          <strong>How to read:</strong> two bars per day — green is TDS (lower is usually cleaner output), red is
          reject % (how much raw water is wasted in the process).
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={roDaily}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="tds" fill="#43a047" name="TDS (mg/L)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="rejection" fill="#c2185b" name="Rejection %" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="detail-chart-block">
        <h4>Electricity used by the RO plant each day (kWh)</h4>
        <p className="detail-visual-hint">
          <strong>How to read:</strong> taller bar = more units consumed that day (pumps, UV, etc.).
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={roDaily}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip formatter={(v) => [`${v} kWh`, 'Energy']} />
            <Legend />
            <Bar dataKey="energy" fill="#fb8c00" name="Energy (kWh)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="detail-chart-block">
        <h4>Recovery % by week (how efficiently water is recovered)</h4>
        <p className="detail-visual-hint">
          <strong>How to read:</strong> higher bar = more water recovered as product vs wasted that week.
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={recoveryWeekly}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="week" />
            <YAxis domain={[70, 80]} tickFormatter={(v) => `${v}%`} />
            <Tooltip formatter={(v) => [`${v}%`, 'Recovery']} />
            <Legend />
            <Bar dataKey="recovery" fill="#00897b" name="Recovery %" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h4>Key parameters</h4>
        <ul>
          <li>Monthly water quality report: on file; third-party sampling Q1–Q4.</li>
          <li>High-pressure pump vibration: within green band (BMS).</li>
          <li>UV dose verified weekly; lamp hours counter at 62% life.</li>
        </ul>
      </div>
    </div>
  );
}
