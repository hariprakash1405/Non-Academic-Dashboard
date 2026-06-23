import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const API = '/api/plumbing';
const inp = { padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', width: '100%', boxSizing: 'border-box', background: '#fff' };
const lbl = { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' };
const sec = { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '16px' };

const TABS = [
  { key: 'motors', label: '⚙️ Motors & Pumps' },
  { key: 'sumps', label: '🚰 UG Sumps' },
  { key: 'ohts', label: '💧 Overhead Tanks' },
  { key: 'manpower', label: '👷 Manpower' },
  { key: 'runtime', label: '⏱️ Daily Run Time' },
  { key: 'riverIntake', label: '🌊 Source Water Intake' },
  { key: 'borewells', label: '💧 Borewells' },
  { key: 'wells', label: '🚰 Open Wells' },
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

const FieldBox = ({ label, children }) => (
  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
    {children}
  </div>
);

export default function PlumbingUnitForm({ onDataSaved }) {
  const [tab, setTab] = useState('motors');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState(null);

  // New Items (Draft)
  const [newMotors, setNewMotors] = useState([]);
  const [newSumps, setNewSumps] = useState([]);
  const [newOhts, setNewOhts] = useState([]);
  const [newManpower, setNewManpower] = useState([]);
  const [newRuntimes, setNewRuntimes] = useState([]);
  const [newRiverIntakes, setNewRiverIntakes] = useState([]);
  const [newBorewells, setNewBorewells] = useState([]);
  const [newWells, setNewWells] = useState([]);

  // Existing Items (For Edit)
  const [existingMotors, setExistingMotors] = useState([]);
  const [existingSumps, setExistingSumps] = useState([]);
  const [existingOhts, setExistingOhts] = useState([]);
  const [existingManpower, setExistingManpower] = useState([]);
  const [existingRuntimes, setExistingRuntimes] = useState([]);
  const [existingRiverIntakes, setExistingRiverIntakes] = useState([]);
  const [existingBorewells, setExistingBorewells] = useState([]);
  const [existingWells, setExistingWells] = useState([]);

  const fetchData = () => {
    fetch(API)
      .then(r => r.json())
      .then(d => {
        setApiData(d);
        if (d) {
          setExistingMotors(d.motors || []);
          setExistingSumps(d.sumps || []);
          setExistingOhts(d.ohts || []);
          setExistingManpower(d.manpower || []);
          setExistingRuntimes(d.runtimes || []);
          setExistingRiverIntakes(d.riverIntakes || []);
          setExistingBorewells(d.borewells || []);
          setExistingWells(d.wells || []);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toast$ = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleGenericFileUpload = (setState, schema, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const newRows = data.map(row => {
          const newObj = {};
          Object.keys(schema).forEach(key => {
            const matchedKey = Object.keys(row).find(rKey => rKey.toLowerCase().replace(/[^a-z0-9]/g, '') === key.toLowerCase().replace(/[^a-z0-9]/g));
            newObj[key] = matchedKey ? String(row[matchedKey] || '') : schema[key];
          });
          return newObj;
        });
        
        if (newRows.length > 0) {
          setState(prev => [...(prev || []), ...newRows]);
        }
      } catch (err) {
        console.error("Error parsing Excel:", err);
        alert("Failed to parse Excel file.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
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
      if (reset) reset();
      if (onDataSaved) onDataSaved();
      window.dispatchEvent(new Event('plumbing-updated'));
    } catch {
      toast$('Connection error', false);
    }
    setLoading(false);
  };

  const handleDelete = async (url, idMsg) => {
    setLoading(true);
    try {
      const r = await fetch(url, { method: 'DELETE' });
      if (!r.ok) { toast$(await r.text(), false); setLoading(false); return; }
      toast$(idMsg + ' deleted!');
      fetchData();
      if (onDataSaved) onDataSaved();
      window.dispatchEvent(new Event('plumbing-updated'));
    } catch { toast$('Connection error', false); }
    setLoading(false);
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
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', paddingBottom: '12px', overflowX: 'auto' }}>
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
              <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, color: '#0f172a' }}>⚙️ Motors & Pumps Data Entry</h4>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <label style={{ cursor: 'pointer', padding: '8px 16px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                        + Upload Excel
                        <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => handleGenericFileUpload(setNewMotors, { motorId: '', location: '', type: 'Submersible', power: '', opHours: '', nextService: '', status: 'Active', connectedTank: '' }, e)} style={{ display: 'none' }} />
                      </label>
                      <button onClick={() => setNewMotors([...newMotors, { motorId: '', location: '', type: 'Submersible', power: '', opHours: '', nextService: '', status: 'Active', connectedTank: '' }])} style={{ padding: '8px 16px', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>+ Add Motor</button>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto' }}>
                    {newMotors.map((u, i) => (
                      <div key={`newMotors-${i}`} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                          <FieldBox label="Motor ID"><input style={inp} value={u.motorId} onChange={e => { const n = [...newMotors]; n[i].motorId = e.target.value; setNewMotors(n); }} placeholder="e.g. MTR-10" required /></FieldBox>
                          <FieldBox label="Location"><input style={inp} value={u.location} onChange={e => { const n = [...newMotors]; n[i].location = e.target.value; setNewMotors(n); }} placeholder="e.g. Science Block" /></FieldBox>
                          <FieldBox label="Type">
                            <select style={inp} value={u.type} onChange={e => { const n = [...newMotors]; n[i].type = e.target.value; setNewMotors(n); }}>
                              <option>Submersible</option><option>Centrifugal</option><option>Booster</option><option>Borewell</option>
                            </select>
                          </FieldBox>
                          <FieldBox label="Power Rating (HP)"><input style={inp} value={u.power} onChange={e => { const n = [...newMotors]; n[i].power = e.target.value; setNewMotors(n); }} placeholder="e.g. 5 HP" /></FieldBox>
                          <FieldBox label="Op Hours"><input style={inp} value={u.opHours} onChange={e => { const n = [...newMotors]; n[i].opHours = e.target.value; setNewMotors(n); }} placeholder="e.g. 8 hrs/day" /></FieldBox>
                          <FieldBox label="Tank/Sump"><input style={inp} value={u.connectedTank} onChange={e => { const n = [...newMotors]; n[i].connectedTank = e.target.value; setNewMotors(n); }} placeholder="e.g. SMP-01" /></FieldBox>
                          <FieldBox label="Next Service"><input type="date" style={inp} value={u.nextService} onChange={e => { const n = [...newMotors]; n[i].nextService = e.target.value; setNewMotors(n); }} /></FieldBox>
                          <FieldBox label="Status">
                            <select style={inp} value={u.status} onChange={e => { const n = [...newMotors]; n[i].status = e.target.value; setNewMotors(n); }}>
                              <option>Active</option><option>Maintenance</option><option>Inactive</option>
                            </select>
                          </FieldBox>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                          <button onClick={() => setNewMotors(newMotors.filter((_, idx) => idx !== i))} style={{ padding: '10px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Cancel</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {newMotors.length > 0 && (
                    <div style={{ marginTop: '16px', textAlign: 'right' }}>
                      <button style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }} 
                        onClick={() => post(`${API}/add-motors`, newMotors, 'Motors added!', () => setNewMotors([]))}>
                        Save New Motors
                      </button>
                    </div>
                  )}
                </div>

                {existingMotors.length > 0 && (
                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, color: '#0f172a' }}>📋 Existing Motors</h4>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                      {existingMotors.map((u, i) => (
                        <div key={u.id || i} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                            <FieldBox label="Motor ID"><input style={{...inp, background: '#f1f5f9'}} value={u.motorId || ''} onChange={e => { const n = [...existingMotors]; n[i].motorId = e.target.value; setExistingMotors(n); }} /></FieldBox>
                            <FieldBox label="Location"><input style={{...inp, background: '#f1f5f9'}} value={u.location || ''} onChange={e => { const n = [...existingMotors]; n[i].location = e.target.value; setExistingMotors(n); }} /></FieldBox>
                            <FieldBox label="Type">
                              <select style={{...inp, background: '#f1f5f9'}} value={u.type || ''} onChange={e => { const n = [...existingMotors]; n[i].type = e.target.value; setExistingMotors(n); }}>
                                <option>Submersible</option><option>Centrifugal</option><option>Booster</option><option>Borewell</option>
                              </select>
                            </FieldBox>
                            <FieldBox label="Power"><input style={{...inp, background: '#f1f5f9'}} value={u.power || ''} onChange={e => { const n = [...existingMotors]; n[i].power = e.target.value; setExistingMotors(n); }} /></FieldBox>
                            <FieldBox label="Op Hours"><input style={{...inp, background: '#f1f5f9'}} value={u.opHours || ''} onChange={e => { const n = [...existingMotors]; n[i].opHours = e.target.value; setExistingMotors(n); }} /></FieldBox>
                            <FieldBox label="Tank/Sump"><input style={{...inp, background: '#f1f5f9'}} value={u.connectedTank || ''} onChange={e => { const n = [...existingMotors]; n[i].connectedTank = e.target.value; setExistingMotors(n); }} /></FieldBox>
                            <FieldBox label="Next Service"><input type="date" style={{...inp, background: '#f1f5f9'}} value={u.nextService || ''} onChange={e => { const n = [...existingMotors]; n[i].nextService = e.target.value; setExistingMotors(n); }} /></FieldBox>
                            <FieldBox label="Status">
                              <select style={{...inp, background: '#f1f5f9'}} value={u.status || ''} onChange={e => { const n = [...existingMotors]; n[i].status = e.target.value; setExistingMotors(n); }}>
                                <option>Active</option><option>Maintenance</option><option>Inactive</option>
                              </select>
                            </FieldBox>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => post(`${API}/add-motors`, [u], 'Motor updated!')} style={{ padding: '10px 14px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>💾 Update</button>
                            <button onClick={() => handleDelete(`${API}/delete-motor?id=${u.id}`, 'Motor')} style={{ padding: '10px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'sumps' && (
              <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, color: '#0f172a' }}>🚰 UG Sumps Data Entry</h4>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <label style={{ cursor: 'pointer', padding: '8px 16px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                        + Upload Excel
                        <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => handleGenericFileUpload(setNewSumps, { sumpId: '', location: '', capacity: '', pumpPower: '', status: 'Active', motor1Status: 'Running', motor2Status: 'Standby' }, e)} style={{ display: 'none' }} />
                      </label>
                      <button onClick={() => setNewSumps([...newSumps, { sumpId: '', location: '', capacity: '', pumpPower: '', status: 'Active', motor1Status: 'Running', motor2Status: 'Standby' }])} style={{ padding: '8px 16px', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>+ Add Sump</button>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto' }}>
                    {newSumps.map((u, i) => (
                      <div key={`newSumps-${i}`} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                          <FieldBox label="Sump ID"><input style={inp} value={u.sumpId} onChange={e => { const n = [...newSumps]; n[i].sumpId = e.target.value; setNewSumps(n); }} placeholder="e.g. SMP-05" required /></FieldBox>
                          <FieldBox label="Location"><input style={inp} value={u.location} onChange={e => { const n = [...newSumps]; n[i].location = e.target.value; setNewSumps(n); }} /></FieldBox>
                          <FieldBox label="Capacity"><input style={inp} value={u.capacity} onChange={e => { const n = [...newSumps]; n[i].capacity = e.target.value; setNewSumps(n); }} placeholder="e.g. 50,000 L" /></FieldBox>
                          <FieldBox label="Pump Power"><input style={inp} value={u.pumpPower} onChange={e => { const n = [...newSumps]; n[i].pumpPower = e.target.value; setNewSumps(n); }} placeholder="e.g. 10 HP" /></FieldBox>
                          <FieldBox label="Status">
                            <select style={inp} value={u.status} onChange={e => { const n = [...newSumps]; n[i].status = e.target.value; setNewSumps(n); }}>
                              <option>Active</option><option>Maintenance</option><option>Inactive</option>
                            </select>
                          </FieldBox>
                          <FieldBox label="Motor 1 Status">
                            <select style={inp} value={u.motor1Status || 'Running'} onChange={e => { const n = [...newSumps]; n[i].motor1Status = e.target.value; setNewSumps(n); }}>
                              <option>Running</option><option>Standby</option><option>In Stock</option><option>Maintenance</option>
                            </select>
                          </FieldBox>
                          <FieldBox label="Motor 2 Status">
                            <select style={inp} value={u.motor2Status || 'Standby'} onChange={e => { const n = [...newSumps]; n[i].motor2Status = e.target.value; setNewSumps(n); }}>
                              <option>Running</option><option>Standby</option><option>In Stock</option><option>Maintenance</option>
                            </select>
                          </FieldBox>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                          <button onClick={() => setNewSumps(newSumps.filter((_, idx) => idx !== i))} style={{ padding: '10px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Cancel</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {newSumps.length > 0 && (
                    <div style={{ marginTop: '16px', textAlign: 'right' }}>
                      <button style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }} 
                        onClick={() => post(`${API}/add-sumps`, newSumps, 'Sumps added!', () => setNewSumps([]))}>
                        Save New Sumps
                      </button>
                    </div>
                  )}
                </div>

                {existingSumps.length > 0 && (
                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, color: '#0f172a' }}>📋 Existing Sumps</h4>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                      {existingSumps.map((u, i) => (
                        <div key={u.id || i} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                            <FieldBox label="Sump ID"><input style={{...inp, background: '#f1f5f9'}} value={u.sumpId || ''} onChange={e => { const n = [...existingSumps]; n[i].sumpId = e.target.value; setExistingSumps(n); }} /></FieldBox>
                            <FieldBox label="Location"><input style={{...inp, background: '#f1f5f9'}} value={u.location || ''} onChange={e => { const n = [...existingSumps]; n[i].location = e.target.value; setExistingSumps(n); }} /></FieldBox>
                            <FieldBox label="Capacity"><input style={{...inp, background: '#f1f5f9'}} value={u.capacity || ''} onChange={e => { const n = [...existingSumps]; n[i].capacity = e.target.value; setExistingSumps(n); }} /></FieldBox>
                            <FieldBox label="Pump Power"><input style={{...inp, background: '#f1f5f9'}} value={u.pumpPower || ''} onChange={e => { const n = [...existingSumps]; n[i].pumpPower = e.target.value; setExistingSumps(n); }} /></FieldBox>
                            <FieldBox label="Status">
                              <select style={{...inp, background: '#f1f5f9'}} value={u.status || ''} onChange={e => { const n = [...existingSumps]; n[i].status = e.target.value; setExistingSumps(n); }}>
                                <option>Active</option><option>Maintenance</option><option>Inactive</option>
                              </select>
                            </FieldBox>
                            <FieldBox label="Motor 1 Status">
                              <select style={{...inp, background: '#f1f5f9'}} value={u.motor1Status || 'Running'} onChange={e => { const n = [...existingSumps]; n[i].motor1Status = e.target.value; setExistingSumps(n); }}>
                                <option>Running</option><option>Standby</option><option>In Stock</option><option>Maintenance</option>
                              </select>
                            </FieldBox>
                            <FieldBox label="Motor 2 Status">
                              <select style={{...inp, background: '#f1f5f9'}} value={u.motor2Status || 'Standby'} onChange={e => { const n = [...existingSumps]; n[i].motor2Status = e.target.value; setExistingSumps(n); }}>
                                <option>Running</option><option>Standby</option><option>In Stock</option><option>Maintenance</option>
                              </select>
                            </FieldBox>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => post(`${API}/add-sumps`, [u], 'Sump updated!')} style={{ padding: '10px 14px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>💾 Update</button>
                            <button onClick={() => handleDelete(`${API}/delete-sump?id=${u.id}`, 'Sump')} style={{ padding: '10px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'ohts' && (
              <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, color: '#0f172a' }}>💧 Overhead Tanks Data Entry</h4>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <label style={{ cursor: 'pointer', padding: '8px 16px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                        + Upload Excel
                        <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => handleGenericFileUpload(setNewOhts, { ohtId: '', location: '', capacity: '', lastCleaned: '', status: 'Active', motor1Status: 'Running', motor2Status: 'Standby' }, e)} style={{ display: 'none' }} />
                      </label>
                      <button onClick={() => setNewOhts([...newOhts, { ohtId: '', location: '', capacity: '', lastCleaned: '', status: 'Active', motor1Status: 'Running', motor2Status: 'Standby' }])} style={{ padding: '8px 16px', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>+ Add OHT</button>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto' }}>
                    {newOhts.map((u, i) => (
                      <div key={`newOhts-${i}`} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                          <FieldBox label="OHT ID"><input style={inp} value={u.ohtId} onChange={e => { const n = [...newOhts]; n[i].ohtId = e.target.value; setNewOhts(n); }} placeholder="e.g. OHT-05" required /></FieldBox>
                          <FieldBox label="Location"><input style={inp} value={u.location} onChange={e => { const n = [...newOhts]; n[i].location = e.target.value; setNewOhts(n); }} /></FieldBox>
                          <FieldBox label="Capacity"><input style={inp} value={u.capacity} onChange={e => { const n = [...newOhts]; n[i].capacity = e.target.value; setNewOhts(n); }} placeholder="e.g. 20,000 L" /></FieldBox>
                          <FieldBox label="Last Cleaned"><input type="date" style={inp} value={u.lastCleaned} onChange={e => { const n = [...newOhts]; n[i].lastCleaned = e.target.value; setNewOhts(n); }} /></FieldBox>
                          <FieldBox label="Status">
                            <select style={inp} value={u.status} onChange={e => { const n = [...newOhts]; n[i].status = e.target.value; setNewOhts(n); }}>
                              <option>Active</option><option>Maintenance</option><option>Inactive</option>
                            </select>
                          </FieldBox>
                          <FieldBox label="Motor 1 Status">
                            <select style={inp} value={u.motor1Status || 'Running'} onChange={e => { const n = [...newOhts]; n[i].motor1Status = e.target.value; setNewOhts(n); }}>
                              <option>Running</option><option>Standby</option><option>In Stock</option><option>Maintenance</option>
                            </select>
                          </FieldBox>
                          <FieldBox label="Motor 2 Status">
                            <select style={inp} value={u.motor2Status || 'Standby'} onChange={e => { const n = [...newOhts]; n[i].motor2Status = e.target.value; setNewOhts(n); }}>
                              <option>Running</option><option>Standby</option><option>In Stock</option><option>Maintenance</option>
                            </select>
                          </FieldBox>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                          <button onClick={() => setNewOhts(newOhts.filter((_, idx) => idx !== i))} style={{ padding: '10px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Cancel</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {newOhts.length > 0 && (
                    <div style={{ marginTop: '16px', textAlign: 'right' }}>
                      <button style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }} 
                        onClick={() => post(`${API}/add-ohts`, newOhts, 'OHTs added!', () => setNewOhts([]))}>
                        Save New OHTs
                      </button>
                    </div>
                  )}
                </div>

                {existingOhts.length > 0 && (
                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, color: '#0f172a' }}>📋 Existing OHTs</h4>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                      {existingOhts.map((u, i) => (
                        <div key={u.id || i} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                            <FieldBox label="OHT ID"><input style={{...inp, background: '#f1f5f9'}} value={u.ohtId || ''} onChange={e => { const n = [...existingOhts]; n[i].ohtId = e.target.value; setExistingOhts(n); }} /></FieldBox>
                            <FieldBox label="Location"><input style={{...inp, background: '#f1f5f9'}} value={u.location || ''} onChange={e => { const n = [...existingOhts]; n[i].location = e.target.value; setExistingOhts(n); }} /></FieldBox>
                            <FieldBox label="Capacity"><input style={{...inp, background: '#f1f5f9'}} value={u.capacity || ''} onChange={e => { const n = [...existingOhts]; n[i].capacity = e.target.value; setExistingOhts(n); }} /></FieldBox>
                            <FieldBox label="Last Cleaned"><input type="date" style={{...inp, background: '#f1f5f9'}} value={u.lastCleaned || ''} onChange={e => { const n = [...existingOhts]; n[i].lastCleaned = e.target.value; setExistingOhts(n); }} /></FieldBox>
                            <FieldBox label="Status">
                              <select style={{...inp, background: '#f1f5f9'}} value={u.status || ''} onChange={e => { const n = [...existingOhts]; n[i].status = e.target.value; setExistingOhts(n); }}>
                                <option>Active</option><option>Maintenance</option><option>Inactive</option>
                              </select>
                            </FieldBox>
                            <FieldBox label="Motor 1 Status">
                              <select style={{...inp, background: '#f1f5f9'}} value={u.motor1Status || 'Running'} onChange={e => { const n = [...existingOhts]; n[i].motor1Status = e.target.value; setExistingOhts(n); }}>
                                <option>Running</option><option>Standby</option><option>In Stock</option><option>Maintenance</option>
                              </select>
                            </FieldBox>
                            <FieldBox label="Motor 2 Status">
                              <select style={{...inp, background: '#f1f5f9'}} value={u.motor2Status || 'Standby'} onChange={e => { const n = [...existingOhts]; n[i].motor2Status = e.target.value; setExistingOhts(n); }}>
                                <option>Running</option><option>Standby</option><option>In Stock</option><option>Maintenance</option>
                              </select>
                            </FieldBox>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => post(`${API}/add-ohts`, [u], 'OHT updated!')} style={{ padding: '10px 14px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>💾 Update</button>
                            <button onClick={() => handleDelete(`${API}/delete-oht?id=${u.id}`, 'OHT')} style={{ padding: '10px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'manpower' && (
              <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, color: '#0f172a' }}>👷 Manpower Data Entry</h4>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <label style={{ cursor: 'pointer', padding: '8px 16px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                        + Upload Excel
                        <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => handleGenericFileUpload(setNewManpower, { empId: '', name: '', designation: '', contact: '', skill: '', type: 'Permanent', shift: 'Morning', status: 'Active', attendance: 'Present', assignedArea: '' }, e)} style={{ display: 'none' }} />
                      </label>
                      <button onClick={() => setNewManpower([...newManpower, { empId: '', name: '', designation: '', contact: '', skill: '', type: 'Permanent', shift: 'Morning', status: 'Active', attendance: 'Present', assignedArea: '' }])} style={{ padding: '8px 16px', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>+ Add Personnel</button>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto' }}>
                    {newManpower.map((u, i) => (
                      <div key={`newManpower-${i}`} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                          <FieldBox label="Emp ID"><input style={inp} value={u.empId} onChange={e => { const n = [...newManpower]; n[i].empId = e.target.value; setNewManpower(n); }} placeholder="e.g. EMP-01" required /></FieldBox>
                          <FieldBox label="Name"><input style={inp} value={u.name} onChange={e => { const n = [...newManpower]; n[i].name = e.target.value; setNewManpower(n); }} /></FieldBox>
                          <FieldBox label="Designation"><input style={inp} value={u.designation} onChange={e => { const n = [...newManpower]; n[i].designation = e.target.value; setNewManpower(n); }} /></FieldBox>
                          <FieldBox label="Contact"><input style={inp} value={u.contact} onChange={e => { const n = [...newManpower]; n[i].contact = e.target.value; setNewManpower(n); }} /></FieldBox>
                          <FieldBox label="Skill"><input style={inp} value={u.skill} onChange={e => { const n = [...newManpower]; n[i].skill = e.target.value; setNewManpower(n); }} /></FieldBox>
                          <FieldBox label="Type">
                            <select style={inp} value={u.type} onChange={e => { const n = [...newManpower]; n[i].type = e.target.value; setNewManpower(n); }}>
                              <option>Permanent</option><option>Contract</option><option>Outsourced</option>
                            </select>
                          </FieldBox>
                          <FieldBox label="Shift">
                            <select style={inp} value={u.shift} onChange={e => { const n = [...newManpower]; n[i].shift = e.target.value; setNewManpower(n); }}>
                              <option>Morning</option><option>General</option><option>Evening</option><option>Night</option>
                            </select>
                          </FieldBox>
                          <FieldBox label="Status">
                            <select style={inp} value={u.status} onChange={e => { const n = [...newManpower]; n[i].status = e.target.value; setNewManpower(n); }}>
                              <option>Active</option><option>On Leave</option><option>Inactive</option>
                            </select>
                          </FieldBox>
                          <FieldBox label="Attendance">
                            <select style={inp} value={u.attendance} onChange={e => { const n = [...newManpower]; n[i].attendance = e.target.value; setNewManpower(n); }}>
                              <option>Present</option><option>Absent</option><option>On Leave</option>
                            </select>
                          </FieldBox>
                          <FieldBox label="Assigned Area"><input style={inp} value={u.assignedArea} onChange={e => { const n = [...newManpower]; n[i].assignedArea = e.target.value; setNewManpower(n); }} /></FieldBox>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                          <button onClick={() => setNewManpower(newManpower.filter((_, idx) => idx !== i))} style={{ padding: '10px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Cancel</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {newManpower.length > 0 && (
                    <div style={{ marginTop: '16px', textAlign: 'right' }}>
                      <button style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }} 
                        onClick={() => post(`${API}/add-manpower`, newManpower, 'Manpower added!', () => setNewManpower([]))}>
                        Save New Personnel
                      </button>
                    </div>
                  )}
                </div>

                {existingManpower.length > 0 && (
                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, color: '#0f172a' }}>📋 Existing Manpower</h4>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                      {existingManpower.map((u, i) => (
                        <div key={u.id || i} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                            <FieldBox label="Emp ID"><input style={{...inp, background: '#f1f5f9'}} value={u.empId || ''} onChange={e => { const n = [...existingManpower]; n[i].empId = e.target.value; setExistingManpower(n); }} /></FieldBox>
                            <FieldBox label="Name"><input style={{...inp, background: '#f1f5f9'}} value={u.name || ''} onChange={e => { const n = [...existingManpower]; n[i].name = e.target.value; setExistingManpower(n); }} /></FieldBox>
                            <FieldBox label="Designation"><input style={{...inp, background: '#f1f5f9'}} value={u.designation || ''} onChange={e => { const n = [...existingManpower]; n[i].designation = e.target.value; setExistingManpower(n); }} /></FieldBox>
                            <FieldBox label="Contact"><input style={{...inp, background: '#f1f5f9'}} value={u.contact || ''} onChange={e => { const n = [...existingManpower]; n[i].contact = e.target.value; setExistingManpower(n); }} /></FieldBox>
                            <FieldBox label="Skill"><input style={{...inp, background: '#f1f5f9'}} value={u.skill || ''} onChange={e => { const n = [...existingManpower]; n[i].skill = e.target.value; setExistingManpower(n); }} /></FieldBox>
                            <FieldBox label="Type">
                              <select style={{...inp, background: '#f1f5f9'}} value={u.type || ''} onChange={e => { const n = [...existingManpower]; n[i].type = e.target.value; setExistingManpower(n); }}>
                                <option>Permanent</option><option>Contract</option><option>Outsourced</option>
                              </select>
                            </FieldBox>
                            <FieldBox label="Shift">
                              <select style={{...inp, background: '#f1f5f9'}} value={u.shift || ''} onChange={e => { const n = [...existingManpower]; n[i].shift = e.target.value; setExistingManpower(n); }}>
                                <option>Morning</option><option>General</option><option>Evening</option><option>Night</option>
                              </select>
                            </FieldBox>
                            <FieldBox label="Status">
                              <select style={{...inp, background: '#f1f5f9'}} value={u.status || ''} onChange={e => { const n = [...existingManpower]; n[i].status = e.target.value; setExistingManpower(n); }}>
                                <option>Active</option><option>On Leave</option><option>Inactive</option>
                              </select>
                            </FieldBox>
                            <FieldBox label="Attendance">
                              <select style={{...inp, background: '#f1f5f9'}} value={u.attendance || ''} onChange={e => { const n = [...existingManpower]; n[i].attendance = e.target.value; setExistingManpower(n); }}>
                                <option>Present</option><option>Absent</option><option>On Leave</option>
                              </select>
                            </FieldBox>
                            <FieldBox label="Assigned Area"><input style={{...inp, background: '#f1f5f9'}} value={u.assignedArea || ''} onChange={e => { const n = [...existingManpower]; n[i].assignedArea = e.target.value; setExistingManpower(n); }} /></FieldBox>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => post(`${API}/add-manpower`, [u], 'Personnel updated!')} style={{ padding: '10px 14px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>💾 Update</button>
                            <button onClick={() => handleDelete(`${API}/delete-manpower?id=${u.id}`, 'Personnel')} style={{ padding: '10px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'runtime' && (
              <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, color: '#0f172a' }}>⏱️ Daily Run Time</h4>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <label style={{ cursor: 'pointer', padding: '8px 16px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                        + Upload Excel
                        <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => handleGenericFileUpload(setNewRuntimes, { date: new Date().toISOString().split('T')[0], motorId: '', s1: '', s2: '', s3: '', s4: '' }, e)} style={{ display: 'none' }} />
                      </label>
                      <button onClick={() => setNewRuntimes([...newRuntimes, { date: new Date().toISOString().split('T')[0], motorId: '', s1: '', s2: '', s3: '', s4: '' }])} style={{ padding: '8px 16px', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>+ Add Runtime Log</button>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto' }}>
                    {newRuntimes.map((u, i) => (
                      <div key={`newRuntimes-${i}`} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                          <FieldBox label="Date"><input type="date" style={inp} value={u.date} onChange={e => { const n = [...newRuntimes]; n[i].date = e.target.value; setNewRuntimes(n); }} required /></FieldBox>
                          <FieldBox label="Motor ID">
                            <select style={inp} value={u.motorId} onChange={e => { const n = [...newRuntimes]; n[i].motorId = e.target.value; setNewRuntimes(n); }} required>
                              <option value="">Select Motor...</option>
                              {existingMotors.map(m => <option key={m.id} value={m.motorId}>{m.motorId} - {m.location}</option>)}
                            </select>
                          </FieldBox>
                          <FieldBox label="Morning Peak (6AM-10AM)"><input type="number" step="0.5" max="4" min="0" style={inp} value={u.s1} onChange={e => { const n = [...newRuntimes]; n[i].s1 = e.target.value; setNewRuntimes(n); }} /></FieldBox>
                          <FieldBox label="Day Off-Peak (10AM-6PM)"><input type="number" step="0.5" max="8" min="0" style={inp} value={u.s2} onChange={e => { const n = [...newRuntimes]; n[i].s2 = e.target.value; setNewRuntimes(n); }} /></FieldBox>
                          <FieldBox label="Evening Peak (6PM-10PM)"><input type="number" step="0.5" max="4" min="0" style={inp} value={u.s3} onChange={e => { const n = [...newRuntimes]; n[i].s3 = e.target.value; setNewRuntimes(n); }} /></FieldBox>
                          <FieldBox label="Night Time (10PM-6AM)"><input type="number" step="0.5" max="8" min="0" style={inp} value={u.s4} onChange={e => { const n = [...newRuntimes]; n[i].s4 = e.target.value; setNewRuntimes(n); }} /></FieldBox>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                          <button onClick={() => setNewRuntimes(newRuntimes.filter((_, idx) => idx !== i))} style={{ padding: '10px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Cancel</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {newRuntimes.length > 0 && (
                    <div style={{ marginTop: '16px', textAlign: 'right' }}>
                      <button style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }} 
                        onClick={() => {
                          const payload = newRuntimes.map(u => ({
                            ...u,
                            peakRun: ((parseFloat(u.s1) || 0) + (parseFloat(u.s3) || 0)).toString(),
                            offPeakRun: (parseFloat(u.s2) || 0).toString(),
                            nightRun: (parseFloat(u.s4) || 0).toString()
                          }));
                          post(`${API}/add-runtime`, payload, 'Runtimes added!', () => setNewRuntimes([]));
                        }}>
                        Save New Runtimes
                      </button>
                    </div>
                  )}
                </div>

                {existingRuntimes.length > 0 && (
                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, color: '#0f172a' }}>📋 Existing Runtimes</h4>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                      {existingRuntimes.map((u, i) => (
                        <div key={u.id || i} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                            <FieldBox label="Date"><input type="date" style={{...inp, background: '#f1f5f9'}} value={u.date || ''} onChange={e => { const n = [...existingRuntimes]; n[i].date = e.target.value; setExistingRuntimes(n); }} /></FieldBox>
                            <FieldBox label="Motor ID">
                              <select style={{...inp, background: '#f1f5f9'}} value={u.motorId || ''} onChange={e => { const n = [...existingRuntimes]; n[i].motorId = e.target.value; setExistingRuntimes(n); }}>
                                <option value="">Select...</option>
                                {existingMotors.map(m => <option key={m.id} value={m.motorId}>{m.motorId} - {m.location}</option>)}
                              </select>
                            </FieldBox>
                            <FieldBox label="Morning Peak (6AM-10AM)"><input type="number" style={{...inp, background: '#f1f5f9'}} value={u.s1 || ''} onChange={e => { const n = [...existingRuntimes]; n[i].s1 = e.target.value; setExistingRuntimes(n); }} /></FieldBox>
                            <FieldBox label="Day Off-Peak (10AM-6PM)"><input type="number" style={{...inp, background: '#f1f5f9'}} value={u.s2 || ''} onChange={e => { const n = [...existingRuntimes]; n[i].s2 = e.target.value; setExistingRuntimes(n); }} /></FieldBox>
                            <FieldBox label="Evening Peak (6PM-10PM)"><input type="number" style={{...inp, background: '#f1f5f9'}} value={u.s3 || ''} onChange={e => { const n = [...existingRuntimes]; n[i].s3 = e.target.value; setExistingRuntimes(n); }} /></FieldBox>
                            <FieldBox label="Night Time (10PM-6AM)"><input type="number" style={{...inp, background: '#f1f5f9'}} value={u.s4 || ''} onChange={e => { const n = [...existingRuntimes]; n[i].s4 = e.target.value; setExistingRuntimes(n); }} /></FieldBox>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => {
                              const payload = {
                                ...u,
                                peakRun: ((parseFloat(u.s1) || 0) + (parseFloat(u.s3) || 0)).toString(),
                                offPeakRun: (parseFloat(u.s2) || 0).toString(),
                                nightRun: (parseFloat(u.s4) || 0).toString()
                              };
                              post(`${API}/add-runtime`, [payload], 'Runtime updated!');
                            }} style={{ padding: '10px 14px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>💾 Update</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {tab === 'riverIntake' && (
              <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, color: '#0f172a' }}>🌊 Source Water Intake Data Entry</h4>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <label style={{ cursor: 'pointer', padding: '8px 16px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                        + Upload Excel
                        <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => handleGenericFileUpload(setNewRiverIntakes, { date: new Date().toISOString().split('T')[0], intake: '', borewell: '', well: '', remarks: '' }, e)} style={{ display: 'none' }} />
                      </label>
                      <button onClick={() => setNewRiverIntakes([...newRiverIntakes, { date: new Date().toISOString().split('T')[0], intake: '', borewell: '', well: '', remarks: '' }])} style={{ padding: '8px 16px', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>+ Add Intake Log</button>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto' }}>
                    {newRiverIntakes.map((u, i) => (
                      <div key={`newRiverIntakes-${i}`} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                          <FieldBox label="Date"><input type="date" style={inp} value={u.date} onChange={e => { const n = [...newRiverIntakes]; n[i].date = e.target.value; setNewRiverIntakes(n); }} required /></FieldBox>
                          <FieldBox label="River (KL)"><input type="number" style={inp} value={u.intake} onChange={e => { const n = [...newRiverIntakes]; n[i].intake = e.target.value; setNewRiverIntakes(n); }} placeholder="e.g. 150" required /></FieldBox>
                          <FieldBox label="Borewell (KL)"><input type="number" style={inp} value={u.borewell} onChange={e => { const n = [...newRiverIntakes]; n[i].borewell = e.target.value; setNewRiverIntakes(n); }} placeholder="e.g. 80" /></FieldBox>
                          <FieldBox label="Open Well (KL)"><input type="number" style={inp} value={u.well} onChange={e => { const n = [...newRiverIntakes]; n[i].well = e.target.value; setNewRiverIntakes(n); }} placeholder="e.g. 40" /></FieldBox>
                          <FieldBox label="Remarks"><input style={inp} value={u.remarks || ''} onChange={e => { const n = [...newRiverIntakes]; n[i].remarks = e.target.value; setNewRiverIntakes(n); }} placeholder="e.g. Normal" /></FieldBox>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                          <button onClick={() => setNewRiverIntakes(newRiverIntakes.filter((_, idx) => idx !== i))} style={{ padding: '10px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Cancel</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {newRiverIntakes.length > 0 && (
                    <div style={{ marginTop: '16px', textAlign: 'right' }}>
                      <button style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }} 
                        onClick={() => {
                          const payload = newRiverIntakes.map(u => ({ ...u, intake: parseFloat(u.intake) || 0, borewell: parseFloat(u.borewell) || 0, well: parseFloat(u.well) || 0 }));
                          post(`${API}/add-river-intake`, payload, 'Source Intake logs added!', () => setNewRiverIntakes([]));
                        }}>
                        Save New Logs
                      </button>
                    </div>
                  )}
                </div>

                {existingRiverIntakes.length > 0 && (
                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, color: '#0f172a' }}>📋 Existing Source Intake Logs</h4>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                      {existingRiverIntakes.map((u, i) => (
                        <div key={u.id || i} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                            <FieldBox label="Date"><input type="date" style={{...inp, background: '#f1f5f9'}} value={u.date || ''} onChange={e => { const n = [...existingRiverIntakes]; n[i].date = e.target.value; setExistingRiverIntakes(n); }} /></FieldBox>
                            <FieldBox label="River (KL)"><input type="number" style={{...inp, background: '#f1f5f9'}} value={u.intake || ''} onChange={e => { const n = [...existingRiverIntakes]; n[i].intake = parseFloat(e.target.value) || 0; setExistingRiverIntakes(n); }} /></FieldBox>
                            <FieldBox label="Borewell (KL)"><input type="number" style={{...inp, background: '#f1f5f9'}} value={u.borewell || ''} onChange={e => { const n = [...existingRiverIntakes]; n[i].borewell = parseFloat(e.target.value) || 0; setExistingRiverIntakes(n); }} /></FieldBox>
                            <FieldBox label="Open Well (KL)"><input type="number" style={{...inp, background: '#f1f5f9'}} value={u.well || ''} onChange={e => { const n = [...existingRiverIntakes]; n[i].well = parseFloat(e.target.value) || 0; setExistingRiverIntakes(n); }} /></FieldBox>
                            <FieldBox label="Remarks"><input style={{...inp, background: '#f1f5f9'}} value={u.remarks || ''} onChange={e => { const n = [...existingRiverIntakes]; n[i].remarks = e.target.value; setExistingRiverIntakes(n); }} /></FieldBox>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => post(`${API}/add-river-intake`, [u], 'Source Intake log updated!')} style={{ padding: '10px 14px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>💾 Update</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}


            {tab === 'borewells' && (
              <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, color: '#0f172a' }}>💧 Borewells Data Entry</h4>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <label style={{ cursor: 'pointer', padding: '8px 16px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                        + Upload Excel
                        <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => handleGenericFileUpload(setNewBorewells, { borewellId: '', location: '', depth: '', motorHp: '', motor: '', motorType: '', hoseLength: '', status: 'Active' }, e)} style={{ display: 'none' }} />
                      </label>
                      <button onClick={() => setNewBorewells([...newBorewells, { borewellId: '', location: '', depth: '', motorHp: '', motor: '', motorType: '', hoseLength: '', status: 'Active' }])} style={{ padding: '8px 16px', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>+ Add Borewell</button>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto' }}>
                    {newBorewells.map((u, i) => (
                      <div key={`newBorewells-${i}`} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                          <FieldBox label="Borewell ID"><input style={inp} value={u.borewellId} onChange={e => { const n = [...newBorewells]; n[i].borewellId = e.target.value; setNewBorewells(n); }} placeholder="e.g. BW-01" required /></FieldBox>
                          <FieldBox label="Location"><input style={inp} value={u.location} onChange={e => { const n = [...newBorewells]; n[i].location = e.target.value; setNewBorewells(n); }} placeholder="e.g. North Block" /></FieldBox>
                          <FieldBox label="Depth (ft)"><input type="number" style={inp} value={u.depth} onChange={e => { const n = [...newBorewells]; n[i].depth = parseFloat(e.target.value) || 0; setNewBorewells(n); }} placeholder="e.g. 500" /></FieldBox>
                          <FieldBox label="Motor HP"><input style={inp} value={u.motorHp} onChange={e => { const n = [...newBorewells]; n[i].motorHp = e.target.value; setNewBorewells(n); }} placeholder="e.g. 10" /></FieldBox>
                          <FieldBox label="Motor Brand"><input style={inp} value={u.motor} onChange={e => { const n = [...newBorewells]; n[i].motor = e.target.value; setNewBorewells(n); }} placeholder="e.g. Texmo" /></FieldBox>
                          <FieldBox label="Motor Type"><input style={inp} value={u.motorType} onChange={e => { const n = [...newBorewells]; n[i].motorType = e.target.value; setNewBorewells(n); }} placeholder="e.g. Submersible" /></FieldBox>
                          <FieldBox label="Hose Length (ft)"><input type="number" style={inp} value={u.hoseLength} onChange={e => { const n = [...newBorewells]; n[i].hoseLength = parseFloat(e.target.value) || 0; setNewBorewells(n); }} placeholder="e.g. 480" /></FieldBox>
                          <FieldBox label="Status">
                            <select style={inp} value={u.status} onChange={e => { const n = [...newBorewells]; n[i].status = e.target.value; setNewBorewells(n); }}>
                              <option>Active</option><option>Maintenance</option><option>Inactive</option>
                            </select>
                          </FieldBox>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                          <button onClick={() => setNewBorewells(newBorewells.filter((_, idx) => idx !== i))} style={{ padding: '10px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Cancel</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {newBorewells.length > 0 && (
                    <div style={{ marginTop: '16px', textAlign: 'right' }}>
                      <button style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }} 
                        onClick={() => post(`${API}/add-borewell`, newBorewells, 'Borewells added!', () => setNewBorewells([]))}>
                        Save New Borewells
                      </button>
                    </div>
                  )}
                </div>

                {existingBorewells.length > 0 && (
                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, color: '#0f172a' }}>📋 Existing Borewells</h4>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                      {existingBorewells.map((u, i) => (
                        <div key={u.id || i} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                            <FieldBox label="Borewell ID"><input style={{...inp, background: '#f1f5f9'}} value={u.borewellId || ''} onChange={e => { const n = [...existingBorewells]; n[i].borewellId = e.target.value; setExistingBorewells(n); }} /></FieldBox>
                            <FieldBox label="Location"><input style={{...inp, background: '#f1f5f9'}} value={u.location || ''} onChange={e => { const n = [...existingBorewells]; n[i].location = e.target.value; setExistingBorewells(n); }} /></FieldBox>
                            <FieldBox label="Depth (ft)"><input type="number" style={{...inp, background: '#f1f5f9'}} value={u.depth || ''} onChange={e => { const n = [...existingBorewells]; n[i].depth = parseFloat(e.target.value) || 0; setExistingBorewells(n); }} /></FieldBox>
                            <FieldBox label="Motor HP"><input style={{...inp, background: '#f1f5f9'}} value={u.motorHp || ''} onChange={e => { const n = [...existingBorewells]; n[i].motorHp = e.target.value; setExistingBorewells(n); }} /></FieldBox>
                            <FieldBox label="Motor Brand"><input style={{...inp, background: '#f1f5f9'}} value={u.motor || ''} onChange={e => { const n = [...existingBorewells]; n[i].motor = e.target.value; setExistingBorewells(n); }} /></FieldBox>
                            <FieldBox label="Motor Type"><input style={{...inp, background: '#f1f5f9'}} value={u.motorType || ''} onChange={e => { const n = [...existingBorewells]; n[i].motorType = e.target.value; setExistingBorewells(n); }} /></FieldBox>
                            <FieldBox label="Hose Length (ft)"><input type="number" style={{...inp, background: '#f1f5f9'}} value={u.hoseLength || ''} onChange={e => { const n = [...existingBorewells]; n[i].hoseLength = parseFloat(e.target.value) || 0; setExistingBorewells(n); }} /></FieldBox>
                            <FieldBox label="Status">
                              <select style={{...inp, background: '#f1f5f9'}} value={u.status || ''} onChange={e => { const n = [...existingBorewells]; n[i].status = e.target.value; setExistingBorewells(n); }}>
                                <option>Active</option><option>Maintenance</option><option>Inactive</option>
                              </select>
                            </FieldBox>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => post(`${API}/add-borewell`, [u], 'Borewell updated!')} style={{ padding: '10px 14px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>💾 Update</button>
                            <button onClick={() => handleDelete(`${API}/delete-borewell?id=${u.id}`, 'Borewell')} style={{ padding: '10px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'wells' && (
              <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, color: '#0f172a' }}>🚰 Open Wells Data Entry</h4>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <label style={{ cursor: 'pointer', padding: '8px 16px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                        + Upload Excel
                        <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => handleGenericFileUpload(setNewWells, { wellId: '', location: '', depth: '', width: '', height: '', motorHp: '', motor: '', motorType: '', hoseLength: '', status: 'Active' }, e)} style={{ display: 'none' }} />
                      </label>
                      <button onClick={() => setNewWells([...newWells, { wellId: '', location: '', depth: '', width: '', height: '', motorHp: '', motor: '', motorType: '', hoseLength: '', status: 'Active' }])} style={{ padding: '8px 16px', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>+ Add Open Well</button>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto' }}>
                    {newWells.map((u, i) => (
                      <div key={`newWells-${i}`} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                          <FieldBox label="Well ID"><input style={inp} value={u.wellId} onChange={e => { const n = [...newWells]; n[i].wellId = e.target.value; setNewWells(n); }} placeholder="e.g. OW-01" required /></FieldBox>
                          <FieldBox label="Location"><input style={inp} value={u.location} onChange={e => { const n = [...newWells]; n[i].location = e.target.value; setNewWells(n); }} placeholder="e.g. Farm Area" /></FieldBox>
                          <FieldBox label="Depth (ft)"><input type="number" style={inp} value={u.depth} onChange={e => { const n = [...newWells]; n[i].depth = parseFloat(e.target.value) || 0; setNewWells(n); }} /></FieldBox>
                          <FieldBox label="Width (ft)"><input type="number" style={inp} value={u.width} onChange={e => { const n = [...newWells]; n[i].width = parseFloat(e.target.value) || 0; setNewWells(n); }} /></FieldBox>
                          <FieldBox label="Height (ft)"><input type="number" style={inp} value={u.height} onChange={e => { const n = [...newWells]; n[i].height = parseFloat(e.target.value) || 0; setNewWells(n); }} /></FieldBox>
                          <FieldBox label="Motor HP"><input style={inp} value={u.motorHp} onChange={e => { const n = [...newWells]; n[i].motorHp = e.target.value; setNewWells(n); }} /></FieldBox>
                          <FieldBox label="Motor Brand"><input style={inp} value={u.motor} onChange={e => { const n = [...newWells]; n[i].motor = e.target.value; setNewWells(n); }} /></FieldBox>
                          <FieldBox label="Motor Type"><input style={inp} value={u.motorType} onChange={e => { const n = [...newWells]; n[i].motorType = e.target.value; setNewWells(n); }} /></FieldBox>
                          <FieldBox label="Hose (ft)"><input type="number" style={inp} value={u.hoseLength} onChange={e => { const n = [...newWells]; n[i].hoseLength = parseFloat(e.target.value) || 0; setNewWells(n); }} /></FieldBox>
                          <FieldBox label="Status">
                            <select style={inp} value={u.status} onChange={e => { const n = [...newWells]; n[i].status = e.target.value; setNewWells(n); }}>
                              <option>Active</option><option>Maintenance</option><option>Inactive</option>
                            </select>
                          </FieldBox>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                          <button onClick={() => setNewWells(newWells.filter((_, idx) => idx !== i))} style={{ padding: '10px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Cancel</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {newWells.length > 0 && (
                    <div style={{ marginTop: '16px', textAlign: 'right' }}>
                      <button style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }} 
                        onClick={() => post(`${API}/add-well`, newWells, 'Wells added!', () => setNewWells([]))}>
                        Save New Wells
                      </button>
                    </div>
                  )}
                </div>

                {existingWells.length > 0 && (
                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, color: '#0f172a' }}>📋 Existing Open Wells</h4>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                      {existingWells.map((u, i) => (
                        <div key={u.id || i} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                            <FieldBox label="Well ID"><input style={{...inp, background: '#f1f5f9'}} value={u.wellId || ''} onChange={e => { const n = [...existingWells]; n[i].wellId = e.target.value; setExistingWells(n); }} /></FieldBox>
                            <FieldBox label="Location"><input style={{...inp, background: '#f1f5f9'}} value={u.location || ''} onChange={e => { const n = [...existingWells]; n[i].location = e.target.value; setExistingWells(n); }} /></FieldBox>
                            <FieldBox label="Depth (ft)"><input type="number" style={{...inp, background: '#f1f5f9'}} value={u.depth || ''} onChange={e => { const n = [...existingWells]; n[i].depth = parseFloat(e.target.value) || 0; setExistingWells(n); }} /></FieldBox>
                            <FieldBox label="Width (ft)"><input type="number" style={{...inp, background: '#f1f5f9'}} value={u.width || ''} onChange={e => { const n = [...existingWells]; n[i].width = parseFloat(e.target.value) || 0; setExistingWells(n); }} /></FieldBox>
                            <FieldBox label="Height (ft)"><input type="number" style={{...inp, background: '#f1f5f9'}} value={u.height || ''} onChange={e => { const n = [...existingWells]; n[i].height = parseFloat(e.target.value) || 0; setExistingWells(n); }} /></FieldBox>
                            <FieldBox label="Motor HP"><input style={{...inp, background: '#f1f5f9'}} value={u.motorHp || ''} onChange={e => { const n = [...existingWells]; n[i].motorHp = e.target.value; setExistingWells(n); }} /></FieldBox>
                            <FieldBox label="Motor Brand"><input style={{...inp, background: '#f1f5f9'}} value={u.motor || ''} onChange={e => { const n = [...existingWells]; n[i].motor = e.target.value; setExistingWells(n); }} /></FieldBox>
                            <FieldBox label="Motor Type"><input style={{...inp, background: '#f1f5f9'}} value={u.motorType || ''} onChange={e => { const n = [...existingWells]; n[i].motorType = e.target.value; setExistingWells(n); }} /></FieldBox>
                            <FieldBox label="Hose (ft)"><input type="number" style={{...inp, background: '#f1f5f9'}} value={u.hoseLength || ''} onChange={e => { const n = [...existingWells]; n[i].hoseLength = parseFloat(e.target.value) || 0; setExistingWells(n); }} /></FieldBox>
                            <FieldBox label="Status">
                              <select style={{...inp, background: '#f1f5f9'}} value={u.status || ''} onChange={e => { const n = [...existingWells]; n[i].status = e.target.value; setExistingWells(n); }}>
                                <option>Active</option><option>Maintenance</option><option>Inactive</option>
                              </select>
                            </FieldBox>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => post(`${API}/add-well`, [u], 'Well updated!')} style={{ padding: '10px 14px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>💾 Update</button>
                            <button onClick={() => handleDelete(`${API}/delete-well?id=${u.id}`, 'Well')} style={{ padding: '10px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
         </>
      )}
    </div>
  );
}
