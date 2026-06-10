import React, { useState } from 'react';

export const TICKETS_DATA = [
  { id: 'TKT-101', title: 'AC not working in Seminar Hall', unit: 'Chiller Plant', category: 'HVAC', status: 'Open', date: '2026-05-13' },
  { id: 'TKT-102', title: 'Water leakage in Hostel Block B', unit: 'Plumbing', category: 'Plumbing', status: 'In Progress', date: '2026-05-12' },
  { id: 'TKT-103', title: 'Bus 04 brake issue', unit: 'Transport', category: 'Mechanical', status: 'Resolved', date: '2026-05-10' },
  { id: 'TKT-104', title: 'Wi-Fi slow in Library', unit: 'TRC / NMC', category: 'IT Support', status: 'Open', date: '2026-05-14' },
  { id: 'TKT-105', title: 'STP filter cleaning required', unit: 'STP', category: 'Maintenance', status: 'In Progress', date: '2026-05-11' },
  { id: 'TKT-106', title: 'Street light repair near Gate 2', unit: 'Power House', category: 'Electrical', status: 'Open', date: '2026-05-13' },
  { id: 'TKT-107', title: 'Gym treadmill belt broken', unit: 'Sports/Gym', category: 'Equipment', status: 'Open', date: '2026-05-14' },
  { id: 'TKT-108', title: 'Mess exhaust fan making noise', unit: 'Mess', category: 'Electrical', status: 'Resolved', date: '2026-05-09' },
];

export default function TicketsDashboard({ currentUser }) {
  const [filterUnit, setFilterUnit] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'table'

  const isAdmin = currentUser?.role === 'admin';
  const myTickets = isAdmin ? TICKETS_DATA : TICKETS_DATA.filter(t => t.unit === currentUser?.unitName);
  
  const units = ['All', ...new Set(myTickets.map(t => t.unit))];

  const filteredTickets = myTickets.filter(t => {
    if (filterUnit !== 'All' && t.unit !== filterUnit) return false;
    if (filterStatus !== 'All' && t.status !== filterStatus) return false;
    return true;
  });

  const kanbanColumns = ['Open', 'In Progress', 'Resolved'];

  const getStatusColor = (status) => {
    switch(status) {
      case 'Open': return '#d32f2f';
      case 'In Progress': return '#f57c00';
      case 'Resolved': return '#388e3c';
      default: return '#757575';
    }
  };

  return (
    <div className="tickets-dashboard unit-detail-container" style={{ maxWidth: '1120px' }}>
      <div className="tickets-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ marginBottom: '8px' }}>Tickets & Maintenance</h2>
          <p style={{ color: '#607d8b', margin: 0 }}>Track maintenance requests and issues across all campus units.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button style={{ background: '#1976d2', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 6px rgba(25, 118, 210, 0.3)' }} onClick={() => alert('Raise request modal/form would open here.')}>
            + Raise Request
          </button>
          
          <div style={{ display: 'flex', gap: '8px', background: '#f4f6f9', padding: '6px', borderRadius: '8px', border: '1px solid #e3e8ef' }}>
          <button 
            style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: viewMode === 'kanban' ? '#fff' : 'transparent', color: viewMode === 'kanban' ? '#1a1f2e' : '#607d8b', fontWeight: 600, cursor: 'pointer', boxShadow: viewMode === 'kanban' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none' }}
            onClick={() => setViewMode('kanban')}
          >
            Kanban
          </button>
          <button 
            style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: viewMode === 'table' ? '#fff' : 'transparent', color: viewMode === 'table' ? '#1a1f2e' : '#607d8b', fontWeight: 600, cursor: 'pointer', boxShadow: viewMode === 'table' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none' }}
            onClick={() => setViewMode('table')}
          >
            Table
          </button>
        </div>
      </div>
      </div>

      <div className="dashboard-controls" style={{ marginBottom: '24px' }}>
        {isAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#455a64' }}>Filter by Unit</label>
            <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)}>
              {units.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#455a64' }}>Filter by Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#455a64' }}>Date Range</label>
          <input type="date" placeholder="Start Date" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'flex-end' }}>
          <button className="controls-reset-btn" onClick={() => { setFilterUnit('All'); setFilterStatus('All'); }}>Reset</button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="kanban-board" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {kanbanColumns.map(col => {
            const colTickets = filteredTickets.filter(t => t.status === col);
            return (
              <div key={col} className="kanban-column" style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e3e8ef' }}>
                <h3 style={{ fontSize: '1rem', color: '#1a1f2e', margin: '0 0 16px 0', display: 'flex', justifyContent: 'space-between' }}>
                  {col} 
                  <span style={{ background: '#e2e8f0', color: '#64748b', padding: '2px 8px', borderRadius: '999px', fontSize: '0.8rem' }}>{colTickets.length}</span>
                </h3>
                <div className="kanban-cards" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {colTickets.map(ticket => (
                    <div key={ticket.id} className="kanban-card" style={{ background: '#fff', padding: '16px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', borderLeft: `4px solid ${getStatusColor(ticket.status)}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>{ticket.id}</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{ticket.date}</span>
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', marginBottom: '12px' }}>{ticket.title}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', color: '#475569', fontWeight: 500 }}>{ticket.unit}</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{ticket.category}</span>
                      </div>
                    </div>
                  ))}
                  {colTickets.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>No tickets</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="unit-form-table-wrap">
          <table className="unit-form-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Title</th>
                <th>Unit</th>
                <th>Category</th>
                <th>Status</th>
                <th>Date Opened</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map(ticket => (
                <tr key={ticket.id}>
                  <td><strong>{ticket.id}</strong></td>
                  <td>{ticket.title}</td>
                  <td>{ticket.unit}</td>
                  <td>{ticket.category}</td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: getStatusColor(ticket.status),
                      backgroundColor: `${getStatusColor(ticket.status)}15`
                    }}>
                      {ticket.status}
                    </span>
                  </td>
                  <td>{ticket.date}</td>
                </tr>
              ))}
              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#607d8b' }}>No tickets found matching filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
