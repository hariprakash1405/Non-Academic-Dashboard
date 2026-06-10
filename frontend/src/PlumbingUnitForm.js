import React, { useState, useEffect } from 'react';

const API = 'http://localhost:8085/api/plumbing';
const inp = { padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', width: '100%', boxSizing: 'border-box', background: '#fff' };
const lbl = { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' };
const sec = { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '16px' };

const TABS = [
  { key: 'motors', label: '⚙️ Motors & Pumps' },
  { key: 'sumps', label: '🚰 UG Sumps' },
  { key: 'ohts', label: '💧 Overhead Tanks' },
  { key: 'manpower', label: '👷 Manpower' },
  { key: 'runtime', label: '⏱️ Daily Run Time' },
];

const Grid = ({ cols = 2, children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>{children}</div>
);

const Btn = ({ color = 'blue', children, ...p }) => (
  <button {...p} style={{
    padding: '9px 22px', borderRadius: '8px', border: 'none', cursor: 'pointer',
    fontWeight: 700, fontSize: '0.85rem', transition: 'opacity 0.15s',
    background: color === 'green' ? '#10b981' : color === 'gray' ? '#e2e8f0' : color === 'red' ? '#ef4444' : '#1976d2',
    color: color === 'gray' ? '#475569' : '#fff', opacity: p.disabled ? 0.6 : 1
  }}>{children}</button>
);

export default function PlumbingUnitForm({ onDataSaved }) {
  const [tab, setTab] = useState('motors');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState(null);

  const fetchData = () => {
    fetch(API)
      .then(r => r.json())
      .then(d => setApiData(d))
      .catch(() => {});
  };

  useEffect(() => {
    fetchData();
  }, []);

  const motors = apiData?.motors || [];
  const sumps = apiData?.sumps || [];
  const ohts = apiData?.ohts || [];
  const manpower = apiData?.manpower || [];

  const [motorForm, setMotorForm] = useState({ motorId: '', location: '', type: 'Submersible', power: '', opHours: '', nextService: '', status: 'Active', connectedTank: '' });
  const [sumpForm, setSumpForm] = useState({ sumpId: '', location: '', capacity: '', pumpPower: '', status: 'Active' });
  const [ohtForm, setOhtForm] = useState({ ohtId: '', location: '', capacity: '', lastCleaned: '', status: 'Active' });
  const [manpowerForm, setManpowerForm] = useState({ empId: '', name: '', designation: '', contact: '', skill: '', type: 'Permanent', shift: 'Morning', status: 'Active', attendance: 'Present', assignedArea: '' });
  const [runTimeForm, setRunTimeForm] = useState({ date: new Date().toISOString().split('T')[0], motorId: '', s1: '', s2: '', s3: '', s4: '' });

  const [delMotor, setDelMotor] = useState('');
  const [delSump, setDelSump] = useState('');
  const [delOht, setDelOht] = useState('');
  const [delManpower, setDelManpower] = useState('');

  // Pre-fill runtime form if log already exists (Edit Mode)
  useEffect(() => {
    if (tab === 'runtime' && apiData && apiData.runtimes) {
      const existing = apiData.runtimes.find(r => r.date === runTimeForm.date && r.motorId === runTimeForm.motorId);
      if (existing) {
        setRunTimeForm(prev => ({
          ...prev,
          s1: existing.s1 || '',
          s2: existing.s2 || '',
          s3: existing.s3 || '',
          s4: existing.s4 || ''
        }));
      } else {
        setRunTimeForm(prev => ({
          ...prev,
          s1: '', s2: '', s3: '', s4: ''
        }));
      }
    }
  }, [runTimeForm.date, runTimeForm.motorId, tab, apiData]);

  const toast$ = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const post = async (url, body, msg, reset) => {
    setLoading(true);
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) {
        toast$(await r.text(), false);
        setLoading(false);
        return;
      }
      toast$(msg);
      fetchData();
      reset && reset();
      onDataSaved && onDataSaved();
      // Dispatch event so PlumbingDetail refreshes
      window.dispatchEvent(new Event('plumbing-updated'));
    } catch {
      toast$('Connection error', false);
    }
    setLoading(false);
  };

  const submitMotor = e => {
    e.preventDefault();
    if (!motorForm.motorId) { toast$('Motor ID required', false); return; }
    post(`${API}/add-motors`, [motorForm], 'Motor added successfully!', () => setMotorForm({ motorId: '', location: '', type: 'Submersible', power: '', opHours: '', nextService: '', status: 'Active', connectedTank: '' }));
  };

  const submitDeleteMotor = e => {
    e.preventDefault();
    if (!delMotor) return;
    post(`${API}/delete-motor?id=${delMotor}`, {}, 'Motor deleted!', () => setDelMotor(''));
  };

  const submitSump = e => {
    e.preventDefault();
    if (!sumpForm.sumpId) { toast$('Sump ID required', false); return; }
    post(`${API}/add-sumps`, [sumpForm], 'Sump added successfully!', () => setSumpForm({ sumpId: '', location: '', capacity: '', pumpPower: '', status: 'Active' }));
  };

  const submitDeleteSump = e => {
    e.preventDefault();
    if (!delSump) return;
    post(`${API}/delete-sump?id=${delSump}`, {}, 'Sump deleted!', () => setDelSump(''));
  };

  const submitOht = e => {
    e.preventDefault();
    if (!ohtForm.ohtId) { toast$('OHT ID required', false); return; }
    post(`${API}/add-ohts`, [ohtForm], 'OHT added successfully!', () => setOhtForm({ ohtId: '', location: '', capacity: '', lastCleaned: '', status: 'Active' }));
  };

  const submitDeleteOht = e => {
    e.preventDefault();
    if (!delOht) return;
    post(`${API}/delete-oht?id=${delOht}`, {}, 'OHT deleted!', () => setDelOht(''));
  };

  const submitManpower = e => {
    e.preventDefault();
    if (!manpowerForm.empId) { toast$('Employee ID required', false); return; }
    post(`${API}/add-manpower`, [manpowerForm], 'Manpower added successfully!', () => setManpowerForm({ empId: '', name: '', designation: '', contact: '', skill: '', type: 'Permanent', shift: 'Morning', status: 'Active', attendance: 'Present', assignedArea: '' }));
  };

  const submitDeleteManpower = e => {
    e.preventDefault();
    if (!delManpower) return;
    post(`${API}/delete-manpower?id=${delManpower}`, {}, 'Manpower deleted!', () => setDelManpower(''));
  };

  const submitRunTime = e => {
    e.preventDefault();
    if (!runTimeForm.motorId) { toast$('Motor required', false); return; }

    const s1 = parseFloat(runTimeForm.s1) || 0;
    const s2 = parseFloat(runTimeForm.s2) || 0;
    const s3 = parseFloat(runTimeForm.s3) || 0;
    const s4 = parseFloat(runTimeForm.s4) || 0;
    
    const payload = {
        date: runTimeForm.date,
        motorId: runTimeForm.motorId,
        peakRun: (s1 + s3).toString(),
        offPeakRun: s2.toString(),
        nightRun: s4.toString(),
        s1: runTimeForm.s1, s2: runTimeForm.s2, s3: runTimeForm.s3, s4: runTimeForm.s4
    };

    post(`${API}/add-runtime`, [payload], 'Run time logged successfully!', () => {
        setRunTimeForm({ date: new Date().toISOString().split('T')[0], motorId: '', s1: '', s2: '', s3: '', s4: '' });
    });
  };

  return (
    <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '16px', height: '80vh', overflowY: 'auto' }}>
      <h2 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Plumbing Unit Data Entry</h2>
      <p style={{ margin: '0 0 24px 0', color: '#64748b' }}>Manage campus water infrastructure, motors, and tanks.</p>

      {toast && (
        <div style={{ padding: '12px 16px', background: toast.ok ? '#dcfce7' : '#fee2e2', color: toast.ok ? '#166534' : '#991b1b', borderRadius: '8px', marginBottom: '20px', fontWeight: 600 }}>
          {toast.msg}
        </div>
      )}

      {/* TABS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 16px', background: tab === t.key ? '#1e293b' : 'transparent', color: tab === t.key ? '#fff' : '#64748b',
              border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!apiData && !loading ? (
         <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading form data...</div>
      ) : (
         <>
            {tab === 'motors' && (
              <>
                <form onSubmit={submitMotor}>
                  <div style={sec}>
                    <h4 style={{ margin: '0 0 14px' }}>⚙️ Add New Motor / Pump</h4>
                    <Grid cols={3}>
                      <label style={lbl}>Motor ID *<input style={inp} value={motorForm.motorId} onChange={e => setMotorForm(f => ({...f, motorId: e.target.value}))} placeholder="e.g. MTR-10" required /></label>
                      <label style={lbl}>Location<input style={inp} value={motorForm.location} onChange={e => setMotorForm(f => ({...f, location: e.target.value}))} placeholder="e.g. Science Block" /></label>
                      <label style={lbl}>Type
                        <select style={inp} value={motorForm.type} onChange={e => setMotorForm(f => ({...f, type: e.target.value}))}>
                          <option>Submersible</option><option>Centrifugal</option><option>Booster</option><option>Borewell</option>
                        </select>
                      </label>
                      <label style={lbl}>Power Rating (HP)<input style={inp} value={motorForm.power} onChange={e => setMotorForm(f => ({...f, power: e.target.value}))} placeholder="e.g. 5 HP" /></label>
                      <label style={lbl}>Operating Hours<input style={inp} value={motorForm.opHours} onChange={e => setMotorForm(f => ({...f, opHours: e.target.value}))} placeholder="e.g. 8 hrs/day" /></label>
                      <label style={lbl}>Connected Tank/Sump<input style={inp} value={motorForm.connectedTank} onChange={e => setMotorForm(f => ({...f, connectedTank: e.target.value}))} placeholder="e.g. SMP-01 or OHT-02" /></label>
                      <label style={lbl}>Next Service Date<input type="date" style={inp} value={motorForm.nextService} onChange={e => setMotorForm(f => ({...f, nextService: e.target.value}))} /></label>
                      <label style={lbl}>Status
                        <select style={inp} value={motorForm.status} onChange={e => setMotorForm(f => ({...f, status: e.target.value}))}>
                          <option>Active</option><option>Maintenance</option><option>Inactive</option>
                        </select>
                      </label>
                    </Grid>
                    <div style={{ marginTop: '16px' }}>
                      <Btn color="blue" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Motor'}</Btn>
                    </div>
                  </div>
                </form>
                <form onSubmit={submitDeleteMotor}>
                  <div style={{ ...sec, background: '#fff5f5', borderColor: '#fee2e2' }}>
                    <h4 style={{ margin: '0 0 14px', color: '#991b1b' }}>⚠️ Delete Motor</h4>
                    <Grid>
                      <label style={lbl}>Select Motor to Delete *
                        <select style={inp} value={delMotor} onChange={e => setDelMotor(e.target.value)} required>
                          <option value="">Select...</option>
                          {motors.map(m => <option key={m.id} value={m.id}>{m.motorId} - {m.location}</option>)}
                        </select>
                      </label>
                    </Grid>
                    <div style={{ marginTop: '16px' }}>
                      <Btn color="red" type="submit" disabled={loading}>Delete Motor</Btn>
                    </div>
                  </div>
                </form>
              </>
            )}

            {tab === 'sumps' && (
              <>
                <form onSubmit={submitSump}>
                  <div style={sec}>
                    <h4 style={{ margin: '0 0 14px' }}>🚰 Add New Sump</h4>
                    <Grid cols={2}>
                      <label style={lbl}>Sump ID *<input style={inp} value={sumpForm.sumpId} onChange={e => setSumpForm(f => ({...f, sumpId: e.target.value}))} placeholder="e.g. SMP-05" required /></label>
                      <label style={lbl}>Location<input style={inp} value={sumpForm.location} onChange={e => setSumpForm(f => ({...f, location: e.target.value}))} /></label>
                      <label style={lbl}>Capacity<input style={inp} value={sumpForm.capacity} onChange={e => setSumpForm(f => ({...f, capacity: e.target.value}))} placeholder="e.g. 50,000 L" /></label>
                      <label style={lbl}>Pump Power<input style={inp} value={sumpForm.pumpPower} onChange={e => setSumpForm(f => ({...f, pumpPower: e.target.value}))} placeholder="e.g. 10 HP" /></label>
                      <label style={lbl}>Status
                        <select style={inp} value={sumpForm.status} onChange={e => setSumpForm(f => ({...f, status: e.target.value}))}>
                          <option>Active</option><option>Maintenance</option><option>Inactive</option>
                        </select>
                      </label>
                    </Grid>
                    <div style={{ marginTop: '16px' }}>
                      <Btn color="blue" type="submit" disabled={loading}>Save Sump</Btn>
                    </div>
                  </div>
                </form>
                <form onSubmit={submitDeleteSump}>
                  <div style={{ ...sec, background: '#fff5f5', borderColor: '#fee2e2' }}>
                    <h4 style={{ margin: '0 0 14px', color: '#991b1b' }}>⚠️ Delete Sump</h4>
                    <Grid>
                      <label style={lbl}>Select Sump *
                        <select style={inp} value={delSump} onChange={e => setDelSump(e.target.value)} required>
                          <option value="">Select...</option>
                          {sumps.map(s => <option key={s.id} value={s.id}>{s.sumpId} - {s.location}</option>)}
                        </select>
                      </label>
                    </Grid>
                    <div style={{ marginTop: '16px' }}>
                      <Btn color="red" type="submit" disabled={loading}>Delete Sump</Btn>
                    </div>
                  </div>
                </form>
              </>
            )}

            {tab === 'ohts' && (
              <>
                <form onSubmit={submitOht}>
                  <div style={sec}>
                    <h4 style={{ margin: '0 0 14px' }}>💧 Add New OHT</h4>
                    <Grid cols={2}>
                      <label style={lbl}>OHT ID *<input style={inp} value={ohtForm.ohtId} onChange={e => setOhtForm(f => ({...f, ohtId: e.target.value}))} placeholder="e.g. OHT-05" required /></label>
                      <label style={lbl}>Location<input style={inp} value={ohtForm.location} onChange={e => setOhtForm(f => ({...f, location: e.target.value}))} /></label>
                      <label style={lbl}>Capacity<input style={inp} value={ohtForm.capacity} onChange={e => setOhtForm(f => ({...f, capacity: e.target.value}))} placeholder="e.g. 20,000 L" /></label>
                      <label style={lbl}>Last Cleaned Date<input type="date" style={inp} value={ohtForm.lastCleaned} onChange={e => setOhtForm(f => ({...f, lastCleaned: e.target.value}))} /></label>
                      <label style={lbl}>Status
                        <select style={inp} value={ohtForm.status} onChange={e => setOhtForm(f => ({...f, status: e.target.value}))}>
                          <option>Active</option><option>Maintenance</option><option>Inactive</option>
                        </select>
                      </label>
                    </Grid>
                    <div style={{ marginTop: '16px' }}>
                      <Btn color="blue" type="submit" disabled={loading}>Save OHT</Btn>
                    </div>
                  </div>
                </form>
                <form onSubmit={submitDeleteOht}>
                  <div style={{ ...sec, background: '#fff5f5', borderColor: '#fee2e2' }}>
                    <h4 style={{ margin: '0 0 14px', color: '#991b1b' }}>⚠️ Delete OHT</h4>
                    <Grid>
                      <label style={lbl}>Select OHT *
                        <select style={inp} value={delOht} onChange={e => setDelOht(e.target.value)} required>
                          <option value="">Select...</option>
                          {ohts.map(o => <option key={o.id} value={o.id}>{o.ohtId} - {o.location}</option>)}
                        </select>
                      </label>
                    </Grid>
                    <div style={{ marginTop: '16px' }}>
                      <Btn color="red" type="submit" disabled={loading}>Delete OHT</Btn>
                    </div>
                  </div>
                </form>
              </>
            )}
            {tab === 'manpower' && (
              <>
                <form onSubmit={submitManpower}>
                  <div style={sec}>
                    <h4 style={{ margin: '0 0 14px' }}>👷 Add New Personnel</h4>
                    <Grid cols={3}>
                      <label style={lbl}>Employee ID *<input style={inp} value={manpowerForm.empId} onChange={e => setManpowerForm(f => ({...f, empId: e.target.value}))} placeholder="e.g. EMP-P01" required /></label>
                      <label style={lbl}>Name<input style={inp} value={manpowerForm.name} onChange={e => setManpowerForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Ramesh Kumar" /></label>
                      <label style={lbl}>Designation<input style={inp} value={manpowerForm.designation} onChange={e => setManpowerForm(f => ({...f, designation: e.target.value}))} placeholder="e.g. Senior Plumber" /></label>
                      <label style={lbl}>Contact<input style={inp} value={manpowerForm.contact} onChange={e => setManpowerForm(f => ({...f, contact: e.target.value}))} placeholder="+91 9876543210" /></label>
                      <label style={lbl}>Skill<input style={inp} value={manpowerForm.skill} onChange={e => setManpowerForm(f => ({...f, skill: e.target.value}))} placeholder="e.g. Pipe Fitting" /></label>
                      <label style={lbl}>Type
                        <select style={inp} value={manpowerForm.type} onChange={e => setManpowerForm(f => ({...f, type: e.target.value}))}>
                          <option>Permanent</option><option>Contract</option><option>Outsourced</option>
                        </select>
                      </label>
                      <label style={lbl}>Shift
                        <select style={inp} value={manpowerForm.shift} onChange={e => setManpowerForm(f => ({...f, shift: e.target.value}))}>
                          <option>Morning</option><option>General</option><option>Evening</option><option>Night</option>
                        </select>
                      </label>
                      <label style={lbl}>Status
                        <select style={inp} value={manpowerForm.status} onChange={e => setManpowerForm(f => ({...f, status: e.target.value}))}>
                          <option>Active</option><option>On Leave</option><option>Inactive</option>
                        </select>
                      </label>
                      <label style={lbl}>Attendance
                        <select style={inp} value={manpowerForm.attendance} onChange={e => setManpowerForm(f => ({...f, attendance: e.target.value}))}>
                          <option>Present</option><option>Absent</option><option>On Leave</option>
                        </select>
                      </label>
                      <label style={lbl}>Assigned Area<input style={inp} value={manpowerForm.assignedArea} onChange={e => setManpowerForm(f => ({...f, assignedArea: e.target.value}))} placeholder="e.g. Main Pump House" /></label>
                    </Grid>
                    <div style={{ marginTop: '16px' }}>
                      <Btn color="blue" type="submit" disabled={loading}>Save Personnel</Btn>
                    </div>
                  </div>
                </form>
                <form onSubmit={submitDeleteManpower}>
                  <div style={{ ...sec, background: '#fff5f5', borderColor: '#fee2e2' }}>
                    <h4 style={{ margin: '0 0 14px', color: '#991b1b' }}>⚠️ Delete Personnel</h4>
                    <Grid>
                      <label style={lbl}>Select Personnel *
                        <select style={inp} value={delManpower} onChange={e => setDelManpower(e.target.value)} required>
                          <option value="">Select...</option>
                          {manpower.map(m => <option key={m.id} value={m.id}>{m.empId} - {m.name}</option>)}
                        </select>
                      </label>
                    </Grid>
                    <div style={{ marginTop: '16px' }}>
                      <Btn color="red" type="submit" disabled={loading}>Delete Personnel</Btn>
                    </div>
                  </div>
                </form>
              </>
            )}

            {tab === 'runtime' && (
              <>
                <form onSubmit={submitRunTime}>
                  <div style={sec}>
                    <h4 style={{ margin: '0 0 14px' }}>⏱️ Log Daily Run Time</h4>
                    <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '0.85rem' }}>Record the operational hours for a motor/pump separated by time periods.</p>
                    <Grid cols={2}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={lbl}>Date *</label>
                        <input type="date" style={inp} value={runTimeForm.date} onChange={e => setRunTimeForm(f => ({...f, date: e.target.value}))} required />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={lbl}>Select Motor *</label>
                        <select style={inp} value={runTimeForm.motorId} onChange={e => setRunTimeForm(f => ({...f, motorId: e.target.value}))} required>
                          <option value="">Select Motor...</option>
                          {motors.map(m => <option key={m.id} value={m.motorId}>{m.motorId} - {m.location}</option>)}
                        </select>
                      </div>
                    </Grid>
                    
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '20px' }}>
                      <h5 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '0.95rem' }}>Shift Run Hours</h5>
                      <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '0.8rem' }}>Enter the number of hours the motor ran during each specific shift block.</p>
                      <Grid cols={4}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'flex-end' }}>
                          <label style={{...lbl, color: '#ef4444'}}>Morning Peak (6AM-10AM) <br/><span style={{fontSize:'0.65rem', color:'#64748b'}}>Max 4h</span></label>
                          <input type="number" step="0.5" max="4" min="0" style={inp} value={runTimeForm.s1} onChange={e => setRunTimeForm(f => ({...f, s1: e.target.value}))} placeholder="e.g. 4.0" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'flex-end' }}>
                          <label style={{...lbl, color: '#22c55e'}}>Day Off-Peak (10AM-6PM) <br/><span style={{fontSize:'0.65rem', color:'#64748b'}}>Max 8h</span></label>
                          <input type="number" step="0.5" max="8" min="0" style={inp} value={runTimeForm.s2} onChange={e => setRunTimeForm(f => ({...f, s2: e.target.value}))} placeholder="e.g. 8.0" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'flex-end' }}>
                          <label style={{...lbl, color: '#ef4444'}}>Evening Peak (6PM-10PM) <br/><span style={{fontSize:'0.65rem', color:'#64748b'}}>Max 4h</span></label>
                          <input type="number" step="0.5" max="4" min="0" style={inp} value={runTimeForm.s3} onChange={e => setRunTimeForm(f => ({...f, s3: e.target.value}))} placeholder="e.g. 4.0" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'flex-end' }}>
                          <label style={{...lbl, color: '#1d4ed8'}}>Night Time (10PM-6AM) <br/><span style={{fontSize:'0.65rem', color:'#64748b'}}>Max 8h</span></label>
                          <input type="number" step="0.5" max="8" min="0" style={inp} value={runTimeForm.s4} onChange={e => setRunTimeForm(f => ({...f, s4: e.target.value}))} placeholder="e.g. 8.0" />
                        </div>
                      </Grid>
                    </div>
                    <div style={{ marginTop: '16px' }}>
                      <Btn color="blue" type="submit" disabled={loading}>Save Log</Btn>
                    </div>
                  </div>
                </form>
              </>
            )}
         </>
      )}
    </div>
  );
}
