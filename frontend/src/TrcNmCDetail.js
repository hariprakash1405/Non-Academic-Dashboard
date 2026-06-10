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

const bandwidthDaily = [
  { date: '2026-05-06', subscribed: 500, actual: 412 },
  { date: '2026-05-07', subscribed: 500, actual: 428 },
  { date: '2026-05-08', subscribed: 500, actual: 395 },
  { date: '2026-05-09', subscribed: 500, actual: 441 },
  { date: '2026-05-10', subscribed: 500, actual: 418 },
  { date: '2026-05-11', subscribed: 500, actual: 433 },
  { date: '2026-05-12', subscribed: 500, actual: 425 },
];

const monthlyOps = [
  { month: 'Jan', uptime: 99.2, ticketsRaised: 28, ticketsResolved: 25, devices: 2850 },
  { month: 'Feb', uptime: 99.4, ticketsRaised: 22, ticketsResolved: 22, devices: 2910 },
  { month: 'Mar', uptime: 99.1, ticketsRaised: 31, ticketsResolved: 28, devices: 2980 },
  { month: 'Apr', uptime: 99.5, ticketsRaised: 19, ticketsResolved: 20, devices: 3040 },
  { month: 'May', uptime: 99.6, ticketsRaised: 16, ticketsResolved: 15, devices: 3100 },
];

const labUtilisation = [
  { date: '2026-05-06', sessions: 14, users: 186 },
  { date: '2026-05-07', sessions: 16, users: 210 },
  { date: '2026-05-08', sessions: 12, users: 165 },
  { date: '2026-05-09', sessions: 15, users: 198 },
  { date: '2026-05-10', sessions: 13, users: 172 },
  { date: '2026-05-11', sessions: 17, users: 224 },
  { date: '2026-05-12', sessions: 15, users: 205 },
];

export default function TrcNmCDetail() {
  return (
    <div className="unit-detail-container">
      <h2>TRC / NMC Dashboard</h2>
      <p style={{ marginBottom: 20, color: '#555' }}>
        Internet speed, uptime, devices, tickets, and lab use are all bar charts — compare “plan vs actual” or
        month to month by bar height.
      </p>

      <div className="detail-kpi-row">
        <div className="detail-kpi-card">
          <div className="kpi-label">TRC resources (inventory)</div>
          <div className="kpi-value">180 PCs</div>
          <div className="kpi-label">42 projectors, 18 labs</div>
        </div>
        <div className="detail-kpi-card">
          <div className="kpi-label">TRC technical staff</div>
          <div className="kpi-value">11</div>
          <div className="kpi-label">Monthly headcount</div>
        </div>
        <div className="detail-kpi-card">
          <div className="kpi-label">Licence renewals due</div>
          <div className="kpi-value">3</div>
          <div className="kpi-label">Next: 2026-06-30</div>
        </div>
      </div>

      <div className="detail-chart-block">
        <h4>Internet speed — subscribed vs actual (Mbps, each day)</h4>
        <p className="detail-visual-hint">
          <strong>How to read:</strong> grey = speed you pay for, blue = measured use. Blue near grey means you are
          getting close to full plan speed.
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={bandwidthDaily}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip formatter={(v) => [`${v} Mbps`, '']} />
            <Legend />
            <Bar dataKey="subscribed" fill="#90a4ae" name="Subscribed Mbps" radius={[4, 4, 0, 0]} />
            <Bar dataKey="actual" fill="#1976d2" name="Actual Mbps" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="detail-chart-block">
        <h4>Network uptime by month (%)</h4>
        <p className="detail-visual-hint">
          <strong>How to read:</strong> each bar is how often the network was up that month — higher is better
          (max 100%).
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyOps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" />
            <YAxis domain={[98, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip formatter={(v) => [`${v}%`, 'Uptime']} />
            <Legend />
            <Bar dataKey="uptime" fill="#43a047" name="Uptime %" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="detail-chart-block">
        <h4>Connected devices on campus network (by month)</h4>
        <p className="detail-visual-hint">
          <strong>How to read:</strong> each bar is approximate device count — more laptops/phones using Wi‑Fi.
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyOps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(v) => [`${v} devices`, 'Count']} />
            <Legend />
            <Bar dataKey="devices" fill="#8e24aa" name="Devices" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="detail-chart-block">
        <h4>IT tickets — raised vs resolved (by month)</h4>
        <p className="detail-visual-hint">
          <strong>How to read:</strong> red = new complaints, green = closed. Ideally green matches or beats red.
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyOps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="ticketsRaised" fill="#ef5350" name="Raised" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ticketsResolved" fill="#66bb6a" name="Resolved" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="detail-chart-block">
        <h4>Computer lab — sessions booked per day</h4>
        <p className="detail-visual-hint">
          <strong>How to read:</strong> each bar is how many lab sessions ran that day.
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={labUtilisation}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip formatter={(v) => [`${v} sessions`, 'Sessions']} />
            <Legend />
            <Bar dataKey="sessions" fill="#fb8c00" name="Sessions" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="detail-chart-block">
        <h4>Computer lab — unique users per day</h4>
        <p className="detail-visual-hint">
          <strong>How to read:</strong> each bar is how many different people used labs that day (headcount).
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={labUtilisation}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip formatter={(v) => [`${v} users`, 'Users']} />
            <Legend />
            <Bar dataKey="users" fill="#00897b" name="Users" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h4>Software licence expiry watchlist (event-based)</h4>
        <ul>
          <li>MATLAB campus licence — 2026-09-15</li>
          <li>Adobe CC lab pack — 2026-11-01</li>
          <li>Antivirus enterprise — 2026-06-30</li>
        </ul>
      </div>
    </div>
  );
}
