import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const utilisationDaily = [
  { date: '2026-05-06', hours: 6.2 },
  { date: '2026-05-07', hours: 7.1 },
  { date: '2026-05-08', hours: 5.8 },
  { date: '2026-05-09', hours: 8.0 },
  { date: '2026-05-10', hours: 6.5 },
  { date: '2026-05-11', hours: 7.3 },
  { date: '2026-05-12', hours: 6.9 },
];

const membershipTrend = [
  { month: 'Jan', sports: 820, gym: 340 },
  { month: 'Feb', sports: 835, gym: 352 },
  { month: 'Mar', sports: 848, gym: 361 },
  { month: 'Apr', sports: 860, gym: 370 },
  { month: 'May', sports: 872, gym: 378 },
];

const equipmentStatus = [
  { name: 'Working', value: 42 },
  { name: 'Needs repair', value: 5 },
  { name: 'Out of service', value: 2 },
];

const EQ_COLORS = ['#43a047', '#fb8c00', '#c62828'];

const FACILITY_DATA = {
  Sport: [
    {
      id: 'grounds',
      label: 'Grounds',
      count: 3,
      items: [
        { name: 'Main Cricket Ground', status: 'Available', usage: 'High' },
        { name: 'Football Turf A', status: 'Maintenance', usage: 'Medium' },
        { name: 'Athletic Track', status: 'Available', usage: 'Medium' },
      ],
      icon: '🏟️'
    },
    {
      id: 'indoor',
      label: 'Indoor Facilities',
      count: 4,
      items: [
        { name: 'Badminton Hall (4 Courts)', status: 'Available', usage: 'High' },
        { name: 'Table Tennis Arena', status: 'Available', usage: 'Medium' },
        { name: 'Squash Court A', status: 'Reserved', usage: 'High' },
        { name: 'Squash Court B', status: 'Available', usage: 'Low' },
      ],
      icon: '🏠'
    },
    {
      id: 'courts',
      label: 'Courts',
      count: 5,
      items: [
        { name: 'Tennis Court 1', status: 'Available', usage: 'Medium' },
        { name: 'Tennis Court 2', status: 'Available', usage: 'Medium' },
        { name: 'Basketball Court (North)', status: 'Available', usage: 'High' },
        { name: 'Basketball Court (South)', status: 'Under Lights', usage: 'High' },
        { name: 'Volleyball Clay Court', status: 'Available', usage: 'Medium' },
      ],
      icon: '🎾'
    }
  ],
  Gym: [
    {
      id: 'cardio',
      label: 'Cardio Machines',
      count: 18,
      items: [
        { name: 'Treadmills (Matrix T7)', status: '10/12 Working', usage: 'Peak' },
        { name: 'Cross Trainers', status: '4/4 Working', usage: 'High' },
        { name: 'Spinning Bikes', status: '2 Needs Service', usage: 'Medium' },
      ],
      icon: '🏃'
    },
    {
      id: 'strength',
      label: 'Weight Training',
      count: 24,
      items: [
        { name: 'Dumbbell Set (2kg - 40kg)', status: 'Complete', usage: 'High' },
        { name: 'Bench Press Stations', status: 'Available', usage: 'High' },
        { name: 'Squat Racks', status: 'Available', usage: 'Medium' },
        { name: 'Cable Crossover Machine', status: 'Available', usage: 'High' },
      ],
      icon: '🏋️'
    },
    {
      id: 'zones',
      label: 'Specialty Zones',
      count: 3,
      items: [
        { name: 'Yoga & Aerobics Floor', status: 'Class in Progress', usage: 'Scheduled' },
        { name: 'Stretching Area', status: 'Available', usage: 'Low' },
        { name: 'Zumba Studio', status: 'Available', usage: 'Scheduled' },
      ],
      icon: '🧘'
    }
  ]
};

export default function SportsGymDetail() {
  const [activeTab, setActiveTab] = useState('Sport');
  const [selectedId, setSelectedId] = useState(null);

  const categories = FACILITY_DATA[activeTab];
  const selectedCategory = categories.find(c => c.id === selectedId);

  return (
    <div className="unit-detail-container" style={{ padding: '24px', background: '#fcfdfe', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#0c2340', fontSize: '2rem' }}>Sports & Gym Management</h2>
          <p style={{ margin: '8px 0 0', color: '#5a6578' }}>
            Monitor facility utilization, memberships, and infrastructure health across campus units.
          </p>
        </div>
        
        <div style={{ background: '#f0f4f8', padding: '4px', borderRadius: '12px', display: 'flex' }}>
          {['Sport', 'Gym'].map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSelectedId(null); }}
              style={{
                padding: '8px 24px',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.95rem',
                transition: 'all 0.2s',
                background: activeTab === tab ? '#fff' : 'transparent',
                color: activeTab === tab ? '#0c2340' : '#607d8b',
                boxShadow: activeTab === tab ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Row - Split between types */}
      <div className="detail-kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
        {categories.map(cat => (
          <div 
            key={cat.id} 
            className={`detail-kpi-card ${selectedId === cat.id ? 'active-card' : ''}`}
            onClick={() => setSelectedId(selectedId === cat.id ? null : cat.id)}
            style={{ 
              cursor: 'pointer', 
              transition: 'all 0.2s',
              border: selectedId === cat.id ? '2px solid #b8972e' : '1px solid #e3e8ef',
              background: selectedId === cat.id ? '#fffdf5' : '#fff',
              padding: '20px',
              borderRadius: '16px',
              position: 'relative',
              boxShadow: selectedId === cat.id ? '0 8px 24px rgba(184, 151, 46, 0.12)' : '0 2px 10px rgba(0,0,0,0.02)'
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{cat.icon}</div>
            <div className="kpi-label" style={{ fontSize: '0.85rem', color: '#607d8b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {cat.label}
            </div>
            <div className="kpi-value" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0c2340', margin: '4px 0' }}>
              {cat.count} Units
            </div>
            <div style={{ fontSize: '0.8rem', color: '#1976d2', fontWeight: 600 }}>
              {selectedId === cat.id ? 'Click to close' : 'Click to view list'}
            </div>
          </div>
        ))}
      </div>

      {/* Drill-down List Section */}
      {selectedCategory && (
        <div style={{ 
          background: '#fff', 
          borderRadius: '16px', 
          border: '1px solid #e3e8ef', 
          padding: '24px', 
          marginBottom: '32px',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#0c2340' }}>
              List of {selectedCategory.label}
            </h4>
            <button 
              onClick={() => setSelectedId(null)}
              style={{ background: 'none', border: 'none', color: '#607d8b', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              ✕ Close
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f0f4f8' }}>
                  <th style={{ padding: '12px', color: '#78909c', fontSize: '0.85rem' }}>Name</th>
                  <th style={{ padding: '12px', color: '#78909c', fontSize: '0.85rem' }}>Status</th>
                  <th style={{ padding: '12px', color: '#78909c', fontSize: '0.85rem' }}>Usage Level</th>
                </tr>
              </thead>
              <tbody>
                {selectedCategory.items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f0f4f8' }}>
                    <td style={{ padding: '16px 12px', fontWeight: 600, color: '#1a1f2e' }}>{item.name}</td>
                    <td style={{ padding: '16px 12px' }}>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        fontSize: '0.75rem', 
                        fontWeight: 700,
                        background: item.status.includes('Available') ? '#e8f5e9' : '#fff3e0',
                        color: item.status.includes('Available') ? '#2e7d32' : '#e65100'
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 12px', color: '#546e7a' }}>{item.usage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="detail-chart-block" style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e3e8ef' }}>
          <h4 style={{ margin: '0 0 16px', color: '#0c2340' }}>Weekly Utilisation Trend</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={utilisationDaily}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f8f9fa' }} />
              <Bar dataKey="hours" fill="#1565c0" name="Hours / day" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="detail-chart-block" style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e3e8ef' }}>
          <h4 style={{ margin: '0 0 16px', color: '#0c2340' }}>Membership Growth</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={membershipTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f8f9fa' }} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px' }} />
              <Bar dataKey="sports" fill="#5c6bc0" name="Sports" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gym" fill="#00897b" name="Gym" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {activeTab === 'Gym' && (
          <div className="detail-chart-block" style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e3e8ef', gridColumn: 'span 2' }}>
            <h4 style={{ margin: '0 0 16px', color: '#0c2340' }}>Equipment Condition Mix</h4>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ flex: 1, height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={equipmentStatus}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                    >
                      {equipmentStatus.map((entry, index) => (
                        <Cell key={entry.name} fill={EQ_COLORS[index % EQ_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1 }}>
                <h5 style={{ margin: '0 0 12px', color: '#5a6578' }}>Inventory Status</h5>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {equipmentStatus.map((item, idx) => (
                    <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f4f8' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: EQ_COLORS[idx] }}></div>
                        {item.name}
                      </span>
                      <span style={{ fontWeight: 700 }}>{item.value} units</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .active-card {
          transform: translateY(-4px);
        }
      `}</style>
    </div>
  );
}
