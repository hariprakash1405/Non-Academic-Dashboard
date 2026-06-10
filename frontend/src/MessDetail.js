import React, { useState, useMemo, useEffect } from 'react';
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
  AreaChart,
  Area,
  LineChart,
  Line,
} from 'recharts';

// --- Helper Functions outside React Component to satisfy ESLint ---
const getEquipmentSummary = (equipmentList, blockName) => {
  const list = equipmentList[blockName] || [];
  let working = 0;
  let total = 0;
  let damaged = 0;
  list.forEach(e => {
    working += e.working;
    damaged += e.damaged;
    total += e.total;
  });
  const healthPercentage = total > 0 ? Math.round((working / total) * 100) : 100;
  return { total, working, damaged, healthPercentage };
};

const getTodayWaste = (wasteLogs, blockName) => {
  const logs = wasteLogs[blockName] || [];
  // Just grab May 20th as "Today's" mock record
  const todayRecord = logs.find(l => l.date === '2026-05-20') || { breakfast: 0, lunch: 0, dinner: 0, total: 0 };
  return todayRecord;
};

const getMonthlyTotalAndAverage = (wasteLogs, blockName) => {
  const logs = wasteLogs[blockName] || [];
  const total = logs.reduce((acc, curr) => acc + curr.total, 0);
  const avg = logs.length > 0 ? Math.round(total / logs.length) : 0;
  return { total, avg };
};

// --- Static Menu / Seating / Base Data ---
const initialBlocks = [
  { name: 'Boys Day Scholar', capacity: 250, occupied: 220, gender: 'boys' },
  { name: 'Boys Hostel', capacity: 400, occupied: 385, gender: 'boys' },
  { name: 'Girls', capacity: 180, occupied: 165, gender: 'girls' },
];

const todayMenus = {
  'Boys Day Scholar': {
    breakfast: null, // Hidden per special rule
    lunch: 'Veg Biryani, Paneer Butter Masala, Cucumber Raita, Salad, Papad, Gulab Jamun',
    dinner: null, // Hidden per special rule
  },
  'Boys Hostel': {
    breakfast: 'Mysore Masala Dosa, Sambar, Coconut & Tomato Chutney, Tea/Coffee',
    lunch: 'Andhra Style Meals: Steamed Rice, Tomato Pappu, Beetroot Poriyal, Rasam, Curd, Pickle',
    dinner: 'Tandoori Roti, Paneer Tikka Masala, Yellow Dal Tadka, Jeera Rice, Sweet Lassi',
  },
  'Girls': {
    breakfast: 'Aloo Paratha with Butter, Fresh Curd, Pickle, Milk/Tea',
    lunch: 'North Indian Lunch: Chapati, Shahi Paneer, Mix Vegetable Subzi, Steamed Rice, Buttermilk',
    dinner: 'Idli & Vada, Sambar, Coconut Chutney, Lemon Rice, Fruit Custard',
  },
};

const initialEquipment = {
  'Boys Day Scholar': [
    { id: 1, name: 'Grinder', total: 4, working: 3, damaged: 1, status: 'Partial Working' },
    { id: 2, name: 'Fridge', total: 2, working: 2, damaged: 0, status: 'Working' },
    { id: 3, name: 'Oven', total: 1, working: 0, damaged: 1, status: 'Not Working' },
    { id: 4, name: 'Stove', total: 6, working: 5, damaged: 1, status: 'Partial Working' },
    { id: 5, name: 'Water Heater', total: 3, working: 3, damaged: 0, status: 'Working' },
    { id: 6, name: 'Dining Table', total: 40, working: 38, damaged: 2, status: 'Partial Working' },
    { id: 7, name: 'Fan', total: 25, working: 22, damaged: 3, status: 'Under Maintenance' },
    { id: 8, name: 'Washing Area Equipment', total: 2, working: 2, damaged: 0, status: 'Working' },
  ],
  'Boys Hostel': [
    { id: 1, name: 'Grinder', total: 6, working: 6, damaged: 0, status: 'Working' },
    { id: 2, name: 'Fridge', total: 4, working: 3, damaged: 1, status: 'Partial Working' },
    { id: 3, name: 'Oven', total: 2, working: 2, damaged: 0, status: 'Working' },
    { id: 4, name: 'Stove', total: 10, working: 8, damaged: 2, status: 'Partial Working' },
    { id: 5, name: 'Water Heater', total: 5, working: 4, damaged: 1, status: 'Under Maintenance' },
    { id: 6, name: 'Dining Table', total: 70, working: 68, damaged: 2, status: 'Partial Working' },
    { id: 7, name: 'Fan', total: 45, working: 43, damaged: 2, status: 'Partial Working' },
    { id: 8, name: 'Washing Area Equipment', total: 4, working: 3, damaged: 1, status: 'Partial Working' },
  ],
  'Girls': [
    { id: 1, name: 'Grinder', total: 3, working: 3, damaged: 0, status: 'Working' },
    { id: 2, name: 'Fridge', total: 3, working: 2, damaged: 1, status: 'Partial Working' },
    { id: 3, name: 'Oven', total: 1, working: 1, damaged: 0, status: 'Working' },
    { id: 4, name: 'Stove', total: 5, working: 5, damaged: 0, status: 'Working' },
    { id: 5, name: 'Water Heater', total: 3, working: 2, damaged: 1, status: 'Under Maintenance' },
    { id: 6, name: 'Dining Table', total: 30, working: 30, damaged: 0, status: 'Working' },
    { id: 7, name: 'Fan', total: 20, working: 18, damaged: 2, status: 'Partial Working' },
    { id: 8, name: 'Washing Area Equipment', total: 2, working: 2, damaged: 0, status: 'Working' },
  ],
};

// Generates dynamic daily food waste logs for May 2026
const generateWasteLogs = () => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const logs = {
    'Boys Day Scholar': [],
    'Boys Hostel': [],
    'Girls': [],
  };

  // May 2026 has 31 days. May 1st was a Friday.
  for (let d = 1; d <= 31; d++) {
    const dayOfWeek = daysOfWeek[(d + 4) % 7];
    const isWeekend = dayOfWeek === 'Sat' || dayOfWeek === 'Sun';

    // 1. Boys Day Scholar (Only Lunch is served)
    const bdsLunch = Math.round(18 + Math.sin(d * 0.8) * 4 + (dayOfWeek === 'Mon' ? 7 : 0) - (isWeekend ? 8 : 0));
    logs['Boys Day Scholar'].push({
      date: `2026-05-${d.toString().padStart(2, '0')}`,
      dayNum: d,
      dayOfWeek,
      breakfast: 0,
      lunch: bdsLunch,
      dinner: 0,
      total: bdsLunch,
    });

    // 2. Boys Hostel (All 3 meals, higher quantity)
    const bhBreakfast = Math.round(22 + Math.cos(d * 0.5) * 3 + (isWeekend ? -4 : 2));
    const bhLunch = Math.round(48 + Math.sin(d * 0.6) * 8 + (dayOfWeek === 'Mon' ? 14 : 0));
    const bhDinner = Math.round(38 + Math.cos(d * 0.9) * 6 + (dayOfWeek === 'Fri' ? 10 : 0));
    logs['Boys Hostel'].push({
      date: `2026-05-${d.toString().padStart(2, '0')}`,
      dayNum: d,
      dayOfWeek,
      breakfast: bhBreakfast,
      lunch: bhLunch,
      dinner: bhDinner,
      total: bhBreakfast + bhLunch + bhDinner,
    });

    // 3. Girls (All 3 meals, moderate quantity)
    const gBreakfast = Math.round(13 + Math.sin(d * 0.4) * 2 + (isWeekend ? -2 : 1));
    const gLunch = Math.round(26 + Math.cos(d * 0.6) * 5 + (dayOfWeek === 'Mon' ? 8 : 0));
    const gDinner = Math.round(22 + Math.sin(d * 1.1) * 3 + (dayOfWeek === 'Wed' ? 5 : 0));
    logs['Girls'].push({
      date: `2026-05-${d.toString().padStart(2, '0')}`,
      dayNum: d,
      dayOfWeek,
      breakfast: gBreakfast,
      lunch: gLunch,
      dinner: gDinner,
      total: gBreakfast + gLunch + gDinner,
    });
  }

  return logs;
};

// Static comparison baseline for April 2026 (for monthly comparison chart)
const aprilAverages = {
  'Boys Day Scholar': 16.5,
  'Boys Hostel': 105.8,
  'Girls': 58.2,
};

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const STATUS_COLORS = {
  'Working': '#10b981',
  'Partial Working': '#eab308',
  'Under Maintenance': '#f97316',
  'Not Working': '#ef4444',
};

// Mock data for Food Satisfaction Yes/No line chart
const satisfactionData = Array.from({ length: 31 }, (_, i) => {
  const day = i + 1;
  return {
    date: `2026-05-${day.toString().padStart(2, '0')}`,
    Yes: Math.floor(Math.random() * 40) + 120, // Between 120 and 160 Yes
    No: Math.floor(Math.random() * 15) + 5,   // Between 5 and 20 No
  };
});

export default function MessDetail() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'equipment' | 'waste' | 'comparisons' | 'monthly'
  const [blocks, setBlocks] = useState([]);
  const [editingBlockIdx, setEditingBlockIdx] = useState(null);
  const [editCapacityVal, setEditCapacityVal] = useState(0);
  const [editOccupiedVal, setEditOccupiedVal] = useState(0);

  const [equipmentList, setEquipmentList] = useState({});
  const [selectedBlockEquip, setSelectedBlockEquip] = useState('Boys Hostel');
  const [equipSearch, setEquipSearch] = useState('');
  const [equipFilterStatus, setEquipFilterStatus] = useState('all');
  const [showAddEquipModal, setShowAddEquipModal] = useState(false);
  const [newEquip, setNewEquip] = useState({ name: '', total: 1, working: 1, damaged: 0, status: 'Working' });

  const [wasteLogs, setWasteLogs] = useState({});
  const [selectedBlockWaste, setSelectedBlockWaste] = useState('Boys Hostel');

  // --- Dynamic Menu State ---
  const [menusList, setMenusList] = useState([]);
  const [dashboardMenuDate, setDashboardMenuDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedMonthMenuBlock, setSelectedMonthMenuBlock] = useState('Boys Hostel');

  // --- Feedback & Remarks State ---
  const [remarksList, setRemarksList] = useState([
    { id: 1, date: '2026-05-22', text: 'Panner butter masala was excellent.', block: 'Boys Hostel' },
    { id: 2, date: '2026-05-22', text: 'Rice was a bit undercooked.', block: 'Girls' },
    { id: 3, date: '2026-05-23', text: 'Loved the idly podi today!', block: 'Boys Hostel' },
  ]);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:8085/api/mess/data');
        if (res.ok) {
          const data = await res.json();
          if (data.blocks) setBlocks(data.blocks);
          
          if (data.equipment) {
            const groupedEquip = { 'Boys Day Scholar': [], 'Boys Hostel': [], 'Girls': [] };
            data.equipment.forEach(e => {
              if (!groupedEquip[e.blockName]) groupedEquip[e.blockName] = [];
              groupedEquip[e.blockName].push(e);
            });
            setEquipmentList(groupedEquip);
          }

          if (data.wasteLogs) {
            const groupedLogs = { 'Boys Day Scholar': [], 'Boys Hostel': [], 'Girls': [] };
            data.wasteLogs.forEach(l => {
              const d = new Date(l.date);
              const dayOfWeek = d.toLocaleDateString('en-US', {weekday: 'short'}); // 'Mon', etc.
              const dayNum = d.getDate();
              const log = { ...l, date: l.date.split('T')[0], dayNum, dayOfWeek };
              if (!groupedLogs[l.blockName]) groupedLogs[l.blockName] = [];
              groupedLogs[l.blockName].push(log);
            });
            setWasteLogs(groupedLogs);
          }

          if (data.menus) {
            setMenusList(data.menus);
          }
        }
      } catch (e) {
        console.warn('Backend not reachable, fallback to empty state');
      }
    };
    fetchData();

    // Listen for form updates
    const handleUpdate = () => fetchData();
    window.addEventListener('unit-form-updated', handleUpdate);
    return () => window.removeEventListener('unit-form-updated', handleUpdate);
  }, []);

  // --- Comparison Panel State ---
  const [compDayOfWeek, setCompDayOfWeek] = useState('Mon');
  const [compDateLeft, setCompDateLeft] = useState('2026-05-11');
  const [compDateRight, setCompDateRight] = useState('2026-05-04');
  const [compDayLeft, setCompDayLeft] = useState('2026-05-15');
  const [compDayRight, setCompDayRight] = useState('2026-05-16');
  const [compWeekLeft, setCompWeekLeft] = useState('W1');
  const [compWeekRight, setCompWeekRight] = useState('W2');
  const [compBlockLeft, setCompBlockLeft] = useState('Boys Hostel');
  const [compBlockRight, setCompBlockRight] = useState('Girls');

  // --- Month selector State ---
  const [selectedReportMonth, setSelectedReportMonth] = useState('May 2026');

  // Helper to filter dates matching selected day of the week
  const filteredCompDates = useMemo(() => {
    const logs = wasteLogs[selectedBlockWaste] || [];
    return logs.filter(l => l.dayOfWeek === compDayOfWeek);
  }, [wasteLogs, selectedBlockWaste, compDayOfWeek]);

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------
  const handleSaveCapacity = (idx) => {
    const updated = [...blocks];
    updated[idx].capacity = parseInt(editCapacityVal) || 0;
    updated[idx].occupied = parseInt(editOccupiedVal) || 0;
    setBlocks(updated);
    setEditingBlockIdx(null);
  };

  const handleDayOfWeekChange = (newDay) => {
    setCompDayOfWeek(newDay);
    const logs = wasteLogs[selectedBlockWaste] || [];
    const matching = logs.filter(l => l.dayOfWeek === newDay);
    if (matching.length >= 2) {
      setCompDateLeft(matching[1].date);
      setCompDateRight(matching[0].date);
    } else if (matching.length >= 1) {
      setCompDateLeft(matching[0].date);
      setCompDateRight(matching[0].date);
    }
  };

  const handleQuickStatusAdjust = (blockName, equipId, deltaWorking, deltaDamaged) => {
    const updatedList = { ...equipmentList };
    const items = [...updatedList[blockName]];
    const idx = items.findIndex(e => e.id === equipId);
    if (idx > -1) {
      const item = { ...items[idx] };
      item.working = Math.max(0, item.working + deltaWorking);
      item.damaged = Math.max(0, item.damaged + deltaDamaged);
      item.total = item.working + item.damaged;

      // Automatically recalculate status
      if (item.damaged === 0) {
        item.status = 'Working';
      } else if (item.working === 0) {
        item.status = 'Not Working';
      } else if (item.damaged > 0 && item.working > 0) {
        // Simple logic: if more than 30% damaged, Under Maintenance, else Partial Working
        if ((item.damaged / item.total) > 0.3) {
          item.status = 'Under Maintenance';
        } else {
          item.status = 'Partial Working';
        }
      }
      items[idx] = item;
      updatedList[blockName] = items;
      setEquipmentList(updatedList);
    }
  };

  const handleAddEquipment = (e) => {
    e.preventDefault();
    if (!newEquip.name.trim()) return;

    const total = parseInt(newEquip.working) + parseInt(newEquip.damaged);
    let status = newEquip.status;
    if (newEquip.damaged === 0) status = 'Working';
    else if (newEquip.working === 0) status = 'Not Working';

    const newItem = {
      id: Date.now(),
      name: newEquip.name,
      total,
      working: parseInt(newEquip.working) || 0,
      damaged: parseInt(newEquip.damaged) || 0,
      status,
    };

    setEquipmentList(prev => ({
      ...prev,
      [selectedBlockEquip]: [...prev[selectedBlockEquip], newItem],
    }));

    setNewEquip({ name: '', total: 1, working: 1, damaged: 0, status: 'Working' });
    setShowAddEquipModal(false);
  };

  // -------------------------------------------------------------
  // COMPUTED ANALYTICS / DATASOURCES
  // -------------------------------------------------------------

  // Filtered Equipment List
  const filteredEquipment = useMemo(() => {
    const list = equipmentList[selectedBlockEquip] || [];
    return list.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(equipSearch.toLowerCase());
      const matchesStatus = equipFilterStatus === 'all' || item.status === equipFilterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [equipmentList, selectedBlockEquip, equipSearch, equipFilterStatus]);

  // (Helper functions moved outside of component body)

  // Recharts: Day-wise food waste chart data
  const dayWiseWasteChartData = useMemo(() => {
    const logs = wasteLogs[selectedBlockWaste] || [];
    return logs.map(l => ({
      day: l.dayNum,
      date: l.date,
      Breakfast: l.breakfast,
      Lunch: l.lunch,
      Dinner: l.dinner,
      Total: l.total,
    }));
  }, [wasteLogs, selectedBlockWaste]);

  // Recharts: Week-wise comparison chart data
  const weekWiseChartData = useMemo(() => {
    const logs = wasteLogs[selectedBlockWaste] || [];
    const weeks = [
      { name: 'Week 1 (1-7)', Breakfast: 0, Lunch: 0, Dinner: 0, Total: 0, count: 0 },
      { name: 'Week 2 (8-14)', Breakfast: 0, Lunch: 0, Dinner: 0, Total: 0, count: 0 },
      { name: 'Week 3 (15-21)', Breakfast: 0, Lunch: 0, Dinner: 0, Total: 0, count: 0 },
      { name: 'Week 4 (22-28)', Breakfast: 0, Lunch: 0, Dinner: 0, Total: 0, count: 0 },
      { name: 'Week 5 (29-31)', Breakfast: 0, Lunch: 0, Dinner: 0, Total: 0, count: 0 },
    ];

    logs.forEach(l => {
      let wIdx = 0;
      if (l.dayNum <= 7) wIdx = 0;
      else if (l.dayNum <= 14) wIdx = 1;
      else if (l.dayNum <= 21) wIdx = 2;
      else if (l.dayNum <= 28) wIdx = 3;
      else wIdx = 4;

      weeks[wIdx].Breakfast += l.breakfast;
      weeks[wIdx].Lunch += l.lunch;
      weeks[wIdx].Dinner += l.dinner;
      weeks[wIdx].Total += l.total;
      weeks[wIdx].count += 1;
    });

    return weeks.map(w => ({
      name: w.name,
      Breakfast: Math.round(w.Breakfast / (w.count || 1)),
      Lunch: Math.round(w.Lunch / (w.count || 1)),
      Dinner: Math.round(w.Dinner / (w.count || 1)),
      Total: Math.round(w.Total / (w.count || 1)),
    }));
  }, [wasteLogs, selectedBlockWaste]);

  // Recharts: Block-wise comparison (Total Waste for May)
  const blockComparisonData = useMemo(() => {
    return Object.keys(wasteLogs).map(blockName => {
      const logs = wasteLogs[blockName] || [];
      const total = logs.reduce((acc, curr) => acc + curr.total, 0);
      return { name: blockName, value: total };
    });
  }, [wasteLogs]);

  // Recharts: Meal-wise total waste analysis
  const mealWiseWasteData = useMemo(() => {
    const logs = wasteLogs[selectedBlockWaste] || [];
    let bTotal = 0;
    let lTotal = 0;
    let dTotal = 0;
    logs.forEach(l => {
      bTotal += l.breakfast;
      lTotal += l.lunch;
      dTotal += l.dinner;
    });
    return [
      { name: 'Breakfast', value: bTotal },
      { name: 'Lunch', value: lTotal },
      { name: 'Dinner', value: dTotal },
    ];
  }, [wasteLogs, selectedBlockWaste]);

  // Day of Week Comparison Calculation
  const dayOfWeekComparisonResult = useMemo(() => {
    const logs = wasteLogs[selectedBlockWaste] || [];
    const leftRec = logs.find(l => l.date === compDateLeft);
    const rightRec = logs.find(l => l.date === compDateRight);

    if (!leftRec || !rightRec) return null;
    const diff = leftRec.total - rightRec.total;
    const pct = rightRec.total > 0 ? Math.round((diff / rightRec.total) * 100) : 0;

    return {
      left: leftRec,
      right: rightRec,
      diff,
      pct,
    };
  }, [wasteLogs, selectedBlockWaste, compDateLeft, compDateRight]);

  // Custom Day vs Day Comparison
  const customDayComparisonResult = useMemo(() => {
    const logs = wasteLogs[selectedBlockWaste] || [];
    const leftRec = logs.find(l => l.date === compDayLeft);
    const rightRec = logs.find(l => l.date === compDayRight);

    if (!leftRec || !rightRec) return null;
    return {
      left: leftRec,
      right: rightRec,
    };
  }, [wasteLogs, selectedBlockWaste, compDayLeft, compDayRight]);

  // Weekly aggregate comparison helper
  const weeklyCompResult = useMemo(() => {
    const weekData = weekWiseChartData;
    const map = { 'W1': 0, 'W2': 1, 'W3': 2, 'W4': 3, 'W5': 4 };
    const leftIdx = map[compWeekLeft] ?? 0;
    const rightIdx = map[compWeekRight] ?? 1;

    return {
      leftName: weekData[leftIdx]?.name || 'N/A',
      leftVal: weekData[leftIdx]?.Total || 0,
      rightName: weekData[rightIdx]?.name || 'N/A',
      rightVal: weekData[rightIdx]?.Total || 0,
    };
  }, [weekWiseChartData, compWeekLeft, compWeekRight]);

  // Block vs Block comparison helper
  const blockCompResult = useMemo(() => {
    const leftSummary = getMonthlyTotalAndAverage(wasteLogs, compBlockLeft);
    const rightSummary = getMonthlyTotalAndAverage(wasteLogs, compBlockRight);
    const leftToday = getTodayWaste(wasteLogs, compBlockLeft);
    const rightToday = getTodayWaste(wasteLogs, compBlockRight);

    return {
      leftName: compBlockLeft,
      rightName: compBlockRight,
      leftTotal: leftSummary.total,
      leftAvg: leftSummary.avg,
      leftToday: leftToday.total,
      rightTotal: rightSummary.total,
      rightAvg: rightSummary.avg,
      rightToday: rightToday.total,
    };
  }, [wasteLogs, compBlockLeft, compBlockRight]);

  // Summary Metrics: highest waste day, least waste day, weekly average
  const summaryMetrics = useMemo(() => {
    const logs = wasteLogs[selectedBlockWaste] || [];
    if (logs.length === 0) return null;

    let maxRec = logs[0];
    let minRec = logs[0];
    let sum = 0;

    logs.forEach(l => {
      if (l.total > maxRec.total) maxRec = l;
      // Skip day scholars zero days for min comparison (if any) or look at non-zero minimums
      if (l.total < minRec.total) minRec = l;
      sum += l.total;
    });

    const averageWeekly = Math.round((sum / logs.length) * 7);

    return {
      highestDay: maxRec.date,
      highestVal: maxRec.total,
      leastDay: minRec.date,
      leastVal: minRec.total,
      avgWeekly: averageWeekly,
    };
  }, [wasteLogs, selectedBlockWaste]);

  // Available Mondays helper for picker
  const mondaysInMay = [
    { date: '2026-05-04', label: 'May 04 (Week 1)' },
    { date: '2026-05-11', label: 'May 11 (Week 2)' },
    { date: '2026-05-18', label: 'May 18 (Week 3)' },
    { date: '2026-05-25', label: 'May 25 (Week 4)' },
  ];

  const getMenuForDate = (blockName, dateStr) => {
    let queryBlockName = blockName;
    if (blockName === 'Boys Day Scholar') {
      queryBlockName = 'Boys Hostel';
    }

    const monthYearStr = dateStr.substring(0, 7);
    const menuRow = menusList.find(m => m.blockName === queryBlockName && m.monthYear === monthYearStr);
    
    if (menuRow && menuRow.menuJSON) {
      try {
        const parsed = JSON.parse(menuRow.menuJSON);
        const dayMenu = parsed.find(m => m.date === dateStr);
        if (dayMenu) {
          if (blockName === 'Boys Day Scholar') {
            return {
              breakfast: null,
              lunch: Array.isArray(dayMenu.lunch) ? dayMenu.lunch.join(', ') : dayMenu.lunch,
              dinner: null
            };
          }
          return {
            breakfast: Array.isArray(dayMenu.breakfast) ? dayMenu.breakfast.join(', ') : dayMenu.breakfast,
            lunch: Array.isArray(dayMenu.lunch) ? dayMenu.lunch.join(', ') : dayMenu.lunch,
            dinner: Array.isArray(dayMenu.dinner) ? dayMenu.dinner.join(', ') : dayMenu.dinner
          };
        }
      } catch (e) {
        console.error("Error parsing menuJSON", e);
      }
    }
    return null;
  };

  return (
    <div style={{ padding: '24px', fontFamily: '"Inter", sans-serif', background: '#f8fafc', minHeight: '100vh', color: '#1e293b' }}>
      
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            🍽️ Mess & Dining Management
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Manage capacities, digital menu cycles, equipment inventories, and food waste analytics.
          </p>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '12px', padding: '4px' }}>
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'equipment', label: 'Equipment Health' },
            { id: 'waste', label: 'Waste Analytics' },
            { id: 'comparisons', label: 'Comparisons' },
            { id: 'monthly', label: 'Month-wise View' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                border: 'none',
                background: activeTab === tab.id ? '#ffffff' : 'transparent',
                color: activeTab === tab.id ? '#4f46e5' : '#475569',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: activeTab === tab.id ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------------------------------------- */}
      {/* TAB 1: DASHBOARD OVERVIEW */}
      {/* ---------------------------------------------------------------------------------- */}
      {activeTab === 'dashboard' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', background: '#fff', padding: '12px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <label style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.9rem' }}>📅 Select Date for Menu:</label>
            <input 
              type="date" 
              value={dashboardMenuDate} 
              onChange={e => setDashboardMenuDate(e.target.value)} 
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600, fontSize: '0.9rem', color: '#334155', outline: 'none' }}
            />
          </div>

          {/* Blocks Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            {blocks.map((block, idx) => {
              const menu = getMenuForDate(block.name, dashboardMenuDate) || todayMenus[block.name];

              return (
                <div key={block.name} style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
                  
                  {/* Card Header */}
                  <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{block.name}</h3>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                        {block.gender === 'boys' ? '♂️ Boys Section' : '♀️ Girls Section'}
                      </span>
                    </div>
                  </div>

                  {/* Card Details */}
                  <div style={{ padding: '20px' }}>
                    {/* Today's Menu */}
                    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#475569', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        📅 Menu for {dashboardMenuDate}
                      </h4>

                      {/* Boys Day Scholar Spec Rule */}
                      {block.name === 'Boys Day Scholar' ? (
                        <div>
                          <div style={{ fontSize: '0.8rem', color: '#b45309', background: '#fef3c7', padding: '6px 10px', borderRadius: '6px', fontWeight: 600, display: 'inline-block', marginBottom: '8px' }}>
                            ⚠️ Only Lunch served for Day Scholars
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#1e293b' }}>
                            <strong>Lunch:</strong> {(menu || {}).lunch || 'Not Available'}
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                          <div><strong>Breakfast:</strong> <span style={{ color: '#475569' }}>{(menu || {}).breakfast || 'Not Available'}</span></div>
                          <div><strong>Lunch:</strong> <span style={{ color: '#475569' }}>{(menu || {}).lunch || 'Not Available'}</span></div>
                          <div><strong>Dinner:</strong> <span style={{ color: '#475569' }}>{(menu || {}).dinner || 'Not Available'}</span></div>
                        </div>
                      )}
                    </div>


                  </div>
                </div>
              );
            })}
          </div>

          {/* Satisfaction Trends & Remarks */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            {/* Line Chart */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 800 }}>📈 Food Satisfaction Trends (May)</h3>
              <div style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={satisfactionData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => val.slice(8)} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '10px' }} />
                    <Line type="monotone" dataKey="Yes" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="No" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Remarks Section */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 800 }}>💬 Feedback Remarks</h3>
              
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '200px', paddingRight: '4px' }}>
                {remarksList.map(r => (
                  <div key={r.id} style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #4f46e5' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>{r.date} &bull; {r.block}</div>
                    <div style={{ fontSize: '0.85rem', color: '#1e293b' }}>{r.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ---------------------------------------------------------------------------------- */}
      {/* TAB 2: EQUIPMENT HEALTH MANAGEMENT */}
      {/* ---------------------------------------------------------------------------------- */}
      {activeTab === 'equipment' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          
          {/* Filter Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px 20px', borderRadius: '16px', marginBottom: '24px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                Select Mess Block:
                <select
                  value={selectedBlockEquip}
                  onChange={e => setSelectedBlockEquip(e.target.value)}
                  style={{ marginLeft: '8px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600 }}
                >
                  <option value="Boys Day Scholar">Boys Day Scholar</option>
                  <option value="Boys Hostel">Boys Hostel</option>
                  <option value="Girls">Girls</option>
                </select>
              </label>

              <input
                type="text"
                placeholder="🔍 Search equipment..."
                value={equipSearch}
                onChange={e => setEquipSearch(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', minWidth: '220px' }}
              />

              <select
                value={equipFilterStatus}
                onChange={e => setEquipFilterStatus(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600 }}
              >
                <option value="all">All Statuses</option>
                <option value="Working">Working</option>
                <option value="Partial Working">Partial Working</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Not Working">Not Working</option>
              </select>
            </div>

            <button
              onClick={() => setShowAddEquipModal(true)}
              style={{ background: '#4f46e5', color: '#ffffff', border: 'none', padding: '9px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              ➕ Add Equipment
            </button>
          </div>

          {/* Equipment Grid Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {filteredEquipment.map(item => (
              <div key={item.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', position: 'relative', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>{item.name}</h4>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 8px', borderRadius: '6px', background: `${STATUS_COLORS[item.status]}15', color: STATUS_COLORS[item.status]` }}>
                      {item.status}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px', background: '#f8fafc', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Total</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{item.total}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 500 }}>Working</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#166534' }}>{item.working}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 500 }}>Damaged</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#991b1b' }}>{item.damaged}</div>
                    </div>
                  </div>
                </div>

                {/* Adjustment Buttons */}
                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <button
                    onClick={() => handleQuickStatusAdjust(selectedBlockEquip, item.id, 1, 0)}
                    style={{ flex: 1, padding: '6px 0', border: '1px solid #cbd5e1', background: '#ffffff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                  >
                    🟢 Add Working
                  </button>
                  <button
                    onClick={() => handleQuickStatusAdjust(selectedBlockEquip, item.id, 0, 1)}
                    style={{ flex: 1, padding: '6px 0', border: '1px solid #fca5a5', background: '#fff5f5', color: '#b91c1c', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                  >
                    🔴 Add Damaged
                  </button>
                </div>
              </div>
            ))}

            {filteredEquipment.length === 0 && (
              <div style={{ gridColumn: '1 / -1', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#64748b' }}>
                🫙 No equipment items match the current search filters.
              </div>
            )}
          </div>

          {/* Add Equipment Modal */}
          {showAddEquipModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <form onSubmit={handleAddEquipment} style={{ background: '#ffffff', borderRadius: '16px', width: '90%', maxWidth: '440px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontWeight: 800, fontSize: '1.25rem' }}>➕ Add New Equipment</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '18px' }}>Add inventory to <strong>{selectedBlockEquip}</strong> block.</p>
                
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '12px' }}>
                  Equipment Name *
                  <input
                    type="text"
                    required
                    value={newEquip.name}
                    onChange={e => setNewEquip({ ...newEquip, name: e.target.value })}
                    placeholder="e.g. Grinder, Oven, Stove"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', marginTop: '4px' }}
                  />
                </label>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <label style={{ flex: 1, fontSize: '0.8rem', fontWeight: 700 }}>
                    Working Qty
                    <input
                      type="number"
                      min="0"
                      value={newEquip.working}
                      onChange={e => setNewEquip({ ...newEquip, working: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', marginTop: '4px' }}
                    />
                  </label>
                  <label style={{ flex: 1, fontSize: '0.8rem', fontWeight: 700 }}>
                    Damaged Qty
                    <input
                      type="number"
                      min="0"
                      value={newEquip.damaged}
                      onChange={e => setNewEquip({ ...newEquip, damaged: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', marginTop: '4px' }}
                    />
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddEquipModal(false)}
                    style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, color: '#475569' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ background: '#4f46e5', color: '#ffffff', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                  >
                    Add Item
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      )}

      {/* ---------------------------------------------------------------------------------- */}
      {/* TAB 3: FOOD WASTE ANALYTICS */}
      {/* ---------------------------------------------------------------------------------- */}
      {activeTab === 'waste' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>

          {/* Block Selection Toggle */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 700 }}>
              Analyze Waste for Block:
              <select
                value={selectedBlockWaste}
                onChange={e => setSelectedBlockWaste(e.target.value)}
                style={{ marginLeft: '10px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600 }}
              >
                <option value="Boys Day Scholar">Boys Day Scholar</option>
                <option value="Boys Hostel">Boys Hostel</option>
                <option value="Girls">Girls</option>
              </select>
            </label>

            {/* Quick Metrics Bar */}
            {summaryMetrics && (
              <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem' }}>
                <div>Avg Weekly: <strong>{summaryMetrics.avgWeekly} KG</strong></div>
                <div style={{ color: '#b91c1c' }}>Peak: <strong>{summaryMetrics.highestVal} KG</strong> ({summaryMetrics.highestDay})</div>
                <div style={{ color: '#166534' }}>Low: <strong>{summaryMetrics.leastVal} KG</strong> ({summaryMetrics.leastDay})</div>
              </div>
            )}
          </div>

          {/* Charts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            
            {/* Chart 1: Day-wise waste */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800 }}>📈 Day-wise Food Waste (KG) - May 2026</h4>
              <div style={{ height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dayWiseWasteChartData}>
                    <defs>
                      <linearGradient id="colorWaste" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip labelFormatter={(v) => `May ${v}`} />
                    <Area type="monotone" dataKey="Total" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorWaste)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Week-wise comparison */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800 }}>📊 Weekly Average Waste Comparison (KG)</h4>
              <div style={{ height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekWiseChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Total" fill="#10b981" name="Average Waste (KG)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Meal-wise waste analysis */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800 }}>🥯 Meal-wise Waste Analysis (Total KG)</h4>
              <div style={{ height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={mealWiseWasteData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {mealWiseWasteData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} KG`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Meal Stacked daily breakdown */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800 }}>🥞 Stacked Meal Waste Breakdown</h4>
              <div style={{ height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayWiseWasteChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Breakfast" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="Lunch" stackId="a" fill="#10b981" />
                    <Bar dataKey="Dinner" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ---------------------------------------------------------------------------------- */}
      {/* TAB 4: DETAILED COMPARISONS PANEL */}
      {/* ---------------------------------------------------------------------------------- */}
      {activeTab === 'comparisons' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px 20px', borderRadius: '16px', marginBottom: '24px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 700 }}>
              Select Active Mess Block:
              <select
                value={selectedBlockWaste}
                onChange={e => setSelectedBlockWaste(e.target.value)}
                style={{ marginLeft: '10px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600 }}
              >
                <option value="Boys Day Scholar">Boys Day Scholar</option>
                <option value="Boys Hostel">Boys Hostel</option>
                <option value="Girls">Girls</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* Day of Week vs Day of Week Comparison */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '1.05rem', fontWeight: 800 }}>📅 Day-of-Week Comparison</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>Compare logs of matching weekdays (e.g. Tuesday vs Tuesday) to isolate weekday anomalies.</p>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                  Select Day of Week:
                  <select
                    value={compDayOfWeek}
                    onChange={e => handleDayOfWeekChange(e.target.value)}
                    style={{ marginLeft: '8px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600 }}
                  >
                    <option value="Mon">Monday</option>
                    <option value="Tue">Tuesday</option>
                    <option value="Wed">Wednesday</option>
                    <option value="Thu">Thursday</option>
                    <option value="Fri">Friday</option>
                    <option value="Sat">Saturday</option>
                    <option value="Sun">Sunday</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <label style={{ flex: 1, fontSize: '0.75rem', fontWeight: 700 }}>
                  Select First Date ({compDayOfWeek}):
                  <select
                    value={compDateLeft}
                    onChange={e => setCompDateLeft(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  >
                    {filteredCompDates.map(d => (
                      <option key={d.date} value={d.date}>
                        {d.date} (May {d.dayNum})
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ flex: 1, fontSize: '0.75rem', fontWeight: 700 }}>
                  Compare to Date ({compDayOfWeek}):
                  <select
                    value={compDateRight}
                    onChange={e => setCompDateRight(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  >
                    {filteredCompDates.map(d => (
                      <option key={d.date} value={d.date}>
                        {d.date} (May {d.dayNum})
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {dayOfWeekComparisonResult && (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Date {dayOfWeekComparisonResult.left.date} total</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{dayOfWeekComparisonResult.left.total} KG</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Date {dayOfWeekComparisonResult.right.date} total</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{dayOfWeekComparisonResult.right.total} KG</div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Variance:</span>
                    <span style={{ fontWeight: 800, color: dayOfWeekComparisonResult.diff > 0 ? '#ef4444' : '#10b981' }}>
                      {dayOfWeekComparisonResult.diff > 0 ? `+${dayOfWeekComparisonResult.diff}` : dayOfWeekComparisonResult.diff} KG ({dayOfWeekComparisonResult.pct > 0 ? `+${dayOfWeekComparisonResult.pct}` : dayOfWeekComparisonResult.pct}%)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Custom Day vs Day Comparison */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '1.05rem', fontWeight: 800 }}>📅 Custom Day Comparison</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>Compare details of any custom days side-by-side.</p>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <label style={{ flex: 1, fontSize: '0.75rem', fontWeight: 700 }}>
                  First Day:
                  <input
                    type="date"
                    min="2026-05-01"
                    max="2026-05-31"
                    value={compDayLeft}
                    onChange={e => setCompDayLeft(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  />
                </label>
                <label style={{ flex: 1, fontSize: '0.75rem', fontWeight: 700 }}>
                  Second Day:
                  <input
                    type="date"
                    min="2026-05-01"
                    max="2026-05-31"
                    value={compDayRight}
                    onChange={e => setCompDayRight(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  />
                </label>
              </div>

              {customDayComparisonResult && (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <h5 style={{ margin: '0 0 8px 0', color: '#4f46e5' }}>May {customDayComparisonResult.left.dayNum} ({customDayComparisonResult.left.dayOfWeek})</h5>
                    <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>Breakfast: <strong>{customDayComparisonResult.left.breakfast} KG</strong></div>
                      <div>Lunch: <strong>{customDayComparisonResult.left.lunch} KG</strong></div>
                      <div>Dinner: <strong>{customDayComparisonResult.left.dinner} KG</strong></div>
                      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '4px', marginTop: '4px' }}>Total: <strong>{customDayComparisonResult.left.total} KG</strong></div>
                    </div>
                  </div>
                  <div style={{ borderLeft: '1px dashed #cbd5e1', paddingLeft: '12px' }}>
                    <h5 style={{ margin: '0 0 8px 0', color: '#10b981' }}>May {customDayComparisonResult.right.dayNum} ({customDayComparisonResult.right.dayOfWeek})</h5>
                    <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>Breakfast: <strong>{customDayComparisonResult.right.breakfast} KG</strong></div>
                      <div>Lunch: <strong>{customDayComparisonResult.right.lunch} KG</strong></div>
                      <div>Dinner: <strong>{customDayComparisonResult.right.dinner} KG</strong></div>
                      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '4px', marginTop: '4px' }}>Total: <strong>{customDayComparisonResult.right.total} KG</strong></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Weekly Comparison */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '1.05rem', fontWeight: 800 }}>📅 Weekly Trends Comparison</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>Compare average weekly metrics across May 2026.</p>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <label style={{ flex: 1, fontSize: '0.75rem', fontWeight: 700 }}>
                  Week A:
                  <select
                    value={compWeekLeft}
                    onChange={e => setCompWeekLeft(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  >
                    <option value="W1">Week 1 (1-7)</option>
                    <option value="W2">Week 2 (8-14)</option>
                    <option value="W3">Week 3 (15-21)</option>
                    <option value="W4">Week 4 (22-28)</option>
                    <option value="W5">Week 5 (29-31)</option>
                  </select>
                </label>
                <label style={{ flex: 1, fontSize: '0.75rem', fontWeight: 700 }}>
                  Week B:
                  <select
                    value={compWeekRight}
                    onChange={e => setCompWeekRight(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  >
                    <option value="W1">Week 1 (1-7)</option>
                    <option value="W2">Week 2 (8-14)</option>
                    <option value="W3">Week 3 (15-21)</option>
                    <option value="W4">Week 4 (22-28)</option>
                    <option value="W5">Week 5 (29-31)</option>
                  </select>
                </label>
              </div>

              {weeklyCompResult && (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>{weeklyCompResult.leftName} Avg:</span>
                    <strong>{weeklyCompResult.leftVal} KG / day</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>{weeklyCompResult.rightName} Avg:</span>
                    <strong>{weeklyCompResult.rightVal} KG / day</strong>
                  </div>
                  <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '8px', marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Difference:</span>
                    <strong style={{ color: weeklyCompResult.leftVal > weeklyCompResult.rightVal ? '#ef4444' : '#10b981' }}>
                      {weeklyCompResult.leftVal - weeklyCompResult.rightVal} KG/day
                    </strong>
                  </div>
                </div>
              )}
            </div>

            {/* Block vs Block Comparison */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '1.05rem', fontWeight: 800 }}>🏢 Facility comparison (Block vs Block)</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>Compare total waste outputs between different hostels side-by-side.</p>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <label style={{ flex: 1, fontSize: '0.75rem', fontWeight: 700 }}>
                  Facility A:
                  <select
                    value={compBlockLeft}
                    onChange={e => setCompBlockLeft(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  >
                    <option value="Boys Day Scholar">Boys Day Scholar</option>
                    <option value="Boys Hostel">Boys Hostel</option>
                    <option value="Girls">Girls</option>
                  </select>
                </label>
                <label style={{ flex: 1, fontSize: '0.75rem', fontWeight: 700 }}>
                  Facility B:
                  <select
                    value={compBlockRight}
                    onChange={e => setCompBlockRight(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  >
                    <option value="Boys Day Scholar">Boys Day Scholar</option>
                    <option value="Boys Hostel">Boys Hostel</option>
                    <option value="Girls">Girls</option>
                  </select>
                </label>
              </div>

              {blockCompResult && (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <h5 style={{ margin: '0 0 8px 0', color: '#4f46e5' }}>{blockCompResult.leftName}</h5>
                    <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>Today: <strong>{blockCompResult.leftToday} KG</strong></div>
                      <div>Monthly: <strong>{blockCompResult.leftTotal} KG</strong></div>
                      <div>Daily Avg: <strong>{blockCompResult.leftAvg} KG</strong></div>
                    </div>
                  </div>
                  <div style={{ borderLeft: '1px dashed #cbd5e1', paddingLeft: '12px' }}>
                    <h5 style={{ margin: '0 0 8px 0', color: '#10b981' }}>{blockCompResult.rightName}</h5>
                    <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>Today: <strong>{blockCompResult.rightToday} KG</strong></div>
                      <div>Monthly: <strong>{blockCompResult.rightTotal} KG</strong></div>
                      <div>Daily Avg: <strong>{blockCompResult.rightAvg} KG</strong></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Monthly comparison trends chart */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginTop: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800 }}>📉 Monthly Trends: Current Month (May) vs Last Month (April Averages)</h4>
            <div style={{ height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Boys Day Scholar', April: aprilAverages['Boys Day Scholar'], May: getMonthlyTotalAndAverage(wasteLogs, 'Boys Day Scholar').avg },
                    { name: 'Boys Hostel', April: aprilAverages['Boys Hostel'], May: getMonthlyTotalAndAverage(wasteLogs, 'Boys Hostel').avg },
                    { name: 'Girls', April: aprilAverages['Girls'], May: getMonthlyTotalAndAverage(wasteLogs, 'Girls').avg },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="April" fill="#94a3b8" name="April Avg Waste (KG)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="May" fill="#4f46e5" name="May Avg Waste (KG)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* ---------------------------------------------------------------------------------- */}
      {/* TAB 5: MONTH-WISE VIEW */}
      {/* ---------------------------------------------------------------------------------- */}
      {activeTab === 'monthly' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          
          {/* Header Month Selector */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px 20px', borderRadius: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                Select Billing Month:
                <select
                  value={selectedReportMonth}
                  onChange={e => setSelectedReportMonth(e.target.value)}
                  style={{ marginLeft: '8px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600 }}
                >
                  <option value="May 2026">May 2026</option>
                  <option value="April 2026">April 2026 (Archived)</option>
                  <option value="March 2026">March 2026 (Archived)</option>
                </select>
              </label>

              <label style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                Block:
                <select
                  value={selectedBlockWaste}
                  onChange={e => setSelectedBlockWaste(e.target.value)}
                  style={{ marginLeft: '8px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600 }}
                >
                  <option value="Boys Day Scholar">Boys Day Scholar</option>
                  <option value="Boys Hostel">Boys Hostel</option>
                  <option value="Girls">Girls</option>
                </select>
              </label>
            </div>

            <button
              onClick={() => window.print()}
              style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}
            >
              🖨️ Export PDF
            </button>
          </div>

          {/* Month Overview Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Monthly Total Waste</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#4f46e5', marginTop: '6px' }}>
                {getMonthlyTotalAndAverage(wasteLogs, selectedBlockWaste).total.toLocaleString()} KG
              </div>
            </div>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Daily Average Waste</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', marginTop: '6px' }}>
                {getMonthlyTotalAndAverage(wasteLogs, selectedBlockWaste).avg} KG / day
              </div>
            </div>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Equipment Maintenance Tickets</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b', marginTop: '6px' }}>
                {(equipmentList[selectedBlockWaste] || []).filter(e => e.status !== 'Working').length} Active
              </div>
            </div>
          </div>

          {/* Month Report Table */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
            <div style={{ background: '#f8fafc', padding: '14px 20px', borderBottom: '1px solid #e2e8f0', fontWeight: 800, fontSize: '0.9rem' }}>
              📋 Monthly Food Waste Log - {selectedReportMonth}
            </div>
            <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#fff', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 20px' }}>Date</th>
                    <th style={{ padding: '12px 20px' }}>Day</th>
                    <th style={{ padding: '12px 20px' }}>Breakfast Waste</th>
                    <th style={{ padding: '12px 20px' }}>Lunch Waste</th>
                    <th style={{ padding: '12px 20px' }}>Dinner Waste</th>
                    <th style={{ padding: '12px 20px' }}>Total Waste</th>
                    <th style={{ padding: '12px 20px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {((wasteLogs || {})[selectedBlockWaste] || []).map(row => (
                    <tr key={row.date} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 20px', fontWeight: 700 }}>{row.date}</td>
                      <td style={{ padding: '10px 20px', color: '#475569' }}>{row.dayOfWeek}</td>
                      <td style={{ padding: '10px 20px' }}>{row.breakfast} KG</td>
                      <td style={{ padding: '10px 20px' }}>{row.lunch} KG</td>
                      <td style={{ padding: '10px 20px' }}>{row.dinner} KG</td>
                      <td style={{ padding: '10px 20px', fontWeight: 700, color: '#4f46e5' }}>{row.total} KG</td>
                      <td style={{ padding: '10px 20px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: row.total > 100 ? '#fef2f2' : '#f0fdf4', color: row.total > 100 ? '#ef4444' : '#10b981' }}>
                          {row.total > 100 ? 'High' : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Month Menu Table */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)', marginTop: '24px' }}>
            <div style={{ background: '#f8fafc', padding: '14px 20px', borderBottom: '1px solid #e2e8f0', fontWeight: 800, fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📋 Monthly Menu - {selectedReportMonth}</span>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#fff', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 20px' }}>Date</th>
                    <th style={{ padding: '12px 20px' }}>Day</th>
                    <th style={{ padding: '12px 20px' }}>Breakfast</th>
                    <th style={{ padding: '12px 20px' }}>Lunch</th>
                    <th style={{ padding: '12px 20px' }}>Dinner</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const [monthName, year] = selectedReportMonth.split(' ');
                    const monthMap = { 'Jan': '01', 'Feb': '02', 'Mar': '03', 'April': '04', 'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12' };
                    const monthNum = monthMap[monthName] || monthMap[monthName.substring(0,3)];
                    const monthYearStr = monthNum && year ? `${year}-${monthNum}` : '';
                    const menuRow = menusList.find(m => m.blockName === selectedBlockWaste && m.monthYear === monthYearStr);
                    let menuArray = [];
                    if (menuRow && menuRow.menuJSON) {
                      try { menuArray = JSON.parse(menuRow.menuJSON); } catch(e) {}
                    }
                    if (menuArray.length === 0) {
                      return (
                        <tr>
                          <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                            No menu data found for {selectedReportMonth} ({selectedBlockWaste}).
                          </td>
                        </tr>
                      );
                    }
                    return menuArray.map(row => (
                      <tr key={row.date} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 20px', fontWeight: 700 }}>{row.date}</td>
                        <td style={{ padding: '10px 20px', color: '#475569' }}>{row.day}</td>
                        <td style={{ padding: '10px 20px' }}>{Array.isArray(row.breakfast) ? row.breakfast.join(', ') : row.breakfast}</td>
                        <td style={{ padding: '10px 20px' }}>{Array.isArray(row.lunch) ? row.lunch.join(', ') : row.lunch}</td>
                        <td style={{ padding: '10px 20px' }}>{Array.isArray(row.dinner) ? row.dinner.join(', ') : row.dinner}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
