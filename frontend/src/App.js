
import React, { useEffect, useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  BrowserRouter as Router,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import './App.css';
import PowerHouseDetail from './PowerHouseDetail';
import ChillerPlantDetail from './ChillerPlantDetail';
import ROPlantDetail from './ROPlantDetail';
import HostelsDetail from './HostelsDetail';
import TransportDetail from './TransportDetail';
import MessDetail from './MessDetail';
import MedicalCentreDetail from './MedicalCentreDetail';
import STPDetail from './STPDetail';
import CampusMaintDetail from './CampusMaintDetail';
import SportsGymDetail from './SportsGymDetail';
import TrcNmCDetail from './TrcNmCDetail';
import HorticultureDetail from './HorticultureDetail';
import UnitDataForm from './UnitDataForm';
import TransportUnitForm from './TransportUnitForm';
import HorticultureUnitForm from './HorticultureUnitForm';
import PlumbingDetail from './PlumbingDetail';
import PlumbingUnitForm from './PlumbingUnitForm';
import PowerHouseUnitForm from './PowerHouseUnitForm';
import { buildExecutivePayload, exportExecutivePdf, exportExecutiveExcel } from './exportReports';

/** Unit names with open maintenance / compliance alerts (drives count + red highlight). */
const ACTIVE_ALERT_UNIT_NAMES = ['Plumbing', 'Campus Maint.', 'Transport'];

/**
 * Critical alerts for Dean/Senior Management alert log (demo).
 * Categories: transport bus incident, power outage, STP breach, medical emergency, other.
 */
const EXECUTIVE_CRITICAL_ALERTS = [
  {
    id: 'ex-1',
    category: 'Power outage',
    unit: 'Power House',
    detail: 'Main incomer trip — campus on DG; restoration 47 min',
    occurredAt: '2026-05-12 09:14',
  },
  {
    id: 'ex-2',
    category: 'Transport bus incident',
    unit: 'Transport',
    detail: 'BUS-07 brake warning — vehicle withdrawn pending inspection',
    occurredAt: '2026-05-11 16:40',
  },
  {
    id: 'ex-3',
    category: 'STP breach risk',
    unit: 'STP',
    detail: 'Effluent BOD above consent band — dosing adjusted; TNPCB log updated',
    occurredAt: '2026-05-10 07:22',
  },
  {
    id: 'ex-4',
    category: 'Medical emergency',
    unit: 'Medical Centre',
    detail: 'Acute case stabilised and referred to district hospital',
    occurredAt: '2026-05-09 14:05',
  },
  {
    id: 'ex-5',
    category: 'Other',
    unit: 'TRC / NMC',
    detail: 'Core switch failover — brief Wi‑Fi interruption (self-healed)',
    occurredAt: '2026-05-08 11:18',
  },
];

/** Campus-wide monthly comparative figures (demo). Energy & maintenance in ₹ Lakhs; water in KL. */
function buildMonthlyComparisonRows() {
  const now = new Date();
  const rows = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth();
    rows.push({
      label: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
      energyCostLakh: Number((41.2 + (m % 4) * 0.35 + i * 0.05).toFixed(2)),
      waterKL: Math.round(1980 + i * 42 + (m % 3) * 28),
      maintenanceLakh: Number((10.4 + (i % 3) * 0.25).toFixed(2)),
    });
  }
  return rows;
}

const MONTHLY_COMPARISON_ROWS = buildMonthlyComparisonRows();

/**
 * Last 6 months trend (demo). If earlier months had no uploads, they align to the same
 * starting-period baseline then drift slightly — see note in modal.
 */
function buildSixMonthTrendSeries() {
  const anchorEnergy = 40.5;
  const anchorWater = 1960;
  const anchorMaint = 10.2;
  const now = new Date();
  const series = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const idx = 5 - i;
    const useBaselineOnly = idx < 2;
    const energy = useBaselineOnly
      ? anchorEnergy
      : Number((anchorEnergy + idx * 0.28 + Math.sin(idx * 0.7) * 0.4).toFixed(2));
    const water = useBaselineOnly
      ? anchorWater
      : Math.round(anchorWater + idx * 38 + Math.cos(idx) * 22);
    const maint = useBaselineOnly
      ? anchorMaint
      : Number((anchorMaint + idx * 0.12 + (idx % 2) * 0.15).toFixed(2));
    series.push({
      month: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
      energyCostLakh: energy,
      waterKL: water,
      maintenanceLakh: maint,
    });
  }
  return series;
}

const SIX_MONTH_TREND = buildSixMonthTrendSeries();

const summaryData = [
  { label: 'Total Units', value: 14, color: '#d32f2f' },
  { label: 'Active Alerts', value: ACTIVE_ALERT_UNIT_NAMES.length, color: '#fbc02d', toggleAlerts: true },
  { label: 'Reports Pending', value: 5, color: '#1976d2' },
  { label: 'Compliance %', value: '87%', color: '#c2185b' },
];

/** Dean / admin: full dashboard + all unit details; cannot edit unit data forms. */
const DEAN_ADMIN_USERS = [
  {
    id: 'dean-admin',
    name: 'Dean / Admin',
    username: 'dean.admin',
    password: 'Dean@2026',
    role: 'admin',
  },
];

const UNIT_HEAD_USERS = [
  { id: 'head-power', name: 'Power House Head', username: 'power.head', password: 'Power@123', unitName: 'Power House' },
  { id: 'head-chiller', name: 'Chiller Plant Head', username: 'chiller.head', password: 'Chiller@123', unitName: 'Chiller Plant' },
  { id: 'head-transport', name: 'Transport Head', username: 'transport.head', password: 'Transport@123', unitName: 'Transport' },
  { id: 'head-hostels', name: 'Hostels Head', username: 'hostels.head', password: 'Hostels@123', unitName: 'Hostels' },
  { id: 'head-mess', name: 'Mess Head', username: 'mess.head', password: 'Mess@123', unitName: 'Mess' },
  { id: 'head-ro', name: 'RO Plant Head', username: 'ro.head', password: 'RO@123', unitName: 'RO Plant' },
  { id: 'head-sports', name: 'Sports/Gym Head', username: 'sports.head', password: 'Sports@123', unitName: 'Sports/Gym' },
  { id: 'head-medical', name: 'Medical Centre Head', username: 'medical.head', password: 'Medical@123', unitName: 'Medical Centre' },
  { id: 'head-campus', name: 'Campus Maintenance Head', username: 'campus.head', password: 'Campus@123', unitName: 'Campus Maint.' },
  { id: 'head-plumbing', name: 'Plumbing Head', username: 'plumbing.head', password: 'Plumbing@123', unitName: 'Plumbing' },
  { id: 'head-stp', name: 'STP Head', username: 'stp.head', password: 'STP@123', unitName: 'STP' },
  { id: 'head-trc', name: 'TRC / NMC Head', username: 'trc.head', password: 'TRC@123', unitName: 'TRC / NMC' },
  { id: 'head-horticulture', name: 'Horticulture Head', username: 'horticulture.head', password: 'Horticulture@123', unitName: 'Horticulture' },
];

function getKpiBand(score) {
  if (score < 60) return 'red';
  if (score < 80) return 'amber';
  return 'green';
}

const modules = [
  { name: 'Power House', details: 'Units On: 4/4 | Consumption: 840 kWh', kpiScore: 86 },
  { name: 'Chiller Plant', details: 'Chillers Active: 3 | Load: 72%', kpiScore: 74 },
  { name: 'Transport', details: 'Buses Active: 12/15 | Trips Today: 28', kpiScore: 58 },
  { name: 'Hostels', details: 'Occupancy: 94% | Complaints: 2', kpiScore: 84 },
  { name: 'Mess', details: 'Meals Served: 1,240 | Waste: Low', kpiScore: 81 },
  { name: 'RO Plant', details: 'Output: 12,000 L | Status: Normal', kpiScore: 88 },
  { name: 'Sports/Gym', details: 'Utilisation: 68% | Events: 1', kpiScore: 69 },
  { name: 'Medical Centre', details: 'OPD: 23 | Referrals: 1', kpiScore: 76 },
  { name: 'Campus Maint.', details: 'Requests: 8 | Resolved: 6', kpiScore: 57 },
  { name: 'Plumbing', details: 'Complaints: 3 | Pending: 1', kpiScore: 52 },
  { name: 'STP', details: 'Treated: 45,000 L | Quality: OK', kpiScore: 79 },
  { name: 'TRC / NMC', details: 'Active Sessions: 4 | Users: 310', kpiScore: 82 },
  { name: 'Horticulture', details: 'Total Species: 8 | Garden Areas: 9', kpiScore: 88 },
];

const UNIT_FORM_FIELDS = {
  'Power House': [
    { key: 'installedGenerationCapacity', parameter: 'Installed Generation Capacity', description: 'Total kVA / kW capacity of all generators and transformers', unit: 'kVA / kW', frequency: 'One-time' },
    { key: 'dailyEnergyConsumption', parameter: 'Daily Energy Consumption', description: 'Total units consumed per day (kWh)', unit: 'kWh', frequency: 'Daily' },
    { key: 'monthlyElectricityBill', parameter: 'Monthly Electricity Bill', description: 'Amount paid to TNEB per month', unit: 'INR', frequency: 'Monthly' },
    { key: 'powerFactor', parameter: 'Power Factor', description: 'Average power factor of the campus load', unit: 'Numeric (0-1)', frequency: 'Optional' },
    { key: 'scheduledMaintenanceDates', parameter: 'Scheduled Maintenance Dates', description: 'Last and next preventive maintenance date', unit: 'DD/MM/YYYY', frequency: 'Event-based' },
    { key: 'breakdownIncidents', parameter: 'Breakdown Incidents (Last 6 months)', description: 'Number, date, duration, and cause of breakdowns', unit: 'Count + Details', frequency: 'Historical' },
    { key: 'dgFuelConsumption', parameter: 'DG Set Fuel Consumption', description: 'Litres consumed per day during grid failure', unit: 'Litres/day', frequency: 'Optional' },
    { key: 'peakLoadHours', parameter: 'Peak Load Hours', description: 'Hours during which max load is observed', unit: 'HH:MM - HH:MM', frequency: 'Weekly' },
  ],
  'Chiller Plant': [
    { key: 'installedChillers', parameter: 'Number of Chillers Installed', description: 'Total chillers and TR capacity available', unit: 'Count + TR', frequency: 'One-time' },
    { key: 'dailyOperatingHours', parameter: 'Daily Operating Hours', description: 'Total running hours across chillers per day', unit: 'Hours/day', frequency: 'Daily' },
    { key: 'loadFactor', parameter: 'Average Load Factor', description: 'Average load on active chillers', unit: '%', frequency: 'Optional' },
    { key: 'energyConsumption', parameter: 'Energy Consumption', description: 'Total electricity used by chiller plant', unit: 'kWh/day', frequency: 'Optional' },
    { key: 'chilledWaterTemp', parameter: 'Chilled Water Temperature', description: 'Supply and return temperature reading', unit: 'deg C', frequency: 'Optional' },
    { key: 'alarmsBreakdowns', parameter: 'Breakdowns / Alarms', description: 'Event details including date and resolution', unit: 'Count + Details', frequency: 'Event-based' },
  ],
  Transport: [
    { key: 'fleetStrength', parameter: 'Total Fleet Strength', description: 'Number of buses, vans, and support vehicles', unit: 'Count', frequency: 'One-time' },
    { key: 'dailyOperationalVehicles', parameter: 'Daily Operational Vehicles', description: 'Vehicles in service each day', unit: 'Count', frequency: 'Daily' },
    { key: 'routeTrips', parameter: 'Route-wise Trip Details', description: 'Trips completed route by route', unit: 'Count + Route', frequency: 'Optional' },
    { key: 'fuel', parameter: 'Fuel Consumption', description: 'Fuel consumed per vehicle per day', unit: 'L/day', frequency: 'Optional' },
    { key: 'breakdowns', parameter: 'Breakdown Incidents', description: 'Date, vehicle, cause, downtime', unit: 'Count + Details', frequency: 'Event-based' },
  ],
  Hostels: [
    { key: 'occupancy', parameter: 'Occupancy Rate', description: 'Occupied beds vs total available beds', unit: '%', frequency: 'Daily' },
    { key: 'complaints', parameter: 'Hostel Complaints', description: 'Total complaints raised by residents', unit: 'Count', frequency: 'Optional' },
    { key: 'electricity', parameter: 'Electricity Consumption', description: 'Hostel electricity usage', unit: 'kWh', frequency: 'Optional' },
    { key: 'water', parameter: 'Water Consumption', description: 'Hostel water usage', unit: 'KL/day', frequency: 'Optional' },
    { key: 'discipline', parameter: 'Disciplinary Incidents', description: 'Incident details and actions', unit: 'Count + Details', frequency: 'Event-based' },
  ],
  Mess: [
    { key: 'seating', parameter: 'Total Seating Capacity', description: 'Maximum students that can be seated', unit: 'Count', frequency: 'One-time' },
    { key: 'dailyMeals', parameter: 'Daily Meals Served (B/L/D)', description: 'Breakfast, lunch, and dinner served', unit: 'Count', frequency: 'Daily' },
    { key: 'waste', parameter: 'Food Waste Quantity', description: 'Estimated food waste generated', unit: 'kg/meal', frequency: 'Optional' },
    { key: 'feedback', parameter: 'Feedback Score', description: 'Student weekly satisfaction score', unit: 'Score (1-5)', frequency: 'Weekly' },
    { key: 'monthlyFoodCost', parameter: 'Monthly Food Cost', description: 'Raw material and cooking expenditure', unit: 'INR', frequency: 'Monthly' },
  ],
  'RO Plant': [
    { key: 'capacity', parameter: 'Total Production Capacity', description: 'Rated plant output capacity', unit: 'L/day', frequency: 'One-time' },
    { key: 'dailyOutput', parameter: 'Actual Daily Output', description: 'Water produced per day', unit: 'L/day', frequency: 'Daily' },
    { key: 'tds', parameter: 'TDS Levels', description: 'Output water TDS after treatment', unit: 'mg/L', frequency: 'Optional' },
    { key: 'rejection', parameter: 'Rejection Rate', description: 'Water rejected during purification', unit: '%', frequency: 'Optional' },
    { key: 'membraneService', parameter: 'Filter / Membrane Change', description: 'Last and next change date', unit: 'DD/MM/YYYY', frequency: 'Event-based' },
  ],
  'Sports/Gym': [
    { key: 'facilities', parameter: 'Sports Facilities Available', description: 'Grounds, courts, and indoor facilities', unit: 'Text', frequency: 'One-time' },
    { key: 'utilisationHours', parameter: 'Daily Utilisation Hours', description: 'Hours each facility is actively used', unit: 'Hours/day', frequency: 'Daily' },
    { key: 'members', parameter: 'Registered Sports Members', description: 'Total registered users', unit: 'Count', frequency: 'Monthly' },
    { key: 'events', parameter: 'Events / Tournaments Held', description: 'Event name, type, and date', unit: 'Count + Dates', frequency: 'Event-based' },
    { key: 'gymInventory', parameter: 'Gym Equipment Inventory', description: 'Equipment name, condition, service status', unit: 'Count + Status', frequency: 'Monthly' },
  ],
  'Medical Centre': [
    { key: 'opd', parameter: 'Daily OPD Count', description: 'Patients attended in OPD', unit: 'Count', frequency: 'Daily' },
    { key: 'doctorNurse', parameter: 'Doctor / Nurse Availability', description: 'Names, qualifications, duty hours', unit: 'Text', frequency: 'Weekly' },
    { key: 'ailments', parameter: 'Common Ailments Reported', description: 'Top recurring health conditions', unit: 'Text', frequency: 'Monthly' },
    { key: 'stock', parameter: 'Medicine Stock Status', description: 'Essential medicine availability', unit: 'Stock Level', frequency: 'Weekly' },
    { key: 'referrals', parameter: 'Emergency Referrals', description: 'Cases referred to hospitals', unit: 'Count', frequency: 'Monthly' },
  ],
  'Campus Maint.': [
    { key: 'tickets', parameter: 'Maintenance Request Tickets', description: 'Raised, resolved, and pending requests', unit: 'Count', frequency: 'Monthly' },
    { key: 'categories', parameter: 'Categories of Complaints', description: 'Electrical, civil, carpentry, painting, etc.', unit: 'Category + Count', frequency: 'Monthly' },
    { key: 'tat', parameter: 'Average Resolution Time', description: 'Average closure time', unit: 'Hours / Days', frequency: 'Monthly' },
    { key: 'vendors', parameter: 'Contractor / Vendor Details', description: 'Names, contracts, and AMC schedules', unit: 'Text', frequency: 'One-time' },
    { key: 'budget', parameter: 'Annual Maintenance Budget', description: 'Budgeted vs actual expenditure', unit: 'INR', frequency: 'Annual' },
  ],
  Plumbing: [
    { key: 'noOfMotors', parameter: 'Number of Motors', description: 'Total active pumps and motors', unit: 'Count', frequency: 'Optional' },
    { key: 'motorRatingHP', parameter: 'Motor Ratings', description: 'Power ratings of motors (e.g. 5 HP, 10 HP)', unit: 'HP', frequency: 'One-time' },
    { key: 'motorOperatingHours', parameter: 'Motor Operating Hours', description: 'Daily run hours for each motor', unit: 'Hours/day', frequency: 'Daily' },
    { key: 'complaints', parameter: 'Plumbing Complaints', description: 'Total complaints received', unit: 'Count', frequency: 'Optional' },
    { key: 'resolved', parameter: 'Resolved Complaints', description: 'Complaints closed and verified', unit: 'Count', frequency: 'Optional' },
    { key: 'pending', parameter: 'Pending Complaints', description: 'Open items requiring action', unit: 'Count', frequency: 'Optional' },
    { key: 'avgResolution', parameter: 'Average Resolution Time', description: 'Closure time for plumbing complaints', unit: 'Hours', frequency: 'Weekly' },
    { key: 'majorBreakdowns', parameter: 'Major Breakdowns', description: 'Significant incidents and root cause', unit: 'Count + Details', frequency: 'Event-based' },
  ],
  STP: [
    { key: 'capacity', parameter: 'Design Capacity', description: 'Rated STP capacity', unit: 'KLD', frequency: 'One-time' },
    { key: 'inlet', parameter: 'Daily Inlet Volume', description: 'Sewage received per day', unit: 'KLD', frequency: 'Optional' },
    { key: 'treated', parameter: 'Treated Water Output', description: 'Treated water produced per day', unit: 'KLD', frequency: 'Daily' },
    { key: 'quality', parameter: 'Water Quality Parameters', description: 'BOD, COD, TSS before/after treatment', unit: 'mg/L', frequency: 'Weekly' },
    { key: 'energy', parameter: 'Energy Consumption', description: 'Daily electricity used by STP', unit: 'kWh', frequency: 'Optional' },
  ],
  'TRC / NMC': [
    { key: 'bandwidth', parameter: 'Internet Bandwidth (Total)', description: 'Subscribed and actual throughput', unit: 'Mbps', frequency: 'Optional' },
    { key: 'uptime', parameter: 'Network Uptime (%)', description: 'Availability percentage', unit: '%', frequency: 'Monthly' },
    { key: 'tickets', parameter: 'Complaint / Ticket Count', description: 'Total complaints raised and resolved', unit: 'Count', frequency: 'Monthly' },
    { key: 'devices', parameter: 'No. of Connected Devices', description: 'Active devices on campus network', unit: 'Count', frequency: 'Monthly' },
    { key: 'labUtilisation', parameter: 'Daily Lab Utilisation', description: 'Sessions conducted and user count', unit: 'Sessions + Count', frequency: 'Daily' },
  ],
  Horticulture: [
    { key: 'totalTrees', parameter: 'Total Trees in Campus', description: 'Total count of trees managed', unit: 'Count', frequency: 'Monthly' },
    { key: 'totalPlants', parameter: 'Total Plants in Campus', description: 'Total count of shrubs, indoor plants, flowering plants, etc.', unit: 'Count', frequency: 'Monthly' },
    { key: 'newlyAdded', parameter: 'Newly Added Plants', description: 'Plants added in the current month', unit: 'Count', frequency: 'Monthly' },
    { key: 'deadRemoved', parameter: 'Dead / Removed Plants', description: 'Plants removed or died this month', unit: 'Count', frequency: 'Monthly' },
    { key: 'waterConsumption', parameter: 'Daily Water Consumption', description: 'Water used for irrigation', unit: 'Litres/day', frequency: 'Daily' },
  ],
};

const UNIT_SUMMARY_KEYS = {
  'Power House': ['dailyEnergyConsumption', 'powerFactor'],
  'Chiller Plant': ['dailyOperatingHours', 'loadFactor'],
  Transport: ['dailyOperationalVehicles', 'routeTrips'],
  Hostels: ['occupancy', 'complaints'],
  Mess: ['dailyMeals', 'waste'],
  'RO Plant': ['dailyOutput', 'tds'],
  'Sports/Gym': ['utilisationHours', 'events'],
  'Medical Centre': ['opd', 'referrals'],
  'Campus Maint.': ['tickets', 'tat'],
  Plumbing: ['complaints', 'pending'],
  STP: ['treated', 'quality'],
  'TRC / NMC': ['bandwidth', 'devices'],
  Horticulture: ['totalTrees', 'totalPlants'],
};

function readUnitSubmittedValues(unitName) {
  try {
    const raw = localStorage.getItem(`unit-form:${unitName}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed.values || {};
  } catch (err) {
    return {};
  }
}

function getCooldownDays(frequency) {
  const value = (frequency || '').toLowerCase();
  if (value.includes('daily')) return 1;
  if (value.includes('weekly')) return 7;
  if (value.includes('monthly')) return 30;
  if (value.includes('yearly') || value.includes('annual')) return 365;
  return 0;
}

function addDays(dateValue, days) {
  const base = new Date(dateValue);
  const next = new Date(base);
  next.setDate(base.getDate() + days);
  return next;
}

function buildUnitHeadPeriodicReminders(unitName) {
  const fields = UNIT_FORM_FIELDS[unitName] || [];
  const raw = localStorage.getItem(`unit-form:${unitName}`);
  let fieldSubmittedAt = {};
  try {
    fieldSubmittedAt = raw ? JSON.parse(raw).fieldSubmittedAt || {} : {};
  } catch (err) {
    fieldSubmittedAt = {};
  }

  const now = new Date();
  const reminders = [];
  fields.forEach((field) => {
    const cooldownDays = getCooldownDays(field.frequency);
    if (!cooldownDays) return;

    const submittedAt = fieldSubmittedAt[field.key];
    if (!submittedAt) {
      reminders.push({
        id: `due-${field.key}-initial`,
        category: 'Periodic Data Due',
        unit: unitName,
        occurredAt: now.toLocaleString(),
        detail: `${field.parameter} (${field.frequency}) has no submission yet. Please update.`,
      });
      return;
    }

    const nextAllowed = addDays(submittedAt, cooldownDays);
    if (now >= nextAllowed) {
      reminders.push({
        id: `due-${field.key}-${nextAllowed.toISOString()}`,
        category: 'Periodic Data Due',
        unit: unitName,
        occurredAt: nextAllowed.toLocaleString(),
        detail: `${field.parameter} (${field.frequency}) is due for update.`,
      });
    }
  });
  return reminders;
}

function getAlertsForUser(currentUser) {
  if (!currentUser) return [];
  
  if (currentUser.role === 'admin') {
    let allReminders = [];
    Object.keys(UNIT_FORM_FIELDS).forEach(unitName => {
      allReminders = [...allReminders, ...buildUnitHeadPeriodicReminders(unitName)];
    });
    return [...EXECUTIVE_CRITICAL_ALERTS, ...allReminders];
  }

  const baseAlerts = EXECUTIVE_CRITICAL_ALERTS.filter((a) => a.unit === currentUser.unitName);
  const reminders = buildUnitHeadPeriodicReminders(currentUser.unitName);
  
  const ticketAlerts = [];

  // Add FC alerts for Transport unit
  let fcAlerts = [];
  if (currentUser.unitName === 'Transport') {
    const now = new Date();
    // In a real app we'd fetch this from a DB, but we'll mock the check here based on our known BUSES_DATA
    // mock buses with close FCs: BUS-01 (May 24), VAN-01 (May 22)
    const mockExpiring = [
      { num: 'BUS-01', date: '2026-05-24' },
      { num: 'VAN-01', date: '2026-05-22' }
    ];
    fcAlerts = mockExpiring.map(bus => ({
      id: `fc-alert-${bus.num}`,
      category: 'FC Renewal Due',
      unit: 'Transport',
      occurredAt: now.toLocaleDateString(),
      detail: `Bus ${bus.num} Fitness Certificate expires on ${bus.date}. Please renew.`,
    }));
  }

  return [...baseAlerts, ...reminders, ...ticketAlerts, ...fcAlerts];
}

function getAdminExportPayload() {
  return buildExecutivePayload({
    modules,
    getKpiBand,
    monthlyRows: MONTHLY_COMPARISON_ROWS,
    trendRows: SIX_MONTH_TREND,
    alerts: EXECUTIVE_CRITICAL_ALERTS,
    activeAlertUnitNames: ACTIVE_ALERT_UNIT_NAMES,
    readUnitSubmittedValues,
    unitFormFields: UNIT_FORM_FIELDS,
  });
}

const SESSION_STORAGE_KEY = 'portal-session';
const LEGACY_SESSION_KEY = 'unit-head-session';

function normalizeSession(raw) {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw);
    if (!s || !s.id) return null;
    if (s.role === 'admin' || s.role === 'unit_head') return s;
    if (s.unitName) return { ...s, role: 'unit_head' };
    return null;
  } catch (err) {
    return null;
  }
}

function readStoredSession() {
  const primary = localStorage.getItem(SESSION_STORAGE_KEY);
  const normalized = normalizeSession(primary);
  if (normalized) return normalized;
  const legacy = localStorage.getItem(LEGACY_SESSION_KEY);
  const migrated = normalizeSession(legacy);
  if (migrated) {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(migrated));
    localStorage.removeItem(LEGACY_SESSION_KEY);
  }
  return migrated;
}

function getDynamicModuleDetails(mod) {
  const keys = UNIT_SUMMARY_KEYS[mod.name] || [];
  const fields = UNIT_FORM_FIELDS[mod.name] || [];
  const submitted = readUnitSubmittedValues(mod.name);
  const parts = keys
    .map((key) => {
      const value = submitted[key];
      if (!value || String(value).trim() === '') return null;
      const field = fields.find((f) => f.key === key);
      if (!field) return null;
      return `${field.parameter}: ${value}`;
    })
    .filter(Boolean);

  if (!parts.length) return mod.details;
  return parts.slice(0, 2).join(' | ');
}

function Dashboard() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [kpiFilter, setKpiFilter] = useState('all');
  const [refreshTick, setRefreshTick] = useState(0);
  const [pieFilter, setPieFilter] = useState(null); // 'red', 'amber', 'green', or null
  const [hortiData, setHortiData] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8085/api/horticulture')
      .then(res => res.json())
      .then(data => setHortiData(data))
      .catch(() => {});
  }, [refreshTick]);

  useEffect(() => {
    const refresh = () => setRefreshTick((prev) => prev + 1);
    window.addEventListener('unit-form-updated', refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('unit-form-updated', refresh);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  // Simulated KPI trend data for each unit (for demo, random walk)
  const kpiTrends = useMemo(() => {
    const trends = {};
    modules.forEach((mod) => {
      // Simulate 7 days of KPI history
      let val = mod.kpiScore;
      trends[mod.name] = Array.from({ length: 7 }, (_, i) => {
        val = Math.max(40, Math.min(100, val + Math.round((Math.random() - 0.5) * 8)));
        return { day: `D${i + 1}`, kpi: val };
      });
    });
    return trends;
  }, [refreshTick]);

  const dynamicDetailsByUnit = (() => {
    const map = {};
    modules.forEach((mod) => {
      if (mod.name === 'Horticulture' && hortiData) {
        const trees = hortiData.plants?.filter(p => p.category === 'Tree').reduce((sum, p) => sum + p.quantity, 0) || 0;
        const plants = hortiData.plants?.filter(p => p.category !== 'Tree').reduce((sum, p) => sum + p.quantity, 0) || 0;
        map[mod.name] = `Total Trees: ${trees} | Total Plants: ${plants}`;
      } else {
        map[mod.name] = getDynamicModuleDetails(mod);
      }
    });
    return map;
  })();

  // Compute band counts and pie data
  const bandCounts = useMemo(() => {
    const counts = { red: 0, amber: 0, green: 0 };
    modules.forEach((m) => {
      counts[getKpiBand(m.kpiScore)]++;
    });
    return counts;
  }, [modules, refreshTick]);

  const pieData = [
    { name: 'Red', value: bandCounts.red, color: '#d32f2f', band: 'red' },
    { name: 'Amber', value: bandCounts.amber, color: '#f9a825', band: 'amber' },
    { name: 'Green', value: bandCounts.green, color: '#2e7d32', band: 'green' },
  ];

  // Filtered and sorted list view
  const filteredModules = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    let next = modules.filter((mod) => {
      const band = getKpiBand(mod.kpiScore);
      const kpiMatch = (kpiFilter === 'all' || band === kpiFilter) && (!pieFilter || band === pieFilter);
      const dynamicDetails = dynamicDetailsByUnit[mod.name] || mod.details;
      const text = `${mod.name} ${dynamicDetails}`.toLowerCase();
      const searchMatch = !normalizedSearch || text.includes(normalizedSearch);
      return kpiMatch && searchMatch;
    });
    // Sort: red first, then amber, then green, then by KPI desc
    next = [...next].sort((a, b) => {
      const bandOrder = { red: 0, amber: 1, green: 2 };
      const bandA = bandOrder[getKpiBand(a.kpiScore)];
      const bandB = bandOrder[getKpiBand(b.kpiScore)];
      if (bandA !== bandB) return bandA - bandB;
      return b.kpiScore - a.kpiScore;
    });
    return next;
  }, [searchText, kpiFilter, pieFilter, dynamicDetailsByUnit]);

  // Alert banner if any red
  const hasRed = modules.some((m) => getKpiBand(m.kpiScore) === 'red');

  // Pie chart click handler
  const handlePieClick = (data, idx) => {
    if (!data || !data.band) return;
    setPieFilter((prev) => (prev === data.band ? null : data.band));
  };

  return (
    <div className="dashboard-container" data-refresh={refreshTick} style={{ background: '#f8fafc', padding: '32px', borderRadius: '16px', border: 'none', boxShadow: 'none', maxWidth: '1200px' }}>
      
      {/* Top Header & Summary Cards */}
      <div className="dashboard-top-grid" style={{ gap: 32, marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', color: '#1a1f2e', marginBottom: '8px', fontFamily: 'var(--font-sans)', letterSpacing: '-0.5px' }}>Maintenance Overview</h2>
          <p style={{ color: '#607d8b', marginBottom: '24px', fontSize: '0.95rem' }}>Overview of all campus support units and their current operational status.</p>
          
          <div className="dashboard-cards-grid" style={{ gap: '20px' }}>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', boxShadow: '0 4px 18px rgba(0,0,0,0.03)', border: '1px solid #e3e8ef', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#e8f5e9', color: '#2e7d32', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>✓</div>
              <div>
                <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#1a1f2e', lineHeight: 1 }}>{modules.length}</div>
                <div style={{ fontSize: '0.85rem', color: '#607d8b', marginTop: 6, fontWeight: 500 }}>Total Units</div>
              </div>
            </div>
            
            <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', boxShadow: '0 4px 18px rgba(0,0,0,0.03)', border: '1px solid #e3e8ef', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ffebee', color: '#c62828', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', flexShrink: 0 }}>!</div>
              <div>
                <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#1a1f2e', lineHeight: 1 }}>{ACTIVE_ALERT_UNIT_NAMES.length}</div>
                <div style={{ fontSize: '0.85rem', color: '#607d8b', marginTop: 6, fontWeight: 500 }}>Active Alerts</div>
              </div>
            </div>
            
            <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', boxShadow: '0 4px 18px rgba(0,0,0,0.03)', border: '1px solid #e3e8ef', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#e3f2fd', color: '#1565c0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', flexShrink: 0 }}>↻</div>
              <div>
                <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#1a1f2e', lineHeight: 1 }}>5</div>
                <div style={{ fontSize: '0.85rem', color: '#607d8b', marginTop: 6, fontWeight: 500 }}>Reports Pending</div>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', boxShadow: '0 4px 18px rgba(0,0,0,0.03)', border: '1px solid #e3e8ef', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f3e5f5', color: '#8e24aa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', flexShrink: 0 }}>⭐</div>
              <div>
                <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#1a1f2e', lineHeight: 1 }}>
                  {Math.round(modules.reduce((sum, mod) => sum + mod.kpiScore, 0) / modules.length)}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#607d8b', marginTop: 6, fontWeight: 500 }}>Average KPI</div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Donut Chart */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', boxShadow: '0 4px 18px rgba(0,0,0,0.03)', border: '1px solid #e3e8ef', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1a1f2e' }}>Overall Health</h3>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4caf50', lineHeight: 1 }}>{Math.round((bandCounts.green / modules.length) * 100)}%</div>
              <div style={{ fontSize: '0.7rem', color: '#607d8b', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>Healthy</div>
            </div>
          </div>
          <div style={{ position: 'relative', flex: 1, minHeight: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  stroke="#fff"
                  strokeWidth={2}
                  onClick={handlePieClick}
                  style={{ cursor: 'pointer', outline: 'none' }}
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.band}
                      fill={entry.color}
                      opacity={pieFilter === null || pieFilter === entry.band ? 1 : 0.3}
                    />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value, name) => [`${value} units`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16 }}>
            {pieData.map(entry => (
              <div key={entry.band} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#546e7a', cursor: 'pointer', opacity: pieFilter === null || pieFilter === entry.band ? 1 : 0.4 }} onClick={() => setPieFilter(prev => prev === entry.band ? null : entry.band)}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: entry.color }}></div>
                {entry.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {hasRed && (
        <div className="dashboard-alert-banner" role="alert" style={{ background: '#fff', border: '1px solid #ffcdd2', borderLeft: '4px solid #d32f2f', borderRadius: 12, padding: '16px 20px', marginBottom: 32, display: 'flex', gap: 16, alignItems: 'center', boxShadow: '0 2px 10px rgba(211,47,47,0.05)' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ffebee', color: '#c62828', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>!</div>
          <div style={{ color: '#c62828', fontSize: '0.95rem' }}>
            <strong style={{ display: 'block', marginBottom: 4 }}>Action Required</strong>
            One or more units are in the critical band. Please review the list below.
          </div>
        </div>
      )}

      {/* Maintenance Categories (Tiles) */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1a1f2e' }}>Maintenance in Categories</h3>
        </div>
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 12 }}>
          {modules.map(mod => {
            const band = getKpiBand(mod.kpiScore);
            return (
              <div key={mod.name} onClick={() => navigate(`/unit/${encodeURIComponent(mod.name)}`)} style={{ flexShrink: 0, padding: '16px 20px', background: '#fff', borderRadius: 14, border: '1px solid #e3e8ef', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', minWidth: 200, transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.05)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: band === 'red' ? '#ffebee' : band === 'amber' ? '#fff8e1' : '#e8f5e9', color: band === 'red' ? '#c62828' : band === 'amber' ? '#f57f17' : '#2e7d32', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  {mod.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1a1f2e', marginBottom: 4 }}>{mod.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#607d8b', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: band === 'red' ? '#d32f2f' : band === 'amber' ? '#f9a825' : '#2e7d32' }}></div>
                    Score: {mod.kpiScore}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* List View */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e3e8ef', boxShadow: '0 4px 18px rgba(0,0,0,0.03)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e3e8ef', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1a1f2e' }}>Unit Status Details</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
            <input
              type="text"
              placeholder="Search units..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #cfd8dc', fontSize: '0.9rem', outline: 'none', flex: '1 1 140px', minWidth: 0 }}
            />
            <select value={kpiFilter} onChange={(e) => setKpiFilter(e.target.value)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #cfd8dc', fontSize: '0.9rem', outline: 'none', background: '#fff', flex: '1 1 120px', minWidth: 0 }}>
              <option value="all">All Status</option>
              <option value="red">Action Required</option>
              <option value="amber">In Progress</option>
              <option value="green">Good</option>
            </select>
          </div>
        </div>
        
        <div className="dashboard-list-row dashboard-list-header" style={{ padding: '16px 24px', gap: 16, borderBottom: '1px solid #e3e8ef', fontSize: '0.85rem', fontWeight: 600, color: '#78909c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <div>Unit / Title</div>
          <div>Status</div>
          <div>Key Details</div>
          <div>Trend</div>
          <div style={{ textAlign: 'right' }}>Action</div>
        </div>
        
        <div>
          {filteredModules.map((mod, idx) => {
            const band = getKpiBand(mod.kpiScore);
            const isAlert = ACTIVE_ALERT_UNIT_NAMES.includes(mod.name);
            return (
              <div key={mod.name} className="dashboard-list-row" style={{ padding: '16px 24px', gap: 16, alignItems: 'center', borderBottom: idx === filteredModules.length - 1 ? 'none' : '1px solid #f0f4f8', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontWeight: 600, color: '#1a1f2e', fontSize: '0.95rem' }}>{mod.name}</div>
                  {isAlert && <span style={{ padding: '2px 6px', background: '#ffebee', color: '#c62828', fontSize: '0.7rem', borderRadius: 4, fontWeight: 700 }}>Alert</span>}
                </div>
                <div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600, background: band === 'red' ? '#ffebee' : band === 'amber' ? '#fff8e1' : '#e8f5e9', color: band === 'red' ? '#c62828' : band === 'amber' ? '#f57f17' : '#2e7d32' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }}></div>
                    {band === 'red' ? 'Action Required' : band === 'amber' ? 'In Progress' : 'Operational'}
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem', color: '#546e7a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {dynamicDetailsByUnit[mod.name] || mod.details}
                </div>
                <div style={{ height: 32 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={kpiTrends[mod.name]}>
                      <Line type="monotone" dataKey="kpi" stroke={band === 'red' ? '#d32f2f' : band === 'amber' ? '#f9a825' : '#2e7d32'} strokeWidth={2} dot={false} isAnimationActive={false} />
                      <YAxis domain={[40, 100]} hide />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button style={{ background: 'transparent', color: '#00897b', border: '1px solid #00897b', borderRadius: 6, padding: '6px 16px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#00897b'; e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#00897b'; }} onClick={() => navigate(`/unit/${encodeURIComponent(mod.name)}`)}>
                    Manage
                  </button>
                </div>
              </div>
            );
          })}
          {filteredModules.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: '#78909c', fontSize: '0.95rem' }}>No units found matching your criteria.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminExportFab() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const handlePdf = () => {
    try {
      exportExecutivePdf(getAdminExportPayload());
      setOpen(false);
    } catch (err) {
      console.error(err);
      window.alert('Could not create PDF. Please try again.');
    }
  };

  const handleExcel = () => {
    try {
      exportExecutiveExcel(getAdminExportPayload());
      setOpen(false);
    } catch (err) {
      console.error(err);
      window.alert('Could not create Excel file. Please try again.');
    }
  };

  return (
    <>
      {open && (
        <button
          type="button"
          className="export-fab-backdrop"
          aria-label="Close export menu"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="export-fab-root">
        {open && (
          <div className="export-fab-menu" role="menu">
            <button type="button" className="export-fab-option" role="menuitem" onClick={handlePdf}>
              Export PDF
            </button>
            <button type="button" className="export-fab-option" role="menuitem" onClick={handleExcel}>
              Export Excel
            </button>
          </div>
        )}
        <button
          type="button"
          className="export-fab-main"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="true"
        >
          Export report
        </button>
      </div>
    </>
  );
}

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const admin = DEAN_ADMIN_USERS.find((u) => u.username === username && u.password === password);
    if (admin) {
      setError('');
      onLogin({ id: admin.id, name: admin.name, role: 'admin' });
      return;
    }
    const head = UNIT_HEAD_USERS.find((u) => u.username === username && u.password === password);
    if (!head) {
      setError('Invalid credentials. Use Dean/Admin or your unit head account.');
      return;
    }
    setError('');
    onLogin({
      id: head.id,
      name: head.name,
      role: 'unit_head',
      unitName: head.unitName,
    });
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="portal-brand">
          <div className="portal-brand-icon">⚙</div>
          <h2>Non-Academic Services Portal</h2>
        </div>
        <p className="login-institutional-tagline">
          Secure access for institutional administration, deans, and authorised unit representatives.
        </p>
        <h3 className="welcome-title">Sign in</h3>

        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. dean.admin or power.head"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />
        </label>

        {error && <div className="login-error">{error}</div>}

        <button type="submit">Login</button>
        <div className="login-or">Or</div>
        <div className="login-google-card" role="button" tabIndex={0}>
          <div className="login-google-avatar login-google-avatar--g">G</div>
          <div className="login-google-user">
            <div>Continue with Google</div>
          </div>
          <div className="login-google-logo">G</div>
        </div>
        <div className="login-helper">
          Dean/Admin: <strong>dean.admin</strong> / Dean@2026 — Unit head example: <strong>power.head</strong> /
          Power@123
        </div>
      </form>
    </div>
  );
}


function UnitDetail({ unitName, currentUser }) {
  switch (unitName) {
    case 'Power House':
      return <PowerHouseDetail />;
    case 'Chiller Plant':
      return <ChillerPlantDetail />;
    case 'RO Plant':
      return <ROPlantDetail />;
    case 'Hostels':
      return <HostelsDetail currentUser={currentUser} />;
    case 'Transport':
      return <TransportDetail currentUser={currentUser} />;
    case 'Mess':
      return <MessDetail />;
    case 'Medical Centre':
      return <MedicalCentreDetail />;
    case 'STP':
      return <STPDetail />;
    case 'Campus Maint.':
      return <CampusMaintDetail />;
    case 'Sports/Gym':
      return <SportsGymDetail />;
    case 'TRC / NMC':
      return <TrcNmCDetail />;
    case 'Horticulture':
      return <HorticultureDetail currentUser={currentUser} />;
    case 'Plumbing':
      return <PlumbingDetail />;
    default:
      return (
        <div className="unit-detail-container">
          <h2>{unitName} Dashboard</h2>
          <p>Details and analytics for <b>{unitName}</b> will appear here.</p>
        </div>
      );
  }
}

function UnitDetailWrapper({ currentUser }) {
  const { unit } = useParams();
  let unitName = unit;
  try {
    unitName = decodeURIComponent(unit);
  } catch (err) {
    unitName = unit;
  }
  unitName = unitName.replace(/%20/g, ' ');

  const [showUnitModal, setShowUnitModal] = useState(false);

  if (currentUser.role === 'unit_head' && currentUser.unitName !== unitName) {
    return <Navigate to={`/unit/${encodeURIComponent(currentUser.unitName)}`} replace />;
  }

  const canManageForm =
    currentUser.role === 'unit_head' && currentUser.unitName === unitName;
  const fields = UNIT_FORM_FIELDS[unitName] || [];
  const submittedValues = readUnitSubmittedValues(unitName);
  const submittedRows = fields
    .map((field) => ({
      label: field.parameter,
      value: submittedValues[field.key],
      unit: field.unit,
    }))
    .filter((row) => row.value && String(row.value).trim() !== '');

  return (
    <>
      <UnitDetail unitName={unitName} currentUser={currentUser} />


      {!canManageForm && (
        <div className="unit-form-access-note">
          {currentUser.role === 'admin' ? (
            <>
              <strong>View only (Dean/Admin).</strong> Charts and latest submitted data are shown above. Data
              entry is reserved for the <b>{unitName}</b> unit head; your account cannot save form changes.
            </>
          ) : (
            <>
              Form access is restricted. Only <b>{unitName}</b> head can view and fill this section.
            </>
          )}
        </div>
      )}
      {canManageForm && (
        <div style={{ margin: '30px 0', display: 'flex', justifyContent: 'center' }}>
          <button 
            id="btn-fill-unit-data-form"
            onClick={() => setShowUnitModal(true)}
            style={{
              padding: '14px 32px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Click Here to Fill Unit Data Form
          </button>
        </div>
      )}
      
      {showUnitModal && (
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
          padding: 'clamp(10px, 2vw, 20px)',
          boxSizing: 'border-box'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '92vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: 'clamp(16px, 5vw, 36px)',
            boxSizing: 'border-box'
          }}>
            <button 
              id="close-unit-modal-btn"
              onClick={() => setShowUnitModal(false)}
              style={{
                position: 'absolute',
                top: 'clamp(12px, 3vw, 20px)',
                right: 'clamp(12px, 3vw, 20px)',
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
            {unitName === 'Transport' ? (
              <TransportUnitForm
                vehicles={[]}
                drivers={[]}
                fuelLogs={[]}
                maintenance={[]}
                onDataSaved={() => setShowUnitModal(false)}
              />
            ) : unitName === 'Horticulture' ? (
              <HorticultureUnitForm
                onDataSaved={() => setShowUnitModal(false)}
              />
            ) : unitName === 'Plumbing' ? (
              <PlumbingUnitForm
                onDataSaved={() => setShowUnitModal(false)}
              />
            ) : unitName === 'Power House' ? (
              <PowerHouseUnitForm
                onClose={() => {
                  setShowUnitModal(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            ) : (
              <UnitDataForm
                unitName={unitName}
                fields={UNIT_FORM_FIELDS[unitName] || []}
                onClose={() => {
                  setShowUnitModal(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}


function PostLoginRedirect({ currentUser }) {
  if (currentUser.role === 'admin') return <Navigate to="/" replace />;
  return <Navigate to={`/unit/${encodeURIComponent(currentUser.unitName)}`} replace />;
}

function IconCalendar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden className="session-bar-svg">
      <path
        fill="currentColor"
        d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"
      />
    </svg>
  );
}

function IconTrendLine() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden className="session-bar-svg session-bar-svg--stroke">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16l4-6 4 5 4-10 4 6"
      />
      <circle cx="4" cy="16" r="1.5" fill="currentColor" />
      <circle cx="20" cy="11" r="1.5" fill="currentColor" />
    </svg>
  );
}

function IconYoY() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden className="session-bar-svg session-bar-svg--stroke">
      <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 14l4-4 4 4 4-4" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden className="session-bar-svg">
      <path
        fill="currentColor"
        d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
      />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden className="session-bar-svg">
      <path fill="currentColor" d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
    </svg>
  );
}

function IconProfile() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden className="session-bar-svg">
      <path
        fill="currentColor"
        d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z"
      />
    </svg>
  );
}

function ExecutiveModal({ type, onClose, currentUser, alertItems }) {
  if (!type) return null;
  const isAdmin = currentUser?.role === 'admin';
  const alertsToRender = alertItems || [];

  return (
    <div className="exec-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="exec-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exec-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="exec-modal-header">
          <h2 id="exec-modal-title">
            {type === 'monthly' && 'Monthly comparison'}
            {type === 'trend' && 'Trend analysis (last 6 months)'}
            {type === 'yoy' && 'Year-on-Year Benchmarking'}
            {type === 'alerts' && 'Alert log'}
          </h2>
          <button type="button" className="exec-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="exec-modal-body">
          {type === 'monthly' && isAdmin && (
            <>
              <p className="exec-modal-hint">
                Comparative campus totals by month: <strong>energy cost</strong>, <strong>water usage</strong>, and{' '}
                <strong>maintenance expenditure</strong> (demo figures).
              </p>
              <div className="exec-table-wrap">
                <table className="exec-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Energy cost (₹ Lakhs)</th>
                      <th>Water (KL)</th>
                      <th>Maintenance (₹ Lakhs)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MONTHLY_COMPARISON_ROWS.map((row) => (
                      <tr key={row.label}>
                        <td>{row.label}</td>
                        <td>{row.energyCostLakh}</td>
                        <td>{row.waterKL.toLocaleString()}</td>
                        <td>{row.maintenanceLakh}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {type === 'trend' && isAdmin && (
            <>
              <p className="exec-modal-hint">
                Six-month view of the same three metrics. Until historical uploads exist for older months, values
                stay at the <strong>starting-period baseline</strong>; newer months reflect gradual change (demo).
              </p>
              <div className="exec-trend-block" style={{ marginTop: 24 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={SIX_MONTH_TREND} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3e8ef" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#607d8b', fontSize: 12 }} dy={10} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#607d8b', fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#607d8b', fontSize: 12 }} />
                    <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Line yAxisId="left" type="monotone" dataKey="energyCostLakh" name="Energy Cost (₹L)" stroke="#d32f2f" strokeWidth={3} dot={{ r: 4, fill: '#d32f2f' }} activeDot={{ r: 6 }} />
                    <Line yAxisId="right" type="monotone" dataKey="waterKL" name="Water (kL)" stroke="#1976d2" strokeWidth={3} dot={{ r: 4, fill: '#1976d2' }} activeDot={{ r: 6 }} />
                    <Line yAxisId="left" type="monotone" dataKey="maintenanceLakh" name="Maint. Cost (₹L)" stroke="#fbc02d" strokeWidth={3} dot={{ r: 4, fill: '#fbc02d' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
          {type === 'yoy' && isAdmin && (
            <>
              <p className="exec-modal-hint">
                Year-on-Year benchmarking comparing key campus totals to the previous year (demo figures).
              </p>
              <div className="exec-table-wrap">
                <table className="exec-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Previous Year (Avg/mo)</th>
                      <th>Current Year (Avg/mo)</th>
                      <th>Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Energy Cost (₹ Lakhs)</td>
                      <td>41.5</td>
                      <td>39.2</td>
                      <td style={{ color: '#2e7d32', fontWeight: 'bold' }}>-5.5% (Improved)</td>
                    </tr>
                    <tr>
                      <td>Water Usage (KL)</td>
                      <td>2050</td>
                      <td>1980</td>
                      <td style={{ color: '#2e7d32', fontWeight: 'bold' }}>-3.4% (Improved)</td>
                    </tr>
                    <tr>
                      <td>Maintenance Exp. (₹ Lakhs)</td>
                      <td>10.1</td>
                      <td>11.2</td>
                      <td style={{ color: '#d32f2f', fontWeight: 'bold' }}>+10.9% (Increase)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
          {type === 'alerts' && (
            <>
              <p className="exec-modal-hint">
                {isAdmin
                  ? 'Critical failures and high-priority events (power, transport, STP, medical, and other).'
                  : 'Your unit alerts include critical incidents and periodic data-entry reminders.'}
              </p>
              {alertsToRender.length === 0 ? (
                <div className="exec-alert-empty">No active alerts right now.</div>
              ) : (
                <ul className="exec-alert-list">
                  {alertsToRender.map((a) => (
                    <li key={a.id} className="exec-alert-item">
                      <div className="exec-alert-meta">
                        <span className="exec-alert-category">{a.category}</span>
                        <span className="exec-alert-time">{a.occurredAt}</span>
                      </div>
                      <div className="exec-alert-unit">{a.unit}</div>
                      <div className="exec-alert-detail">{a.detail}</div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileModal({ currentUser, onClose, onLogout }) {
  if (!currentUser) return null;
  const isAdmin = currentUser.role === 'admin';
  return (
    <div className="exec-modal-overlay" role="presentation" onClick={onClose}>
      <div className="exec-modal-panel profile-modal-panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="exec-modal-header">
          <h2>User Profile</h2>
          <button type="button" className="exec-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="exec-modal-body">
          <div className="profile-row"><span>Name</span><strong>{currentUser.name}</strong></div>
          <div className="profile-row"><span>Role</span><strong>{isAdmin ? 'Dean / Admin' : 'Unit Head'}</strong></div>
          {!isAdmin && <div className="profile-row"><span>Unit</span><strong>{currentUser.unitName}</strong></div>}
          <div className="profile-row"><span>Login time</span><strong>{new Date(currentUser.loginAt).toLocaleString()}</strong></div>
          <div className="profile-actions">
            <button type="button" className="profile-logout-btn" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardRoute({ currentUser }) {
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== 'admin') {
    return <Navigate to={`/unit/${encodeURIComponent(currentUser.unitName)}`} replace />;
  }
  return <Dashboard />;
}

function SessionBar({ currentUser, onLogout, toggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = currentUser.role === 'admin';
  const showDashLink = isAdmin && location.pathname !== '/';
  const [execModal, setExecModal] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [alertRefreshTick, setAlertRefreshTick] = useState(0);
  const alertItems = useMemo(
    () => getAlertsForUser(currentUser),
    [currentUser, alertRefreshTick]
  );
  const alertCount = alertItems.length;

  useEffect(() => {
    const refresh = () => setAlertRefreshTick((prev) => prev + 1);
    window.addEventListener('unit-form-updated', refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('unit-form-updated', refresh);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  return (
    <>
      <div className="session-bar">
        <button type="button" className="session-bar-icon-btn" title="Menu" onClick={toggleSidebar}>
          <IconMenu />
        </button>
        <span className="session-bar-info">
          {showDashLink && (
            <Link to="/">Dashboard</Link>
          )}
        </span>
        <div className="session-bar-end">
          {isAdmin && (
            <>
              <button type="button" className="session-bar-icon-btn" title="YoY Benchmarking" onClick={() => setExecModal('yoy')}>
                <IconYoY />
              </button>
              <button type="button" className="session-bar-icon-btn" title="Trend Analysis" onClick={() => setExecModal('trend')}>
                <IconTrendLine />
              </button>
              <button type="button" className="session-bar-icon-btn" title="Monthly Comparison" onClick={() => setExecModal('monthly')}>
                <IconCalendar />
              </button>
            </>
          )}
          <button
            type="button"
            className="session-bar-icon-btn session-bar-icon-btn--bell"
            title="Alert log"
            onClick={() => setExecModal('alerts')}
          >
            <IconBell />
            {alertCount > 0 ? (
              <span className="session-bar-badge" aria-label={`${alertCount} alerts`}>
                {alertCount > 99 ? '99+' : alertCount}
              </span>
            ) : null}
          </button>
          <button type="button" className="session-bar-icon-btn" title="Profile" onClick={() => setShowProfile(true)}>
            <IconProfile />
          </button>
        </div>
      </div>
      <ExecutiveModal
        type={execModal}
        currentUser={currentUser}
        alertItems={alertItems}
        onClose={() => setExecModal(null)}
      />
      {showProfile && <ProfileModal currentUser={currentUser} onClose={() => setShowProfile(false)} onLogout={onLogout} />}
    </>
  );
}

function AppRoutes({ currentUser, onLogin, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);
  const [unitToc, setUnitToc] = useState([]);

  useEffect(() => {
    if (currentUser?.role === 'unit_head') {
      const timer = setTimeout(() => {
        const headers = Array.from(document.querySelectorAll('.unit-detail-container h4, .unit-submitted-data-card h4, .unit-data-form h3'));
        const newToc = headers.map((el, i) => {
          if (!el.id) el.id = `toc-section-${i}`;
          return { id: el.id, title: el.innerText };
        });
        setUnitToc(newToc);
      }, 500); // give DOM time to render unit charts
      return () => clearTimeout(timer);
    }
  }, [location.pathname, currentUser]);
  
  const closeSidebarOnMobile = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Permanent Sidebar */}
      {currentUser && (
        <aside style={{ width: sidebarOpen ? '260px' : '0px', background: '#0c2340', color: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0, boxShadow: '2px 0 10px rgba(0,0,0,0.1)', transition: 'width 0.3s ease', overflowX: 'hidden' }}>
          <div style={{ padding: '24px 20px', fontSize: '1.25rem', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 12, width: 260 }}>
            <div style={{ width: 32, height: 32, background: '#b8972e', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1rem', flexShrink: 0 }}>✦</div>
            <Link to="/" onClick={closeSidebarOnMobile} style={{ color: '#fff', textDecoration: 'none', whiteSpace: 'nowrap' }}>Campus Services</Link>
          </div>
          <div style={{ padding: '16px 20px 8px', fontSize: '0.75rem', textTransform: 'uppercase', color: '#8a99a8', fontWeight: 700, letterSpacing: '0.05em', width: 260 }}>
            {currentUser.role === 'admin' ? 'Management' : 'Page Navigation'}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 10px', width: 260 }}>
            {currentUser.role === 'admin' ? (
              <>


                
                <div style={{ padding: '8px 8px 4px', fontSize: '0.75rem', textTransform: 'uppercase', color: '#8a99a8', fontWeight: 700, letterSpacing: '0.05em' }}>
                  All Units
                </div>
                {modules.map(mod => {
                  const band = getKpiBand(mod.kpiScore);
                  const isChillerPlantActive = mod.name === 'Chiller Plant' && location.pathname.includes('/unit/Chiller');
                  const isPlumbingActive = mod.name === 'Plumbing' && location.pathname.includes('/unit/Plumbing');
                  return (
                    <React.Fragment key={mod.name}>
                      <div style={{ padding: '10px 12px', margin: '4px 0', cursor: 'pointer', fontSize: '0.9rem', color: '#e2e8f0', borderRadius: 8, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }} onClick={() => { navigate(`/unit/${encodeURIComponent(mod.name)}`); closeSidebarOnMobile(); }} onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.background = 'transparent'; }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: band === 'red' ? '#ef5350' : band === 'amber' ? '#ffca28' : '#66bb6a', flexShrink: 0 }}></div>
                        {mod.name}
                      </div>
                      {isChillerPlantActive && (
                        <div style={{ paddingLeft: '24px' }}>
                          {[
                            { id: 'overview', title: 'Overview' },
                            { id: 'specs', title: '📋 Technical Specifications' },
                            { id: 'log', title: 'Operating Log' },
                            { id: 'billing', title: 'Billing Params' },
                            { id: 'ahu', title: '🏢 AHU Units' },
                            { id: 'split', title: '🌬️ A/C & Cold Room Units' }
                          ].map(tab => (
                            <div key={tab.id} style={{ padding: '8px 12px', margin: '2px 0', cursor: 'pointer', fontSize: '0.85rem', color: '#cbd5e1', borderRadius: 8, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} 
                                 onClick={() => { window.dispatchEvent(new CustomEvent('change-chiller-tab', { detail: tab.id })); closeSidebarOnMobile(); }} 
                                 onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.background = 'transparent'; }}>
                              <span style={{ color: '#b8972e', flexShrink: 0 }}>•</span>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{tab.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {isPlumbingActive && (
                        <div style={{ paddingLeft: '24px' }}>
                          {[
                            { id: 'overview', title: '📊 Overview' },
                            { id: 'oht', title: '🚰 OHTs' },
                            { id: 'sumps', title: '🕳️ Sumps' },
                            { id: 'motors', title: '⚙️ Motors' },
                            { id: 'manpower', title: '👥 Manpower' },
                            { id: 'borewells', title: '💧 Borewells' },
                            { id: 'wells', title: '🌊 Open Wells' }
                          ].map(tab => (
                            <div key={tab.id} style={{ padding: '8px 12px', margin: '2px 0', cursor: 'pointer', fontSize: '0.85rem', color: '#cbd5e1', borderRadius: 8, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} 
                                 onClick={() => { window.dispatchEvent(new CustomEvent('change-plumbing-tab', { detail: tab.id })); closeSidebarOnMobile(); }} 
                                 onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.background = 'transparent'; }}>
                              <span style={{ color: '#b8972e', flexShrink: 0 }}>•</span>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{tab.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </>
            ) : (
              <>
                <div style={{ padding: '10px 12px', margin: '4px 0', cursor: 'pointer', fontSize: '0.9rem', color: '#e2e8f0', borderRadius: 8, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }} onClick={() => { navigate(`/unit/${encodeURIComponent(currentUser.unitName)}`); closeSidebarOnMobile(); }} onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.background = 'transparent'; }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4db6ac', flexShrink: 0 }}></div>
                  My Unit Dashboard
                </div>

                {currentUser?.unitName === 'Chiller Plant' ? (
                  <>
                    {[
                      { id: 'overview', title: 'Overview' },
                      { id: 'specs', title: '📋 Technical Specifications' },
                      { id: 'log', title: 'Operating Log' },
                      { id: 'billing', title: 'Billing Params' },
                      { id: 'ahu', title: '🏢 AHU Units' },
                      { id: 'split', title: '🌬️ A/C & Cold Room Units' }
                    ].map(tab => (
                      <div key={tab.id} style={{ padding: '10px 12px', margin: '4px 0', cursor: 'pointer', fontSize: '0.85rem', color: '#e2e8f0', borderRadius: 8, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} 
                           onClick={() => { window.dispatchEvent(new CustomEvent('change-chiller-tab', { detail: tab.id })); closeSidebarOnMobile(); }} 
                           onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.background = 'transparent'; }}>
                        <span style={{ color: '#b8972e', flexShrink: 0 }}>•</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{tab.title}</span>
                      </div>
                    ))}
                  </>
                ) : currentUser?.unitName === 'Plumbing' ? (
                  <>
                    {[
                      { id: 'overview', title: '📊 Overview' },
                      { id: 'oht', title: '🚰 OHTs' },
                      { id: 'sumps', title: '🕳️ Sumps' },
                      { id: 'motors', title: '⚙️ Motors' },
                      { id: 'manpower', title: '👥 Manpower' },
                      { id: 'borewells', title: '💧 Borewells' },
                      { id: 'wells', title: '🌊 Open Wells' }
                    ].map(tab => (
                      <div key={tab.id} style={{ padding: '10px 12px', margin: '4px 0', cursor: 'pointer', fontSize: '0.85rem', color: '#e2e8f0', borderRadius: 8, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} 
                           onClick={() => { window.dispatchEvent(new CustomEvent('change-plumbing-tab', { detail: tab.id })); closeSidebarOnMobile(); }} 
                           onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.background = 'transparent'; }}>
                        <span style={{ color: '#b8972e', flexShrink: 0 }}>•</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{tab.title}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  unitToc.map((item) => (
                    <div key={item.id} style={{ padding: '10px 12px', margin: '4px 0', cursor: 'pointer', fontSize: '0.85rem', color: '#e2e8f0', borderRadius: 8, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={() => { document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); closeSidebarOnMobile(); }} onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.background = 'transparent'; }}>
                      <span style={{ color: '#b8972e', flexShrink: 0 }}>•</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</span>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
          <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', width: 260 }}>
            <button onClick={() => { onLogout(); closeSidebarOnMobile(); }} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Logout
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8fafc' }}>
        {currentUser && <SessionBar currentUser={currentUser} onLogout={onLogout} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />}
        {currentUser?.role === 'admin' && <AdminExportFab />}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 40px 0' }}>
          <Routes>
            <Route
              path="/login"
              element={currentUser ? <PostLoginRedirect currentUser={currentUser} /> : <LoginPage onLogin={onLogin} />}
            />
            <Route path="/" element={<DashboardRoute currentUser={currentUser} />} />
            <Route
              path="/unit/:unit"
              element={currentUser ? <UnitDetailWrapper currentUser={currentUser} /> : <Navigate to="/login" replace />}
            />


          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState(() => readStoredSession());

  const handleLogin = (session) => {
    const next = {
      ...session,
      loginAt: new Date().toISOString(),
    };
    setCurrentUser(next);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(next));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(LEGACY_SESSION_KEY);
  };

  return (
    <div className="app-root">
      <Router>
        <AppRoutes currentUser={currentUser} onLogin={handleLogin} onLogout={handleLogout} />
      </Router>
    </div>
  );
}

export default App;
