import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

const FieldBox = ({ label, children }) => (
  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
    {children}
  </div>
);

export default function PowerHouseUnitForm({ onClose }) {
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

  // ─── Power House state ──────────────────────────────────────────────────
  const [phTab, setPhTab] = useState('static'); 
  const [phStaticTab, setPhStaticTab] = useState('ebTransformer'); 
  const mkPhSlots = () => Array.from({length: 24}, (_, i) => ({ hour: `${i.toString().padStart(2, '0')}:00`, value: '' }));
  const [phDate, setPhDate] = useState(new Date().toISOString().split('T')[0]);
  const [ebDynamic, setEbDynamic] = useState(mkPhSlots());
  const [solarDynamic, setSolarDynamic] = useState(mkPhSlots());
  const [dgDynamic, setDgDynamic] = useState(mkPhSlots());
  const [dgDailyFuel, setDgDailyFuel] = useState('');
  const [phSaving, setPhSaving] = useState(false);
  const [phSavedMsg, setPhSavedMsg] = useState('');

  const [phTransformers, setPhTransformers] = useState([{ svcNum: '', type: 'Permanent HT', load: '', voltage: '11 kV HT / 415 V LT', ratingMake: '', year: '', feeders: '' }]);
  const [phDGSets, setPhDGSets] = useState([{ ratingMake: '', count: '', year: '', lastService: '', fuelCap: '', status: 'Working' }]);
  const [phUps, setPhUps] = useState([{ location: '', ratingMake: '', lastAmc: '', nextAmc: '', batteryCap: '', batteryDate: '', status: 'Working' }]);
  const [phSolarPv, setPhSolarPv] = useState([{ location: '', capacity: '', panels: '', panelWatts: '', inverterRating: '', inverterService: '', type: 'Local Grid usage', cleaningFreq: 'yes', status: 'Working' }]);
  const [phStaff, setPhStaff] = useState([{ name: '', role: '', shift: 'Morning', attendance: 'Present', contact: '' }]);

  useEffect(() => {
    
      fetch(`http://localhost:8085/api/powerhouse?date=${phDate}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            if (data.transformers && data.transformers.length > 0) {
              setPhTransformers(data.transformers);
            } else {
              setPhTransformers([{ svcNum: '', type: 'Permanent HT', load: '', voltage: '11 kV HT / 415 V LT', ratingMake: '', year: '', feeders: '' }]);
            }

            if (data.dgSets && data.dgSets.length > 0) {
              setPhDGSets(data.dgSets);
            } else {
              setPhDGSets([{ ratingMake: '', count: '', year: '', lastService: '', fuelCap: '', status: 'Working' }]);
            }

            if (data.ups && data.ups.length > 0) {
              setPhUps(data.ups);
            } else {
              setPhUps([{ location: '', ratingMake: '', lastAmc: '', nextAmc: '', batteryCap: '', batteryDate: '', status: 'Working' }]);
            }

            if (data.solarPv && data.solarPv.length > 0) {
              setPhSolarPv(data.solarPv);
            } else {
              setPhSolarPv([{ location: '', capacity: '', panels: '', panelWatts: '', inverterRating: '', inverterService: '', type: 'Local Grid usage', cleaningFreq: 'yes', status: 'Working' }]);
            }

            if (data.staff && data.staff.length > 0) {
              setPhStaff(data.staff);
            } else {
              setPhStaff([{ name: '', role: '', shift: 'Morning', attendance: 'Present', contact: '' }]);
            }

            const fillSlots = (slots, dataArr) => {
              const res = [...slots];
              if (!dataArr) return res;
              dataArr.forEach(d => {
                const idx = res.findIndex(s => s.hour === d.hour);
                if (idx !== -1) {
                  res[idx] = { ...res[idx], value: d.value, generation: d.generation };
                }
              });
              return res;
            };

            setEbDynamic(fillSlots(mkPhSlots(), data.ebDynamic));
            setSolarDynamic(fillSlots(mkPhSlots(), data.solarDynamic));
            setDgDynamic(fillSlots(mkPhSlots(), data.dgDynamic));
            setDgDailyFuel(data.dgDailyFuel || '');
          }
        })
        .catch(console.error);
  }, [phDate]);

  const handlePhDynamicChange = (setter, idx, field, val) => {
      setter(prev => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], [field]: val };
        return copy;
      });
    };

    const handlePhStaticChange = (setter, idx, field, val) => {
      setter(prev => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], [field]: val };
        return copy;
      });
    };

    const addPhStaticRow = (setter, emptyObj) => {
      setter(prev => [...prev, emptyObj]);
    };

    const removePhStaticRow = (setter, idx) => {
      setter(prev => prev.filter((_, i) => i !== idx));
    };

    const savePhData = async () => {
      setPhSaving(true);
      setPhSavedMsg('');
      try {
        const payload = {
          date: phDate,
          transformers: phTransformers,
          dgSets: phDGSets,
          ups: phUps,
          solarPv: phSolarPv,
          staff: phStaff,
          ebDynamic: ebDynamic,
          solarDynamic: solarDynamic,
          dgDynamic: dgDynamic,
          dgDailyFuel: parseFloat(dgDailyFuel) || 0
        };
        const res = await fetch('http://localhost:8085/api/powerhouse/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Network response was not ok');
        setPhSavedMsg('Power House data saved successfully!');
        window.dispatchEvent(new Event('unit-form-updated'));
        setTimeout(() => setPhSavedMsg(''), 3000);
      } catch (err) {
        console.error(err);
        setPhSavedMsg('Failed to save data');
      } finally {
        setPhSaving(false);
      }
    };

    return (
      <div className="unit-form-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Power House Details Update</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Manage static inventory and dynamic hourly consumption logs.</p>
          </div>
          {phSavedMsg && (
            <div style={{ padding: '8px 16px', background: phSavedMsg.includes('Failed') ? '#fee2e2' : '#dcfce7', color: phSavedMsg.includes('Failed') ? '#991b1b' : '#166534', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
              {phSavedMsg}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          {['static', 'eb_dynamic', 'solar_dynamic', 'dg_dynamic'].map(tab => (
            <button
              key={tab}
              onClick={() => setPhTab(tab)}
              style={{
                padding: '8px 16px',
                background: phTab === tab ? '#1e293b' : '#f1f5f9',
                color: phTab === tab ? '#fff' : '#475569',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'uppercase',
                fontSize: '0.8rem'
              }}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {phTab === 'static' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {[
                { id: 'ebTransformer', label: 'EB Transformer' },
                { id: 'dgSets', label: 'DG Sets' },
                { id: 'ups', label: 'UPS / Battery' },
                { id: 'solarPv', label: 'Solar PV Plant' },
                { id: 'staff', label: 'Staff' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setPhStaticTab(t.id)}
                  style={{
                    padding: '6px 14px',
                    background: phStaticTab === t.id ? '#3b82f6' : '#fff',
                    color: phStaticTab === t.id ? '#fff' : '#64748b',
                    border: '1px solid',
                    borderColor: phStaticTab === t.id ? '#3b82f6' : '#cbd5e1',
                    borderRadius: '999px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {phStaticTab === 'ebTransformer' && (
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, color: '#1e293b' }}>EB Transformers</h4>
                  <label style={{ cursor: 'pointer', padding: '6px 12px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem' }}>
                    + Upload Excel
                    <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => handleGenericFileUpload(setPhTransformers, { svcNum: '', type: 'Permanent HT', load: '', voltage: '11 kV HT / 415 V LT', ratingMake: '', year: '', feeders: '' }, e)} style={{ display: 'none' }} />
                  </label>
                </div>
                {phTransformers.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px', padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', position: 'relative' }}>
                    {phTransformers.length > 1 && (
                      <button onClick={() => removePhStaticRow(setPhTransformers, idx)} style={{ position: 'absolute', top: '8px', right: '8px', background: '#fee2e2', color: '#ef4444', border: 'none', width: '24px', height: '24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>&times;</button>
                    )}
                    <FieldBox label="Service connection number">
                      <input type="text" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.svcNum} onChange={e => handlePhStaticChange(setPhTransformers, idx, 'svcNum', e.target.value)} placeholder="e.g. 49094360091" />
                    </FieldBox>
                    <FieldBox label="Service Type">
                      <select style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.type} onChange={e => handlePhStaticChange(setPhTransformers, idx, 'type', e.target.value)}>
                        <option value="Permanent HT">Permanent HT</option>
                        <option value="Temporary LT">Temporary LT</option>
                      </select>
                    </FieldBox>
                    <FieldBox label="Sanctioned load / Demand">
                      <input type="text" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.load} onChange={e => handlePhStaticChange(setPhTransformers, idx, 'load', e.target.value)} placeholder="e.g. 1675 KVA" />
                    </FieldBox>
                    <FieldBox label="Supply voltage (HT/LT)">
                      <select style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.voltage} onChange={e => handlePhStaticChange(setPhTransformers, idx, 'voltage', e.target.value)}>
                        <option value="11 kV HT / 415 V LT">11 kV HT / 415 V LT</option>
                        <option value="415 V LT / 230 V LT">415 V LT / 230 V LT</option>
                      </select>
                    </FieldBox>
                    <FieldBox label="Transformer rating & make">
                      <input type="text" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.ratingMake} onChange={e => handlePhStaticChange(setPhTransformers, idx, 'ratingMake', e.target.value)} placeholder="e.g. 600KVA & EESNAR" />
                    </FieldBox>
                    <FieldBox label="Installation year">
                      <input type="text" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.year} onChange={e => handlePhStaticChange(setPhTransformers, idx, 'year', e.target.value)} placeholder="e.g. 2023" />
                    </FieldBox>
                    <FieldBox label="Number of feeders">
                      <input type="text" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.feeders} onChange={e => handlePhStaticChange(setPhTransformers, idx, 'feeders', e.target.value)} placeholder="e.g. 10" />
                    </FieldBox>
                  </div>
                ))}
                <button onClick={() => addPhStaticRow(setPhTransformers, { svcNum: '', type: 'Permanent HT', load: '', voltage: '11 kV HT / 415 V LT', ratingMake: '', year: '', feeders: '' })} style={{ padding: '8px 16px', background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>+ Add Transformer</button>
              </div>
            )}

            {phStaticTab === 'dgSets' && (
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, color: '#1e293b' }}>Diesel Generators (DG)</h4>
                  <label style={{ cursor: 'pointer', padding: '6px 12px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem' }}>
                    + Upload Excel
                    <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => handleGenericFileUpload(setPhDGSets, { ratingMake: '', count: '', year: '', lastService: '', fuelCap: '', status: 'Working' }, e)} style={{ display: 'none' }} />
                  </label>
                </div>
                {phDGSets.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px', padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', position: 'relative' }}>
                    {phDGSets.length > 1 && (
                      <button onClick={() => removePhStaticRow(setPhDGSets, idx)} style={{ position: 'absolute', top: '8px', right: '8px', background: '#fee2e2', color: '#ef4444', border: 'none', width: '24px', height: '24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>&times;</button>
                    )}
                    <FieldBox label="DG set rating & make">
                      <input type="text" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.ratingMake} onChange={e => handlePhStaticChange(setPhDGSets, idx, 'ratingMake', e.target.value)} placeholder="e.g. 750 KVA" />
                    </FieldBox>
                    <FieldBox label="Number of DG sets">
                      <input type="text" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.count} onChange={e => handlePhStaticChange(setPhDGSets, idx, 'count', e.target.value)} placeholder="e.g. 1 nos" />
                    </FieldBox>
                    <FieldBox label="Installation date">
                      <input type="text" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.year} onChange={e => handlePhStaticChange(setPhDGSets, idx, 'year', e.target.value)} placeholder="e.g. 2009" />
                    </FieldBox>
                    <FieldBox label="Last service date">
                      <input type="text" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.lastService} onChange={e => handlePhStaticChange(setPhDGSets, idx, 'lastService', e.target.value)} placeholder="e.g. 04.05.2025" />
                    </FieldBox>
                    <FieldBox label="Fuel tank capacity">
                      <input type="text" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.fuelCap} onChange={e => handlePhStaticChange(setPhDGSets, idx, 'fuelCap', e.target.value)} placeholder="e.g. 1000 ltrs" />
                    </FieldBox>
                    <FieldBox label="Working Status">
                      <select style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.status} onChange={e => handlePhStaticChange(setPhDGSets, idx, 'status', e.target.value)}>
                        <option value="Working">Working</option>
                        <option value="Not Working">Not Working</option>
                      </select>
                    </FieldBox>
                  </div>
                ))}
                <button onClick={() => addPhStaticRow(setPhDGSets, { ratingMake: '', count: '', year: '', lastService: '', fuelCap: '', status: 'Working' })} style={{ padding: '8px 16px', background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>+ Add DG Set</button>
              </div>
            )}

            {phStaticTab === 'ups' && (
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, color: '#1e293b' }}>UPS / Battery</h4>
                  <label style={{ cursor: 'pointer', padding: '6px 12px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem' }}>
                    + Upload Excel
                    <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => handleGenericFileUpload(setPhUps, { location: '', ratingMake: '', lastAmc: '', nextAmc: '', batteryCap: '', batteryDate: '', status: 'Working' }, e)} style={{ display: 'none' }} />
                  </label>
                </div>
                {phUps.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px', padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', position: 'relative' }}>
                    {phUps.length > 1 && (
                      <button onClick={() => removePhStaticRow(setPhUps, idx)} style={{ position: 'absolute', top: '8px', right: '8px', background: '#fee2e2', color: '#ef4444', border: 'none', width: '24px', height: '24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>&times;</button>
                    )}
                    <FieldBox label="Location">
                      <input type="text" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.location} onChange={e => handlePhStaticChange(setPhUps, idx, 'location', e.target.value)} placeholder="e.g. PRINCIPAL OFFICE" />
                    </FieldBox>
                    <FieldBox label="UPS rating & make">
                      <input type="text" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.ratingMake} onChange={e => handlePhStaticChange(setPhUps, idx, 'ratingMake', e.target.value)} placeholder="e.g. 30 KVA & Neumaric" />
                    </FieldBox>
                    <FieldBox label="Last AMC date">
                      <input type="date" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.lastAmc} onChange={e => handlePhStaticChange(setPhUps, idx, 'lastAmc', e.target.value)} />
                    </FieldBox>
                    <FieldBox label="Next AMC date">
                      <input type="date" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.nextAmc} onChange={e => handlePhStaticChange(setPhUps, idx, 'nextAmc', e.target.value)} />
                    </FieldBox>
                    <FieldBox label="Battery capacity">
                      <input type="text" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.batteryCap} onChange={e => handlePhStaticChange(setPhUps, idx, 'batteryCap', e.target.value)} placeholder="e.g. 100 Ah & 30 Nos" />
                    </FieldBox>
                    <FieldBox label="Installation date">
                      <input type="date" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.batteryDate} onChange={e => handlePhStaticChange(setPhUps, idx, 'batteryDate', e.target.value)} />
                    </FieldBox>
                    <FieldBox label="Working Status">
                      <select style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.status} onChange={e => handlePhStaticChange(setPhUps, idx, 'status', e.target.value)}>
                        <option value="Working">Working</option>
                        <option value="Not Working">Not Working</option>
                      </select>
                    </FieldBox>
                  </div>
                ))}
                <button onClick={() => addPhStaticRow(setPhUps, { location: '', ratingMake: '', lastAmc: '', nextAmc: '', batteryCap: '', batteryDate: '', status: 'Working' })} style={{ padding: '8px 16px', background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>+ Add UPS Unit</button>
              </div>
            )}

            {phStaticTab === 'solarPv' && (
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, color: '#1e293b' }}>Roof Top Solar PV Plant</h4>
                  <label style={{ cursor: 'pointer', padding: '6px 12px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem' }}>
                    + Upload Excel
                    <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => handleGenericFileUpload(setPhSolarPv, { location: '', capacity: '', panels: '', panelWatts: '', inverterRating: '', inverterService: '', type: 'Local Grid usage', cleaningFreq: 'yes', status: 'Working' }, e)} style={{ display: 'none' }} />
                  </label>
                </div>
                {phSolarPv.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px', padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', position: 'relative' }}>
                    {phSolarPv.length > 1 && (
                      <button onClick={() => removePhStaticRow(setPhSolarPv, idx)} style={{ position: 'absolute', top: '8px', right: '8px', background: '#fee2e2', color: '#ef4444', border: 'none', width: '24px', height: '24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>&times;</button>
                    )}
                    <FieldBox label="Location">
                      <input type="text" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.location} onChange={e => handlePhStaticChange(setPhSolarPv, idx, 'location', e.target.value)} placeholder="e.g. Textile lab 1" />
                    </FieldBox>
                    <FieldBox label="Capacity (kWp)">
                      <input type="text" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.capacity} onChange={e => handlePhStaticChange(setPhSolarPv, idx, 'capacity', e.target.value)} placeholder="e.g. 50KW" />
                    </FieldBox>
                    <FieldBox label="Number of panels">
                      <input type="text" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.panels} onChange={e => handlePhStaticChange(setPhSolarPv, idx, 'panels', e.target.value)} placeholder="e.g. 216 nos" />
                    </FieldBox>
                    <FieldBox label="Panel Watts">
                      <input type="text" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.panelWatts} onChange={e => handlePhStaticChange(setPhSolarPv, idx, 'panelWatts', e.target.value)} placeholder="e.g. 235 W" />
                    </FieldBox>
                    <FieldBox label="Inverter rating">
                      <input type="text" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.inverterRating} onChange={e => handlePhStaticChange(setPhSolarPv, idx, 'inverterRating', e.target.value)} placeholder="e.g. 100 KW" />
                    </FieldBox>
                    <FieldBox label="Inverter Service date">
                      <input type="text" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.inverterService} onChange={e => handlePhStaticChange(setPhSolarPv, idx, 'inverterService', e.target.value)} placeholder="e.g. 03.12.2025" />
                    </FieldBox>
                    <FieldBox label="Type">
                      <select style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.type} onChange={e => handlePhStaticChange(setPhSolarPv, idx, 'type', e.target.value)}>
                        <option value="Local Grid usage">Local Grid usage</option>
                        <option value="Grid Connected">Grid Connected</option>
                        <option value="Off Grid with Battery storage">Off Grid with Battery storage</option>
                      </select>
                    </FieldBox>
                    <FieldBox label="Cleaning Frequency">
                      <select style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.cleaningFreq} onChange={e => handlePhStaticChange(setPhSolarPv, idx, 'cleaningFreq', e.target.value)}>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </FieldBox>
                    <FieldBox label="Working Status">
                      <select style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.status} onChange={e => handlePhStaticChange(setPhSolarPv, idx, 'status', e.target.value)}>
                        <option value="Working">Working</option>
                        <option value="Not Working">Not Working</option>
                      </select>
                    </FieldBox>
                  </div>
                ))}
                <button onClick={() => addPhStaticRow(setPhSolarPv, { location: '', capacity: '', panels: '', panelWatts: '', inverterRating: '', inverterService: '', type: 'Local Grid usage', cleaningFreq: 'yes', status: 'Working' })} style={{ padding: '8px 16px', background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>+ Add Solar Plant</button>
              </div>
            )}

            {phStaticTab === 'staff' && (
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, color: '#1e293b' }}>Power House Staff</h4>
                  <label style={{ cursor: 'pointer', padding: '6px 12px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem' }}>
                    + Upload Excel
                    <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => handleGenericFileUpload(setPhStaff, { name: '', role: '', shift: 'Morning', attendance: 'Present', contact: '' }, e)} style={{ display: 'none' }} />
                  </label>
                </div>
                {phStaff.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px', padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', position: 'relative' }}>
                    {phStaff.length > 1 && (
                      <button onClick={() => removePhStaticRow(setPhStaff, idx)} style={{ position: 'absolute', top: '8px', right: '8px', background: '#fee2e2', color: '#ef4444', border: 'none', width: '24px', height: '24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>&times;</button>
                    )}
                    <FieldBox label="Staff Name">
                      <input type="text" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.name} onChange={e => handlePhStaticChange(setPhStaff, idx, 'name', e.target.value)} placeholder="Name" />
                    </FieldBox>
                    <FieldBox label="Role / Designation">
                      <input type="text" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.role} onChange={e => handlePhStaticChange(setPhStaff, idx, 'role', e.target.value)} placeholder="e.g. Chief Operator" />
                    </FieldBox>
                    <FieldBox label="Shift">
                      <select style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.shift} onChange={e => handlePhStaticChange(setPhStaff, idx, 'shift', e.target.value)}>
                        <option value="Morning">Morning</option>
                        <option value="Evening">Evening</option>
                        <option value="Night">Night</option>
                        <option value="General">General</option>
                      </select>
                    </FieldBox>

                    <FieldBox label="Contact Info">
                      <input type="text" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={item.contact} onChange={e => handlePhStaticChange(setPhStaff, idx, 'contact', e.target.value)} placeholder="Phone" />
                    </FieldBox>
                  </div>
                ))}
                <button onClick={() => addPhStaticRow(setPhStaff, { name: '', role: '', shift: 'Morning', attendance: 'Present', contact: '' })} style={{ padding: '8px 16px', background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>+ Add Staff</button>
              </div>
            )}

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={savePhData} disabled={phSaving} style={{ padding: '10px 24px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', opacity: phSaving ? 0.7 : 1 }}>
                {phSaving ? 'Saving...' : 'Save Static Data'}
              </button>
            </div>
          </div>
        )}

        {['eb_dynamic', 'solar_dynamic', 'dg_dynamic'].includes(phTab) && (() => {
          const isEB = phTab === 'eb_dynamic';
          const isSolar = phTab === 'solar_dynamic';
          const isDG = phTab === 'dg_dynamic';
          const title = isEB ? 'EB Dynamic Logs (Hourly Consumption)' : isSolar ? 'Solar Dynamic Logs (Hourly Generation/Consumption)' : 'DG Dynamic Logs (Hourly Consumption & Daily Fuel)';
          const dataArray = isEB ? ebDynamic : isSolar ? solarDynamic : dgDynamic;
          const setter = isEB ? setEbDynamic : isSolar ? setSolarDynamic : setDgDynamic;

          const excelMapping = isSolar ? { hour: '', value: '', generation: '' } : { hour: '', value: '' };

          return (
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <h4 style={{ margin: 0, color: '#1e293b' }}>{title}</h4>
                  <label style={{ cursor: 'pointer', padding: '6px 12px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem' }}>
                    + Upload Excel
                    <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => handleGenericFileUpload(setter, excelMapping, e)} style={{ display: 'none' }} />
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  {isDG && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ea580c' }}>Daily Fuel Usage (Liters):</label>
                      <input type="number" placeholder="Total" value={dgDailyFuel} onChange={e => setDgDailyFuel(e.target.value)} style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', width: '80px', fontSize: '0.85rem' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Date:</label>
                    <input type="date" value={phDate} onChange={e => setPhDate(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                {dataArray.map((slot, idx) => {
                  const isShift = slot.hour.includes('Shift');
                  return (
                  <div key={idx} style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#3b82f6', width: isShift ? '70px' : '40px', wordBreak: 'break-word', lineHeight: '1.2' }}>
                      {isShift ? (
                        <>
                          {slot.hour.split(' ')[0]}<br/>{slot.hour.split(' ')[1]}
                        </>
                      ) : slot.hour}
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <input type="number" placeholder="Consumption (Units)" style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }} value={slot.value || ''} onChange={e => handlePhDynamicChange(setter, idx, 'value', e.target.value)} />
                      {isSolar && (
                        <input type="number" placeholder="Generation (Units)" style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }} value={slot.generation || ''} onChange={e => handlePhDynamicChange(setter, idx, 'generation', e.target.value)} />
                      )}
                    </div>
                  </div>
                )})}
              </div>
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={savePhData} disabled={phSaving} style={{ padding: '10px 24px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', opacity: phSaving ? 0.7 : 1 }}>
                  {phSaving ? 'Saving...' : 'Save Dynamic Logs'}
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    );
}
