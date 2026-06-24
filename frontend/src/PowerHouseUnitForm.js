import { API_BASE } from './config';
import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

const FieldBox = ({ label, children }) => (
  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
    {children}
  </div>
);

const FEEDERS = [
  { id: '101', name: 'Chiller Plant Power 2' },
  { id: '102', name: 'Temporary(Civil Works)' },
  { id: '105', name: 'MV Panel 2' },
  { id: '106', name: 'Training Academy' },
  { id: '107', name: 'MV Panel 3' },
  { id: '108', name: 'Boys Dining Power' },
  { id: '117', name: 'Language Lab' },
  { id: '119', name: 'Pearl Hostel Power' },
  { id: '125', name: 'Day Scholar Dining Hall power' },
  { id: '126', name: 'Biotech Lab' },
  { id: '127', name: 'IT Lab' },
  { id: '128', name: 'SM & FM Lab' },
  { id: '129', name: 'Aero Power / Lighting' },
  { id: '130', name: 'Internet Centre' },
  { id: '131', name: 'CA Block Power Room' },
  { id: '133', name: 'CA lab A/C' },
  { id: '134', name: 'New Library' },
  { id: '135', name: 'Pearl Hostel Lighting' },
  { id: '136', name: 'Spinning Lab' },
  { id: '137', name: 'Lsb1 Corridor Lighting' },
  { id: '138', name: 'Lsb2 Corridor Lighting' },
  { id: '139', name: 'Ganga and Yamuna hostel' },
  { id: '140', name: 'New Mech Light' },
  { id: '141', name: 'Narmadha Hostel and Dining hall' },
  { id: '142', name: 'D.D block' },
  { id: '143', name: 'Boys Hostel Mini Cafe' },
  { id: '144', name: 'Powerhouse Solar' },
  { id: '145', name: 'Diamond Hostel' }
];

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

        const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });
        let data = [];

        const ALIASES = {
          svcnum: ['ebserviceconnectionnumber', 'serviceconnectionnumber', 'servicenumber'],
          type: ['servicetype', 'type'],
          load: ['sanctionedloaddemandkva', 'sanctionedload', 'demand', 'load'],
          voltage: ['supplyvoltagehtlt', 'supplyvoltage', 'voltage'],
          ratingmake: ['transformerratingmake', 'dgsetratingmake', 'upsratingmake', 'ratingmake', 'rating', 'make', 'upsrating'],
          year: ['transformerinstallationyear', 'installationdate', 'installationyear', 'year'],
          feeders: ['numberoffeedersoutgoingpanels', 'numberoffeeders', 'feeders'],
          count: ['numberofdgsets', 'count'],
          lastservice: ['lastservicedate', 'lastservice'],
          fuelcap: ['fueltankcapacity', 'fuelcap'],
          location: ['location'],
          lastamc: ['lastamcdate', 'lastamc'],
          nextamc: ['nextamcdate', 'nextamc'],
          batterycap: ['batterycapacity', 'batterycap', 'capacity', 'ah', 'capacityah'],
          batterydate: ['installationdate', 'batterydate', 'installation'],
          capacity: ['capacitykwp', 'capacity'],
          panels: ['numberofpanels', 'panels'],
          panelwatts: ['panelwatts'],
          inverterrating: ['inverterrating'],
          inverterservice: ['inverterservicedate', 'inverterservice', 'lastservicedateofinverter'],
          cleaningfreq: ['cleaningfrequency', 'cleaningfreq'],
          name: ['staffname', 'name'],
          role: ['roledesignation', 'role'],
          shift: ['shift'],
          contact: ['contactinfo', 'contact'],
          status: ['workingstatus', 'status'],
          hour: ['hour', 'time'],
          value: ['consumption', 'value'],
          generation: ['generation']
        };

        let isTransposed = false;
        let paramRowIndex = -1;

        for (let i = 0; i < Math.min(rawData.length, 10); i++) {
          if (rawData[i] && typeof rawData[i][0] === 'string') {
            const val = rawData[i][0].toLowerCase();
            if (val.includes('parameter') || val.includes('particular') || val.includes('description') || val.includes('detail')) {
              isTransposed = true;
              paramRowIndex = i;
              break;
            }
          }
        }

        // Fallback: If no explicit "Parameters" row found, check if column A looks like headers
        if (!isTransposed) {
          let colAHeaderHits = 0;
          for (let i = 0; i < Math.min(rawData.length, 15); i++) {
            if (rawData[i] && typeof rawData[i][0] === 'string') {
              const cellVal = rawData[i][0].toLowerCase().replace(/[^a-z0-9]/g, '');
              if (Object.values(ALIASES).flat().some(alias => cellVal.includes(alias) || alias.includes(cellVal))) {
                colAHeaderHits++;
              }
            }
          }
          if (colAHeaderHits >= 2) {
            isTransposed = true;
            // Assume the first row that had a match or the top of the file is the start
            paramRowIndex = 0;
          }
        }

        if (isTransposed) {
          const numCols = Math.max(...rawData.map(row => row.length || 0));

          // Fill merged cells horizontally
          for (let r = 0; r < rawData.length; r++) {
            let lastVal = undefined;
            for (let c = 1; c < numCols; c++) {
              if (rawData[r][c] !== undefined && rawData[r][c] !== '') {
                lastVal = rawData[r][c];
              } else if (lastVal !== undefined) {
                rawData[r][c] = lastVal;
              }
            }
          }

          const headers = rawData.map(row => row[0]);
          for (let c = 1; c < numCols; c++) {
            const obj = {};
            let hasData = false;
            for (let r = Math.max(0, paramRowIndex); r < rawData.length; r++) {
              if (headers[r]) {
                obj[headers[r]] = rawData[r][c];
                if (rawData[r][c] !== undefined && rawData[r][c] !== '') hasData = true;
              }
            }
            if (hasData) data.push(obj);
          }
        } else {
          data = XLSX.utils.sheet_to_json(ws);
        }

        const newRows = data.map(row => {
          const newObj = {};
          Object.keys(schema).forEach(key => {
            const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
            const possibleAliases = ALIASES[cleanKey] || [cleanKey];

            const matchedKey = Object.keys(row).find(rKey => {
              const cleanRKey = String(rKey).toLowerCase().replace(/[^a-z0-9]/g, '');
              if (!cleanRKey || cleanRKey === 'undefined' || cleanRKey === 'null') return false;
              return possibleAliases.some(alias => cleanRKey.includes(alias) || alias.includes(cleanRKey));
            });
            newObj[key] = matchedKey && row[matchedKey] !== undefined ? String(row[matchedKey] || '') : schema[key];
          });
          // Add a debug key to the object to track what headers were actually found
          newObj._rawKeys = Object.keys(row).filter(k => k && k !== 'undefined' && k !== 'null').join(', ');
          return newObj;
        });

        if (newRows.length > 0) {
          setState(newRows);
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
  const mkPhSlots = () => Array.from({ length: 24 }, (_, i) => ({ hour: `${i.toString().padStart(2, '0')}:00`, value: '' }));

  const initFeederDynamic = () => {
    const map = {};
    FEEDERS.forEach(f => {
      map[f.id] = mkPhSlots().map(s => ({ ...s, feederId: f.id }));
    });
    return map;
  };

  const [phDate, setPhDate] = useState(new Date().toISOString().split('T')[0]);
  const [ebDynamic, setEbDynamic] = useState(mkPhSlots());
  const [feederDynamic, setFeederDynamic] = useState(initFeederDynamic());
  const [activeFeederId, setActiveFeederId] = useState('101');
  const [solarDynamic, setSolarDynamic] = useState([{ hour: 'Daily', value: '', generation: '' }]);
  const [dgDynamic, setDgDynamic] = useState([
    { hour: 'Peak Hour (6AM-10AM & 6PM-10PM)', value: '' },
    { hour: 'Non Peak Hour (10AM-6PM)', value: '' },
    { hour: 'Night Hour (10PM-6AM)', value: '' }
  ]);
  const [dgDailyFuel, setDgDailyFuel] = useState('');
  const [phSaving, setPhSaving] = useState(false);
  const [phSavedMsg, setPhSavedMsg] = useState('');

  const [phTransformers, setPhTransformers] = useState([{ svcNum: '', type: 'Permanent HT', load: '', voltage: '11 kV HT / 415 V LT', ratingMake: '', year: '', feeders: '' }]);
  const [phDGSets, setPhDGSets] = useState([{ ratingMake: '', count: '', year: '', lastService: '', fuelCap: '', status: 'Working' }]);
  const [phUps, setPhUps] = useState([{ location: '', ratingMake: '', lastAmc: '', nextAmc: '', batteryCap: '', batteryDate: '', status: 'Working' }]);
  const [phSolarPv, setPhSolarPv] = useState([{ location: '', capacity: '', panels: '', panelWatts: '', inverterRating: '', inverterService: '', type: 'Local Grid usage', cleaningFreq: 'yes', status: 'Working' }]);
  const [phStaff, setPhStaff] = useState([{ name: '', role: '', shift: 'Morning', attendance: 'Present', contact: '' }]);

  useEffect(() => {

    fetch(API_BASE + `/api/powerhouse?date=${phDate}`)
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

          const fillFeederSlots = (map, dataArr) => {
            const res = JSON.parse(JSON.stringify(map));
            if (!dataArr) return res;
            dataArr.forEach(d => {
              if (res[d.feederId]) {
                const idx = res[d.feederId].findIndex(s => s.hour === d.hour);
                if (idx !== -1) res[d.feederId][idx].value = d.value;
              }
            });
            return res;
          };

          setEbDynamic(fillSlots(mkPhSlots(), data.ebDynamic));
          setFeederDynamic(fillFeederSlots(initFeederDynamic(), data.feederDynamic));
          setSolarDynamic(fillSlots([{ hour: 'Daily', value: '', generation: '' }], data.solarDynamic));
          setDgDynamic(fillSlots([
            { hour: 'Peak Hour (6AM-10AM & 6PM-10PM)', value: '' },
            { hour: 'Non Peak Hour (10AM-6PM)', value: '' },
            { hour: 'Night Hour (10PM-6AM)', value: '' }
          ], data.dgDynamic));
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

  const handleFeederDynamicChange = (idx, val) => {
    setFeederDynamic(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      if (copy[activeFeederId]) {
        copy[activeFeederId][idx].value = val;
      }
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
        feederDynamic: Object.values(feederDynamic).flat(),
        solarDynamic: solarDynamic,
        dgDynamic: dgDynamic,
        dgDailyFuel: parseFloat(dgDailyFuel) || 0
      };
      const res = await fetch(API_BASE + '/api/powerhouse/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Network response was not ok');
      setPhSavedMsg('Power House data saved successfully!');
      window.dispatchEvent(new Event('unit-form-updated'));
      alert('Power House data saved successfully!');
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      setPhSavedMsg('Failed to save data');
      alert('Failed to save Power House data');
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

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', paddingBottom: '12px' }}>
        {['static', 'eb_dynamic', 'feeder_dynamic', 'solar_dynamic', 'dg_dynamic'].map(tab => (
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
                  {item._rawKeys && (
                    <div style={{ gridColumn: '1 / -1', fontSize: '0.7rem', color: '#94a3b8', marginTop: '8px' }}>
                      Debug - Keys Found: {item._rawKeys}
                    </div>
                  )}
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

      {phTab === 'feeder_dynamic' && (
        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
            <h4 style={{ margin: 0, color: '#1e293b' }}>Feeder Dynamic Logs (Hourly Consumption)</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '12px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Date:</label>
                <input type="date" value={phDate} onChange={e => setPhDate(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Select Feeder:</span>
              <select
                style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', minWidth: '220px', fontSize: '0.85rem' }}
                value={activeFeederId}
                onChange={(e) => setActiveFeederId(e.target.value)}
              >
                {FEEDERS.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.id})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            {(feederDynamic[activeFeederId] || []).map((slot, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>{slot.hour}</label>
                <input
                  type="number"
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  value={slot.value}
                  onChange={(e) => handleFeederDynamicChange(idx, e.target.value)}
                  placeholder="Units"
                />
              </div>
            ))}
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={savePhData} disabled={phSaving} style={{ padding: '10px 24px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', opacity: phSaving ? 0.7 : 1 }}>
              {phSaving ? 'Saving...' : 'Save Feeder Logs'}
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

        const downloadPhTemplate = () => {
          let templateData = [];
          let filename = '';
          if (isEB) {
            templateData = ebDynamic.map(s => ({ 'Hour': s.hour, 'Value': '' }));
            filename = 'EB_Dynamic_Template.xlsx';
          } else if (isSolar) {
            templateData = solarDynamic.map(s => ({ 'Hour': s.hour, 'Value': '', 'Generation': '' }));
            filename = 'Solar_Dynamic_Template.xlsx';
          } else if (isDG) {
            templateData = dgDynamic.map(s => ({ 'Hour': s.hour, 'Value': '' }));
            filename = 'DG_Dynamic_Template.xlsx';
          }
          const ws = XLSX.utils.json_to_sheet(templateData);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Template");
          XLSX.writeFile(wb, filename);
        };

        return (
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <h4 style={{ margin: 0, color: '#1e293b' }}>{title}</h4>
                <label style={{ cursor: 'pointer', padding: '6px 12px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem' }}>
                  + Upload Excel
                  <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => handleGenericFileUpload(setter, excelMapping, e)} style={{ display: 'none' }} />
                </label>
                <button onClick={downloadPhTemplate} style={{ padding: '6px 12px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                  Download Template
                </button>
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
                  <div key={idx} style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px', gridColumn: (isSolar || isDG) ? '1 / -1' : 'auto' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#3b82f6', width: isDG ? '140px' : isShift ? '70px' : '60px', wordBreak: 'break-word', lineHeight: '1.2' }}>
                      {isShift ? (
                        <>
                          {slot.hour.split(' ')[0]}<br />{slot.hour.split(' ')[1]}
                        </>
                      ) : slot.hour}
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'row', gap: '10px' }}>
                      <input type="number" placeholder="Consumption (Units)" style={{ flex: 1, padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }} value={slot.value || ''} onChange={e => handlePhDynamicChange(setter, idx, 'value', e.target.value)} />
                      {isSolar && (
                        <input type="number" placeholder="Generation (Units)" style={{ flex: 1, padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }} value={slot.generation || ''} onChange={e => handlePhDynamicChange(setter, idx, 'generation', e.target.value)} />
                      )}
                    </div>
                  </div>
                )
              })}
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
