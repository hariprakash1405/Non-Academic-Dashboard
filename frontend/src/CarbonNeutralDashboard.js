import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell, LineChart, Line, ComposedChart
} from 'recharts';
import './App.css'; // Assume some base styles

// Mock Data
const carbonTrendData = [
  { month: 'Jan', scope1: 120, scope2: 300, scope3: 150 },
  { month: 'Feb', scope1: 115, scope2: 290, scope3: 145 },
  { month: 'Mar', scope1: 110, scope2: 280, scope3: 140 },
  { month: 'Apr', scope1: 105, scope2: 275, scope3: 135 },
  { month: 'May', scope1: 100, scope2: 260, scope3: 130 },
  { month: 'Jun', scope1: 95, scope2: 250, scope3: 120 },
];

const emissionSourceData = [
  { name: 'Electricity', value: 45 },
  { name: 'Transport', value: 25 },
  { name: 'Waste', value: 15 },
  { name: 'DG Sets', value: 10 },
  { name: 'LPG / Cooking', value: 5 },
];

const energyData = [
  { month: 'Jan', grid: 800, solar: 200 },
  { month: 'Feb', grid: 750, solar: 220 },
  { month: 'Mar', grid: 700, solar: 280 },
  { month: 'Apr', grid: 650, solar: 300 },
  { month: 'May', grid: 600, solar: 350 },
  { month: 'Jun', grid: 550, solar: 400 },
];

const waterData = [
  { month: 'Jan', consumed: 5000, recycled: 1000 },
  { month: 'Feb', consumed: 4800, recycled: 1200 },
  { month: 'Mar', consumed: 4600, recycled: 1500 },
  { month: 'Apr', consumed: 4500, recycled: 1600 },
  { month: 'May', consumed: 4300, recycled: 1800 },
  { month: 'Jun', consumed: 4000, recycled: 2000 },
];

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const GAUGE_COLORS = ['#10b981', '#e2e8f0'];

const KPICard = ({ title, value, unit, trend, isPositive, icon }) => (
  <div className="cnc-kpi-card">
    <div className="cnc-kpi-header">
      <span className="cnc-kpi-title">{title}</span>
      <span className="cnc-kpi-icon">{icon}</span>
    </div>
    <div className="cnc-kpi-value-container">
      <span className="cnc-kpi-value">{value}</span>
      {unit && <span className="cnc-kpi-unit">{unit}</span>}
    </div>
    <div className={`cnc-kpi-trend ${isPositive ? 'positive' : 'negative'}`}>
      {isPositive ? '↓' : '↑'} {trend} vs last month
    </div>
  </div>
);

export default function CarbonNeutralDashboard() {
  const [activeTab, setActiveTab] = useState('Overview');

  const tabs = [
    'Overview', 'Energy & Renewables', 'Water Conservation', 
    'Waste Management', 'Green Transport', 'Tree Plantation'
  ];

  return (
    <div className="cnc-dashboard-container">
      <style>{`
        .cnc-dashboard-container {
          padding: 24px 32px;
          background: #0f172a; /* Slate 900 for dark mode */
          color: #f8fafc;
          min-height: 100vh;
          font-family: 'Inter', system-ui, sans-serif;
          overflow-y: auto;
        }
        .cnc-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .cnc-title {
          font-size: 2rem;
          font-weight: 800;
          background: linear-gradient(135deg, #38bdf8, #34d399);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
        }
        .cnc-subtitle {
          color: #94a3b8;
          font-size: 0.95rem;
          margin-top: 4px;
        }
        .cnc-tabs {
          display: flex;
          gap: 12px;
          margin-bottom: 32px;
          overflow-x: auto;
          padding-bottom: 8px;
        }
        .cnc-tab {
          padding: 10px 20px;
          border-radius: 20px;
          background: rgba(30, 41, 59, 0.7);
          color: #cbd5e1;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.05);
          transition: all 0.3s ease;
          white-space: nowrap;
        }
        .cnc-tab:hover {
          background: rgba(51, 65, 85, 0.9);
          color: #fff;
        }
        .cnc-tab.active {
          background: linear-gradient(135deg, #0ea5e9, #10b981);
          color: #fff;
          border-color: transparent;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }
        .cnc-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }
        .cnc-kpi-card {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 20px;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
          transition: transform 0.3s;
        }
        .cnc-kpi-card:hover {
          transform: translateY(-5px);
          border-color: rgba(56, 189, 248, 0.4);
        }
        .cnc-kpi-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .cnc-kpi-title {
          font-size: 0.9rem;
          color: #94a3b8;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .cnc-kpi-icon {
          font-size: 1.2rem;
          background: rgba(255,255,255,0.1);
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        }
        .cnc-kpi-value-container {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }
        .cnc-kpi-value {
          font-size: 2rem;
          font-weight: 700;
          color: #f8fafc;
        }
        .cnc-kpi-unit {
          font-size: 0.9rem;
          color: #cbd5e1;
          font-weight: 500;
        }
        .cnc-kpi-trend {
          margin-top: 12px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .cnc-kpi-trend.positive {
          color: #10b981;
        }
        .cnc-kpi-trend.negative {
          color: #ef4444;
        }
        .cnc-chart-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          margin-bottom: 32px;
        }
        @media (max-width: 1024px) {
          .cnc-chart-grid {
            grid-template-columns: 1fr;
          }
        }
        .cnc-chart-card {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
        }
        .cnc-chart-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #f8fafc;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .recharts-tooltip-wrapper {
          outline: none !important;
        }
        .cnc-custom-tooltip {
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 12px;
          border-radius: 8px;
          color: #fff;
        }
        .cnc-custom-tooltip .label {
          margin-bottom: 8px;
          font-weight: 600;
          color: #94a3b8;
        }
      `}</style>

      <div className="cnc-header">
        <div>
          <h1 className="cnc-title">Carbon Neutrality Hub</h1>
          <div className="cnc-subtitle">Monitor, analyze, and offset campus carbon footprint in real-time.</div>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Sustainability Score</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }}>92/100</div>
          </div>
          <div style={{ width: 60, height: 60 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={[{ value: 92 }, { value: 8 }]} innerRadius={20} outerRadius={28} dataKey="value" stroke="none">
                  <Cell fill="#34d399" />
                  <Cell fill="rgba(255,255,255,0.1)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="cnc-tabs">
        {tabs.map(tab => (
          <div 
            key={tab} 
            className={`cnc-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <>
          <div className="cnc-kpi-grid">
            <KPICard title="Total Emissions" value="480.5" unit="tCO₂e" trend="5.2%" isPositive={true} icon="🏭" />
            <KPICard title="Carbon Offset" value="125.0" unit="tCO₂e" trend="12.4%" isPositive={true} icon="🌳" />
            <KPICard title="Net Footprint" value="355.5" unit="tCO₂e" trend="6.1%" isPositive={true} icon="⚖️" />
            <KPICard title="Neutrality Progress" value="38" unit="%" trend="2.5%" isPositive={true} icon="🎯" />
          </div>

          <div className="cnc-kpi-grid">
            <KPICard title="Energy Usage" value="1.2" unit="MWh" trend="3.2%" isPositive={true} icon="⚡" />
            <KPICard title="Water Recycled" value="45" unit="%" trend="8.1%" isPositive={true} icon="💧" />
            <KPICard title="Waste Diverted" value="68" unit="%" trend="4.0%" isPositive={true} icon="♻️" />
            <KPICard title="EV Adoption" value="42" unit="%" trend="15.0%" isPositive={true} icon="🔋" />
          </div>

          <div className="cnc-chart-grid">
            <div className="cnc-chart-card">
              <div className="cnc-chart-title">
                <span style={{color: '#0ea5e9'}}>📉</span> Monthly Carbon Emission Trend (tCO₂e)
              </div>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={carbonTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScope1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorScope2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorScope3" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                    <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f8fafc' }} />
                    <Legend wrapperStyle={{ paddingTop: 20 }} />
                    <Area type="monotone" dataKey="scope1" name="Scope 1 (Direct)" stroke="#ef4444" fillOpacity={1} fill="url(#colorScope1)" />
                    <Area type="monotone" dataKey="scope2" name="Scope 2 (Indirect)" stroke="#f59e0b" fillOpacity={1} fill="url(#colorScope2)" />
                    <Area type="monotone" dataKey="scope3" name="Scope 3 (Supply Chain)" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorScope3)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="cnc-chart-card">
              <div className="cnc-chart-title">
                <span style={{color: '#10b981'}}>🍩</span> Carbon Emission Source Breakdown
              </div>
              <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={emissionSourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {emissionSourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f8fafc' }} formatter={(value) => `${value}%`} />
                    <Legend layout="vertical" verticalAlign="middle" align="right" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="cnc-chart-card">
              <div className="cnc-chart-title">
                <span style={{color: '#f59e0b'}}>⚡</span> Energy: Grid vs Renewable (kWh)
              </div>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={energyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                    <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f8fafc' }} />
                    <Legend wrapperStyle={{ paddingTop: 20 }} />
                    <Bar dataKey="grid" name="Grid Power" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="solar" name="Solar Power" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                    <Line type="monotone" dataKey="solar" name="Solar Trend" stroke="#fbbf24" strokeWidth={3} dot={{r: 4}} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="cnc-chart-card">
              <div className="cnc-chart-title">
                <span style={{color: '#0ea5e9'}}>💧</span> Water Consumption & Recycling (KL)
              </div>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={waterData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorConsumed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRecycled" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                    <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f8fafc' }} />
                    <Legend wrapperStyle={{ paddingTop: 20 }} />
                    <Area type="monotone" dataKey="consumed" name="Total Consumed" stroke="#3b82f6" fillOpacity={1} fill="url(#colorConsumed)" />
                    <Area type="monotone" dataKey="recycled" name="Recycled Water" stroke="#10b981" fillOpacity={1} fill="url(#colorRecycled)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab !== 'Overview' && (
        <div style={{ padding: '60px', textAlign: 'center', background: 'rgba(30, 41, 59, 0.7)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🚧</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#f8fafc', marginBottom: '10px' }}>{activeTab} Module</h2>
          <p style={{ color: '#94a3b8', maxWidth: '500px', margin: '0 auto' }}>Detailed analytics and management forms for {activeTab.toLowerCase()} are currently under development. Please check back later.</p>
        </div>
      )}
    </div>
  );
}
