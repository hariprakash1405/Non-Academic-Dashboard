import React, { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
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

  const [staffList, setStaffList] = useState({});
  const [selectedBlockStaff, setSelectedBlockStaff] = useState('Boys Hostel');
  const [staffSearch, setStaffSearch] = useState('');

  const [wasteLogs, setWasteLogs] = useState({});
  const [selectedBlockWaste, setSelectedBlockWaste] = useState('Boys Hostel');
  const [analyticsMonth, setAnalyticsMonth] = useState('May 2026');
  const [analyticsMeal, setAnalyticsMeal] = useState('All Meals');
  const [analyticsPieDay, setAnalyticsPieDay] = useState('All Month');

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
        const res = await fetch('/api/mess/data');
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

          if (data.staff) {
            const groupedStaff = { 'Boys Day Scholar': [], 'Boys Hostel': [], 'Girls': [] };
            data.staff.forEach(s => {
              if (!groupedStaff[s.blockName]) groupedStaff[s.blockName] = [];
              groupedStaff[s.blockName].push(s);
            });
            setStaffList(groupedStaff);
          }

          let groupedLogs = generateWasteLogs();
          if (data.wasteLogs && data.wasteLogs.length > 0) {
            data.wasteLogs.forEach(l => {
              if (!l.blockName) return;
              const d = new Date(l.date);
              const dayOfWeek = d.toLocaleDateString('en-US', {weekday: 'short'}); // 'Mon', etc.
              const dayNum = d.getDate();
              const log = { ...l, date: l.date.split('T')[0], dayNum, dayOfWeek };
              if (!groupedLogs[l.blockName]) groupedLogs[l.blockName] = [];
              const existingIdx = groupedLogs[l.blockName].findIndex(x => x.date === log.date);
              if (existingIdx >= 0) {
                groupedLogs[l.blockName][existingIdx] = log;
              } else {
                groupedLogs[l.blockName].push(log);
              }
            });
          }
          setWasteLogs(groupedLogs);

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
  const [compWeeklyMonth, setCompWeeklyMonth] = useState('May 2026');
  const [compFacilityMonth, setCompFacilityMonth] = useState('May 2026');
  const [compDayOfWeekMonth, setCompDayOfWeekMonth] = useState('May 2026');

  // --- Month selector State ---
  const [selectedReportMonth, setSelectedReportMonth] = useState('May 2026');

  const availableMonths = useMemo(() => {
    const months = new Set();
    Object.values(wasteLogs).forEach(logs => {
      logs.forEach(l => {
        if (!l.date) return;
        const d = new Date(l.date);
        if (!isNaN(d.getTime())) {
          months.add(d.toLocaleString('default', { month: 'long', year: 'numeric' }));
        }
      });
    });
    const arr = Array.from(months);
    if (arr.length === 0) arr.push('May 2026');
    return arr.sort((a, b) => new Date(b) - new Date(a));
  }, [wasteLogs]);

  useEffect(() => {
    if (availableMonths.length > 0) {
      if (!availableMonths.includes(analyticsMonth)) setAnalyticsMonth(availableMonths[0]);
      if (!availableMonths.includes(compWeeklyMonth)) setCompWeeklyMonth(availableMonths[0]);
      if (!availableMonths.includes(compFacilityMonth)) setCompFacilityMonth(availableMonths[0]);
      if (!availableMonths.includes(compDayOfWeekMonth)) setCompDayOfWeekMonth(availableMonths[0]);
      if (!availableMonths.includes(selectedReportMonth)) setSelectedReportMonth(availableMonths[0]);
    }
  }, [availableMonths, analyticsMonth, compWeeklyMonth, compFacilityMonth, compDayOfWeekMonth, selectedReportMonth]);

  const getLogsForMonth = (blockName, monthStr) => {
    const logs = wasteLogs[blockName] || [];
    return logs.filter(l => {
      if (!l.date) return false;
      const d = new Date(l.date);
      if (isNaN(d.getTime())) return false;
      return d.toLocaleString('default', { month: 'long', year: 'numeric' }) === monthStr;
    });
  };

  // Helper to filter dates matching selected day of the week
  const filteredCompDates = useMemo(() => {
    const logs = getLogsForMonth(selectedBlockWaste, compDayOfWeekMonth);
    return logs.filter(l => l.dayOfWeek === compDayOfWeek).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [wasteLogs, selectedBlockWaste, compDayOfWeek, compDayOfWeekMonth]);

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

  const handleExportPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(18);
    doc.text(`Mess & Dining Full Log - ${selectedReportMonth}`, pageWidth / 2, 15, { align: 'center' });
    
    let currentY = 25;

    const chartsElement = document.getElementById('charts-grid-capture');
    if (chartsElement) {
      try {
        const canvas = await html2canvas(chartsElement, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        
        const imgWidth = pageWidth - 28;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(`Visual Analytics (Current: ${selectedBlockWaste})`, 14, currentY);
        currentY += 8;
        
        doc.addImage(imgData, 'PNG', 14, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 15;
      } catch (err) {
        console.error("Failed to capture charts:", err);
      }
    }

    const categories = ['Boys Day Scholar', 'Boys Hostel', 'Girls'];

    categories.forEach((blockName, idx) => {
      if (idx > 0) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`Category: ${blockName}`, 14, currentY);
      currentY += 10;

      doc.setFontSize(12);
      doc.text('Monthly Food Waste Log', 14, currentY);
      currentY += 5;

      const blockLogs = wasteLogs[blockName] || [];
      const occ = (blocks.find(b => b.name === blockName) || {}).occupied || 1;

      const wasteBody = blockLogs.map(l => {
        const bCount = l.breakfastCount > 0 ? l.breakfastCount : occ;
        const lCount = l.lunchCount > 0 ? l.lunchCount : occ;
        const dCount = l.dinnerCount > 0 ? l.dinnerCount : occ;
        const tCount = (bCount + lCount + dCount) / 3;
        return [
          l.date,
          l.dayOfWeek,
          `${l.breakfast} KG (${Math.round((l.breakfast * 1000) / bCount)}g/head)`,
          `${l.lunch} KG (${Math.round((l.lunch * 1000) / lCount)}g/head)`,
          `${l.dinner} KG (${Math.round((l.dinner * 1000) / dCount)}g/head)`,
          `${l.total} KG (${Math.round((l.total * 1000) / tCount)}g/head)`
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [['Date', 'Day', 'Breakfast', 'Lunch', 'Dinner', 'Total']],
        body: wasteBody,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8 }
      });
      currentY = doc.lastAutoTable.finalY + 15;

      doc.setFontSize(12);
      doc.text('Monthly Food Menu', 14, currentY);
      currentY += 5;

      const [monthName, year] = selectedReportMonth.split(' ');
      const monthMap = { 'Jan': '01', 'Feb': '02', 'Mar': '03', 'April': '04', 'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12' };
      const monthNum = monthMap[monthName] || monthMap[monthName.substring(0,3)];
      const monthYearStr = monthNum && year ? `${year}-${monthNum}` : '';
      
      const menuRow = menusList.find(m => m.blockName === blockName && m.monthYear === monthYearStr);
      let menuArray = [];
      if (menuRow && menuRow.menuJSON) {
        try { menuArray = JSON.parse(menuRow.menuJSON); } catch(e) {}
      }

      if (menuArray.length > 0) {
        const menuBody = menuArray.map(m => [
          m.date, m.day, m.breakfast || '-', m.lunch || '-', m.dinner || '-'
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [['Date', 'Day', 'Breakfast Menu', 'Lunch Menu', 'Dinner Menu']],
          body: menuBody,
          theme: 'grid',
          headStyles: { fillColor: [16, 185, 129] },
          styles: { fontSize: 8 },
          columnStyles: {
            2: { cellWidth: 45 },
            3: { cellWidth: 45 },
            4: { cellWidth: 45 }
          }
        });
      } else {
        doc.setFontSize(10);
        doc.text('No menu data found for this category/month.', 14, currentY + 5);
      }
    });

    doc.save(`Mess_Log_${selectedReportMonth.replace(' ', '_')}.pdf`);
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

  // Filtered Staff List
  const filteredStaff = useMemo(() => {
    const list = staffList[selectedBlockStaff] || [];
    return list.filter(item => {
      return item.name.toLowerCase().includes(staffSearch.toLowerCase()) || 
             item.role.toLowerCase().includes(staffSearch.toLowerCase());
    });
  }, [staffList, selectedBlockStaff, staffSearch]);

  // (Helper functions moved outside of component body)

  // Recharts: Day-wise food waste chart data
  const dayWiseWasteChartData = useMemo(() => {
    const logs = getLogsForMonth(selectedBlockWaste, analyticsMonth);
    const occ = (blocks.find(b => b.name === selectedBlockWaste) || {}).occupied || 1;
    return logs.map(l => {
      let bCount = l.breakfastCount > 0 ? l.breakfastCount : occ;
      let lCount = l.lunchCount > 0 ? l.lunchCount : occ;
      let dCount = l.dinnerCount > 0 ? l.dinnerCount : occ;
      let tCount = (bCount + lCount + dCount) / 3;

      let val = l.total;
      let vCount = tCount;
      if (analyticsMeal === 'Breakfast') { val = l.breakfast; vCount = bCount; }
      else if (analyticsMeal === 'Lunch') { val = l.lunch; vCount = lCount; }
      else if (analyticsMeal === 'Dinner') { val = l.dinner; vCount = dCount; }

      return {
        day: l.dayNum,
        date: l.date,
        Breakfast: Math.round((l.breakfast * 1000) / bCount),
        Lunch: Math.round((l.lunch * 1000) / lCount),
        Dinner: Math.round((l.dinner * 1000) / dCount),
        Total: Math.round((l.total * 1000) / tCount),
        SelectedValue: Math.round((val * 1000) / vCount),
      };
    });
  }, [wasteLogs, selectedBlockWaste, blocks, analyticsMeal, analyticsMonth]);

  // Recharts: Week-wise comparison chart data
  const weekWiseChartData = useMemo(() => {
    const logs = getLogsForMonth(selectedBlockWaste, analyticsMonth);
    const weeks = [
      { name: 'Week 1 (1-7)', Breakfast: 0, Lunch: 0, Dinner: 0, Total: 0, bCountSum: 0, lCountSum: 0, dCountSum: 0, count: 0 },
      { name: 'Week 2 (8-14)', Breakfast: 0, Lunch: 0, Dinner: 0, Total: 0, bCountSum: 0, lCountSum: 0, dCountSum: 0, count: 0 },
      { name: 'Week 3 (15-21)', Breakfast: 0, Lunch: 0, Dinner: 0, Total: 0, bCountSum: 0, lCountSum: 0, dCountSum: 0, count: 0 },
      { name: 'Week 4 (22-28)', Breakfast: 0, Lunch: 0, Dinner: 0, Total: 0, bCountSum: 0, lCountSum: 0, dCountSum: 0, count: 0 },
      { name: 'Week 5 (29-31)', Breakfast: 0, Lunch: 0, Dinner: 0, Total: 0, bCountSum: 0, lCountSum: 0, dCountSum: 0, count: 0 },
    ];

    const occ = (blocks.find(b => b.name === selectedBlockWaste) || {}).occupied || 1;

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
      weeks[wIdx].bCountSum += l.breakfastCount > 0 ? l.breakfastCount : occ;
      weeks[wIdx].lCountSum += l.lunchCount > 0 ? l.lunchCount : occ;
      weeks[wIdx].dCountSum += l.dinnerCount > 0 ? l.dinnerCount : occ;
      weeks[wIdx].count += 1;
    });

    return weeks.map(w => {
      let bCountAvg = w.bCountSum / (w.count || 1);
      let lCountAvg = w.lCountSum / (w.count || 1);
      let dCountAvg = w.dCountSum / (w.count || 1);
      let tCountAvg = (bCountAvg + lCountAvg + dCountAvg) / 3;

      let val = w.Total;
      let vCount = tCountAvg;
      if (analyticsMeal === 'Breakfast') { val = w.Breakfast; vCount = bCountAvg; }
      else if (analyticsMeal === 'Lunch') { val = w.Lunch; vCount = lCountAvg; }
      else if (analyticsMeal === 'Dinner') { val = w.Dinner; vCount = dCountAvg; }
      
      return {
        name: w.name,
        Breakfast: Math.round(((w.Breakfast / (w.count || 1)) * 1000) / (bCountAvg || 1)),
        Lunch: Math.round(((w.Lunch / (w.count || 1)) * 1000) / (lCountAvg || 1)),
        Dinner: Math.round(((w.Dinner / (w.count || 1)) * 1000) / (dCountAvg || 1)),
        Total: Math.round(((w.Total / (w.count || 1)) * 1000) / (tCountAvg || 1)),
        SelectedValue: Math.round(((val / (w.count || 1)) * 1000) / (vCount || 1)),
      };
    });
  }, [wasteLogs, selectedBlockWaste, blocks, analyticsMeal, analyticsMonth]);

  // Recharts: Block-wise comparison (Total Waste for May)
  const blockComparisonData = useMemo(() => {
    return Object.keys(wasteLogs).map(blockName => {
      const logs = getLogsForMonth(blockName, analyticsMonth);
      const total = logs.reduce((acc, curr) => acc + curr.total, 0);
      return { name: blockName, value: total };
    });
  }, [wasteLogs, analyticsMonth]);

  // Recharts: Meal-wise total waste analysis
  const mealWiseWasteData = useMemo(() => {
    let logs = getLogsForMonth(selectedBlockWaste, analyticsMonth);
    if (analyticsPieDay !== 'All Month') {
      logs = logs.filter(l => l.date === analyticsPieDay);
    }
    const occ = (blocks.find(b => b.name === selectedBlockWaste) || {}).occupied || 1;
    let bTotal = 0, lTotal = 0, dTotal = 0;
    let bCountSum = 0, lCountSum = 0, dCountSum = 0;
    logs.forEach(l => {
      bTotal += l.breakfast;
      lTotal += l.lunch;
      dTotal += l.dinner;
      bCountSum += l.breakfastCount > 0 ? l.breakfastCount : occ;
      lCountSum += l.lunchCount > 0 ? l.lunchCount : occ;
      dCountSum += l.dinnerCount > 0 ? l.dinnerCount : occ;
    });
    const days = logs.length || 1;
    return [
      { name: 'Breakfast', value: Math.round(((bTotal / days) * 1000) / (bCountSum / days || 1)) },
      { name: 'Lunch', value: Math.round(((lTotal / days) * 1000) / (lCountSum / days || 1)) },
      { name: 'Dinner', value: Math.round(((dTotal / days) * 1000) / (dCountSum / days || 1)) },
    ];
  }, [wasteLogs, selectedBlockWaste, blocks, analyticsPieDay, analyticsMonth]);

  // Day of Week Comparison Calculation
  const dayOfWeekComparisonResult = useMemo(() => {
    const logs = wasteLogs[selectedBlockWaste] || [];
    
    const getEmptyRec = (dateStr) => {
      const d = new Date(dateStr);
      return {
        date: dateStr,
        dayNum: d.getDate() || 1,
        dayOfWeek: isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        breakfast: 0, lunch: 0, dinner: 0, total: 0
      };
    };

    let leftRec = logs.find(l => l.date === compDateLeft);
    let rightRec = logs.find(l => l.date === compDateRight);

    if (!compDateLeft || !compDateRight) return null;
    
    if (!leftRec) leftRec = getEmptyRec(compDateLeft);
    if (!rightRec) rightRec = getEmptyRec(compDateRight);

    const diff = leftRec.total - rightRec.total;
    const pct = rightRec.total > 0 ? Math.round((diff / rightRec.total) * 100) : (leftRec.total > 0 ? 100 : 0);

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
    
    const getEmptyRec = (dateStr) => {
      const d = new Date(dateStr);
      return {
        date: dateStr,
        dayNum: d.getDate() || 1,
        dayOfWeek: isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        breakfast: 0, lunch: 0, dinner: 0, total: 0
      };
    };

    let leftRec = logs.find(l => l.date === compDayLeft);
    let rightRec = logs.find(l => l.date === compDayRight);

    if (!compDayLeft || !compDayRight) return null;
    
    if (!leftRec) leftRec = getEmptyRec(compDayLeft);
    if (!rightRec) rightRec = getEmptyRec(compDayRight);
    
    const diff = leftRec.total - rightRec.total;
    const pct = rightRec.total > 0 ? Math.round((diff / rightRec.total) * 100) : (leftRec.total > 0 ? 100 : 0);
    
    return {
      left: leftRec,
      right: rightRec,
      diff,
      pct,
    };
  }, [wasteLogs, selectedBlockWaste, compDayLeft, compDayRight]);

  // Weekly aggregate comparison helper
  const weeklyCompResult = useMemo(() => {
    const logs = getLogsForMonth(selectedBlockWaste, compWeeklyMonth);
    const weeks = [
      { name: 'Week 1 (1-7)', Breakfast: 0, Lunch: 0, Dinner: 0, Total: 0, bCountSum: 0, lCountSum: 0, dCountSum: 0, count: 0 },
      { name: 'Week 2 (8-14)', Breakfast: 0, Lunch: 0, Dinner: 0, Total: 0, bCountSum: 0, lCountSum: 0, dCountSum: 0, count: 0 },
      { name: 'Week 3 (15-21)', Breakfast: 0, Lunch: 0, Dinner: 0, Total: 0, bCountSum: 0, lCountSum: 0, dCountSum: 0, count: 0 },
      { name: 'Week 4 (22-28)', Breakfast: 0, Lunch: 0, Dinner: 0, Total: 0, bCountSum: 0, lCountSum: 0, dCountSum: 0, count: 0 },
      { name: 'Week 5 (29-31)', Breakfast: 0, Lunch: 0, Dinner: 0, Total: 0, bCountSum: 0, lCountSum: 0, dCountSum: 0, count: 0 },
    ];

    const occ = (blocks.find(b => b.name === selectedBlockWaste) || {}).occupied || 1;

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
      weeks[wIdx].bCountSum += l.breakfastCount > 0 ? l.breakfastCount : occ;
      weeks[wIdx].lCountSum += l.lunchCount > 0 ? l.lunchCount : occ;
      weeks[wIdx].dCountSum += l.dinnerCount > 0 ? l.dinnerCount : occ;
      weeks[wIdx].count += 1;
    });

    const weekData = weeks.map(w => {
      let bCountAvg = w.bCountSum / (w.count || 1);
      let lCountAvg = w.lCountSum / (w.count || 1);
      let dCountAvg = w.dCountSum / (w.count || 1);
      let tCountAvg = (bCountAvg + lCountAvg + dCountAvg) / 3;

      return {
        name: w.name,
        Breakfast: Math.round(((w.Breakfast / (w.count || 1)) * 1000) / (bCountAvg || 1)),
        Lunch: Math.round(((w.Lunch / (w.count || 1)) * 1000) / (lCountAvg || 1)),
        Dinner: Math.round(((w.Dinner / (w.count || 1)) * 1000) / (dCountAvg || 1)),
        Total: Math.round(((w.Total / (w.count || 1)) * 1000) / (tCountAvg || 1)),
      };
    });

    const map = { 'W1': 0, 'W2': 1, 'W3': 2, 'W4': 3, 'W5': 4 };
    const leftIdx = map[compWeekLeft] ?? 0;
    const rightIdx = map[compWeekRight] ?? 1;

    return {
      leftName: weekData[leftIdx]?.name || 'N/A',
      leftVal: weekData[leftIdx]?.Total || 0,
      leftDetails: weekData[leftIdx] || { Breakfast: 0, Lunch: 0, Dinner: 0 },
      rightName: weekData[rightIdx]?.name || 'N/A',
      rightVal: weekData[rightIdx]?.Total || 0,
      rightDetails: weekData[rightIdx] || { Breakfast: 0, Lunch: 0, Dinner: 0 },
    };
  }, [wasteLogs, selectedBlockWaste, blocks, compWeeklyMonth, compWeekLeft, compWeekRight]);

  // Block vs Block comparison helper
  const blockCompResult = useMemo(() => {
    const getMonthTotalAndAvg = (blockName, monthStr) => {
      const logs = getLogsForMonth(blockName, monthStr);
      const total = logs.reduce((acc, curr) => acc + curr.total, 0);
      const avg = logs.length > 0 ? Math.round(total / logs.length) : 0;
      return { total, avg };
    };

    const leftSummary = getMonthTotalAndAvg(compBlockLeft, compFacilityMonth);
    const rightSummary = getMonthTotalAndAvg(compBlockRight, compFacilityMonth);

    const getMealTotals = (blockName) => {
      const logs = getLogsForMonth(blockName, compFacilityMonth);
      let bTotal = 0;
      let lTotal = 0;
      let dTotal = 0;
      let bCountSum = 0;
      let lCountSum = 0;
      let dCountSum = 0;
      const blockInfo = blocks.find(b => b.name === blockName) || { occupied: 1 };
      const occ = blockInfo.occupied || 1;
      logs.forEach(l => {
        bTotal += l.breakfast;
        lTotal += l.lunch;
        dTotal += l.dinner;
        bCountSum += l.breakfastCount > 0 ? l.breakfastCount : occ;
        lCountSum += l.lunchCount > 0 ? l.lunchCount : occ;
        dCountSum += l.dinnerCount > 0 ? l.dinnerCount : occ;
      });
      const days = logs.length || 1;
      return {
        breakfast: bTotal,
        lunch: lTotal,
        dinner: dTotal,
        bPerHead: Math.round(((bTotal / days) * 1000) / (bCountSum / days || 1)),
        lPerHead: Math.round(((lTotal / days) * 1000) / (lCountSum / days || 1)),
        dPerHead: Math.round(((dTotal / days) * 1000) / (dCountSum / days || 1)),
        occupied: occ
      };
    };

    return {
      leftName: compBlockLeft,
      rightName: compBlockRight,
      leftTotal: leftSummary.total,
      leftAvg: leftSummary.avg,
      leftDetails: getMealTotals(compBlockLeft),
      rightTotal: rightSummary.total,
      rightAvg: rightSummary.avg,
      rightDetails: getMealTotals(compBlockRight),
    };
  }, [wasteLogs, compBlockLeft, compBlockRight, blocks, compFacilityMonth]);

  // Summary Metrics: highest waste day, least waste day, weekly average
  const summaryMetrics = useMemo(() => {
    const logs = getLogsForMonth(selectedBlockWaste, analyticsMonth);
    if (logs.length === 0) return null;

    const occ = (blocks.find(b => b.name === selectedBlockWaste) || {}).occupied || 1;

    let maxRec = logs[0];
    let minRec = logs[0];
    let sum = 0;

    const getVal = (l) => {
      if (analyticsMeal === 'Breakfast') return l.breakfast;
      if (analyticsMeal === 'Lunch') return l.lunch;
      if (analyticsMeal === 'Dinner') return l.dinner;
      return l.total;
    };

    const getCount = (l) => {
      let bCount = l.breakfastCount > 0 ? l.breakfastCount : occ;
      let lCount = l.lunchCount > 0 ? l.lunchCount : occ;
      let dCount = l.dinnerCount > 0 ? l.dinnerCount : occ;
      if (analyticsMeal === 'Breakfast') return bCount;
      if (analyticsMeal === 'Lunch') return lCount;
      if (analyticsMeal === 'Dinner') return dCount;
      return (bCount + lCount + dCount) / 3;
    };

    let sumCount = 0;
    logs.forEach(l => {
      const val = getVal(l);
      const maxVal = getVal(maxRec);
      const minVal = getVal(minRec);
      
      if (val > maxVal) maxRec = l;
      // Skip day scholars zero days for min comparison (if any) or look at non-zero minimums
      if (val < minVal) minRec = l;
      sum += val;
      sumCount += getCount(l);
    });

    const avgCount = sumCount / (logs.length || 1);
    const averageWeekly = Math.round(((sum / logs.length) * 7 * 1000) / avgCount);
    const highestValG = Math.round((getVal(maxRec) * 1000) / getCount(maxRec));
    const leastValG = Math.round((getVal(minRec) * 1000) / getCount(minRec));

    return {
      highestDay: maxRec.date,
      highestVal: highestValG,
      leastDay: minRec.date,
      leastVal: leastValG,
      avgWeekly: averageWeekly,
    };
  }, [wasteLogs, selectedBlockWaste, blocks, analyticsMeal, analyticsMonth]);

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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            🍽️ Mess & Dining Management
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Manage capacities, digital menu cycles, equipment inventories, and food waste analytics.
          </p>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '12px', padding: '4px', overflowX: 'auto', maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}>
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'equipment', label: 'Equipment Health' },
            { id: 'manpower', label: 'Manpower' },
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
                whiteSpace: 'nowrap',
                flexShrink: 0,
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
          
          <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', background: '#fff', padding: '12px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
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


              </div>
            ))}

            {filteredEquipment.length === 0 && (
              <div style={{ gridColumn: '1 / -1', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#64748b' }}>
                🫙 No equipment items match the current search filters.
              </div>
            )}
          </div>


        </div>
      )}

      {/* ---------------------------------------------------------------------------------- */}
      {/* TAB: MANPOWER */}
      {/* ---------------------------------------------------------------------------------- */}
      {activeTab === 'manpower' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                Block:
                <select
                  value={selectedBlockStaff}
                  onChange={e => setSelectedBlockStaff(e.target.value)}
                  style={{ marginLeft: '10px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600 }}
                >
                  <option value="Boys Day Scholar">Boys Day Scholar</option>
                  <option value="Boys Hostel">Boys Hostel</option>
                  <option value="Girls">Girls</option>
                </select>
              </label>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="🔍 Search staff..."
                value={staffSearch}
                onChange={e => setStaffSearch(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', minWidth: '220px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {filteredStaff.map(item => (
              <div key={item.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', position: 'relative', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>{item.name}</h4>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 8px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb' }}>
                    {item.role}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>
                  <strong>Shift:</strong> {item.shift}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  <strong>Contact:</strong> {item.contact}
                </div>
              </div>
            ))}
            {filteredStaff.length === 0 && (
              <div style={{ gridColumn: '1 / -1', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#64748b' }}>
                🫙 No staff match the current search filters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------------------- */}
      {/* TAB 3: FOOD WASTE ANALYTICS */}
      {/* ---------------------------------------------------------------------------------- */}
      <div style={
        activeTab === 'waste' 
          ? { animation: 'fadeIn 0.3s ease' } 
          : { position: 'absolute', left: '-9999px', top: 0, width: '1000px', visibility: 'hidden' }
      }>

          {/* Block Selection Toggle */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
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

              <label style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                Month:
                <select
                  value={analyticsMonth}
                  onChange={e => setAnalyticsMonth(e.target.value)}
                  style={{ marginLeft: '10px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600 }}
                >
                  {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>

              <label style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                Meal:
                <select
                  value={analyticsMeal}
                  onChange={e => setAnalyticsMeal(e.target.value)}
                  style={{ marginLeft: '10px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600 }}
                >
                  <option value="All Meals">All Meals</option>
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                </select>
              </label>
            </div>

            {/* Quick Metrics Bar */}
            {summaryMetrics && (
              <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                <div>Avg Weekly: <strong>{summaryMetrics.avgWeekly} g/head</strong></div>
                <div style={{ color: '#b91c1c' }}>Peak: <strong>{summaryMetrics.highestVal} g/head</strong> ({summaryMetrics.highestDay})</div>
                <div style={{ color: '#166534' }}>Low: <strong>{summaryMetrics.leastVal} g/head</strong> ({summaryMetrics.leastDay})</div>
              </div>
            )}
          </div>

          {/* Charts Grid */}
          <div id="charts-grid-capture" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '24px', padding: '10px', background: '#f8fafc' }}>
            
            {/* Chart 1: Day-wise waste */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800 }}>📈 Day-wise Food Waste (g/head) - {analyticsMonth}</h4>
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
                    <Tooltip labelFormatter={(v) => `${analyticsMonth.split(' ')[0]} ${v}`} />
                    <Area type="monotone" dataKey="SelectedValue" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorWaste)" name={`${analyticsMeal} (g/head)`} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Week-wise comparison */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800 }}>📊 Weekly Average Waste Comparison (g/head)</h4>
              <div style={{ height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekWiseChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="SelectedValue" fill="#10b981" name={`${analyticsMeal === 'All Meals' ? 'Average Waste' : analyticsMeal} (g/head)`} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Meal-wise waste analysis */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>🥯 Meal-wise Waste Analysis ({analyticsPieDay === 'All Month' ? 'Average' : 'Total'} g/head)</h4>
                <select
                  value={analyticsPieDay}
                  onChange={e => setAnalyticsPieDay(e.target.value)}
                  style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600, fontSize: '0.8rem' }}
                >
                  <option value="All Month">All Month (Average)</option>
                  {getLogsForMonth(selectedBlockWaste, analyticsMonth).map(l => (
                    <option key={l.date} value={l.date}>
                      {new Date(l.date).toLocaleString('default', { month: 'short' })} {l.dayNum}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={mealWiseWasteData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {mealWiseWasteData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} g/head`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Meal Stacked daily breakdown */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800 }}>🥞 Stacked Meal Waste Breakdown (g/head)</h4>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            
            {/* Day of Week vs Day of Week Comparison */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>📅 Day-of-Week Comparison</h4>
                <select
                  value={compDayOfWeekMonth}
                  onChange={e => setCompDayOfWeekMonth(e.target.value)}
                  style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600, fontSize: '0.8rem' }}
                >
                  {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
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

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                <label style={{ flex: 1, minWidth: '140px', fontSize: '0.75rem', fontWeight: 700 }}>
                  Select First Date ({compDayOfWeek}):
                  <select
                    value={compDateLeft}
                    onChange={e => setCompDateLeft(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  >
                    {filteredCompDates.map(d => (
                      <option key={d.date} value={d.date}>
                        {d.date} ({new Date(d.date).toLocaleString('default', { month: 'short' })} {d.dayNum})
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
                        {d.date} ({new Date(d.date).toLocaleString('default', { month: 'short' })} {d.dayNum})
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {dayOfWeekComparisonResult && (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  {(() => {
                    const occ = (blocks.find(b => b.name === selectedBlockWaste) || {}).occupied || 1;
                    const left = dayOfWeekComparisonResult.left;
                    const right = dayOfWeekComparisonResult.right;
                    return (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Date {left.date}</div>
                            <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                              <div>Breakfast: {left.breakfast} KG <strong>({Math.round((left.breakfast * 1000) / (left.breakfastCount > 0 ? left.breakfastCount : occ))}g/head)</strong></div>
                              <div>Lunch: {left.lunch} KG <strong>({Math.round((left.lunch * 1000) / (left.lunchCount > 0 ? left.lunchCount : occ))}g/head)</strong></div>
                              <div>Dinner: {left.dinner} KG <strong>({Math.round((left.dinner * 1000) / (left.dinnerCount > 0 ? left.dinnerCount : occ))}g/head)</strong></div>
                              <div style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '4px', color: '#4f46e5' }}>Total: {left.total} KG</div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', borderLeft: '1px dashed #cbd5e1', paddingLeft: '16px' }}>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Date {right.date}</div>
                            <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px', alignItems: 'flex-end' }}>
                              <div>Breakfast: {right.breakfast} KG <strong>({Math.round((right.breakfast * 1000) / (right.breakfastCount > 0 ? right.breakfastCount : occ))}g/head)</strong></div>
                              <div>Lunch: {right.lunch} KG <strong>({Math.round((right.lunch * 1000) / (right.lunchCount > 0 ? right.lunchCount : occ))}g/head)</strong></div>
                              <div>Dinner: {right.dinner} KG <strong>({Math.round((right.dinner * 1000) / (right.dinnerCount > 0 ? right.dinnerCount : occ))}g/head)</strong></div>
                              <div style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '4px', color: '#10b981' }}>Total: {right.total} KG</div>
                            </div>
                          </div>
                        </div>

                        <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Variance:</span>
                          <span style={{ fontWeight: 800, color: dayOfWeekComparisonResult.diff > 0 ? '#ef4444' : '#10b981' }}>
                            {dayOfWeekComparisonResult.diff > 0 ? `+${dayOfWeekComparisonResult.diff}` : dayOfWeekComparisonResult.diff} KG ({dayOfWeekComparisonResult.pct > 0 ? `+${dayOfWeekComparisonResult.pct}` : dayOfWeekComparisonResult.pct}%)
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Custom Day vs Day Comparison */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '1.05rem', fontWeight: 800 }}>📅 Custom Day Comparison</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>Compare details of any custom days side-by-side.</p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                <label style={{ flex: 1, minWidth: '140px', fontSize: '0.75rem', fontWeight: 700 }}>
                  First Day:
                  <input
                    type="date"
                    value={compDayLeft}
                    onChange={e => setCompDayLeft(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  />
                </label>
                <label style={{ flex: 1, fontSize: '0.75rem', fontWeight: 700 }}>
                  Second Day:
                  <input
                    type="date"
                    value={compDayRight}
                    onChange={e => setCompDayRight(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  />
                </label>
              </div>

              {customDayComparisonResult && (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  {(() => {
                    const occ = (blocks.find(b => b.name === selectedBlockWaste) || {}).occupied || 1;
                    const left = customDayComparisonResult.left;
                    const right = customDayComparisonResult.right;
                    return (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                          <div>
                            <h5 style={{ margin: '0 0 8px 0', color: '#4f46e5' }}>{new Date(left.date).toLocaleString('default', { month: 'short' })} {left.dayNum} ({left.dayOfWeek})</h5>
                            <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div>Breakfast: {left.breakfast} KG <strong>({Math.round((left.breakfast * 1000) / (left.breakfastCount > 0 ? left.breakfastCount : occ))}g/head)</strong></div>
                              <div>Lunch: {left.lunch} KG <strong>({Math.round((left.lunch * 1000) / (left.lunchCount > 0 ? left.lunchCount : occ))}g/head)</strong></div>
                              <div>Dinner: {left.dinner} KG <strong>({Math.round((left.dinner * 1000) / (left.dinnerCount > 0 ? left.dinnerCount : occ))}g/head)</strong></div>
                              <div style={{ fontSize: '1.05rem', fontWeight: 800, borderTop: '1px solid #e2e8f0', paddingTop: '4px', marginTop: '4px', color: '#4f46e5' }}>Total: {left.total} KG</div>
                            </div>
                          </div>
                          <div style={{ borderLeft: '1px dashed #cbd5e1', paddingLeft: '12px' }}>
                            <h5 style={{ margin: '0 0 8px 0', color: '#10b981' }}>{new Date(right.date).toLocaleString('default', { month: 'short' })} {right.dayNum} ({right.dayOfWeek})</h5>
                            <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div>Breakfast: {right.breakfast} KG <strong>({Math.round((right.breakfast * 1000) / (right.breakfastCount > 0 ? right.breakfastCount : occ))}g/head)</strong></div>
                              <div>Lunch: {right.lunch} KG <strong>({Math.round((right.lunch * 1000) / (right.lunchCount > 0 ? right.lunchCount : occ))}g/head)</strong></div>
                              <div>Dinner: {right.dinner} KG <strong>({Math.round((right.dinner * 1000) / (right.dinnerCount > 0 ? right.dinnerCount : occ))}g/head)</strong></div>
                              <div style={{ fontSize: '1.05rem', fontWeight: 800, borderTop: '1px solid #e2e8f0', paddingTop: '4px', marginTop: '4px', color: '#10b981' }}>Total: {right.total} KG</div>
                            </div>
                          </div>
                        </div>

                        <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Variance:</span>
                          <span style={{ fontWeight: 800, color: customDayComparisonResult.diff > 0 ? '#ef4444' : '#10b981' }}>
                            {customDayComparisonResult.diff > 0 ? `+${customDayComparisonResult.diff}` : customDayComparisonResult.diff} KG ({customDayComparisonResult.pct > 0 ? `+${customDayComparisonResult.pct}` : customDayComparisonResult.pct}%)
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Weekly Comparison */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>📅 Weekly Trends Comparison</h4>
                <select
                  value={compWeeklyMonth}
                  onChange={e => setCompWeeklyMonth(e.target.value)}
                  style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600, fontSize: '0.8rem' }}
                >
                  {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>Compare average weekly metrics across {compWeeklyMonth}.</p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                <label style={{ flex: 1, minWidth: '140px', fontSize: '0.75rem', fontWeight: 700 }}>
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
                  {(() => {
                    const occ = (blocks.find(b => b.name === selectedBlockWaste) || {}).occupied || 1;
                    const left = weeklyCompResult.leftDetails;
                    const right = weeklyCompResult.rightDetails;
                    return (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{weeklyCompResult.leftName} Avg</div>
                            <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                              <div>Breakfast: {left.Breakfast} KG/day <strong>({Math.round((left.Breakfast * 1000) / occ)}g/head)</strong></div>
                              <div>Lunch: {left.Lunch} KG/day <strong>({Math.round((left.Lunch * 1000) / occ)}g/head)</strong></div>
                              <div>Dinner: {left.Dinner} KG/day <strong>({Math.round((left.Dinner * 1000) / occ)}g/head)</strong></div>
                              <div style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '4px', color: '#4f46e5' }}>Total: {weeklyCompResult.leftVal} KG/day</div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', borderLeft: '1px dashed #cbd5e1', paddingLeft: '16px' }}>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{weeklyCompResult.rightName} Avg</div>
                            <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px', alignItems: 'flex-end' }}>
                              <div>Breakfast: {right.Breakfast} KG/day <strong>({Math.round((right.Breakfast * 1000) / occ)}g/head)</strong></div>
                              <div>Lunch: {right.Lunch} KG/day <strong>({Math.round((right.Lunch * 1000) / occ)}g/head)</strong></div>
                              <div>Dinner: {right.Dinner} KG/day <strong>({Math.round((right.Dinner * 1000) / occ)}g/head)</strong></div>
                              <div style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '4px', color: '#10b981' }}>Total: {weeklyCompResult.rightVal} KG/day</div>
                            </div>
                          </div>
                        </div>

                        <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Variance:</span>
                          <span style={{ fontWeight: 800, color: weeklyCompResult.leftVal > weeklyCompResult.rightVal ? '#ef4444' : '#10b981' }}>
                            {weeklyCompResult.leftVal > weeklyCompResult.rightVal ? `+${weeklyCompResult.leftVal - weeklyCompResult.rightVal}` : weeklyCompResult.leftVal - weeklyCompResult.rightVal} KG/day
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Block vs Block Comparison */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>🏢 Facility comparison (Block vs Block)</h4>
                <select
                  value={compFacilityMonth}
                  onChange={e => setCompFacilityMonth(e.target.value)}
                  style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600, fontSize: '0.8rem' }}
                >
                  {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>Compare total waste outputs between different hostels for {compFacilityMonth}.</p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                <label style={{ flex: 1, minWidth: '140px', fontSize: '0.75rem', fontWeight: 700 }}>
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
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div>
                    <h5 style={{ margin: '0 0 8px 0', color: '#4f46e5' }}>{blockCompResult.leftName}</h5>
                    <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>Total Monthly: <strong>{blockCompResult.leftTotal} KG</strong></div>
                      <div>Avg Daily: <strong>{blockCompResult.leftAvg} KG</strong></div>
                      <div>Occupied: <strong>{blockCompResult.leftDetails.occupied}</strong></div>
                      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '4px', marginTop: '4px' }}>
                        <div>Breakfast: {blockCompResult.leftDetails.breakfast} KG <strong>({blockCompResult.leftDetails.bPerHead}g/head)</strong></div>
                        <div>Lunch: {blockCompResult.leftDetails.lunch} KG <strong>({blockCompResult.leftDetails.lPerHead}g/head)</strong></div>
                        <div>Dinner: {blockCompResult.leftDetails.dinner} KG <strong>({blockCompResult.leftDetails.dPerHead}g/head)</strong></div>
                      </div>
                    </div>
                  </div>
                  <div style={{ borderLeft: '1px dashed #cbd5e1', paddingLeft: '12px' }}>
                    <h5 style={{ margin: '0 0 8px 0', color: '#10b981' }}>{blockCompResult.rightName}</h5>
                    <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>Total Monthly: <strong>{blockCompResult.rightTotal} KG</strong></div>
                      <div>Avg Daily: <strong>{blockCompResult.rightAvg} KG</strong></div>
                      <div>Occupied: <strong>{blockCompResult.rightDetails.occupied}</strong></div>
                      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '4px', marginTop: '4px' }}>
                        <div>Breakfast: {blockCompResult.rightDetails.breakfast} KG <strong>({blockCompResult.rightDetails.bPerHead}g/head)</strong></div>
                        <div>Lunch: {blockCompResult.rightDetails.lunch} KG <strong>({blockCompResult.rightDetails.lPerHead}g/head)</strong></div>
                        <div>Dinner: {blockCompResult.rightDetails.dinner} KG <strong>({blockCompResult.rightDetails.dPerHead}g/head)</strong></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                  {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
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
              onClick={handleExportPDF}
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
                {getLogsForMonth(selectedBlockWaste, selectedReportMonth).reduce((acc, l) => acc + l.total, 0).toLocaleString()} KG
              </div>
            </div>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Daily Average Waste</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', marginTop: '6px' }}>
                {(() => {
                  const logs = getLogsForMonth(selectedBlockWaste, selectedReportMonth);
                  return logs.length > 0 ? Math.round(logs.reduce((acc, l) => acc + l.total, 0) / logs.length) : 0;
                })()} KG / day
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
                  {getLogsForMonth(selectedBlockWaste, selectedReportMonth).map(row => {
                    const occ = (blocks.find(b => b.name === selectedBlockWaste) || {}).occupied || 1;
                    const bCount = row.breakfastCount > 0 ? row.breakfastCount : occ;
                    const lCount = row.lunchCount > 0 ? row.lunchCount : occ;
                    const dCount = row.dinnerCount > 0 ? row.dinnerCount : occ;
                    const tCount = (bCount + lCount + dCount) / 3;
                    return (
                      <tr key={row.date} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 20px', fontWeight: 700 }}>{row.date}</td>
                        <td style={{ padding: '10px 20px', color: '#475569' }}>{row.dayOfWeek}</td>
                        <td style={{ padding: '10px 20px' }}>{row.breakfast} KG <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>({Math.round((row.breakfast * 1000) / bCount)}g/head)</span></td>
                        <td style={{ padding: '10px 20px' }}>{row.lunch} KG <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>({Math.round((row.lunch * 1000) / lCount)}g/head)</span></td>
                        <td style={{ padding: '10px 20px' }}>{row.dinner} KG <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>({Math.round((row.dinner * 1000) / dCount)}g/head)</span></td>
                        <td style={{ padding: '10px 20px', fontWeight: 700, color: '#4f46e5' }}>{row.total} KG <span style={{ fontSize: '0.75rem' }}>({Math.round((row.total * 1000) / tCount)}g/head)</span></td>
                        <td style={{ padding: '10px 20px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: row.total > 100 ? '#fef2f2' : '#f0fdf4', color: row.total > 100 ? '#ef4444' : '#10b981' }}>
                            {row.total > 100 ? 'High' : 'Normal'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
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
