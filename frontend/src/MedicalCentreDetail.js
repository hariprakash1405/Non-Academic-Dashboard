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
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const opdDaily = [
  { date: '2026-05-06', opd: 18 },
  { date: '2026-05-07', opd: 23 },
  { date: '2026-05-08', opd: 21 },
  { date: '2026-05-09', opd: 19 },
  { date: '2026-05-10', opd: 25 },
  { date: '2026-05-11', opd: 22 },
  { date: '2026-05-12', opd: 24 },
];

const admissionsMonthly = [
  { month: 'Jan', count: 5 },
  { month: 'Feb', count: 8 },
  { month: 'Mar', count: 12 },
  { month: 'Apr', count: 7 },
  { month: 'May', count: 10 },
];

const admissionsDaily = {
  'May': [
    { date: '05 May', count: 2, issue: 'Viral Fever' },
    { date: '10 May', count: 1, issue: 'Asthma' },
    { date: '15 May', count: 3, issue: 'Sports Injury' },
    { date: '20 May', count: 1, issue: 'Gastritis' },
    { date: '25 May', count: 3, issue: 'Allergic Reaction' },
  ],
  'Apr': [
    { date: '02 Apr', count: 1, issue: 'Appendicitis' },
    { date: '12 Apr', count: 4, issue: 'Food Poisoning' },
    { date: '22 Apr', count: 2, issue: 'Minor Injury' },
  ]
};

const stockLevels = [
  { category: 'Respiratory', pct: 88 },
  { category: 'Gastro', pct: 92 },
  { category: 'First aid', pct: 76 },
  { category: 'Chronic care', pct: 85 },
];

const firstAidKits = [
  { id: 1, location: 'Hostel Block A (Boys)', lastRenewed: '2024-05-10', status: 'Updated' },
  { id: 2, location: 'Lily Block (Girls)', lastRenewed: '2024-05-12', status: 'Updated' },
  { id: 3, location: 'Central Mess Hall', lastRenewed: '2024-04-25', status: 'Renew Soon' },
  { id: 4, location: 'Main Library - L1', lastRenewed: '2024-05-01', status: 'Updated' },
  { id: 5, location: 'Admin Building', lastRenewed: '2024-03-15', status: 'Renew Soon' },
  { id: 6, location: 'Indoor Sports Complex', lastRenewed: '2024-05-14', status: 'Updated' },
];

const healthCamps = [
  { 
    id: 101, 
    title: 'Blood Donation Drive', 
    date: '2024-04-15', 
    type: 'Emergency/Donation', 
    place: 'Boys Common Room',
    doctors: 'Dr. Sharma (Hematologist), Dr. Vinay',
    nurses: 'Nurse Priya, Nurse Kavitha',
    feedback: 'Excellent response; 45 units collected.',
    participants: 45
  },
  { 
    id: 102, 
    title: 'General Dental Checkup', 
    date: '2024-03-22', 
    type: 'Diagnostic', 
    place: 'Girls Hostel Hall',
    doctors: 'Dr. Iyer (Dentist), Dr. Sneha',
    nurses: 'Nurse Sumathi',
    feedback: '120 students screened; 15 referred for follow-up.',
    participants: 120
  },
  { 
    id: 103, 
    title: 'COVID Booster Camp', 
    date: '2024-02-10', 
    type: 'Vaccination', 
    place: 'Medical Centre Lobby',
    doctors: 'Dr. Mehta, Dr. Rajesh',
    nurses: 'Nurse Shanthi, Nurse Priya',
    feedback: 'Smooth operation; 200 vaccinations completed.',
    participants: 200
  },
];

const insuranceList = [
  { name: 'Aditya Varma', category: 'Student', scheme: 'Group Student Medi-claim', id: '23BME001' },
  { name: 'Dr. S. Ramesh', category: 'Faculty', scheme: 'Executive Family Health', id: 'EMP1024' },
  { name: 'Priya Dharshini', category: 'Student', scheme: 'Group Student Medi-claim', id: '23BCE055' },
  { name: 'Prof. Anitha G.', category: 'Faculty', scheme: 'Executive Family Health', id: 'EMP1088' },
  { name: 'Vikram Singh', category: 'Student', scheme: 'Group Student Medi-claim', id: '22MEE012' },
];

const emergencyCases = [
  { date: '2024-05-10', id: '23BME088', issue: 'Respiratory Distress (Asthma)', hospital: 'City Apollo Hospital', status: 'Admitted' },
  { date: '2024-05-05', id: '22BCE102', issue: 'Grade 3 Ankle Fracture', hospital: 'Orthopaedic Speciality', status: 'Surgery Scheduled' },
  { date: '2024-04-22', id: 'EMP1045', issue: 'Acute Appendicitis', hospital: 'St. Marys Hospital', status: 'Discharged' },
  { date: '2024-04-02', id: '23BEE015', issue: 'High-grade Fever (Suspected Dengue)', hospital: 'City Apollo Hospital', status: 'Discharged' },
];

const medicalFeedback = [
  { sector: 'Dr. Availability', score: 4.8 },
  { sector: 'Nursing Care', score: 4.5 },
  { sector: 'Medicine Stock', score: 3.9 },
  { sector: 'Cleanliness', score: 4.7 },
  { sector: 'Emergency Resp.', score: 4.6 },
];

const medicalComments = [
  { user: 'Student (UG)', comment: 'The doctors are extremely professional and helpful.', rating: 5 },
  { user: 'Faculty', comment: 'Waiting time for pharmaceutical collection is a bit high during peak hours.', rating: 3 },
  { user: 'Staff', comment: 'Night shift nursing care was exceptional during my emergency.', rating: 5 },
  { user: 'Student (PG)', comment: 'Facility is very clean, but need more stocks of common URI medicines.', rating: 4 },
];

export default function MedicalCentreDetail() {
  const [drillDown, setDrillDown] = React.useState(null); // 'kits', 'camps', 'insurance', or 'referrals'
  const [selectedCamp, setSelectedCamp] = React.useState(null);
  const [selectedAdmissionsMonth, setSelectedAdmissionsMonth] = React.useState(null);
  return (
    <div className="unit-detail-container">
      <h2>Medical Centre Dashboard</h2>
      <p style={{ marginBottom: 20, color: '#555' }}>
        OPD load, referrals, and stock levels are shown as bars — compare day to day or category to category by
        height.
      </p>

      <div className="detail-kpi-row">
        <div 
          className={`detail-kpi-card clickable ${drillDown === 'kits' ? 'active' : ''}`}
          onClick={() => { setDrillDown('kits'); setSelectedCamp(null); }}
          style={drillDown === 'kits' ? { borderColor: '#0284c7', background: '#f0f9ff' } : {}}
        >
          <span className="click-icon">↗</span>
          <div className="kpi-label">First aid kits (campus)</div>
          <div className="kpi-value">{firstAidKits.length}</div>
          <div className="kpi-label">Tracked Locations</div>
        </div>
        <div 
          className={`detail-kpi-card clickable ${drillDown === 'camps' ? 'active' : ''}`}
          onClick={() => { setDrillDown('camps'); setSelectedCamp(null); }}
          style={drillDown === 'camps' ? { borderColor: '#059669', background: '#f0fdf4' } : {}}
        >
          <span className="click-icon">↗</span>
          <div className="kpi-label">Health camps (6M)</div>
          <div className="kpi-value">{healthCamps.length}</div>
          <div className="kpi-label">Camp Logs</div>
        </div>
        <div 
          className={`detail-kpi-card clickable ${drillDown === 'insurance' ? 'active' : ''}`}
          onClick={() => { setDrillDown('insurance'); setSelectedCamp(null); }}
          style={drillDown === 'insurance' ? { borderColor: '#7c3aed', background: '#f5f3ff' } : {}}
        >
          <span className="click-icon">↗</span>
          <div className="kpi-label">Insurance coverage</div>
          <div className="kpi-value">4,180</div>
          <div className="kpi-label">Enrolled Members</div>
        </div>
        <div 
          className={`detail-kpi-card clickable ${drillDown === 'referrals' ? 'active' : ''}`}
          onClick={() => { setDrillDown('referrals'); setSelectedCamp(null); }}
          style={drillDown === 'referrals' ? { borderColor: '#c2185b', background: '#fff1f2' } : {}}
        >
          <span className="click-icon">↗</span>
          <div className="kpi-label">Emergency Referrals</div>
          <div className="kpi-value">{emergencyCases.length}</div>
          <div className="kpi-label">Critical Log</div>
        </div>
      </div>

      {drillDown === 'referrals' && (
        <div style={{ marginTop: 24, background: '#fff', borderRadius: '12px', border: '1px solid #c2185b', overflow: 'hidden', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ padding: '16px 20px', background: '#fff1f2', borderBottom: '1px solid #fecdd3', display: 'flex', justifyContent: 'space-between' }}>
            <h4 style={{ margin: 0, color: '#9f1239' }}>Emergency Hospital Referral Log</h4>
            <button onClick={() => setDrillDown(null)} style={{ border: 'none', background: 'none', color: '#c2185b', fontWeight: 700, cursor: 'pointer' }}>CLOSE</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: '#fff' }}>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>Date</th>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>Emergency Issue</th>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>Hospital</th>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {emergencyCases.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>{item.date}</td>
                    <td style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#9f1239' }}>{item.issue}</td>
                    <td style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>{item.hospital}</td>
                    <td style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>{item.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {drillDown === 'insurance' && (
        <div style={{ marginTop: 24, background: '#fff', borderRadius: '12px', border: '1px solid #7c3aed', overflow: 'hidden', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ padding: '16px 20px', background: '#f5f3ff', borderBottom: '1px solid #ddd6fe', display: 'flex', justifyContent: 'space-between' }}>
            <h4 style={{ margin: 0, color: '#5b21b6' }}>Institutional Insurance Enrollment List</h4>
            <button onClick={() => setDrillDown(null)} style={{ border: 'none', background: 'none', color: '#7c3aed', fontWeight: 700, cursor: 'pointer' }}>CLOSE</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: '#fff' }}>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>Name / ID</th>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>Category</th>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>Enrolled Scheme</th>
                </tr>
              </thead>
              <tbody>
                {insuranceList.map((person, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ fontWeight: 600 }}>{person.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{person.id}</div>
                    </td>
                    <td style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, background: person.category === 'Faculty' ? '#fdf2f8' : '#f0f9ff', color: person.category === 'Faculty' ? '#9d174d' : '#0369a1' }}>
                        {person.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>{person.scheme}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 20px', background: '#f8fafc', fontSize: '0.75rem', color: '#64748b', textAlign: 'right' }}>
            Total Enrolled: <b>3,850 Students</b> + <b>330 Faculty/Staff</b>
          </div>
        </div>
      )}

      {drillDown === 'kits' && (
        <div style={{ marginTop: 24, background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
            <h4 style={{ margin: 0 }}>Campus First Aid Kit Inventory</h4>
            <button onClick={() => setDrillDown(null)} style={{ border: 'none', background: 'none', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}>CLOSE</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: '#fff' }}>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>Location</th>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>Last Renewed</th>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {firstAidKits.map(kit => (
                  <tr key={kit.id}>
                    <td style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>{kit.location}</td>
                    <td style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>{kit.lastRenewed}</td>
                    <td style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, background: kit.status === 'Updated' ? '#dcfce7' : '#fee2e2', color: kit.status === 'Updated' ? '#166534' : '#991b1b' }}>
                        {kit.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {drillDown === 'camps' && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ margin: 0 }}>Health Camps Conducted (Last 6 Months)</h4>
            <button onClick={() => setDrillDown(null)} style={{ border: 'none', background: 'none', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}>CLOSE</button>
          </div>
          <div className="responsive-grid">
            {healthCamps.map(camp => (
              <div 
                key={camp.id} 
                className="detail-inner-card" 
                onClick={() => setSelectedCamp(camp)}
                style={{ cursor: 'pointer', border: selectedCamp?.id === camp.id ? '2px solid #059669' : '1px solid #f1f5f9', background: selectedCamp?.id === camp.id ? '#f0fdf4' : '#fff' }}
              >
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>{camp.date}</div>
                <h4 style={{ margin: '4px 0', fontSize: '1rem' }}>{camp.title}</h4>
                <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>{camp.type}</div>
                <div style={{ marginTop: 12, fontSize: '0.7rem', color: '#3b82f6', fontWeight: 800 }}>VIEW FULL DETAILS</div>
              </div>
            ))}
          </div>

          {selectedCamp && (
            <div style={{ marginTop: 24, padding: '24px', background: '#fff', borderRadius: '12px', border: '1px solid #059669', animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0 }}>{selectedCamp.title}</h3>
                <span style={{ padding: '4px 12px', background: '#dcfce7', color: '#166534', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>{selectedCamp.date}</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginTop: 20 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Doctors</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', marginTop: 4 }}>{selectedCamp.doctors}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Nurse Team</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', marginTop: 4 }}>{selectedCamp.nurses}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Location</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', marginTop: 4 }}>{selectedCamp.place}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Participants</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>{selectedCamp.participants}</div>
                </div>
              </div>

              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Feedback / Outcomes</div>
                <p style={{ margin: '8px 0 0 0', color: '#475569', fontStyle: 'italic' }}>"{selectedCamp.feedback}"</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="detail-chart-block">
        <h4>OPD patients seen each day (count)</h4>
        <p className="detail-visual-hint">
          <strong>How to read:</strong> each bar is one day. Taller bar = more walk-in patients at the centre.
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={opdDaily}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip formatter={(v) => [`${v} patients`, 'OPD']} />
            <Legend />
            <Bar dataKey="opd" fill="#1976d2" name="OPD patients" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="detail-chart-block">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h4 style={{ margin: 0 }}>Campus Admissions for Medical Issues</h4>
          {selectedAdmissionsMonth && (
            <button 
              onClick={() => setSelectedAdmissionsMonth(null)}
              style={{ background: '#f1f5f9', border: 'none', padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
            >
              ← BACK TO MONTHLY
            </button>
          )}
        </div>
        
        {!selectedAdmissionsMonth ? (
          <>
            <p className="detail-visual-hint">
              <strong>How to read:</strong> Bars show total admissions per month. <b>Click a bar</b> to see day-wise details for that month.
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart 
                data={admissionsMonthly} 
                onClick={(data) => data && setSelectedAdmissionsMonth(data.activeLabel)}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#c2185b" name="Admissions" radius={[6, 6, 0, 0]} style={{ cursor: 'pointer' }} />
              </BarChart>
            </ResponsiveContainer>
          </>
        ) : (
          <>
            <p className="detail-visual-hint">
              <strong>Daily Breakdown for {selectedAdmissionsMonth}:</strong> Showing specific admission events and reasons.
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={admissionsDaily[selectedAdmissionsMonth] || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div style={{ background: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
                          <p style={{ margin: 0, fontWeight: 700 }}>{payload[0].payload.date}</p>
                          <p style={{ margin: '4px 0', color: '#c2185b' }}>Admissions: {payload[0].value}</p>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>Issue: {payload[0].payload.issue}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="#ec4899" name="Daily Admissions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      <div className="detail-chart-block">
        <h4>Medicine stock (% of essential list available)</h4>
        <p className="detail-visual-hint">
          <strong>How to read:</strong> horizontal bars — longer bar = better stocked category (closer to 100%).
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={stockLevels} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="category" width={100} />
            <Tooltip formatter={(v) => [`${v}%`, 'Available']} />
            <Legend />
            <Bar dataKey="pct" fill="#00897b" name="Availability %" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: 40 }}>
        <h4 style={{ marginBottom: 20 }}>Performance & Patient Feedback</h4>
        <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          <div className="detail-chart-block" style={{ marginBottom: 0 }}>
            <h4>Sector-wise Quality Ratings (0-5)</h4>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={medicalFeedback}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="sector" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Bar dataKey="score" fill="#00897b" radius={[6, 6, 0, 0]}>
                  {medicalFeedback.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score < 4 ? '#ef4444' : '#00897b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', marginTop: 12 }}>
              Target benchmark: <b>4.2+</b> for all medical services.
            </p>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Recent Patient Comments</h4>
            </div>
            <div style={{ padding: '10px 20px', overflowY: 'auto', maxHeight: '280px', flex: 1 }}>
              {medicalComments.map((item, idx) => (
                <div key={idx} style={{ padding: '12px 0', borderBottom: idx === medicalComments.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>{item.user}</span>
                    <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 800 }}>{'★'.repeat(item.rating)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e293b', lineHeight: 1.5 }}>"{item.comment}"</p>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 20px', background: '#f0fdf4', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700 }}>Overall Centre Satisfaction: 4.5 / 5.0</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 40, background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h4>Doctor / nurse availability (weekly roster sample)</h4>
        <ul>
          <li>Dr. Mehta (MBBS, MD) — OPD 09:00–13:00 Mon–Fri</li>
          <li>Staff Nurse Priya — duty 08:00–16:00 rotating blocks</li>
        </ul>
        <h4 style={{ marginTop: 16 }}>Common ailments (top 5, last month)</h4>
        <ul>
          <li>URI, viral fever, gastritis, allergic rhinitis, minor injuries</li>
        </ul>
      </div>
    </div>
  );
}
