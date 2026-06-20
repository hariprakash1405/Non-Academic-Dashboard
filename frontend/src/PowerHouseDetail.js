import React, { useMemo, useState, useEffect, useCallback } from 'react';
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
  const [selectedMonth, setSelectedMonth] = React.useState('2026-05');

  const [phData, setPhData] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [trendData, setTrendData] = useState({ daily: [], monthly: [] });

  const fetchData = useCallback(() => {
    const url = selectedDate ? `http://localhost:8085/api/powerhouse?date=${selectedDate}` : `http://localhost:8085/api/powerhouse`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setPhData(data);
          if (!selectedDate && data.date) {
            setSelectedDate(data.date);
          }
        }
      })
      .catch(err => {
        console.warn("Could not connect to backend powerhouse API.", err);
      });
  }, [selectedDate]);

  const fetchTrendData = useCallback(() => {
    fetch(`http://localhost:8085/api/powerhouse/trend?month=${selectedMonth}`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setTrendData(data);
        }
      })
      .catch(err => {
        console.warn("Could not connect to monthly trend API", err);
      });
  }, [selectedMonth]);

  useEffect(() => {
    fetchData();
    window.addEventListener('unit-form-updated', fetchData);
    return () => {
      window.removeEventListener('unit-form-updated', fetchData);
    };
  }, [fetchData]);

  useEffect(() => {
    fetchTrendData();
    window.addEventListener('unit-form-updated', fetchTrendData);
    return () => {
      window.removeEventListener('unit-form-updated', fetchTrendData);
    };
  }, [fetchTrendData]);

  const computedEB = useMemo(() => {
    if (phData?.ebDynamic && phData.ebDynamic.length > 0) {
      return phData.ebDynamic.map(d => ({ hour: d.hour, consumption: parseFloat(d.value) || 0 }));
    }
    return [];
  }, [phData]);

  const computedDG = useMemo(() => {
    if (phData?.dgDynamic && phData.dgDynamic.length > 0) {
      return phData.dgDynamic.map(d => ({ hour: d.hour, consumption: parseFloat(d.value) || 0 }));
    }
    return [];
  }, [phData]);

  const computedSolar = useMemo(() => {
    if (phData?.solarDynamic && phData.solarDynamic.length > 0) {
      return phData.solarDynamic.map(d => ({
        hour: d.hour,
        generation: parseFloat(d.generation) || 0,
        consumption: parseFloat(d.value) || 0
      }));
    }
    return [];
  }, [phData]);

  const computedCombined = useMemo(() => {
    const hasData = (phData?.ebDynamic && phData.ebDynamic.length > 0) ||
                    (phData?.solarDynamic && phData.solarDynamic.length > 0) ||
                    (phData?.dgDynamic && phData.dgDynamic.length > 0);
    if (hasData) {
      return Array.from({ length: 24 }, (_, i) => {
        const hr = `${i.toString().padStart(2, '0')}:00`;
        const ebItem = phData.ebDynamic?.find(d => d.hour === hr);
        const solarItem = phData.solarDynamic?.find(d => d.hour === hr);
        const dgItem = phData.dgDynamic?.find(d => d.hour === hr);
        
        const ebVal = parseFloat(ebItem?.value) || 0;
        const solarVal = parseFloat(solarItem?.generation) || 0;
        const dgVal = parseFloat(dgItem?.value) || 0;
        
        return {
          hour: hr,
          solar: solarVal,
          eb: ebVal,
          dg: dgVal,
          total: ebVal + solarVal + dgVal
        };
      });
    }
    return [];
  }, [phData]);

  const computedStaff = useMemo(() => {
    if (phData?.staff && phData.staff.length > 0) {
      return phData.staff.map((s, idx) => ({
        id: s.id || idx + 1,
        name: s.name,
        role: s.role,
        sector: s.shift || 'Morning',
        portion: s.contact || '-',
        attendance: s.attendance || 'Present',
        contact: s.contact || '-'
      }));
    }
    return [];
  }, [phData]);

  const computedEquipment = useMemo(() => {
    const list = [];
    let id = 1;
    if (phData?.transformers && phData.transformers.length > 0) {
      phData.transformers.forEach(t => {
        list.push({
          id: id++,
          name: `Transformer (${t.svcNum || 'N/A'})`,
          type: 'Transformer',
          spec: `Load: ${t.load || '-'}, Voltage: ${t.voltage || '-'}, Feeders: ${t.feeders || '-'}`,
          status: t.type || 'Permanent HT',
          isActive: true,
          health: 95
        });
      });
    }
    if (phData?.dgSets && phData.dgSets.length > 0) {
      phData.dgSets.forEach(d => {
        list.push({
          id: id++,
          name: `DG Set - ${d.ratingMake || 'N/A'}`,
          type: 'Generator',
          spec: `Fuel Cap: ${d.fuelCap || '-'} L, Count: ${d.count || '-'}`,
          status: d.status || 'Working',
          isActive: d.status === 'Working',
          health: d.status === 'Working' ? 92 : 40
        });
      });
    }
    if (phData?.ups && phData.ups.length > 0) {
      phData.ups.forEach(u => {
        list.push({
          id: id++,
          name: `UPS - ${u.ratingMake || 'N/A'}`,
          type: 'Panel',
          spec: `Loc: ${u.location || '-'}, Battery Cap: ${u.batteryCap || '-'}`,
          status: u.status || 'Working',
          isActive: u.status === 'Working',
          health: u.status === 'Working' ? 95 : 35
        });
      });
    }
    if (phData?.solarPv && phData.solarPv.length > 0) {
      phData.solarPv.forEach(s => {
        list.push({
          id: id++,
          name: `Solar PV - ${s.location || 'N/A'}`,
          type: 'Inverter',
          spec: `Cap: ${s.capacity || '-'}, Panels: ${s.panels || '-'} (${s.panelWatts || '-'}W)`,
          status: s.status || 'Working',
          isActive: s.status === 'Working',
          health: s.status === 'Working' ? 97 : 45
        });
      });
    }
    
    if (list.length > 0) return list;
    return [];
  }, [phData]);

  const computedDailyPower = useMemo(() => {
    return trendData.daily || [];
  }, [trendData]);

  const powerBars = useMemo(
    () => computedDailyPower.map((d) => ({ ...d, pfPercent: Math.round(d.pf * 100) })),
    [computedDailyPower]
  );

  const renderFinancials = (type) => {
    let daily = '';
    let monthly = '';
    let color = '';
    
    if (type === 'solar') {
      const solarTotal = computedCombined.reduce((sum, d) => sum + d.solar, 0);
      const solarMonthly = (trendData.monthly || []).reduce((sum, d) => sum + (d.solar || 0), 0);
      daily = `₹${(solarTotal * 5.3).toFixed(0)} Savings`;
      monthly = `₹${(solarMonthly * 5.3).toLocaleString()} Savings`;
      color = '#16a34a';
    } else if (type === 'dg') {
      const dgFuelUsed = (phData && phData.dgDailyFuel) ? phData.dgDailyFuel : 0;
      const dgMonthlyFuel = (trendData.monthly || []).reduce((sum, d) => sum + (d.dg || 0), 0);
      daily = `₹${(dgFuelUsed * 98).toFixed(0)}`;
      monthly = `₹${(dgMonthlyFuel * 98).toLocaleString()}`;
      color = '#ea580c';
    } else if (type === 'eb') {
      const ebTotal = computedCombined.reduce((sum, d) => sum + d.eb, 0);
      const ebMonthly = (trendData.monthly || []).reduce((sum, d) => sum + (d.eb || 0), 0);
      daily = `₹${(ebTotal * 5.3).toFixed(0)}`;
      monthly = `₹${(ebMonthly * 5.3).toLocaleString()}`;
      color = '#2563eb';
    }

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
        <div style={{ background: '#fff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Daily Cost</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: color }}>{daily}</div>
        </div>
        <div style={{ background: '#fff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Monthly Bill (Est.)</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: color }}>{monthly}</div>
        </div>
      </div>
    );
  };

  const renderComparisonChart = () => {
    const data = timeRange === 'month' ? (trendData.monthly || []) : computedDailyPower;
    const xKey = timeRange === 'month' ? 'month' : 'date';

    if (activeTab === 'dg') {
      return (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ margin: 0 }}>{timeRange === 'month' ? 'Month-wise' : 'Day-wise'} Trend Analysis</h4>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {timeRange === 'day' && (
                <input 
                  type="month" 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)} 
                  style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', color: '#1e293b' }} 
                />
              )}
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
          </div>
          <div className="detail-chart-block">
            <h4>{timeRange === 'month' ? 'Month-wise' : 'Day-wise'} Diesel Usage Trend</h4>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey={xKey} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey={timeRange === 'month' ? 'dg' : 'dgFuel'} stroke="#ea580c" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Diesel Usage (L)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="detail-chart-block">
            <h4>{timeRange === 'month' ? 'Month-wise' : 'Day-wise'} Energy Consumption Trend</h4>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey={xKey} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey={timeRange === 'month' ? 'dg' : 'consumption'} stroke="#1e293b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Consumption (Units)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      );
    }

    const dataKey = activeTab === 'solar' ? (timeRange === 'month' ? 'solar' : 'solarGen') : (timeRange === 'month' ? 'eb' : 'consumption');
    let chartName = activeTab === 'solar' ? "Solar Generation (Units)" : "EB Consumption (Units)";
    let strokeColor = activeTab === 'solar' ? "#16a34a" : "#1976d2";

    return (
      <div className="detail-chart-block">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h4 style={{ margin: 0 }}>{timeRange === 'month' ? 'Month-wise' : 'Day-wise'} Trend Analysis</h4>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {timeRange === 'day' && (
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)} 
                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', color: '#1e293b' }} 
              />
            )}
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
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={dataKey} stroke={strokeColor} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name={chartName} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderHourlyLog = (sourceType) => {
    const data = sourceType === 'solar' ? computedSolar : (sourceType === 'eb' ? computedEB : computedDG);
    return (
      <div style={{ marginTop: 24 }}>
        <h4 style={{ marginBottom: 16 }}>Detailed Hourly Log ({sourceType.toUpperCase()})</h4>
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', width: '25%' }}>Hour</th>
                {sourceType !== 'eb' && <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>Generation (Units)</th>}
                <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>Consumption (Units)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#475569' }}>{row.hour}</td>
                  {sourceType !== 'eb' && <td style={{ padding: '10px 12px', color: '#16a34a', fontWeight: 600, textAlign: 'center' }}>{row.generation}</td>}
                  <td style={{ padding: '10px 12px', color: '#1e293b', textAlign: 'center' }}>{row.consumption}</td>
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
      ? computedEquipment.filter(e => typeFilter.includes(e.type))
      : computedEquipment;

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

  const renderEB = () => {
    const ebTotal = computedCombined.reduce((sum, d) => sum + d.eb, 0);
    const displayEbTotal = ebTotal > 0 ? `${ebTotal.toFixed(0)} Units` : '0 Units';
    const displayEstBill = ebTotal > 0 ? `Estimated: ₹${(ebTotal * 5.3).toFixed(0)}` : 'Estimated: ₹0';
    
    const totalTransformerCapacity = phData?.transformers ? phData.transformers.reduce((sum, t) => {
      const load = parseFloat(t.load) || 0;
      return sum + load;
    }, 0) : 0;
    const displayGridCap = totalTransformerCapacity > 0 ? `${totalTransformerCapacity} kVA` : '0 kVA';

    return (
      <>
        <div className="detail-kpi-row">
          <div className="detail-kpi-card">
            <div className="kpi-label">Main Grid Capacity</div>
            <div className="kpi-value">{displayGridCap}</div>
            <div className="kpi-label">Supply: 11kV HT</div>
          </div>
          <div className="detail-kpi-card">
            <div className="kpi-label">Today's Consumption</div>
            <div className="kpi-value">{displayEbTotal}</div>
            <div className="kpi-label">{displayEstBill}</div>
          </div>
        </div>
        {renderFinancials('eb')}
        <div className="detail-chart-block">
          <h4>Hourly Grid Consumption</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={computedEB}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="consumption" fill="#2563eb" name="Grid Load (Units)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {renderComparisonChart()}
        {renderHourlyLog('eb')}
        {renderMajorEquipment(['Transformer', 'Panel'])}
      </>
    );
  };

  const renderDG = () => {
    const dgFuelUsed = (phData && phData.dgDailyFuel) ? phData.dgDailyFuel : 0;
    const displayDgFuel = dgFuelUsed > 0 ? `${dgFuelUsed} L` : '0 L';
    const displayDgCost = dgFuelUsed > 0 ? `Cost: ₹${(dgFuelUsed * 98).toFixed(0)}` : 'Cost: ₹0';

    const totalFuelCap = phData?.dgSets ? phData.dgSets.reduce((sum, d) => {
      const cap = parseFloat(d.fuelCap) || 0;
      return sum + cap;
    }, 0) : 0;
    const displayFullTank = totalFuelCap > 0 ? `Full Tank: ${totalFuelCap} L` : 'Full Tank: 0 L';

    return (
      <>
        <div className="detail-kpi-row">
          <div className="detail-kpi-card">
            <div className="kpi-label">Diesel Inventory</div>
            <div className="kpi-value">Not Tracked</div>
            <div className="kpi-label">{displayFullTank}</div>
          </div>
          <div className="detail-kpi-card">
            <div className="kpi-label">Today's Fuel Use</div>
            <div className="kpi-value">{displayDgFuel}</div>
            <div className="kpi-label">{displayDgCost}</div>
          </div>
        </div>
        {renderFinancials('dg')}
        <div className="detail-chart-block">
          <h4>Hourly DG Consumption</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={computedDG}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="consumption" fill="#ea580c" name="Campus Load (Units)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {renderComparisonChart()}
        {renderHourlyLog('dg')}
        {renderMajorEquipment(['Generator'])}
      </>
    );
  };

  const renderSolar = () => {
    const isMonth = timeRange === 'month';
    const chartData = isMonth ? (trendData.monthly || []) : computedDailyPower;
    const xKey = isMonth ? 'month' : 'date';

    const solarTotal = computedCombined.reduce((sum, d) => sum + d.solar, 0);
    const displaySolarTotal = solarTotal > 0 ? `${solarTotal.toFixed(0)} Units` : '0 Units';

    const solarUsageTotal = computedSolar.reduce((sum, d) => sum + d.consumption, 0);
    const displaySolarUsage = solarUsageTotal > 0 ? `${solarUsageTotal.toFixed(0)} Units` : '0 Units';

    const displayBalance = (solarTotal - solarUsageTotal) > 0 ? `${(solarTotal - solarUsageTotal).toFixed(0)} Units` : '0 Units';

    const totalSolarPanels = phData?.solarPv ? phData.solarPv.reduce((sum, s) => {
      const panels = parseInt(s.panels) || 0;
      return sum + panels;
    }, 0) : 0;

    return (
      <>
        <div className="detail-kpi-row">
          <div className="detail-kpi-card" style={{ borderLeft: '4px solid #eab308' }}>
            <div className="kpi-label">Solar Panel Units</div>
            <div className="kpi-value">{totalSolarPanels} Units</div>
            <div className="kpi-label">Installed Base</div>
          </div>
          <div className="detail-kpi-card" style={{ borderLeft: '4px solid #16a34a' }}>
            <div className="kpi-label">Total Yield Today</div>
            <div className="kpi-value">{displaySolarTotal}</div>
            <div className="kpi-label">Energy Generated</div>
          </div>
          <div className="detail-kpi-card" style={{ borderLeft: '4px solid #3b82f6' }}>
            <div className="kpi-label">Today's Usage</div>
            <div className="kpi-value">{displaySolarUsage}</div>
            <div className="kpi-label">Solar Power Consumed</div>
          </div>
          <div className="detail-kpi-card" style={{ borderLeft: '4px solid #9333ea' }}>
            <div className="kpi-label">Balance Power</div>
            <div className="kpi-value">{displayBalance}</div>
            <div className="kpi-label">Excess Energy</div>
          </div>

        </div>
        
        <div className="detail-chart-block">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ margin: 0 }}>Hourly Generation vs Consumption</h4>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Current (Today)</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={computedSolar}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="generation" fill="#eab308" name="Generated (Units)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="consumption" fill="#3b82f6" name="Consumed (Units)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 16, gap: '16px' }}>
          {timeRange === 'day' && (
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)} 
              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#1e293b' }} 
            />
          )}
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
              <Line type="monotone" dataKey={isMonth ? 'solar' : 'solarGen'} stroke="#eab308" strokeWidth={3} dot={{ r: 4 }} name="Generated (Units)" />
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
              <Line type="monotone" dataKey={isMonth ? 'eb' : 'consumption'} stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} name="Consumed (Units)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {renderHourlyLog('solar')}
        {renderMajorEquipment(['Inverter'])}
      </>
    );
  };

  const renderMain = () => {
    const peakLoadKwh = computedCombined.length > 0 ? Math.max(...computedCombined.map(d => d.total)) : 0;
    const peakLoadMw = (peakLoadKwh / 1000).toFixed(2);
    const displayPeakMw = peakLoadMw > 0 ? `${peakLoadMw} MW` : '0 MW';

    const totalEnergy = computedCombined.reduce((sum, d) => sum + d.total, 0);
    const solarTotalForMix = computedCombined.reduce((sum, d) => sum + d.solar, 0);
    const solarMixPct = totalEnergy > 0 ? Math.round((solarTotalForMix / totalEnergy) * 100) : 0;
    const displaySolarMix = `${solarMixPct}%`;

    const ebTotalForDist = computedCombined.reduce((sum, d) => sum + d.eb, 0);
    const dgTotalForDist = computedCombined.reduce((sum, d) => sum + d.dg, 0);
    const totalMixForDist = ebTotalForDist + solarTotalForMix + dgTotalForDist;
    const ebPct = totalMixForDist > 0 ? Math.round((ebTotalForDist / totalMixForDist) * 100) : 0;
    const solarPct = totalMixForDist > 0 ? Math.round((solarTotalForMix / totalMixForDist) * 100) : 0;
    const dgPct = totalMixForDist > 0 ? Math.round((dgTotalForDist / totalMixForDist) * 100) : 0;

    return (
      <>
        <div className="detail-kpi-row">
          <div className="detail-kpi-card" style={{ borderLeft: '4px solid #1976d2' }}>
            <div className="kpi-label">Total Campus Load</div>
            <div className="kpi-value">{displayPeakMw}</div>
            <div className="kpi-label">Real-time Peak</div>
          </div>
          <div className="detail-kpi-card" style={{ borderLeft: '4px solid #16a34a' }}>
            <div className="kpi-label">Renewable Contribution</div>
            <div className="kpi-value">{displaySolarMix}</div>
            <div className="kpi-label">Solar Mix Today</div>
          </div>

        </div>

        <div className="detail-chart-block">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ margin: 0 }}>Combined Energy Mix (Hourly)</h4>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Campus Consumption</span>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={computedCombined}>
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

        <div style={{ maxWidth: '600px', margin: '24px auto 0' }}>
          <div className="detail-inner-card">
            <h4 style={{ marginTop: 0 }}>Energy Distribution</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Grid (EB)', value: ebPct, color: '#2563eb' },
                { label: 'Solar', value: solarPct, color: '#eab308' },
                { label: 'DG Backup', value: dgPct, color: '#ea580c' }
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
        </div>
      </>
    );
  };

  const renderStaff = () => (
    <div style={{ marginTop: 16 }}>
      <div className="detail-kpi-row" style={{ marginBottom: 24 }}>
        <div className="detail-kpi-card">
          <div className="kpi-label">Total Staff</div>
          <div className="kpi-value">{computedStaff.length}</div>
          <div className="kpi-label">On-duty Roster</div>
        </div>
        <div className="detail-kpi-card">
          <div className="kpi-label">Present Today</div>
          <div className="kpi-value">{computedStaff.filter(s => s.attendance === 'Present').length}</div>
          <div className="kpi-label">Available Operators</div>
        </div>
      </div>

      <div className="responsive-grid">
        {computedStaff.map(staff => (
          <div key={staff.id} className="detail-inner-card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800, color: '#64748b', border: '2px solid #e2e8f0' }}>
              {staff.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, color: '#1e293b' }}>{staff.name}</h4>
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
        <div>
          <h2 style={{ margin: 0 }}>Power House Dashboard</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0 0' }}>Real-time and historic grid, solar, and DG backup metrics.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input 
            type="date"
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            style={{ padding: '5px 12px', borderRadius: '20px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontWeight: 700, fontSize: '0.8rem', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          />
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
          <li>DG fuel efficiency: 3.2 Units/Litre (within standard range).</li>
        </ul>
      </div>
    </div>
  );
}
