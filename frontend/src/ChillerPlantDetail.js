import { API_BASE } from './config';
import React, { useState, useMemo, useEffect } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

// --- Chiller Units Comparative Matrix ---


function SplitACTable({ splitAcData = [], vrvData = [], coldRoomData = [] }) {
  const totalQty = splitAcData.reduce((sum, item) => sum + (parseInt(item.qty) || 0), 0);
  const totalTon = splitAcData.reduce((sum, item) => sum + (parseFloat(item.totTon) || 0), 0);

  const vrvTotalQty = vrvData.reduce((sum, item) => sum + (parseInt(item.qty) || 0), 0);
  const vrvTotalTon = vrvData.reduce((sum, item) => sum + (parseFloat(item.totTon) || 0), 0);

  const coldRoomTotalQty = coldRoomData.reduce((sum, item) => sum + (parseInt(item.qty) || 0), 0);
  const coldRoomTotalTon = coldRoomData.reduce((sum, item) => sum + (parseFloat(item.totTon) || 0), 0);

  const summaryMap = {};
  splitAcData.forEach(item => {
    const ton = parseFloat(item.ton) || 0;
    const qty = parseInt(item.qty) || 0;
    const totTon = parseFloat(item.totTon) || 0;
    if (!summaryMap[ton]) summaryMap[ton] = { ton, qty: 0, totTon: 0 };
    summaryMap[ton].qty += qty;
    summaryMap[ton].totTon += totTon;
  });
  const computedSummaryData = Object.values(summaryMap).sort((a,b) => a.ton - b.ton);
  const summaryTotalQty = computedSummaryData.reduce((sum, item) => sum + item.qty, 0);
  const summaryTotalTon = computedSummaryData.reduce((sum, item) => sum + item.totTon, 0);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>🌬️ Area wise Split A/C Details</h3>
      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#fef08a', color: '#854d0e', borderBottom: '2px solid #ca8a04' }}>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>S.No</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Make</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Ton</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Model</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Block No</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Depart.</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Qty (Nos.)</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Total (Ton)</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Location</th>
            </tr>
          </thead>
          <tbody>
            {splitAcData.map((row, idx) => (
              <tr key={row.id || idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                <td style={{ padding: '10px 8px', fontWeight: 600 }}>{row.sno || (idx + 1)}</td>
                <td style={{ padding: '10px 8px' }}>{row.make}</td>
                <td style={{ padding: '10px 8px' }}>{row.ton}</td>
                <td style={{ padding: '10px 8px' }}>{row.model}</td>
                <td style={{ padding: '10px 8px' }}>{row.block}</td>
                <td style={{ padding: '10px 8px' }}>{row.dept}</td>
                <td style={{ padding: '10px 8px', fontWeight: 600 }}>{row.qty}</td>
                <td style={{ padding: '10px 8px', fontWeight: 600 }}>{row.totTon}</td>
                <td style={{ padding: '10px 8px' }}>{row.loc}</td>
              </tr>
            ))}
            <tr style={{ background: '#bfdbfe', fontWeight: 'bold' }}>
              <td colSpan="6" style={{ padding: '12px 8px', textAlign: 'center' }}>TOTAL</td>
              <td style={{ padding: '12px 8px' }}>{totalQty}</td>
              <td style={{ padding: '12px 8px' }}>{totalTon.toFixed(2)}</td>
              <td style={{ padding: '12px 8px' }}></td>
            </tr>
          </tbody>
        </table>
      
      <br/>
      
      {/* Summary Table */}
      <h4 style={{ margin: '0 0 16px 0', color: '#0f172a' }}>📊 Summary</h4>
      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '10px', maxWidth: '400px', marginBottom: '24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#fef08a', color: '#854d0e', borderBottom: '2px solid #ca8a04' }}>
              <th style={{ padding: '8px', fontWeight: 700 }}>TON</th>
              <th style={{ padding: '8px', fontWeight: 700 }}>QTY (No.)</th>
              <th style={{ padding: '8px', fontWeight: 700 }}>TOTAL TON</th>
            </tr>
          </thead>
          <tbody>
            {computedSummaryData.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                <td style={{ padding: '8px', fontWeight: 600 }}>{row.ton}</td>
                <td style={{ padding: '8px', fontWeight: 600 }}>{row.qty}</td>
                <td style={{ padding: '8px', fontWeight: 600 }}>{row.totTon.toFixed(2)}</td>
              </tr>
            ))}
            <tr style={{ background: '#bfdbfe', fontWeight: 'bold' }}>
              <td style={{ padding: '8px' }}>TOTAL</td>
              <td style={{ padding: '8px' }}>{summaryTotalQty}</td>
              <td style={{ padding: '8px' }}>{summaryTotalTon.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* VRV A/C System Table */}
      <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>🏨 Guest House - VRV A/C System</h3>
      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '10px', marginBottom: '24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#dcfce7', color: '#166534', borderBottom: '2px solid #22c55e' }}>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>S.No</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Make</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Ton</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Model</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Block No</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Depart.</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Qty (Nos.)</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Total (Ton)</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Location</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {vrvData.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#f0fdf4' }}>
                <td style={{ padding: '10px 8px', fontWeight: 600 }}>{row.sno || idx + 1}</td>
                <td style={{ padding: '10px 8px' }}>{row.make}</td>
                <td style={{ padding: '10px 8px' }}>{row.ton}</td>
                <td style={{ padding: '10px 8px' }}>{row.model}</td>
                <td style={{ padding: '10px 8px' }}>{row.block}</td>
                <td style={{ padding: '10px 8px' }}>{row.dept}</td>
                <td style={{ padding: '10px 8px', fontWeight: 600 }}>{row.qty}</td>
                <td style={{ padding: '10px 8px', fontWeight: 600 }}>{row.totTon}</td>
                <td style={{ padding: '10px 8px' }}>{row.loc}</td>
                <td style={{ padding: '10px 8px', color: '#64748b', fontStyle: 'italic' }}>{row.notes}</td>
              </tr>
            ))}
            <tr style={{ background: '#bfdbfe', fontWeight: 'bold' }}>
              <td colSpan="6" style={{ padding: '12px 8px', textAlign: 'center' }}>TOTAL</td>
              <td style={{ padding: '12px 8px' }}>{vrvTotalQty}</td>
              <td style={{ padding: '12px 8px' }}>{vrvTotalTon.toFixed(2)}</td>
              <td colSpan="2" style={{ padding: '12px 8px' }}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* COLD Room Table */}
      <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>❄️ COLD Room</h3>
      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '10px', marginBottom: '24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#dcfce7', color: '#166534', borderBottom: '2px solid #22c55e' }}>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>S.No</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Make</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Ton</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Model</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Block No</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Depart.</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Qty (Nos.)</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Total (Ton)</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Location</th>
            </tr>
          </thead>
          <tbody>
            {coldRoomData.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#f0fdf4' }}>
                <td style={{ padding: '10px 8px', fontWeight: 600 }}>{row.sno || idx + 1}</td>
                <td style={{ padding: '10px 8px' }}>{row.make}</td>
                <td style={{ padding: '10px 8px' }}>{row.ton}</td>
                <td style={{ padding: '10px 8px' }}>{row.model}</td>
                <td style={{ padding: '10px 8px' }}>{row.block}</td>
                <td style={{ padding: '10px 8px' }}>{row.dept}</td>
                <td style={{ padding: '10px 8px', fontWeight: 600 }}>{row.qty}</td>
                <td style={{ padding: '10px 8px', fontWeight: 600 }}>{row.totTon}</td>
                <td style={{ padding: '10px 8px' }}>{row.loc}</td>
              </tr>
            ))}
            <tr style={{ background: '#bfdbfe', fontWeight: 'bold' }}>
              <td colSpan="6" style={{ padding: '12px 8px', textAlign: 'center' }}>TOTAL</td>
              <td style={{ padding: '12px 8px' }}>{coldRoomTotalQty}</td>
              <td style={{ padding: '12px 8px' }}>{coldRoomTotalTon.toFixed(2)}</td>
              <td style={{ padding: '12px 8px' }}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
}

function AHUUnitsTable({ ahuData = [] }) {
  const displayData = React.useMemo(() => {
    const rawData = ahuData.filter(d => !d.subTotal);
    const groups = new Map();
    const blockOrder = [];
    let currentBlock = 'Unknown';

    rawData.forEach(row => {
      if (row.block && String(row.block).trim() !== '') {
        currentBlock = String(row.block).trim();
      }
      if (!groups.has(currentBlock)) {
        blockOrder.push(currentBlock);
        groups.set(currentBlock, []);
      }
      groups.get(currentBlock).push({ ...row });
    });

    const finalData = [];
    let sNoCounter = 1;
    let grandTotCap = 0;
    let grandTotHp = 0;
    let grandArea = 0;

    blockOrder.forEach((blockName, index) => {
      const rows = groups.get(blockName);
      let subTotCap = 0;
      let subTotHp = 0;
      let subArea = 0;

      rows.forEach((r, idx) => {
        subTotCap += parseFloat(r.totCap) || 0;
        subTotHp += parseFloat(r.totHp) || 0;
        // Only sum area if it is the first time this specific area is declared for the block/floor?
        // Actually, in the old hardcoded data, area was added simply by parseFloat(r.area).
        subArea += parseFloat(r.area) || 0;

        if (idx === 0) {
          r.sNo = sNoCounter++;
          r.block = blockName;
        } else {
          r.sNo = '';
          r.block = '';
        }
        finalData.push(r);
      });

      const romanNumeral = ['i','ii','iii','iv','v','vi','vii','viii','ix','x','xi','xii','xiii','xiv','xv','xvi','xvii','xviii','xix','xx'][index] || index+1;
      finalData.push({
        subTotal: `Sub Total - (${romanNumeral})`,
        totCap: subTotCap,
        totHp: subTotHp,
        area: subArea
      });

      grandTotCap += subTotCap;
      grandTotHp += subTotHp;
      grandArea += subArea;
    });

    if (finalData.length > 0) {
      finalData.push({
        subTotal: 'Grand Total',
        totCap: grandTotCap,
        totHp: grandTotHp,
        area: grandArea
      });
    }

    return finalData;
  }, [ahuData]);

  const spans = React.useMemo(() => {
    const s = [];
    for (let i = 0; i < displayData.length; i++) {
      s[i] = { sNo: 1, block: 1, floor: 1, loc: 1, area: 1 };
    }
    
    let activeSNo = -1, activeBlock = -1, activeFloor = -1, activeLoc = -1, activeArea = -1;
    
    for (let i = 0; i < displayData.length; i++) {
      const row = displayData[i];
      if (row.subTotal) {
        activeSNo = -1; activeBlock = -1; activeFloor = -1; activeLoc = -1; activeArea = -1;
        continue;
      }
      
      // sNo
      if (row.sNo !== undefined && row.sNo !== null && row.sNo !== '') {
        activeSNo = i;
      } else if (activeSNo !== -1) {
        s[activeSNo].sNo++;
        s[i].sNo = 0;
      }

      // block
      if (row.block !== undefined && row.block !== null && row.block !== '') {
        activeBlock = i;
      } else if (activeBlock !== -1) {
        s[activeBlock].block++;
        s[i].block = 0;
      }
      
      // floor
      let floorNew = false;
      if (row.floor !== undefined && row.floor !== null && row.floor !== '') {
        activeFloor = i;
        floorNew = true;
      } else if (activeFloor !== -1) {
        s[activeFloor].floor++;
        s[i].floor = 0;
      }
      
      // area
      if (row.area !== undefined && row.area !== null && row.area !== '') {
        activeArea = i;
      } else if (activeArea !== -1 && !floorNew) {
        s[activeArea].area++;
        s[i].area = 0;
      }
      
      // loc
      let locVal = row.loc || '';
      if (locVal !== '') {
        if (activeLoc !== -1 && !floorNew && ahuData[activeLoc].loc === locVal) {
          s[activeLoc].loc++;
          s[i].loc = 0;
        } else {
          activeLoc = i;
        }
      } else if (activeLoc !== -1 && !floorNew) {
        s[activeLoc].loc++;
        s[i].loc = 0;
      }
    }
    
    return s;
  }, [displayData]);

  return (
    <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', padding: '24px', marginBottom: '28px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>🏢 Chiller Unit Area Wise (TR & HP) Details</h3>
      <div style={{ overflowX: 'auto', border: '1px solid #333' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#ffff00', borderTop: '1px solid #333', borderBottom: '1px solid #333' }}>
              <th style={{ padding: '8px', border: '1px solid #333', color: '#000', fontWeight: 'bold' }}>S.No.</th>
              <th style={{ padding: '8px', border: '1px solid #333', color: '#000', fontWeight: 'bold' }}>Block Name</th>
              <th style={{ padding: '8px', border: '1px solid #333', color: '#000', fontWeight: 'bold' }}>Floor</th>
              <th style={{ padding: '8px', border: '1px solid #333', color: '#000', fontWeight: 'bold' }}>Location / Lab Name</th>
              <th style={{ padding: '8px', border: '1px solid #333', color: '#000', fontWeight: 'bold' }}>Type of unit</th>
              <th style={{ padding: '8px', border: '1px solid #333', color: '#000', fontWeight: 'bold' }}>Capacity TR</th>
              <th style={{ padding: '8px', border: '1px solid #333', color: '#000', fontWeight: 'bold' }}>Qty</th>
              <th style={{ padding: '8px', border: '1px solid #333', color: '#000', fontWeight: 'bold' }}>Total Capacity TR</th>
              <th style={{ padding: '8px', border: '1px solid #333', color: '#000', fontWeight: 'bold' }}>Motor HP</th>
              <th style={{ padding: '8px', border: '1px solid #333', color: '#000', fontWeight: 'bold' }}>Total Motor HP</th>
              <th style={{ padding: '8px', border: '1px solid #333', color: '#000', fontWeight: 'bold' }}>Area (sq. ft.)</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, idx) => {
              if (row.subTotal) {
                return (
                  <tr key={idx} style={{ background: '#c4d79b', fontWeight: 'bold', border: '1px solid #333' }}>
                    <td colSpan={7} style={{ padding: '6px 8px', border: '1px solid #333', textAlign: 'center', color: '#000' }}>{row.subTotal}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #333', textAlign: 'center', color: '#000' }}>{row.totCap?.toFixed(2)}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #333' }}></td>
                    <td style={{ padding: '6px 8px', border: '1px solid #333', textAlign: 'center', color: '#000' }}>{row.totHp}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #333', textAlign: 'center', color: '#000' }}>{row.area}</td>
                  </tr>
                );
              }
              return (
                <tr key={idx} style={{ borderBottom: '1px solid #ccc' }}>
                  {spans[idx].sNo > 0 && (
                    <td rowSpan={spans[idx].sNo} style={{ padding: '6px 8px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 'bold', color: '#333', verticalAlign: 'middle' }}>{row.sNo || ''}</td>
                  )}
                  {spans[idx].block > 0 && (
                    <td rowSpan={spans[idx].block} style={{ padding: '6px 8px', border: '1px solid #ccc', color: '#1e293b', whiteSpace: 'pre-line', verticalAlign: 'middle' }}>{row.block || ''}</td>
                  )}
                  {spans[idx].floor > 0 && (
                    <td rowSpan={spans[idx].floor} style={{ padding: '6px 8px', border: '1px solid #ccc', color: '#475569', verticalAlign: 'middle' }}>{row.floor || ''}</td>
                  )}
                  {spans[idx].loc > 0 && (
                    <td rowSpan={spans[idx].loc} style={{ padding: '6px 8px', border: '1px solid #ccc', color: '#475569', verticalAlign: 'middle' }}>{row.loc}</td>
                  )}
                  <td style={{ padding: '6px 8px', border: '1px solid #ccc', color: '#475569', verticalAlign: 'middle' }}>{row.type}</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #ccc', textAlign: 'center', color: '#475569', verticalAlign: 'middle' }}>{row.cap !== undefined && row.cap !== null ? Number(row.cap).toFixed(2) : ''}</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #ccc', textAlign: 'center', color: '#475569', verticalAlign: 'middle' }}>{row.qty !== undefined && row.qty !== null ? Number(row.qty).toFixed(2) : ''}</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #ccc', textAlign: 'center', color: '#475569', verticalAlign: 'middle' }}>{row.totCap !== undefined && row.totCap !== null ? Number(row.totCap).toFixed(2) : ''}</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #ccc', textAlign: 'center', color: '#475569', verticalAlign: 'middle' }}>{row.hp || ''}</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #ccc', textAlign: 'center', color: '#475569', verticalAlign: 'middle' }}>{row.totHp || '0'}</td>
                  {spans[idx].area > 0 && (
                    <td rowSpan={spans[idx].area} style={{ padding: '6px 8px', border: '1px solid #ccc', textAlign: 'center', color: '#475569', verticalAlign: 'middle' }}>{row.area || ''}</td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ChillerPlantDetail() {
  const [activeTab, setActiveTab] = useState('overview');
  const [reportSelectedMonth, setReportSelectedMonth] = useState(null);
  const [energyView, setEnergyView] = useState('Day');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [logs, setLogs] = useState([]);
  
  
  const [operatingLogs, setOperatingLogs] = useState([]);
  const currentUserStr = localStorage.getItem('currentUser');
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const isAuthorizedUnitHead = currentUser?.role === 'unit_head' && currentUser?.unitName === 'Chiller Plant';
  const [isEditingParams, setIsEditingParams] = useState(false);
  const [selectedOpDate, setSelectedOpDate] = useState('');
  const [ahuData, setAhuData] = useState([]);
  const [splitAcData, setSplitAcData] = useState([]);
  const [vrvData, setVrvData] = useState([]);
  const [coldRoomData, setColdRoomData] = useState([]);
  const [chillerBreakdowns, setChillerBreakdowns] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [staff, setStaff] = useState([]);

  const [plantSpecifications, setPlantSpecifications] = useState([]);
  const [unitSpecifications, setUnitSpecifications] = useState([]);

  // Operational entry fields
  const [formDate, setFormDate] = useState('2026-05-21');

  // --- Tariff Calculator State Variables ---
  const [rateOffPeak, setRateOffPeak] = useState(10.41);
  const [ratePeak, setRatePeak] = useState(12.58);
  const [rateNight, setRateNight] = useState(10.00);

  const [avgCoolingLoadTr, setAvgCoolingLoadTr] = useState(1000);

  // --- Backend Integration Fetch ---
  useEffect(() => {
    fetchData();
    const handleUpdate = () => fetchData();
    const handleTabChange = (e) => {
      setActiveTab(e.detail);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('unit-form-updated', handleUpdate);
    window.addEventListener('change-chiller-tab', handleTabChange);
    return () => {
      window.removeEventListener('unit-form-updated', handleUpdate);
      window.removeEventListener('change-chiller-tab', handleTabChange);
    };
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(API_BASE + '/api/chiller');
      if (res.ok) {
        const data = await res.json();
        if (data.logs && data.logs.length > 0) setLogs(data.logs);
        if (data.equipments && data.equipments.length > 0) setEquipments(data.equipments);
        if (data.staff && data.staff.length > 0) setStaff(data.staff);
        if (data.billingParams) {
          const bp = data.billingParams;
          setRateOffPeak(bp.rateOffPeak);
          setRatePeak(bp.ratePeak);
          setRateNight(bp.rateNight);
          setAvgCoolingLoadTr(bp.avgCoolingLoadTr);
        }
      }
    } catch (e) {
      console.warn("Could not connect to backend server. Falling back to local state mock.", e);
    }
    // Fetch operating logs
    try {
      const r2 = await fetch(API_BASE + '/api/chiller/operating-logs');
      if (r2.ok) {
        const opLogs = await r2.json();
        if (opLogs && opLogs.length > 0) {
          setOperatingLogs(opLogs);
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yyyy = yesterday.getFullYear();
          const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
          const dd = String(yesterday.getDate()).padStart(2, '0');
          const yesterdayStr = `${yyyy}-${mm}-${dd}`;
          
          const hasYesterday = opLogs.some(l => l.date === yesterdayStr);
          setSelectedOpDate(hasYesterday ? yesterdayStr : opLogs[0].date);
        }
      }
    } catch (e) {
      console.warn('Operating logs not available');
    }
    // Fetch AHU Units
    try {
      const r3 = await fetch(API_BASE + '/api/chiller/ahu-units');
      if (r3.ok) {
        const units = await r3.json();
        if (units && units.length > 0) {
          setAhuData(units);
        }
      }
    } catch (e) {
      console.warn('AHU Units not available');
    }
    // Fetch Split AC Units
    try {
      const r4 = await fetch(API_BASE + '/api/chiller/split-ac');
      if (r4.ok) {
        const splitUnits = await r4.json();
        if (splitUnits && splitUnits.length > 0) {
          setSplitAcData(splitUnits);
        }
      }
    } catch (e) {
      console.warn('Split AC Units not available');
    }
    // Fetch VRV Units
    try {
      const r5 = await fetch(API_BASE + '/api/chiller/vrv-units');
      if (r5.ok) {
        const vrvUnits = await r5.json();
        if (vrvUnits && vrvUnits.length > 0) {
          setVrvData(vrvUnits);
        }
      }
    } catch (e) {
      console.warn('VRV Units not available');
    }
    // Fetch Cold Room Units
    try {
      const r6 = await fetch(API_BASE + '/api/chiller/cold-room');
      if (r6.ok) {
        const crUnits = await r6.json();
        if (crUnits && crUnits.length > 0) {
          setColdRoomData(crUnits);
        }
      }
    } catch (e) {
      console.warn('Cold Room Units not available');
    }

    try {
      const rs = await fetch(API_BASE + '/api/chiller/staff');
      if (rs.ok) { const d = await rs.json(); setStaff(d || []); }
    } catch(e) {}
    try {
      const re = await fetch(API_BASE + '/api/chiller/equipment');
      if (re.ok) { const d = await re.json(); setEquipments(d || []); }
    } catch(e) {}
    try {
      const rps = await fetch(API_BASE + '/api/chiller/plant-specs');
      if (rps.ok) { const d = await rps.json(); setPlantSpecifications(d || []); }
    } catch(e) {}
    try {
      const rus = await fetch(API_BASE + '/api/chiller/unit-specs');
      if (rus.ok) { const d = await rus.json(); setUnitSpecifications(d || []); }
    } catch(e) {}
    // Fetch Breakdowns
    try {
      const r7 = await fetch(API_BASE + '/api/chiller/breakdowns');
      if (r7.ok) {
        const bd = await r7.json();
        if (bd) {
          setChillerBreakdowns(bd);
        }
      }
    } catch (e) {
      console.warn('Breakdowns not available');
    }
  };

  const syncBillingParams = async (updates) => {
    const payload = {
      rateOffPeak: updates.rateOffPeak !== undefined ? updates.rateOffPeak : rateOffPeak,
      ratePeak: updates.ratePeak !== undefined ? updates.ratePeak : ratePeak,
      rateNight: updates.rateNight !== undefined ? updates.rateNight : rateNight,
      avgCoolingLoadTr: updates.avgCoolingLoadTr !== undefined ? updates.avgCoolingLoadTr : avgCoolingLoadTr,
    };
    try {
      await fetch(API_BASE + '/api/chiller/update-billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error("Tariff config sync failed:", e);
    }
  };

  // Sync wrappers
  const updateOffPeak = (val) => { setRateOffPeak(val); syncBillingParams({ rateOffPeak: val }); };
  const updatePeak = (val) => { setRatePeak(val); syncBillingParams({ ratePeak: val }); };
  const updateNight = (val) => { setRateNight(val); syncBillingParams({ rateNight: val }); };
  const updateAvgLoad = (val) => { setAvgCoolingLoadTr(val); syncBillingParams({ avgCoolingLoadTr: val }); };



  const averageCOP = useMemo(() => {
    if (logs.length === 0) return 0;
    const totalCoolingWh = logs.reduce((acc, curr) => acc + (curr.coolingLoad * 3.51685), 0);
    const totalEnergyWh = logs.reduce((acc, curr) => acc + curr.energyConsumed, 0);
    return totalEnergyWh > 0 ? (totalCoolingWh / totalEnergyWh).toFixed(2) : 0;
  }, [logs]);



  // --- Dynamic Tariff Billing Calculator Formulas ---
  const latestOpLog = useMemo(() => {
    if (operatingLogs.length === 0) return null;
    if (!selectedOpDate) return operatingLogs[0];
    return operatingLogs.find(l => l.date === selectedOpDate) || null;
  }, [operatingLogs, selectedOpDate]);

  const billingData = useMemo(() => {
    const c1Power = equipments[0]?.power || 185;
    const c2Power = equipments[1]?.power || 185;
    const c3Power = equipments[2]?.power || 240;
    const p1Power = equipments[3]?.power || 74;
    const p2Power = equipments[4]?.power || 88;
    const p3Power = equipments[5]?.power || 22;

    const parseLog = (key) => latestOpLog ? (parseFloat(latestOpLog[key]) || 0) : 0;

    const makeUnit = (name, power, s1, s2, s3, s4) => {
      const peakHr = parseLog(s1);
      const nonPeakHr = parseLog(s2) + parseLog(s3);
      const nightHr = parseLog(s4);
      const totalHr = peakHr + nonPeakHr + nightHr;

      const peakEnergy = peakHr * power;
      const nonPeakEnergy = nonPeakHr * power;
      const nightEnergy = nightHr * power;
      const totalEnergy = peakEnergy + nonPeakEnergy + nightEnergy;

      const peakCost = peakEnergy * ratePeak;
      const nonPeakCost = nonPeakEnergy * rateOffPeak;
      const nightCost = nightEnergy * rateNight;
      const totalCost = peakCost + nonPeakCost + nightCost;

      return {
        name, power, peakHr, nonPeakHr, nightHr, totalHr,
        peakEnergy, nonPeakEnergy, nightEnergy, totalEnergy,
        peakCost, nonPeakCost, nightCost, totalCost
      };
    };

    const rows = [
      makeUnit('DAIKIN Unit-I', c1Power, 'unit1Slot1', 'unit1Slot2', 'unit1Slot3', 'unit1Slot4'),
      makeUnit('DAIKIN Unit-II', c2Power, 'unit2Slot1', 'unit2Slot2', 'unit2Slot3', 'unit2Slot4'),
      makeUnit('DUNHAM-BUSH Unit-III', c3Power, 'unit3Slot1', 'unit3Slot2', 'unit3Slot3', 'unit3Slot4'),
      makeUnit('Condensation Water Pump', p1Power, 'pump1Slot1', 'pump1Slot2', 'pump1Slot3', 'pump1Slot4'),
      makeUnit('Chilled Water Pump', p2Power, 'pump2Slot1', 'pump2Slot2', 'pump2Slot3', 'pump2Slot4'),
      makeUnit('Cooling Tower Motor', p3Power, 'pump3Slot1', 'pump3Slot2', 'pump3Slot3', 'pump3Slot4'),
    ];

    const grandTotal = rows.reduce((acc, row) => ({
      peakEnergy: acc.peakEnergy + row.peakEnergy,
      nonPeakEnergy: acc.nonPeakEnergy + row.nonPeakEnergy,
      nightEnergy: acc.nightEnergy + row.nightEnergy,
      totalEnergy: acc.totalEnergy + row.totalEnergy,
      peakCost: acc.peakCost + row.peakCost,
      nonPeakCost: acc.nonPeakCost + row.nonPeakCost,
      nightCost: acc.nightCost + row.nightCost,
      totalCost: acc.totalCost + row.totalCost,
    }), { peakEnergy: 0, nonPeakEnergy: 0, nightEnergy: 0, totalEnergy: 0, peakCost: 0, nonPeakCost: 0, nightCost: 0, totalCost: 0 });

    return { rows, grandTotal };
  }, [equipments, latestOpLog, ratePeak, rateOffPeak, rateNight]);

  const calculateCostForOpLog = (opLog) => {
    if (!opLog) return { energy: 0, cost: 0 };
    const c1Power = equipments[0]?.power || 185;
    const c2Power = equipments[1]?.power || 185;
    const c3Power = equipments[2]?.power || 240;
    const p1Power = equipments[3]?.power || 74;
    const p2Power = equipments[4]?.power || 88;
    const p3Power = equipments[5]?.power || 22;

    const parse = (key) => parseFloat(opLog[key]) || 0;
    
    let totalEnergy = 0;
    let totalCost = 0;

    const addUnit = (power, s1, s2, s3, s4) => {
      const peakHr = parse(s1);
      const nonPeakHr = parse(s2) + parse(s3);
      const nightHr = parse(s4);
      
      const peakEnergy = peakHr * power;
      const nonPeakEnergy = nonPeakHr * power;
      const nightEnergy = nightHr * power;
      totalEnergy += peakEnergy + nonPeakEnergy + nightEnergy;

      totalCost += (peakEnergy * ratePeak) + (nonPeakEnergy * rateOffPeak) + (nightEnergy * rateNight);
    };

    addUnit(c1Power, 'unit1Slot1', 'unit1Slot2', 'unit1Slot3', 'unit1Slot4');
    addUnit(c2Power, 'unit2Slot1', 'unit2Slot2', 'unit2Slot3', 'unit2Slot4');
    addUnit(c3Power, 'unit3Slot1', 'unit3Slot2', 'unit3Slot3', 'unit3Slot4');
    addUnit(p1Power, 'pump1Slot1', 'pump1Slot2', 'pump1Slot3', 'pump1Slot4');
    addUnit(p2Power, 'pump2Slot1', 'pump2Slot2', 'pump2Slot3', 'pump2Slot4');
    addUnit(p3Power, 'pump3Slot1', 'pump3Slot2', 'pump3Slot3', 'pump3Slot4');
    
    return { energy: totalEnergy, cost: totalCost };
  };

  const combinedActivePower = useMemo(() => billingData.rows.reduce((acc, r) => acc + (r.totalHr > 0 ? r.power : 0), 0), [billingData]);
  const grandTotalCost = billingData.grandTotal.totalCost;
  const grandTotalEnergy = billingData.grandTotal.totalEnergy;

  const peakCostPerTr = useMemo(() => {
    if (avgCoolingLoadTr <= 0) return 0;
    const hourlyCost = combinedActivePower * ratePeak;
    return hourlyCost / avgCoolingLoadTr;
  }, [combinedActivePower, ratePeak, avgCoolingLoadTr]);

  const nonPeakCostPerTr = useMemo(() => {
    if (avgCoolingLoadTr <= 0) return 0;
    const hourlyCost = combinedActivePower * rateOffPeak;
    return hourlyCost / avgCoolingLoadTr;
  }, [combinedActivePower, rateOffPeak, avgCoolingLoadTr]);

  return (
    <div className="unit-detail-container" style={{ color: '#1e293b' }}>
      
      {/* Page Header */}
      <div style={{ 
        background: '#ffffff', 
        border: '1px solid #cbd5e1', 
        borderRadius: '16px', 
        padding: '24px', 
        marginBottom: '28px', 
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>❄️ Central Chiller Plant Dashboard</h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '4px 0 0 0' }}>
              Monitoring thermal load factor, Coefficient of Performance (COP), and connected HVAC utilities.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input 
              type="date"
              value={selectedOpDate} 
              onChange={(e) => setSelectedOpDate(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              style={{ padding: '5px 12px', borderRadius: '20px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontWeight: 700, fontSize: '0.8rem', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            />
            <span style={{ background: '#dcfce7', color: '#166534', fontSize: '0.8rem', fontWeight: 700, padding: '6px 12px', borderRadius: '20px' }}>
              ● Plant Online
            </span>
            <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.8rem', fontWeight: 700, padding: '6px 12px', borderRadius: '20px' }}>
              System COP: {averageCOP}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        background: '#e2e8f0', 
        padding: '6px', 
        borderRadius: '12px', 
        marginBottom: '28px',
        overflowX: 'auto'
      }}>
        {[
          { id: 'overview',  label: '📊 Overview & Analytics' },
          { id: 'charts',    label: '📈 Operating Hours & Energy' },
          { id: 'monthly',   label: '📅 Monthly Report' },
          { id: 'inventory', label: '⚙️ Equipment & Manpower' },
          { id: 'billing',   label: '💸 Tariff & Cost Calculator' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: 'none',
              background: activeTab === tab.id ? '#ffffff' : 'transparent',
              color: activeTab === tab.id ? '#4f46e5' : '#475569',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: activeTab === tab.id ? '0 1px 3px 0 rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* KPI Cards Row */}
      <div className="detail-kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div 
          className="detail-kpi-card" 
          onClick={() => setActiveTab('specs')}
          style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div className="kpi-label" style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Installed Chiller Capacity</div>
          <div className="kpi-value" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#4f46e5', marginTop: '6px' }}>1,012 TR</div>
          <div className="kpi-label" style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>DAIKIN (x2) & Dunham-Bush (x1)</div>
        </div>
        <div 
          className="detail-kpi-card" 
          onClick={() => setActiveTab('specs')}
          style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div className="kpi-label" style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Installed Pump Power</div>
          <div className="kpi-value" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#8b5cf6', marginTop: '6px' }}>184 kW</div>
          <div className="kpi-label" style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Condenser, Chilled Water & CT Motors</div>
        </div>

        <div className="detail-kpi-card" style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
          <div className="kpi-label" style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Daily Power Cost</div>
          <div className="kpi-value" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', marginTop: '6px' }}>₹{grandTotalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          <div className="kpi-label" style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Based on active tariff rate model</div>
        </div>
        <div className="detail-kpi-card" style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
          <div className="kpi-label" style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Avg Daily Energy</div>
          <div className="kpi-value" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b', marginTop: '6px' }}>{grandTotalEnergy.toLocaleString()} kWh</div>
          <div className="kpi-label" style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Electricity consumption</div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: OPERATING HOURS & ENERGY CHARTS                                   */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'charts' && (() => {
        // ── Build slot-wise chart data from operatingLogs ──────────────────
        const SLOTS = [
          { key: '6AM–10AM',   u1: 'unit1Slot1', u2: 'unit2Slot1', u3: 'unit3Slot1', p1: 'pump1Slot1', p2: 'pump2Slot1', p3: 'pump3Slot1', p4: 'pump4Slot1' },
          { key: '10AM–6PM',   u1: 'unit1Slot2', u2: 'unit2Slot2', u3: 'unit3Slot2', p1: 'pump1Slot2', p2: 'pump2Slot2', p3: 'pump3Slot2', p4: 'pump4Slot2' },
          { key: '6PM–10PM',   u1: 'unit1Slot3', u2: 'unit2Slot3', u3: 'unit3Slot3', p1: 'pump1Slot3', p2: 'pump2Slot3', p3: 'pump3Slot3', p4: 'pump4Slot3' },
          { key: '10PM–6AM',   u1: 'unit1Slot4', u2: 'unit2Slot4', u3: 'unit3Slot4', p1: 'pump1Slot4', p2: 'pump2Slot4', p3: 'pump3Slot4', p4: 'pump4Slot4' },
        ];

        // Per-slot operating hours (chillers + pumps separately)
        const slotChillerData = SLOTS.map(s => ({
          slot: s.key,
          'Unit-I (DAIKIN)':   latestOpLog ? (latestOpLog[s.u1] || 0) : 0,
          'Unit-II (DAIKIN)':  latestOpLog ? (latestOpLog[s.u2] || 0) : 0,
          'Unit-III (DB)':     latestOpLog ? (latestOpLog[s.u3] || 0) : 0,
        }));

        const slotPumpData = SLOTS.map(s => ({
          slot: s.key,
          'Pump-I':  latestOpLog ? (latestOpLog[s.p1] || 0) : 0,
          'Pump-II': latestOpLog ? (latestOpLog[s.p2] || 0) : 0,
          'Pump-III':latestOpLog ? (latestOpLog[s.p3] || 0) : 0,
          'Pump-IV': latestOpLog ? (latestOpLog[s.p4] || 0) : 0,
        }));

        // Daily totals across all operating logs (trend)
        const trendData = operatingLogs.slice(0, 14).reverse().map(l => ({
          date: l.date ? l.date.slice(5) : '',
          'Chiller Peak Hrs':    parseFloat((l.chillerPeakHours || 0).toFixed(1)),
          'Chiller NonPeak Hrs': parseFloat((l.chillerNonPeakHours || 0).toFixed(1)),
          'Chiller Night Hrs':   parseFloat((l.chillerNightHours || 0).toFixed(1)),
          'Pump Peak Hrs':       parseFloat((l.pumpPeakHours || 0).toFixed(1)),
          'Pump NonPeak Hrs':    parseFloat((l.pumpNonPeakHours || 0).toFixed(1)),
        }));

        // Energy from operational logs
        const energyData = logs.slice(0, 14).reverse().map(l => ({
          date: l.date ? l.date.slice(5) : '',
          'Energy (kWh)':  l.energyConsumed || 0,
          'Run Hours':     l.runHours || 0,
          'COP':           parseFloat((l.cop || 0).toFixed(2)),
        }));

        // Summary cards
        const summaryCards = [
          { label: 'Chiller Peak Hrs', val: latestOpLog?.chillerPeakHours ?? '–', color: '#ef4444', bg: '#fef2f2' },
          { label: 'Chiller Non-Peak', val: latestOpLog?.chillerNonPeakHours ?? '–', color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Chiller Night Hrs', val: latestOpLog?.chillerNightHours ?? '–', color: '#1d4ed8', bg: '#eff6ff' },
          { label: 'Pump Peak Hrs',    val: latestOpLog?.pumpPeakHours ?? '–', color: '#ef4444', bg: '#fef2f2' },
          { label: 'Pump Non-Peak',    val: latestOpLog?.pumpNonPeakHours ?? '–', color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Pump Night Hrs',   val: latestOpLog?.pumpNightHours ?? '–', color: '#1d4ed8', bg: '#eff6ff' },
        ];

        const cardStyle = (color, bg) => ({
          flex: '1 1 130px', background: bg, border: `1px solid ${color}33`,
          borderRadius: '12px', padding: '14px 12px', textAlign: 'center',
        });

        const sectionTitle = (icon, title, sub) => (
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{icon} {title}</h4>
            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#64748b' }}>{sub}</p>
          </div>
        );

        const chartCard = (children) => (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '28px' }}>
            {children}
          </div>
        );

        const emptyState = (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📋</div>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '6px' }}>No Operating Log Data Yet</div>
            <div style={{ fontSize: '0.82rem' }}>Submit your first entry using the <strong>Click Here to Fill Unit Data Form</strong> button above.</div>
          </div>
        );

        const CHILLER_COLORS = ['#4f46e5', '#0ea5e9', '#7c3aed'];
        const PUMP_COLORS    = ['#f59e0b', '#10b981', '#ef4444', '#ec4899'];
        const TREND_COLORS   = ['#ef4444', '#f59e0b', '#1d4ed8', '#f97316', '#22c55e'];

        return (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>

            {/* Summary strip */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '28px' }}>
              {summaryCards.map(c => (
                <div key={c.label} style={cardStyle(c.color, c.bg)}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>{c.label}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: c.color }}>
                    {c.val === '–' ? '–' : (parseFloat(c.val) % 1 === 0 ? c.val : parseFloat(c.val).toFixed(1))}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '2px' }}>hrs (latest log)</div>
                </div>
              ))}
            </div>

            {/* ── Chart 1: Hour-wise Chiller Operating Hours ── */}
            {chartCard(<>
              {sectionTitle('⏱️', 'Hour-wise Chiller Operating Hours', 'Operating hours per time slot — Unit I (DAIKIN 185KW), Unit II (DAIKIN 185KW), Unit III (DUNHAM-BUSH 240KW)')}
              {!latestOpLog ? emptyState : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={slotChillerData} barGap={4} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="slot" tick={{ fontSize: 12, fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 11 }} label={{ value: 'Hours', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 11, fill: '#64748b' } }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}
                      formatter={(val, name) => [`${val} hrs`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '12px' }} />
                    {['Unit-I (DAIKIN)', 'Unit-II (DAIKIN)', 'Unit-III (DB)'].map((k, i) => (
                      <Bar key={k} dataKey={k} fill={CHILLER_COLORS[i]} radius={[4, 4, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </>)}

            {/* ── Chart 2: Hour-wise Pump Operating Hours ── */}
            {chartCard(<>
              {sectionTitle('🔄', 'Hour-wise Pump Operating Hours', 'Pump I (18.65kW), Pump II (18.65kW), Pump III (18.5kW), Pump IV (18.65kW) — hours per time slot')}
              {!latestOpLog ? emptyState : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={slotPumpData} barGap={4} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="slot" tick={{ fontSize: 12, fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 11 }} label={{ value: 'Hours', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 11, fill: '#64748b' } }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}
                      formatter={(val, name) => [`${val} hrs`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '12px' }} />
                    {['Pump-I', 'Pump-II', 'Pump-III', 'Pump-IV'].map((k, i) => (
                      <Bar key={k} dataKey={k} fill={PUMP_COLORS[i]} radius={[4, 4, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </>)}

            {/* ── Chart 3: Peak / Non-Peak / Night Trend across submitted logs ── */}
            {chartCard(<>
              {sectionTitle('📆', 'Operating Hours Trend (All Entries)', 'Daily Peak, Non-Peak and Night hour totals across all submitted chiller & pump logs')}
              {trendData.length === 0 ? emptyState : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <defs>
                      {TREND_COLORS.map((c, i) => (
                        <linearGradient key={i} id={`tg${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={c} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={c} stopOpacity={0.02} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} label={{ value: 'Hours', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 11, fill: '#64748b' } }} />
                    <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}
                      formatter={(val, name) => [`${val} hrs`, name]} />
                    <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '12px' }} />
                    {['Chiller Peak Hrs', 'Chiller NonPeak Hrs', 'Chiller Night Hrs', 'Pump Peak Hrs', 'Pump NonPeak Hrs'].map((k, i) => (
                      <Area key={k} type="monotone" dataKey={k} stroke={TREND_COLORS[i]} fill={`url(#tg${i})`} strokeWidth={2} dot={{ r: 3 }} />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </>)}

            {/* ── Chart 4: Daily Energy Consumption & Run Hours ── */}
            {chartCard(<>
              {sectionTitle('⚡', 'Daily Energy Consumption & Run Hours', 'Electricity consumed (kWh) vs. total run hours from operational parameter logs')}
              {energyData.length === 0 ? emptyState : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={energyData} barCategoryGap="25%">
                    <defs>
                      <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.7} />
                      </linearGradient>
                      <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#818cf8" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left"  tick={{ fontSize: 11 }} label={{ value: 'kWh', angle: -90, position: 'insideLeft', offset: 12, style: { fontSize: 11, fill: '#f59e0b' } }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} label={{ value: 'Run Hrs', angle: 90, position: 'insideRight', offset: 12, style: { fontSize: 11, fill: '#4f46e5' } }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}
                      formatter={(val, name) => [name === 'Energy (kWh)' ? `${val.toLocaleString()} kWh` : `${val} hrs`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '12px' }} />
                    <Bar yAxisId="left"  dataKey="Energy (kWh)" fill="url(#energyGrad)" radius={[5, 5, 0, 0]} />
                    <Bar yAxisId="right" dataKey="Run Hours"    fill="url(#hoursGrad)"  radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </>)}

            {/* ── Chart 5: COP Trend ── */}
            {chartCard(<>
              {sectionTitle('🌡️', 'Coefficient of Performance (COP) Trend', 'Daily COP = (Cooling Load TR × 3.51685) / Energy Consumed (kWh). Higher is better.')}
              {energyData.length === 0 ? emptyState : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={energyData}>
                    <defs>
                      <linearGradient id="copGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} label={{ value: 'COP', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 11, fill: '#10b981' } }} />
                    <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}
                      formatter={(val) => [val.toFixed(2), 'COP']} />
                    <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '12px' }} />
                    <Area type="monotone" dataKey="COP" stroke="#10b981" fill="url(#copGrad)" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </>)}

          </div>
        );
      })()}

      {/* ---------------------------------------------------------------------------------- */}
      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {/* ---------------------------------------------------------------------------------- */}

      {activeTab === 'overview' && (() => {
        // --- Dynamic Chart Data from Logs ---
        // 1. Daily Data (All days of selected month, padded with 0)
        const activeMonthStr = selectedMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        const [yyyy, mm] = activeMonthStr.split('-');
        const year = parseInt(yyyy);
        const month = parseInt(mm) - 1;
        
        const now = new Date();
        let maxDay = new Date(year, month + 1, 0).getDate();
        if (year === now.getFullYear() && month === now.getMonth()) {
          maxDay = now.getDate();
        } else if (year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth())) {
          maxDay = 0; // Future months have no days to show
        }
        
        const dailyEnergyData = [];
        for (let i = 1; i <= maxDay; i++) {
          const currentDate = new Date(year, month, i);
          const timeStr = currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
          const targetDateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
          const logEntry = logs.find(l => l.date === targetDateStr);
          dailyEnergyData.push({
            time: timeStr,
            energy: logEntry ? (logEntry.energyConsumed || 0) : 0
          });
        }

        // 2. Monthly Data
        const monthlyEnergyMap = {};
        logs.forEach(d => {
          const m = new Date(d.date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
          if (!monthlyEnergyMap[m]) monthlyEnergyMap[m] = 0;
          monthlyEnergyMap[m] += d.energyConsumed || 0;
        });
        const monthlyEnergyData = Object.keys(monthlyEnergyMap).map(k => ({ time: k, energy: monthlyEnergyMap[k] }));

        // 3. Hourly Data (Approximated from selected date's slots if available, else zeroed)
        let hourlyEnergyData = Array.from({length: 24}, (_, i) => ({ time: `${i.toString().padStart(2, '0')}:00`, energy: 0 }));
        if (operatingLogs && operatingLogs.length > 0) {
          const targetOp = selectedOpDate ? operatingLogs.find(op => op.date === selectedOpDate) : operatingLogs[0];
          
          if (targetOp) {
            const latestLog = logs.find(l => l.date === targetOp.date);
            const totalEnergy = latestLog ? latestLog.energyConsumed : 0;
            
            const nightHrs = targetOp.chillerNightHours + targetOp.pumpNightHours; // 8 hours (10PM - 6AM)
            const peakHrs = targetOp.chillerPeakHours + targetOp.pumpPeakHours;     // 4 hours (6AM - 10AM)
            const nonPeakHrs = targetOp.chillerNonPeakHours + targetOp.pumpNonPeakHours; // 12 hours (10AM - 10PM)
            const totalHrs = nightHrs + peakHrs + nonPeakHrs;

            if (totalHrs > 0 && totalEnergy > 0) {
               const nightRate = (totalEnergy * (nightHrs / totalHrs)) / 8;
               const peakRate = (totalEnergy * (peakHrs / totalHrs)) / 4;
               const nonPeakRate = (totalEnergy * (nonPeakHrs / totalHrs)) / 12;

               hourlyEnergyData = hourlyEnergyData.map((h, i) => {
                  let e = 0;
                  if (i >= 22 || i < 6) e = nightRate;
                  else if (i >= 6 && i < 10) e = peakRate;
                  else e = nonPeakRate;
                  return { ...h, energy: Math.round(e) };
               });
            }
          }
        }

        const getEnergyData = () => {
          if (energyView === 'Month') return monthlyEnergyData.length > 0 ? monthlyEnergyData : [{ time: 'No Data', energy: 0 }];
          // Default to daily view
          return dailyEnergyData.length > 0 ? dailyEnergyData : [{ time: 'No Data', energy: 0 }];
        };

        return (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          
          {/* Energy Consumption Trend */}
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)', marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 800 }}>⚡ Energy Consumption Trend</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Hourly, Daily, and Monthly energy usage analysis.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '8px', alignItems: 'center' }}>
                {energyView === 'Day' && (
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', outline: 'none' }}
                  />
                )}
                {['Day', 'Month'].map(v => (
                  <button key={v} onClick={() => setEnergyView(v)} style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', background: energyView === v ? '#fff' : 'transparent', color: energyView === v ? '#4f46e5' : '#64748b', boxShadow: energyView === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getEnergyData()} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft', offset: 12, style: { fontSize: 11, fill: '#f59e0b' } }} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.82rem' }} formatter={(val) => [`${val.toLocaleString()} kWh`, 'Energy']} />
                <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '12px' }} />
                <Line type="monotone" dataKey="energy" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} name="Energy Consumption" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Breakdowns Log */}
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800 }}>🛠️ Breakdowns & Alarms Log (Last 6 Months)</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 16px' }}>Date</th>
                    <th style={{ padding: '12px 16px' }}>Equipment</th>
                    <th style={{ padding: '12px 16px' }}>Issue Description</th>
                    <th style={{ padding: '12px 16px' }}>Resolution Action</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {chillerBreakdowns.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>{item.date}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{item.equipment}</td>
                      <td style={{ padding: '12px 16px', color: '#b91c1c' }}>{item.issue}</td>
                      <td style={{ padding: '12px 16px' }}>{item.resolution}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '2px 8px', background: '#dcfce7', color: '#166534', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>{item.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
        );
      })()}

      {/* ---------------------------------------------------------------------------------- */}
      {/* TAB: MONTHLY REPORT */}
      {/* ---------------------------------------------------------------------------------- */}
      {activeTab === 'monthly' && (() => {
        if (reportSelectedMonth) {
          const [yyyy, mm] = reportSelectedMonth.split('-');
          const year = parseInt(yyyy);
          const month = parseInt(mm) - 1;
          const numDays = new Date(year, month + 1, 0).getDate();
          
          const dailyData = [];
          let grandPeak = 0, grandNonPeak = 0, grandNight = 0, grandTotal = 0;
          let pumpGrandPeak = 0, pumpGrandNonPeak = 0, pumpGrandNight = 0, pumpGrandTotal = 0;
          let grandEnergy = 0, grandCost = 0;

          for (let i = 1; i <= numDays; i++) {
            const dateStr = `${yyyy}-${mm}-${String(i).padStart(2, '0')}`;
            const log = operatingLogs.find(l => l.date === dateStr);
            const p = log ? (log.chillerPeakHours || 0) + (log.pumpPeakHours || 0) : 0;
            const np = log ? (log.chillerNonPeakHours || 0) + (log.pumpNonPeakHours || 0) : 0;
            const n = log ? (log.chillerNightHours || 0) + (log.pumpNightHours || 0) : 0;
            const t = p + np + n;
            
            const pp = log ? (log.pumpPeakHours || 0) : 0;
            const pnp = log ? (log.pumpNonPeakHours || 0) : 0;
            const pn = log ? (log.pumpNightHours || 0) : 0;
            const pt = pp + pnp + pn;

            let energy = 0, cost = 0;
            if (log) {
              const res = calculateCostForOpLog(log);
              energy = res.energy;
              cost = res.cost;
            }

            grandPeak += p;
            grandNonPeak += np;
            grandNight += n;
            grandTotal += t;
            
            pumpGrandPeak += pp;
            pumpGrandNonPeak += pnp;
            pumpGrandNight += pn;
            pumpGrandTotal += pt;

            grandEnergy += energy;
            grandCost += cost;

            dailyData.push({
              date: dateStr,
              day: i,
              peak: p,
              nonPeak: np,
              night: n,
              total: t,
              pumpPeak: pp,
              pumpNonPeak: pnp,
              pumpNight: pn,
              pumpTotal: pt,
              energy: energy,
              cost: cost
            });
          }

          const monthName = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

          const handleDownloadDayWise = () => {
            const csvRows = [];
            csvRows.push(['Date', 'Chiller Peak Hours', 'Chiller Non-Peak Hours', 'Chiller Night Hours', 'Chiller Total Hours', 'Pump Peak Hours', 'Pump Non-Peak Hours', 'Pump Night Hours', 'Pump Total Hours', 'Energy (kWh)', 'Cost (INR)']);
            dailyData.forEach(r => {
              csvRows.push([r.date, r.peak.toFixed(1), r.nonPeak.toFixed(1), r.night.toFixed(1), r.total.toFixed(1), r.pumpPeak.toFixed(1), r.pumpNonPeak.toFixed(1), r.pumpNight.toFixed(1), r.pumpTotal.toFixed(1), r.energy.toFixed(1), r.cost.toFixed(2)]);
            });
            csvRows.push(['Grand Total', grandPeak.toFixed(1), grandNonPeak.toFixed(1), grandNight.toFixed(1), grandTotal.toFixed(1), pumpGrandPeak.toFixed(1), pumpGrandNonPeak.toFixed(1), pumpGrandNight.toFixed(1), pumpGrandTotal.toFixed(1), grandEnergy.toFixed(1), grandCost.toFixed(2)]);
            
            const csvContent = csvRows.map(e => e.join(",")).join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Chiller_DayWise_${monthName.replace(/ /g, '_')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          };

          return (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)', marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: '0', fontSize: '1.2rem', fontWeight: 800 }}>📅 Day-wise Report: {monthName}</h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleDownloadDayWise} style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>
                      ⬇ Download CSV
                    </button>
                    <button onClick={() => setReportSelectedMonth(null)} style={{ padding: '6px 12px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}>
                      ← Back to Months
                    </button>
                  </div>
                </div>
                
                <h5 style={{ margin: '0 0 12px 0', fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>Chiller Operations</h5>
                <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #cbd5e1', color: '#64748b' }}>
                        <th style={{ padding: '12px 16px' }}>Date</th>
                        <th style={{ padding: '12px 16px' }}>Peak Hours</th>
                        <th style={{ padding: '12px 16px' }}>Non-Peak Hours</th>
                        <th style={{ padding: '12px 16px' }}>Night Hours</th>
                        <th style={{ padding: '12px 16px' }}>Total Hours</th>
                        <th style={{ padding: '12px 16px' }}>Energy (kWh)</th>
                        <th style={{ padding: '12px 16px' }}>Cost (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyData.map(row => (
                        <tr key={row.date} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 700 }}>{row.date}</td>
                          <td style={{ padding: '12px 16px', color: '#ef4444' }}>{row.peak.toFixed(1)}</td>
                          <td style={{ padding: '12px 16px', color: '#f59e0b' }}>{row.nonPeak.toFixed(1)}</td>
                          <td style={{ padding: '12px 16px', color: '#1d4ed8' }}>{row.night.toFixed(1)}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 800 }}>{row.total.toFixed(1)}</td>
                          <td style={{ padding: '12px 16px', color: '#f59e0b', fontWeight: 600 }}>{row.energy.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}</td>
                          <td style={{ padding: '12px 16px', color: '#16a34a', fontWeight: 700 }}>₹{row.cost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        </tr>
                      ))}
                      <tr style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 800 }}>Grand Total</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#ef4444' }}>{grandPeak.toFixed(1)}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#f59e0b' }}>{grandNonPeak.toFixed(1)}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1d4ed8' }}>{grandNight.toFixed(1)}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 900 }}>{grandTotal.toFixed(1)}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 800, color: '#f59e0b' }}>{grandEnergy.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 900, color: '#16a34a' }}>₹{grandCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h5 style={{ margin: '0 0 12px 0', fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>Pump Operations</h5>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #cbd5e1', color: '#64748b' }}>
                        <th style={{ padding: '12px 16px' }}>Date</th>
                        <th style={{ padding: '12px 16px' }}>Pump Peak Hours</th>
                        <th style={{ padding: '12px 16px' }}>Pump Non-Peak Hours</th>
                        <th style={{ padding: '12px 16px' }}>Pump Night Hours</th>
                        <th style={{ padding: '12px 16px' }}>Total Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyData.map(row => (
                        <tr key={row.date + '-pump'} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 700 }}>{row.date}</td>
                          <td style={{ padding: '12px 16px', color: '#ef4444' }}>{row.pumpPeak.toFixed(1)}</td>
                          <td style={{ padding: '12px 16px', color: '#f59e0b' }}>{row.pumpNonPeak.toFixed(1)}</td>
                          <td style={{ padding: '12px 16px', color: '#1d4ed8' }}>{row.pumpNight.toFixed(1)}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 800 }}>{row.pumpTotal.toFixed(1)}</td>
                        </tr>
                      ))}
                      <tr style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 800 }}>Grand Total</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#ef4444' }}>{pumpGrandPeak.toFixed(1)}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#f59e0b' }}>{pumpGrandNonPeak.toFixed(1)}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1d4ed8' }}>{pumpGrandNight.toFixed(1)}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 900 }}>{pumpGrandTotal.toFixed(1)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        }

        const monthlyData = {};
        operatingLogs.forEach(log => {
          if (!log.date) return;
          const monthKey = log.date.substring(0, 7); // YYYY-MM
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              month: monthKey,
              peak: 0,
              nonPeak: 0,
              night: 0,
              total: 0,
              energy: 0,
              cost: 0
            };
          }
          const p = (log.chillerPeakHours || 0) + (log.pumpPeakHours || 0);
          const np = (log.chillerNonPeakHours || 0) + (log.pumpNonPeakHours || 0);
          const n = (log.chillerNightHours || 0) + (log.pumpNightHours || 0);
          
          const res = calculateCostForOpLog(log);
          const energy = res.energy;
          const cost = res.cost;

          monthlyData[monthKey].peak += p;
          monthlyData[monthKey].nonPeak += np;
          monthlyData[monthKey].night += n;
          monthlyData[monthKey].total += p + np + n;
          monthlyData[monthKey].energy += energy;
          monthlyData[monthKey].cost += cost;
        });
        
        const sortedMonths = Object.values(monthlyData).sort((a, b) => b.month.localeCompare(a.month));

        const handleDownloadMonthly = () => {
          const csvRows = [];
          csvRows.push(['Month', 'Peak Hours', 'Non-Peak Hours', 'Night Hours', 'Total Hours', 'Energy (kWh)', 'Cost (INR)']);
          sortedMonths.forEach(r => {
            const d = new Date(r.month + '-01');
            const mName = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            csvRows.push([`${mName} (${d.getFullYear()})`, r.peak.toFixed(1), r.nonPeak.toFixed(1), r.night.toFixed(1), r.total.toFixed(1), r.energy.toFixed(1), r.cost.toFixed(2)]);
          });
          const csvContent = csvRows.map(e => e.join(",")).join("\n");
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `Chiller_Monthly_Report.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };

        return (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)', marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 800 }}>📅 Monthly Operating Hours Report</h4>
                  <p style={{ margin: '0', fontSize: '0.85rem', color: '#64748b' }}>Click on any month to view the detailed day-wise report.</p>
                </div>
                <button onClick={handleDownloadMonthly} style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>
                  ⬇ Download CSV
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #cbd5e1', color: '#64748b' }}>
                      <th style={{ padding: '12px 16px' }}>Month</th>
                      <th style={{ padding: '12px 16px' }}>Peak Hours</th>
                      <th style={{ padding: '12px 16px' }}>Non-Peak Hours</th>
                      <th style={{ padding: '12px 16px' }}>Night Hours</th>
                      <th style={{ padding: '12px 16px' }}>Total Hours</th>
                      <th style={{ padding: '12px 16px' }}>Energy (kWh)</th>
                      <th style={{ padding: '12px 16px' }}>Cost (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedMonths.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No data available</td>
                      </tr>
                    ) : sortedMonths.map(row => {
                      const d = new Date(row.month + '-01');
                      const monthName = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                      return (
                        <tr key={row.month} onClick={() => setReportSelectedMonth(row.month)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: '#4f46e5' }}>{monthName} ({d.getFullYear()})</td>
                          <td style={{ padding: '12px 16px', color: '#ef4444' }}>{row.peak.toFixed(1)}</td>
                          <td style={{ padding: '12px 16px', color: '#f59e0b' }}>{row.nonPeak.toFixed(1)}</td>
                          <td style={{ padding: '12px 16px', color: '#1d4ed8' }}>{row.night.toFixed(1)}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 800 }}>{row.total.toFixed(1)}</td>
                          <td style={{ padding: '12px 16px', color: '#f59e0b', fontWeight: 600 }}>{row.energy.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}</td>
                          <td style={{ padding: '12px 16px', color: '#16a34a', fontWeight: 700 }}>₹{row.cost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ---------------------------------------------------------------------------------- */}
      {/* TAB 2: TECHNICAL SPECIFICATIONS */}
      {/* ---------------------------------------------------------------------------------- */}
      {activeTab === 'specs' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          
          {/* Headline Specs Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #bfdbfe', borderRadius: '16px', padding: '20px' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🏢 Cooling Area Specs</div>
              <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#1e40af' }}>211,867.72 Sq. Ft.</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600 }}>Total central air-conditioned area coverage.</p>
            </div>
            
            <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '20px' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>❄️ Total Installed Terminals</div>
              <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#166534' }}>347 A/c Units</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>Chiller plant connected central terminals.</p>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '1px solid #fde047', borderRadius: '16px', padding: '20px' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>💨 Secondary Cooling Units</div>
              <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#92400e' }}>165 Standalone Split</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#d97706', fontWeight: 600 }}>Independent separate gas split units.</p>
            </div>
            
            <div style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)', border: '1px solid #e9d5ff', borderRadius: '16px', padding: '20px' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⚡ AHU Combined Power</div>
              <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#6b21a8' }}>804.5 Motor HP</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#a855f7', fontWeight: 600 }}>Combined Air Handling Unit motor horse power.</p>
            </div>
          </div>

          {/* Chiller & Pump Basic Specs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            {/* Chiller Details */}
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
              <div style={{ background: '#f8fafc', padding: '16px 20px', borderBottom: '1px solid #cbd5e1', fontWeight: 800, fontSize: '0.95rem' }}>
                ❄️ Chiller Specifications
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ color: '#64748b', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>Unit</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>Make</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>Capacity (TR)</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>Power (kW)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>Unit I</td>
                    <td style={{ padding: '12px 16px' }}>DAIKIN</td>
                    <td style={{ padding: '12px 16px', color: '#4f46e5', fontWeight: 700 }}>340 TR</td>
                    <td style={{ padding: '12px 16px', color: '#f59e0b', fontWeight: 600 }}>185 kW</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>Unit II</td>
                    <td style={{ padding: '12px 16px' }}>DAIKIN</td>
                    <td style={{ padding: '12px 16px', color: '#4f46e5', fontWeight: 700 }}>340 TR</td>
                    <td style={{ padding: '12px 16px', color: '#f59e0b', fontWeight: 600 }}>185 kW</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>Unit III</td>
                    <td style={{ padding: '12px 16px' }}>Dunham-Bush</td>
                    <td style={{ padding: '12px 16px', color: '#4f46e5', fontWeight: 700 }}>332 TR</td>
                    <td style={{ padding: '12px 16px', color: '#f59e0b', fontWeight: 600 }}>240 kW</td>
                  </tr>
                  <tr style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1' }}>
                    <td colSpan="2" style={{ padding: '12px 16px', fontWeight: 800, textAlign: 'right' }}>Total Installed</td>
                    <td style={{ padding: '12px 16px', color: '#16a34a', fontWeight: 800, fontSize: '1.1rem' }}>1,012 TR</td>
                    <td style={{ padding: '12px 16px', color: '#b91c1c', fontWeight: 800, fontSize: '1.1rem' }}>610 kW</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pump Details */}
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
              <div style={{ background: '#f8fafc', padding: '16px 20px', borderBottom: '1px solid #cbd5e1', fontWeight: 800, fontSize: '0.95rem' }}>
                💧 Pump Specifications
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ color: '#64748b', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>Pump Type</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>Motor Power (kW)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>Condenser Water Pump</td>
                    <td style={{ padding: '12px 16px', color: '#8b5cf6', fontWeight: 700 }}>74 kW</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>Chilled Water Pump</td>
                    <td style={{ padding: '12px 16px', color: '#8b5cf6', fontWeight: 700 }}>88 kW</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>Cooling Tower Motor</td>
                    <td style={{ padding: '12px 16px', color: '#8b5cf6', fontWeight: 700 }}>22 kW</td>
                  </tr>
                  <tr style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 800, textAlign: 'right' }}>Total Installed</td>
                    <td style={{ padding: '12px 16px', color: '#8b5cf6', fontWeight: 800, fontSize: '1.1rem' }}>184 kW</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Plant Knowledge Table */}
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', overflow: 'hidden', marginBottom: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
            <div style={{ background: '#f8fafc', padding: '16px 20px', borderBottom: '1px solid #cbd5e1', fontWeight: 800, fontSize: '0.95rem' }}>
              📋 Chiller Infrastructure Specifications & Parameters
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#fff', textAlign: 'left', borderBottom: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 20px' }}>Parameter Name</th>
                  <th style={{ padding: '12px 20px' }}>Value</th>
                  <th style={{ padding: '12px 20px' }}>Unit Type</th>
                  <th style={{ padding: '12px 20px' }}>Remarks / Function</th>
                </tr>
              </thead>
              <tbody>
                {plantSpecifications.map((spec, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #f1f5f9', background: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '12px 20px', fontWeight: 700 }}>{spec.parameter}</td>
                    <td style={{ padding: '12px 20px', fontWeight: 800, color: '#4f46e5', fontSize: '0.9rem' }}>{spec.value}</td>
                    <td style={{ padding: '12px 20px', color: '#475569' }}>{spec.unit}</td>
                    <td style={{ padding: '12px 20px', color: '#64748b', fontSize: '0.8rem' }}>{spec.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Unit-Wise Comparison Table */}
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
            <div style={{ background: '#f8fafc', padding: '16px 20px', borderBottom: '1px solid #cbd5e1', fontWeight: 800, fontSize: '0.95rem' }}>
              ⚙️ Unit-Wise Detailed Comparison Matrix
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#fff', textAlign: 'left', borderBottom: '2px solid #cbd5e1', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 20px' }}>Chiller Technical Parameter</th>
                    <th style={{ padding: '12px 20px', background: '#f8fafc' }}>Unit - I</th>
                    <th style={{ padding: '12px 20px' }}>Unit - II</th>
                    <th style={{ padding: '12px 20px', background: '#faf5ff', color: '#6b21a8' }}>Unit - III</th>
                  </tr>
                </thead>
                <tbody>
                  {unitSpecifications.map((row, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 20px', fontWeight: 700, color: '#334155' }}>{row.param}</td>
                      <td style={{ padding: '12px 20px', background: '#f8fafc', fontWeight: 600 }}>{row.unit1}</td>
                      <td style={{ padding: '12px 20px' }}>{row.unit2}</td>
                      <td style={{ padding: '12px 20px', background: '#faf5ff', fontWeight: 700, color: '#4f46e5' }}>{row.unit3}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}



      {/* ---------------------------------------------------------------------------------- */}
      {/* TAB 4: EQUIPMENT & MANPOWER */}
      {/* ---------------------------------------------------------------------------------- */}
      {activeTab === 'inventory' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            {equipments.map(eq => (
              <div key={eq.id} className="detail-inner-card" style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{eq.name}</h4>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{eq.model} • {eq.capacity}</div>
                  </div>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    padding: '3px 10px', 
                    borderRadius: '6px', 
                    fontWeight: 700, 
                    background: eq.status === 'Running' || eq.status === 'Active' ? '#dcfce7' : '#f1f5f9', 
                    color: eq.status === 'Running' || eq.status === 'Active' ? '#166534' : '#64748b' 
                  }}>
                    {eq.status}
                  </span>
                </div>

                {eq.load !== '0%' && eq.tempIn && eq.tempIn !== '-' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
                    <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Inlet Water</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0ea5e9', marginTop: 2 }}>{eq.tempIn}</div>
                    </div>
                    <div style={{ padding: '8px 12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                      <div style={{ fontSize: '0.65rem', color: '#166534', textTransform: 'uppercase', fontWeight: 700 }}>Outlet Water</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#166534', marginTop: 2 }}>{eq.tempOut}</div>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 12, fontSize: '0.75rem', color: '#475569', fontWeight: 600, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  <span>Refrigerant: <strong style={{ color: '#1e293b' }}>{eq.refrigerant}</strong></span>
                  <span>Type: <strong style={{ color: '#1e293b' }}>{eq.type}</strong></span>
                </div>

                <div style={{ borderTop: '1px solid #cbd5e1', marginTop: '16px', paddingTop: '12px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Last Service: <span style={{ fontWeight: 700, color: '#1e293b' }}>{eq.lastService}</span></div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: eq.health > 90 ? '#16a34a' : '#ea580c' }}>{eq.health}% HP (Health)</div>
                </div>
              </div>
            ))}
          </div>

          {/* Roster & Manpower */}
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '24px' }}>
            <h4 style={{ marginBottom: 20, color: '#0f172a', fontWeight: 800 }}>👥 Chiller Manpower & Shift Roster Directory</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              {staff.map(member => (
                <div key={member.id} style={{ display: 'flex', gap: 16, alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem', fontWeight: 800, color: '#475569', border: '2px solid #cbd5e1' }}>
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 850, color: '#0f172a' }}>{member.name}</h4>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{member.role} • {member.shift}</div>
                    <div style={{ borderTop: '1px dashed #cbd5e1', marginTop: '8px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#475569' }}>
                      <span>📅 Joined: <strong>{member.dateJoined}</strong></span>
                      <span>📞 WhatsApp: <strong style={{ color: '#0284c7' }}>{member.contact}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ---------------------------------------------------------------------------------- */}
      {/* TAB 5: TARIFF & COST CALCULATOR */}
      {/* ---------------------------------------------------------------------------------- */}
      {activeTab === 'billing' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          
          {/* Main simulator controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '32px', alignItems: 'flex-start' }}>
            
            {/* Control Panel Card */}
            <div style={{ flex: '1 1 300px', minWidth: 0, maxWidth: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🎛️ Operational Parameters</span>
                {isAuthorizedUnitHead && (
                  <button 
                    onClick={() => setIsEditingParams(!isEditingParams)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: isEditingParams ? '#10b981' : '#64748b' }}
                    title={isEditingParams ? "Save Parameters" : "Edit Parameters"}
                  >
                    {isEditingParams ? '💾' : '✎'}
                  </button>
                )}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.8rem' }}>
                
                <div>
                  <label style={{ fontWeight: 700, display: 'block' }}>Average Cooling Load (TR):</label>
                  <input type="number" value={avgCoolingLoadTr} onChange={e => updateAvgLoad(parseInt(e.target.value) || 0)} disabled={!isEditingParams} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', background: isEditingParams ? '#fff' : '#f8fafc', color: isEditingParams ? '#0f172a' : '#64748b', cursor: isEditingParams ? 'text' : 'not-allowed' }} />
                </div>

                {/* Tariff Rates Customizer */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <label style={{ fontWeight: 700, display: 'block', marginBottom: '8px' }}>Electricity Tariff Rates (₹ / Unit):</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', fontWeight: 600 }}>
                      Off-Peak Rate (10AM-6PM):
                      <input type="number" step="0.01" value={rateOffPeak} onChange={e => updateOffPeak(parseFloat(e.target.value) || 0)} disabled={!isEditingParams} style={{ width: '80px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right', background: isEditingParams ? '#fff' : '#f8fafc', color: isEditingParams ? '#0f172a' : '#64748b', cursor: isEditingParams ? 'text' : 'not-allowed' }} />
                    </label>
                    <label style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', fontWeight: 600 }}>
                      Peak Rate (6-10 AM/PM):
                      <input type="number" step="0.01" value={ratePeak} onChange={e => updatePeak(parseFloat(e.target.value) || 0)} disabled={!isEditingParams} style={{ width: '80px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right', background: isEditingParams ? '#fff' : '#f8fafc', color: isEditingParams ? '#0f172a' : '#64748b', cursor: isEditingParams ? 'text' : 'not-allowed' }} />
                    </label>
                    <label style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', fontWeight: 600 }}>
                      Night Rate (10PM-6AM):
                      <input type="number" step="0.01" value={rateNight} onChange={e => updateNight(parseFloat(e.target.value) || 0)} disabled={!isEditingParams} style={{ width: '80px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right', background: isEditingParams ? '#fff' : '#f8fafc', color: isEditingParams ? '#0f172a' : '#64748b', cursor: isEditingParams ? 'text' : 'not-allowed' }} />
                    </label>
                  </div>
                </div>

              </div>
            </div>

            {/* Calculations and Ledger Displays */}
            <div style={{ flex: '3 1 600px', minWidth: 0, maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Daily Operating Cost Breakdown */}
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
                <div style={{ background: '#f8fafc', padding: '16px 20px', borderBottom: '1px solid #cbd5e1', fontWeight: 800, fontSize: '0.95rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>📊 Unit-Wise Operational Ledger (kWh & ₹)</span>
                  <span style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '6px' }}>
                    Active Load: {combinedActivePower} kW
                  </span>
                </div>
                <div style={{ padding: '20px', overflowX: 'auto', maxWidth: '100%' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left', minWidth: '700px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #cbd5e1', color: '#64748b', fontWeight: 700 }}>
                        <th style={{ padding: '10px' }}>Item Name</th>
                        <th style={{ padding: '10px' }}>Power</th>
                        <th style={{ padding: '10px' }}>Hrs (P/NP/N)</th>
                        <th style={{ padding: '8px', color: '#ea580c' }}>Peak (kWh / ₹)</th>
                        <th style={{ padding: '8px', color: '#0369a1' }}>Non-Peak (kWh / ₹)</th>
                        <th style={{ padding: '8px', color: '#64748b' }}>Night (kWh / ₹)</th>
                        <th style={{ padding: '8px', fontWeight: 800, color: '#0f172a' }}>Total (kWh / ₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingData.rows.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 8px', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap' }}>{row.name}</td>
                          <td style={{ padding: '10px 8px', color: '#64748b', whiteSpace: 'nowrap' }}>{row.power} kW</td>
                          <td style={{ padding: '10px 8px', color: '#475569', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{row.peakHr} / {row.nonPeakHr} / {row.nightHr}</td>
                          
                          <td style={{ padding: '10px 8px', color: '#475569' }}>
                            {row.peakEnergy.toFixed(1)} <span style={{ color: '#cbd5e1', margin: '0 4px' }}>|</span> <span style={{ color: '#ea580c', fontWeight: 700 }}>₹{row.peakCost.toFixed(2)}</span>
                          </td>
                          
                          <td style={{ padding: '10px 8px', color: '#475569' }}>
                            {row.nonPeakEnergy.toFixed(1)} <span style={{ color: '#cbd5e1', margin: '0 4px' }}>|</span> <span style={{ color: '#0369a1', fontWeight: 700 }}>₹{row.nonPeakCost.toFixed(2)}</span>
                          </td>
                          
                          <td style={{ padding: '10px 8px', color: '#475569' }}>
                            {row.nightEnergy.toFixed(1)} <span style={{ color: '#cbd5e1', margin: '0 4px' }}>|</span> <span style={{ color: '#64748b', fontWeight: 700 }}>₹{row.nightCost.toFixed(2)}</span>
                          </td>
                          
                          <td style={{ padding: '10px 8px', color: '#475569' }}>
                            <span style={{ color: '#0f172a', fontWeight: 600 }}>{row.totalEnergy.toFixed(1)}</span> <span style={{ color: '#cbd5e1', margin: '0 4px' }}>|</span> <span style={{ color: '#16a34a', fontWeight: 800 }}>₹{row.totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                          </td>
                        </tr>
                      ))}
                      
                      <tr style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>Grand Totals</td>
                        <td style={{ padding: '12px 8px', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap' }}>{billingData.rows.reduce((acc, r) => acc + r.power, 0)} kW</td>
                        <td style={{ padding: '12px 8px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>-</td>
                        
                        <td style={{ padding: '12px 8px', color: '#475569', fontWeight: 600 }}>
                          {billingData.grandTotal.peakEnergy.toFixed(1)} <span style={{ color: '#cbd5e1', margin: '0 4px' }}>|</span> <span style={{ color: '#ea580c', fontWeight: 800 }}>₹{billingData.grandTotal.peakCost.toFixed(2)}</span>
                        </td>
                        
                        <td style={{ padding: '12px 8px', color: '#475569', fontWeight: 600 }}>
                          {billingData.grandTotal.nonPeakEnergy.toFixed(1)} <span style={{ color: '#cbd5e1', margin: '0 4px' }}>|</span> <span style={{ color: '#0369a1', fontWeight: 800 }}>₹{billingData.grandTotal.nonPeakCost.toFixed(2)}</span>
                        </td>
                        
                        <td style={{ padding: '12px 8px', color: '#475569', fontWeight: 600 }}>
                          {billingData.grandTotal.nightEnergy.toFixed(1)} <span style={{ color: '#cbd5e1', margin: '0 4px' }}>|</span> <span style={{ color: '#475569', fontWeight: 800 }}>₹{billingData.grandTotal.nightCost.toFixed(2)}</span>
                        </td>
                        
                        <td style={{ padding: '12px 8px', color: '#0f172a', fontWeight: 800 }}>
                          {grandTotalEnergy.toFixed(1)} <span style={{ color: '#cbd5e1', margin: '0 4px' }}>|</span> <span style={{ color: '#16a34a', fontWeight: 900 }}>₹{grandTotalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dynamic Hourly and Monthly Cost Ratios */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                
                {/* Cost / TR Panel */}
                <div style={{ flex: '1 1 300px', minWidth: 0, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>📐 Operating Cost per TR</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '6px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Peak Hours (6-10):</span>
                      <strong style={{ fontSize: '0.85rem', color: '#b91c1c' }}>₹ {peakCostPerTr.toFixed(2)} / TR</strong>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Non-Peak Hours (10-6):</span>
                      <strong style={{ fontSize: '0.85rem', color: '#16a34a' }}>₹ {nonPeakCostPerTr.toFixed(2)} / TR</strong>
                    </div>
                  </div>
                </div>

                {/* Monthly Projection */}
                <div style={{ flex: '1 1 300px', minWidth: 0, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>🗓️ Monthly Projected Billing</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '6px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Energy (30 Days):</span>
                      <strong style={{ fontSize: '0.85rem', color: '#4f46e5' }}>{(grandTotalEnergy * 30).toLocaleString()} kWh</strong>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Billing (30 Days):</span>
                      <strong style={{ fontSize: '0.9rem', color: '#16a34a' }}>₹ {(grandTotalCost * 30).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</strong>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* Split AC Tab */}
      {activeTab === 'split' && (
        <SplitACTable splitAcData={splitAcData} vrvData={vrvData} coldRoomData={coldRoomData} />
      )}
      
      {/* AHU Units Tab */}

      {activeTab === 'ahu' && (
        <AHUUnitsTable ahuData={ahuData} />
      )}

      {/* Chiller Details Modal */}
    </div>
  );
}
