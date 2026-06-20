import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';

function getStorageKey(unitName) {
  return `unit-form:${unitName}`;
}

function getCooldownDays(frequency) {
  const value = (frequency || '').toLowerCase();
  if (value.includes('daily')) return 1;
  if (value.includes('weekly')) return 7;
  if (value.includes('monthly')) return 30;
  if (value.includes('yearly') || value.includes('annual')) return 365;
  if (value.includes('one-time')) return Infinity;
  return 0;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

const FieldBox = ({ label, children }) => (
  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
    {children}
  </div>
);

export default function UnitDataForm({ unitName, fields, onClose }) {
  const initialValues = useMemo(() => {
    const map = {};
    fields.forEach((field) => {
      map[field.key] = '';
    });
    return map;
  }, [fields]);

  const [values, setValues] = useState(initialValues);
  const [savedAt, setSavedAt] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [fieldSubmittedAt, setFieldSubmittedAt] = useState({});

  // Hostel specific state
  const DEFAULT_BLOCKS = [];

  const [selectedHostelBlock, setSelectedHostelBlock] = useState(null);
  const [selectedGender, setSelectedGender] = useState('boys');
  const [hostelBlocks, setHostelBlocks] = useState(DEFAULT_BLOCKS);
  const [currentBlockData, setCurrentBlockData] = useState(null);
  const [dailyUsageMap, setDailyUsageMap] = useState({});
  const [residentSearchQuery, setResidentSearchQuery] = useState('');
  const [absentSearchQuery, setAbsentSearchQuery] = useState('');
  const [wardenSearchQuery, setWardenSearchQuery] = useState('');

  // Mess specific state
  const [messTab, setMessTab] = useState('daily');
  const [messMenuFile, setMessMenuFile] = useState(null);
  const [messMenuMonth, setMessMenuMonth] = useState('');
  const [messMenuBlock, setMessMenuBlock] = useState('Boys Hostel');
  const [messMenuSaving, setMessMenuSaving] = useState(false);

  const [existingMessLogs, setExistingMessLogs] = useState([]);

  const [messEquipments, setMessEquipments] = useState([{ blockName: 'Boys Hostel', name: '', total: 0, working: 0, damaged: 0, status: 'Working' }]);
  const [existingMessEquipments, setExistingMessEquipments] = useState([]);

  const [messStaffs, setMessStaffs] = useState([{ blockName: 'Boys Hostel', name: '', role: '', shift: 'Morning', contact: '' }]);
  const [existingMessStaffs, setExistingMessStaffs] = useState([]);

  // Derived: true if the currently selected block hasn't been saved yet (no beds data)
  const isNewBlock = !hostelBlocks.some(b => b.name === selectedHostelBlock && b.beds > 0);

  // ─── Chiller Plant state ──────────────────────────────────────────────────
  const mkSlots = () => ({ s1: '', s2: '', s3: '', s4: '' });
  const [chillerDate,  setChillerDate]  = useState(new Date().toISOString().split('T')[0]);
  const [u1, setU1] = useState(mkSlots());
  const [u2, setU2] = useState(mkSlots());
  const [u3, setU3] = useState(mkSlots());
  const [p1, setP1] = useState(mkSlots());
  const [p2, setP2] = useState(mkSlots());
  const [p3, setP3] = useState(mkSlots());
  const [p4, setP4] = useState(mkSlots());
  const [chillerSaving, setChillerSaving] = useState(false);
  const [chillerSavedMsg, setChillerSavedMsg] = useState('');

  const [chillerTab, setChillerTab] = useState('static');
        const [ahuUnits, setAhuUnits] = useState([{ block: '', floor: '', loc: '', type: '', cap: '', qty: '', totCap: '', hp: '', totHp: '', area: '' }]);
  const [existingAhuUnits, setExistingAhuUnits] = useState([]);
  
  const [splitAcUnits, setSplitAcUnits] = useState([{ make: '', ton: '', model: '', block: '', dept: '', qty: '', totTon: '', loc: '' }]);
  const [existingSplitAcUnits, setExistingSplitAcUnits] = useState([]);

  const [vrvUnits, setVrvUnits] = useState([{ make: '', ton: '', model: '', block: '', dept: '', qty: '', totTon: '', loc: '', notes: '' }]);
  const [existingVrvUnits, setExistingVrvUnits] = useState([]);

  const [coldRoomUnits, setColdRoomUnits] = useState([{ make: '', ton: '', model: '', block: '', dept: '', qty: '', totTon: '', loc: '' }]);
  const [existingColdRoomUnits, setExistingColdRoomUnits] = useState([]);
  const [breakdowns, setBreakdowns] = useState([{ date: '', equipment: '', issue: '', resolution: '', status: 'Pending' }]);
  const [staff, setStaff] = useState([{ name: '', role: '', shift: '', attendance: '', contact: '', dateJoined: '' }]);
  const [existingStaff, setExistingStaff] = useState([]);
  const [equipments, setEquipments] = useState([{ name: '', model: '', capacity: '', type: '', status: '', load: '', tempIn: '', tempOut: '', refrigerant: '', lastService: '', nextService: '', health: 100 }]);
  const [existingEquipments, setExistingEquipments] = useState([]);
  const [plantSpecs, setPlantSpecs] = useState([{ parameter: '', value: '', unit: '', remarks: '' }]);
  const [existingPlantSpecs, setExistingPlantSpecs] = useState([]);
  const [unitSpecs, setUnitSpecs] = useState([{ param: '', unit1: '', unit2: '', unit3: '' }]);
  const [existingUnitSpecs, setExistingUnitSpecs] = useState([]);

  const [existingBreakdowns, setExistingBreakdowns] = useState([]);
  const [existingOperatingLogs, setExistingOperatingLogs] = useState([]);

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
    if (unitName === 'Power House') {
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
    }
  }, [unitName, phDate]);

  useEffect(() => {
    fetch('http://localhost:8085/api/chiller/ahu-units')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setExistingAhuUnits(data.filter(u => !u.subTotal));
        }
      })
      .catch(console.error);

    fetch('http://localhost:8085/api/chiller/split-ac')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setExistingSplitAcUnits(data);
        }
      })
      .catch(console.error);

    fetch('http://localhost:8085/api/chiller/vrv-units')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setExistingVrvUnits(data);
        }
      })
      .catch(console.error);

    fetch('http://localhost:8085/api/chiller/cold-room')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setExistingColdRoomUnits(data);
        }
      })
      .catch(console.error);

    fetch('http://localhost:8085/api/chiller/staff').then(res => res.json()).then(data => { if (data) setExistingStaff(data); }).catch(console.error);
    fetch('http://localhost:8085/api/chiller/equipment').then(res => res.json()).then(data => { if (data) setExistingEquipments(data); }).catch(console.error);
    fetch('http://localhost:8085/api/chiller/plant-specs').then(res => res.json()).then(data => { if (data) setExistingPlantSpecs(data); }).catch(console.error);
    fetch('http://localhost:8085/api/chiller/unit-specs').then(res => res.json()).then(data => { if (data) setExistingUnitSpecs(data); }).catch(console.error);
    fetch('http://localhost:8085/api/chiller/breakdowns')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setExistingBreakdowns(data);
        }
      })
      .catch(console.error);

    fetch('http://localhost:8085/api/chiller/operating-logs')
      .then(res => res.json())
      .then(data => { if (data) setExistingOperatingLogs(data); })
      .catch(console.error);

    fetch('http://localhost:8085/api/mess/data')
      .then(res => res.json())
      .then(data => { if (data && data.wasteLogs) setExistingMessLogs(data.wasteLogs); })
      .catch(console.error);
  }, [chillerSavedMsg]); // Refresh when saved

  const [ratePeak, setRatePeak] = useState('');
  const [rateOffPeak, setRateOffPeak] = useState('');
  const [rateNight, setRateNight] = useState('');
  const [chillerWaterIn, setChillerWaterIn] = useState('');
  const [chillerWaterOut, setChillerWaterOut] = useState('');
  const [condenserWaterIn, setCondenserWaterIn] = useState('');
  const [condenserWaterOut, setCondenserWaterOut] = useState('');

  const fv = (v) => parseFloat(v) || 0;

  useEffect(() => {
    if (chillerTab === 'dynamic' && existingOperatingLogs.length > 0) {
      const log = existingOperatingLogs.find(l => l.date === chillerDate);
      if (log) {
        setU1({ s1: log.unit1Slot1 || '', s2: log.unit1Slot2 || '', s3: log.unit1Slot3 || '', s4: log.unit1Slot4 || '' });
        setU2({ s1: log.unit2Slot1 || '', s2: log.unit2Slot2 || '', s3: log.unit2Slot3 || '', s4: log.unit2Slot4 || '' });
        setU3({ s1: log.unit3Slot1 || '', s2: log.unit3Slot2 || '', s3: log.unit3Slot3 || '', s4: log.unit3Slot4 || '' });
        setP1({ s1: log.pump1Slot1 || '', s2: log.pump1Slot2 || '', s3: log.pump1Slot3 || '', s4: log.pump1Slot4 || '' });
        setP2({ s1: log.pump2Slot1 || '', s2: log.pump2Slot2 || '', s3: log.pump2Slot3 || '', s4: log.pump2Slot4 || '' });
        setP3({ s1: log.pump3Slot1 || '', s2: log.pump3Slot2 || '', s3: log.pump3Slot3 || '', s4: log.pump3Slot4 || '' });
        setP4({ s1: log.pump4Slot1 || '', s2: log.pump4Slot2 || '', s3: log.pump4Slot3 || '', s4: log.pump4Slot4 || '' });
        
        setRatePeak(log.ratePeak || '');
        setRateOffPeak(log.rateOffPeak || '');
        setRateNight(log.rateNight || '');
        setChillerWaterIn(log.chillerWaterIn || '');
        setChillerWaterOut(log.chillerWaterOut || '');
        setCondenserWaterIn(log.condenserWaterIn || '');
        setCondenserWaterOut(log.condenserWaterOut || '');
      } else {
        const mkSlots = () => ({ s1: '', s2: '', s3: '', s4: '' });
        setU1(mkSlots()); setU2(mkSlots()); setU3(mkSlots());
        setP1(mkSlots()); setP2(mkSlots()); setP3(mkSlots()); setP4(mkSlots());
        setRatePeak(''); setRateOffPeak(''); setRateNight('');
        setChillerWaterIn(''); setChillerWaterOut(''); setCondenserWaterIn(''); setCondenserWaterOut('');
      }
    }
  }, [chillerDate, existingOperatingLogs, chillerTab]);

  useEffect(() => {
    if (unitName === 'Mess' && messTab === 'daily') {
      const selectedDate = values.date;
      const selectedBlock = values.blockName || 'Boys Hostel';
      if (selectedDate && existingMessLogs.length > 0) {
        const log = existingMessLogs.find(l => l.date && l.date.split('T')[0] === selectedDate && l.blockName === selectedBlock);
        if (log) {
          setValues(prev => ({
            ...prev,
            breakfast: log.breakfast || '',
            lunch: log.lunch || '',
            dinner: log.dinner || '',
            breakfastCount: log.breakfastCount || '',
            lunchCount: log.lunchCount || '',
            dinnerCount: log.dinnerCount || ''
          }));
        } else {
          setValues(prev => ({
            ...prev,
            breakfast: '',
            lunch: '',
            dinner: '',
            breakfastCount: '',
            lunchCount: '',
            dinnerCount: ''
          }));
        }
      }
    }
  }, [values.date, values.blockName, existingMessLogs, unitName, messTab]);

  // Auto-calculated totals (mirrors backend logic)
  const cPeak    = fv(u1.s1) + fv(u2.s1) + fv(u3.s1);
  const cNonPeak = fv(u1.s2) + fv(u1.s3) + fv(u2.s2) + fv(u2.s3) + fv(u3.s2) + fv(u3.s3);
  const cNight   = fv(u1.s4) + fv(u2.s4) + fv(u3.s4);
  const pPeak    = fv(p1.s1) + fv(p2.s1) + fv(p3.s1);
  const pNonPeak = fv(p1.s2) + fv(p1.s3) + fv(p2.s2) + fv(p2.s3) + fv(p3.s2) + fv(p3.s3);
  const pNight   = fv(p1.s4) + fv(p2.s4) + fv(p3.s4);

  const onSaveChillerOperating = async () => {
    setChillerSaving(true);
    setChillerSavedMsg('');
    const payload = {
      date: chillerDate,
      
      ratePeak: fv(ratePeak), rateOffPeak: fv(rateOffPeak), rateNight: fv(rateNight),
      chillerWaterIn: fv(chillerWaterIn), chillerWaterOut: fv(chillerWaterOut),
      condenserWaterIn: fv(condenserWaterIn), condenserWaterOut: fv(condenserWaterOut),
      unit1Slot1: fv(u1.s1), unit1Slot2: fv(u1.s2), unit1Slot3: fv(u1.s3), unit1Slot4: fv(u1.s4),
      unit2Slot1: fv(u2.s1), unit2Slot2: fv(u2.s2), unit2Slot3: fv(u2.s3), unit2Slot4: fv(u2.s4),
      unit3Slot1: fv(u3.s1), unit3Slot2: fv(u3.s2), unit3Slot3: fv(u3.s3), unit3Slot4: fv(u3.s4),
      pump1Slot1: fv(p1.s1), pump1Slot2: fv(p1.s2), pump1Slot3: fv(p1.s3), pump1Slot4: fv(p1.s4),
      pump2Slot1: fv(p2.s1), pump2Slot2: fv(p2.s2), pump2Slot3: fv(p2.s3), pump2Slot4: fv(p2.s4),
      pump3Slot1: fv(p3.s1), pump3Slot2: fv(p3.s2), pump3Slot3: fv(p3.s3), pump3Slot4: fv(p3.s4),
      pump4Slot1: 0, pump4Slot2: 0, pump4Slot3: 0, pump4Slot4: 0,
    };
    try {
      const res = await fetch('http://localhost:8085/api/chiller/add-operating-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setChillerSavedMsg('✓ Data saved successfully to the database!');
        setAhuUnits([{ block: '', floor: '', loc: '', type: '', cap: '', qty: '', totCap: '', hp: '', totHp: '', area: '' }]);
        window.dispatchEvent(new Event('unit-form-updated'));
        fetch('http://localhost:8085/api/chiller/operating-logs').then(r => r.json()).then(d => { if (d) setExistingOperatingLogs(d); }).catch(console.error);
        setTimeout(() => { setChillerSavedMsg(''); if (onClose) onClose(); }, 1500);
      } else {
        setChillerSavedMsg('✗ Failed to save – check backend connection.');
      }
    } catch (e) {
      setChillerSavedMsg('✗ Backend not reachable.');
    } finally {
      setChillerSaving(false);
    }
  };

  const handleUpdateExistingAhuUnit = async (unit) => {
    try {
      const payload = {
        ...unit,
        cap: fv(unit.cap), qty: parseInt(unit.qty) || 1, totCap: fv(unit.totCap),
        hp: fv(unit.hp), totHp: fv(unit.totHp), area: fv(unit.area)
      };
      await fetch('http://localhost:8085/api/chiller/update-ahu-unit', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      alert('Unit updated successfully!');
      window.dispatchEvent(new Event('unit-form-updated'));
    } catch (e) {
      alert('Failed to update unit');
    }
  };

  const handleDeleteExistingAhuUnit = async (id) => {
    if (!window.confirm('Delete this unit?')) return;
    try {
      await fetch(`http://localhost:8085/api/chiller/delete-ahu-unit?id=${id}`, { method: 'DELETE' });
      setExistingAhuUnits(existingAhuUnits.filter(u => u.id !== id));
      alert('Unit deleted successfully!');
      window.dispatchEvent(new Event('unit-form-updated'));
    } catch (e) {
      alert('Failed to delete unit');
    }
  };

  const onSaveAhuUnits = async () => {
    // Basic validation
    const validUnits = ahuUnits.filter(u => u.block || u.loc || u.type);
    if (validUnits.length === 0) {
      alert("Please enter at least one valid AHU unit to save.");
      return;
    }

    try {
      // Map to proper types
      const payload = validUnits.map(u => ({
        ...u,
        cap: fv(u.cap),
        qty: parseInt(u.qty) || 1,
        totCap: fv(u.totCap),
        hp: fv(u.hp),
        totHp: fv(u.totHp),
        area: fv(u.area)
      }));

      const res = await fetch('http://localhost:8085/api/chiller/add-ahu-units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setChillerSavedMsg('✓ Data saved successfully to the database!');
        setAhuUnits([{ block: '', floor: '', loc: '', type: '', cap: '', qty: '', totCap: '', hp: '', totHp: '', area: '' }]);
        window.dispatchEvent(new Event('unit-form-updated'));
        setTimeout(() => { setChillerSavedMsg(''); if (onClose) onClose(); }, 1500);
      } else {
        alert("✗ Failed to save AHU Units: " + await res.text());
      }
    } catch (err) {
      alert("✗ Failed to connect to backend for AHU Units: " + err.message);
    }
  };

  const onSaveSplitAcUnits = async () => {
    const validUnits = splitAcUnits.filter(u => u.block || u.make || u.loc);
    if (validUnits.length === 0) {
      alert("Please enter at least one valid Split AC unit to save.");
      return;
    }

    try {
      const payload = validUnits.map(u => ({
        ...u,
        ton: fv(u.ton),
        qty: parseInt(u.qty) || 1,
        totTon: fv(u.totTon)
      }));

      const res = await fetch('http://localhost:8085/api/chiller/add-split-ac', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setChillerSavedMsg('✓ Data saved successfully to the database!');
        setSplitAcUnits([{ make: '', ton: '', model: '', block: '', dept: '', qty: '', totTon: '', loc: '' }]);
        window.dispatchEvent(new Event('unit-form-updated'));
        setTimeout(() => { setChillerSavedMsg(''); if (onClose) onClose(); }, 1500);
      } else {
        alert('✗ Failed to save Split AC units.');
      }
    } catch (e) {
      alert('✗ Backend not reachable.');
    }
  };

  const handleUpdateExistingSplitAcUnit = async (unit) => {
    try {
      const payload = {
        ...unit,
        ton: fv(unit.ton), qty: parseInt(unit.qty) || 1, totTon: fv(unit.totTon)
      };
      await fetch('http://localhost:8085/api/chiller/update-split-ac', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      alert('Unit updated successfully!');
      window.dispatchEvent(new Event('unit-form-updated'));
    } catch (e) {
      alert('Failed to update unit');
    }
  };

  const handleDeleteExistingSplitAcUnit = async (id) => {
    if (!window.confirm('Delete this unit?')) return;
    try {
      await fetch(`http://localhost:8085/api/chiller/delete-split-ac?id=${id}`, { method: 'DELETE' });
      setExistingSplitAcUnits(existingSplitAcUnits.filter(u => u.id !== id));
      alert('Unit deleted successfully!');
      window.dispatchEvent(new Event('unit-form-updated'));
    } catch (e) {
      alert('Failed to delete unit');
    }
  };

  const onSaveVrvUnits = async () => {
    const validUnits = vrvUnits.filter(u => u.block || u.make || u.loc);
    if (validUnits.length === 0) {
      alert("Please enter at least one valid VRV unit to save.");
      return;
    }

    try {
      const payload = validUnits.map(u => ({
        ...u, ton: fv(u.ton), qty: parseInt(u.qty) || 1, totTon: fv(u.totTon)
      }));

      const res = await fetch('http://localhost:8085/api/chiller/add-vrv-units', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });

      if (res.ok) {
        setChillerSavedMsg('✓ Data saved successfully to the database!');
        setVrvUnits([{ make: '', ton: '', model: '', block: '', dept: '', qty: '', totTon: '', loc: '', notes: '' }]);
        window.dispatchEvent(new Event('unit-form-updated'));
        setTimeout(() => { setChillerSavedMsg(''); if (onClose) onClose(); }, 1500);
      } else {
        alert('✗ Failed to save VRV units.');
      }
    } catch (e) {
      alert('✗ Backend not reachable.');
    }
  };

  const handleUpdateExistingVrvUnit = async (unit) => {
    try {
      const payload = { ...unit, ton: fv(unit.ton), qty: parseInt(unit.qty) || 1, totTon: fv(unit.totTon) };
      await fetch('http://localhost:8085/api/chiller/update-vrv-unit', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      alert('Unit updated successfully!');
      window.dispatchEvent(new Event('unit-form-updated'));
    } catch (e) { alert('Failed to update unit'); }
  };

  const handleDeleteExistingVrvUnit = async (id) => {
    if (!window.confirm('Delete this unit?')) return;
    try {
      await fetch(`http://localhost:8085/api/chiller/delete-vrv-unit?id=${id}`, { method: 'DELETE' });
      setExistingVrvUnits(existingVrvUnits.filter(u => u.id !== id));
      alert('Unit deleted successfully!');
      window.dispatchEvent(new Event('unit-form-updated'));
    } catch (e) { alert('Failed to delete unit'); }
  };

  const handleUpdateBreakdown = async (unit) => {
    try {
      await fetch('http://localhost:8085/api/chiller/update-breakdown', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(unit)
      });
      alert('Breakdown updated successfully!');
      window.dispatchEvent(new Event('unit-form-updated'));
    } catch (e) {
      alert('Failed to update breakdown');
    }
  };

  const handleDeleteBreakdown = async (id) => {
    if (!window.confirm('Delete this breakdown?')) return;
    try {
      await fetch(`http://localhost:8085/api/chiller/delete-breakdown?id=${id}`, { method: 'DELETE' });
      setExistingBreakdowns(existingBreakdowns.filter(u => u.id !== id));
      alert('Breakdown deleted successfully!');
      window.dispatchEvent(new Event('unit-form-updated'));
    } catch (e) {
      alert('Failed to delete breakdown');
    }
  };


  const onSaveStaff = async () => {
    setChillerSaving(true);
    try {
      const valid = staff.filter(u => u.name || u.role);
      if (valid.length > 0) {
        await fetch('http://localhost:8085/api/chiller/add-staff', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(valid),
        });
      }
      setChillerSavedMsg('✓ Saved Staff Data');
      setStaff([{ name: '', role: '', shift: '', attendance: '', contact: '', dateJoined: '' }]);
      fetch('http://localhost:8085/api/chiller/staff').then(r => r.json()).then(d => setExistingStaff(d || []));
      window.dispatchEvent(new Event('unit-form-updated'));
    } catch (e) {
      console.error(e);
      setChillerSavedMsg('Failed to save staff');
    }
    setChillerSaving(false);
    setTimeout(() => setChillerSavedMsg(''), 3000);
  };
  const handleDeleteStaff = async (id) => {
    try {
      await fetch(`http://localhost:8085/api/chiller/delete-staff?id=${id}`, { method: 'DELETE' });
      fetch('http://localhost:8085/api/chiller/staff').then(r => r.json()).then(d => setExistingStaff(d || []));
      window.dispatchEvent(new Event('unit-form-updated'));
    } catch (e) { console.error(e); }
  };

  const handleUpdateStaff = async (staffMember) => {
    try {
      await fetch('http://localhost:8085/api/chiller/update-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffMember)
      });
      alert('Staff data updated successfully!');
      window.dispatchEvent(new Event('unit-form-updated'));
    } catch (e) {
      console.error(e);
      alert('Failed to update staff data');
    }
  };

  const onSaveEquipments = async () => {
    setChillerSaving(true);
    try {
      const valid = equipments.filter(u => u.name || u.model);
      if (valid.length > 0) {
        await fetch('http://localhost:8085/api/chiller/add-equipment', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(valid),
        });
      }
      setChillerSavedMsg('✓ Saved Equipments Data');
      setEquipments([{ name: '', model: '', capacity: '', type: '', status: '', load: '', tempIn: '', tempOut: '', refrigerant: '', lastService: '', nextService: '', health: 100 }]);
      fetch('http://localhost:8085/api/chiller/equipment').then(r => r.json()).then(d => setExistingEquipments(d || []));
      window.dispatchEvent(new Event('unit-form-updated'));
    } catch (e) {
      console.error(e);
      setChillerSavedMsg('Failed to save equipments');
    }
    setChillerSaving(false);
    setTimeout(() => setChillerSavedMsg(''), 3000);
  };
  const handleDeleteEquipment = async (id) => {
    try {
      await fetch(`http://localhost:8085/api/chiller/delete-equipment?id=${id}`, { method: 'DELETE' });
      fetch('http://localhost:8085/api/chiller/equipment').then(r => r.json()).then(d => setExistingEquipments(d || []));
      window.dispatchEvent(new Event('unit-form-updated'));
    } catch (e) { console.error(e); }
  };

  const handleUpdateEquipment = async (equipment) => {
    try {
      await fetch('http://localhost:8085/api/chiller/update-equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(equipment)
      });
      alert('Equipment data updated successfully!');
      window.dispatchEvent(new Event('unit-form-updated'));
    } catch (e) {
      console.error(e);
      alert('Failed to update equipment data');
    }
  };

  const onSavePlantSpecs = async () => {
    setChillerSaving(true);
    try {
      const valid = plantSpecs.filter(u => u.parameter || u.value);
      if (valid.length > 0) {
        await fetch('http://localhost:8085/api/chiller/add-plant-specs', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(valid),
        });
      }
      setChillerSavedMsg('✓ Saved Plant Specs');
      setPlantSpecs([{ parameter: '', value: '', unit: '', remarks: '' }]);
      fetch('http://localhost:8085/api/chiller/plant-specs').then(r => r.json()).then(d => setExistingPlantSpecs(d || []));
      window.dispatchEvent(new Event('unit-form-updated'));
    } catch (e) {
      console.error(e);
      setChillerSavedMsg('Failed to save plant specs');
    }
    setChillerSaving(false);
    setTimeout(() => setChillerSavedMsg(''), 3000);
  };
  const handleDeletePlantSpec = async (id) => {
    try {
      await fetch(`http://localhost:8085/api/chiller/delete-plant-spec?id=${id}`, { method: 'DELETE' });
      fetch('http://localhost:8085/api/chiller/plant-specs').then(r => r.json()).then(d => setExistingPlantSpecs(d || []));
      window.dispatchEvent(new Event('unit-form-updated'));
    } catch (e) { console.error(e); }
  };
  const handleUpdatePlantSpec = async (u) => {
    try {
      await fetch('http://localhost:8085/api/chiller/update-plant-spec', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(u)
      });
      window.dispatchEvent(new Event('unit-form-updated'));
      alert('Plant spec updated!');
    } catch (e) { console.error(e); }
  };

  const onSaveUnitSpecs = async () => {
    setChillerSaving(true);
    try {
      const valid = unitSpecs.filter(u => u.param || u.unit1);
      if (valid.length > 0) {
        await fetch('http://localhost:8085/api/chiller/add-unit-specs', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(valid),
        });
      }
      setChillerSavedMsg('✓ Saved Unit Specs');
      setUnitSpecs([{ param: '', unit1: '', unit2: '', unit3: '' }]);
      fetch('http://localhost:8085/api/chiller/unit-specs').then(r => r.json()).then(d => setExistingUnitSpecs(d || []));
      window.dispatchEvent(new Event('unit-form-updated'));
    } catch (e) {
      console.error(e);
      setChillerSavedMsg('Failed to save unit specs');
    }
    setChillerSaving(false);
    setTimeout(() => setChillerSavedMsg(''), 3000);
  };
  const handleDeleteUnitSpec = async (id) => {
    try {
      await fetch(`http://localhost:8085/api/chiller/delete-unit-spec?id=${id}`, { method: 'DELETE' });
      fetch('http://localhost:8085/api/chiller/unit-specs').then(r => r.json()).then(d => setExistingUnitSpecs(d || []));
      window.dispatchEvent(new Event('unit-form-updated'));
    } catch (e) { console.error(e); }
  };
  const handleUpdateUnitSpec = async (u) => {
    try {
      await fetch('http://localhost:8085/api/chiller/update-unit-spec', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(u)
      });
      window.dispatchEvent(new Event('unit-form-updated'));
      alert('Unit spec updated!');
    } catch (e) { console.error(e); }
  };

  const onSaveBreakdowns = async () => {
    const valid = breakdowns.filter(u => u.date || u.equipment || u.issue);
    if (valid.length === 0) {
      alert("Please enter at least one valid breakdown to save.");
      return;
    }
    try {
      const res = await fetch('http://localhost:8085/api/chiller/add-breakdowns', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(valid)
      });
      if (res.ok) {
        setChillerSavedMsg('✓ Breakdowns saved successfully!');
        setBreakdowns([{ date: '', equipment: '', issue: '', resolution: '', status: 'Pending' }]);
        window.dispatchEvent(new Event('unit-form-updated'));
        setTimeout(() => { setChillerSavedMsg(''); if (onClose) onClose(); }, 1500);
      } else {
        alert("✗ Failed to save: " + await res.text());
      }
    } catch (err) {
      alert("✗ Failed to connect: " + err.message);
    }
  };

  const onSaveColdRoomUnits = async () => {
    const validUnits = coldRoomUnits.filter(u => u.block || u.make || u.loc);
    if (validUnits.length === 0) {
      alert("Please enter at least one valid Cold Room unit to save.");
      return;
    }

    try {
      const payload = validUnits.map(u => ({
        ...u, ton: fv(u.ton), qty: parseInt(u.qty) || 1, totTon: fv(u.totTon)
      }));

      const res = await fetch('http://localhost:8085/api/chiller/add-cold-room', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });

      if (res.ok) {
        setChillerSavedMsg('✓ Data saved successfully to the database!');
        setColdRoomUnits([{ make: '', ton: '', model: '', block: '', dept: '', qty: '', totTon: '', loc: '' }]);
        window.dispatchEvent(new Event('unit-form-updated'));
        setTimeout(() => { setChillerSavedMsg(''); if (onClose) onClose(); }, 1500);
      } else {
        alert('✗ Failed to save Cold Room units.');
      }
    } catch (e) {
      alert('✗ Backend not reachable.');
    }
  };

  const handleUpdateExistingColdRoomUnit = async (unit) => {
    try {
      const payload = { ...unit, ton: fv(unit.ton), qty: parseInt(unit.qty) || 1, totTon: fv(unit.totTon) };
      await fetch('http://localhost:8085/api/chiller/update-cold-room', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      alert('Unit updated successfully!');
      window.dispatchEvent(new Event('unit-form-updated'));
    } catch (e) { alert('Failed to update unit'); }
  };

  const handleDeleteExistingColdRoomUnit = async (id) => {
    if (!window.confirm('Delete this unit?')) return;
    try {
      await fetch(`http://localhost:8085/api/chiller/delete-cold-room?id=${id}`, { method: 'DELETE' });
      setExistingColdRoomUnits(existingColdRoomUnits.filter(u => u.id !== id));
      alert('Unit deleted successfully!');
      window.dispatchEvent(new Event('unit-form-updated'));
    } catch (e) { alert('Failed to delete unit'); }
  };

  useEffect(() => {
    const fetchHostelData = async () => {
      if (unitName === 'Hostels') {
        try {
          const res = await fetch('http://localhost:8085/api/hostels');
          if (res.ok) {
            const data = await res.json();
            if (data.blocks) {
              setHostelBlocks(data.blocks);
            }
            if (data.dailyUsage) {
              setDailyUsageMap(data.dailyUsage);
            }
          }
        } catch (e) {
          console.warn('Backend not reachable');
        }
      }
    };
    fetchHostelData();

    const fetchMessData = async () => {
      if (unitName === 'Mess') {
        try {
          const res = await fetch('http://localhost:8085/api/mess/data');
          if (res.ok) {
            const data = await res.json();
            if (data.equipment) setExistingMessEquipments(data.equipment);
            if (data.staff) setExistingMessStaffs(data.staff);
          }
        } catch (e) {
          console.warn('Backend not reachable');
        }
      }
    };
    fetchMessData();
  }, [unitName]);

  useEffect(() => {
    const stored = localStorage.getItem(getStorageKey(unitName));
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setValues({ ...initialValues, ...parsed.values });
        setSavedAt(parsed.savedAt || '');
        setFieldSubmittedAt(parsed.fieldSubmittedAt || {});
        return;
      } catch (err) {
        // Ignore invalid local data
      }
    }
    setValues(initialValues);
    setSavedAt('');
    setFieldSubmittedAt({});
  }, [unitName, initialValues]);

  const onSave = async () => {
    const now = new Date().toISOString();
    const updatedFieldSubmittedAt = { ...fieldSubmittedAt };
    const valuesToSave = { ...values };

    // ── HOSTELS BLOCK ──────────────────────────────────────────────────────────
    if (unitName === 'Hostels') {
      if (!selectedHostelBlock) {
        alert("Validation Error: Please select a hostel block to manage.");
        return;
      }

      const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      const blockUsages = dailyUsageMap[selectedHostelBlock] || [];
      const hasTodayUsage = blockUsages.some(u => u.date === todayStr);
      if (hasTodayUsage) {
        const confirmOverwrite = window.confirm(`An entry for '${selectedHostelBlock}' already exists for today (${todayStr}). Do you want to update it?`);
        if (!confirmOverwrite) return;
      }

      // Beds and occupancy will be validated after calculating the cleaned values.
      if (values.water !== undefined && values.water !== '') {
        const waterVal = parseFloat(values.water);
        if (isNaN(waterVal) || waterVal < 0) { alert('Validation Error: Water Usage must be a valid non-negative number.'); return; }
      }
      if (values.electricity !== undefined && values.electricity !== '') {
        const powerVal = parseFloat(values.electricity);
        if (isNaN(powerVal) || powerVal < 0) { alert('Validation Error: Electricity Usage must be a valid non-negative number.'); return; }
      }

      // Build cleaned data ONCE — from currentBlockData (the live React state with user's typed values)
      const cleanedWardens = (currentBlockData.wardens || [])
        .filter(w => w.name?.trim() || w.phone?.trim())
        .map(w => ({ ...w, role: w.role || 'Chief Warden', floor: w.floor || 'ALL FLOORS' }));
      const cleanedResidents = (currentBlockData.residentList || [])
        .filter(r => r.name?.trim() || r.rollNo?.trim() || r.roomNo?.trim());
      const cleanedAbsents = (currentBlockData.absentList || [])
        .filter(r => r.name?.trim() || r.rollNo?.trim() || r.roomNo?.trim());
      const cleanedComplaints = (currentBlockData.complaints || [])
        .filter(c => c.type || c.desc?.trim());
      const cleanedFloorDetails = (currentBlockData.floorDetails || [])
        .map(f => ({ ...f, floorNumber: parseInt(f.floorNumber) || 0, totalRooms: parseInt(f.totalRooms) || 0, totalBeds: parseInt(f.totalBeds) || 0, roomTypes: f.roomTypes || 'Single Cot' }));

      const staffSum = (parseInt(currentBlockData.chiefWardenCount) || 0) +
                       (parseInt(currentBlockData.deputyWardenCount) || 0) +
                       (parseInt(currentBlockData.seniorCaretakerCount) || 0) +
                       (parseInt(currentBlockData.caretakerCount) || 0) +
                       (parseInt(currentBlockData.careTakerAttenderCount) || 0) +
                       (parseInt(currentBlockData.houseKeeperCount) || 0) +
                       (parseInt(currentBlockData.bathroomCleanerCount) || 0) +
                       (parseInt(currentBlockData.securityCount) || 0);

      // Support staff like cleaners and security do not occupy beds
      const nonResidentRoles = ['bathroom cleaner', 'house keeper', 'security personnel'];
      const occupyingStaffCount = cleanedWardens.filter(w => !w.role || !nonResidentRoles.includes(w.role.toLowerCase())).length;
      const totalOccupied = cleanedResidents.length + occupyingStaffCount;

      const cleanedBlockData = {
        ...currentBlockData,
        beds: parseInt(currentBlockData.beds) || 0,
        occupied: totalOccupied,
        numFloors: parseInt(currentBlockData.numFloors) || 0,
        totalRooms: parseInt(currentBlockData.totalRooms) || 0,
        chiefWardenCount: parseInt(currentBlockData.chiefWardenCount) || 0,
        deputyWardenCount: parseInt(currentBlockData.deputyWardenCount) || 0,
        seniorCaretakerCount: parseInt(currentBlockData.seniorCaretakerCount) || 0,
        careTakerAttenderCount: parseInt(currentBlockData.careTakerAttenderCount) || 0,
        houseKeeperCount: parseInt(currentBlockData.houseKeeperCount) || 0,
        bathroomCleanerCount: parseInt(currentBlockData.bathroomCleanerCount) || 0,
        securityCount: parseInt(currentBlockData.securityCount) || 0,
        vacantBeds: (parseInt(currentBlockData.beds) || 0) - totalOccupied,
        maintenanceRoomsBeds: parseInt(currentBlockData.maintenanceRoomsBeds) || 0,
        allocatedCapacity: parseInt(currentBlockData.allocatedCapacity) || 0,
        waterCoolersCount: parseInt(currentBlockData.waterCoolersCount) || 0,
        bathroomsPerFloor: parseFloat(currentBlockData.bathroomsPerFloor) || 0,
        toiletsPerFloor: parseFloat(currentBlockData.toiletsPerFloor) || 0,
        solarHeaterCapacity: currentBlockData.solarHeaterCapacity || '',
        wifiAccessPoints: parseInt(currentBlockData.wifiAccessPoints) || 0,
        cctvCameras: parseInt(currentBlockData.cctvCameras) || 0,
        caretakerCount: parseInt(currentBlockData.caretakerCount) || 0,
        commonRoom: currentBlockData.commonRoom || '',
        readingRoom: currentBlockData.readingRoom || '',
        parentWaitingRoom: currentBlockData.parentWaitingRoom || '',
        staffCount: staffSum,
        wardens: cleanedWardens,
        residentList: cleanedResidents,
        absentList: cleanedAbsents,
        complaints: cleanedComplaints,
        floorDetails: cleanedFloorDetails
      };

      setCurrentBlockData(cleanedBlockData);

      // Validations using cleanedBlockData
      if (isNewBlock) {
        if (!cleanedBlockData.beds || cleanedBlockData.beds <= 0) { alert('Total beds capacity is compulsory when creating a new block.'); return; }
        if (!cleanedBlockData.occupied || cleanedBlockData.occupied <= 0) { alert('No. of students (occupied) is compulsory when creating a new block.'); return; }
        if (cleanedWardens.length === 0) { alert('At least one Warden/Support Staff detail is compulsory when creating a new block.'); return; }
        if (cleanedResidents.length === 0) { alert('At least one Resident Student detail is compulsory when creating a new block.'); return; }
      }
      if (cleanedBlockData.occupied > cleanedBlockData.beds) { alert('Validation Error: Total Occupancy cannot exceed total beds capacity.'); return; }
      if (cleanedResidents.length > cleanedBlockData.occupied) { alert(`Validation Error: The number of registered residents (${cleanedResidents.length}) cannot exceed the occupied student count (${cleanedBlockData.occupied}).`); return; }
      if (cleanedWardens.length === 0) { alert('Validation Error: At least one Warden or Support Staff detail is required.'); return; }

      for (let i = 0; i < cleanedWardens.length; i++) {
        const w = cleanedWardens[i];
        if (!w.name?.trim() || !w.phone?.trim() || !w.role) { alert(`Warden/Support Staff on row ${i + 1} must have a valid Name, Contact (Phone), and Role.`); return; }
      }
      const phones = cleanedWardens.map(w => w.phone.trim());
      if (phones.length !== new Set(phones).size) { alert('Each Warden/Support Staff member must have a unique Contact (Phone) number.'); return; }

      for (let i = 0; i < cleanedResidents.length; i++) {
        const r = cleanedResidents[i];
        if (!r.name?.trim() || !r.rollNo?.trim() || !r.roomNo?.trim()) { alert(`Resident Student on row ${i + 1} must have a valid Name, Roll No, and Room No.`); return; }
      }
      const rollNos = cleanedResidents.map(r => r.rollNo.trim().toUpperCase());
      if (rollNos.length !== new Set(rollNos).size) { alert('Each Resident Student must have a unique Roll Number.'); return; }

      for (let i = 0; i < cleanedComplaints.length; i++) {
        const c = cleanedComplaints[i];
        if (!c.type || !c.desc?.trim()) { alert(`Complaint on row ${i + 1} must have a valid Sector and Issue Description.`); return; }
      }

      const updatedBlocks = hostelBlocks.map(b => b.name === selectedHostelBlock ? cleanedBlockData : b);
      const totalComplaints = updatedBlocks.reduce((sum, b) => sum + (b.complaints?.length || 0), 0);
      valuesToSave.complaints = String(totalComplaints);
      setValues(valuesToSave);

      // Save to localStorage
      const payload = {
        values: valuesToSave,
        savedAt: new Date(now).toLocaleString(),
        fieldSubmittedAt: { ...updatedFieldSubmittedAt },
      };
      localStorage.setItem(getStorageKey(unitName), JSON.stringify(payload));

      // Send to backend (using cleanedBlockData built above — not stale React state)
      try {
        console.log('[SAVE] occupied:', cleanedBlockData.occupied, 'beds:', cleanedBlockData.beds);

        const res = await fetch('http://localhost:8085/api/hostels/update-block', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cleanedBlockData)
        });

        if (!res.ok) {
          const errText = await res.text();
          alert('Failed to save block data: ' + errText);
          return;
        }

        // Sync local hostelBlocks state from fresh backend response
        try {
          const freshBlocks = await res.json();
          if (Array.isArray(freshBlocks)) setHostelBlocks(freshBlocks);
        } catch(e) { /* ignore */ }

        // Save water/electricity usage if provided
        const waterVal = parseFloat(values.water);
        const powerVal = parseFloat(values.electricity);
        if (!isNaN(waterVal) || !isNaN(powerVal)) {
          await fetch('http://localhost:8085/api/hostels/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ block: selectedHostelBlock, values: values })
          });
        }
      } catch (e) {
        console.warn('Backend not reachable:', e);
      }

      setSavedAt(new Date(now).toLocaleString());
      setFieldSubmittedAt(updatedFieldSubmittedAt);
      window.dispatchEvent(new Event('unit-form-updated'));
      alert('Unit data submitted successfully!');
      if (onClose) onClose();
      return; // Done — don't fall through to generic save logic below
    }
    // ── END HOSTELS BLOCK ──────────────────────────────────────────────────────

    fields.forEach((field) => {
      const hasValue = (valuesToSave[field.key] || '').trim().length > 0;
      const cooldownDays = getCooldownDays(field.frequency);
      const submittedAt = fieldSubmittedAt[field.key];
      const isAlwaysAvailable = cooldownDays === 0;
      const isOneTime = cooldownDays === Infinity;
      if (!hasValue) return;
      if (isAlwaysAvailable) { updatedFieldSubmittedAt[field.key] = now; return; }
      if (!submittedAt) { updatedFieldSubmittedAt[field.key] = now; return; }
      if (isOneTime) return;
      const nextAllowed = addDays(submittedAt, cooldownDays);
      if (new Date() >= nextAllowed) updatedFieldSubmittedAt[field.key] = now;
    });

    const payload = {
      values: valuesToSave,
      savedAt: new Date(now).toLocaleString(),
      fieldSubmittedAt: updatedFieldSubmittedAt,
    };
    localStorage.setItem(getStorageKey(unitName), JSON.stringify(payload));

    setSavedAt(payload.savedAt);
    setFieldSubmittedAt(updatedFieldSubmittedAt);
    window.dispatchEvent(new Event('unit-form-updated'));
    alert('Unit data submitted successfully!');
    if (onClose) onClose();
  };

  const submitMessData = async () => {
    try {
      const payload = {
        date: values.date,
        blockName: values.blockName || 'Boys Hostel',
        breakfast: parseInt(values.breakfast) || 0,
        lunch: parseInt(values.lunch) || 0,
        dinner: parseInt(values.dinner) || 0,
        breakfastCount: parseInt(values.breakfastCount) || 0,
        lunchCount: parseInt(values.lunchCount) || 0,
        dinnerCount: parseInt(values.dinnerCount) || 0
      };

      if (!payload.date) {
        alert("Please select a date before submitting.");
        return;
      }

      const response = await fetch('http://localhost:8085/api/mess/log-waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        localStorage.removeItem(getStorageKey(unitName));
        window.dispatchEvent(new Event('unit-form-updated'));
        alert('Mess data submitted successfully!');
        onClose();
      } else {
        alert('Failed to submit: ' + await response.text());
      }
    } catch (err) {
      alert('Error submitting form: ' + err.message);
    }
  };

  const submitMessMenu = async () => {
    if (!messMenuMonth || !messMenuBlock || !messMenuFile) {
      alert("Please select Month & Year, Block, and upload a PDF before submitting.");
      return;
    }
    setMessMenuSaving(true);
    try {
      const formData = new FormData();
      formData.append('blockName', messMenuBlock);
      formData.append('monthYear', messMenuMonth);
      formData.append('menuPdf', messMenuFile);

      const res = await fetch('http://localhost:8085/api/mess/menu-pdf', {
        method: 'POST', body: formData
      });
      if (res.ok) {
        alert('Menu PDF uploaded and saved successfully!');
        window.dispatchEvent(new Event('unit-form-updated'));
        if (onClose) onClose();
      } else {
        alert('Failed to save menu: ' + await res.text());
      }
    } catch(e) { 
      alert('Error: ' + e.message); 
    } finally {
      setMessMenuSaving(false);
    }
  };

  const submitMessStaff = async () => {
    try {
      const valid = messStaffs.filter(s => s.name || s.role);
      if (valid.length === 0) { alert('Please enter at least one valid staff to save.'); return; }
      
      const res = await fetch('http://localhost:8085/api/mess/staff', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(valid)
      });
      if (res.ok) { 
        alert('Staff saved!'); 
        setMessStaffs([{ blockName: 'Boys Hostel', name: '', role: '', shift: 'Morning', contact: '' }]);
        fetch('http://localhost:8085/api/mess/data').then(r => r.json()).then(d => setExistingMessStaffs(d.staff || []));
        window.dispatchEvent(new Event('unit-form-updated'));
      }
      else alert('Failed to save staff: ' + await res.text());
    } catch(e) { alert('Error: ' + e.message); }
  };

  const handleUpdateMessStaff = async (staff) => {
    try {
      await fetch('http://localhost:8085/api/mess/update-staff', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(staff)
      });
      alert('Staff updated successfully!');
      window.dispatchEvent(new Event('unit-form-updated'));
    } catch(e) { alert('Failed to update staff'); }
  };

  const handleDeleteMessStaff = async (id) => {
    try {
      await fetch(`http://localhost:8085/api/mess/delete-staff?id=${id}`, { method: 'DELETE' });
      fetch('http://localhost:8085/api/mess/data').then(r => r.json()).then(d => setExistingMessStaffs(d.staff || []));
      window.dispatchEvent(new Event('unit-form-updated'));
    } catch(e) { console.error(e); }
  };

  const submitMessEquip = async () => {
    try {
      const valid = messEquipments.filter(e => e.name);
      if (valid.length === 0) { alert('Please enter at least one valid equipment to save.'); return; }
      
      const payload = valid.map(e => ({
        ...e, total: parseInt(e.total)||0, working: parseInt(e.working)||0, damaged: parseInt(e.damaged)||0
      }));

      const res = await fetch('http://localhost:8085/api/mess/equipment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (res.ok) { 
        alert('Equipment saved!'); 
        setMessEquipments([{ blockName: 'Boys Hostel', name: '', total: 0, working: 0, damaged: 0, status: 'Working' }]);
        fetch('http://localhost:8085/api/mess/data').then(r => r.json()).then(d => setExistingMessEquipments(d.equipment || []));
        window.dispatchEvent(new Event('unit-form-updated'));
      }
      else alert('Failed to save equipment: ' + await res.text());
    } catch(e) { alert('Error: ' + e.message); }
  };

  const handleUpdateMessEquipment = async (equipment) => {
    try {
      const payload = {
        ...equipment, total: parseInt(equipment.total)||0, working: parseInt(equipment.working)||0, damaged: parseInt(equipment.damaged)||0
      };
      await fetch('http://localhost:8085/api/mess/update-equipment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      alert('Equipment updated successfully!');
      window.dispatchEvent(new Event('unit-form-updated'));
    } catch(e) { alert('Failed to update equipment'); }
  };

  const handleDeleteMessEquipment = async (id) => {
    try {
      await fetch(`http://localhost:8085/api/mess/delete-equipment?id=${id}`, { method: 'DELETE' });
      fetch('http://localhost:8085/api/mess/data').then(r => r.json()).then(d => setExistingMessEquipments(d.equipment || []));
      window.dispatchEvent(new Event('unit-form-updated'));
    } catch(e) { console.error(e); }
  };


  const onReset = () => {
    setValues(initialValues);
    setSavedAt('');
    setFieldSubmittedAt({});
    localStorage.removeItem(getStorageKey(unitName));
    window.dispatchEvent(new Event('unit-form-updated'));
  };

  const isFieldLocked = (key) => {
    const field = fields.find(f => f.key === key);
    if (!field) return false;
    const cooldownDays = getCooldownDays(field.frequency);
    if (cooldownDays === 0) return false;
    const submittedAt = fieldSubmittedAt[key];
    if (!submittedAt) return false;
    const nextAllowed = addDays(submittedAt, cooldownDays);
    const now = new Date();
    return now < nextAllowed;
  };

  const getNextAllowedDate = (key) => {
    const field = fields.find(f => f.key === key);
    if (!field) return '';
    const cooldownDays = getCooldownDays(field.frequency);
    const submittedAt = fieldSubmittedAt[key];
    if (!submittedAt) return '';
    return addDays(submittedAt, cooldownDays).toLocaleDateString();
  };

  const completedCount = fields.filter((field) => (values[field.key] || '').trim().length > 0).length;
  const completionPct = fields.length > 0 ? Math.round((completedCount / fields.length) * 100) : 0;

  const onChange = (key, nextValue) => {
    setValues((prev) => ({ ...prev, [key]: nextValue }));
  };

  const updateHostelField = (key, value) => {
    setCurrentBlockData(prev => ({ ...prev, [key]: value }));
  };

  const updateWardenField = (index, key, value) => {
    const newList = [...(currentBlockData.wardens || [])];
    newList[index] = { ...newList[index], [key]: value };
    setCurrentBlockData(prev => ({ ...prev, wardens: newList }));
  };

  const addWarden = () => {
    setCurrentBlockData(prev => ({
      ...prev,
      wardens: [...(prev.wardens || []), { name: '', phone: '', role: 'Chief Warden', floor: 'ALL FLOORS' }]
    }));
  };

  const addSupportStaff = () => {
    setCurrentBlockData(prev => ({
      ...prev,
      wardens: [...(prev.wardens || []), { name: '', phone: '', role: 'House Keeper', floor: 'GROUND' }]
    }));
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

  const handleWardenFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        const newWardens = [];
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0) continue;

          const strRow = row.map(c => String(c || '').trim());
          const strRowUpper = strRow.map(c => c.toUpperCase());
          
          if (i === 0 && (strRowUpper.includes('BLOCK') || strRowUpper.includes('NAME'))) continue;

          const blockIndex = strRowUpper.indexOf(String(selectedHostelBlock).toUpperCase());
          if (blockIndex !== -1) {
            const otherCols = strRow.filter((_, idx) => idx !== blockIndex);
            
            let name = '';
            let phone = '';
            let role = 'Chief Warden';
            let floor = 'ALL FLOORS';
            
            let nameFound = false;
            for (let c of otherCols) {
              if (!c) continue;
              const cUpper = c.toUpperCase();
              
              if (/^\d{8,15}$/.test(c.replace(/\D/g, ''))) {
                phone = c;
              } else if (cUpper.includes('WARDEN') || cUpper.includes('CARE') || cUpper.includes('CLEANER') || cUpper.includes('KEEPER') || cUpper.includes('SECURITY')) {
                role = c;
              } else if (cUpper === 'GROUND' || cUpper === 'FIRST' || cUpper === 'SECOND' || cUpper === 'THIRD' || cUpper === 'ALL FLOORS' || cUpper.includes('&') || /^\d$/.test(cUpper)) {
                floor = c;
              } else if (!nameFound) {
                name = c;
                nameFound = true;
              }
            }
            
            if (!phone) {
              phone = `99${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
            }
            if (!name) name = "Unknown Staff";
            
            newWardens.push({ name, phone, role, floor });
          }
        }
        
        if (newWardens.length > 0) {
          setCurrentBlockData(prev => ({
            ...prev,
            wardens: [...(prev.wardens || []), ...newWardens]
          }));
          alert(`Successfully extracted and imported ${newWardens.length} staff members for ${selectedHostelBlock}!`);
        } else {
          alert(`No staff members found for the block "${selectedHostelBlock}" in the uploaded file.`);
        }
      } catch (err) {
        console.error(err);
        alert('Failed to parse Excel file.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null; // Reset input
  };

  const removeWarden = (index) => {
    const newList = (currentBlockData.wardens || []).filter((_, i) => i !== index);
    setCurrentBlockData(prev => ({ ...prev, wardens: newList }));
  };

  const updateResidentField = (index, key, value) => {
    const newList = [...(currentBlockData.residentList || [])];
    newList[index] = { ...newList[index], [key]: value };
    setCurrentBlockData(prev => ({ ...prev, residentList: newList }));
  };

  const addResident = () => {
    setCurrentBlockData(prev => ({
      ...prev,
      residentList: [...(prev.residentList || []), { name: '', rollNo: '', roomNo: '' }]
    }));
  };

  const removeAbsentStudent = (index) => {
    const newList = (currentBlockData.absentList || []).filter((_, i) => i !== index);
    setCurrentBlockData(prev => ({ ...prev, absentList: newList }));
  };

  const updateAbsentField = (index, key, value) => {
    const newList = [...(currentBlockData.absentList || [])];
    newList[index] = { ...newList[index], [key]: value };
    setCurrentBlockData(prev => ({ ...prev, absentList: newList }));
  };

  const addAbsentStudent = () => {
    setCurrentBlockData(prev => ({
      ...prev,
      absentList: [...(prev.absentList || []), { name: '', rollNo: '', roomNo: '' }]
    }));
  };

  const handleAbsentFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });
        
        let headerRow = [];
        let startIndex = 0;
        
        for (let i = 0; i < Math.min(10, data.length); i++) {
          const rowStr = data[i].join(' ').toLowerCase();
          if (rowStr.includes('hostel') && rowStr.includes('name') && rowStr.includes('roll')) {
            headerRow = data[i].map(h => String(h || '').toLowerCase().trim());
            startIndex = i + 1;
            break;
          }
        }
        
        if (headerRow.length === 0) {
          alert('Could not detect header row. Please ensure columns like DATE, ROLL NO, NAME, HOSTEL exist.');
          return;
        }

        const dateIdx = headerRow.findIndex(h => h.includes('date'));
        const hostelIdx = headerRow.findIndex(h => h === 'hostel' || h === 'block');
        const nameIdx = headerRow.findIndex(h => h === 'name' || h.includes('student name'));
        const rollIdx = headerRow.findIndex(h => h.includes('roll') || h.includes('reg'));
        const roomIdx = headerRow.findIndex(h => h.includes('room'));

        if (dateIdx === -1 || hostelIdx === -1 || nameIdx === -1 || rollIdx === -1) {
          alert('Missing required columns. Please ensure DATE, ROLL NO, NAME, and HOSTEL columns exist in the file.');
          return;
        }

        const today = new Date();
        const defaultDateStr = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;
        
        const targetDateInput = window.prompt("Extract absent students for which date? (Must match format in Excel)", defaultDateStr);
        if (!targetDateInput) return;

        const newAbsents = [];
        const currentHostelName = (currentBlockData.name || '').toLowerCase().trim();

        for (let i = startIndex; i < data.length; i++) {
          const row = data[i];
          if (!row || !row[dateIdx]) continue;
          
          const rowDateStr = String(row[dateIdx]).trim();
          const rowHostelStr = String(row[hostelIdx] || '').toLowerCase().trim();

          const isMatchingDate = rowDateStr === targetDateInput.trim();
          const isMatchingHostel = rowHostelStr === currentHostelName || 
                                   currentHostelName.includes(rowHostelStr) || 
                                   rowHostelStr.includes(currentHostelName);

          if (isMatchingDate && isMatchingHostel) {
             newAbsents.push({
                name: String(row[nameIdx] || '').trim(),
                rollNo: String(row[rollIdx] || '').trim(),
                roomNo: roomIdx !== -1 ? String(row[roomIdx] || '').trim() : ''
             });
          }
        }
        
        if (newAbsents.length > 0) {
          setCurrentBlockData(prev => ({
            ...prev,
            absentList: [...(prev.absentList || []), ...newAbsents]
          }));
          alert(`Successfully extracted ${newAbsents.length} absent students for ${currentBlockData.name} on ${targetDateInput}!`);
        } else {
          alert(`No matching students found for Block: ${currentBlockData.name} and Date: ${targetDateInput}.`);
        }
      } catch (err) {
        console.error(err);
        alert('Failed to parse Excel file. Please check the console for details.');
      }
      e.target.value = null;
    };
    reader.readAsBinaryString(file);
  };

  const handleResidentFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        const newResidents = [];
        let startIndex = 0;
        if (data.length > 0 && typeof data[0][0] === 'string' && data[0][0].toLowerCase().includes('name')) {
          startIndex = 1;
        }
        for (let i = startIndex; i < data.length; i++) {
          const row = data[i];
          if (row && (row[0] || row[1] || row[2])) {
            newResidents.push({
              name: String(row[0] || '').trim(),
              rollNo: String(row[1] || '').trim(),
              roomNo: String(row[2] || '').trim()
            });
          }
        }
        
        if (newResidents.length > 0) {
          setCurrentBlockData(prev => ({
            ...prev,
            residentList: [...(prev.residentList || []), ...newResidents]
          }));
          alert(`Successfully imported ${newResidents.length} students!`);
        } else {
          alert('No valid student data found in the file.');
        }
      } catch (err) {
        console.error(err);
        alert('Failed to parse Excel file. Please ensure it has columns: Name, Roll No, Room No');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null; // Reset input
  };

  const removeResident = (index) => {
    const newList = (currentBlockData.residentList || []).filter((_, i) => i !== index);
    setCurrentBlockData(prev => ({ ...prev, residentList: newList }));
  };

  const updateComplaintField = (index, key, value) => {
    const newList = [...(currentBlockData.complaints || [])];
    newList[index] = { ...newList[index], [key]: value };
    setCurrentBlockData(prev => ({ ...prev, complaints: newList }));
  };

  const addComplaint = () => {
    setCurrentBlockData(prev => ({
      ...prev,
      complaints: [
        ...(prev.complaints || []),
        { id: `TKT-${Math.floor(Math.random() * 1000)}`, block: selectedHostelBlock, type: '', desc: '', status: 'Pending', date: new Date().toISOString().split('T')[0] }
      ]
    }));
  };

  const removeComplaint = (index) => {
    const newList = (currentBlockData.complaints || []).filter((_, i) => i !== index);
    setCurrentBlockData(prev => ({ ...prev, complaints: newList }));
  };

  const updateFloorDetailField = (index, key, value) => {
    const newList = [...(currentBlockData.floorDetails || [])];
    newList[index] = { ...newList[index], [key]: value };
    setCurrentBlockData(prev => ({ ...prev, floorDetails: newList }));
  };

  const addFloorDetail = () => {
    const currentFloors = currentBlockData.floorDetails || [];
    const nextFloorNumber = currentFloors.length; // E.g., 0 for first floor, 1 for second floor
    setCurrentBlockData(prev => ({
      ...prev,
      floorDetails: [...(prev.floorDetails || []), { floorNumber: nextFloorNumber, totalRooms: 0, studentRooms: 0, wardenRooms: 0, supervisorRooms: 0, restRooms: 0, roomTypes: 'Single Cot', totalBeds: 0 }]
    }));
  };

  const removeFloorDetail = (index) => {
    const newList = (currentBlockData.floorDetails || []).filter((_, i) => i !== index);
    const resequencedList = newList.map((item, idx) => ({ ...item, floorNumber: idx }));
    setCurrentBlockData(prev => ({ ...prev, floorDetails: resequencedList }));
  };

  const handleNumFloorsChange = (newVal) => {
    const val = parseInt(newVal) || 0;
    setCurrentBlockData(prev => {
      let currentFloors = [...(prev.floorDetails || [])];
      if (currentFloors.length < val) {
        for (let i = currentFloors.length; i < val; i++) {
          currentFloors.push({ floorNumber: i, totalRooms: 0, roomTypes: 'Single Cot', totalBeds: 0 });
        }
      } else if (currentFloors.length > val) {
        currentFloors = currentFloors.slice(0, val);
      }
      return { ...prev, numFloors: val, floorDetails: currentFloors };
    });
  };

  const [newBlockName, setNewBlockName] = useState('');

  const handleAddBlock = () => {
    if (!newBlockName.trim()) return;
    const newBlock = {
      name: newBlockName,
      gender: selectedGender,
      beds: 0,
      occupied: 0,
      type: '',
      wardens: [],
      staffCount: 0,
      residentList: [],
      complaints: [],
      numFloors: 0,
      totalRooms: 0,
      floorDetails: [],
      chiefWardenCount: 0,
      deputyWardenCount: 0,
      seniorCaretakerCount: 0,
      careTakerAttenderCount: 0,
      houseKeeperCount: 0,
      bathroomCleanerCount: 0,
      securityCount: 0,
      vacantBeds: 0,
      maintenanceRoomsBeds: 0
    };
    setHostelBlocks([...hostelBlocks, newBlock]);
    setCurrentBlockData(newBlock);
    setSelectedHostelBlock(newBlockName);
    setNewBlockName('');
  };

  // ─── Chiller Plant Form ──────────────────────────────────────────────────
  if (unitName === 'Chiller Plant') {
    const SLOTS = [
      { key: 's1', label: 'Morning Shift', hours: '6:00 AM – 10:00 AM', max: 4, type: 'Peak' },
      { key: 's2', label: 'Day Shift', hours: '10:00 AM – 6:00 PM', max: 8, type: 'Non-Peak' },
      { key: 's3', label: 'Evening Shift', hours: '6:00 PM – 10:00 PM', max: 4, type: 'Peak' },
      { key: 's4', label: 'Night Shift', hours: '10:00 PM – 6:00 AM', max: 8, type: 'Night' },
    ];

    const slotInput = (state, setState, sk, max) => (
      <input
        type="number"
        step="0.5"
        min="0"
        max={max}
        value={state[sk]}
        onChange={e => {
          setState(prev => ({ ...prev, [sk]: e.target.value }));
        }}
        onBlur={e => {
          let val = parseFloat(e.target.value);
          if (isNaN(val)) {
            setState(prev => ({ ...prev, [sk]: '' }));
            return;
          }
          if (val < 0) val = 0;
          if (val > max) val = max;
          setState(prev => ({ ...prev, [sk]: val.toString() }));
        }}
        style={{
          width: '100%', boxSizing: 'border-box', padding: '8px 6px', textAlign: 'center',
          border: '1px solid #cbd5e1', borderRadius: '8px',
          fontSize: '1rem', fontWeight: 700, outline: 'none',
          background: '#fff', color: '#0f172a',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
        }}
      />
    );

    const calcCell = (val) => (
      <td style={{ textAlign: 'center', fontWeight: 700, color: '#1d4ed8', fontSize: '0.95rem',
                   background: '#eff6ff', padding: '8px 6px', border: '1px solid #bfdbfe' }}>
        {val % 1 === 0 ? val : val.toFixed(1)}
      </td>
    );

    const thStyle = (bg = '#1e3a5f', color = '#fff') => ({
      background: bg, color, padding: '8px 6px',
      border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.75rem',
      fontWeight: 700, textAlign: 'center', whiteSpace: 'pre-line', lineHeight: 1.3
    });

    const tdStyle = { padding: '6px 4px', border: '1px solid #e2e8f0' };

    return (
      <div style={{ fontFamily: 'Inter, sans-serif', color: '#0f172a', padding: '4px' }}>
        {/* Header */}
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '24px', background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', padding: '24px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.25)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.5px' }}>
              ❄️ BIT Chiller Plant
            </h3>
            <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: '#bfdbfe', fontWeight: 500 }}>
              Manage static inventory and dynamic daily operating logs.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'rgba(255,255,255,0.15)', padding: '10px 16px', borderRadius: '12px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', maxWidth: '100%', boxSizing: 'border-box' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap' }}>Log Date:</label>
            <input type="date" value={chillerDate} onChange={e => setChillerDate(e.target.value)} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}
              style={{ flex: 1, minWidth: 0, padding: '8px 12px', borderRadius: '8px', border: 'none', fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a', background: '#ffffff', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }} />
          </div>
        </div>

        {/* Tabs for Chiller Plant Form */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '28px', background: '#f8fafc', padding: '8px', borderRadius: '12px', border: '1px solid #e2e8f0', width: 'fit-content' }}>
          {[
            { id: 'static', label: '📊 Static Data' },
            { id: 'dynamic', label: '⚡ Dynamic Data' },
            { id: 'ahu', label: '🏢 AHU Units' },
            { id: 'split', label: '❄️ Split A/C' },
            { id: 'vrv', label: '🌀 VRV A/C' },
            { id: 'coldroom', label: '🧊 COLD Room' },
            { id: 'breakdowns', label: '🔧 Breakdowns' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setChillerTab(tab.id)}
              style={{ 
                padding: '10px 18px', 
                borderRadius: '8px', 
                border: 'none', 
                background: chillerTab === tab.id ? '#fff' : 'transparent', 
                color: chillerTab === tab.id ? '#2563eb' : '#64748b', 
                fontWeight: 800, 
                fontSize: '0.9rem', 
                cursor: 'pointer', 
                transition: 'all 0.2s', 
                boxShadow: chillerTab === tab.id ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none' 
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        
        {chillerTab === 'ahu' && (
          <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, color: '#0f172a' }}>🏢 AHU Units Data Entry</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <label style={{ cursor: 'pointer', padding: '8px 16px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                    + Upload Excel
                    <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => handleGenericFileUpload(setAhuUnits, { block: '', floor: '', loc: '', type: '', cap: '', qty: '', totCap: '', hp: '', totHp: '', area: '' }, e)} style={{ display: 'none' }} />
                  </label>
                  <button onClick={() => setAhuUnits([...ahuUnits, { block: '', floor: '', loc: '', type: '', cap: '', qty: '', totCap: '', hp: '', totHp: '', area: '' }])} style={{ padding: '8px 16px', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>+ Add AHU Unit</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto' }}>
                {ahuUnits.map((u, i) => (
                  <div key={`new-ahuUnits-${i}`} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <FieldBox label="Block">
                        <input type="text" placeholder="Block" value={u.block} onChange={e => { const n = [...ahuUnits]; n[i].block = e.target.value; setAhuUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Floor">
                        <input type="text" placeholder="Floor" value={u.floor} onChange={e => { const n = [...ahuUnits]; n[i].floor = e.target.value; setAhuUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Location">
                        <input type="text" placeholder="Location" value={u.loc} onChange={e => { const n = [...ahuUnits]; n[i].loc = e.target.value; setAhuUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Type">
                        <input type="text" placeholder="Type" value={u.type} onChange={e => { const n = [...ahuUnits]; n[i].type = e.target.value; setAhuUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Cap TR">
                        <input type="number" placeholder="Cap TR" value={u.cap} onChange={e => { const n = [...ahuUnits]; n[i].cap = e.target.value; setAhuUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Qty">
                        <input type="number" placeholder="Qty" value={u.qty} onChange={e => { const n = [...ahuUnits]; n[i].qty = e.target.value; setAhuUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Tot Cap">
                        <input type="number" placeholder="Tot Cap" value={u.totCap} onChange={e => { const n = [...ahuUnits]; n[i].totCap = e.target.value; setAhuUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="HP">
                        <input type="number" placeholder="HP" value={u.hp} onChange={e => { const n = [...ahuUnits]; n[i].hp = e.target.value; setAhuUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Tot HP">
                        <input type="number" placeholder="Tot HP" value={u.totHp} onChange={e => { const n = [...ahuUnits]; n[i].totHp = e.target.value; setAhuUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Area">
                        <input type="number" placeholder="Area" value={u.area} onChange={e => { const n = [...ahuUnits]; n[i].area = e.target.value; setAhuUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>

                      <button onClick={() => setAhuUnits(ahuUnits.filter((_, idx) => idx !== i))} style={{ padding: '10px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Cancel</button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', textAlign: 'right' }}>
                <button style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }} onClick={onSaveAhuUnits}>Save AHU Units</button>
              </div>
            </div>

            {existingAhuUnits.length > 0 && (
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, color: '#0f172a' }}>📋 Existing AHU Units</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                  {existingAhuUnits.map((u, i) => (
                  <div key={u.id || i} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <FieldBox label="Block">
                        <input type="text" value={u.block || ''} onChange={e => { const n = [...existingAhuUnits]; n[i].block = e.target.value; setExistingAhuUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Floor">
                        <input type="text" value={u.floor || ''} onChange={e => { const n = [...existingAhuUnits]; n[i].floor = e.target.value; setExistingAhuUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Location">
                        <input type="text" value={u.loc || ''} onChange={e => { const n = [...existingAhuUnits]; n[i].loc = e.target.value; setExistingAhuUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Type">
                        <input type="text" value={u.type || ''} onChange={e => { const n = [...existingAhuUnits]; n[i].type = e.target.value; setExistingAhuUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Capacity">
                        <input type="number" value={u.cap || ''} onChange={e => { const n = [...existingAhuUnits]; n[i].cap = e.target.value; setExistingAhuUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Qty">
                        <input type="number" value={u.qty || ''} onChange={e => { const n = [...existingAhuUnits]; n[i].qty = e.target.value; setExistingAhuUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Total Cap">
                        <input type="number" value={u.totCap || ''} onChange={e => { const n = [...existingAhuUnits]; n[i].totCap = e.target.value; setExistingAhuUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="HP">
                        <input type="number" value={u.hp || ''} onChange={e => { const n = [...existingAhuUnits]; n[i].hp = e.target.value; setExistingAhuUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Total HP">
                        <input type="number" value={u.totHp || ''} onChange={e => { const n = [...existingAhuUnits]; n[i].totHp = e.target.value; setExistingAhuUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Area">
                        <input type="number" value={u.area || ''} onChange={e => { const n = [...existingAhuUnits]; n[i].area = e.target.value; setExistingAhuUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                      <button onClick={() => handleUpdateExistingAhuUnit(u)} style={{ padding: '10px 14px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>💾 Update</button>
                      <button onClick={() => handleDeleteExistingAhuUnit(u.id)} style={{ padding: '10px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>
        )}
            
        {chillerTab === 'split' && (
          <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, color: '#0f172a' }}>❄️ Split A/C Data Entry</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <label style={{ cursor: 'pointer', padding: '8px 16px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                    + Upload Excel
                    <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => handleGenericFileUpload(setSplitAcUnits, { make: '', ton: '', model: '', block: '', dept: '', qty: '', totTon: '', loc: '' }, e)} style={{ display: 'none' }} />
                  </label>
                  <button onClick={() => setSplitAcUnits([...splitAcUnits, { make: '', ton: '', model: '', block: '', dept: '', qty: '', totTon: '', loc: '' }])} style={{ padding: '8px 16px', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>+ Add Split A/C</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto' }}>
                {splitAcUnits.map((u, i) => (
                  <div key={`new-splitAcUnits-${i}`} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <FieldBox label="Make">
                        <input type="text" placeholder="Make" value={u.make} onChange={e => { const n = [...splitAcUnits]; n[i].make = e.target.value; setSplitAcUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Ton">
                        <input type="number" placeholder="Ton" value={u.ton} onChange={e => { const n = [...splitAcUnits]; n[i].ton = e.target.value; setSplitAcUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Model">
                        <input type="text" placeholder="Model" value={u.model} onChange={e => { const n = [...splitAcUnits]; n[i].model = e.target.value; setSplitAcUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Block No/Name">
                        <input type="text" placeholder="Block No/Name" value={u.block} onChange={e => { const n = [...splitAcUnits]; n[i].block = e.target.value; setSplitAcUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Depart.">
                        <input type="text" placeholder="Depart." value={u.dept} onChange={e => { const n = [...splitAcUnits]; n[i].dept = e.target.value; setSplitAcUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Qty">
                        <input type="number" placeholder="Qty" value={u.qty} onChange={e => { const n = [...splitAcUnits]; n[i].qty = e.target.value; setSplitAcUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Total Ton">
                        <input type="number" placeholder="Total Ton" value={u.totTon} onChange={e => { const n = [...splitAcUnits]; n[i].totTon = e.target.value; setSplitAcUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Location">
                        <input type="text" placeholder="Location" value={u.loc} onChange={e => { const n = [...splitAcUnits]; n[i].loc = e.target.value; setSplitAcUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>

                      <button onClick={() => setSplitAcUnits(splitAcUnits.filter((_, idx) => idx !== i))} style={{ padding: '10px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Cancel</button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', textAlign: 'right' }}>
                <button style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }} onClick={onSaveSplitAcUnits}>Save Split A/C Units</button>
              </div>
            </div>

            {existingSplitAcUnits.length > 0 && (
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, color: '#0f172a' }}>📋 Existing Split A/C Units</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                  {existingSplitAcUnits.map((u, i) => (
                  <div key={u.id || i} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <FieldBox label="Make">
                        <input type="text" value={u.make || ''} onChange={e => { const n = [...existingSplitAcUnits]; n[i].make = e.target.value; setExistingSplitAcUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Ton">
                        <input type="number" value={u.ton || ''} onChange={e => { const n = [...existingSplitAcUnits]; n[i].ton = e.target.value; setExistingSplitAcUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Model">
                        <input type="text" value={u.model || ''} onChange={e => { const n = [...existingSplitAcUnits]; n[i].model = e.target.value; setExistingSplitAcUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Block">
                        <input type="text" value={u.block || ''} onChange={e => { const n = [...existingSplitAcUnits]; n[i].block = e.target.value; setExistingSplitAcUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Dept">
                        <input type="text" value={u.dept || ''} onChange={e => { const n = [...existingSplitAcUnits]; n[i].dept = e.target.value; setExistingSplitAcUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Qty">
                        <input type="number" value={u.qty || ''} onChange={e => { const n = [...existingSplitAcUnits]; n[i].qty = e.target.value; setExistingSplitAcUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Total Ton">
                        <input type="number" value={u.totTon || ''} onChange={e => { const n = [...existingSplitAcUnits]; n[i].totTon = e.target.value; setExistingSplitAcUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Location">
                        <input type="text" value={u.loc || ''} onChange={e => { const n = [...existingSplitAcUnits]; n[i].loc = e.target.value; setExistingSplitAcUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                      <button onClick={() => handleUpdateExistingSplitAcUnit(u)} style={{ padding: '10px 14px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>💾 Update</button>
                      <button onClick={() => handleDeleteExistingSplitAcUnit(u.id)} style={{ padding: '10px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Remove</button>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            )}
          </div>
        )}
        {chillerTab === 'vrv' && (
          <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, color: '#0f172a' }}>🌀 VRV A/C Data Entry</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <label style={{ cursor: 'pointer', padding: '8px 16px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                    + Upload Excel
                    <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => handleGenericFileUpload(setVrvUnits, { make: '', ton: '', model: '', block: '', dept: '', qty: '', totTon: '', loc: '', notes: '' }, e)} style={{ display: 'none' }} />
                  </label>
                  <button onClick={() => setVrvUnits([...vrvUnits, { make: '', ton: '', model: '', block: '', dept: '', qty: '', totTon: '', loc: '', notes: '' }])} style={{ padding: '8px 16px', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>+ Add VRV</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto' }}>
                {vrvUnits.map((u, i) => (
                  <div key={`new-vrvUnits-${i}`} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <FieldBox label="Make">
                        <input type="text" placeholder="Make" value={u.make} onChange={e => { const n = [...vrvUnits]; n[i].make = e.target.value; setVrvUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Ton">
                        <input type="number" placeholder="Ton" value={u.ton} onChange={e => { const n = [...vrvUnits]; n[i].ton = e.target.value; setVrvUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Model">
                        <input type="text" placeholder="Model" value={u.model} onChange={e => { const n = [...vrvUnits]; n[i].model = e.target.value; setVrvUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Block No">
                        <input type="text" placeholder="Block No" value={u.block} onChange={e => { const n = [...vrvUnits]; n[i].block = e.target.value; setVrvUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Depart.">
                        <input type="text" placeholder="Depart." value={u.dept} onChange={e => { const n = [...vrvUnits]; n[i].dept = e.target.value; setVrvUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Qty">
                        <input type="number" placeholder="Qty" value={u.qty} onChange={e => { const n = [...vrvUnits]; n[i].qty = e.target.value; setVrvUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Total Ton">
                        <input type="number" placeholder="Total Ton" value={u.totTon} onChange={e => { const n = [...vrvUnits]; n[i].totTon = e.target.value; setVrvUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Location">
                        <input type="text" placeholder="Location" value={u.loc} onChange={e => { const n = [...vrvUnits]; n[i].loc = e.target.value; setVrvUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Notes">
                        <input type="text" placeholder="Notes" value={u.notes} onChange={e => { const n = [...vrvUnits]; n[i].notes = e.target.value; setVrvUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>

                      <button onClick={() => setVrvUnits(vrvUnits.filter((_, idx) => idx !== i))} style={{ padding: '10px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Cancel</button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', textAlign: 'right' }}>
                <button style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }} onClick={onSaveVrvUnits}>Save VRV Units</button>
              </div>
            </div>            {existingVrvUnits.length > 0 && (
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, color: '#0f172a' }}>📋 Existing VRV Units</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                  {existingVrvUnits.map((u, i) => (
                  <div key={u.id || i} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <FieldBox label="Make">
                        <input type="text" value={u.make || ''} onChange={e => { const n = [...existingVrvUnits]; n[i].make = e.target.value; setExistingVrvUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Ton">
                        <input type="number" value={u.ton || ''} onChange={e => { const n = [...existingVrvUnits]; n[i].ton = e.target.value; setExistingVrvUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Model">
                        <input type="text" value={u.model || ''} onChange={e => { const n = [...existingVrvUnits]; n[i].model = e.target.value; setExistingVrvUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Block">
                        <input type="text" value={u.block || ''} onChange={e => { const n = [...existingVrvUnits]; n[i].block = e.target.value; setExistingVrvUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Dept">
                        <input type="text" value={u.dept || ''} onChange={e => { const n = [...existingVrvUnits]; n[i].dept = e.target.value; setExistingVrvUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Qty">
                        <input type="number" value={u.qty || ''} onChange={e => { const n = [...existingVrvUnits]; n[i].qty = e.target.value; setExistingVrvUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Total Ton">
                        <input type="number" value={u.totTon || ''} onChange={e => { const n = [...existingVrvUnits]; n[i].totTon = e.target.value; setExistingVrvUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Location">
                        <input type="text" value={u.loc || ''} onChange={e => { const n = [...existingVrvUnits]; n[i].loc = e.target.value; setExistingVrvUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Notes">
                        <input type="text" value={u.notes || ''} onChange={e => { const n = [...existingVrvUnits]; n[i].notes = e.target.value; setExistingVrvUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                      <button onClick={() => handleUpdateExistingVrvUnit(u)} style={{ padding: '10px 14px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>💾 Update</button>
                      <button onClick={() => handleDeleteExistingVrvUnit(u.id)} style={{ padding: '10px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Remove</button>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            )}
          </div>
        )}
            
        {chillerTab === 'coldroom' && (
          <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, color: '#0f172a' }}>❄️ COLD Room Units Data Entry</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <label style={{ cursor: 'pointer', padding: '8px 16px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                    + Upload Excel
                    <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => handleGenericFileUpload(setColdRoomUnits, { make: '', ton: '', model: '', block: '', dept: '', qty: '', totTon: '', loc: '' }, e)} style={{ display: 'none' }} />
                  </label>
                  <button onClick={() => setColdRoomUnits([...coldRoomUnits, { make: '', ton: '', model: '', block: '', dept: '', qty: '', totTon: '', loc: '' }])} style={{ padding: '8px 16px', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>+ Add COLD Room</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto' }}>
                {coldRoomUnits.map((u, i) => (
                  <div key={`new-coldRoomUnits-${i}`} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <FieldBox label="Make">
                        <input type="text" placeholder="Make" value={u.make} onChange={e => { const n = [...coldRoomUnits]; n[i].make = e.target.value; setColdRoomUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Ton">
                        <input type="number" placeholder="Ton" value={u.ton} onChange={e => { const n = [...coldRoomUnits]; n[i].ton = e.target.value; setColdRoomUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Model">
                        <input type="text" placeholder="Model" value={u.model} onChange={e => { const n = [...coldRoomUnits]; n[i].model = e.target.value; setColdRoomUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Block No">
                        <input type="text" placeholder="Block No" value={u.block} onChange={e => { const n = [...coldRoomUnits]; n[i].block = e.target.value; setColdRoomUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Depart.">
                        <input type="text" placeholder="Depart." value={u.dept} onChange={e => { const n = [...coldRoomUnits]; n[i].dept = e.target.value; setColdRoomUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Qty">
                        <input type="number" placeholder="Qty" value={u.qty} onChange={e => { const n = [...coldRoomUnits]; n[i].qty = e.target.value; setColdRoomUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Total Ton">
                        <input type="number" placeholder="Total Ton" value={u.totTon} onChange={e => { const n = [...coldRoomUnits]; n[i].totTon = e.target.value; setColdRoomUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Location">
                        <input type="text" placeholder="Location" value={u.loc} onChange={e => { const n = [...coldRoomUnits]; n[i].loc = e.target.value; setColdRoomUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                      <button onClick={() => setColdRoomUnits(coldRoomUnits.filter((_, idx) => idx !== i))} style={{ padding: '10px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Cancel</button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', textAlign: 'right' }}>
                <button style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }} onClick={onSaveColdRoomUnits}>Save COLD Room Units</button>
              </div>
            </div>

            {existingColdRoomUnits.length > 0 && (
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, color: '#0f172a' }}>📋 Existing COLD Room Units</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                  {existingColdRoomUnits.map((u, i) => (
                  <div key={u.id || i} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <FieldBox label="Make">
                        <input type="text" value={u.make || ''} onChange={e => { const n = [...existingColdRoomUnits]; n[i].make = e.target.value; setExistingColdRoomUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Ton">
                        <input type="number" value={u.ton || ''} onChange={e => { const n = [...existingColdRoomUnits]; n[i].ton = e.target.value; setExistingColdRoomUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Model">
                        <input type="text" value={u.model || ''} onChange={e => { const n = [...existingColdRoomUnits]; n[i].model = e.target.value; setExistingColdRoomUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Block">
                        <input type="text" value={u.block || ''} onChange={e => { const n = [...existingColdRoomUnits]; n[i].block = e.target.value; setExistingColdRoomUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Dept">
                        <input type="text" value={u.dept || ''} onChange={e => { const n = [...existingColdRoomUnits]; n[i].dept = e.target.value; setExistingColdRoomUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Qty">
                        <input type="number" value={u.qty || ''} onChange={e => { const n = [...existingColdRoomUnits]; n[i].qty = e.target.value; setExistingColdRoomUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Total Ton">
                        <input type="number" value={u.totTon || ''} onChange={e => { const n = [...existingColdRoomUnits]; n[i].totTon = e.target.value; setExistingColdRoomUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Location">
                        <input type="text" value={u.loc || ''} onChange={e => { const n = [...existingColdRoomUnits]; n[i].loc = e.target.value; setExistingColdRoomUnits(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                      <button onClick={() => handleUpdateExistingColdRoomUnit(u)} style={{ padding: '10px 14px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>💾 Update</button>
                      <button onClick={() => handleDeleteExistingColdRoomUnit(u.id)} style={{ padding: '10px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Remove</button>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {chillerTab === 'breakdowns' && (
          <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, color: '#0f172a' }}>🛠️ Breakdown Maintenance Data Entry</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <label style={{ cursor: 'pointer', padding: '8px 16px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                    + Upload Excel
                    <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => handleGenericFileUpload(setBreakdowns, { date: '', equipment: '', issue: '', resolution: '', status: 'Pending' }, e)} style={{ display: 'none' }} />
                  </label>
                  <button onClick={() => setBreakdowns([...breakdowns, { date: '', equipment: '', issue: '', resolution: '', status: 'Pending' }])} style={{ padding: '8px 16px', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>+ Add Breakdown</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto' }}>
                {breakdowns.map((u, i) => (
                  <div key={`new-breakdowns-${i}`} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <FieldBox label="Date">
                        <input type="date" value={u.date} onChange={e => { const nw = [...breakdowns]; nw[i].date = e.target.value; setBreakdowns(nw); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Equipment">
                        <input type="text" placeholder="Equipment" value={u.equipment} onChange={e => { const nw = [...breakdowns]; nw[i].equipment = e.target.value; setBreakdowns(nw); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Issue">
                        <input type="text" placeholder="Issue" value={u.issue} onChange={e => { const nw = [...breakdowns]; nw[i].issue = e.target.value; setBreakdowns(nw); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Resolution">
                        <input type="text" placeholder="Resolution" value={u.resolution} onChange={e => { const nw = [...breakdowns]; nw[i].resolution = e.target.value; setBreakdowns(nw); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Status">
                        <select value={u.status} onChange={e => { const nw = [...breakdowns]; nw[i].status = e.target.value; setBreakdowns(nw); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none' }}>
                          <option value="Pending">Pending</option>
                          <option value="Resolved">Resolved</option>
                          <option value="In Progress">In Progress</option>
                        </select>
                      </FieldBox>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                      <button onClick={() => setBreakdowns(breakdowns.filter((_, idx) => idx !== i))} style={{ padding: '10px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Cancel</button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', textAlign: 'right' }}>
                <button style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }} onClick={onSaveBreakdowns}>Save Breakdowns</button>
              </div>
            </div>

            {existingBreakdowns.length > 0 && (
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, color: '#0f172a' }}>📋 Existing Breakdowns</h4>
                </div>
                {existingBreakdowns.map((u, i) => (
                  <div key={u.id || i} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <FieldBox label="Date">
                        <input type="date" value={u.date || ''} onChange={e => { const n = [...existingBreakdowns]; n[i].date = e.target.value; setExistingBreakdowns(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Equipment">
                        <input type="text" value={u.equipment || ''} onChange={e => { const n = [...existingBreakdowns]; n[i].equipment = e.target.value; setExistingBreakdowns(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Issue">
                        <input type="text" value={u.issue || ''} onChange={e => { const n = [...existingBreakdowns]; n[i].issue = e.target.value; setExistingBreakdowns(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Resolution">
                        <input type="text" value={u.resolution || ''} onChange={e => { const n = [...existingBreakdowns]; n[i].resolution = e.target.value; setExistingBreakdowns(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Status">
                        <select value={u.status || 'Pending'} onChange={e => { const nw = [...existingBreakdowns]; nw[i].status = e.target.value; setExistingBreakdowns(nw); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }}>
                          <option value="Pending">Pending</option>
                          <option value="Resolved">Resolved</option>
                          <option value="In Progress">In Progress</option>
                        </select>
                      </FieldBox>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                      <button onClick={() => handleUpdateBreakdown(u)} style={{ padding: '10px 14px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>💾 Update</button>
                      <button onClick={() => handleDeleteBreakdown(u.id)} style={{ padding: '10px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


{chillerTab === 'static' && (
          <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
            
            {/* Products List (Plant Specs) */}
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, color: '#0f172a' }}>📦 Product Specifications (Plant Specs)</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <label style={{ cursor: 'pointer', padding: '8px 16px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                    + Upload Excel
                    <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => handleGenericFileUpload(setPlantSpecs, { parameter: '', value: '', unit: '', remarks: '' }, e)} style={{ display: 'none' }} />
                  </label>
                  <button onClick={() => setPlantSpecs([...plantSpecs, { parameter: '', value: '', unit: '', remarks: '' }])} style={{ padding: '8px 16px', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>+ Add Product</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {existingPlantSpecs.map((u, i) => (
                  <div key={u.id} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <FieldBox label="Parameter">
                        <input type="text" value={u.parameter} onChange={e => { const n = [...existingPlantSpecs]; n[i].parameter = e.target.value; setExistingPlantSpecs(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Value">
                        <input type="text" value={u.value} onChange={e => { const n = [...existingPlantSpecs]; n[i].value = e.target.value; setExistingPlantSpecs(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Unit">
                        <input type="text" value={u.unit} onChange={e => { const n = [...existingPlantSpecs]; n[i].unit = e.target.value; setExistingPlantSpecs(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Remarks">
                        <input type="text" value={u.remarks} onChange={e => { const n = [...existingPlantSpecs]; n[i].remarks = e.target.value; setExistingPlantSpecs(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                      <button onClick={() => handleUpdatePlantSpec(u)} style={{ padding: '10px 14px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>Update Spec</button>
                      <button onClick={() => handleDeletePlantSpec(u.id)} style={{ padding: '10px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Remove</button>
                    </div>
                  </div>
                ))}
                {plantSpecs.map((u, i) => (
                  <div key={`new-p-${i}`} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <FieldBox label="Parameter">
                        <input type="text" placeholder="e.g. McQuay Chiller" value={u.parameter} onChange={e => { const n = [...plantSpecs]; n[i].parameter = e.target.value; setPlantSpecs(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }} />
                      </FieldBox>
                      <FieldBox label="Value">
                        <input type="text" placeholder="e.g. 500" value={u.value} onChange={e => { const n = [...plantSpecs]; n[i].value = e.target.value; setPlantSpecs(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }} />
                      </FieldBox>
                      <FieldBox label="Unit">
                        <input type="text" placeholder="e.g. TR" value={u.unit} onChange={e => { const n = [...plantSpecs]; n[i].unit = e.target.value; setPlantSpecs(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }} />
                      </FieldBox>
                      <FieldBox label="Remarks">
                        <input type="text" placeholder="Additional notes" value={u.remarks} onChange={e => { const n = [...plantSpecs]; n[i].remarks = e.target.value; setPlantSpecs(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }} />
                      </FieldBox>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={() => setPlantSpecs(plantSpecs.filter((_, idx) => idx !== i))} style={{ padding: '10px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Cancel</button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', textAlign: 'right' }}>
                <button style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }} onClick={onSavePlantSpecs}>Save Plant Specs</button>
              </div>
            </div>

            {/* Manpower List */}
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, color: '#0f172a' }}>👥 Manpower / Staff</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <label style={{ cursor: 'pointer', padding: '8px 16px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                    + Upload Excel
                    <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => handleGenericFileUpload(setStaff, { name: '', role: '', shift: 'General Shift', attendance: 'Present', contact: '', dateJoined: '' }, e)} style={{ display: 'none' }} />
                  </label>
                  <button onClick={() => setStaff([...staff, { name: '', role: '', shift: 'General Shift', attendance: 'Present', contact: '', dateJoined: '' }])} style={{ padding: '8px 16px', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>+ Add Staff</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {existingStaff.map((st, i) => (
                  <div key={st.id} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <FieldBox label="Staff Name">
                        <input type="text" value={st.name || ''} onChange={e => { const n = [...existingStaff]; n[i].name = e.target.value; setExistingStaff(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Role">
                        <input type="text" value={st.role || ''} onChange={e => { const n = [...existingStaff]; n[i].role = e.target.value; setExistingStaff(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Shift">
                        <select value={st.shift || ''} onChange={e => { const n = [...existingStaff]; n[i].shift = e.target.value; setExistingStaff(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }}>
                          <option value="General Shift">General Shift</option>
                          <option value="Morning Shift">Morning Shift</option>
                          <option value="Evening Shift">Evening Shift</option>
                          <option value="Night Shift">Night Shift</option>
                        </select>
                      </FieldBox>
                      <FieldBox label="Date Joined">
                        <input type="text" value={st.dateJoined || ''} onChange={e => { const n = [...existingStaff]; n[i].dateJoined = e.target.value; setExistingStaff(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Contact">
                        <input type="text" value={st.contact || ''} onChange={e => { const n = [...existingStaff]; n[i].contact = e.target.value; setExistingStaff(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Attendance">
                        <select value={st.attendance || ''} onChange={e => { const n = [...existingStaff]; n[i].attendance = e.target.value; setExistingStaff(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }}>
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                        </select>
                      </FieldBox>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                      <button onClick={() => handleUpdateStaff(st)} style={{ padding: '10px 14px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>💾 Update</button>
                      <button onClick={() => handleDeleteStaff(st.id)} style={{ padding: '10px 16px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Remove Staff</button>
                    </div>
                  </div>
                ))}
                {staff.map((st, i) => (
                  <div key={`new-s-${i}`} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <FieldBox label="Staff Name">
                        <input type="text" placeholder="Staff Name" value={st.name} onChange={e => { const n = [...staff]; n[i].name = e.target.value; setStaff(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }} />
                      </FieldBox>
                      <FieldBox label="Role">
                        <input type="text" placeholder="Role (e.g. Senior A/C Mechanic)" value={st.role} onChange={e => { const n = [...staff]; n[i].role = e.target.value; setStaff(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }} />
                      </FieldBox>
                      <FieldBox label="Shift">
                        <select value={st.shift} onChange={e => { const n = [...staff]; n[i].shift = e.target.value; setStaff(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}>
                          <option value="General Shift">General Shift</option>
                          <option value="Morning Shift">Morning Shift</option>
                          <option value="Evening Shift">Evening Shift</option>
                          <option value="Night Shift">Night Shift</option>
                        </select>
                      </FieldBox>
                      <FieldBox label="Date Joined">
                        <input type="date" value={st.dateJoined} onChange={e => { const n = [...staff]; n[i].dateJoined = e.target.value; setStaff(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }} />
                      </FieldBox>
                      <FieldBox label="Contact">
                        <input type="text" placeholder="WhatsApp / Contact" value={st.contact} onChange={e => { const n = [...staff]; n[i].contact = e.target.value; setStaff(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }} />
                      </FieldBox>
                      <FieldBox label="Attendance">
                        <select value={st.attendance} onChange={e => { const n = [...staff]; n[i].attendance = e.target.value; setStaff(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}>
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                        </select>
                      </FieldBox>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={() => setStaff(staff.filter((_, idx) => idx !== i))} style={{ padding: '10px 16px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Cancel</button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', textAlign: 'right' }}>
                <button style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }} onClick={onSaveStaff}>Save Staff Data</button>
              </div>
            </div>

            {/* Equipment List */}
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, color: '#0f172a' }}>⚙️ Equipment Inventory</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <label style={{ cursor: 'pointer', padding: '8px 16px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                    + Upload Excel
                    <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => handleGenericFileUpload(setEquipments, { name: '', model: '', capacity: '', power: '', type: '', status: 'Active', refrigerant: '', lastService: '', health: '' }, e)} style={{ display: 'none' }} />
                  </label>
                  <button onClick={() => setEquipments([...equipments, { name: '', model: '', capacity: '', power: '', type: '', status: 'Active', refrigerant: '', lastService: '', health: '' }])} style={{ padding: '8px 16px', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>+ Add Equipment</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {existingEquipments.map((eq, i) => (
                  <div key={eq.id} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <FieldBox label="Equipment Name">
                        <input type="text" value={eq.name || ''} onChange={e => { const n = [...existingEquipments]; n[i].name = e.target.value; setExistingEquipments(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Model">
                        <input type="text" value={eq.model || ''} onChange={e => { const n = [...existingEquipments]; n[i].model = e.target.value; setExistingEquipments(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Capacity">
                        <input type="text" value={eq.capacity || ''} onChange={e => { const n = [...existingEquipments]; n[i].capacity = e.target.value; setExistingEquipments(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Type">
                        <input type="text" value={eq.type || ''} onChange={e => { const n = [...existingEquipments]; n[i].type = e.target.value; setExistingEquipments(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Refrigerant">
                        <input type="text" value={eq.refrigerant || ''} onChange={e => { const n = [...existingEquipments]; n[i].refrigerant = e.target.value; setExistingEquipments(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Status">
                        <select value={eq.status || ''} onChange={e => { const n = [...existingEquipments]; n[i].status = e.target.value; setExistingEquipments(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }}>
                          <option value="Running">Running</option>
                          <option value="Standby">Standby</option>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </FieldBox>
                      <FieldBox label="Last Service Date">
                        <input type="date" value={eq.lastService || ''} onChange={e => { const n = [...existingEquipments]; n[i].lastService = e.target.value; setExistingEquipments(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                      <FieldBox label="Health %">
                        <input type="number" value={eq.health || 0} onChange={e => { const n = [...existingEquipments]; n[i].health = parseInt(e.target.value) || 0; setExistingEquipments(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                      </FieldBox>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                      <button onClick={() => handleUpdateEquipment(eq)} style={{ padding: '10px 14px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>💾 Update</button>
                      <button onClick={() => handleDeleteEquipment(eq.id)} style={{ padding: '10px 16px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Remove Eq</button>
                    </div>
                  </div>
                ))}
                {equipments.map((eq, i) => (
                  <div key={`new-e-${i}`} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <FieldBox label="Eq Name">
                        <input type="text" placeholder="e.g. DAIKIN Unit-I" value={eq.name} onChange={e => { const n = [...equipments]; n[i].name = e.target.value; setEquipments(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }} />
                      </FieldBox>
                      <FieldBox label="Model">
                        <input type="text" placeholder="e.g. PFS3252DARY" value={eq.model} onChange={e => { const n = [...equipments]; n[i].model = e.target.value; setEquipments(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }} />
                      </FieldBox>
                      <FieldBox label="Capacity">
                        <input type="text" placeholder="e.g. 306 TR" value={eq.capacity} onChange={e => { const n = [...equipments]; n[i].capacity = e.target.value; setEquipments(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }} />
                      </FieldBox>
                      <FieldBox label="Type">
                        <input type="text" placeholder="e.g. Water-Cooled" value={eq.type} onChange={e => { const n = [...equipments]; n[i].type = e.target.value; setEquipments(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }} />
                      </FieldBox>
                      <FieldBox label="Refrigerant">
                        <input type="text" placeholder="e.g. R134a" value={eq.refrigerant} onChange={e => { const n = [...equipments]; n[i].refrigerant = e.target.value; setEquipments(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }} />
                      </FieldBox>
                      <FieldBox label="Status">
                        <select value={eq.status} onChange={e => { const n = [...equipments]; n[i].status = e.target.value; setEquipments(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}>
                          <option value="Running">Running</option>
                          <option value="Standby">Standby</option>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </FieldBox>
                      <FieldBox label="Last Service Date">
                        <input type="date" value={eq.lastService} onChange={e => { const n = [...equipments]; n[i].lastService = e.target.value; setEquipments(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }} />
                      </FieldBox>
                      <FieldBox label="Health %">
                        <input type="number" placeholder="e.g. 98" value={eq.health} onChange={e => { const n = [...equipments]; n[i].health = parseInt(e.target.value) || 0; setEquipments(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }} />
                      </FieldBox>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={() => setEquipments(equipments.filter((_, idx) => idx !== i))} style={{ padding: '10px 16px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Cancel</button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', textAlign: 'right' }}>
                <button style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }} onClick={onSaveEquipments}>Save Equipments Data</button>
              </div>
            </div>

          </div>
        )}

        {chillerTab === 'dynamic' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {/* Water Temperatures */}
            <div style={{ background: '#fff', border: '2px solid #bfdbfe', padding: '16px', borderRadius: '16px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, color: '#1e3a8a', fontSize: '1.2rem', fontWeight: 800 }}>🌡️ Water Temperatures (°C)</h4>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>Log current temperature readings for accurate COP calculations.</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0ea5e9', display: 'block', marginBottom: '8px' }}>Chilled Water Inlet</label>
                  <input type="number" step="0.1" value={chillerWaterIn} onChange={e => setChillerWaterIn(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: 700, outline: 'none', background: '#fff', color: '#0f172a', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }} />
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#166534', display: 'block', marginBottom: '8px' }}>Chilled Water Outlet</label>
                  <input type="number" step="0.1" value={chillerWaterOut} onChange={e => setChillerWaterOut(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: 700, outline: 'none', background: '#fff', color: '#0f172a', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }} />
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ef4444', display: 'block', marginBottom: '8px' }}>Condenser Water Inlet</label>
                  <input type="number" step="0.1" value={condenserWaterIn} onChange={e => setCondenserWaterIn(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: 700, outline: 'none', background: '#fff', color: '#0f172a', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }} />
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f59e0b', display: 'block', marginBottom: '8px' }}>Condenser Water Outlet</label>
                  <input type="number" step="0.1" value={condenserWaterOut} onChange={e => setCondenserWaterOut(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: 700, outline: 'none', background: '#fff', color: '#0f172a', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }} />
                </div>
              </div>
            </div>

            {/* Rates */}
            <div style={{ background: '#fff', border: '2px solid #86efac', padding: '16px', borderRadius: '16px', marginBottom: '28px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, color: '#166534', fontSize: '1.2rem', fontWeight: 800 }}>💸 Tariff Rates (₹)</h4>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>Enter the latest unit rates to calculate accurate billing.</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#b91c1c', display: 'block', marginBottom: '8px' }}>Peak Rate</label>
                  <input type="number" step="0.1" min="0" value={ratePeak} onChange={e => setRatePeak(e.target.value)} onBlur={e => { let v = parseFloat(e.target.value); setRatePeak(isNaN(v) ? '' : Math.max(0, v)); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: 700, outline: 'none', background: '#fff', color: '#0f172a', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }} />
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#15803d', display: 'block', marginBottom: '8px' }}>Off-Peak Rate</label>
                  <input type="number" step="0.1" min="0" value={rateOffPeak} onChange={e => setRateOffPeak(e.target.value)} onBlur={e => { let v = parseFloat(e.target.value); setRateOffPeak(isNaN(v) ? '' : Math.max(0, v)); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: 700, outline: 'none', background: '#fff', color: '#0f172a', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }} />
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1d4ed8', display: 'block', marginBottom: '8px' }}>Night Rate</label>
                  <input type="number" step="0.1" min="0" value={rateNight} onChange={e => setRateNight(e.target.value)} onBlur={e => { let v = parseFloat(e.target.value); setRateNight(isNaN(v) ? '' : Math.max(0, v)); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: 700, outline: 'none', background: '#fff', color: '#0f172a', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }} />
                </div>
              </div>
            </div>

        {/* ─── NEW UI: Chiller Units & Pumps Cards ──────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
          
          {[
            { title: 'Chiller 1 (Daikin)', subtitle: '185 KW', state: u1, set: setU1, color: '#2563eb', bg: '#eff6ff' },
            { title: 'Chiller 2 (Daikin)', subtitle: '185 KW', state: u2, set: setU2, color: '#2563eb', bg: '#eff6ff' },
            { title: 'Chiller 3 (Dunham-Bush)', subtitle: '240 kW', state: u3, set: setU3, color: '#7c3aed', bg: '#f5f3ff' },
            { title: 'Condenser Pump', subtitle: '74 kW', state: p1, set: setP1, color: '#0ea5e9', bg: '#f0f9ff' },
            { title: 'Chilled Water Pump', subtitle: '88 kW', state: p2, set: setP2, color: '#0284c7', bg: '#e0f2fe' },
            { title: 'Cooling Tower Motor', subtitle: '22 kW', state: p3, set: setP3, color: '#4f46e5', bg: '#eef2ff' },
          ].map((eq, idx) => (
            <div key={idx} style={{ background: '#fff', border: `2px solid ${eq.color}40`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ background: eq.bg, padding: '16px', borderBottom: `1px solid ${eq.color}40` }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: eq.color, fontWeight: 800 }}>{eq.title}</h3>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>{eq.subtitle}</span>
              </div>
              <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {SLOTS.map(s => (
                  <div key={s.key} style={{ display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>{s.label}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>{s.hours}</div>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Max {s.max}h</div>
                    </div>
                    <div>
                      {slotInput(eq.state, eq.set, s.key, s.max)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

        </div>

        {/* Auto-totals summary strip */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {[
            { label: 'Chiller Peak Hrs',    val: cPeak,    color: '#ef4444' },
            { label: 'Chiller Non-Peak Hrs', val: cNonPeak, color: '#22c55e' },
            { label: 'Chiller Night Hrs',   val: cNight,   color: '#1d4ed8' },
            { label: 'Pump Peak Hrs',       val: pPeak,    color: '#ef4444' },
            { label: 'Pump Non-Peak Hrs',   val: pNonPeak, color: '#22c55e' },
            { label: 'Pump Night Hrs',      val: pNight,   color: '#1d4ed8' },
          ].map(item => (
            <div key={item.label} style={{ flex: '1 1 140px', background: '#f8fafc', border: `1px solid ${item.color}33`, borderRadius: '10px', padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>{item.label}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: item.color }}>
                {item.val % 1 === 0 ? item.val : item.val.toFixed(1)}
              </div>
            </div>
          ))}
        </div>
        </div>
        )}

        {/* Save / Cancel */}
        {chillerSavedMsg && (
          <div style={{ padding: '10px 16px', borderRadius: '8px', marginBottom: '12px', fontWeight: 700, fontSize: '0.85rem',
            background: chillerSavedMsg.startsWith('✓') ? '#f0fdf4' : '#fef2f2',
            color:      chillerSavedMsg.startsWith('✓') ? '#15803d' : '#dc2626',
            border:     `1px solid ${chillerSavedMsg.startsWith('✓') ? '#bbf7d0' : '#fecaca'}` }}>
            {chillerSavedMsg}
          </div>
        )}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onClose}
            style={{ padding: '11px 28px', background: '#fff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
            {chillerTab === 'static' ? 'Close' : 'Cancel'}
          </button>
          {chillerTab === 'dynamic' && (
            <button onClick={onSaveChillerOperating} disabled={chillerSaving}
              style={{ padding: '11px 28px', background: chillerSaving ? '#94a3b8' : 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: chillerSaving ? 'not-allowed' : 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
              {chillerSaving ? 'Saving…' : '💾 Save Dynamic Data'}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (unitName === 'Mess') {
    const v = values || {};
    return (
      <div className="unit-form-card" style={{ width: '800px', maxWidth: '90vw' }}>
        <div className="unit-form-header" style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '2rem' }}>🍽️</span>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem' }}>Mess Data Entry</h3>
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Manage waste, menus, and static info</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={() => setMessTab('daily')} style={{ padding: '6px 12px', background: messTab === 'daily' ? '#4f46e5' : '#f1f5f9', color: messTab === 'daily' ? '#fff' : '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Daily Waste</button>
              <button onClick={() => setMessTab('monthly')} style={{ padding: '6px 12px', background: messTab === 'monthly' ? '#4f46e5' : '#f1f5f9', color: messTab === 'monthly' ? '#fff' : '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Monthly Menu</button>
              <button onClick={() => setMessTab('static')} style={{ padding: '6px 12px', background: messTab === 'static' ? '#4f46e5' : '#f1f5f9', color: messTab === 'static' ? '#fff' : '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Static Info</button>
            </div>
          </div>
        </div>

        <div style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
          
          {messTab === 'daily' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: 'bold' }}>
                  Date
                  <input type="date" value={v.date || ''} onChange={e => onChange('date', e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: 'bold' }}>
                  Mess Block
                  <select value={v.blockName || ''} onChange={e => onChange('blockName', e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}>
                    <option value="Boys Hostel">Boys Hostel</option>
                    <option value="Boys Day Scholar">Boys Day Scholar</option>
                    <option value="Girls">Girls</option>
                  </select>
                </label>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Food Waste (KG)</h4>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {v.blockName !== 'Boys Day Scholar' && (
                    <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      Breakfast Waste (KG)
                      <input type="number" min="0" value={v.breakfast || ''} onChange={e => onChange('breakfast', e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} placeholder="e.g. 15" />
                    </label>
                  )}
                  
                  <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    Lunch Waste (KG)
                    <input type="number" min="0" value={v.lunch || ''} onChange={e => onChange('lunch', e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} placeholder="e.g. 25" />
                  </label>

                  {v.blockName !== 'Boys Day Scholar' && (
                    <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      Dinner Waste (KG)
                      <input type="number" min="0" value={v.dinner || ''} onChange={e => onChange('dinner', e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} placeholder="e.g. 18" />
                    </label>
                  )}
                </div>
              </div>
              
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '20px' }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Food Taken Count (People)</h4>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {v.blockName !== 'Boys Day Scholar' && (
                    <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      Breakfast Count
                      <input type="number" min="0" value={v.breakfastCount || ''} onChange={e => onChange('breakfastCount', e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} placeholder="e.g. 350" />
                    </label>
                  )}
                  
                  <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    Lunch Count
                    <input type="number" min="0" value={v.lunchCount || ''} onChange={e => onChange('lunchCount', e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} placeholder="e.g. 400" />
                  </label>

                  {v.blockName !== 'Boys Day Scholar' && (
                    <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      Dinner Count
                      <input type="number" min="0" value={v.dinnerCount || ''} onChange={e => onChange('dinnerCount', e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} placeholder="e.g. 380" />
                    </label>
                  )}
                </div>
              </div>
              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button onClick={submitMessData} style={{ padding: '10px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Submit Daily Log</button>
              </div>
            </>
          )}

          {messTab === 'monthly' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: 'bold' }}>
                  Month & Year
                  <input type="month" value={messMenuMonth} onChange={e => setMessMenuMonth(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: 'bold' }}>
                  Block
                  <select value={messMenuBlock} onChange={e => setMessMenuBlock(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}>
                    <option value="Boys Hostel">Boys Hostel</option>
                    <option value="Girls">Girls</option>
                  </select>
                </label>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: 'bold' }}>
                Upload Monthly Menu (PDF)
                <input type="file" accept=".pdf" onChange={e => setMessMenuFile(e.target.files[0])} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc', width: '100%', background: '#fff' }} />
              </div>
              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button 
                  onClick={submitMessMenu} 
                  disabled={messMenuSaving}
                  style={{ 
                    padding: '10px 20px', 
                    background: messMenuSaving ? '#94a3b8' : '#4f46e5', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: messMenuSaving ? 'not-allowed' : 'pointer', 
                    fontWeight: 'bold' 
                  }}
                >
                  {messMenuSaving ? 'Processing PDF (OCR may take up to 20s)...' : 'Submit Monthly Menu'}
                </button>
              </div>
            </>
          )}

          {messTab === 'static' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Equipment Inventory */}
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, color: '#0f172a' }}>⚙️ Equipment Inventory</h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <label style={{ cursor: 'pointer', padding: '8px 16px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                      + Upload Excel
                      <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => handleGenericFileUpload(setMessEquipments, { blockName: 'Boys Hostel', name: '', total: 0, working: 0, damaged: 0, status: 'Working' }, e)} style={{ display: 'none' }} />
                    </label>
                    <button onClick={() => setMessEquipments([...messEquipments, { blockName: 'Boys Hostel', name: '', total: 0, working: 0, damaged: 0, status: 'Working' }])} style={{ padding: '8px 16px', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>+ Add Equipment</button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {existingMessEquipments.map((eq, i) => (
                    <div key={eq.id} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                        <FieldBox label="Block">
                          <select value={eq.blockName || ''} onChange={e => { const n = [...existingMessEquipments]; n[i].blockName = e.target.value; setExistingMessEquipments(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }}>
                            <option value="Boys Hostel">Boys Hostel</option>
                            <option value="Boys Day Scholar">Boys Day Scholar</option>
                            <option value="Girls">Girls</option>
                          </select>
                        </FieldBox>
                        <FieldBox label="Equipment Name">
                          <input type="text" value={eq.name || ''} onChange={e => { const n = [...existingMessEquipments]; n[i].name = e.target.value; setExistingMessEquipments(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                        </FieldBox>
                        <FieldBox label="Total">
                          <input type="number" min="0" value={eq.total || 0} onChange={e => { const n = [...existingMessEquipments]; n[i].total = parseInt(e.target.value) || 0; setExistingMessEquipments(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                        </FieldBox>
                        <FieldBox label="Working">
                          <input type="number" min="0" value={eq.working || 0} onChange={e => { const n = [...existingMessEquipments]; n[i].working = parseInt(e.target.value) || 0; setExistingMessEquipments(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                        </FieldBox>
                        <FieldBox label="Damaged">
                          <input type="number" min="0" value={eq.damaged || 0} onChange={e => { const n = [...existingMessEquipments]; n[i].damaged = parseInt(e.target.value) || 0; setExistingMessEquipments(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                        </FieldBox>
                        <FieldBox label="Status">
                          <select value={eq.status || ''} onChange={e => { const n = [...existingMessEquipments]; n[i].status = e.target.value; setExistingMessEquipments(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }}>
                            <option value="Working">Working</option>
                            <option value="Partial Working">Partial Working</option>
                            <option value="Under Maintenance">Under Maintenance</option>
                            <option value="Not Working">Not Working</option>
                          </select>
                        </FieldBox>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                        <button onClick={() => handleUpdateMessEquipment(eq)} style={{ padding: '10px 14px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>💾 Update</button>
                        <button onClick={() => handleDeleteMessEquipment(eq.id)} style={{ padding: '10px 16px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Remove Eq</button>
                      </div>
                    </div>
                  ))}
                  {messEquipments.map((eq, i) => (
                    <div key={`new-e-${i}`} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                        <FieldBox label="Block">
                          <select value={eq.blockName} onChange={e => { const n = [...messEquipments]; n[i].blockName = e.target.value; setMessEquipments(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}>
                            <option value="Boys Hostel">Boys Hostel</option>
                            <option value="Boys Day Scholar">Boys Day Scholar</option>
                            <option value="Girls">Girls</option>
                          </select>
                        </FieldBox>
                        <FieldBox label="Eq Name">
                          <input type="text" placeholder="e.g. Grinder" value={eq.name} onChange={e => { const n = [...messEquipments]; n[i].name = e.target.value; setMessEquipments(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }} />
                        </FieldBox>
                        <FieldBox label="Total">
                          <input type="number" min="0" value={eq.total} onChange={e => { const n = [...messEquipments]; n[i].total = parseInt(e.target.value) || 0; setMessEquipments(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }} />
                        </FieldBox>
                        <FieldBox label="Working">
                          <input type="number" min="0" value={eq.working} onChange={e => { const n = [...messEquipments]; n[i].working = parseInt(e.target.value) || 0; setMessEquipments(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }} />
                        </FieldBox>
                        <FieldBox label="Damaged">
                          <input type="number" min="0" value={eq.damaged} onChange={e => { const n = [...messEquipments]; n[i].damaged = parseInt(e.target.value) || 0; setMessEquipments(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }} />
                        </FieldBox>
                        <FieldBox label="Status">
                          <select value={eq.status} onChange={e => { const n = [...messEquipments]; n[i].status = e.target.value; setMessEquipments(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}>
                            <option value="Working">Working</option>
                            <option value="Partial Working">Partial Working</option>
                            <option value="Under Maintenance">Under Maintenance</option>
                            <option value="Not Working">Not Working</option>
                          </select>
                        </FieldBox>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={() => setMessEquipments(messEquipments.filter((_, idx) => idx !== i))} style={{ padding: '10px 16px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Cancel</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '16px', textAlign: 'right' }}>
                  <button onClick={submitMessEquip} style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }}>Save Equipment Data</button>
                </div>
              </div>

              {/* Staff Roster */}
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, color: '#0f172a' }}>🧑‍🍳 Staff Roster</h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <label style={{ cursor: 'pointer', padding: '8px 16px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                      + Upload Excel
                      <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => handleGenericFileUpload(setMessStaffs, { blockName: 'Boys Hostel', name: '', role: '', shift: 'Morning', contact: '' }, e)} style={{ display: 'none' }} />
                    </label>
                    <button onClick={() => setMessStaffs([...messStaffs, { blockName: 'Boys Hostel', name: '', role: '', shift: 'Morning', contact: '' }])} style={{ padding: '8px 16px', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>+ Add Staff</button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {existingMessStaffs.map((st, i) => (
                    <div key={st.id} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                        <FieldBox label="Block">
                          <select value={st.blockName || ''} onChange={e => { const n = [...existingMessStaffs]; n[i].blockName = e.target.value; setExistingMessStaffs(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }}>
                            <option value="Boys Hostel">Boys Hostel</option>
                            <option value="Girls">Girls</option>
                          </select>
                        </FieldBox>
                        <FieldBox label="Staff Name">
                          <input type="text" value={st.name || ''} onChange={e => { const n = [...existingMessStaffs]; n[i].name = e.target.value; setExistingMessStaffs(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                        </FieldBox>
                        <FieldBox label="Role">
                          <select value={st.role || ''} onChange={e => { const n = [...existingMessStaffs]; n[i].role = e.target.value; setExistingMessStaffs(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }}>
                            <option value="">Select Role</option>
                            <option value="Head Chef">Head Chef</option>
                            <option value="Assistant Cook">Assistant Cook</option>
                            <option value="Cleaner">Cleaner</option>
                            <option value="Server">Server</option>
                          </select>
                        </FieldBox>
                        <FieldBox label="Shift">
                          <select value={st.shift || ''} onChange={e => { const n = [...existingMessStaffs]; n[i].shift = e.target.value; setExistingMessStaffs(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }}>
                            <option value="Morning">Morning</option>
                            <option value="Evening">Evening</option>
                            <option value="Night">Night</option>
                            <option value="All Day">All Day</option>
                          </select>
                        </FieldBox>
                        <FieldBox label="Contact">
                          <input type="text" value={st.contact || ''} onChange={e => { const n = [...existingMessStaffs]; n[i].contact = e.target.value; setExistingMessStaffs(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: 600, outline: 'none' }} />
                        </FieldBox>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                        <button onClick={() => handleUpdateMessStaff(st)} style={{ padding: '10px 14px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>💾 Update</button>
                        <button onClick={() => handleDeleteMessStaff(st.id)} style={{ padding: '10px 16px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Remove Staff</button>
                      </div>
                    </div>
                  ))}
                  {messStaffs.map((st, i) => (
                    <div key={`new-st-${i}`} style={{ background: '#ffffff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                        <FieldBox label="Block">
                          <select value={st.blockName} onChange={e => { const n = [...messStaffs]; n[i].blockName = e.target.value; setMessStaffs(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}>
                            <option value="Boys Hostel">Boys Hostel</option>
                            <option value="Girls">Girls</option>
                          </select>
                        </FieldBox>
                        <FieldBox label="Staff Name">
                          <input type="text" placeholder="e.g. John Doe" value={st.name} onChange={e => { const n = [...messStaffs]; n[i].name = e.target.value; setMessStaffs(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }} />
                        </FieldBox>
                        <FieldBox label="Role">
                          <select value={st.role} onChange={e => { const n = [...messStaffs]; n[i].role = e.target.value; setMessStaffs(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}>
                            <option value="">Select Role</option>
                            <option value="Head Chef">Head Chef</option>
                            <option value="Assistant Cook">Assistant Cook</option>
                            <option value="Cleaner">Cleaner</option>
                            <option value="Server">Server</option>
                          </select>
                        </FieldBox>
                        <FieldBox label="Shift">
                          <select value={st.shift} onChange={e => { const n = [...messStaffs]; n[i].shift = e.target.value; setMessStaffs(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}>
                            <option value="Morning">Morning</option>
                            <option value="Evening">Evening</option>
                            <option value="Night">Night</option>
                            <option value="All Day">All Day</option>
                          </select>
                        </FieldBox>
                        <FieldBox label="Contact">
                          <input type="text" placeholder="e.g. 9876543210" value={st.contact} onChange={e => { const n = [...messStaffs]; n[i].contact = e.target.value; setMessStaffs(n); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }} />
                        </FieldBox>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={() => setMessStaffs(messStaffs.filter((_, idx) => idx !== i))} style={{ padding: '10px 16px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✖ Cancel</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '16px', textAlign: 'right' }}>
                  <button onClick={submitMessStaff} style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }}>Save Staff Data</button>
                </div>
              </div>

            </div>
          )}

        </div>

        <div className="unit-form-actions">
          <button className="unit-form-cancel" onClick={onClose}>Close Form</button>
        </div>
      </div>
    );
  }

  if (unitName === 'Hostels') {
    const filteredBlocks = hostelBlocks.filter(b => b.gender === selectedGender);

    return (
      <div className="unit-form-card hostel-mgmt-form">
        <div className="unit-form-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
          <h3 style={{ margin: 0 }}>Hostel Management Console</h3>
          <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
            {['boys', 'girls'].map(g => (
              <button
                key={g}
                onClick={() => { setSelectedGender(g); setSelectedHostelBlock(null); setCurrentBlockData(null); }}
                style={{
                  padding: '8px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  textTransform: 'capitalize',
                  background: selectedGender === g ? '#fff' : 'transparent',
                  color: selectedGender === g ? '#1e293b' : '#64748b',
                  boxShadow: selectedGender === g ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {g} Hostels
              </button>
            ))}
          </div>
        </div>

        {!selectedHostelBlock ? (
          <div style={{ marginTop: '24px' }}>
            <h4 style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>Select a block to manage details:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '16px' }}>
              {filteredBlocks.map(b => (
                <div
                  key={b.name}
                  onClick={() => {
                    setSelectedHostelBlock(b.name);
                    setCurrentBlockData(b);

                    const now = new Date();
                    const day = String(now.getDate()).padStart(2, '0');
                    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    const todayStr = `${day} ${months[now.getMonth()]}`;

                    // Load block-specific draft if exists, else load from backend today's dailyUsageMap
                    const draftWater = values[`${b.name}_water`];
                    const draftElectricity = values[`${b.name}_electricity`];

                    const blockUsages = dailyUsageMap[b.name] || [];
                    const todayUsage = blockUsages.find(u => u.date === todayStr);

                    setValues(prev => ({
                      ...prev,
                      water: draftWater !== undefined ? draftWater : (todayUsage ? String(todayUsage.water) : ''),
                      electricity: draftElectricity !== undefined ? draftElectricity : (todayUsage ? String(todayUsage.power) : '')
                    }));
                  }}
                  style={{
                    padding: '20px',
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                >
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>{b.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{b.occupied} / {b.beds} Students</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: '8px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <input
                type="text"
                value={newBlockName}
                onChange={e => setNewBlockName(e.target.value)}
                placeholder={`Enter new ${selectedGender} block name`}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', flex: 1 }}
              />
              <button onClick={handleAddBlock} style={{ padding: '8px 16px', borderRadius: '6px', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                + Add New Block
              </button>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: '24px', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <button onClick={() => { setSelectedHostelBlock(null); setCurrentBlockData(null); }} style={{ background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>← Back to Blocks</button>
              <h4 style={{ margin: 0 }}>Managing: {selectedHostelBlock}</h4>
            </div>

            {currentBlockData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group-box">
                    <h4 style={{ color: '#3b82f6', margin: '0 0 16px 0' }}>Block Specifications</h4>
                    
                    <label style={{ display: 'block', marginBottom: '12px' }}>Select Hostel Type
                      <select
                        value={currentBlockData.gender || 'boys'}
                        onChange={e => updateHostelField('gender', e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', marginTop: '4px' }}
                      >
                        <option value="boys">Boys Hostel</option>
                        <option value="girls">Girls Hostel</option>
                      </select>
                    </label>

                    <label style={{ display: 'block', marginBottom: '12px' }}>Enter Block Name
                      <input
                        type="text"
                        value={currentBlockData.name || ''}
                        onChange={e => updateHostelField('name', e.target.value)}
                        disabled={!isNewBlock}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', marginTop: '4px', background: !isNewBlock ? '#f1f5f9' : '#fff' }}
                        placeholder="Enter block name"
                      />
                    </label>

                    <label style={{ display: 'block', marginBottom: '12px' }}>Select Block Type
                      <select
                        value={currentBlockData.type || ''}
                        onChange={e => updateHostelField('type', e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', marginTop: '4px' }}
                      >
                        <option value="">Select Block Type</option>
                        <option value="Single Cot">Single Cot</option>
                        <option value="Double Cot">Double Cot</option>
                        <option value="Four Cot">Four Cot</option>
                        <option value="Single Cot / Double Cot">Single Cot / Double Cot</option>
                        <option value="Single Cot / Double Cot / Four Cot">Single Cot / Double Cot / Four Cot</option>
                      </select>
                    </label>

                    <label style={{ display: 'block', marginBottom: '12px' }}>Solar Water Heater (Y/N) — Capacity
                      <input
                        type="text"
                        value={currentBlockData.solarHeaterCapacity || ''}
                        onChange={e => updateHostelField('solarHeaterCapacity', e.target.value)}
                        placeholder="e.g. Yes - 500L or No"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', marginTop: '4px' }}
                      />
                    </label>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <label style={{ display: 'block' }}>Wi-Fi Access Points
                        <input
                          type="number"
                          value={currentBlockData.wifiAccessPoints || 0}
                          onChange={e => updateHostelField('wifiAccessPoints', parseInt(e.target.value) || 0)}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', marginTop: '4px' }}
                        />
                      </label>

                      <label style={{ display: 'block' }}>CCTV Cameras Count
                        <input
                          type="number"
                          value={currentBlockData.cctvCameras || 0}
                          onChange={e => updateHostelField('cctvCameras', parseInt(e.target.value) || 0)}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', marginTop: '4px' }}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="form-group-box">
                    <h4 style={{ color: '#0f172a', margin: '0 0 16px 0' }}>Capacity & Layout</h4>
                    
                    <label style={{ display: 'block', marginBottom: '12px' }}>Enter Number of Floors
                      <input
                        type="number"
                        value={currentBlockData.numFloors || 0}
                        onChange={e => handleNumFloorsChange(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', marginTop: '4px' }}
                      />
                    </label>

                    <label style={{ display: 'block', marginBottom: '12px' }}>Enter Total Rooms
                      <input
                        type="number"
                        value={currentBlockData.totalRooms || 0}
                        onChange={e => updateHostelField('totalRooms', parseInt(e.target.value) || 0)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', marginTop: '4px' }}
                      />
                    </label>

                     <label style={{ display: 'block', marginBottom: '12px' }}>Enter Total Beds
                      <input
                        type="number"
                        value={currentBlockData.beds || 0}
                        onChange={e => updateHostelField('beds', parseInt(e.target.value) || 0)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', marginTop: '4px' }}
                      />
                    </label>

                    <label style={{ display: 'block', marginBottom: '12px' }}>Current Allocated Capacity
                      <input
                        type="number"
                        value={currentBlockData.allocatedCapacity || 0}
                        onChange={e => updateHostelField('allocatedCapacity', parseInt(e.target.value) || 0)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', marginTop: '4px' }}
                      />
                    </label>

                    <label style={{ display: 'block', marginBottom: '12px' }}>Water Coolers / RO Points — Count
                      <input
                        type="number"
                        value={currentBlockData.waterCoolersCount || 0}
                        onChange={e => updateHostelField('waterCoolersCount', parseInt(e.target.value) || 0)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', marginTop: '4px' }}
                      />
                    </label>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <label style={{ display: 'block' }}>Bathrooms per Floor (avg.)
                        <input
                          type="number"
                          step="0.1"
                          value={currentBlockData.bathroomsPerFloor || 0}
                          onChange={e => updateHostelField('bathroomsPerFloor', parseFloat(e.target.value) || 0)}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', marginTop: '4px' }}
                        />
                      </label>

                      <label style={{ display: 'block' }}>Toilets per Floor (avg.)
                        <input
                          type="number"
                          step="0.1"
                          value={currentBlockData.toiletsPerFloor || 0}
                          onChange={e => updateHostelField('toiletsPerFloor', parseFloat(e.target.value) || 0)}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', marginTop: '4px' }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* 2. Floor-wise Room Details */}
                <div className="form-group-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0 }}>Floor-wise Room Details</h4>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (window.confirm("Are you sure you want to remove ALL floor details?")) {
                            if (window.confirm("This action cannot be undone. Please confirm again to delete ALL rows.")) {
                              setCurrentBlockData(prev => ({ ...prev, floorDetails: [] }));
                            }
                          }
                        }}
                        style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer', borderRadius: '6px', fontWeight: '600' }}
                      >
                        Delete All
                      </button>
                      <button
                        onClick={addFloorDetail}
                        style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', cursor: 'pointer', borderRadius: '6px', fontWeight: '600' }}
                      >
                        + Add Floor Row
                      </button>
                    </div>
                  </div>
                  {(!currentBlockData.floorDetails || currentBlockData.floorDetails.length === 0) ? (
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No floor details entered yet. Set Number of Floors above or click + Add Floor Row.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                          <th style={{ padding: '8px 4px', fontSize: '0.75rem' }}>Floor</th>
                          <th style={{ padding: '8px 4px', fontSize: '0.75rem' }}>Total Rms</th>
                          <th style={{ padding: '8px 4px', fontSize: '0.75rem' }}>Student Rms</th>
                          <th style={{ padding: '8px 4px', fontSize: '0.75rem' }}>Warden Rms</th>
                          <th style={{ padding: '8px 4px', fontSize: '0.75rem' }}>Suprv. Rms</th>
                          <th style={{ padding: '8px 4px', fontSize: '0.75rem' }}>Rest Rms</th>
                          <th style={{ padding: '8px 4px', fontSize: '0.75rem' }}>Room Types</th>
                          <th style={{ padding: '8px 4px', fontSize: '0.75rem' }}>Total Beds</th>
                          <th style={{ padding: '8px 4px', fontSize: '0.75rem', width: '60px' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentBlockData.floorDetails.map((f, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '6px 2px' }}>
                              <input
                                type="number"
                                value={f.floorNumber}
                                onChange={e => updateFloorDetailField(idx, 'floorNumber', parseInt(e.target.value) || 0)}
                                style={{ width: '50px', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                              />
                            </td>
                            <td style={{ padding: '6px 2px' }}>
                              <input
                                type="number"
                                value={f.totalRooms || 0}
                                onChange={e => updateFloorDetailField(idx, 'totalRooms', parseInt(e.target.value) || 0)}
                                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                              />
                            </td>
                            <td style={{ padding: '6px 2px' }}>
                              <input
                                type="number"
                                value={f.studentRooms || 0}
                                onChange={e => updateFloorDetailField(idx, 'studentRooms', parseInt(e.target.value) || 0)}
                                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                              />
                            </td>
                            <td style={{ padding: '6px 2px' }}>
                              <input
                                type="number"
                                value={f.wardenRooms || 0}
                                onChange={e => updateFloorDetailField(idx, 'wardenRooms', parseInt(e.target.value) || 0)}
                                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                              />
                            </td>
                            <td style={{ padding: '6px 2px' }}>
                              <input
                                type="number"
                                value={f.supervisorRooms || 0}
                                onChange={e => updateFloorDetailField(idx, 'supervisorRooms', parseInt(e.target.value) || 0)}
                                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                              />
                            </td>
                            <td style={{ padding: '6px 2px' }}>
                              <input
                                type="number"
                                value={f.restRooms || 0}
                                onChange={e => updateFloorDetailField(idx, 'restRooms', parseInt(e.target.value) || 0)}
                                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                              />
                            </td>
                            <td style={{ padding: '6px 2px' }}>
                              <select
                                value={f.roomTypes || 'Single Cot'}
                                onChange={e => updateFloorDetailField(idx, 'roomTypes', e.target.value)}
                                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                              >
                                <option value="Single Cot">Single Cot</option>
                                <option value="Double Cot">Double Cot</option>
                                <option value="Four Cot">Four Cot</option>
                                <option value="Single Cot / Double Cot">Single Cot / Double Cot</option>
                                <option value="Single Cot / Double Cot / Four Cot">Single Cot / Double Cot / Four Cot</option>
                              </select>
                            </td>
                            <td style={{ padding: '6px 2px' }}>
                              <input
                                type="number"
                                value={f.totalBeds || 0}
                                onChange={e => updateFloorDetailField(idx, 'totalBeds', parseInt(e.target.value) || 0)}
                                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                              />
                            </td>
                            <td style={{ padding: '6px 2px' }}>
                              <button
                                onClick={() => removeFloorDetail(idx)}
                                style={{ color: '#ef4444', border: '1px solid #fee2e2', background: '#fef2f2', padding: '4px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', width: '100%', fontWeight: 700 }}
                              >
                                Del
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* 3. Staff Details for This Block */}
                <div className="form-group-box">
                  <h4 style={{ color: '#16a34a', margin: '0 0 16px 0' }}>Staff Details for This Block</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                    <label>Chief Warden Count
                      <input
                        type="number"
                        value={(currentBlockData.wardens || []).filter(w => w.role === 'Chief Warden').length}
                        readOnly
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#64748b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', marginTop: '4px' }}
                      />
                    </label>
                    <label>Deputy Warden Count
                      <input
                        type="number"
                        value={(currentBlockData.wardens || []).filter(w => w.role === 'Deputy Warden').length}
                        readOnly
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#64748b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', marginTop: '4px' }}
                      />
                    </label>
                    <label>Senior Caretaker Count
                      <input
                        type="number"
                        value={(currentBlockData.wardens || []).filter(w => w.role === 'Senior Caretaker').length}
                        readOnly
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#64748b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', marginTop: '4px' }}
                      />
                    </label>
                    <label>Caretaker Count
                      <input
                        type="number"
                        value={(currentBlockData.wardens || []).filter(w => w.role === 'Caretaker').length}
                        readOnly
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#64748b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', marginTop: '4px' }}
                      />
                    </label>
                    <label>Care Taker / Resident Attenders Count
                      <input
                        type="number"
                        value={(currentBlockData.wardens || []).filter(w => w.role === 'Care Taker /Resident Attenders' || w.role === 'Care Taker / Resident Attenders').length}
                        readOnly
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#64748b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', marginTop: '4px' }}
                      />
                    </label>
                    <label>House Keeper Count
                      <input
                        type="number"
                        value={(currentBlockData.wardens || []).filter(w => w.role === 'House Keeper').length}
                        readOnly
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#64748b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', marginTop: '4px' }}
                      />
                    </label>
                    <label>Bathroom Cleaner Count
                      <input
                        type="number"
                        value={(currentBlockData.wardens || []).filter(w => w.role === 'Bathroom cleaner' || w.role === 'Bathroom Cleaner').length}
                        readOnly
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#64748b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', marginTop: '4px' }}
                      />
                    </label>
                    <label>Security Personnel Count
                      <input
                        type="number"
                        value={(currentBlockData.wardens || []).filter(w => w.role === 'Security Personnel').length}
                        readOnly
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '0.9rem', color: '#64748b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', marginTop: '4px' }}
                      />
                    </label>
                  </div>
                </div>

                {/* 4. Occupancy & Reporting Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group-box">
                    <h4 style={{ color: '#dc2626', margin: '0 0 16px 0' }}>Occupancy Details</h4>
                    <label style={{ display: 'block', marginBottom: '12px' }}>Total Occupancy (Auto-calculated)
                      <input
                        type="number"
                        value={(currentBlockData.residentList ? currentBlockData.residentList.length : 0) + (currentBlockData.wardens ? currentBlockData.wardens.length : 0)}
                        disabled
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', marginTop: '4px', background: '#f1f5f9', color: '#64748b' }}
                      />
                    </label>
                    <label style={{ display: 'block', marginBottom: '12px' }}>Vacant Beds (Auto-calculated)
                      <input
                        type="number"
                        value={(currentBlockData.beds || 0) - ((currentBlockData.residentList ? currentBlockData.residentList.length : 0) + (currentBlockData.wardens ? currentBlockData.wardens.length : 0))}
                        disabled
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', marginTop: '4px', background: '#f1f5f9', color: '#64748b' }}
                      />
                    </label>
                    <label style={{ display: 'block' }}>Maintenance Rooms/Beds
                      <input
                        type="number"
                        value={currentBlockData.maintenanceRoomsBeds || 0}
                        onChange={e => updateHostelField('maintenanceRoomsBeds', parseInt(e.target.value) || 0)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', marginTop: '4px' }}
                      />
                    </label>
                  </div>

                  <div className="form-group-box">
                    <h4 style={{ color: '#ca8a04', margin: '0 0 16px 0' }}>Daily Resource Reporting</h4>
                    <label style={{ display: 'block', marginBottom: '12px' }}>Water Usage (KL - Daily)
                      <input
                        type="number"
                        value={values.water || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setValues(prev => ({ ...prev, water: val, [`${selectedHostelBlock}_water`]: val }));
                        }}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', marginTop: '4px' }}
                      />
                    </label>
                    <label style={{ display: 'block', marginBottom: '12px' }}>Electricity Usage (Units - Daily)
                      <input
                        type="number"
                        value={values.electricity || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setValues(prev => ({ ...prev, electricity: val, [`${selectedHostelBlock}_electricity`]: val }));
                        }}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', marginTop: '4px' }}
                      />
                    </label>
                    <label style={{ display: 'block' }}>Remarks / Notes (Optional)
                      <textarea
                        value={currentBlockData.remarks || ''}
                        onChange={e => updateHostelField('remarks', e.target.value)}
                        placeholder="Enter block-specific remarks or operational notes..."
                        style={{ width: '100%', minHeight: '80px', marginTop: '4px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                    </label>
                  </div>
                </div>

                {/* 4.5 Evening Biometric Attendance */}
                <div className="form-group-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                    <h4 style={{ color: '#8b5cf6', margin: 0 }}>Evening Biometric Attendance (Absent Unexcused)</h4>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        placeholder="Search Students..." 
                        value={absentSearchQuery}
                        onChange={(e) => setAbsentSearchQuery(e.target.value)}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                      <label style={{ cursor: 'pointer', padding: '6px 12px', fontSize: '0.8rem', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '6px', fontWeight: '600' }}>
                        + Upload Excel
                        <input type="file" accept=".xlsx, .xls, .csv" onChange={handleAbsentFileUpload} style={{ display: 'none' }} />
                      </label>
                      <button onClick={addAbsentStudent} style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', cursor: 'pointer', borderRadius: '6px', fontWeight: '600' }}>+ Add Student</button>
                      <button onClick={(e) => {
                        e.preventDefault();
                        if (window.confirm("Are you sure you want to remove ALL absent students?")) {
                          if (window.confirm("This action cannot be undone. Please confirm again to delete ALL absent students.")) {
                            setCurrentBlockData(prev => ({ ...prev, absentList: [] }));
                          }
                        }
                      }} style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer', borderRadius: '6px', fontWeight: '600' }}>Delete All</button>
                    </div>
                  </div>
                  {(!currentBlockData.absentList || currentBlockData.absentList.length === 0) ? (
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>No absent unexcused students recorded.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ textAlign: 'left' }}>
                            <th>Name</th>
                            <th>Roll No (Unique PK)</th>
                            <th>Room No</th>
                            <th style={{ width: '100px' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(currentBlockData.absentList || [])
                            .map((res, idx) => ({ res, idx }))
                            .filter(({ res }) => (res.name || '').toLowerCase().includes(absentSearchQuery.toLowerCase()) || (res.rollNo || '').toLowerCase().includes(absentSearchQuery.toLowerCase()) || (res.roomNo || '').toLowerCase().includes(absentSearchQuery.toLowerCase()))
                            .map(({ res, idx }) => (
                            <tr key={idx}>
                              <td><input type="text" value={res.name || ''} onChange={(e) => updateAbsentField(idx, 'name', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} placeholder="Enter name" /></td>
                              <td><input type="text" value={res.rollNo || ''} onChange={(e) => updateAbsentField(idx, 'rollNo', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} placeholder="Enter unique roll no" /></td>
                              <td><input type="text" value={res.roomNo || ''} onChange={(e) => updateAbsentField(idx, 'roomNo', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} placeholder="Enter room" /></td>
                              <td>
                                <button
                                  onClick={() => removeAbsentStudent(idx)}
                                  style={{
                                    color: '#ef4444',
                                    border: '1px solid #fee2e2',
                                    background: '#fef2f2',
                                    padding: '4px 12px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    width: '100%'
                                  }}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 5. Amenities & Common Areas */}
                <div className="form-group-box">
                  <h4 style={{ color: '#0284c7', margin: '0 0 16px 0' }}>Amenities & Common Areas</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    <label>Common Room — Available (Y/N) & Count
                      <input
                        type="text"
                        value={currentBlockData.commonRoom || ''}
                        onChange={e => updateHostelField('commonRoom', e.target.value)}
                        placeholder="e.g. Yes - 2 or No"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', marginTop: '4px' }}
                      />
                    </label>
                    <label>Reading Room — Available (Y/N) & Count
                      <input
                        type="text"
                        value={currentBlockData.readingRoom || ''}
                        onChange={e => updateHostelField('readingRoom', e.target.value)}
                        placeholder="e.g. Yes - 1 or No"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', marginTop: '4px' }}
                      />
                    </label>
                    <label>Visitor Room / Parent Waiting Area — Available (Y/N) & Count
                      <input
                        type="text"
                        value={currentBlockData.parentWaitingRoom || ''}
                        onChange={e => updateHostelField('parentWaitingRoom', e.target.value)}
                        placeholder="e.g. Yes - 1 or No"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', color: '#1e293b', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', marginTop: '4px' }}
                      />
                    </label>
                  </div>
                </div>

                <div className="form-group-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0' }}>Maintenance Complaints</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Log infrastructure issues, plumbing, or electrical faults.</p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        if (onClose) onClose();
                        window.dispatchEvent(new CustomEvent('open-raise-complaint-modal'));
                      }} 
                      style={{ 
                        padding: '8px 16px', 
                        fontSize: '0.85rem', 
                        background: '#fef2f2', 
                        color: '#dc2626', 
                        border: '1px solid #fecaca', 
                        cursor: 'pointer', 
                        borderRadius: '8px', 
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}
                    >
                      🚨 Raise Maintenance Ticket
                    </button>
                  </div>
                </div>

                <div className="form-group-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                    <h4>Wardens & Support Staff</h4>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        placeholder="Search Staff..." 
                        value={wardenSearchQuery}
                        onChange={(e) => setWardenSearchQuery(e.target.value)}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                      <label style={{ cursor: 'pointer', padding: '6px 12px', fontSize: '0.8rem', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '6px', fontWeight: '600' }}>
                        + Upload Excel
                        <input type="file" accept=".xlsx, .xls, .csv" onChange={handleWardenFileUpload} style={{ display: 'none' }} />
                      </label>
                      <button onClick={addWarden} style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', cursor: 'pointer', borderRadius: '6px', fontWeight: '600' }}>+ Add Warden</button>
                      <button onClick={addSupportStaff} style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', cursor: 'pointer', borderRadius: '6px', fontWeight: '600' }}>+ Add Support Staff</button>
                      <button onClick={(e) => {
                        e.preventDefault();
                        if (window.confirm("Are you sure you want to remove ALL staff members?")) {
                          if (window.confirm("This action cannot be undone. Please confirm again to delete ALL staff.")) {
                            setCurrentBlockData(prev => ({ ...prev, wardens: [] }));
                          }
                        }
                      }} style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer', borderRadius: '6px', fontWeight: '600' }}>Delete All</button>
                    </div>
                  </div>
                  {(!currentBlockData.wardens || currentBlockData.wardens.length === 0) ? (
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>No wardens or support staff assigned.</p>
                  ) : (
                    <table style={{ width: '100%', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ textAlign: 'left' }}>
                          <th>Name</th>
                          <th>Contact (Phone - Unique PK)</th>
                          <th style={{ width: '150px' }}>Role</th>
                          <th style={{ width: '120px' }}>Floor</th>
                          <th style={{ width: '100px' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(currentBlockData.wardens || [])
                          .map((w, idx) => ({ w, idx }))
                          .filter(({ w }) => (w.name || '').toLowerCase().includes(wardenSearchQuery.toLowerCase()) || (w.phone || '').toLowerCase().includes(wardenSearchQuery.toLowerCase()) || (w.role || '').toLowerCase().includes(wardenSearchQuery.toLowerCase()) || (w.floor || '').toLowerCase().includes(wardenSearchQuery.toLowerCase()))
                          .map(({ w, idx }) => (
                          <tr key={idx}>
                            <td><input type="text" value={w.name || ''} onChange={(e) => updateWardenField(idx, 'name', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} placeholder="Enter name" /></td>
                            <td><input type="text" value={w.phone || ''} onChange={(e) => updateWardenField(idx, 'phone', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} placeholder="Enter unique phone" /></td>
                            <td>
                              <select value={w.role || 'Chief Warden'} onChange={(e) => updateWardenField(idx, 'role', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                                <option value="Chief Warden">Chief Warden</option>
                                <option value="Deputy Warden">Deputy Warden</option>
                                <option value="Care Taker /Resident Attenders">Care Taker /Resident Attenders</option>
                                <option value="House Keeper">House Keeper</option>
                                <option value="Bathroom cleaner">Bathroom cleaner</option>
                                <option value="Security Personnel">Security Personnel</option>
                                <option value="Senior Caretaker">Senior Caretaker</option>
                              </select>
                            </td>
                            <td>
                              <select value={w.floor || 'ALL FLOORS'} onChange={(e) => updateWardenField(idx, 'floor', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                                <option value="GROUND">GROUND</option>
                                <option value="FIRST">FIRST</option>
                                <option value="SECOND">SECOND</option>
                                <option value="THIRD">THIRD</option>
                                <option value="ALL FLOORS">ALL FLOORS</option>
                                <option value="0&1">0&1</option>
                                <option value="2&3">2&3</option>
                              </select>
                            </td>
                            <td>
                              <button
                                onClick={() => removeWarden(idx)}
                                style={{
                                  color: '#ef4444',
                                  border: '1px solid #fee2e2',
                                  background: '#fef2f2',
                                  padding: '4px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: '600',
                                  width: '100%'
                                }}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="form-group-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                    <h4>Resident Roster</h4>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        placeholder="Search Students..." 
                        value={residentSearchQuery}
                        onChange={(e) => setResidentSearchQuery(e.target.value)}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                      <label style={{ cursor: 'pointer', padding: '6px 12px', fontSize: '0.8rem', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '6px', fontWeight: '600' }}>
                        + Upload Excel
                        <input type="file" accept=".xlsx, .xls, .csv" onChange={handleResidentFileUpload} style={{ display: 'none' }} />
                      </label>
                      <button onClick={addResident} style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', cursor: 'pointer', borderRadius: '6px', fontWeight: '600' }}>+ Add Student</button>
                      <button onClick={(e) => {
                        e.preventDefault();
                        if (window.confirm("Are you sure you want to remove ALL students?")) {
                          if (window.confirm("This action cannot be undone. Please confirm again to delete ALL students.")) {
                            setCurrentBlockData(prev => ({ ...prev, residentList: [] }));
                          }
                        }
                      }} style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer', borderRadius: '6px', fontWeight: '600' }}>Delete All</button>
                    </div>
                  </div>
                  {(!currentBlockData.residentList || currentBlockData.residentList.length === 0) ? (
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>No resident students registered.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ textAlign: 'left' }}>
                            <th>Name</th>
                            <th>Roll No (Unique PK)</th>
                            <th>Room No</th>
                            <th style={{ width: '100px' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(currentBlockData.residentList || [])
                            .map((res, idx) => ({ res, idx }))
                            .filter(({ res }) => (res.name || '').toLowerCase().includes(residentSearchQuery.toLowerCase()) || (res.rollNo || '').toLowerCase().includes(residentSearchQuery.toLowerCase()) || (res.roomNo || '').toLowerCase().includes(residentSearchQuery.toLowerCase()))
                            .map(({ res, idx }) => (
                            <tr key={idx}>
                              <td><input type="text" value={res.name || ''} onChange={(e) => updateResidentField(idx, 'name', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} placeholder="Enter name" /></td>
                              <td><input type="text" value={res.rollNo || ''} onChange={(e) => updateResidentField(idx, 'rollNo', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} placeholder="Enter unique roll no" /></td>
                              <td><input type="text" value={res.roomNo || ''} onChange={(e) => updateResidentField(idx, 'roomNo', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} placeholder="Enter room" /></td>
                              <td>
                                <button
                                  onClick={() => removeResident(idx)}
                                  style={{
                                    color: '#ef4444',
                                    border: '1px solid #fee2e2',
                                    background: '#fef2f2',
                                    padding: '4px 12px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    width: '100%'
                                  }}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="unit-form-actions">
                  <button onClick={onSave}>Save Changes</button>
                  <button onClick={() => { setSelectedHostelBlock(null); setCurrentBlockData(null); }}>Cancel</button>
                </div>
                {savedAt && <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '12px', fontWeight: 600 }}>✓ Changes saved at {savedAt}</div>}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (unitName === 'Power House') {
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {dataArray.map((slot, idx) => (
                  <div key={idx} style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#3b82f6', width: '40px' }}>{slot.hour}</div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input type="number" placeholder="Consumption (Units)" style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', boxSizing: 'border-box' }} value={slot.value || ''} onChange={e => handlePhDynamicChange(setter, idx, 'value', e.target.value)} />
                      {isSolar && (
                        <input type="number" placeholder="Generation (Units)" style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', boxSizing: 'border-box' }} value={slot.generation || ''} onChange={e => handlePhDynamicChange(setter, idx, 'generation', e.target.value)} />
                      )}
                    </div>
                  </div>
                ))}
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

  if (!fields.length) {
    return null;
  }

  return (
    <div className="unit-form-card">
      <div className="unit-form-header">
        <h3>{unitName} - Data Collection Form</h3>
        {savedAt ? <span>Last saved: {savedAt}</span> : <span>Not saved yet</span>}
      </div>
      <div className="unit-form-progress-row">
        <div className="unit-form-progress-track">
          <div className="unit-form-progress-fill" style={{ width: `${completionPct}%` }} />
        </div>
        <span>{completedCount}/{fields.length} fields completed ({completionPct}%)</span>
      </div>

      <button className="unit-form-guide-toggle" onClick={() => setShowGuide((prev) => !prev)}>
        {showGuide ? 'Hide input guidance' : 'Show input guidance'}
      </button>
      {showGuide && (
        <div className="unit-form-guide">
          Fill values exactly in the listed unit/format. Save frequently. Use event notes for incidents and
          maintenance-related fields.
        </div>
      )}

      <div className="unit-form-table-wrap">
        <table className="unit-form-table">
          <thead>
            <tr>
              <th>Data Parameter</th>
              <th>Details / Value</th>
              <th>Unit / Format</th>
              <th>Frequency</th>
              <th>Enter Data</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field) => (
              <tr key={field.key}>
                <td>{field.parameter}</td>
                <td>{field.description}</td>
                <td>{field.unit}</td>
                <td>{field.frequency}</td>
                <td>
                  {(() => {
                    const cooldownDays = getCooldownDays(field.frequency);
                    const submittedAt = fieldSubmittedAt[field.key];
                    const isOneTime = cooldownDays === Infinity;
                    const alwaysAvailable = cooldownDays === 0;
                    if (!submittedAt || alwaysAvailable) {
                      return (
                        <input
                          type="text"
                          value={values[field.key] || ''}
                          onChange={(e) => onChange(field.key, e.target.value)}
                          placeholder={`Enter ${field.parameter}`}
                        />
                      );
                    }

                    if (isOneTime) {
                      return (
                        <div className="field-cycle-status">
                          <div className="field-status-locked">Submitted (One-time)</div>
                          <div className="field-status-subtext">Edit disabled after first submission</div>
                        </div>
                      );
                    }

                    const nextAllowed = addDays(submittedAt, cooldownDays);
                    const now = new Date();
                    const isDue = now >= nextAllowed;

                    if (isDue) {
                      return (
                        <input
                          type="text"
                          value={values[field.key] || ''}
                          onChange={(e) => onChange(field.key, e.target.value)}
                          placeholder={`Enter ${field.parameter}`}
                        />
                      );
                    }

                    return (
                      <div className="field-cycle-status">
                        <div className="field-status-locked">
                          Submitted. Available on {nextAllowed.toLocaleDateString()}
                        </div>
                        <div className="field-status-subtext">As per {field.frequency} cycle</div>
                      </div>
                    );
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="unit-form-actions">
        <button onClick={onSave}>Save Form</button>
        <button onClick={onReset}>Reset</button>
      </div>
    </div>
  );
}
