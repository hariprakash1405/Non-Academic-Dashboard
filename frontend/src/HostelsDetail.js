import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const hostelDaily = [];

const facilityRatings = [
  { category: 'Cleanliness', score: 4.5 },
  { category: 'Wi-Fi', score: 3.8 },
  { category: 'Food Quality', score: 4.2 },
  { category: 'Water Supply', score: 4.7 },
  { category: 'Power Backup', score: 4.6 },
];

const hostelBlocks = {
  boys: [],
  girls: []
};

const facilityCompliance = [
  { name: 'Electricity', value: 25, color: '#f59e0b' },
  { name: 'Water Supply', value: 18, color: '#0ea5e9' },
  { name: 'Housekeeping', value: 30, color: '#10b981' },
  { name: 'Maintenance', value: 15, color: '#6366f1' },
  { name: 'Internet/Wi-Fi', value: 12, color: '#8b5cf6' },
];

const blockStaffData = {
  'Block A (UG)': { warden: 'Mr. Rajesh K.', supportStaff: 12, contact: '+91 98765 43220', cabin: 'A-001' },
  'Block B (UG)': { warden: 'Mr. Murali M.', supportStaff: 10, contact: '+91 98765 43221', cabin: 'B-001' },
  'Block C (PG)': { warden: 'Dr. Anand S.', supportStaff: 8, contact: '+91 98765 43222', cabin: 'C-101' },
  'Block D (Research)': { warden: 'Mr. Vinoth R.', supportStaff: 5, contact: '+91 98765 43223', cabin: 'D-005' },
  'Lily Block (UG)': { warden: 'Ms. Priya S.', supportStaff: 14, contact: '+91 98765 43224', cabin: 'L-001' },
  'Rose Block (UG)': { warden: 'Ms. Anitha G.', supportStaff: 12, contact: '+91 98765 43225', cabin: 'R-001' },
  'PG Orchid': { warden: 'Dr. Kavitha L.', supportStaff: 6, contact: '+91 98765 43226', cabin: 'P-101' },
  'Staff Quarters': { warden: 'Ms. Meena J.', supportStaff: 4, contact: '+91 98765 43227', cabin: 'S-001' },
};

const disciplinaryIncidents = [];

const maintenanceRegistry = [];

const blockFeedback = {};

const mockResidents = [];

const blockDailyUsage = {};

export default function HostelsDetail({ currentUser }) {
  // Only the Hostel Unit Head (not admin/dean) may add, rename, or delete blocks
  const isHostelUnitHead =
    currentUser?.role === 'unit_head' && currentUser?.unitName === 'Hostels';
  const [activeTab, setActiveTab] = React.useState('boys');
  const [dashboardDate, setDashboardDate] = React.useState('Today');
  const [selectedBlock, setSelectedBlock] = React.useState(null);
  const [showIncidents, setShowIncidents] = React.useState(false);
  const [showComplaints, setShowComplaints] = React.useState(false);
  const [submittedValues, setSubmittedValues] = useState({});
  const [backendData, setBackendData] = useState(null);
  const [dashboardGraphBlock, setDashboardGraphBlock] = React.useState('all');
  const [dashboardGraphMonth, setDashboardGraphMonth] = React.useState('all');
  const [filterBlock, setFilterBlock] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    block: '',
    unitNo: '',
    type: 'Electricity',
    desc: '',
    priority: 'Medium',
    assignedHead: '',
    status: 'Ongoing'
  });
  const [trendType, setTrendType] = useState('day');
  
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState({ oldName: '', newName: '' });
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState('');

  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [rosterFilter, setRosterFilter] = useState('none'); // 'none', 'all', 'warden', 'support'
  const [showRoster, setShowRoster] = useState(false);
  const [viewingRosterForBlock, setViewingRosterForBlock] = useState(null);
  const [viewingAbsentListForBlock, setViewingAbsentListForBlock] = useState(null);
  const [viewingAbsentListForAll, setViewingAbsentListForAll] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newBlockForm, setNewBlockForm] = useState({
    name: '',
    beds: 100,
    occupied: 0,
    type: 'UG',
    gender: 'boys',
    staffCount: 5,
    remarks: '',
    wardenName: '',
    wardenPhone: '',
    numFloors: 0,
    totalRooms: 0,
    chiefWardenCount: 0,
    deputyWardenCount: 0,
    seniorCaretakerCount: 0,
    caretakerCount: 0,
    careTakerAttenderCount: 0,
    houseKeeperCount: 0,
    bathroomCleanerCount: 0,
    securityCount: 0,
    maintenanceRoomsBeds: 0,
    allocatedCapacity: 0,
    waterCoolersCount: 0,
    bathroomsPerFloor: 0.0,
    toiletsPerFloor: 0.0,
    solarHeaterCapacity: '',
    wifiAccessPoints: 0,
    cctvCameras: 0,
    commonRoom: '',
    readingRoom: '',
    parentWaitingRoom: ''
  });

  useEffect(() => {
    const fetchBackend = async () => {
      try {
        const res = await fetch('/api/hostels');
        if (res.ok) {
          const data = await res.json();
          setBackendData(data);
        }
      } catch (e) {
        console.warn('Backend not reachable, using local data/storage.');
      }
    };

    const loadData = () => {
      try {
        const raw = localStorage.getItem('unit-form:Hostels');
        if (raw) {
          const parsed = JSON.parse(raw);
          setSubmittedValues(parsed.values || {});
        }
      } catch (e) {
        console.error('Error loading hostel data:', e);
      }
      fetchBackend();
    };

    fetchBackend();
    loadData();
    window.addEventListener('unit-form-updated', loadData);
    
    const openRaiseModal = () => {
      setShowComplaints(true);
      setShowRaiseModal(true);
    };
    window.addEventListener('open-raise-complaint-modal', openRaiseModal);

    return () => {
      window.removeEventListener('unit-form-updated', loadData);
      window.removeEventListener('open-raise-complaint-modal', openRaiseModal);
    };
  }, []);

  const isAll = activeTab === 'all';

  const blocks = backendData?.blocks
    ? (isAll ? backendData.blocks : backendData.blocks.filter(b => b.gender === activeTab))
    : (isAll ? [...hostelBlocks.boys, ...hostelBlocks.girls] : hostelBlocks[activeTab]);

  const targetDateStr = React.useMemo(() => {
    if (dashboardDate === 'Today') return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const [y, m, d] = dashboardDate.split('-');
    const localDate = new Date(y, m - 1, d);
    return localDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  }, [dashboardDate]);

  const totalBeds = blocks.reduce((sum, b) => sum + b.beds, 0);
  let totalOccupied = blocks.reduce((sum, b) => sum + b.occupied, 0);
  const totalAbsentUnexcused = blocks.reduce((sum, b) => {
    const filteredAbsents = (b.absentList || []).filter(a => a.date === targetDateStr);
    return sum + filteredAbsents.length;
  }, 0);

  // Additional aggregate statistics for infrastructure and facilities
  const totalRooms = blocks.reduce((sum, b) => sum + (b.totalRooms || 0), 0);
  const totalWifiCount = blocks.reduce((sum, b) => sum + (b.wifiAccessPoints || 0), 0);
  const totalRoCount = blocks.reduce((sum, b) => sum + (b.waterCoolersCount || 0), 0);
  const totalBathrooms = blocks.reduce((sum, b) => sum + ((b.bathroomsPerFloor || 0) * (b.numFloors || 0)), 0);
  const totalToilets = blocks.reduce((sum, b) => sum + ((b.toiletsPerFloor || 0) * (b.numFloors || 0)), 0);
  const totalCCTV = blocks.reduce((sum, b) => sum + (b.cctvCameras || 0), 0);
  const totalWardens = blocks.reduce((sum, b) => sum + (b.wardens || []).filter(w => w.role && w.role.toLowerCase().includes('warden')).length, 0);
  const totalSupportStaff = blocks.reduce((sum, b) => sum + (b.wardens || []).filter(w => w.role && !w.role.toLowerCase().includes('warden')).length, 0);

  // totalOccupied comes directly from the database block data (no overrides)

  const todayBlockUsages = blocks.map(block => {
    const usages = backendData?.dailyUsage?.[block.name] || [];
    let d = usages.find(u => u.date === targetDateStr);
    if (!d && dashboardDate === 'Today') {
       d = usages[usages.length - 1] || { water: 0, power: 0 };
    }
    if (!d) d = { water: 0, power: 0 };
    
    // Merge block-specific drafts
    let waterVal = d.water;
    let powerVal = d.power;
    const draftWater = submittedValues[`${block.name}_water`];
    const draftPower = submittedValues[`${block.name}_electricity`];
    if (draftWater !== undefined && !isNaN(parseFloat(draftWater))) {
      waterVal = parseFloat(draftWater);
    }
    if (draftPower !== undefined && !isNaN(parseFloat(draftPower))) {
      powerVal = parseFloat(draftPower);
    }

    return { water: waterVal, power: powerVal };
  });

  const totalWaterToday = todayBlockUsages.reduce((sum, u) => sum + (u.water || 0), 0);
  const totalPowerToday = todayBlockUsages.reduce((sum, u) => sum + (u.power || 0), 0);

  const avgWater = blocks.length > 0 ? (totalWaterToday / blocks.length) : 0;
  const avgPower = blocks.length > 0 ? (totalPowerToday / blocks.length) : 0;

  // Active block names in current tab
  const activeBlockNames = new Set(blocks.map(b => b.name));

  // Get all active complaints
  const allComplaints = (backendData?.maintenance || []).filter(c => {
    return activeBlockNames.has(c.block);
  });

  // Extract unique dates for dropdown
  const uniqueDates = Array.from(new Set(allComplaints.map(c => c.date).filter(Boolean))).sort();

  // Filtered complaints for the dashboard registry
  const filteredComplaints = allComplaints.filter(c => {
    if (filterBlock !== 'all' && c.block !== filterBlock) return false;
    if (filterCategory !== 'all' && c.type !== filterCategory) return false;
    if (filterStatus !== 'all') {
      const matchStatus = (filterStatus === 'Ongoing' && (c.status === 'Ongoing' || c.status === 'Open')) || c.status === filterStatus;
      if (!matchStatus) return false;
    }
    if (filterDate !== 'all' && c.date !== filterDate) return false;
    return true;
  });

  // Overview statistics
  const totalAllComplaints = allComplaints.length;
  const ongoingAll = allComplaints.filter(c => c.status === 'Ongoing' || c.status === 'Open').length;
  const resolvedAll = allComplaints.filter(c => c.status === 'Resolved').length;
  const pendingAll = allComplaints.filter(c => c.status === 'Pending').length;

  const resolutionRate = totalAllComplaints > 0 ? (resolvedAll / totalAllComplaints) * 100 : 0;

  // Problematic Sector / Category
  const dbCategories = Array.from(new Set(allComplaints.map(c => c.type).filter(Boolean)));
  const categories = Array.from(new Set([...["Electricity", "Water Supply", "Housekeeping", "Maintenance", "Internet/Wi-Fi"], ...dbCategories]));
  const categoryColors = {
    "Electricity": "#f59e0b",
    "Water Supply": "#0ea5e9",
    "Housekeeping": "#10b981",
    "Maintenance": "#6366f1",
    "Internet/Wi-Fi": "#8b5cf6"
  };

  let highestCategory = "N/A";
  let maxCount = 0;
  categories.forEach(cat => {
    const count = allComplaints.filter(c => c.type === cat).length;
    if (count > maxCount) {
      maxCount = count;
      highestCategory = cat;
    }
  });
  const highestCategoryPercentage = (totalAllComplaints > 0 && maxCount > 0) ? (maxCount / totalAllComplaints) * 100 : 0;

  // Average Resolution TAT parsing
  let totalHours = 0;
  let parsedCount = 0;
  allComplaints.forEach(c => {
    if (c.tat) {
      const match = c.tat.match(/(\d+)\s*(hour|day)/i);
      if (match) {
        const val = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        if (unit.startsWith('day')) {
          totalHours += val * 24;
        } else {
          totalHours += val;
        }
        parsedCount++;
      }
    }
  });
  const avgTatHours = parsedCount > 0 ? (totalHours / parsedCount) : 0;
  const avgTatString = avgTatHours >= 24 
    ? `${(avgTatHours / 24).toFixed(1)} Days`
    : (avgTatHours > 0 ? `${Math.round(avgTatHours)} Hours` : "12 Hours");

  // Dynamic Sector breakdown
  const facilityCompliance = categories.map(cat => {
    const count = allComplaints.filter(c => c.type === cat).length;
    const percentage = totalAllComplaints > 0 ? (count / totalAllComplaints) * 100 : 0;
    
    const ongoing = allComplaints.filter(c => c.type === cat && (c.status === 'Ongoing' || c.status === 'Open')).length;
    const resolved = allComplaints.filter(c => c.type === cat && c.status === 'Resolved').length;
    const pending = allComplaints.filter(c => c.type === cat && c.status === 'Pending').length;

    return {
      name: cat,
      value: count,
      percentage: percentage,
      color: categoryColors[cat] || "#64748b",
      statusSummary: `${resolved} Resolved, ${ongoing} Ongoing, ${pending} Pending`
    };
  });

  // Day-wise / Month-wise Trends
  const dayTrendMap = {};
  allComplaints.forEach(c => {
    if (c.date) {
      if (!dayTrendMap[c.date]) dayTrendMap[c.date] = { name: c.date, count: 0 };
      dayTrendMap[c.date].count++;
    }
  });
  const dayTrendData = Object.values(dayTrendMap).sort((a, b) => a.name.localeCompare(b.name));

  const monthTrendMap = {};
  allComplaints.forEach(c => {
    if (c.date) {
      const parts = c.date.split(' ');
      const month = parts.length > 1 ? parts[1] : "May";
      if (!monthTrendMap[month]) monthTrendMap[month] = { name: month, count: 0 };
      monthTrendMap[month].count++;
    }
  });
  const monthTrendData = Object.values(monthTrendMap);

  const trendData = trendType === 'day' ? dayTrendData : monthTrendData;

  const availableUsageMonths = useMemo(() => {
    const months = new Set();
    if (backendData?.dailyUsage) {
      Object.values(backendData.dailyUsage).forEach(usages => {
        usages.forEach(u => {
          if (u.date) {
            const parts = u.date.split(' ');
            if (parts.length > 1) {
              months.add(parts.slice(1).join(' '));
            }
          }
        });
      });
    }
    return Array.from(months).sort((a, b) => new Date(`1 ${b}`) - new Date(`1 ${a}`));
  }, [backendData]);

  const getDailyData = () => {
    let data = [];
    const targetBlock = selectedBlock || (dashboardGraphBlock !== 'all' ? dashboardGraphBlock : null);

    if (targetBlock) {
      const rawData = backendData?.dailyUsage?.[targetBlock] || [];
      // Deep copy to avoid mutating original state
      data = rawData.map(item => ({ ...item }));

      if (dashboardGraphMonth !== 'all') {
        data = data.filter(d => d.date && d.date.includes(dashboardGraphMonth));
      }

      // Merge block-specific drafts
      const draftWater = submittedValues[`${targetBlock}_water`];
      const draftPower = submittedValues[`${targetBlock}_electricity`];
      
      const lastIdx = data.length - 1;
      if (lastIdx >= 0) {
        const waterVal = parseFloat(draftWater);
        const powerVal = parseFloat(draftPower);
        if (!isNaN(waterVal)) data[lastIdx].water = waterVal;
        if (!isNaN(powerVal)) data[lastIdx].power = powerVal;
      }
    } else {
      if (backendData?.dailyUsage) {
        const aggregated = {};
        Object.entries(backendData.dailyUsage).forEach(([bName, usageArr]) => {
          const bGender = blocks.find(b => b.name === bName)?.gender;
          if (!isAll && bGender !== activeTab) return;

          usageArr.forEach(d => {
            if (dashboardGraphMonth !== 'all' && (!d.date || !d.date.includes(dashboardGraphMonth))) return;

            if (!aggregated[d.date]) aggregated[d.date] = { date: d.date, water: 0, power: 0 };
            
            let waterVal = d.water;
            let powerVal = d.power;

            // Apply draft override for the latest day if present
            const isLatest = d === usageArr[usageArr.length - 1];
            if (isLatest) {
              const draftWater = submittedValues[`${bName}_water`];
              const draftPower = submittedValues[`${bName}_electricity`];
              if (draftWater !== undefined && !isNaN(parseFloat(draftWater))) {
                waterVal = parseFloat(draftWater);
              }
              if (draftPower !== undefined && !isNaN(parseFloat(draftPower))) {
                powerVal = parseFloat(draftPower);
              }
            }

            aggregated[d.date].water += waterVal;
            aggregated[d.date].power += powerVal;
          });
        });
        data = Object.values(aggregated).sort((a, b) => a.date.localeCompare(b.date));
      }
    }
    return data;
  };

  const chartData = getDailyData();

  const handleBlockClick = (blockName) => {
    setSelectedBlock(blockName);
  };

  const renderDashboard = () => {
    if (showComplaints) {
      return (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <button 
              onClick={() => setShowComplaints(false)}
              style={{ background: '#f1f5f9', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h2 style={{ margin: 0, color: '#0f172a' }}>🔧 Maintenance Diagnostics & Analytics</h2>
              <p style={{ margin: 0, color: '#64748b' }}>Real-time sector breakdown, status summaries, and operational TAT diagnostics</p>
            </div>
            {isHostelUnitHead && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                <button 
                  id="btn-raise-complaint"
                  onClick={() => {
                    const defaultBlock = filterBlock !== 'all' ? filterBlock : (blocks[0]?.name || '');
                    setNewComplaint(prev => ({ ...prev, block: defaultBlock }));
                    setShowRaiseModal(true);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  ?? Raise Complaint
                </button>
              </div>
            )}
          </div>
          <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '28px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
          {/* Filtering Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #f1f5f9' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'flex', flexDirection: 'column', gap: 6 }}>
              Block Filter:
              <select 
                value={filterBlock} 
                onChange={e => setFilterBlock(e.target.value)} 
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.8rem', fontWeight: 600 }}
              >
                <option value="all">All Blocks</option>
                {blocks.map(b => (
                  <option key={b.name} value={b.name}>{b.name}</option>
                ))}
              </select>
            </label>

            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'flex', flexDirection: 'column', gap: 6 }}>
              Category Filter:
              <select 
                value={filterCategory} 
                onChange={e => setFilterCategory(e.target.value)} 
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.8rem', fontWeight: 600 }}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </label>

            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'flex', flexDirection: 'column', gap: 6 }}>
              Status Filter:
              <select 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value)} 
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.8rem', fontWeight: 600 }}
              >
                <option value="all">All Statuses</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Pending">Pending</option>
                <option value="Resolved">Resolved</option>
              </select>
            </label>

            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'flex', flexDirection: 'column', gap: 6 }}>
              Date Filter:
              <select 
                value={filterDate} 
                onChange={e => setFilterDate(e.target.value)} 
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.8rem', fontWeight: 600 }}
              >
                <option value="all">All Dates</option>
                {uniqueDates.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Dynamic Statistics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', borderRadius: '12px', background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
              <div style={{ fontSize: '0.75rem', color: '#6d28d9', fontWeight: 700, textTransform: 'uppercase' }}>Total Complaints</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#4c1d95', margin: '4px 0' }}>{totalAllComplaints}</div>
              <div style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600 }}>{resolutionRate.toFixed(1)}% Resolution Rate</div>
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
              <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 700, textTransform: 'uppercase' }}>Status Overview</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#065f46', margin: '8px 0' }}>
                {resolvedAll} Res • {ongoingAll} Ong • {pendingAll} Pen
              </div>
              <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>Resolved complaints: {resolvedAll} of {totalAllComplaints}</div>
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 700, textTransform: 'uppercase' }}>Average Resolution TAT</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e40af', margin: '4px 0' }}>{avgTatString}</div>
              <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>Arithmetical average from active tickets</div>
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', background: '#fffbeb', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 700, textTransform: 'uppercase' }}>Critical Sector</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#92400e', margin: '6px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{highestCategory}</div>
              <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>{highestCategoryPercentage.toFixed(1)}% of total filings</div>
            </div>
          </div>

          {/* Donut Chart & Category Breakdown Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#334155', fontSize: '0.9rem', width: '100%', textAlign: 'left' }}>Complaint Share by Sector</h4>
              {totalAllComplaints > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={facilityCompliance.filter(c => c.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {facilityCompliance.filter(c => c.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} Tickets`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No complaints filed yet</div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
              <h4 style={{ margin: '0 0 4px 0', color: '#334155', fontSize: '0.9rem' }}>Sector-wise Breakdown Details</h4>
              {facilityCompliance.map(item => (
                <div 
                  key={item.name} 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 4, 
                    padding: '10px 14px', 
                    background: '#f8fafc', 
                    borderRadius: '8px', 
                    borderLeft: `4px solid ${item.color}`, 
                    border: '1px solid #f1f5f9', 
                    borderLeftWidth: '4px' 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>{item.name}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: item.color }}>{item.value} complaints ({item.percentage.toFixed(1)}%)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                    <span>Status summary:</span>
                    <span style={{ fontWeight: 600 }}>{item.statusSummary}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Day/Month Trends Chart */}
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9', marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: 12 }}>
              <h4 style={{ margin: 0, color: '#334155', fontSize: '0.9rem' }}>📈 Complaint Analytics & Time Trends</h4>
              <div style={{ display: 'flex', background: '#cbd5e1', padding: '2px', borderRadius: '6px' }}>
                <button 
                  onClick={() => setTrendType('day')} 
                  style={{ border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700', background: trendType === 'day' ? '#fff' : 'transparent', color: trendType === 'day' ? '#334155' : '#64748b' }}
                >
                  Day-wise
                </button>
                <button 
                  onClick={() => setTrendType('month')} 
                  style={{ border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700', background: trendType === 'month' ? '#fff' : 'transparent', color: trendType === 'month' ? '#334155' : '#64748b' }}
                >
                  Monthly
                </button>
              </div>
            </div>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} activeDot={{ r: 6 }} name="Filings count" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No trend data available</div>
            )}
          </div>

          {/* Filtered Registry Table */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>Active Complaints Registry</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Showing {filteredComplaints.length} of {totalAllComplaints} tickets</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#fff', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 16px' }}>Ticket ID</th>
                    <th style={{ padding: '12px 16px' }}>Block</th>
                    <th style={{ padding: '12px 16px' }}>Type/Category</th>
                    <th style={{ padding: '12px 16px' }}>Description</th>
                    <th style={{ padding: '12px 16px' }}>Date Filed</th>
                    <th style={{ padding: '12px 16px' }}>Resolution TAT</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    {isHostelUnitHead && <th style={{ padding: '12px 16px' }}>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredComplaints.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9', background: '#fff' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#6366f1' }}>{t.id}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{t.block}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', background: '#f1f5f9', fontWeight: 600, color: categoryColors[t.type] || '#475569' }}>
                          {t.type}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.desc}>
                        {t.desc || 'No description provided'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>{t.date || 'N/A'}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#334155' }}>{t.tat || 'Pending'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: t.status === 'Resolved' ? '#dcfce7' : ((t.status === 'Ongoing' || t.status === 'Open') ? '#fee2e2' : '#fef3c7'),
                          color: t.status === 'Resolved' ? '#15803d' : ((t.status === 'Ongoing' || t.status === 'Open') ? '#b91c1c' : '#b45309')
                        }}>{t.status === 'Open' ? 'Ongoing' : t.status}</span>
                      </td>
                      {isHostelUnitHead && (
                        <td style={{ padding: '12px 16px' }}>
                          <select 
                            value={t.status === 'Open' ? 'Ongoing' : t.status}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              try {
                                const res = await fetch('/api/hostels/update-complaint-status', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: t.id, status: newStatus })
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  setBackendData(prev => ({ ...prev, blocks: data }));
                                  alert(`Ticket ${t.id} status updated to ${newStatus}!`);
                                }
                              } catch (err) {
                                alert('Failed to update ticket status');
                              }
                            }}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            <option value="Ongoing">Ongoing</option>
                            <option value="Pending">Pending</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        </td>
                      )}
                    </tr>
                  ))}
                  {filteredComplaints.length === 0 && (
                    <tr>
                      <td colSpan={isHostelUnitHead ? 8 : 7} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                        No complaints match the current filter selection.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>


          </div>
        </div>
      );
    }
    
    return (

    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2 style={{ margin: 0, color: '#0f172a' }}>Hostels Management</h2>
          <input 
            type="date"
            value={dashboardDate === 'Today' ? new Date().toISOString().split('T')[0] : dashboardDate}
            onChange={(e) => {
              const todayStr = new Date().toISOString().split('T')[0];
              if (e.target.value === todayStr || !e.target.value) {
                setDashboardDate('Today');
              } else {
                setDashboardDate(e.target.value);
              }
            }}
            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '600', background: '#fff', color: '#334155', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
          />

        </div>
        <div className="tab-container-responsive" style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
          {['boys', 'girls', 'all'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setDashboardGraphBlock('all');
                setFilterBlock('all');
                setFilterCategory('all');
                setFilterStatus('all');
                setFilterDate('all');
              }}
              style={{
                padding: '8px 24px',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 700,
                textTransform: 'capitalize',
                background: activeTab === tab ? '#fff' : 'transparent',
                color: activeTab === tab ? '#1e293b' : '#64748b',
                boxShadow: activeTab === tab ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {tab === 'all' ? 'All Units' : `${tab} Hostel`}
            </button>
          ))}
        </div>
      </div>

      <div className="detail-kpi-row">
        <div className="detail-kpi-card" style={{ borderLeft: `4px solid ${activeTab === 'boys' ? '#1976d2' : '#d81b60'}` }}>
          <div className="kpi-label">Current Occupancy</div>
          <div className="kpi-value">{totalOccupied}</div>
          <div className="kpi-label">{totalBeds} Total Beds</div>
        </div>
        <div className="detail-kpi-card" style={{ borderLeft: '4px solid #0ea5e9' }}>
          <div className="kpi-label">Average Water Usage</div>
          <div className="kpi-value">{avgWater.toFixed(2)} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>KL/unit</span></div>
          <div className="kpi-label">Total: {totalWaterToday.toFixed(1)} KL across {blocks.length} blocks</div>
        </div>
        <div className="detail-kpi-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="kpi-label">Average Power Usage</div>
          <div className="kpi-value">{avgPower.toFixed(2)} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>kWh/unit</span></div>
          <div className="kpi-label">Total: {totalPowerToday.toFixed(1)} kWh across {blocks.length} blocks</div>
        </div>
        <div
          className="detail-kpi-card"
          onClick={() => setShowComplaints(true)}
          style={{ cursor: 'pointer', border: '1px solid #e2e8f0', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="kpi-label" style={{ marginBottom: 0 }}>Maint. Complaints</div>
            <span style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 600 }}>View All ➔</span>
          </div>
          <div className="kpi-value">{totalAllComplaints}</div>
          <div className="kpi-label">{ongoingAll} Ongoing • TAT: {avgTatString}</div>
        </div>
        <div 
          className="detail-kpi-card" 
          onClick={() => setViewingAbsentListForAll(true)}
          style={{ cursor: 'pointer', borderLeft: '4px solid #ef4444', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#dc2626'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
        >
          <div className="kpi-label">Absent (Unexcused)</div>
          <div className="kpi-value">{totalAbsentUnexcused}</div>
          <div className="kpi-label">Across {blocks.length} blocks</div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '28px', marginBottom: '36px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 24px 0', color: '#1e293b', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          🏢 Infrastructure & Facilities Overview <span style={{fontSize: '0.85rem', color: '#64748b', fontWeight: 600, background: '#f1f5f9', padding: '4px 12px', borderRadius: '20px', marginLeft: '8px'}}>{activeTab === 'all' ? 'All Units' : `${activeTab} Hostel`}</span>
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Rooms</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#334155' }}>{totalRooms}</div>
          </div>
          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Beds</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#334155' }}>{totalBeds}</div>
          </div>
          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Wi-Fi Access Points</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#334155' }}>{totalWifiCount}</div>
          </div>
          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>RO / Water Points</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#334155' }}>{totalRoCount}</div>
          </div>
          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bathrooms</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#334155' }}>{totalBathrooms}</div>
          </div>
          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Toilets</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#334155' }}>{totalToilets}</div>
          </div>
          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>CCTV Cameras</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#334155' }}>{totalCCTV}</div>
          </div>
          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Wardens</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#334155' }}>{totalWardens}</div>
          </div>
          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Support Staff</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#334155' }}>{totalSupportStaff}</div>
          </div>
        </div>
      </div>


      <div style={{ marginTop: 32 }}>
        <h4 style={{ marginBottom: 16 }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Hostel Block Breakdown</h4>
        <div className="responsive-grid">
          {blocks.map(block => (
            <div
              key={block.name}
              className="detail-inner-card"
              onClick={() => handleBlockClick(block.name)}
              style={{ cursor: 'pointer', border: '1px solid #f1f5f9', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#f1f5f9'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>{block.name}</h4>
                    {isHostelUnitHead && (
                    <button
                      title="Rename Block"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameTarget({ oldName: block.name, newName: block.name });
                        setShowRenameModal(true);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#3b82f6'}
                      onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                    >
                      ✏️
                    </button>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{block.type}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>{Math.round((block.occupied / block.beds) * 100)}%</div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Occupancy</div>
                </div>
              </div>

              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ height: '100%', width: `${(block.occupied / block.beds) * 100}%`, background: activeTab === 'girls' ? '#ec4899' : '#3b82f6' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Beds</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{block.beds}</div>
                </div>
                <div style={{ padding: '8px', background: '#f0fdf4', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#166534' }}>People</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{block.occupied}</div>
                </div>
              </div>

              {/* Attendance Monitor */}
              <div style={{ marginTop: 12, padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  🕒 Evening Biometric Attendance
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                  <div 
                    style={{ padding: '6px', background: '#fef2f2', borderRadius: '4px', textAlign: 'center', border: '1px solid #fecaca' }} 
                  >
                    <div style={{ fontSize: '0.6rem', color: '#991b1b', textTransform: 'uppercase', fontWeight: 800 }}>Absent (Unexcused)</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#dc2626' }}>{(block.absentList || []).filter(a => a.date === targetDateStr).length}</div>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 12, fontSize: '0.7rem', color: '#3b82f6', fontWeight: 800, textAlign: 'center' }}>
                VIEW BLOCK DETAILS & ROSTER
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 32 }}>
        <h4 style={{ marginBottom: 16 }}>Block-wise Operations Summary</h4>
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600 }}>Block Name</th>
                <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600 }}>People / Capacity</th>
                <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600 }}>Water Usage (Today)</th>
                <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600 }}>Power Usage (Today)</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((block, idx) => {
                const todayUsage = backendData?.dailyUsage?.[block.name]?.slice(-1)[0] || { water: 0, power: 0 };
                return (
                  <tr key={block.name} style={{ borderBottom: idx === blocks.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 700, color: '#1e293b' }}>{block.name}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600 }}>{block.occupied}</span>
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>/ {block.beds}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ color: '#0ea5e9', fontWeight: 600 }}>{todayUsage.water} KL</span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>{todayUsage.power} kWh</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h4 style={{ margin: 0 }}>Resource Consumption</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Filter Graph by Block:</span>
          <select 
            value={dashboardGraphBlock} 
            onChange={(e) => setDashboardGraphBlock(e.target.value)}
            style={{ 
              padding: '6px 12px', 
              borderRadius: '8px', 
              border: '1px solid #cbd5e1', 
              fontSize: '0.85rem', 
              fontWeight: '600',
              background: '#fff',
              color: '#334155',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <option value="all">All Blocks (Aggregated)</option>
            {blocks.map(b => (
              <option key={b.name} value={b.name}>{b.name}</option>
            ))}
          </select>
          <select 
            value={dashboardGraphMonth} 
            onChange={(e) => setDashboardGraphMonth(e.target.value)}
            style={{ 
              padding: '6px 12px', 
              borderRadius: '8px', 
              border: '1px solid #cbd5e1', 
              fontSize: '0.85rem', 
              fontWeight: '600',
              background: '#fff',
              color: '#334155',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <option value="all">All Time</option>
            {availableUsageMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="responsive-grid" style={{ marginTop: 8 }}>
        <div className="detail-chart-block">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0 }}>Water Usage (KL) - {dashboardGraphBlock === 'all' ? 'All Blocks' : dashboardGraphBlock}</h4>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="water" fill="#0ea5e9" name="Water (KL)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="detail-chart-block">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0 }}>Electricity Usage (kWh) - {dashboardGraphBlock === 'all' ? 'All Blocks' : dashboardGraphBlock}</h4>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="power" fill="#f59e0b" name="Power (kWh)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ marginTop: 32 }}>
        <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          <div className="detail-chart-block">
            <h4>Facility Compliance & Complaints</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={facilityCompliance.filter(c => c.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {facilityCompliance.filter(c => c.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`${val} Tickets`]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h4 style={{ margin: '0 0 16px 0' }}>Sector-wise Breakdown</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {facilityCompliance.map(item => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '8px', borderLeft: `4px solid ${item.color}` }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.name}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: item.color }}>{item.value} Tickets ({item.percentage.toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
    );
  };

  const renderBlockDetail = () => {
    if (viewingAbsentListForBlock || viewingAbsentListForAll) {
      let absentList = [];
      let title = '';
      let subtitle = '';

      if (viewingAbsentListForAll) {
        title = `Absent (Unexcused) Students - All Visible Blocks (${targetDateStr})`;
        subtitle = `Across ${blocks.length} blocks`;
        blocks.forEach(b => {
          if (b.absentList && b.absentList.length > 0) {
            absentList.push(...b.absentList.filter(a => a.date === targetDateStr).map(r => ({ ...r, blockName: b.name })));
          }
        });
      } else {
        const block = blocks.find(b => b.name === viewingAbsentListForBlock);
        title = `${viewingAbsentListForBlock} - Absent (Unexcused) Students (${targetDateStr})`;
        subtitle = `Showing unexcused absences for this block`;
        if (block && block.absentList && block.absentList.length > 0) {
          absentList = block.absentList.filter(a => a.date === targetDateStr).map(r => ({ ...r, blockName: block.name }));
        }
      }

      return (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <button 
              onClick={() => {
                setViewingAbsentListForBlock(null);
                setViewingAbsentListForAll(false);
              }}
              style={{ background: '#f1f5f9', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h2 style={{ margin: 0, color: '#0f172a' }}>{title}</h2>
              <p style={{ margin: 0, color: '#64748b' }}>{subtitle}</p>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {absentList.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>No absent (unexcused) students found.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: 700 }}>Name</th>
                    <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: 700 }}>Roll No</th>
                    <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: 700 }}>Room</th>
                    {viewingAbsentListForAll && <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: 700 }}>Block</th>}
                  </tr>
                </thead>
                <tbody>
                  {absentList.map((res, idx) => (
                    <tr 
                      key={idx} 
                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '16px 24px', fontWeight: 600, color: '#334155' }}>{res.name || '-'}</td>
                      <td style={{ padding: '16px 24px', color: '#64748b' }}>{res.rollNo || '-'}</td>
                      <td style={{ padding: '16px 24px', color: '#64748b' }}>{res.roomNo || '-'}</td>
                      {viewingAbsentListForAll && <td style={{ padding: '16px 24px', color: '#64748b' }}>{res.blockName}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      );
    }

    if (viewingRosterForBlock) {
      const block = blocks.find(b => b.name === viewingRosterForBlock);
      return (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <button 
              onClick={() => setViewingRosterForBlock(null)}
              style={{ background: '#f1f5f9', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h2 style={{ margin: 0, color: '#0f172a' }}>{viewingRosterForBlock} - Resident Roster</h2>
              <p style={{ margin: 0, color: '#64748b' }}>Complete list of registered students in this hostel block</p>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: 700 }}>Name</th>
                  <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: 700 }}>Roll No</th>
                  <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: 700 }}>Room</th>
                </tr>
              </thead>
              <tbody>
                {(block?.residentList || []).map((res, idx) => (
                  <tr 
                    key={idx} 
                    style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '16px 24px', fontWeight: 700, color: '#1e293b' }}>{res.name}</td>
                    <td style={{ padding: '16px 24px', color: '#475569' }}>{res.rollNo}</td>
                    <td style={{ padding: '16px 24px', color: '#3b82f6', fontWeight: 800 }}>{res.roomNo}</td>
                  </tr>
                ))}
                {(!block?.residentList || block?.residentList.length === 0) && (
                  <tr><td colSpan="3" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No residents registered in this block.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    const block = blocks.find(b => b.name === selectedBlock);
    let blockData = backendData?.dailyUsage?.[selectedBlock] || [];
    if (dashboardGraphMonth !== 'all') {
      blockData = blockData.filter(d => d.date && d.date.includes(dashboardGraphMonth));
    }

    // Specific block complaints from backend
    const blockComplaints = backendData?.maintenance?.filter(c => c.block === selectedBlock) || block?.complaints || [];

    const feedback = blockFeedback[selectedBlock] || [];

    return (
      <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => setSelectedBlock(null)}
              style={{ background: '#f1f5f9', border: 'none', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h2 style={{ margin: 0, color: '#0f172a' }}>{selectedBlock} Deep-Dive</h2>
              <p style={{ margin: 0, color: '#64748b' }}>Comprehensive operational metrics for this building</p>
            </div>
          </div>
          {isHostelUnitHead && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setRenameTarget({ oldName: selectedBlock, newName: selectedBlock });
                  setShowRenameModal(true);
                }}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.85rem'
                }}
              >
                ✏️ Rename Block
              </button>
              <button
                id="btn-delete-block-trigger"
                onClick={() => {
                  setDeleteTarget(selectedBlock);
                  setShowDeleteConfirm(true);
                }}
                style={{
                  background: '#fee2e2',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  color: '#b91c1c',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.85rem'
                }}
              >
                🗑️ Delete Block
              </button>
            </div>
          )}
        </div>

        <div className="responsive-grid" style={{ marginBottom: 32 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>Wardens & Staff Roster</h4>
            {block?.wardens && block.wardens.length > 0 && (
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div 
                  onClick={() => setRosterFilter(rosterFilter === 'warden' ? 'none' : 'warden')}
                  style={{ flex: 1, padding: '12px', background: rosterFilter === 'warden' ? '#e0f2fe' : '#f8fafc', borderRadius: '8px', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', border: rosterFilter === 'warden' ? '1px solid #bae6fd' : '1px solid transparent', transition: 'all 0.2s' }}
                >
                  <span style={{ color: '#64748b' }}>Wardens:</span>
                  <b>{(block?.wardens || []).filter(w => w.role && w.role.toLowerCase().includes('warden')).length}</b>
                </div>
                <div 
                  onClick={() => setRosterFilter(rosterFilter === 'support' ? 'none' : 'support')}
                  style={{ flex: 1, padding: '12px', background: rosterFilter === 'support' ? '#e0f2fe' : '#f8fafc', borderRadius: '8px', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', border: rosterFilter === 'support' ? '1px solid #bae6fd' : '1px solid transparent', transition: 'all 0.2s' }}
                >
                  <span style={{ color: '#64748b' }}>Support Staff:</span>
                  <b>{(block?.wardens || []).filter(w => w.role && !w.role.toLowerCase().includes('warden')).length}</b>
                </div>
              </div>
            )}

            {rosterFilter !== 'none' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                {(block?.wardens || [])
                  .filter(w => {
                    if (rosterFilter === 'all') return true;
                    const isWarden = w.role && w.role.toLowerCase().includes('warden');
                    return rosterFilter === 'warden' ? isWarden : !isWarden;
                  })
                  .map((w, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 40, height: 40, background: '#e0f2fe', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👤</div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem', textTransform: 'uppercase' }}>{w.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {w.role || 'Chief Warden'} • Floor: {
                          w.floor === '0&1' ? 'GROUND, FIRST' : 
                          w.floor === '2&3' ? 'SECOND, THIRD' : 
                          (w.floor || 'ALL FLOORS')
                        } • {w.phone}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {(!block?.wardens || block?.wardens.length === 0) && <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No wardens assigned.</div>}
          </div>

          <div 
            onClick={() => setViewingRosterForBlock(selectedBlock)}
            style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ margin: 0, color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>Building Occupancy</h4>
              <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>View Roster ➔</span>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b' }}>
              {blocks.find(b => b.name === selectedBlock)?.occupied}
              <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 400 }}> / {blocks.find(b => b.name === selectedBlock)?.beds} beds</span>
            </div>
            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginTop: 12 }}>
              <div style={{ height: '100%', width: `${(blocks.find(b => b.name === selectedBlock)?.occupied / blocks.find(b => b.name === selectedBlock)?.beds) * 100}%`, background: '#3b82f6' }} />
            </div>
          </div>

          <div 
            onClick={() => { if ((block?.absentList || []).filter(a => a.date === targetDateStr).length > 0) setViewingAbsentListForBlock(block.name); }}
            style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', cursor: (block?.absentList || []).filter(a => a.date === targetDateStr).length > 0 ? 'pointer' : 'default', transition: 'all 0.2s' }}
            onMouseEnter={e => { if ((block?.absentList || []).filter(a => a.date === targetDateStr).length > 0) { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'; } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <h4 style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>Attendance Status</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }}></div>
                  Absent (Unexcused)
                </span>
                <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.1rem' }}>{(block?.absentList || []).filter(a => a.date === targetDateStr).length}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: 32 }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>Infrastructure & Amenities</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Rooms</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{block?.totalRooms ?? 'N/A'}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Maintenance Rooms/Beds</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{block?.maintenanceRoomsBeds ?? 'N/A'}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Water / RO Points</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{block?.waterCoolersCount ?? 'N/A'}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Avg Bathrooms / Toilets</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{block?.bathroomsPerFloor ?? '0'} / {block?.toiletsPerFloor ?? '0'}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Solar Water Heater</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{block?.solarHeaterCapacity || 'N/A'}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Wi-Fi Access Points</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{block?.wifiAccessPoints ?? 'N/A'}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>CCTV Cameras</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{block?.cctvCameras ?? 'N/A'}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Common Room</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{block?.commonRoom || 'N/A'}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Reading Room</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{block?.readingRoom || 'N/A'}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Parent Waiting Area</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{block?.parentWaitingRoom || 'N/A'}</div>
            </div>
          </div>
          {block?.remarks && (
            <div style={{ marginTop: '16px', padding: '12px', background: '#fffbeb', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 700, marginBottom: '4px' }}>REMARKS / NOTES</div>
              <div style={{ fontSize: '0.85rem', color: '#78350f' }}>{block.remarks}</div>
            </div>
          )}
        </div>

        {block?.floorDetails && block.floorDetails.length > 0 && (
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '32px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Floor-wise Room Details</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '12px 8px' }}>Floor</th>
                    <th style={{ padding: '12px 8px' }}>Total Rms</th>
                    <th style={{ padding: '12px 8px' }}>Student Rms</th>
                    <th style={{ padding: '12px 8px' }}>Warden Rms</th>
                    <th style={{ padding: '12px 8px' }}>Suprv. Rms</th>
                    <th style={{ padding: '12px 8px' }}>Rest Rms</th>
                    <th style={{ padding: '12px 8px' }}>Room Types</th>
                    <th style={{ padding: '12px 8px' }}>Total Beds</th>
                  </tr>
                </thead>
                <tbody>
                  {block.floorDetails.map((f, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 600, color: '#334155' }}>{f.floorNumber}</td>
                      <td style={{ padding: '12px 8px' }}>{f.totalRooms || 0}</td>
                      <td style={{ padding: '12px 8px' }}>{f.studentRooms || 0}</td>
                      <td style={{ padding: '12px 8px' }}>{f.wardenRooms || 0}</td>
                      <td style={{ padding: '12px 8px' }}>{f.supervisorRooms || 0}</td>
                      <td style={{ padding: '12px 8px' }}>{f.restRooms || 0}</td>
                      <td style={{ padding: '12px 8px' }}>{f.roomTypes || '-'}</td>
                      <td style={{ padding: '12px 8px', fontWeight: 600 }}>{f.totalBeds || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h4 style={{ margin: 0 }}>Resource Consumption Trends</h4>
          <select 
            value={dashboardGraphMonth} 
            onChange={(e) => setDashboardGraphMonth(e.target.value)}
            style={{ 
              padding: '6px 12px', 
              borderRadius: '8px', 
              border: '1px solid #cbd5e1', 
              fontSize: '0.85rem', 
              fontWeight: '600',
              background: '#fff',
              color: '#334155',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <option value="all">All Time</option>
            {availableUsageMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="responsive-grid" style={{ marginBottom: 32 }}>
          <div className="detail-chart-block">
            <h4 style={{ marginBottom: 16 }}>Water Usage Trend (KL)</h4>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={blockData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="water" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="detail-chart-block">
            <h4 style={{ marginBottom: 16 }}>Electricity Usage Trend (kWh)</h4>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={blockData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="power" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="responsive-grid" style={{ marginBottom: 32 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 16px 0' }}>Facility Complaints</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {blockComplaints.length > 0 ? blockComplaints.map(c => (
                <div key={c.id} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', borderLeft: `4px solid ${c.status === 'Resolved' ? '#10b981' : '#f59e0b'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{c.id} - {c.type}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: c.status === 'Resolved' ? '#166534' : '#92400e' }}>{c.status}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>{c.desc}</div>
                </div>
              )) : <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No active complaints for this block.</p>}
            </div>
          </div>

          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 16px 0' }}>Resident Feedback</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {feedback.length > 0 ? feedback.map(f => (
                <div key={f.id} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{f.resident}</span>
                    <span style={{ color: '#f59e0b' }}>{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#475569', fontStyle: 'italic' }}>"{f.comment}"</div>
                </div>
              )) : <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No feedback received this week.</p>}
            </div>
          </div>
        </div>


      </div>
    );
  };

  return (
    <div className="unit-detail-container">
      {(selectedBlock || viewingAbsentListForAll) ? renderBlockDetail() : renderDashboard()}

      {!viewingRosterForBlock && (
        <>
          <div style={{ marginTop: 40 }}>
            <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
              <div className="detail-chart-block">
                <h4>Facility Ratings - May 2024 (0-5)</h4>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={facilityRatings}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#8b5cf6" name="Rating" radius={[6, 6, 0, 0]}>
                      {facilityRatings.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.score < 4 ? '#ef4444' : '#8b5cf6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', marginTop: 12 }}>
                  Red bars indicate sectors below the <b>4.0</b> excellence threshold.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px', background: '#f5f3ff', borderRadius: '12px', border: '1px solid #ddd6fe' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#5b21b6' }}>Current Performance</h4>
                <div style={{ fontSize: '0.85rem', color: '#4c1d95', lineHeight: 1.6 }}>
                  Top Sector: <b>Water Supply (4.7)</b><br />
                  Critical: <b>Wi-Fi (3.8)</b> - Needs infrastructure upgrade.<br />
                  Overall Avg: <b>4.36 / 5.0</b>
                </div>
              </div>
            </div>
          </div>

        </>
      )}

      {showRaiseModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '36px',
            boxSizing: 'border-box'
          }}>
            <button 
              id="close-raise-modal-btn"
              onClick={() => setShowRaiseModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
              onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
            >
              &times;
            </button>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.4rem', fontWeight: 800, color: '#1e293b' }}>🚨 Raise Maintenance Complaint</h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '0.85rem', color: '#64748b' }}>Log a new ticket for hostel infrastructure and operational repairs</p>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newComplaint.block) {
                alert('Please select a Hostel Block.');
                return;
              }
              if (!newComplaint.unitNo.trim()) {
                alert('Please specify the Unit Number/Room.');
                return;
              }
              if (!newComplaint.desc.trim()) {
                alert('Please enter a description of the issue.');
                return;
              }

              try {
                const res = await fetch('/api/hostels/raise-complaint', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    block: newComplaint.block,
                    unitNo: newComplaint.unitNo,
                    type: newComplaint.type,
                    desc: newComplaint.desc,
                    priority: newComplaint.priority,
                    assignedHead: newComplaint.assignedHead || 'Block Warden',
                    status: 'Ongoing',
                    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                  })
                });

                if (res.ok) {
                  const updatedBlocks = await res.json();
                  setBackendData(prev => ({ ...prev, blocks: updatedBlocks }));
                  alert('Complaint ticket raised successfully!');
                  setShowRaiseModal(false);
                  setNewComplaint({
                    block: '',
                    unitNo: '',
                    type: 'Electricity',
                    desc: '',
                    priority: 'Medium',
                    assignedHead: '',
                    status: 'Ongoing'
                  });
                } else {
                  const errMsg = await res.text();
                  alert(`Error raising complaint: ${errMsg}`);
                }
              } catch (err) {
                alert('Failed to connect to the backend server.');
              }
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                  Hostel Block Name *
                  <select 
                    value={newComplaint.block}
                    onChange={e => setNewComplaint({ ...newComplaint, block: e.target.value })}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                    required
                  >
                    <option value="">Select Block...</option>
                    {blocks.map(b => (
                      <option key={b.name} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                  Unit / Room Number *
                  <input 
                    type="text" 
                    value={newComplaint.unitNo}
                    onChange={e => setNewComplaint({ ...newComplaint, unitNo: e.target.value })}
                    placeholder="e.g. A-102 or Common Room"
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                    required
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                    Complaint Category *
                    <select 
                      value={newComplaint.type}
                      onChange={e => setNewComplaint({ ...newComplaint, type: e.target.value })}
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                    >
                      <option value="Electricity">Electricity</option>
                      <option value="Water Supply">Water Supply</option>
                      <option value="Housekeeping">Housekeeping</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Internet/Wi-Fi">Internet/Wi-Fi</option>
                    </select>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                    Priority Level *
                    <select 
                      value={newComplaint.priority}
                      onChange={e => setNewComplaint({ ...newComplaint, priority: e.target.value })}
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </label>
                </div>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                  Assigned Unit Head / Staff
                  <input 
                    type="text" 
                    value={newComplaint.assignedHead}
                    onChange={e => setNewComplaint({ ...newComplaint, assignedHead: e.target.value })}
                    placeholder="e.g. Mr. Rajesh K. or Dean Office"
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                  Complaint Description *
                  <textarea 
                    value={newComplaint.desc}
                    onChange={e => setNewComplaint({ ...newComplaint, desc: e.target.value })}
                    placeholder="Describe the issue in detail..."
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', minHeight: '100px', width: '100%', boxSizing: 'border-box' }}
                    required
                  />
                </label>

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowRaiseModal(false)}
                    style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, color: '#475569' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                  >
                    Submit Complaint
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENAME BLOCK MODAL */}
      {showRenameModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '28px',
            width: '90%',
            maxWidth: '450px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowRenameModal(false)}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: '#f1f5f9',
                border: 'none',
                width: 32,
                height: 32,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                fontWeight: 'bold'
              }}
            >
              ✕
            </button>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', color: '#1e293b', fontWeight: 800 }}>✏️ Rename Hostel Block</h3>
            <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '0.8rem' }}>
              Rename "{renameTarget.oldName}" and automatically update all referencing unit data, wardens, resident rosters, complaints, and reports.
            </p>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const newNameClean = renameTarget.newName.trim();
              if (!newNameClean) {
                alert('Block name cannot be empty!');
                return;
              }

              if (newNameClean !== renameTarget.oldName) {
                const nameExists = blocks.some(b => b.name.toLowerCase() === newNameClean.toLowerCase());
                if (nameExists) {
                  alert(`A block named "${newNameClean}" already exists. Please choose a unique name.`);
                  return;
                }
              }

              try {
                const res = await fetch('/api/hostels/rename-block', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ oldName: renameTarget.oldName, newName: newNameClean })
                });

                if (res.ok) {
                  const data = await res.json();
                  setBackendData(prev => ({ ...prev, blocks: data }));
                  
                  if (selectedBlock === renameTarget.oldName) {
                    setSelectedBlock(newNameClean);
                  }
                  
                  setShowRenameModal(false);
                  alert(`Successfully renamed block to "${newNameClean}" across all systems!`);
                } else {
                  const errMsg = await res.text();
                  alert(`Error renaming block: ${errMsg}`);
                }
              } catch (err) {
                alert('Failed to connect to the backend server.');
              }
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                  New Block Name *
                  <input
                    type="text"
                    value={renameTarget.newName}
                    onChange={e => setRenameTarget({ ...renameTarget, newName: e.target.value })}
                    placeholder="Enter new block name"
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                    required
                  />
                </label>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowRenameModal(false)}
                    style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, color: '#475569' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW BLOCK MODAL */}
      {showAddBlockModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '28px',
            width: '90%',
            maxWidth: '550px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowAddBlockModal(false)}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: '#f1f5f9',
                border: 'none',
                width: 32,
                height: 32,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                fontWeight: 'bold'
              }}
            >
              ✕
            </button>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', color: '#1e293b', fontWeight: 800 }}>➕ Add New Hostel Block</h3>
            <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '0.8rem' }}>
              Create a new residential block and assign default capacity, block type, warden credentials, and remarks.
            </p>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const blockNameClean = newBlockForm.name.trim();
              
              if (!blockNameClean) {
                alert('Block name is required!');
                return;
              }

              const nameExists = blocks.some(b => b.name.toLowerCase() === blockNameClean.toLowerCase());
              const calcOccupied = (parseInt(newBlockForm.chiefWardenCount) || 0) + (parseInt(newBlockForm.deputyWardenCount) || 0) + (parseInt(newBlockForm.seniorCaretakerCount) || 0) + (parseInt(newBlockForm.caretakerCount) || 0) + (parseInt(newBlockForm.careTakerAttenderCount) || 0);
              if (nameExists) {
                alert(`A block named "${blockNameClean}" already exists. Please choose a unique name.`);
                return;
              }

              if (newBlockForm.beds <= 0) {
                alert('Total beds capacity must be greater than zero!');
                return;
              }
              if (newBlockForm.occupied < 0) {
                alert('Occupied students count cannot be negative!');
                return;
              }
              if (calcOccupied > newBlockForm.beds) {
                alert(`Validation Error: Total Occupancy (${calcOccupied}) cannot exceed total beds capacity (${newBlockForm.beds}).`);
                return;
              }

              try {
                const res = await fetch('/api/hostels/add-block', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: blockNameClean,
                    beds: parseInt(newBlockForm.beds),
                    occupied: calcOccupied,
                    type: newBlockForm.type,
                    gender: newBlockForm.gender,
                    staffCount: parseInt(newBlockForm.staffCount),
                    remarks: newBlockForm.remarks,
                    wardenName: newBlockForm.wardenName,
                    wardenPhone: newBlockForm.wardenPhone,
                    numFloors: parseInt(newBlockForm.numFloors) || 0,
                    totalRooms: parseInt(newBlockForm.totalRooms) || 0,
                    chiefWardenCount: parseInt(newBlockForm.chiefWardenCount) || 0,
                    deputyWardenCount: parseInt(newBlockForm.deputyWardenCount) || 0,
                    seniorCaretakerCount: parseInt(newBlockForm.seniorCaretakerCount) || 0,
                    caretakerCount: parseInt(newBlockForm.caretakerCount) || 0,
                    careTakerAttenderCount: parseInt(newBlockForm.careTakerAttenderCount) || 0,
                    houseKeeperCount: parseInt(newBlockForm.houseKeeperCount) || 0,
                    bathroomCleanerCount: parseInt(newBlockForm.bathroomCleanerCount) || 0,
                    securityCount: parseInt(newBlockForm.securityCount) || 0,
                    maintenanceRoomsBeds: parseInt(newBlockForm.maintenanceRoomsBeds) || 0,
                    allocatedCapacity: parseInt(newBlockForm.allocatedCapacity) || 0,
                    waterCoolersCount: parseInt(newBlockForm.waterCoolersCount) || 0,
                    bathroomsPerFloor: parseFloat(newBlockForm.bathroomsPerFloor) || 0.0,
                    toiletsPerFloor: parseFloat(newBlockForm.toiletsPerFloor) || 0.0,
                    solarHeaterCapacity: newBlockForm.solarHeaterCapacity,
                    wifiAccessPoints: parseInt(newBlockForm.wifiAccessPoints) || 0,
                    cctvCameras: parseInt(newBlockForm.cctvCameras) || 0,
                    commonRoom: newBlockForm.commonRoom,
                    readingRoom: newBlockForm.readingRoom,
                    parentWaitingRoom: newBlockForm.parentWaitingRoom
                  })
                });

                if (res.ok) {
                  const data = await res.json();
                  setBackendData(prev => ({ ...prev, blocks: data }));
                  setShowAddBlockModal(false);
                  alert(`Successfully created new block "${blockNameClean}"!`);
                } else {
                  const errMsg = await res.text();
                  alert(`Error creating block: ${errMsg}`);
                }
              } catch (err) {
                alert('Failed to connect to the backend server.');
              }
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                    Block Name *
                    <input
                      type="text"
                      value={newBlockForm.name}
                      onChange={e => setNewBlockForm({ ...newBlockForm, name: e.target.value })}
                      placeholder="e.g. Diamond Block"
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                      required
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                    Gender Tab *
                    <select
                      value={newBlockForm.gender}
                      onChange={e => setNewBlockForm({ ...newBlockForm, gender: e.target.value })}
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                    >
                      <option value="boys">Boys</option>
                      <option value="girls">Girls</option>
                    </select>
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                    Total Beds (Capacity) *
                    <input
                      type="number"
                      value={newBlockForm.beds}
                      onChange={e => setNewBlockForm({ ...newBlockForm, beds: parseInt(e.target.value) || 0 })}
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                      required
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                    Initial Occupancy (Auto-calculated)
                    <input
                      type="number"
                      value={(parseInt(newBlockForm.chiefWardenCount) || 0) + (parseInt(newBlockForm.deputyWardenCount) || 0) + (parseInt(newBlockForm.seniorCaretakerCount) || 0) + (parseInt(newBlockForm.caretakerCount) || 0) + (parseInt(newBlockForm.careTakerAttenderCount) || 0)}
                      disabled
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box', background: '#f1f5f9', color: '#64748b' }}
                    />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                    Select Block Type *
                    <select
                      value={newBlockForm.type || 'Single Cot'}
                      onChange={e => setNewBlockForm({ ...newBlockForm, type: e.target.value })}
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                    >
                      <option value="Single Cot">Single Cot</option>
                      <option value="Double Cot">Double Cot</option>
                      <option value="Four Cot">Four Cot</option>
                      <option value="Single Cot / Double Cot">Single Cot / Double Cot</option>
                      <option value="Single Cot / Double Cot / Four Cot">Single Cot / Double Cot / Four Cot</option>
                    </select>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                    Enter Number of Floors *
                    <input
                      type="number"
                      value={newBlockForm.numFloors}
                      onChange={e => setNewBlockForm({ ...newBlockForm, numFloors: parseInt(e.target.value) || 0 })}
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                      required
                    />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                    Enter Total Rooms *
                    <input
                      type="number"
                      value={newBlockForm.totalRooms}
                      onChange={e => setNewBlockForm({ ...newBlockForm, totalRooms: parseInt(e.target.value) || 0 })}
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                      required
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                    Maintenance Rooms/Beds
                    <input
                      type="number"
                      value={newBlockForm.maintenanceRoomsBeds}
                      onChange={e => setNewBlockForm({ ...newBlockForm, maintenanceRoomsBeds: parseInt(e.target.value) || 0 })}
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                    />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                    Current Allocated Capacity
                    <input
                      type="number"
                      value={newBlockForm.allocatedCapacity}
                      onChange={e => setNewBlockForm({ ...newBlockForm, allocatedCapacity: parseInt(e.target.value) || 0 })}
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                    Water Coolers / RO Points Count
                    <input
                      type="number"
                      value={newBlockForm.waterCoolersCount}
                      onChange={e => setNewBlockForm({ ...newBlockForm, waterCoolersCount: parseInt(e.target.value) || 0 })}
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                    />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                    Bathrooms per Floor (avg.)
                    <input
                      type="number"
                      step="0.1"
                      value={newBlockForm.bathroomsPerFloor}
                      onChange={e => setNewBlockForm({ ...newBlockForm, bathroomsPerFloor: parseFloat(e.target.value) || 0 })}
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                    Toilets per Floor (avg.)
                    <input
                      type="number"
                      step="0.1"
                      value={newBlockForm.toiletsPerFloor}
                      onChange={e => setNewBlockForm({ ...newBlockForm, toiletsPerFloor: parseFloat(e.target.value) || 0 })}
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                    />
                  </label>
                </div>

                <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#166534' }}>👥 Staff Details for This Block</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>
                      Chief Warden
                      <input
                        type="number"
                        value={newBlockForm.chiefWardenCount}
                        onChange={e => setNewBlockForm({ ...newBlockForm, chiefWardenCount: parseInt(e.target.value) || 0 })}
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff', width: '100%', boxSizing: 'border-box' }}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>
                      Deputy Warden
                      <input
                        type="number"
                        value={newBlockForm.deputyWardenCount}
                        onChange={e => setNewBlockForm({ ...newBlockForm, deputyWardenCount: parseInt(e.target.value) || 0 })}
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff', width: '100%', boxSizing: 'border-box' }}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>
                      Sr Caretaker
                      <input
                        type="number"
                        value={newBlockForm.seniorCaretakerCount}
                        onChange={e => setNewBlockForm({ ...newBlockForm, seniorCaretakerCount: parseInt(e.target.value) || 0 })}
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff', width: '100%', boxSizing: 'border-box' }}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>
                      Caretaker
                      <input
                        type="number"
                        value={newBlockForm.caretakerCount}
                        onChange={e => setNewBlockForm({ ...newBlockForm, caretakerCount: parseInt(e.target.value) || 0 })}
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff', width: '100%', boxSizing: 'border-box' }}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>
                      Caretaker / Res. Attender
                      <input
                        type="number"
                        value={newBlockForm.careTakerAttenderCount}
                        onChange={e => setNewBlockForm({ ...newBlockForm, careTakerAttenderCount: parseInt(e.target.value) || 0 })}
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff', width: '100%', boxSizing: 'border-box' }}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>
                      Housekeeper
                      <input
                        type="number"
                        value={newBlockForm.houseKeeperCount}
                        onChange={e => setNewBlockForm({ ...newBlockForm, houseKeeperCount: parseInt(e.target.value) || 0 })}
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff', width: '100%', boxSizing: 'border-box' }}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>
                      Cleaner
                      <input
                        type="number"
                        value={newBlockForm.bathroomCleanerCount}
                        onChange={e => setNewBlockForm({ ...newBlockForm, bathroomCleanerCount: parseInt(e.target.value) || 0 })}
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff', width: '100%', boxSizing: 'border-box' }}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>
                      Security
                      <input
                        type="number"
                        value={newBlockForm.securityCount}
                        onChange={e => setNewBlockForm({ ...newBlockForm, securityCount: parseInt(e.target.value) || 0 })}
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff', width: '100%', boxSizing: 'border-box' }}
                      />
                    </label>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#1e293b' }}>👤 Assigned Warden Details (Optional)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                      Warden Name
                      <input
                        type="text"
                        value={newBlockForm.wardenName}
                        onChange={e => setNewBlockForm({ ...newBlockForm, wardenName: e.target.value })}
                        placeholder="e.g. Mr. Hari M."
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff' }}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                      Warden Phone
                      <input
                        type="text"
                        value={newBlockForm.wardenPhone}
                        onChange={e => setNewBlockForm({ ...newBlockForm, wardenPhone: e.target.value })}
                        placeholder="e.g. +91 99887 76655"
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff' }}
                      />
                    </label>
                  </div>
                </div>

                <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#1e40af' }}>⚡ Equipment & Infrastructure</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '12px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#1e40af' }}>
                      Solar Water Heater (Y/N) — Capacity
                      <input
                        type="text"
                        value={newBlockForm.solarHeaterCapacity}
                        onChange={e => setNewBlockForm({ ...newBlockForm, solarHeaterCapacity: e.target.value })}
                        placeholder="e.g. Yes - 500L or No"
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff', width: '100%', boxSizing: 'border-box' }}
                      />
                    </label>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#1e40af' }}>
                      Number of Wi-Fi Access Points
                      <input
                        type="number"
                        value={newBlockForm.wifiAccessPoints}
                        onChange={e => setNewBlockForm({ ...newBlockForm, wifiAccessPoints: parseInt(e.target.value) || 0 })}
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff', width: '100%', boxSizing: 'border-box' }}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#1e40af' }}>
                      CCTV Coverage — Count of Cameras
                      <input
                        type="number"
                        value={newBlockForm.cctvCameras}
                        onChange={e => setNewBlockForm({ ...newBlockForm, cctvCameras: parseInt(e.target.value) || 0 })}
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff', width: '100%', boxSizing: 'border-box' }}
                      />
                    </label>
                  </div>
                </div>

                <div style={{ background: '#f5f3ff', padding: '16px', borderRadius: '10px', border: '1px solid #ddd6fe' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#6d28d9' }}>🏢 Amenities & Common Areas</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#6d28d9' }}>
                      Common Room — Available (Y/N) & count
                      <input
                        type="text"
                        value={newBlockForm.commonRoom}
                        onChange={e => setNewBlockForm({ ...newBlockForm, commonRoom: e.target.value })}
                        placeholder="e.g. Yes - 1 or No"
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff', width: '100%', boxSizing: 'border-box' }}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#6d28d9' }}>
                      Reading Room — Available (Y/N) & count
                      <input
                        type="text"
                        value={newBlockForm.readingRoom}
                        onChange={e => setNewBlockForm({ ...newBlockForm, readingRoom: e.target.value })}
                        placeholder="e.g. Yes - 1 or No"
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff', width: '100%', boxSizing: 'border-box' }}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#6d28d9' }}>
                      Visitor Room / Parent Waiting Area — Available (Y/N) & count
                      <input
                        type="text"
                        value={newBlockForm.parentWaitingRoom}
                        onChange={e => setNewBlockForm({ ...newBlockForm, parentWaitingRoom: e.target.value })}
                        placeholder="e.g. Yes - 1 or No"
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff', width: '100%', boxSizing: 'border-box' }}
                      />
                    </label>
                  </div>
                </div>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                  Remarks / Notes (Optional)
                  <textarea
                    value={newBlockForm.remarks}
                    onChange={e => setNewBlockForm({ ...newBlockForm, remarks: e.target.value })}
                    placeholder="Enter any initial block remarks..."
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', minHeight: '60px', width: '100%', boxSizing: 'border-box' }}
                  />
                </label>

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddBlockModal(false)}
                    style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, color: '#475569' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                  >
                    Create Block
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '28px',
            width: '90%',
            maxWidth: '450px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            position: 'relative',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.3rem', color: '#b91c1c', fontWeight: 800 }}>⚠️ Delete Hostel Block?</h3>
            <p style={{ margin: '0 0 20px 0', color: '#475569', fontSize: '0.85rem', lineHeight: '1.5' }}>
              Are you absolutely sure you want to delete <strong>"{deleteTarget}"</strong>? <br />
              This will permanently wipe out all associated student details, wardens, utility usages, and active maintenance complaints. This action is irreversible.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, color: '#475569' }}
              >
                No, Keep Block
              </button>
              <button
                id="btn-confirm-delete"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/hostels/delete-block', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: deleteTarget })
                    });
                    if (res.ok) {
                      const data = await res.json();
                      setBackendData(prev => ({ ...prev, blocks: data }));
                      setShowDeleteConfirm(false);
                      setSelectedBlock(null);
                      alert(`Hostel Block "${deleteTarget}" has been deleted successfully.`);
                    } else {
                      const errText = await res.text();
                      alert(`Error deleting block: ${errText}`);
                    }
                  } catch (err) {
                    alert('Failed to connect to the backend server.');
                  }
                }}
                style={{ flex: 1.5, padding: '12px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
              >
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
