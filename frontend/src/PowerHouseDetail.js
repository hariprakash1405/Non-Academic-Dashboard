import React, { useMemo } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

const dailyPower = [
  { date: '2026-05-01', consumption: 820, pf: 0.97, peakMw: 1.62, dgFuel: 118, solarGen: 320 },
  { date: '2026-05-02', consumption: 830, pf: 0.98, peakMw: 1.65, dgFuel: 122, solarGen: 310 },
  { date: '2026-05-03', consumption: 810, pf: 0.96, peakMw: 1.58, dgFuel: 115, solarGen: 280 },
  { date: '2026-05-04', consumption: 840, pf: 0.99, peakMw: 1.68, dgFuel: 124, solarGen: 340 },
  { date: '2026-05-05', consumption: 845, pf: 0.98, peakMw: 1.7, dgFuel: 120, solarGen: 330 },
  { date: '2026-05-06', consumption: 832, pf: 0.97, peakMw: 1.64, dgFuel: 119, solarGen: 315 },
  { date: '2026-05-07', consumption: 838, pf: 0.98, peakMw: 1.66, dgFuel: 121, solarGen: 325 },
];

const monthWiseData = [
  { month: 'Jan', solar: 8200, dg: 450, eb: 12000 },
  { month: 'Feb', solar: 8500, dg: 400, eb: 11500 },
  { month: 'Mar', solar: 9200, dg: 380, eb: 13000 },
  { month: 'Apr', solar: 10500, dg: 300, eb: 14500 },
  { month: 'May', solar: 9800, dg: 350, eb: 12800 },
];

const majorEquipment = [
  { id: 1, name: 'Main Transformer', type: 'Transformer', spec: '2.5 MVA, 11kV/433V', status: 'Healthy', isActive: true, health: 98 },
  { id: 2, name: 'Solar Inverter A1', type: 'Inverter', spec: '60 kW String', status: 'Active', isActive: true, health: 96 },
  { id: 3, name: 'Solar Inverter A2', type: 'Inverter', spec: '60 kW String', status: 'Active', isActive: true, health: 97 },
  { id: 4, name: 'Solar Inverter A3', type: 'Inverter', spec: '60 kW String', status: 'Under Maintenance', isActive: false, health: 45 },
  { id: 5, name: 'DG Set 01', type: 'Generator', spec: '500 kVA, Cummins', status: 'Standby', isActive: true, health: 92 },
  { id: 6, name: 'DG Set 02', type: 'Generator', spec: '500 kVA, Cummins', status: 'Healthy', isActive: true, health: 94 },
  { id: 7, name: 'APFC Panel', type: 'Panel', spec: '800 kVAR, Automatic', status: 'Healthy', isActive: true, health: 95 },
  { id: 8, name: 'LT Main Panel', type: 'Panel', spec: '2500A, ACB', status: 'Healthy', isActive: true, health: 99 },
];

const hourlyEB = [
  { hour: '00:00', consumption: 42, voltage: 418, current: 85 },
  { hour: '02:00', consumption: 38, voltage: 420, current: 78 },
  { hour: '04:00', consumption: 35, voltage: 422, current: 72 },
  { hour: '06:00', consumption: 45, voltage: 418, current: 92 },
  { hour: '08:00', consumption: 85, voltage: 415, current: 165 },
  { hour: '10:00', consumption: 110, voltage: 412, current: 210 },
  { hour: '12:00', consumption: 130, voltage: 410, current: 245 },
  { hour: '14:00', consumption: 125, voltage: 412, current: 235 },
  { hour: '16:00', consumption: 115, voltage: 415, current: 215 },
  { hour: '18:00', consumption: 140, voltage: 412, current: 265 },
  { hour: '20:00', consumption: 155, voltage: 410, current: 295 },
  { hour: '22:00', consumption: 95, voltage: 415, current: 185 },
];

const hourlyDG = [
  { hour: '09:00', generation: 0, consumption: 0, fuel: 0 },
  { hour: '10:00', generation: 45, consumption: 42, fuel: 14 },
  { hour: '11:00', generation: 48, consumption: 45, fuel: 15 },
  { hour: '12:00', generation: 52, consumption: 48, fuel: 16 },
  { hour: '13:00', generation: 0, consumption: 0, fuel: 0 },
];

const hourlySolar = [
  { hour: '06:00', generation: 5, consumption: 22, voltage: 415, current: 8 },
  { hour: '07:00', generation: 18, consumption: 25, voltage: 418, current: 24 },
  { hour: '08:00', generation: 35, consumption: 28, voltage: 420, current: 48 },
  { hour: '09:00', generation: 65, consumption: 32, voltage: 422, current: 85 },
  { hour: '10:00', generation: 110, consumption: 35, voltage: 420, current: 145 },
  { hour: '11:00', generation: 165, consumption: 40, voltage: 418, current: 220 },
  { hour: '12:00', generation: 195, consumption: 45, voltage: 415, current: 265 },
  { hour: '13:00', generation: 210, consumption: 48, voltage: 412, current: 285 },
  { hour: '14:00', generation: 185, consumption: 46, voltage: 415, current: 250 },
  { hour: '15:00', generation: 140, consumption: 42, voltage: 418, current: 190 },
  { hour: '16:00', generation: 90, consumption: 40, voltage: 420, current: 120 },
  { hour: '17:00', generation: 45, consumption: 38, voltage: 422, current: 60 },
  { hour: '18:00', generation: 12, consumption: 45, voltage: 420, current: 15 },
];

const combinedHourly = [
  { hour: '00:00', solar: 0, eb: 42, dg: 0, total: 42 },
  { hour: '02:00', solar: 0, eb: 38, dg: 0, total: 38 },
  { hour: '04:00', solar: 0, eb: 35, dg: 0, total: 35 },
  { hour: '06:00', solar: 5, eb: 45, dg: 0, total: 50 },
  { hour: '08:00', solar: 35, eb: 85, dg: 0, total: 120 },
  { hour: '10:00', solar: 110, eb: 110, dg: 45, total: 265 },
  { hour: '12:00', solar: 195, eb: 130, dg: 52, total: 377 },
  { hour: '14:00', solar: 185, eb: 125, dg: 0, total: 310 },
  { hour: '16:00', solar: 90, eb: 115, dg: 0, total: 205 },
  { hour: '18:00', solar: 12, eb: 140, dg: 0, total: 152 },
  { hour: '20:00', solar: 0, eb: 155, dg: 0, total: 155 },
  { hour: '22:00', solar: 0, eb: 95, dg: 0, total: 95 },
];

const powerhouseStaff = [
  { id: 1, name: 'Suresh Kumar', role: 'Chief Operator', sector: 'EB', portion: 'HT Control Room', attendance: 'Present', contact: '+91 98765 43210' },
  { id: 2, name: 'Ramesh Singh', role: 'Solar Technician', sector: 'Solar', portion: 'Inverter Station A', attendance: 'Present', contact: '+91 98765 43211' },
  { id: 3, name: 'Anitha Raj', role: 'Electrical Engineer', sector: 'Solar', portion: 'Panel Yard 01', attendance: 'Absent', contact: '+91 98765 43212' },
  { id: 4, name: 'Vikram Mani', role: 'DG Operator', sector: 'DG', portion: 'Generator Yard', attendance: 'Present', contact: '+91 98765 43213' },
  { id: 5, name: 'Priya Dharshini', role: 'Asst. Operator', sector: 'EB', portion: 'LT Panel Room', attendance: 'Present', contact: '+91 98765 43214' },
];

export default function PowerHouseDetail() {
  const [activeTab, setActiveTab] = React.useState('main');
  const [timeRange, setTimeRange] = React.useState('day');

  const powerBars = useMemo(
    () => dailyPower.map((d) => ({ ...d, pfPercent: Math.round(d.pf * 100) })),
    []
  );

  const renderFinancials = (type) => {
    const data = {
      solar: { daily: '₹0 (Free)', monthly: '₹4.2L Savings', color: '#16a34a' },
      dg: { daily: '₹8,200', monthly: '₹1.1L', color: '#ea580c' },
      eb: { daily: '₹4,500', monthly: '₹1.35L', color: '#2563eb' }
    };
    const current = data[type];
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
        <div style={{ background: '#fff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Daily Cost</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: current.color }}>{current.daily}</div>
        </div>
        <div style={{ background: '#fff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Monthly Bill (Est.)</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: current.color }}>{current.monthly}</div>
        </div>
      </div>
    );
  };

  const renderComparisonChart = () => {
    const data = timeRange === 'month' ? monthWiseData : dailyPower;
    const xKey = timeRange === 'month' ? 'month' : 'date';
    const dataKey = activeTab === 'solar' ? (timeRange === 'month' ? 'solar' : 'solarGen') : (activeTab === 'dg' ? (timeRange === 'month' ? 'dg' : 'dgFuel') : (timeRange === 'month' ? 'eb' : 'consumption'));
    
    return (
      <div className="detail-chart-block">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h4 style={{ margin: 0 }}>{timeRange === 'month' ? 'Month-wise' : 'Day-wise'} Trend Analysis</h4>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '2px', borderRadius: '8px' }}>
            {['day', 'month'].map(r => (
              <button 
                key={r} 
                onClick={() => setTimeRange(r)}
                style={{ padding: '4px 12px', border: 'none', background: timeRange === r ? '#fff' : 'transparent', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase' }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={dataKey} stroke="#1976d2" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Consumption/Gen" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderHourlyLog = (sourceType) => {
    const data = sourceType === 'solar' ? hourlySolar : (sourceType === 'eb' ? hourlyEB : hourlyDG);
    return (
      <div style={{ marginTop: 24 }}>
        <h4 style={{ marginBottom: 16 }}>Detailed Hourly Log ({sourceType.toUpperCase()})</h4>
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Hour</th>
                {sourceType !== 'eb' && <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Generation (kWh)</th>}
                <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Consumption (kWh)</th>
                {sourceType === 'dg' && <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Fuel Use (L)</th>}
                {sourceType !== 'dg' && <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Voltage (V)</th>}
                {sourceType !== 'dg' && <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Current (A)</th>}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#475569' }}>{row.hour}</td>
                  {sourceType !== 'eb' && <td style={{ padding: '10px 12px', color: '#16a34a', fontWeight: 600 }}>{row.generation}</td>}
                  <td style={{ padding: '10px 12px', color: '#1e293b' }}>{row.consumption}</td>
                  {sourceType === 'dg' && <td style={{ padding: '10px 12px', color: '#ea580c' }}>{row.fuel}</td>}
                  {sourceType !== 'dg' && <td style={{ padding: '10px 12px', color: '#64748b' }}>{row.voltage}</td>}
                  {sourceType !== 'dg' && <td style={{ padding: '10px 12px', color: '#64748b' }}>{row.current}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderMajorEquipment = (typeFilter) => {
    const filteredEquipment = typeFilter 
      ? majorEquipment.filter(e => typeFilter.includes(e.type))
      : majorEquipment;

    const categories = [...new Set(filteredEquipment.map(e => e.type))];
    
    return (
      <div style={{ marginTop: 32 }}>
        <h4 style={{ marginBottom: 16 }}>Major Equipment Inventory</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {categories.map(cat => {
            const items = filteredEquipment.filter(e => e.type === cat);
            const activeCount = items.filter(e => e.isActive).length;
            const inactiveCount = items.length - activeCount;
            return (
              <div key={cat} style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginBottom: 8 }}>{cat}s</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>{items.length}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total</div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>● {activeCount} Active</div>
                  {inactiveCount > 0 && <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>● {inactiveCount} Inactive</div>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="responsive-grid">
          {filteredEquipment.map(eq => (
            <div key={eq.id} style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 700, color: '#1e293b' }}>{eq.name}</span>
                <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: eq.isActive ? '#dcfce7' : '#fee2e2', color: eq.isActive ? '#166534' : '#991b1b' }}>
                  {eq.status}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{eq.spec}</div>
              <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: 4 }}>
                  <span style={{ color: '#64748b' }}>Health Score</span>
                  <span style={{ fontWeight: 700, color: '#1e293b' }}>{eq.health}%</span>
                </div>
                <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${eq.health}%`, background: eq.health > 90 ? '#22c55e' : (eq.health > 60 ? '#eab308' : '#ef4444') }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEB = () => (
    <>
      <div className="detail-kpi-row">
        <div className="detail-kpi-card">
          <div className="kpi-label">Main Grid Capacity</div>
          <div className="kpi-value">2000 kVA</div>
          <div className="kpi-label">Supply: 11kV HT</div>
        </div>
        <div className="detail-kpi-card">
          <div className="kpi-label">Today's Consumption</div>
          <div className="kpi-value">838 Units</div>
          <div className="kpi-label">Estimated: ₹4,500</div>
        </div>
      </div>
      {renderFinancials('eb')}
      <div className="detail-chart-block">
        <h4>Hourly Grid Consumption</h4>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={hourlyEB}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="consumption" fill="#2563eb" name="Grid Load (kWh)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {renderComparisonChart()}
      {renderHourlyLog('eb')}
      {renderMajorEquipment(['Transformer', 'Panel'])}
    </>
  );

  const renderDG = () => (
    <>
      <div className="detail-kpi-row">
        <div className="detail-kpi-card">
          <div className="kpi-label">Diesel Inventory</div>
          <div className="kpi-value">1,250 L</div>
          <div className="kpi-label">Full Tank: 2,000 L</div>
        </div>
        <div className="detail-kpi-card">
          <div className="kpi-label">Today's Fuel Use</div>
          <div className="kpi-value">121 L</div>
          <div className="kpi-label">Cost: ₹8,200</div>
        </div>
      </div>
      {renderFinancials('dg')}
      <div className="detail-chart-block">
        <h4>Hourly DG Generation vs Consumption</h4>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={hourlyDG}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="generation" fill="#ea580c" name="DG Gen (kWh)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="consumption" fill="#475569" name="Campus Load (kWh)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {renderComparisonChart()}
      {renderHourlyLog('dg')}
      {renderMajorEquipment(['Generator'])}
    </>
  );

  const renderSolar = () => {
    const isMonth = timeRange === 'month';
    const chartData = isMonth ? monthWiseData : dailyPower;
    const xKey = isMonth ? 'month' : 'date';

    return (
      <>
        <div className="detail-kpi-row">
          <div className="detail-kpi-card" style={{ borderLeft: '4px solid #eab308' }}>
            <div className="kpi-label">Solar Panel Units</div>
            <div className="kpi-value">450 Units</div>
            <div className="kpi-label">Installed Base</div>
          </div>
          <div className="detail-kpi-card" style={{ borderLeft: '4px solid #16a34a' }}>
            <div className="kpi-label">Total Yield Today</div>
            <div className="kpi-value">325 Units</div>
            <div className="kpi-label">Energy Generated</div>
          </div>
          <div className="detail-kpi-card" style={{ borderLeft: '4px solid #3b82f6' }}>
            <div className="kpi-label">Today's Usage</div>
            <div className="kpi-value">180 Units</div>
            <div className="kpi-label">Solar Power Consumed</div>
          </div>
          <div className="detail-kpi-card" style={{ borderLeft: '4px solid #9333ea' }}>
            <div className="kpi-label">Balance Power</div>
            <div className="kpi-value">145 Units</div>
            <div className="kpi-label">Excess Energy</div>
          </div>
          <div className="detail-kpi-card" style={{ borderLeft: '4px solid #0f172a' }}>
            <div className="kpi-label">Today's Savings</div>
            <div className="kpi-value">₹4,200</div>
            <div className="kpi-label">Financial Offset</div>
          </div>
        </div>
        
        <div className="detail-chart-block">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ margin: 0 }}>Hourly Generation vs Consumption</h4>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Current (Today)</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlySolar}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="generation" fill="#eab308" name="Generated (kWh)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="consumption" fill="#3b82f6" name="Consumed (kWh)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
            {['day', 'month'].map(r => (
              <button 
                key={r} 
                onClick={() => setTimeRange(r)}
                style={{ padding: '6px 16px', border: 'none', background: timeRange === r ? '#fff' : 'transparent', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', color: timeRange === r ? '#1976d2' : '#64748b', boxShadow: timeRange === r ? '0 2px 6px rgba(0,0,0,0.05)' : 'none' }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="detail-chart-block">
          <h4>{isMonth ? 'Month-wise' : 'Day-wise'} Generation Trend</h4>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey={isMonth ? 'solar' : 'solarGen'} stroke="#eab308" strokeWidth={3} dot={{ r: 4 }} name="Generated (kWh)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="detail-chart-block">
          <h4>{isMonth ? 'Month-wise' : 'Day-wise'} Consumption Trend</h4>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey={isMonth ? 'eb' : 'consumption'} stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} name="Consumed (kWh)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {renderHourlyLog('solar')}
        {renderMajorEquipment(['Inverter'])}
      </>
    );
  };

  const renderMain = () => (
    <>
      <div className="detail-kpi-row">
        <div className="detail-kpi-card" style={{ borderLeft: '4px solid #1976d2' }}>
          <div className="kpi-label">Total Campus Load</div>
          <div className="kpi-value">1.66 MW</div>
          <div className="kpi-label">Real-time Peak</div>
        </div>
        <div className="detail-kpi-card" style={{ borderLeft: '4px solid #16a34a' }}>
          <div className="kpi-label">Renewable Contribution</div>
          <div className="kpi-value">38%</div>
          <div className="kpi-label">Solar Mix Today</div>
        </div>
        <div className="detail-kpi-card" style={{ borderLeft: '4px solid #ea580c' }}>
          <div className="kpi-label">Power Reliability</div>
          <div className="kpi-value">99.9%</div>
          <div className="kpi-label">Grid + DG Uptime</div>
        </div>
      </div>

      <div className="detail-chart-block">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h4 style={{ margin: 0 }}>Combined Energy Mix (Hourly)</h4>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Campus Consumption</span>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={combinedHourly}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="eb" stackId="1" stroke="#2563eb" fill="#2563eb" fillOpacity={0.6} name="Grid (EB)" />
            <Area type="monotone" dataKey="solar" stackId="1" stroke="#eab308" fill="#eab308" fillOpacity={0.6} name="Solar" />
            <Area type="monotone" dataKey="dg" stackId="1" stroke="#ea580c" fill="#ea580c" fillOpacity={0.6} name="DG Backup" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '24px' }}>
        <div className="detail-inner-card">
          <h4 style={{ marginTop: 0 }}>Energy Distribution</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Grid (EB)', value: 62, color: '#2563eb' },
              { label: 'Solar', value: 31, color: '#eab308' },
              { label: 'DG Backup', value: 7, color: '#ea580c' }
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                  <span>{item.label}</span>
                  <span style={{ fontWeight: 700 }}>{item.value}%</span>
                </div>
                <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.value}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="detail-inner-card">
          <h4 style={{ marginTop: 0 }}>System Alerts</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ padding: '8px 12px', background: '#fffbeb', borderLeft: '4px solid #f59e0b', borderRadius: '4px', fontSize: '0.8rem' }}>
              <strong>Maintenance:</strong> Solar Inverter A3 is offline for string cleaning.
            </div>
            <div style={{ padding: '8px 12px', background: '#f0fdf4', borderLeft: '4px solid #10b981', borderRadius: '4px', fontSize: '0.8rem' }}>
              <strong>Optimization:</strong> APFC Panel achieved 0.99 PF during peak load.
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderStaff = () => (
    <div style={{ marginTop: 16 }}>
      <div className="detail-kpi-row" style={{ marginBottom: 24 }}>
        <div className="detail-kpi-card">
          <div className="kpi-label">Total Staff</div>
          <div className="kpi-value">{powerhouseStaff.length}</div>
          <div className="kpi-label">On-duty Roster</div>
        </div>
        <div className="detail-kpi-card">
          <div className="kpi-label">Present Today</div>
          <div className="kpi-value">{powerhouseStaff.filter(s => s.attendance === 'Present').length}</div>
          <div className="kpi-label">Available Operators</div>
        </div>
      </div>

      <div className="responsive-grid">
        {powerhouseStaff.map(staff => (
          <div key={staff.id} className="detail-inner-card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800, color: '#64748b', border: '2px solid #e2e8f0' }}>
              {staff.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, color: '#1e293b' }}>{staff.name}</h4>
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, background: staff.attendance === 'Present' ? '#dcfce7' : '#fee2e2', color: staff.attendance === 'Present' ? '#166534' : '#991b1b' }}>
                  {staff.attendance}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginTop: 2 }}>{staff.role}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <span style={{ fontSize: '0.75rem', padding: '2px 6px', background: '#eff6ff', color: '#1e40af', borderRadius: '4px', fontWeight: 600 }}>{staff.sector}</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>•</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{staff.portion}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#1976d2', marginTop: 6, fontWeight: 500 }}>{staff.contact}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="unit-detail-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <h2 style={{ margin: 0 }}>Power House Dashboard</h2>
        <div className="tab-container-responsive" style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
          {['main', 'solar', 'dg', 'eb', 'staff'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === tab ? '#fff' : 'transparent',
                color: activeTab === tab ? '#1976d2' : '#64748b',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: activeTab === tab ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                textTransform: 'uppercase',
                fontSize: '0.8rem',
                transition: 'all 0.2s'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'main' && renderMain()}
      {activeTab === 'solar' && renderSolar()}
      {activeTab === 'dg' && renderDG()}
      {activeTab === 'eb' && renderEB()}
      {activeTab === 'staff' && renderStaff()}

      <div style={{ marginTop: 40, borderTop: '1px solid #e2e8f0', paddingTop: 24 }}>
        <h4 style={{ color: '#1e293b' }}>Operational Notes</h4>
        <ul style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.6' }}>
          <li>Peak load recorded yesterday at 19:15 (1.66 MW).</li>
          <li>Solar plant performance is 94% of theoretical maximum for current season.</li>
          <li>DG fuel efficiency: 3.2 kWh/Litre (within standard range).</li>
        </ul>
      </div>
    </div>
  );
}
