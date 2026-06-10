import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';



export default function TransportDetail({ currentUser }) {
  const [view, setView] = useState('dashboard');
  const [mileageRange, setMileageRange] = useState('overall');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showPeople, setShowPeople] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [activeShift, setActiveShift] = useState('morning');
  const [graphRange, setGraphRange] = useState('daily');
  const [backendData, setBackendData] = useState(null);

  // Fetch all transport data from backend
  const fetchData = () => {
    fetch('http://localhost:8085/api/transport')
      .then(r => r.json())
      .then(d => setBackendData(d))
      .catch(() => { });
  };
  useEffect(() => { fetchData(); }, []);

  // Derive live arrays with static fallbacks
  const BUSES_DATA = backendData?.vehicles?.map(v => ({
    id: v.id, number: v.number, busNo: v.busNo, type: v.type,
    status: v.status, mileage: `${v.mileageKmpl} kmpl`,
    route: v.route, driver: v.driver,
    lastFC: v.lastFC, nextFC: v.nextFC,
    trend: v.trend || []
  })) || [];

  const DRIVERS_DATA = (backendData?.drivers || []).map(d => ({
    ...d,
    img: d.imgURL || d.img || `https://i.pravatar.cc/150?img=${d.id + 10}`,
    schedule: d.schedule || []
  }));

  const vehicleUtilizationData = React.useMemo(() => {
    if (!backendData?.trips) return [];
    return BUSES_DATA.map(b => {
      const bTrips = backendData.trips.filter(t => t.busNumber === b.number);
      const totalKM = bTrips.reduce((sum, t) => sum + (parseFloat(t.distance) || 0), 0);
      return {
        label: b.busNo ? `Bus ${b.busNo}` : (b.type === 'Car' ? `Car ${b.busNo}` : b.number),
        distance: totalKM
      };
    }).filter(d => d.distance > 0).sort((a, b) => b.distance - a.distance);
  }, [backendData?.trips, BUSES_DATA]);
  const routeTrips = (backendData?.trips || []).reduce((acc, t) => {
    if (!t.routeName) return acc;
    const existing = acc.find(x => x.route === t.routeName);
    if (existing) existing.trips += 1;
    else acc.push({ route: t.routeName, trips: 1 });
    return acc;
  }, []);
  const GPS_DATA = backendData?.gps || [];
  const MAINTENANCE_DATA = backendData?.maintenance || [];

  const presentCount = DRIVERS_DATA.filter(d => d.status === 'Present').length;
  const totalDrivers = DRIVERS_DATA.length;

  const busVehicles = BUSES_DATA.filter(b => b.type === 'Bus' || b.type === 'Van');
  const carVehicles = BUSES_DATA.filter(b => b.type === 'Car' || b.type === 'EV');

  const totalMaintenanceCost = MAINTENANCE_DATA.reduce((sum, item) => {
    if (!item.cost) return sum;
    const numericStr = item.cost.replace(/[^\d.]/g, '');
    const costVal = parseFloat(numericStr) || 0;
    return sum + costVal;
  }, 0);

  const formattedCost = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(totalMaintenanceCost);

  // Stabilize trip data for the selected bus
  const busTrips = React.useMemo(() => {
    if (!selectedBus) return [];
    const liveTrips = (backendData?.trips || []).filter(t => t.busNumber === selectedBus.number);

    return liveTrips.map(t => {
      const assignedStudents = (backendData?.students || []).filter(s => s.busAssigned === t.busNumber);
      const people = assignedStudents.map((s, idx) => ({
        type: 'Student',
        name: s.name,
        rollNo: s.rollNumber,
        boardingPoint: s.boardingPoint,
        feePaid: s.status === 'Active',
        morningPresent: idx < t.attendance,
        eveningPresent: idx < t.attendance
      }));

      return {
        id: t.id,
        date: t.date,
        tripType: t.tripType,
        routeName: t.routeName,
        driverName: t.driverName,
        startTime: t.startTime,
        endTime: t.endTime,
        startKM: t.startKM,
        endKM: t.endKM,
        distance: t.distance,
        fuelUsage: t.fuelUsage,
        remarks: t.remarks,
        students: t.studentCount || people.length,
        faculty: 0,
        morningAttendance: t.studentCount > 0 ? `${Math.round((t.attendance / t.studentCount) * 100)}%` : '100%',
        eveningAttendance: t.studentCount > 0 ? `${Math.round((t.attendance / t.studentCount) * 100)}%` : '100%',
        people: people,
        rawAttendance: t.attendance
      };
    });
  }, [selectedBus?.number, backendData?.trips, backendData?.students]);

  const dailyMileageData = React.useMemo(() => {
    if (!selectedBus) return [];
    const logs = (backendData?.fuelLogs || backendData?.fuelByVehicle || []).filter(f => f.vehicle === selectedBus.number);
    return logs.map(f => {
      const l = parseFloat(f.litres) || 0;
      const k = parseFloat(f.kmDriven) || 0;
      const mileage = (l > 0 && k > 0) ? parseFloat((k / l).toFixed(1)) : 0;
      return {
        date: f.date,
        startKM: parseFloat(f.startKM) || 0,
        endKM: parseFloat(f.endKM) || 0,
        distance: k,
        fuelUsage: l,
        mileage: mileage > 0 ? mileage : 'N/A'
      };
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedBus?.number, backendData?.fuelLogs, backendData?.fuelByVehicle]);

  const analyticsSummary = React.useMemo(() => {
    if (!selectedBus) return { dailyKM: 0, weeklyAvgMileage: 'N/A', monthlyKM: 0, highestDay: 'N/A', lowestDay: 'N/A' };

    // 1. Daily Total KM
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTrips = (backendData?.trips || []).filter(t => t.busNumber === selectedBus.number && t.date === todayStr);
    const dailyKM = todayTrips.reduce((sum, t) => sum + (parseFloat(t.distance) || 0), 0);

    // 2. Monthly Total KM
    const thisMonthPrefix = todayStr.substring(0, 7); // YYYY-MM
    const monthlyTrips = (backendData?.trips || []).filter(t => t.busNumber === selectedBus.number && t.date.startsWith(thisMonthPrefix));
    const monthlyKM = monthlyTrips.reduce((sum, t) => sum + (parseFloat(t.distance) || 0), 0);

    // 3. Weekly Average Mileage
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday
    const diffToMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diffToMonday));
    monday.setHours(0, 0, 0, 0);

    const thisWeekTrips = (backendData?.trips || []).filter(t => {
      if (t.busNumber !== selectedBus.number) return false;
      const tDate = new Date(t.date);
      return tDate >= monday && tDate <= new Date();
    });

    const runningDays = [...new Set(thisWeekTrips.map(t => t.date))];

    let sumActiveMileage = 0;
    let runningDaysWithMileage = 0;
    const logs = (backendData?.fuelLogs || backendData?.fuelByVehicle || []).filter(f => f.vehicle === selectedBus.number);

    runningDays.forEach(day => {
      const logsBeforeOrOnDay = logs.filter(l => l.date <= day).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
      if (logsBeforeOrOnDay.length > 0) {
        const activeLog = logsBeforeOrOnDay[0];
        if (activeLog.mileage > 0) {
          sumActiveMileage += parseFloat(activeLog.mileage);
          runningDaysWithMileage++;
        }
      }
    });

    const weeklyAvgMileage = runningDaysWithMileage > 0 ? (sumActiveMileage / runningDaysWithMileage).toFixed(1) : 'N/A';

    // 4. Highest/Lowest Mileage Logs
    let highestM = -1;
    let lowestM = 9999;
    let highestDay = '—';
    let lowestDay = '—';
    logs.forEach(l => {
      const mVal = parseFloat(l.mileage);
      if (mVal > 0) {
        if (mVal > highestM) { highestM = mVal; highestDay = `${l.date} (${mVal} KM/L)`; }
        if (mVal < lowestM) { lowestM = mVal; lowestDay = `${l.date} (${mVal} KM/L)`; }
      }
    });

    return {
      dailyKM: dailyKM.toFixed(1),
      monthlyKM: monthlyKM.toFixed(1),
      weeklyAvgMileage,
      highest: highestDay !== '—' ? highestDay : 'N/A',
      lowest: lowestDay !== '—' ? lowestDay : 'N/A'
    };
  }, [selectedBus?.number, backendData?.trips, backendData?.fuelLogs, backendData?.fuelByVehicle]);

  const chartData = React.useMemo(() => {
    if (graphRange === 'weekly') {
      const weeks = {};
      dailyMileageData.forEach(d => {
        const dateObj = new Date(d.date);
        if (isNaN(dateObj)) return;
        const dayOfWeek = dateObj.getDay();
        const diff = dateObj.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(dateObj.setDate(diff)).toISOString().split('T')[0];
        if (!weeks[monday]) {
          weeks[monday] = { name: `W/C ${monday}`, distance: d.distance, fuelUsage: d.fuelUsage };
        } else {
          weeks[monday].distance += d.distance;
          weeks[monday].fuelUsage += d.fuelUsage;
        }
      });
      return Object.values(weeks).map(w => ({
        name: w.name,
        mileage: w.fuelUsage > 0 ? parseFloat((w.distance / w.fuelUsage).toFixed(1)) : 0
      }));
    } else if (graphRange === 'monthly') {
      const months = {};
      dailyMileageData.forEach(d => {
        const parts = d.date.split('-');
        if (parts.length < 2) return;
        const monthKey = `${parts[0]}-${parts[1]}`;
        if (!months[monthKey]) {
          months[monthKey] = { name: monthKey, distance: d.distance, fuelUsage: d.fuelUsage };
        } else {
          months[monthKey].distance += d.distance;
          months[monthKey].fuelUsage += d.fuelUsage;
        }
      });
      return Object.values(months).map(m => ({
        name: m.name,
        mileage: m.fuelUsage > 0 ? parseFloat((m.distance / m.fuelUsage).toFixed(1)) : 0
      }));
    } else {
      return dailyMileageData.map(d => ({
        name: d.date,
        mileage: d.mileage === 'N/A' ? 0 : parseFloat(d.mileage)
      }));
    }
  }, [dailyMileageData, graphRange]);

  const getStatusColors = (status) => {
    switch (status) {
      case 'Active': return { bg: '#dcfce7', color: '#166534' };
      case 'In Parking': return { bg: '#f1f5f9', color: '#475569' };
      case 'In Town': return { bg: '#e0f2fe', color: '#0369a1' };
      case 'Under Maintenance': return { bg: '#fee2e2', color: '#991b1b' };
      default: return { bg: '#f1f5f9', color: '#475569' };
    }
  };

  const todayLatestMileage = React.useMemo(() => {
    const fuelLogs = backendData?.fuelByVehicle || backendData?.fuelLogs || [];
    if (fuelLogs.length === 0) return null;

    // Sort fuel logs by date desc, then by id desc to get the absolute newest log
    const sortedLogs = [...fuelLogs].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

    const todayStr = new Date().toISOString().split('T')[0];
    const todayLogs = sortedLogs.filter(f => f.date === todayStr);

    const formatLog = (log, isToday) => {
      const foundBus = BUSES_DATA.find(b => b.number === log.vehicle);
      const vehicleName = foundBus ? (foundBus.busNo ? `${foundBus.type} ${foundBus.busNo}` : foundBus.number) : log.vehicle;
      return {
        isToday,
        mileage: log.mileage ? `${parseFloat(log.mileage).toFixed(1)} KM/L` : '—',
        vehicle: vehicleName,
        date: log.date
      };
    };

    if (todayLogs.length > 0) {
      return formatLog(todayLogs[0], true);
    } else {
      return formatLog(sortedLogs[0], false);
    }
  }, [backendData, BUSES_DATA]);

  const getBusStats = (busNum) => {
    const trips = (backendData?.trips || []).filter(t => t.busNumber === busNum);
    const fuelLogs = (backendData?.fuelLogs || backendData?.fuelByVehicle || []).filter(f => f.vehicle === busNum);
    const morningTrips = trips.filter(t => t.tripType === 'Morning').length;
    const eveningTrips = trips.filter(t => t.tripType === 'Evening').length;
    const specialTrips = trips.filter(t => t.tripType === 'Special').length;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayTrips = trips.filter(t => t.date === todayStr);
    const placeTravelled = todayTrips.length > 0 ? todayTrips[0].routeName : 'Not travelled today';

    const totalFuel = fuelLogs.reduce((sum, f) => sum + (parseFloat(f.litres) || 0), 0);

    let latestMileage = '—';
    if (fuelLogs.length > 0) {
      const sorted = [...fuelLogs].sort((a, b) => b.date.localeCompare(a.date));
      const latest = sorted[0];
      const l = parseFloat(latest.litres) || 0;
      const k = parseFloat(latest.kmDriven) || 0;
      if (l > 0 && k > 0) latestMileage = (k / l).toFixed(1);
    }

    let avgMileage = '—';
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const last7DaysFuel = fuelLogs.filter(f => new Date(f.date) >= sevenDaysAgo);
    const totalFuel7d = last7DaysFuel.reduce((sum, f) => sum + (parseFloat(f.litres) || 0), 0);
    const totalKM7d = last7DaysFuel.reduce((sum, f) => sum + (parseFloat(f.kmDriven) || 0), 0);
    if (totalFuel7d > 0 && totalKM7d > 0) {
      avgMileage = (totalKM7d / totalFuel7d).toFixed(1);
    }

    const totalAttendance = trips.reduce((sum, t) => sum + (parseInt(t.attendance) || 0), 0);
    return {
      morningTrips,
      eveningTrips,
      specialTrips,
      placeTravelled,
      totalFuel: totalFuel > 0 ? `${totalFuel.toFixed(1)} L` : '0 L',
      avgMileage: avgMileage !== '—' ? `${avgMileage} KM/L` : '—',
      latestMileage: latestMileage !== '—' ? `${latestMileage} KM/L` : '—',
      totalAttendance
    };
  };

  const busMileageComparison = React.useMemo(() => {
    let allTrips = backendData?.trips || [];

    // Filter trips based on selected mileageRange
    if (mileageRange !== 'overall') {
      const today = new Date();
      let startDate = new Date();
      if (mileageRange === 'today') {
        // keep startdate as today
      } else if (mileageRange === 'yesterday') {
        startDate.setDate(today.getDate() - 1);
        today.setDate(today.getDate() - 1);
      } else if (mileageRange === 'this_week') {
        startDate.setDate(today.getDate() - today.getDay());
      } else if (mileageRange === 'last_week') {
        startDate.setDate(today.getDate() - today.getDay() - 7);
        today.setDate(startDate.getDate() + 6);
      }

      // Convert to YYYY-MM-DD
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = today.toISOString().split('T')[0];

      if (mileageRange === 'today' || mileageRange === 'yesterday') {
        allTrips = allTrips.filter(t => t.date === startStr);
      } else {
        allTrips = allTrips.filter(t => t.date >= startStr && t.date <= endStr);
      }
    }

    const buses = BUSES_DATA.filter(b => b.type === 'Bus' || b.type === 'Van');
    const fuelLogs = backendData?.fuelLogs || backendData?.fuelByVehicle || [];

    return buses.map(bus => {
      const busTrips = allTrips.filter(t => t.busNumber === bus.number);
      const busLogs = fuelLogs.filter(f => f.vehicle === bus.number);
      let latestMileage = 0;

      if (mileageRange !== 'overall') {
        const endStr = new Date().toISOString().split('T')[0];
        // Find latest log up to the end of the range
        const validLogs = busLogs.filter(f => f.date <= endStr).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
        if (validLogs.length > 0) latestMileage = parseFloat(validLogs[0].mileage) || 0;
      } else {
        const validLogs = busLogs.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
        if (validLogs.length > 0) latestMileage = parseFloat(validLogs[0].mileage) || 0;
      }

      return {
        bus: bus.busNo ? `Bus ${bus.busNo}` : bus.number,
        mileage: latestMileage,
        trips: busTrips.length
      };
    }).filter(d => d.mileage > 0 || d.trips > 0);
  }, [backendData, BUSES_DATA, mileageRange]);

  const carMileageComparison = React.useMemo(() => {
    let allTrips = backendData?.trips || [];

    if (mileageRange !== 'overall') {
      const today = new Date();
      let startDate = new Date();
      if (mileageRange === 'today') {
      } else if (mileageRange === 'yesterday') {
        startDate.setDate(today.getDate() - 1);
        today.setDate(today.getDate() - 1);
      } else if (mileageRange === 'this_week') {
        startDate.setDate(today.getDate() - today.getDay());
      } else if (mileageRange === 'last_week') {
        startDate.setDate(today.getDate() - today.getDay() - 7);
        today.setDate(startDate.getDate() + 6);
      }

      const startStr = startDate.toISOString().split('T')[0];
      const endStr = today.toISOString().split('T')[0];

      if (mileageRange === 'today' || mileageRange === 'yesterday') {
        allTrips = allTrips.filter(t => t.date === startStr);
      } else {
        allTrips = allTrips.filter(t => t.date >= startStr && t.date <= endStr);
      }
    }

    const cars = BUSES_DATA.filter(b => b.type === 'Car');
    const fuelLogs = backendData?.fuelLogs || backendData?.fuelByVehicle || [];

    return cars.map(car => {
      const carTrips = allTrips.filter(t => t.busNumber === car.number);
      const carLogs = fuelLogs.filter(f => f.vehicle === car.number);
      let latestMileage = 0;

      if (mileageRange !== 'overall') {
        const endStr = new Date().toISOString().split('T')[0];
        const validLogs = carLogs.filter(f => f.date <= endStr).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
        if (validLogs.length > 0) latestMileage = parseFloat(validLogs[0].mileage) || 0;
      } else {
        const validLogs = carLogs.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
        if (validLogs.length > 0) latestMileage = parseFloat(validLogs[0].mileage) || 0;
      }

      return {
        car: car.busNo ? `Car ${car.busNo}` : car.number,
        mileage: latestMileage,
        trips: carTrips.length
      };
    }).filter(d => d.mileage > 0 || d.trips > 0);
  }, [backendData, BUSES_DATA, mileageRange]);

  const renderDashboard = () => {
    const now = new Date();
    const fcAlerts = BUSES_DATA.filter(bus => {
      const nextFC = new Date(bus.nextFC);
      const diffTime = nextFC - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 10 && diffDays >= 0;
    });

    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>Transport Dashboard</h2>
        </div>

        {fcAlerts.length > 0 && (
          <div style={{ background: '#fff1f2', border: '1px solid #fda4af', borderRadius: '12px', padding: '16px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9f1239', fontWeight: 'bold' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              Critical: Upcoming FC Renewals (Next 10 Days)
            </div>
            {fcAlerts.map(bus => {
              const diffDays = Math.ceil((new Date(bus.nextFC) - now) / (1000 * 60 * 60 * 24));
              return (
                <div key={bus.id} style={{ fontSize: '0.9rem', color: '#be123c', paddingLeft: '28px' }}>
                  • <strong>{bus.number}</strong> FC expires in {diffDays} days ({bus.nextFC})
                </div>
              );
            })}
          </div>
        )}

        <p style={{ marginBottom: 20, color: '#555' }}>
          Each day or route is shown as bars so you can compare “how many buses” and “how many trips” without
          reading a line graph.
        </p>

        <div className="detail-kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          <div className="detail-kpi-card" style={{ cursor: 'pointer', border: '2px solid transparent', boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)', background: '#f8fbff', transition: 'all 0.2s', padding: '24px', borderRadius: '16px' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#1976d2'} onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'} onClick={() => setView('busList')}>
            <div className="kpi-label" style={{ color: '#1976d2', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '8px' }}>Bus & Van Fleet</div>
            <div className="kpi-value" style={{ color: '#1976d2', fontSize: '2.5rem', fontWeight: 800 }}>{busVehicles.length}</div>
            <div className="kpi-label" style={{ color: '#1976d2', display: 'flex', alignItems: 'center', gap: 4, marginTop: '8px' }}>View Buses <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg></div>
          </div>

          <div className="detail-kpi-card" style={{ cursor: 'pointer', border: '2px solid transparent', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)', background: '#f0fdf4', transition: 'all 0.2s', padding: '24px', borderRadius: '16px' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'} onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'} onClick={() => setView('carList')}>
            <div className="kpi-label" style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '8px' }}>Car & EV Fleet</div>
            <div className="kpi-value" style={{ color: '#10b981', fontSize: '2.5rem', fontWeight: 800 }}>{carVehicles.length}</div>
            <div className="kpi-label" style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, marginTop: '8px' }}>View Cars <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg></div>
          </div>

          <div className="detail-kpi-card" style={{ cursor: 'pointer', border: '2px solid transparent', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)', background: '#fffbeb', transition: 'all 0.2s', padding: '24px', borderRadius: '16px' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#f59e0b'} onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'} onClick={() => setView('driverList')}>
            <div className="kpi-label" style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '8px' }}>Driver Roster</div>
            <div className="kpi-value" style={{ color: '#f59e0b', fontSize: '2.5rem', fontWeight: 800 }}>{totalDrivers}</div>
            <div className="kpi-label" style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4, marginTop: '8px' }}>{presentCount} Present Today <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg></div>
          </div>

          <div className="detail-kpi-card" style={{ cursor: 'pointer', border: '2px solid transparent', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.15)', background: '#f5f3ff', transition: 'all 0.2s', padding: '24px', borderRadius: '16px' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#8b5cf6'} onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'} onClick={() => setView('specialTrips')}>
            <div className="kpi-label" style={{ color: '#8b5cf6', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '8px' }}>Special Trips</div>
            <div className="kpi-value" style={{ color: '#8b5cf6', fontSize: '2.5rem', fontWeight: 800 }}>{(backendData?.trips || []).filter(t => t.tripType === 'Special' && t.tripStatus !== 'Completed' && t.tripStatus !== 'Cancelled').length}</div>
            <div className="kpi-label" style={{ color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: 4, marginTop: '8px' }}>Manage Special Trips <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg></div>
          </div>
        </div>

        <div className="detail-kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div
            className="detail-kpi-card"
            onClick={() => setShowMaintenance(!showMaintenance)}
            style={{
              cursor: 'pointer', padding: '20px', borderRadius: '16px',
              background: showMaintenance ? '#fef2f2' : '#fff',
              border: showMaintenance ? '2px solid #ef4444' : '1px solid #e2e8f0',
              transition: 'all 0.3s ease'
            }}
          >
            <div className="kpi-label">Annual maintenance cost</div>
            <div className="kpi-value" style={{ fontSize: '1.8rem' }}>{formattedCost}</div>
            <div className="kpi-label">Repairs &amp; servicing</div>
          </div>

          <div
            className="detail-kpi-card"
            style={{
              padding: '20px', borderRadius: '16px',
              background: '#fff',
              border: '1px solid #e2e8f0',
              transition: 'all 0.3s ease'
            }}
          >
            <div className="kpi-label" style={{ color: '#475569', fontWeight: 600 }}>
              {todayLatestMileage?.isToday ? "Today's Latest Mileage" : "Last Mileage Update"}
            </div>
            <div className="kpi-value" style={{ fontSize: '1.8rem', fontWeight: 800, color: todayLatestMileage?.isToday ? '#10b981' : '#475569', margin: '4px 0' }}>
              {todayLatestMileage ? todayLatestMileage.mileage : '—'}
            </div>
            <div className="kpi-label" style={{ color: '#64748b', fontSize: '0.85rem' }}>
              {todayLatestMileage ? (
                <>
                  Vehicle: <strong>{todayLatestMileage.vehicle}</strong>
                  <span style={{ margin: '0 6px', color: '#cbd5e1' }}>|</span>
                  Date: <strong>{todayLatestMileage.date}</strong>
                </>
              ) : 'No logs recorded yet'}
            </div>
          </div>
        </div>



        {showMaintenance && (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '32px', animation: 'fadeIn 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Maintenance Expenditure Log</h3>
              <button onClick={() => setShowMaintenance(false)} style={{ background: '#f1f5f9', border: 'none', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer' }}>Close</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px' }}>Bus No</th>
                    <th style={{ padding: '12px' }}>Amount</th>
                    <th style={{ padding: '12px' }}>Service Detail</th>
                    <th style={{ padding: '12px' }}>Date</th>
                    <th style={{ padding: '12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {MAINTENANCE_DATA.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{item.vehicle}</td>
                      <td style={{ padding: '12px', color: '#be123c', fontWeight: 700 }}>{item.cost}</td>
                      <td style={{ padding: '12px' }}>{item.service}</td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{item.date}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          background: item.status === 'Completed' ? '#dcfce7' : '#fef3c7',
                          color: item.status === 'Completed' ? '#166534' : '#92400e'
                        }}>{item.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="detail-chart-block">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ margin: 0 }}>Bus Mileage Comparison</h4>
            <select
              value={mileageRange}
              onChange={(e) => setMileageRange(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
            >
              <option value="overall">Overall (All Time)</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="last_week">Last Week</option>
            </select>
          </div>
          <p className="detail-visual-hint" style={{ marginTop: 0 }}>
            <strong>How to read:</strong> Line graph comparing the average mileage (KM/L) across different buses.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={busMileageComparison} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="bus" tick={{ fontSize: 11 }} />
              <YAxis label={{ value: 'KM/L', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="mileage" stroke="#10b981" strokeWidth={3} name="Avg Mileage (KM/L)" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="detail-chart-block">
          <h4>Trips by route (today)</h4>
          <p className="detail-visual-hint">
            <strong>How to read:</strong> each bar is one route; height = number of trips on that route.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={routeTrips}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="route" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="trips" fill="#43a047" name="Trips" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="detail-chart-block">
          <h4>Vehicle Utilization Chart</h4>
          <p className="detail-visual-hint">
            <strong>How to read:</strong> horizontal bar chart showing KM travelled by each vehicle to find overused or underused buses.
          </p>
          <ResponsiveContainer width="100%" height={Math.max(260, vehicleUtilizationData.length * 40)}>
            <BarChart data={vehicleUtilizationData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" label={{ value: 'Distance (KM)', position: 'insideBottom', offset: -10 }} />
              <YAxis dataKey="label" type="category" tick={{ fontSize: 11 }} width={60} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="distance" fill="#fb8c00" name="KM Travelled" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </>
    );
  };

  const renderDriverList = () => (
    <div className="detail-inner-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button style={{ background: '#f1f5f9', border: 'none', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', transition: 'background 0.2s' }} onClick={() => setView('dashboard')} onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.5rem' }}>Driver Roster</h2>
          <p style={{ margin: 0, color: '#64748b' }}>{totalDrivers} Total Drivers Registered</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
        {DRIVERS_DATA.map(d => {
          let badgeText = d.status;
          let badgeBg = d.status === 'Present' ? '#dcfce7' : '#fee2e2';
          let badgeColor = d.status === 'Present' ? '#166534' : '#991b1b';

          if (d.todayRoute === 'Free Today') {
            badgeText = 'Free Today';
            badgeBg = '#fef08a';
            badgeColor = '#854d0e';
          }

          return (
            <div key={d.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => { setSelectedDriver(d); setView('driverDetail'); }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.05)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <img src={d.img} alt={d.name} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', marginBottom: 12 }} />
              <h4 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '1.1rem' }}>{d.name}</h4>
              <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, background: badgeBg, color: badgeColor }}>{badgeText}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderDriverDetail = () => {
    if (!selectedDriver) return null;

    const getBusLabel = (plate) => {
      if (!plate || plate === '-' || plate === 'N/A') return plate;
      const b = BUSES_DATA.find(x => x.number === plate);
      if (b && b.busNo) {
        return b.type === 'Car' ? `Car ${b.busNo}` : `Bus ${b.busNo}`;
      }
      return plate;
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const todaySched = selectedDriver.schedule?.find(s => s.date === todayStr) || { morningRoute: 'Free', morningBus: 'N/A', eveningRoute: 'Free', eveningBus: 'N/A', specialPlace: 'None', specialOut: '-', specialReturn: '-', carOrEV: 'No' };

    return (
      <div className="detail-inner-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <button
            style={{ background: '#f1f5f9', border: 'none', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', transition: 'background 0.2s' }}
            onClick={() => setView('driverList')}
            onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
          >
            ←
          </button>
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.5rem' }}>Driver Details</h2>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: 40, alignItems: 'center', background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <img src={selectedDriver.img} alt={selectedDriver.name} style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '4px solid #fff', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h1 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: '1.8rem' }}>{selectedDriver.name}</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 4 }}>Morning</div>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>{todaySched.morningRoute} - {getBusLabel(todaySched.morningBus)}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 4 }}>Evening</div>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>{todaySched.eveningRoute} - {getBusLabel(todaySched.eveningBus)}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 4 }}>Special</div>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>{todaySched.specialPlace === 'None' || !todaySched.specialPlace ? 'No Special Trip' : `${todaySched.specialPlace} (${todaySched.specialOut} - ${todaySched.specialReturn})`}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 4 }}>Car/EV</div>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>{getBusLabel(todaySched.carOrEV)}</div>
              </div>
            </div>
          </div>
        </div>

        <h3 style={{ color: '#1e293b', fontSize: '1.3rem', marginBottom: 20 }}>Schedule Log</h3>
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '16px 20px', color: '#475569', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '16px 20px', color: '#475569', fontWeight: 600 }}>Morning</th>
                <th style={{ padding: '16px 20px', color: '#475569', fontWeight: 600 }}>Evening</th>
                <th style={{ padding: '16px 20px', color: '#475569', fontWeight: 600 }}>Special</th>
                <th style={{ padding: '16px 20px', color: '#475569', fontWeight: 600 }}>Car/EV</th>
              </tr>
            </thead>
            <tbody>
              {[...(selectedDriver.schedule || [])].sort((a, b) => a.date.localeCompare(b.date)).map((s, idx) => (
                <tr key={idx} style={{ borderBottom: idx === (selectedDriver.schedule?.length || 1) - 1 ? 'none' : '1px solid #e2e8f0', background: '#fff' }}>
                  <td style={{ padding: '16px 20px', color: '#1e293b', fontWeight: 500, whiteSpace: 'nowrap' }}>{s.date}</td>
                  <td style={{ padding: '16px 20px', color: '#334155' }}>{s.morningRoute || '-'} - {s.morningBus ? getBusLabel(s.morningBus) : '-'}</td>
                  <td style={{ padding: '16px 20px', color: '#334155' }}>{s.eveningRoute || '-'} - {s.eveningBus ? getBusLabel(s.eveningBus) : '-'}</td>
                  <td style={{ padding: '16px 20px', color: '#334155' }}>{s.specialPlace === 'None' || !s.specialPlace ? '-' : `${s.specialPlace} (${s.specialOut || '-'}-${s.specialReturn || '-'})`}</td>
                  <td style={{ padding: '16px 20px', color: '#334155' }}>{s.carOrEV ? getBusLabel(s.carOrEV) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderBusList = () => (
    <div className="detail-inner-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button style={{ background: '#f1f5f9', border: 'none', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', transition: 'background 0.2s' }} onClick={() => setView('dashboard')} onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.5rem' }}>Bus & Van Fleet Management</h2>
          <p style={{ margin: 0, color: '#64748b' }}>{busVehicles.length} Vehicles Registered</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {busVehicles.map(bus => {
          const stats = getBusStats(bus.number);
          return (
            <div
              key={bus.id}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              onClick={() => { setSelectedBus(bus); setView('busDetail'); }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, background: '#e0f2f1', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00897b' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="10" width="20" height="8" rx="2" ry="2"></rect><path d="M17 18v2"></path><path d="M7 18v2"></path><path d="M7 10V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v5"></path></svg>
                  </div>
                  <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600, background: getStatusColors(bus.status).bg, color: getStatusColors(bus.status).color }}>
                    {bus.status}
                  </span>
                </div>
                <h3 style={{ margin: '0 0 2px 0', color: '#1e293b', fontSize: '1.1rem' }}>{bus.busNo ? `Bus ${bus.busNo}` : 'Bus (Unnumbered)'}</h3>
                <p style={{ margin: '0 0 8px 0', color: '#475569', fontSize: '0.82rem', fontWeight: 600 }}>{bus.number}</p>
                <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '0.78rem' }}>{bus.type} • {bus.route || 'Unassigned Route'}</p>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.78rem', color: '#475569' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Driver:</span>
                  <strong>{bus.driver || 'Unassigned'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Trips (M/E/S):</span>
                  <strong>{stats.morningTrips} M / {stats.eveningTrips} E / {stats.specialTrips} S</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Fuel Usage:</span>
                  <strong style={{ color: '#f59e0b' }}>{stats.totalFuel}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Latest Mileage:</span>
                  <strong style={{ color: '#166534' }}>{stats.latestMileage}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Attendance Count:</span>
                  <strong>{stats.totalAttendance} Present</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCarList = () => (
    <div className="detail-inner-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button style={{ background: '#f1f5f9', border: 'none', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', transition: 'background 0.2s' }} onClick={() => setView('dashboard')} onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.5rem' }}>Car & EV Fleet Management</h2>
          <p style={{ margin: 0, color: '#64748b' }}>{carVehicles.length} Vehicles Registered</p>
        </div>
      </div>

      {carMileageComparison.length > 0 && (
        <div className="detail-chart-block" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ margin: 0 }}>Car Mileage Comparison</h4>
            <select
              value={mileageRange}
              onChange={(e) => setMileageRange(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
            >
              <option value="overall">Overall (All Time)</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="last_week">Last Week</option>
            </select>
          </div>
          <p className="detail-visual-hint" style={{ marginTop: 0 }}>
            <strong>How to read:</strong> Line graph comparing the average mileage (KM/L) across different cars.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={carMileageComparison} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="car" tick={{ fontSize: 11 }} />
              <YAxis label={{ value: 'KM/L', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="mileage" stroke="#f59e0b" strokeWidth={3} name="Avg Mileage (KM/L)" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {carVehicles.map(car => {
          const stats = getBusStats(car.number);
          return (
            <div
              key={car.id}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              onClick={() => { setSelectedBus(car); setView('busDetail'); }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, background: '#e0f2f1', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00897b' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="10" width="20" height="8" rx="2" ry="2"></rect><path d="M17 18v2"></path><path d="M7 18v2"></path><path d="M7 10V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v5"></path></svg>
                  </div>
                  <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600, background: getStatusColors(car.status).bg, color: getStatusColors(car.status).color }}>
                    {car.status}
                  </span>
                </div>
                <h3 style={{ margin: '0 0 2px 0', color: '#1e293b', fontSize: '1.1rem' }}>{car.busNo ? `${car.type} ${car.busNo}` : `${car.type} (Unnumbered)`}</h3>
                <p style={{ margin: '0 0 8px 0', color: '#475569', fontSize: '0.82rem', fontWeight: 600 }}>{car.number}</p>
                <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '0.78rem' }}>{car.type} • {car.route || 'Unassigned Route'}</p>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.78rem', color: '#475569' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Driver:</span>
                  <strong>{car.driver || 'Unassigned'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Place Travelled:</span>
                  <strong>{stats.placeTravelled}</strong>
                </div>
                {car.type !== 'EV' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Fuel Usage:</span>
                      <strong style={{ color: '#f59e0b' }}>{stats.totalFuel}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Latest Mileage:</span>
                      <strong style={{ color: '#166534' }}>{stats.latestMileage}</strong>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Attendance Count:</span>
                  <strong>{stats.totalAttendance} Present</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderBusDetail = () => {
    if (!selectedBus) return null;

    // Reverse chronological for table display
    const tableMileageData = [...dailyMileageData].reverse();

    return (
      <div className="detail-inner-card">
        {/* Header Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <button
            style={{
              background: '#f1f5f9',
              border: 'none',
              width: 40,
              height: 40,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569',
              transition: 'background 0.2s'
            }}
            onClick={() => setView((selectedBus.type === 'Car' || selectedBus.type === 'EV') ? 'carList' : 'busList')}
            onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
          <span style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: 500 }}>
            {selectedBus.type === 'Car' || selectedBus.type === 'EV' ? 'Car/EV Details / Fleet Overview' : 'Bus Details / Fleet Overview'}
          </span>
        </div>

        {/* Bus/Car Info & Mileage Chart Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 32 }}>
          {/* Info Card */}
          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{ width: 56, height: 56, background: '#fff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1976d2', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="10" width="20" height="8" rx="2" ry="2"></rect><path d="M17 18v2"></path><path d="M7 18v2"></path><path d="M7 10V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v5"></path></svg>
                </div>
                <div>
                  <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>{selectedBus.busNo ? `${selectedBus.type} ${selectedBus.busNo}` : `${selectedBus.type} (Unnumbered)`}</h1>
                  <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 600, color: '#475569' }}>{selectedBus.number}</p>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedBus.type} • ID: {selectedBus.id}00{selectedBus.id}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '0.75rem' }}>Current Status</p>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: selectedBus.status === 'Active' ? '#166534' : '#475569' }}>{selectedBus.status}</span>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '0.75rem' }}>Current Driver</p>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>{selectedBus.driver || 'Unassigned'}</span>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '0.75rem' }}>Assigned Route</p>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>{selectedBus.route || 'Unassigned'}</span>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '0.75rem' }}>Weekly Avg Mileage</p>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#166534' }}>{analyticsSummary.weeklyAvgMileage} KM/L</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20, padding: '12px', background: '#f1f5f9', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 8px 0', color: '#475569', fontSize: '0.8rem', fontWeight: 600 }}>Fitness Certificate (FC) Details</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span>Last FC: <strong>{selectedBus.lastFC || '—'}</strong></span>
                <span style={{ color: (new Date(selectedBus.nextFC) - new Date()) / (1000 * 60 * 60 * 24) <= 10 ? '#be123c' : '#475569' }}>
                  Next FC: <strong>{selectedBus.nextFC || '—'}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* mileage trends chart */}
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ margin: 0, color: '#1e293b', fontSize: '1rem' }}>Mileage Graph</h4>
              <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', padding: 4, borderRadius: 8 }}>
                {['daily', 'weekly', 'monthly'].map(range => (
                  <button
                    key={range}
                    onClick={() => setGraphRange(range)}
                    style={{
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: graphRange === range ? '#fff' : 'transparent',
                      color: graphRange === range ? '#1976d2' : '#64748b',
                      boxShadow: graphRange === range ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                      transition: 'all 0.15s'
                    }}
                  >
                    {range.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, minHeight: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                  <YAxis stroke="#94a3b8" fontSize={9} domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.8rem' }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="mileage"
                    name="Mileage (KM/L)"
                    stroke="#1976d2"
                    strokeWidth={3}
                    dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <p style={{ margin: '12px 0 0 0', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
              Showing {graphRange} fuel efficiency changes in km/litre
            </p>
          </div>
        </div>

        {/* Analytics Summary cards Row */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ color: '#1e293b', fontSize: '1.15rem', marginBottom: 16 }}>Mileage & Analytics Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginBottom: 6 }}>Daily Total KM</span>
              <strong style={{ fontSize: '1.25rem', color: '#0f172a' }}>{analyticsSummary.dailyKM} KM</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginBottom: 6 }}>Monthly Total KM</span>
              <strong style={{ fontSize: '1.25rem', color: '#f59e0b' }}>{analyticsSummary.monthlyKM} KM</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginBottom: 6 }}>Weekly Avg Mileage</span>
              <strong style={{ fontSize: '1.25rem', color: '#166534' }}>{analyticsSummary.weeklyAvgMileage} KM/L</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginBottom: 6 }}>Highest Mileage Log</span>
              <strong style={{ fontSize: '0.85rem', color: '#1e293b', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={analyticsSummary.highest}>
                {analyticsSummary.highest}
              </strong>
            </div>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginBottom: 6 }}>Lowest Mileage Log</span>
              <strong style={{ fontSize: '0.85rem', color: '#be123c', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={analyticsSummary.lowest}>
                {analyticsSummary.lowest}
              </strong>
            </div>
          </div>
        </div>

        {/* Daily Mileage Table */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ color: '#1e293b', fontSize: '1.15rem', marginBottom: 16 }}>Fuel & Mileage History Log</h3>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '12px 16px' }}>Date</th>
                  <th style={{ padding: '12px 16px' }}>Odometer</th>
                  <th style={{ padding: '12px 16px' }}>Distance Travelled</th>
                  <th style={{ padding: '12px 16px' }}>Fuel Filled</th>
                  <th style={{ padding: '12px 16px' }}>Calculated Mileage</th>
                </tr>
              </thead>
              <tbody>
                {tableMileageData.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                      No fuel log entries recorded yet.
                    </td>
                  </tr>
                ) : (
                  tableMileageData.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', color: '#1e293b' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{row.date}</td>
                      <td style={{ padding: '12px 16px' }}>{row.startKM || row.odometer} KM</td>
                      <td style={{ padding: '12px 16px', fontWeight: 500 }}>{row.distance.toFixed(1)} KM</td>
                      <td style={{ padding: '12px 16px', color: '#f59e0b' }}>{row.fuelUsage.toFixed(1)} L</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: row.mileage !== 'N/A' ? '#166534' : '#64748b' }}>
                        {row.mileage !== 'N/A' ? `${row.mileage} KM/L` : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trips History (Multiple Trips Per Day) */}
        <div>
          <h3 style={{ color: '#1e293b', fontSize: '1.15rem', marginBottom: 16 }}>Trips Log & Schedule Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {busTrips.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', fontStyle: 'italic' }}>
                No trips logged for this bus.
              </div>
            ) : (
              busTrips.map(trip => (
                <div
                  key={trip.id}
                  onClick={() => { setSelectedTrip(trip); setView('tripDetail'); }}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#1976d2'; e.currentTarget.style.background = '#f0f7ff'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
                    <div>
                      <strong style={{ fontSize: '1.05rem', color: '#1e293b' }}>{trip.date}</strong>
                      <span style={{ marginLeft: 12, padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, background: '#e0f2fe', color: '#0369a1' }}>
                        {trip.tripType} Trip
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Driver: <strong style={{ color: '#1e293b' }}>{trip.driverName || 'Unassigned'}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, fontSize: '0.82rem', color: '#475569' }}>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>PLACE / ROUTE</span>
                      <strong>{trip.routeName || 'N/A'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>TIMINGS</span>
                      <strong>{trip.startTime || '—'} to {trip.endTime || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>ODOMETER READINGS</span>
                      <strong>{trip.startKM} - {trip.endKM} KM</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>DISTANCE & FUEL</span>
                      <strong>{trip.distance} KM / {trip.fuelUsage} L</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>ATTENDANCE STRENGTH</span>
                      <strong style={{ color: '#166534' }}>{trip.rawAttendance} / {trip.students} Present ({trip.morningAttendance})</strong>
                    </div>
                  </div>

                  {trip.remarks && (
                    <div style={{ fontSize: '0.78rem', color: '#64748b', background: '#fff', padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0', marginTop: 4 }}>
                      <strong>Remarks:</strong> {trip.remarks}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTripDetail = () => {
    if (!selectedTrip || !selectedBus) return null;

    const isMorning = activeShift === 'morning';
    const currentPeople = selectedTrip.people.map(p => ({
      ...p,
      isPresent: isMorning ? p.morningPresent : p.eveningPresent
    }));

    const paidCount = selectedTrip.people.filter(p => p.feePaid).length;
    const unpaidCount = selectedTrip.people.length - paidCount;

    const presentStudents = currentPeople.filter(p => p.type === 'Student' && p.isPresent).length;
    const absentStudents = selectedTrip.students - presentStudents;
    const presentFaculty = currentPeople.filter(p => p.type === 'Faculty' && p.isPresent).length;
    const absentFaculty = selectedTrip.faculty - presentFaculty;
    const totalPresent = presentStudents + presentFaculty;

    return (
      <div className="detail-inner-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={{ background: '#f1f5f9', border: 'none', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', transition: 'background 0.2s' }} onClick={() => { setView('busDetail'); setShowPeople(false); }} onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            </button>
            <span style={{ color: '#64748b', fontSize: '1rem', fontWeight: 600 }}>Trip Report - {selectedTrip.date}</span>
          </div>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: '100%', maxWidth: '320px' }}>
            <button
              onClick={() => setActiveShift('morning')}
              style={{ flex: 1, padding: '6px 12px', fontSize: '0.85rem', borderRadius: '8px', border: 'none', background: isMorning ? '#fff' : 'transparent', color: isMorning ? '#1976d2' : '#64748b', fontWeight: 600, cursor: 'pointer', boxShadow: isMorning ? '0 2px 6px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
            >
              Morning
            </button>
            <button
              onClick={() => setActiveShift('evening')}
              style={{ flex: 1, padding: '6px 12px', fontSize: '0.85rem', borderRadius: '8px', border: 'none', background: !isMorning ? '#fff' : 'transparent', color: !isMorning ? '#1976d2' : '#64748b', fontWeight: 600, cursor: 'pointer', boxShadow: !isMorning ? '0 2px 6px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
            >
              Evening
            </button>
          </div>
        </div>

        <div className="responsive-grid" style={{ marginBottom: '32px' }}>
          <div style={{ background: isMorning ? '#fff7ed' : '#f5f3ff', padding: '20px', borderRadius: '16px', border: `1px solid ${isMorning ? '#ffedd5' : '#ddd6fe'}`, textAlign: 'center' }}>
            <div style={{ color: isMorning ? '#9a3412' : '#6d28d9', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>
              {isMorning ? 'Morning' : 'Evening'} Strength
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: isMorning ? '#7c2d12' : '#4c1d95' }}>{totalPresent}</div>
            <div style={{ color: isMorning ? '#9a3412' : '#6d28d9', fontSize: '0.75rem' }}>Members in Bus</div>
          </div>
          <div style={{ background: '#fff1f2', padding: '20px', borderRadius: '16px', border: '1px solid #ffe4e6', textAlign: 'center' }}>
            <div style={{ color: '#9f1239', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>Absent ({activeShift})</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#be123c' }}>{absentStudents + absentFaculty}</div>
            <div style={{ color: '#be123c', fontSize: '0.75rem' }}>Not boarded</div>
          </div>
        </div>

        {/* Operational Metadata */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '32px' }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>📋 Operational Details</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '0.85rem' }}>
            <div><strong style={{ color: '#475569' }}>Driver Assigned:</strong> <span style={{ fontWeight: 600, color: '#1e293b' }}>{selectedTrip.driverName || 'N/A'}</span></div>
            <div><strong style={{ color: '#475569' }}>Route Name:</strong> <span style={{ fontWeight: 600, color: '#1e293b' }}>{selectedTrip.routeName || 'N/A'}</span></div>
            <div><strong style={{ color: '#475569' }}>Trip Type:</strong> <span style={{ fontWeight: 600, color: '#1e293b' }}>{selectedTrip.tripType || 'N/A'}</span></div>
            <div><strong style={{ color: '#475569' }}>Time Window:</strong> <span style={{ fontWeight: 600, color: '#1e293b' }}>{selectedTrip.startTime || '—'} to {selectedTrip.endTime || '—'}</span></div>
            <div><strong style={{ color: '#475569' }}>Odometer readings:</strong> <span style={{ fontWeight: 600, color: '#1e293b' }}>{selectedTrip.startKM || '0'} KM - {selectedTrip.endKM || '0'} KM</span></div>
            <div><strong style={{ color: '#475569' }}>Distance Travelled:</strong> <span style={{ fontWeight: 700, color: '#10b981' }}>{selectedTrip.distance ? `${selectedTrip.distance.toFixed(1)} KM` : '—'}</span></div>
            <div><strong style={{ color: '#475569' }}>Fuel Used:</strong> <span style={{ fontWeight: 600, color: '#f59e0b' }}>{selectedTrip.fuelUsage > 0 ? `${selectedTrip.fuelUsage} Litres` : '—'}</span></div>
            <div><strong style={{ color: '#475569' }}>Remarks:</strong> <span style={{ fontWeight: 500, color: '#64748b', fontStyle: 'italic' }}>{selectedTrip.remarks || 'No remarks'}</span></div>
          </div>
        </div>

        <div className="responsive-grid" style={{ marginBottom: '32px' }}>
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 600 }}>Students ({activeShift})</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' }}>{presentStudents}/{selectedTrip.students}</div>
            <div style={{ color: '#16a34a', fontSize: '0.7rem', fontWeight: 600 }}>{Math.round((presentStudents / selectedTrip.students) * 100)}% Present</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 600 }}>Faculty ({activeShift})</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' }}>{presentFaculty}/{selectedTrip.faculty}</div>
            <div style={{ color: '#16a34a', fontSize: '0.7rem', fontWeight: 600 }}>{Math.round((presentFaculty / selectedTrip.faculty) * 100)}% Present</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 600 }}>Fee Paid</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#166534' }}>{paidCount}</div>
            <div style={{ color: '#16a34a', fontSize: '0.7rem' }}>Cleared</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 600 }}>Pending</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#be123c' }}>{unpaidCount}</div>
            <div style={{ color: '#be123c', fontSize: '0.7rem' }}>Due</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <h3 style={{ color: '#1e293b', fontSize: '1.1rem', margin: 0 }}>Attendance List</h3>
          <button
            onClick={() => setShowPeople(!showPeople)}
            style={{
              background: showPeople ? '#1e293b' : '#1976d2',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s'
            }}
          >
            {showPeople ? 'Hide List' : `View Strength`}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: showPeople ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="M6 9l6 6 6-6" /></svg>
          </button>
        </div>

        {showPeople && (
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', animation: 'fadeIn 0.3s ease-out' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '16px 20px', color: '#475569', fontWeight: 600 }}>Type</th>
                  <th style={{ padding: '16px 20px', color: '#475569', fontWeight: 600 }}>Name</th>
                  <th style={{ padding: '16px 20px', color: '#475569', fontWeight: 600 }}>Roll No / ID</th>
                  <th style={{ padding: '16px 20px', color: '#475569', fontWeight: 600 }}>{isMorning ? 'Morning' : 'Evening'} Status</th>
                  <th style={{ padding: '16px 20px', color: '#475569', fontWeight: 600 }}>Fee Status</th>
                </tr>
              </thead>
              <tbody>
                {currentPeople.map((person, idx) => (
                  <tr key={idx} style={{ borderBottom: idx === currentPeople.length - 1 ? 'none' : '1px solid #e2e8f0', background: person.isPresent ? 'transparent' : '#fff1f255' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: person.type === 'Student' ? '#e0f2fe' : '#fef3c7',
                        color: person.type === 'Student' ? '#0369a1' : '#92400e'
                      }}>
                        {person.type}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#1e293b', fontWeight: 500 }}>{person.name}</td>
                    <td style={{ padding: '16px 20px', color: '#64748b' }}>{person.rollNo || 'N/A'}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '999px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        background: person.isPresent ? '#dcfce7' : '#fee2e2',
                        color: person.isPresent ? '#166534' : '#991b1b'
                      }}>
                        {person.isPresent ? 'Present' : 'Absent'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: person.feePaid ? '#166534' : '#be123c',
                        fontWeight: 600,
                        fontSize: '0.9rem'
                      }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: person.feePaid ? '#166534' : '#be123c' }}></div>
                        {person.feePaid ? 'Paid' : 'Not Paid'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };
  const renderSpecialTrips = () => {
    const specialTrips = (backendData?.trips || []).filter(t => t.tripType === 'Special');
    const pendingCount = specialTrips.filter(t => t.tripStatus === 'Pending Approval').length;
    const activeCount = specialTrips.filter(t => t.tripStatus === 'In Progress').length;

    const handleStatusUpdate = (trip, statusStr) => {
      if (!currentUser || (currentUser.role !== 'unit_head' && currentUser.role !== 'admin')) {
        alert("Unauthorized: Only the Unit Head or Admin can change the trip status.");
        return;
      }

      let payload = { id: trip.id, tripStatus: statusStr };

      if (statusStr === 'Approved') {
        const authName = prompt(`Enter Unit Head Name to authorize changing status to '${statusStr}':`, currentUser.name || '');
        if (!authName) return;
        payload.approvedBy = authName;
      } else if (statusStr === 'In Progress') {
        const startKMInput = prompt("Enter Start KM (Mandatory):");
        if (startKMInput === null) return;
        const startKM = parseFloat(startKMInput);
        if (isNaN(startKM) || startKM <= 0) {
          alert("Start KM is required, must be a positive number.");
          return;
        }
        payload.startKM = startKM;
      } else if (statusStr === 'Completed') {
        const endKMInput = prompt("Enter End KM (Mandatory):");
        if (endKMInput === null) return;
        const endKM = parseFloat(endKMInput);
        if (isNaN(endKM) || endKM <= 0) {
          alert("End KM is required, must be a positive number.");
          return;
        }
        if (endKM <= (trip.startKM || 0)) {
          alert(`End KM must be greater than Start KM (${trip.startKM || 0}).`);
          return;
        }

        const now = new Date();
        const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const actualEndTime = prompt("Enter Completion Time (HH:MM) (Mandatory):", defaultTime);
        if (!actualEndTime) {
          alert("Completion time is mandatory to complete the trip.");
          return;
        }
        payload.endKM = endKM;
        payload.actualEndTime = actualEndTime;
      }

      fetch('http://localhost:8085/api/transport/update-trip-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(() => fetchData());
    };

    return (
      <div style={{ animation: 'fadeIn 0.4s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, color: '#1e293b' }}>⭐ Special Trips Dashboard</h2>
          <button onClick={() => setView('dashboard')} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>← Back to Dashboard</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '20px', borderRadius: '16px', textAlign: 'center' }}>
            <div style={{ color: '#d97706', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Pending Approval</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#b45309' }}>{pendingCount}</div>
          </div>
          <div style={{ background: '#eff6ff', border: '1px solid #dbeafe', padding: '20px', borderRadius: '16px', textAlign: 'center' }}>
            <div style={{ color: '#2563eb', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>In Progress</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1d4ed8' }}>{activeCount}</div>
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', padding: '20px', borderRadius: '16px', textAlign: 'center' }}>
            <div style={{ color: '#16a34a', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Completed (All Time)</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#15803d' }}>{specialTrips.filter(t => t.tripStatus === 'Completed').length}</div>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Purpose</th>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Bus / Driver</th>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Timing</th>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Requested By</th>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {specialTrips.sort((a, b) => b.id - a.id).map(trip => {
                const currentStatus = trip.tripStatus || 'Pending Approval';
                return (
                  <tr key={trip.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{trip.purpose || trip.routeName}<br /><span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}>Place: {trip.routeName}</span></td>
                    <td style={{ padding: '12px 16px' }}>{trip.busNumber}<br /><span style={{ fontSize: '0.75rem', color: '#64748b' }}>{trip.driverName}</span></td>
                    <td style={{ padding: '12px 16px' }}>{trip.startTime} to {trip.expectedEndTime}</td>
                    <td style={{ padding: '12px 16px' }}>{trip.requestedBy}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                        background: currentStatus === 'Pending Approval' ? '#fef3c7' : currentStatus === 'Approved' ? '#e0e7ff' : currentStatus === 'In Progress' ? '#dbeafe' : currentStatus === 'Completed' ? '#dcfce7' : '#fee2e2',
                        color: currentStatus === 'Pending Approval' ? '#d97706' : currentStatus === 'Approved' ? '#4f46e5' : currentStatus === 'In Progress' ? '#2563eb' : currentStatus === 'Completed' ? '#16a34a' : '#ef4444'
                      }}>
                        {currentStatus}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {currentStatus === 'Pending Approval' && (
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button onClick={() => handleStatusUpdate(trip, 'Approved')} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Approve</button>
                          <button onClick={() => handleStatusUpdate(trip, 'Cancelled')} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Reject</button>
                        </div>
                      )}
                      {currentStatus === 'Approved' && (
                        <button onClick={() => handleStatusUpdate(trip, 'In Progress')} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Start Trip</button>
                      )}
                      {currentStatus === 'In Progress' && (
                        <button onClick={() => handleStatusUpdate(trip, 'Completed')} style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Complete</button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {specialTrips.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No special trips found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="unit-detail-container">
      {view === 'dashboard' && renderDashboard()}
      {view === 'driverList' && renderDriverList()}
      {view === 'driverDetail' && renderDriverDetail()}
      {view === 'busList' && renderBusList()}
      {view === 'carList' && renderCarList()}
      {view === 'busDetail' && renderBusDetail()}
      {view === 'tripDetail' && renderTripDetail()}
      {view === 'specialTrips' && renderSpecialTrips()}
    </div>
  );
}
