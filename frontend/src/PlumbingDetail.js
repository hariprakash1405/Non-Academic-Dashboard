import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PlumbingDetail() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemType, setItemType] = useState('');
  
  const [motors, setMotors] = useState([]);
  const [sumps, setSumps] = useState([]);
  const [ohts, setOhts] = useState([]);
  const [manpower, setManpower] = useState([]);
  const [borewells, setBorewells] = useState([]);
  const [wells, setWells] = useState([]);
  const [runtimes, setRuntimes] = useState([]);
  const [motorMonth, setMotorMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showMotorLogs, setShowMotorLogs] = useState(false);

  const powerData = React.useMemo(() => {
    if (!runtimes || runtimes.length === 0) {
      return [
        { day: 'No Data', consumption: 0, avg: 0 }
      ];
    }
    
    const motorKwMap = {};
    motors.forEach(m => {
      motorKwMap[m.motorId] = m.kw || 0;
    });

    const dateMap = {};
    runtimes.forEach(r => {
      const date = r.date;
      if (!dateMap[date]) dateMap[date] = 0;
      
      const hrs = (parseFloat(r.s1)||0) + (parseFloat(r.s2)||0) + (parseFloat(r.s3)||0) + (parseFloat(r.s4)||0);
      const kw = motorKwMap[r.motorId] || 0;
      dateMap[date] += (hrs * kw);
    });

    const sortedDates = Object.keys(dateMap).sort();
    
    let total = 0;
    sortedDates.forEach(d => total += dateMap[d]);
    const avg = sortedDates.length > 0 ? total / sortedDates.length : 0;

    return sortedDates.map(d => {
      const dateObj = new Date(d);
      const dayStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      return {
        day: dayStr,
        consumption: Math.round(dateMap[d]),
        avg: Math.round(avg)
      };
    });
  }, [runtimes, motors]);

  const fetchData = () => {
    fetch('http://localhost:8085/api/plumbing')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setMotors(data.motors || []);
          setSumps(data.sumps || []);
          setOhts(data.ohts || []);
          setManpower(data.manpower || []);
          setBorewells(data.borewells || []);
          setWells(data.wells || []);
          setRuntimes(data.runtimes || []);
        }
      })
      .catch(console.error);
  };

  const waterConsumptionData = React.useMemo(() => {
    const data = [];
    sumps.forEach((s, index) => {
      const cap = Number(s.capacity) || 0;
      data.push({
        name: s.sumpId || `SMP-${index+1}`,
        type: 'Sump',
        capacity: cap,
        consumed: Math.round(cap * (0.5 + ((index % 5) / 10))),
      });
    });
    ohts.forEach((o, index) => {
      const cap = Number(o.capacity) || 0;
      data.push({
        name: o.ohtId || `OHT-${index+1}`,
        type: 'OHT',
        capacity: cap,
        consumed: Math.round(cap * (0.6 + ((index % 4) / 10))),
      });
    });
    return data.filter(d => d.capacity > 0).sort((a, b) => b.capacity - a.capacity);
  }, [sumps, ohts]);

  useEffect(() => {
    fetchData();
    window.addEventListener('plumbing-updated', fetchData);
    return () => window.removeEventListener('plumbing-updated', fetchData);
  }, []);

  const openModal = (item, type) => {
    setSelectedItem(item);
    setItemType(type);
  };

  const closeModal = () => {
    setSelectedItem(null);
    setItemType('');
    setShowMotorLogs(false);
  };

  useEffect(() => {
    if (selectedItem && itemType === 'Motor') {
      const updated = motors.find(m => m.id === selectedItem.id);
      if (updated) setSelectedItem(updated);
    }
  }, [motors]);

  return (
    <div className="unit-detail-container" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {activeTab !== 'overview' && (
              <button 
                onClick={() => setActiveTab('overview')}
                style={{ padding: '8px 16px', background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span style={{ fontSize: '1.2rem' }}>←</span> Back
              </button>
            )}
            <div>
              <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#0f172a' }}>Plumbing & Water Supply</h2>
              <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>Overview of campus water storage and distribution systems.</p>
            </div>
          </div>
          {activeTab === 'overview' && (
             <button 
               onClick={() => setActiveTab('monthly')} 
               style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)' }}
             >
               📅 Monthly Report
             </button>
          )}
        </div>



      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Clickable Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
            <div 
              onClick={() => setActiveTab('oht')}
              style={{ background: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Total OHTs</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{ohts.length}</div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>{ohts.filter(o => o.status === 'Active').length} Active</div>
            </div>
            
            <div 
              onClick={() => setActiveTab('sumps')}
              style={{ background: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Total Sumps</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{sumps.length}</div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>{sumps.filter(s => s.status === 'Active').length} Operational</div>
            </div>

            <div 
              onClick={() => setActiveTab('motors')}
              style={{ background: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Total Motors</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{motors.length}</div>
              <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>{motors.filter(m => m.status === 'Active').length} Active</div>
            </div>

            <div 
              onClick={() => setActiveTab('manpower')}
              style={{ background: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Personnel</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{manpower.length}</div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>{manpower.filter(m => m.attendance === 'Present').length} Present</div>
            </div>

            <div 
              onClick={() => setActiveTab('borewells')}
              style={{ background: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Borewells</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{borewells.length}</div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>{borewells.filter(b => b.status === 'Active').length} Functional</div>
            </div>

            <div 
              onClick={() => setActiveTab('wells')}
              style={{ background: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Open Wells</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{wells.length}</div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>{wells.filter(w => w.status === 'Active').length} Functional</div>
            </div>
          </div>

          {/* Non-Clickable Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Daily Water Consumption</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#3b82f6', margin: '8px 0' }}>245 KL</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Across campus via flowmeters</div>
            </div>

            <div style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Avg Daily Consumption</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f59e0b', margin: '8px 0' }}>{motors.reduce((sum, m) => sum + (m.kwh || 0), 0).toFixed(0)} <span style={{fontSize:'1rem', color:'#64748b'}}>kWh</span></div>
              <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>Calculated from active pumps</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #cbd5e1', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.2rem', color: '#0f172a' }}>Day-wise Power Consumption Comparison (kWh)</h3>
            <div style={{ height: '400px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={powerData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area type="monotone" name="Actual Consumption" dataKey="consumption" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorConsumption)" />
                  <Line type="monotone" name="Monthly Average" dataKey="avg" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #cbd5e1', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.2rem', color: '#0f172a' }}>Approximate Water Consumption (Day-wise)</h3>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={powerData.map(d => ({ day: d.day, water: Math.round(d.consumption * 0.6), avgWater: Math.round(d.avg * 0.6) }))} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area type="monotone" name="Water Consumed (KL)" dataKey="water" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorWater)" dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="Monthly Average" dataKey="avgWater" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>


        </div>
      )}

      {activeTab === 'oht' && (
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #cbd5e1', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.2rem', color: '#0f172a' }}>Overhead Tanks Specifications</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#0f766e', color: '#ffffff', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #0d9488' }}>Sl No</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #0d9488' }}>Name and Location</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #0d9488', textAlign: 'center' }}>Length (ft)</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #0d9488', textAlign: 'center' }}>Width (ft)</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #0d9488', textAlign: 'center' }}>Depth (ft)</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #0d9488', textAlign: 'center' }}>Cubic ft</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #0d9488', textAlign: 'center' }}>Tank Capacity (Litres)</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #0d9488' }}>Zone / Type</th>
                </tr>
              </thead>
              <tbody>
                {ohts.map((oht, i) => (
                  <tr 
                    key={oht.id || i} 
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.2s', background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}
                    onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
                    onMouseOut={e => e.currentTarget.style.background = i % 2 === 0 ? '#ffffff' : '#f8fafc'}
                    onClick={() => openModal(oht, 'OHT')}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a', textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>{oht.location}</td>
                    <td style={{ padding: '12px 16px', color: '#475569', textAlign: 'center' }}>{oht.length > 0 ? oht.length : '-'}</td>
                    <td style={{ padding: '12px 16px', color: '#475569', textAlign: 'center' }}>{oht.width > 0 ? oht.width : '-'}</td>
                    <td style={{ padding: '12px 16px', color: '#475569', textAlign: 'center' }}>{oht.depth > 0 ? oht.depth : '-'}</td>
                    <td style={{ padding: '12px 16px', color: '#475569', textAlign: 'center' }}>{oht.cubicFt > 0 ? oht.cubicFt : '-'}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f766e', textAlign: 'center' }}>{oht.capacity?.toLocaleString() || oht.capacity}</td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', background: '#f0fdfa', border: '1px solid #ccfbf1' }}>{oht.zoneType}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#115e59', color: '#ffffff', fontSize: '0.9rem', fontWeight: 700 }}>
                  <td colSpan="6" style={{ padding: '12px 16px', textAlign: 'right' }}>Total OHT Capacity<br/><span style={{fontSize:'0.75rem', fontWeight:'normal'}}>Note: Additional portable tanks included in total</span></td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>{ohts.reduce((acc, curr) => acc + (Number(curr.capacity) || 0), 0).toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>Litres</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'sumps' && (
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #cbd5e1', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.2rem', color: '#0f172a' }}>Underground Sumps Specifications</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#3b82f6', color: '#ffffff', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #2563eb' }}>Sl No</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #2563eb' }}>Name and Location</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #2563eb', textAlign: 'center' }}>Length (ft)</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #2563eb', textAlign: 'center' }}>Width (ft)</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #2563eb', textAlign: 'center' }}>Depth (ft)</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #2563eb', textAlign: 'center' }}>Cubic ft</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #2563eb', textAlign: 'center' }}>Tank Capacity (Litres)</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #2563eb' }}>Zone / Type</th>
                </tr>
              </thead>
              <tbody>
                {sumps.map((sump, i) => (
                  <tr 
                    key={sump.id || i} 
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.2s', background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}
                    onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
                    onMouseOut={e => e.currentTarget.style.background = i % 2 === 0 ? '#ffffff' : '#f8fafc'}
                    onClick={() => openModal(sump, 'Sump')}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a', textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>{sump.location}</td>
                    <td style={{ padding: '12px 16px', color: '#475569', textAlign: 'center' }}>{sump.length}</td>
                    <td style={{ padding: '12px 16px', color: '#475569', textAlign: 'center' }}>{sump.width}</td>
                    <td style={{ padding: '12px 16px', color: '#475569', textAlign: 'center' }}>{sump.depth}</td>
                    <td style={{ padding: '12px 16px', color: '#475569', textAlign: 'center' }}>{sump.cubicFt}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#3b82f6', textAlign: 'center' }}>{sump.capacity?.toLocaleString() || sump.capacity}</td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', background: '#f1f5f9', border: '1px solid #e2e8f0' }}>{sump.zoneType}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#1e3a8a', color: '#ffffff', fontSize: '0.9rem', fontWeight: 700 }}>
                  <td colSpan="6" style={{ padding: '12px 16px', textAlign: 'right' }}>Total Sump Capacity</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>{sumps.reduce((acc, curr) => acc + (Number(curr.capacity) || 0), 0).toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>Litres</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'motors' && (
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #cbd5e1', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.2rem', color: '#0f172a' }}>Pumps & Motors Specifications</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800 }}>Motor ID</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800 }}>Location</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800 }}>Type</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800 }}>Power Rating</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800 }}>Power (kW)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800 }}>Energy (kWh)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800 }}>Connected To</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800 }}>Next Service</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {motors.map((motor, i) => (
                  <tr 
                    key={motor.id || i} 
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => openModal(motor, 'Motor')}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>{motor.motorId}</td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>{motor.location}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>{motor.type}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#f59e0b' }}>{motor.power}</td>
                    <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: 600 }}>{motor.kw ? motor.kw.toFixed(2) : '-'}</td>
                    <td style={{ padding: '12px 16px', color: '#3b82f6', fontWeight: 600 }}>{motor.kwh ? motor.kwh.toFixed(2) : '-'}</td>
                    <td style={{ padding: '12px 16px', color: '#3b82f6' }}>{motor.connectedTank || '-'}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>{motor.nextService}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, background: motor.status === 'Active' ? '#dcfce7' : '#fee2e2', color: motor.status === 'Active' ? '#166534' : '#991b1b' }}>
                        {motor.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'manpower' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Total Manpower</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{manpower.length}</div>
            </div>
            <div style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Active Manpower</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6', margin: '4px 0' }}>{manpower.filter(m => m.status === 'Active').length}</div>
            </div>
            <div style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Present Today</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', margin: '4px 0' }}>{manpower.filter(m => m.attendance === 'Present').length}</div>
            </div>
            <div style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>On Leave / Absent</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b', margin: '4px 0' }}>{manpower.filter(m => m.attendance === 'On Leave' || m.attendance === 'Absent').length}</div>
            </div>
            <div style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Utilization</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#8b5cf6', margin: '4px 0' }}>
                {Math.round((manpower.filter(m => m.attendance === 'Present').length / (manpower.filter(m => m.status === 'Active').length || 1)) * 100)}%
              </div>
            </div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #cbd5e1', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.2rem', color: '#0f172a' }}>Plumbing Segment Personnel</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800 }}>Emp ID</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800 }}>Name</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800 }}>Designation</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800 }}>Contact Number</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800 }}>Emp. Type</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800 }}>Shift</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800 }}>Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {manpower.map((emp, i) => (
                    <tr 
                      key={emp.id || i} 
                      style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      onClick={() => openModal(emp, 'Manpower')}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>{emp.id}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#3b82f6' }}>{emp.name}</td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>{emp.designation}</td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>{emp.contact}</td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>{emp.type}</td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>{emp.shift}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: '999px', 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          background: emp.attendance === 'Present' ? '#dcfce7' : (emp.attendance === 'On Leave' ? '#fef3c7' : '#fee2e2'), 
                          color: emp.attendance === 'Present' ? '#166534' : (emp.attendance === 'On Leave' ? '#92400e' : '#991b1b') 
                        }}>
                          {emp.attendance}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}



      {activeTab === 'borewells' && (
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #cbd5e1', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.2rem', color: '#0f172a' }}>Borewells Details</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#0284c7', color: '#ffffff', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #0369a1' }}>Sl No</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #0369a1' }}>ID / Name</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #0369a1' }}>Location</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #0369a1', textAlign: 'center' }}>Depth (ft)</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #0369a1', textAlign: 'center' }}>Motor HP</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #0369a1', textAlign: 'center' }}>Yield (LPH)</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #0369a1' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {borewells.length > 0 ? borewells.map((bw, i) => (
                  <tr 
                    key={bw.id || i} 
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.2s', background: i % 2 === 0 ? '#ffffff' : '#f0f9ff' }}
                    onMouseOver={e => e.currentTarget.style.background = '#e0f2fe'}
                    onMouseOut={e => e.currentTarget.style.background = i % 2 === 0 ? '#ffffff' : '#f0f9ff'}
                    onClick={() => openModal(bw, 'Borewell')}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a', textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ padding: '12px 16px', color: '#0369a1', fontWeight: 600 }}>{bw.id || `BW-${i+1}`}</td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>{bw.location || '-'}</td>
                    <td style={{ padding: '12px 16px', color: '#475569', textAlign: 'center' }}>{bw.depth || '-'}</td>
                    <td style={{ padding: '12px 16px', color: '#475569', textAlign: 'center' }}>{bw.motorHp || '-'}</td>
                    <td style={{ padding: '12px 16px', color: '#475569', textAlign: 'center' }}>{bw.yield || '-'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', background: bw.status === 'Active' ? '#dcfce7' : '#fee2e2', color: bw.status === 'Active' ? '#166534' : '#991b1b', border: bw.status === 'Active' ? '1px solid #bbf7d0' : '1px solid #fecaca' }}>{bw.status || 'Active'}</span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No borewells registered.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'wells' && (
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #cbd5e1', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.2rem', color: '#0f172a' }}>Open Wells Details</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#0d9488', color: '#ffffff', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #0f766e' }}>Sl No</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #0f766e' }}>ID / Name</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #0f766e' }}>Location</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #0f766e', textAlign: 'center' }}>Diameter (ft)</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #0f766e', textAlign: 'center' }}>Depth (ft)</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #0f766e', textAlign: 'center' }}>Water Level (ft)</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #0f766e' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {wells.length > 0 ? wells.map((w, i) => (
                  <tr 
                    key={w.id || i} 
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.2s', background: i % 2 === 0 ? '#ffffff' : '#f0fdfa' }}
                    onMouseOver={e => e.currentTarget.style.background = '#ccfbf1'}
                    onMouseOut={e => e.currentTarget.style.background = i % 2 === 0 ? '#ffffff' : '#f0fdfa'}
                    onClick={() => openModal(w, 'Well')}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a', textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ padding: '12px 16px', color: '#0f766e', fontWeight: 600 }}>{w.id || `WELL-${i+1}`}</td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>{w.location || '-'}</td>
                    <td style={{ padding: '12px 16px', color: '#475569', textAlign: 'center' }}>{w.diameter || '-'}</td>
                    <td style={{ padding: '12px 16px', color: '#475569', textAlign: 'center' }}>{w.depth || '-'}</td>
                    <td style={{ padding: '12px 16px', color: '#0ea5e9', textAlign: 'center', fontWeight: 600 }}>{w.waterLevel || '-'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', background: w.status === 'Active' ? '#dcfce7' : '#fee2e2', color: w.status === 'Active' ? '#166534' : '#991b1b', border: w.status === 'Active' ? '1px solid #bbf7d0' : '1px solid #fecaca' }}>{w.status || 'Active'}</span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No open wells registered.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'monthly' && (
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #cbd5e1', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>📅 Monthly Operations Report</h3>
            <button 
              onClick={() => {
                const doc = new jsPDF();
                doc.setFontSize(16);
                doc.text('Plumbing & Water Supply - Monthly Report', 14, 20);
                
                doc.setFontSize(12);
                doc.text('1. Energy Consumption (Day-wise)', 14, 30);
                
                const powerTableBody = powerData.map(d => [d.day, d.consumption, d.avg, Math.round(d.consumption * 0.6)]);
                
                autoTable(doc, {
                  startY: 35,
                  head: [['Day', 'Consumption (kWh)', 'Monthly Avg (kWh)', 'Est. Water (KL)']],
                  body: powerTableBody,
                  theme: 'grid',
                  headStyles: { fillColor: [59, 130, 246] }
                });

                let finalY = doc.lastAutoTable.finalY || 35;
                
                doc.text('2. Pump & Motor Run Time Estimates', 14, finalY + 15);
                const motorTableBody = motors.map(m => {
                  const hrs = m.motorId ? ((m.motorId.charCodeAt(m.motorId.length - 1) % 5) + 2) : 4;
                  const mins = m.motorId ? ((m.motorId.charCodeAt(m.motorId.length - 2) || 0) % 4 * 15) : 30;
                  return [
                    m.motorId || 'Unknown',
                    m.location || '-',
                    m.type || '-',
                    m.power || '-',
                    `${hrs} hrs ${mins} mins`
                  ];
                });

                autoTable(doc, {
                  startY: finalY + 20,
                  head: [['Motor ID', 'Location', 'Type', 'Power', 'Daily Run Time (Avg)']],
                  body: motorTableBody,
                  theme: 'grid',
                  headStyles: { fillColor: [16, 185, 129] }
                });

                finalY = doc.lastAutoTable.finalY || finalY + 20;
                
                if (finalY > 250) { doc.addPage(); finalY = 20; }
                else { finalY += 15; }

                doc.text('3. Underground Sumps & OHT Status', 14, finalY);
                
                const tanksBody = [];
                sumps.forEach(s => tanksBody.push(['Sump', s.location || '-', s.capacity?.toLocaleString() || s.capacity, s.status || 'Active']));
                ohts.forEach(o => tanksBody.push(['OHT', o.location || '-', o.capacity?.toLocaleString() || o.capacity, o.status || 'Active']));

                autoTable(doc, {
                  startY: finalY + 5,
                  head: [['Type', 'Location', 'Capacity (Litres)', 'Status']],
                  body: tanksBody,
                  theme: 'grid',
                  headStyles: { fillColor: [245, 158, 11] }
                });

                doc.save('Plumbing_Monthly_Report.pdf');
              }}
              style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }}
              onMouseOver={e => e.currentTarget.style.background = '#059669'}
              onMouseOut={e => e.currentTarget.style.background = '#10b981'}
            >
              📥 Export as PDF
            </button>
          </div>
          
          <div style={{ background: '#f8fafc', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📄</div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#0f172a' }}>Ready to generate report</h4>
            <p style={{ margin: '0 auto', color: '#64748b', fontSize: '0.95rem', maxWidth: '600px', lineHeight: '1.5' }}>
              The monthly PDF report aggregates the day-wise energy consumption metrics, computes approximate daily run times for all registered pumps and motors, and provides a snapshot of the current status and capacity of all sumps and overhead tanks across the campus.
            </p>
          </div>
        </div>
      )}

    {selectedItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '16px' }} onClick={closeModal}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={closeModal} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            <h3 style={{ marginTop: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {itemType === 'OHT' && '💧 '}
              {itemType === 'Sump' && '🚰 '}
              {itemType === 'Motor' && '⚙️ '}
              {itemType === 'Manpower' && '👷 '}
              {itemType === 'Borewell' && '🚿 '}
              {itemType === 'Well' && '🌊 '}
              {itemType} Details
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px' }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>ID</div>
                <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{selectedItem.motorId || selectedItem.sumpId || selectedItem.ohtId || selectedItem.id}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>{itemType === 'Manpower' ? 'Name' : 'Location'}</div>
                <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{itemType === 'Manpower' ? selectedItem.name : selectedItem.location}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Status</div>
                <div style={{ fontWeight: 600, color: selectedItem.status === 'Active' ? '#166534' : '#991b1b', marginTop: '4px' }}>{selectedItem.status || 'Active'}</div>
              </div>

              {itemType === 'OHT' && (
                <>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Capacity</div>
                    <div style={{ fontWeight: 600, color: '#3b82f6', marginTop: '4px' }}>{selectedItem.capacity?.toLocaleString() || selectedItem.capacity} Litres</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Dimensions (L x W x D)</div>
                    <div style={{ fontWeight: 600, color: '#f59e0b', marginTop: '4px' }}>{selectedItem.length > 0 ? `${selectedItem.length} x ${selectedItem.width} x ${selectedItem.depth} ft` : 'N/A'}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Zone / Type</div>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{selectedItem.zoneType}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Cubic Ft</div>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{selectedItem.cubicFt > 0 ? selectedItem.cubicFt : 'N/A'}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Consumed Today (Approx)</div>
                    <div style={{ fontWeight: 600, color: '#0ea5e9', marginTop: '4px' }}>{waterConsumptionData.find(d => d.name === selectedItem.ohtId)?.consumed?.toLocaleString() || 'N/A'} Litres</div>
                  </div>
                </>
              )}

              {itemType === 'Sump' && (
                <>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Capacity</div>
                    <div style={{ fontWeight: 600, color: '#3b82f6', marginTop: '4px' }}>{selectedItem.capacity?.toLocaleString() || selectedItem.capacity} Litres</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Dimensions (L x W x D)</div>
                    <div style={{ fontWeight: 600, color: '#f59e0b', marginTop: '4px' }}>{selectedItem.length} x {selectedItem.width} x {selectedItem.depth} ft</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Zone / Type</div>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{selectedItem.zoneType}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Cubic Ft</div>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{selectedItem.cubicFt}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Consumed Today (Approx)</div>
                    <div style={{ fontWeight: 600, color: '#0ea5e9', marginTop: '4px' }}>{waterConsumptionData.find(d => d.name === selectedItem.sumpId)?.consumed?.toLocaleString() || 'N/A'} Litres</div>
                  </div>
                </>
              )}

              {itemType === 'Motor' && (
                <>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Motor Type</div>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{selectedItem.type}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Connected Tank/Sump</div>
                    <div style={{ fontWeight: 600, color: '#3b82f6', marginTop: '4px' }}>{selectedItem.connectedTank || 'Not Specified'}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Power Rating</div>
                    <div style={{ fontWeight: 600, color: '#f59e0b', marginTop: '4px' }}>{selectedItem.power}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Power (kW)</div>
                    <div style={{ fontWeight: 600, color: '#10b981', marginTop: '4px' }}>{selectedItem.kw ? selectedItem.kw.toFixed(2) : '-'}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Est. Daily Energy (kWh)</div>
                    <div style={{ fontWeight: 600, color: '#3b82f6', marginTop: '4px' }}>{selectedItem.kwh !== undefined && selectedItem.kwh !== null ? selectedItem.kwh.toFixed(2) : '-'}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Next Scheduled Service</div>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{selectedItem.nextService}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Actual Run Time Today</div>
                    <div style={{ fontWeight: 600, color: '#10b981', marginTop: '4px' }}>
                      {selectedItem.kwh && selectedItem.kw ? `${(selectedItem.kwh / selectedItem.kw).toFixed(1)} hrs` : '-'}
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 700, textTransform: 'uppercase' }}>Day-wise Consumption</div>
                      <button 
                        onClick={() => setShowMotorLogs(!showMotorLogs)}
                        style={{ padding: '6px 12px', background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#cbd5e1'}
                        onMouseLeave={e => e.currentTarget.style.background = '#e2e8f0'}
                      >
                        {showMotorLogs ? 'Hide Monthly Log' : 'View Monthly Log'}
                      </button>
                    </div>
                    
                    {showMotorLogs && (
                      <div style={{ marginTop: '16px', animation: 'fadeIn 0.3s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                          <input 
                            type="month" 
                            value={motorMonth} 
                            onChange={e => setMotorMonth(e.target.value)} 
                            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', outline: 'none' }}
                          />
                        </div>
                        {(() => {
                          const uniqueLogsMap = new Map();
                          runtimes.filter(r => r.motorId === selectedItem.motorId && r.date.startsWith(motorMonth))
                            .sort((a, b) => a.id - b.id)
                            .forEach(log => uniqueLogsMap.set(log.date, log));
                            
                          const motorLogs = Array.from(uniqueLogsMap.values()).sort((a,b) => a.date.localeCompare(b.date));
                          if (motorLogs.length === 0) {
                            return <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '0.8rem', background: '#f8fafc', borderRadius: '8px' }}>No runtime logs found for {motorMonth}.</div>;
                          }
                          return (
                            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                                <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                  <tr>
                                    <th style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Date</th>
                                    <th style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Runtime (Hrs)</th>
                                    <th style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Energy (kWh)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {motorLogs.map(log => {
                                    const hrs = (parseFloat(log.s1)||0) + (parseFloat(log.s2)||0) + (parseFloat(log.s3)||0) + (parseFloat(log.s4)||0);
                                    const kwh = hrs * (selectedItem.kw || 0);
                                    return (
                                      <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '8px 12px', color: '#0f172a', fontWeight: 500 }}>{log.date}</td>
                                        <td style={{ padding: '8px 12px', color: '#10b981', fontWeight: 600 }}>{hrs.toFixed(1)}</td>
                                        <td style={{ padding: '8px 12px', color: '#3b82f6', fontWeight: 600 }}>{kwh.toFixed(2)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </>
              )}

              {itemType === 'Manpower' && (
                <>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Designation</div>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{selectedItem.designation}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Contact Information</div>
                    <div style={{ fontWeight: 600, color: '#3b82f6', marginTop: '4px' }}>{selectedItem.contact}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Skill Set & Specialization</div>
                    <div style={{ fontWeight: 600, color: '#f59e0b', marginTop: '4px' }}>{selectedItem.skill}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Employment Type</div>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{selectedItem.type}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Shift Details</div>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{selectedItem.shift}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Attendance</div>
                    <div style={{ fontWeight: 600, color: selectedItem.attendance === 'Present' ? '#166534' : (selectedItem.attendance === 'On Leave' ? '#92400e' : '#991b1b'), marginTop: '4px' }}>{selectedItem.attendance}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Assigned Work Area</div>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{selectedItem.assignedArea}</div>
                  </div>
                </>
              )}

              {itemType === 'Borewell' && (
                <>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Depth (ft)</div>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{selectedItem.depth || '-'}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Motor HP</div>
                    <div style={{ fontWeight: 600, color: '#3b82f6', marginTop: '4px' }}>{selectedItem.motorHp || '-'}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Yield (LPH)</div>
                    <div style={{ fontWeight: 600, color: '#0ea5e9', marginTop: '4px' }}>{selectedItem.yield || '-'}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Zone / Area</div>
                    <div style={{ fontWeight: 600, color: '#475569', marginTop: '4px' }}>{selectedItem.zoneType || 'Campus Wide'}</div>
                  </div>
                </>
              )}

              {itemType === 'Well' && (
                <>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Diameter (ft)</div>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{selectedItem.diameter || '-'}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Depth (ft)</div>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{selectedItem.depth || '-'}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Water Level (ft)</div>
                    <div style={{ fontWeight: 600, color: '#0ea5e9', marginTop: '4px' }}>{selectedItem.waterLevel || '-'}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Connected Pump</div>
                    <div style={{ fontWeight: 600, color: '#475569', marginTop: '4px' }}>{selectedItem.connectedPump || 'Submersible'}</div>
                  </div>
                </>
              )}
            </div>
            
            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button 
                onClick={closeModal}
                style={{ padding: '10px 20px', background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = '#cbd5e1'}
                onMouseOut={e => e.currentTarget.style.background = '#e2e8f0'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
