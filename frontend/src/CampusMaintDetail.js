import React, { useState } from 'react';
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
} from 'recharts';

const ticketsMonthly = [
  { month: 'Jan', raised: 42, resolved: 36, pending: 6 },
  { month: 'Feb', raised: 38, resolved: 35, pending: 3 },
  { month: 'Mar', raised: 45, resolved: 40, pending: 5 },
  { month: 'Apr', raised: 40, resolved: 38, pending: 2 },
  { month: 'May', raised: 36, resolved: 33, pending: 3 },
];

const complaintCategories = [
  { name: 'Electrical', value: 28 },
  { name: 'Civil', value: 22 },
  { name: 'Carpentry', value: 14 },
  { name: 'Painting', value: 12 },
  { name: 'Others', value: 10 },
];

const COLORS = ['#1976d2', '#43a047', '#fb8c00', '#8e24aa', '#78909c'];

const tatDays = [
  { month: 'Jan', tat: 2.1 },
  { month: 'Feb', tat: 1.9 },
  { month: 'Mar', tat: 2.4 },
  { month: 'Apr', tat: 1.8 },
  { month: 'May', tat: 1.7 },
];

const budgetAnnual = [{ name: 'Budgeted', inr: 42 }, { name: 'Actual (YTD)', inr: 28 }];

const staffData = [
  {
    id: 1,
    name: 'Arun Kumar',
    phone: '+91 98401 23456',
    type: 'Permanent',
    designation: 'Senior Electrician',
    photo: 'https://i.pravatar.cc/150?u=arun',
  },
  {
    id: 2,
    name: 'Suresh Raina',
    phone: '+91 98402 34567',
    type: 'Contract',
    designation: 'Plumbing Lead',
    photo: 'https://i.pravatar.cc/150?u=suresh',
  },
  {
    id: 3,
    name: 'Meena Kumari',
    phone: '+91 98403 45678',
    type: 'Permanent',
    designation: 'Civil Supervisor',
    photo: 'https://i.pravatar.cc/150?u=meena',
  },
  {
    id: 4,
    name: 'David Miller',
    phone: '+91 98404 56789',
    type: 'Contract',
    designation: 'Carpentry Tech',
    photo: 'https://i.pravatar.cc/150?u=david',
  },
  {
    id: 5,
    name: 'Priya Dharshini',
    phone: '+91 98405 67890',
    type: 'Permanent',
    designation: 'Maintenance Coordinator',
    photo: 'https://i.pravatar.cc/150?u=priya',
  },
];

const civilWorksData = [
  { id: 1, project: 'Hostel Block A Renovation', status: 'In Progress', completion: '65%', budget: '₹12L', contractor: 'BuildRight Inc.' },
  { id: 2, project: 'Main Gate Landscaping', status: 'In Progress', completion: '40%', budget: '₹4.5L', contractor: 'GreenScapes' },
  { id: 3, project: 'Sports Complex Roofing', status: 'Planning', completion: '10%', budget: '₹25L', contractor: 'Apex Infra' },
  { id: 4, project: 'Library Flooring', status: 'In Progress', completion: '85%', budget: '₹3.2L', contractor: 'FineFinishers' },
];

const ticketsListData = [
  { id: 'TKT-1024', category: 'Electrical', desc: 'Flickering lights in Room 204', status: 'Pending', priority: 'High', date: '2026-05-15', month: 'May' },
  { id: 'TKT-1025', category: 'Plumbing', desc: 'Leakage in Block B washroom', status: 'Resolved', priority: 'Medium', date: '2026-04-14', month: 'Apr' },
  { id: 'TKT-1026', category: 'Carpentry', desc: 'Broken door handle in Lab 3', status: 'Raised', priority: 'Low', date: '2026-05-16', month: 'May' },
  { id: 'TKT-1027', category: 'Civil', desc: 'Wall crack in faculty lounge', status: 'Pending', priority: 'Medium', date: '2026-03-13', month: 'Mar' },
  { id: 'TKT-1028', category: 'Others', desc: 'AC filter cleaning required', status: 'Resolved', priority: 'Low', date: '2026-02-12', month: 'Feb' },
  { id: 'TKT-1029', category: 'Electrical', desc: 'UPS backup failure in server room', status: 'Raised', priority: 'Critical', date: '2026-05-16', month: 'May' },
  { id: 'TKT-1030', category: 'Civil', desc: 'Roof leakage in cafeteria', status: 'Pending', priority: 'High', date: '2026-01-20', month: 'Jan' },
];

const contractorData = [
  { id: 1, name: 'Precision Elevators', service: 'Lift Maintenance', contractPeriod: 'Jan 2026 - Dec 2026', amcStatus: 'Active', contact: 'Mr. Rajesh' },
  { id: 2, name: 'CoolBreeze Aircons', service: 'AC & HVAC Servicing', contractPeriod: 'Mar 2026 - Feb 2027', amcStatus: 'Active', contact: 'Mr. Vinod' },
  { id: 3, name: 'PowerSafe Systems', service: 'UPS & Battery AMC', contractPeriod: 'Jun 2025 - May 2026', amcStatus: 'Expiring Soon', contact: 'Ms. Anita' },
];

const equipmentMaintData = [
  { id: 1, equipment: 'Central Chiller Unit', lastMaint: '2026-04-15', nextMaint: '2026-05-15', frequency: 'Monthly', status: 'Scheduled' },
  { id: 2, equipment: 'Block A Generator', lastMaint: '2026-05-01', nextMaint: '2026-06-01', frequency: 'Monthly', status: 'Completed' },
  { id: 3, equipment: 'Server Room UPS', lastMaint: '2026-05-10', nextMaint: '2026-06-10', frequency: 'Monthly', status: 'Scheduled' },
  { id: 4, equipment: 'Water Filtration System', lastMaint: '2026-04-20', nextMaint: '2026-05-20', frequency: 'Monthly', status: 'In Progress' },
];








export default function CampusMaintDetail() {
  const [showStaff, setShowStaff] = useState(false);
  const [showCivil, setShowCivil] = useState(false);
  const [showTickets, setShowTickets] = useState(false);
  const [showContractors, setShowContractors] = useState(false);
  const [showEquipment, setShowEquipment] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);


  const handleBarClick = (data) => {
    if (data && data.month) {
      setSelectedMonth(data.month);
      setShowTickets(true);
      // Scroll to ticket section if needed
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  };

  const filteredTickets = selectedMonth 
    ? ticketsListData.filter(t => t.month === selectedMonth) 
    : ticketsListData;

  return (
    <div className="unit-detail-container" style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ color: '#0c2340', fontSize: '2.2rem', margin: '0 0 8px' }}>Campus Maintenance</h2>
        <p style={{ color: '#5a6578', fontSize: '1rem' }}>
          Comprehensive oversight of infrastructure tickets, workforce distribution, and maintenance budgets.
        </p>
      </div>

      <div className="detail-kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div 
          className="detail-kpi-card" 
          onClick={() => setShowStaff(!showStaff)}
          style={{ 
            cursor: 'pointer', 
            background: showStaff ? '#fffdf5' : '#fff', 
            border: showStaff ? '2px solid #b8972e' : '1px solid #e2e8f0',
            padding: '24px',
            borderRadius: '16px',
            transition: 'all 0.3s ease',
            boxShadow: showStaff ? '0 10px 25px rgba(184, 151, 46, 0.15)' : '0 4px 6px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="kpi-label" style={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Total Staff Deployed</div>
              <div className="kpi-value" style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0c2340', margin: '8px 0' }}>34</div>
              <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>Active on Campus</div>
            </div>
            <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '12px', fontSize: '1.5rem' }}>👥</div>
          </div>
          <div style={{ marginTop: '16px', fontSize: '0.8rem', color: '#1976d2', fontWeight: 600 }}>
            {showStaff ? 'Click to hide details' : 'Click to view employee list'}
          </div>
        </div>

        <div 
          className="detail-kpi-card" 
          onClick={() => setShowCivil(!showCivil)}
          style={{ 
            cursor: 'pointer', 
            background: showCivil ? '#fff5f5' : '#fff', 
            border: showCivil ? '2px solid #ef4444' : '1px solid #e2e8f0',
            padding: '24px',
            borderRadius: '16px',
            transition: 'all 0.3s ease',
            boxShadow: showCivil ? '0 10px 25px rgba(239, 68, 68, 0.15)' : '0 4px 6px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="kpi-label" style={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Ongoing Civil Works</div>
              <div className="kpi-value" style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0c2340', margin: '8px 0' }}>{civilWorksData.length}</div>
              <div style={{ color: '#f59e0b', fontSize: '0.85rem', fontWeight: 600 }}>In Progress</div>
            </div>
            <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '12px', fontSize: '1.5rem' }}>🏗️</div>
          </div>
          <div style={{ marginTop: '16px', fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>
            {showCivil ? 'Click to hide details' : 'Click to view active projects'}
          </div>
        </div>

        <div 
          className="detail-kpi-card" 
          onClick={() => setShowContractors(!showContractors)}
          style={{ 
            cursor: 'pointer', 
            background: showContractors ? '#f0f9ff' : '#fff', 
            border: showContractors ? '2px solid #0284c7' : '1px solid #e2e8f0',
            padding: '24px',
            borderRadius: '16px',
            transition: 'all 0.3s ease',
            boxShadow: showContractors ? '0 10px 25px rgba(2, 132, 199, 0.15)' : '0 4px 6px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="kpi-label" style={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Vendors & Contracts</div>
              <div className="kpi-value" style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0c2340', margin: '8px 0' }}>{contractorData.length}</div>
              <div style={{ color: '#0284c7', fontSize: '0.85rem', fontWeight: 600 }}>Active AMCs</div>
            </div>
            <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '12px', fontSize: '1.5rem' }}>📜</div>
          </div>
          <div style={{ marginTop: '16px', fontSize: '0.8rem', color: '#0284c7', fontWeight: 600 }}>
            {showContractors ? 'Click to hide details' : 'Click to view vendor list'}
          </div>
        </div>

        <div 
          className="detail-kpi-card" 
          onClick={() => setShowEquipment(!showEquipment)}
          style={{ 
            cursor: 'pointer', 
            background: showEquipment ? '#f0fdf4' : '#fff', 
            border: showEquipment ? '2px solid #16a34a' : '1px solid #e2e8f0',
            padding: '24px',
            borderRadius: '16px',
            transition: 'all 0.3s ease',
            boxShadow: showEquipment ? '0 10px 25px rgba(22, 163, 74, 0.15)' : '0 4px 6px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="kpi-label" style={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Preventive Schedule</div>
              <div className="kpi-value" style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0c2340', margin: '8px 0' }}>{equipmentMaintData.length}</div>
              <div style={{ color: '#16a34a', fontSize: '0.85rem', fontWeight: 600 }}>Maintained Items</div>
            </div>
            <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '12px', fontSize: '1.5rem' }}>⚙️</div>
          </div>
          <div style={{ marginTop: '16px', fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>
            {showEquipment ? 'Click to hide dates' : 'Click to view schedule'}
          </div>
        </div>
      </div>

      {/* Staff Drill-down List */}
      {showStaff && (
        <div style={{ 
          background: '#fff', 
          borderRadius: '20px', 
          border: '1px solid #e2e8f0', 
          padding: '32px', 
          marginBottom: '32px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
          animation: 'fadeInSlide 0.4s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, color: '#0c2340', fontSize: '1.4rem' }}>Employee Directory</h3>
            <button 
              onClick={() => setShowStaff(false)}
              style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#64748b' }}
            >
              Close
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0 16px' }}>Staff Info</th>
                  <th style={{ padding: '0 16px' }}>Contact</th>
                  <th style={{ padding: '0 16px' }}>Employment Type</th>
                  <th style={{ padding: '0 16px' }}>Designation</th>
                </tr>
              </thead>
              <tbody>
                {staffData.map((staff) => (
                  <tr key={staff.id} style={{ background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', borderRadius: '12px' }}>
                    <td style={{ padding: '12px 16px', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px', border: '1px solid #f1f5f9', borderRight: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <img src={staff.photo} alt={staff.name} style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }} />
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{staff.name}</div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none', color: '#64748b' }}>
                      {staff.phone}
                    </td>
                    <td style={{ padding: '12px 16px', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none' }}>
                      <span style={{ 
                        padding: '4px 12px', 
                        borderRadius: '999px', 
                        fontSize: '0.75rem', 
                        fontWeight: 700,
                        background: staff.type === 'Permanent' ? '#ecfdf5' : '#fff7ed',
                        color: staff.type === 'Permanent' ? '#059669' : '#d97706'
                      }}>
                        {staff.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', borderTopRightRadius: '12px', borderBottomRightRadius: '12px', border: '1px solid #f1f5f9', borderLeft: 'none', fontWeight: 600, color: '#334155' }}>
                      {staff.designation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Civil Works Drill-down */}
      {showCivil && (
        <div style={{ 
          background: '#fff', 
          borderRadius: '20px', 
          border: '1px solid #e2e8f0', 
          padding: '32px', 
          marginBottom: '32px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
          animation: 'fadeInSlide 0.4s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, color: '#0c2340', fontSize: '1.4rem' }}>Ongoing Projects</h3>
            <button 
              onClick={() => setShowCivil(false)}
              style={{ background: '#fef2f2', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#ef4444' }}
            >
              Close
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0 16px' }}>Project Name</th>
                  <th style={{ padding: '0 16px' }}>Contractor</th>
                  <th style={{ padding: '0 16px' }}>Budget</th>
                  <th style={{ padding: '0 16px' }}>Progress</th>
                  <th style={{ padding: '0 16px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {civilWorksData.map((work) => (
                  <tr key={work.id} style={{ background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', borderRadius: '12px' }}>
                    <td style={{ padding: '16px', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px', border: '1px solid #f1f5f9', borderRight: 'none', fontWeight: 700, color: '#1e293b' }}>
                      {work.project}
                    </td>
                    <td style={{ padding: '16px', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none', color: '#64748b' }}>
                      {work.contractor}
                    </td>
                    <td style={{ padding: '16px', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none', fontWeight: 600, color: '#0f172a' }}>
                      {work.budget}
                    </td>
                    <td style={{ padding: '16px', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none' }}>
                      <div style={{ width: '100px', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: work.completion, height: '100%', background: '#10b981' }}></div>
                      </div>
                      <div style={{ fontSize: '0.7rem', marginTop: '4px', color: '#94a3b8' }}>{work.completion} Complete</div>
                    </td>
                    <td style={{ padding: '16px', borderTopRightRadius: '12px', borderBottomRightRadius: '12px', border: '1px solid #f1f5f9', borderLeft: 'none' }}>
                      <span style={{ 
                        padding: '4px 12px', 
                        borderRadius: '999px', 
                        fontSize: '0.75rem', 
                        fontWeight: 700,
                        background: work.status === 'In Progress' ? '#fff7ed' : '#f1f5f9',
                        color: work.status === 'In Progress' ? '#d97706' : '#64748b'
                      }}>
                        {work.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ticket List Drill-down */}
      {showTickets && (
        <div style={{ 
          background: '#fff', 
          borderRadius: '20px', 
          border: '1px solid #e2e8f0', 
          padding: '32px', 
          marginBottom: '32px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
          animation: 'fadeInSlide 0.4s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ margin: 0, color: '#0c2340', fontSize: '1.4rem' }}>
                Maintenance Ticket Registry {selectedMonth ? `- ${selectedMonth}` : ''}
              </h3>
              {selectedMonth && (
                <button 
                  onClick={() => setSelectedMonth(null)}
                  style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.8rem', padding: 0, cursor: 'pointer', fontWeight: 600, marginTop: '4px' }}
                >
                  Show all months
                </button>
              )}
            </div>
            <button 
              onClick={() => {
                setShowTickets(false);
                setSelectedMonth(null);
              }}
              style={{ background: '#eff6ff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#3b82f6' }}
            >
              Close
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0 16px' }}>Ticket ID</th>
                  <th style={{ padding: '0 16px' }}>Description</th>
                  <th style={{ padding: '0 16px' }}>Category</th>
                  <th style={{ padding: '0 16px' }}>Priority</th>
                  <th style={{ padding: '0 16px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} style={{ background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', borderRadius: '12px' }}>
                    <td style={{ padding: '16px', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px', border: '1px solid #f1f5f9', borderRight: 'none', fontWeight: 700, color: '#3b82f6' }}>
                      {ticket.id}
                    </td>
                    <td style={{ padding: '16px', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none', color: '#1e293b' }}>
                      {ticket.desc}
                    </td>
                    <td style={{ padding: '16px', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none', color: '#64748b' }}>
                      {ticket.category}
                    </td>
                    <td style={{ padding: '16px', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none' }}>
                      <span style={{ 
                        color: ticket.priority === 'Critical' ? '#ef4444' : ticket.priority === 'High' ? '#f97316' : '#64748b',
                        fontWeight: 700,
                        fontSize: '0.8rem'
                      }}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td style={{ padding: '16px', borderTopRightRadius: '12px', borderBottomRightRadius: '12px', border: '1px solid #f1f5f9', borderLeft: 'none' }}>
                      <span style={{ 
                        padding: '4px 12px', 
                        borderRadius: '999px', 
                        fontSize: '0.75rem', 
                        fontWeight: 700,
                        background: ticket.status === 'Resolved' ? '#ecfdf5' : ticket.status === 'Pending' ? '#fff7ed' : '#eff6ff',
                        color: ticket.status === 'Resolved' ? '#059669' : ticket.status === 'Pending' ? '#d97706' : '#3b82f6'
                      }}>
                        {ticket.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Contractor Drill-down */}
      {showContractors && (
        <div style={{ 
          background: '#fff', 
          borderRadius: '20px', 
          border: '1px solid #e2e8f0', 
          padding: '32px', 
          marginBottom: '32px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
          animation: 'fadeInSlide 0.4s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, color: '#0c2340', fontSize: '1.4rem' }}>Contractor & Vendor Directory</h3>
            <button 
              onClick={() => setShowContractors(false)}
              style={{ background: '#f0f9ff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#0284c7' }}
            >
              Close
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0 16px' }}>Vendor Name</th>
                  <th style={{ padding: '0 16px' }}>Service Provided</th>
                  <th style={{ padding: '0 16px' }}>Contract Period</th>
                  <th style={{ padding: '0 16px' }}>Contact Person</th>
                  <th style={{ padding: '0 16px' }}>AMC Status</th>
                </tr>
              </thead>
              <tbody>
                {contractorData.map((vendor) => (
                  <tr key={vendor.id} style={{ background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', borderRadius: '12px' }}>
                    <td style={{ padding: '16px', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px', border: '1px solid #f1f5f9', borderRight: 'none', fontWeight: 700, color: '#1e293b' }}>
                      {vendor.name}
                    </td>
                    <td style={{ padding: '16px', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none', color: '#64748b' }}>
                      {vendor.service}
                    </td>
                    <td style={{ padding: '16px', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none', color: '#1e293b', fontSize: '0.9rem' }}>
                      {vendor.contractPeriod}
                    </td>
                    <td style={{ padding: '16px', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none', color: '#64748b' }}>
                      {vendor.contact}
                    </td>
                    <td style={{ padding: '16px', borderTopRightRadius: '12px', borderBottomRightRadius: '12px', border: '1px solid #f1f5f9', borderLeft: 'none' }}>
                      <span style={{ 
                        padding: '4px 12px', 
                        borderRadius: '999px', 
                        fontSize: '0.75rem', 
                        fontWeight: 700,
                        background: vendor.amcStatus === 'Active' ? '#f0fdf4' : '#fef2f2',
                        color: vendor.amcStatus === 'Active' ? '#16a34a' : '#ef4444'
                      }}>
                        {vendor.amcStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* Equipment Maintenance Drill-down */}
      {showEquipment && (
        <div style={{ 
          background: '#fff', 
          borderRadius: '20px', 
          border: '1px solid #e2e8f0', 
          padding: '32px', 
          marginBottom: '32px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
          animation: 'fadeInSlide 0.4s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, color: '#0c2340', fontSize: '1.4rem' }}>Preventive Maintenance Schedule</h3>
            <button 
              onClick={() => setShowEquipment(false)}
              style={{ background: '#f0fdf4', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#16a34a' }}
            >
              Close
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0 16px' }}>Equipment</th>
                  <th style={{ padding: '0 16px' }}>Last Maintenance</th>
                  <th style={{ padding: '0 16px' }}>Next Schedule</th>
                  <th style={{ padding: '0 16px' }}>Frequency</th>
                  <th style={{ padding: '0 16px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {equipmentMaintData.map((item) => (
                  <tr key={item.id} style={{ background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', borderRadius: '12px' }}>
                    <td style={{ padding: '16px', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px', border: '1px solid #f1f5f9', borderRight: 'none', fontWeight: 700, color: '#1e293b' }}>
                      {item.equipment}
                    </td>
                    <td style={{ padding: '16px', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none', color: '#64748b' }}>
                      {item.lastMaint}
                    </td>
                    <td style={{ padding: '16px', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none', fontWeight: 600, color: '#0f172a' }}>
                      {item.nextMaint}
                    </td>
                    <td style={{ padding: '16px', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none', color: '#64748b' }}>
                      {item.frequency}
                    </td>
                    <td style={{ padding: '16px', borderTopRightRadius: '12px', borderBottomRightRadius: '12px', border: '1px solid #f1f5f9', borderLeft: 'none' }}>
                      <span style={{ 
                        padding: '4px 12px', 
                        borderRadius: '999px', 
                        fontSize: '0.75rem', 
                        fontWeight: 700,
                        background: item.status === 'Completed' ? '#f0fdf4' : item.status === 'Scheduled' ? '#eff6ff' : '#fff7ed',
                        color: item.status === 'Completed' ? '#16a34a' : item.status === 'Scheduled' ? '#3b82f6' : '#d97706'
                      }}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* Analytics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
        <div 
          className="detail-chart-block" 
          style={{ 
            background: '#fff', 
            padding: '24px', 
            borderRadius: '20px', 
            border: showTickets ? '2px solid #3b82f6' : '1px solid #e2e8f0', 
            boxShadow: showTickets ? '0 10px 25px rgba(59, 130, 246, 0.1)' : '0 4px 6px rgba(0,0,0,0.02)',
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ margin: 0, color: '#0c2340', fontSize: '1.1rem' }}>Ticket Volume Trends</h4>
            <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>Click bars to view details</div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ticketsMonthly} onClick={(data) => data && data.activePayload && handleBarClick(data.activePayload[0].payload)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px' }} />
              <Bar dataKey="raised" fill="#3b82f6" name="Raised" radius={[6, 6, 0, 0]} barSize={20} cursor="pointer" />
              <Bar dataKey="resolved" fill="#10b981" name="Resolved" radius={[6, 6, 0, 0]} barSize={20} cursor="pointer" />
              <Bar dataKey="pending" fill="#ef4444" name="Pending" radius={[6, 6, 0, 0]} barSize={20} cursor="pointer" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="detail-chart-block" style={{ background: '#fff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <h4 style={{ margin: '0 0 20px', color: '#0c2340', fontSize: '1.1rem' }}>Complaint Categories</h4>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={complaintCategories}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {complaintCategories.map((entry, index) => (
                  <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="detail-chart-block" style={{ background: '#fff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <h4 style={{ margin: '0 0 20px', color: '#0c2340', fontSize: '1.1rem' }}>Resolution Performance (Avg TAT Days)</h4>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={tatDays}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip formatter={(v) => [`${v} days`, 'Avg TAT']} />
              <Bar dataKey="tat" fill="#6366f1" name="Avg TAT (days)" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="detail-chart-block" style={{ background: '#fff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <h4 style={{ margin: '0 0 20px', color: '#0c2340', fontSize: '1.1rem' }}>Budget Utilization (₹ Lakhs)</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={budgetAnnual}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="inr" fill="#0d9488" name="₹ Lakhs" radius={[6, 6, 0, 0]} barSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <style>{`
        @keyframes fadeInSlide {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
