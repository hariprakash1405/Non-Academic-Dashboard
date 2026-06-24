import { API_BASE } from './config';
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';


const PROJECT_UNITS = [
  'Power House', 'Chiller Plant', 'RO Plant', 'Hostels', 'Transport', 'Mess', 
  'Medical Centre', 'STP', 'Campus Maint.', 'Sports/Gym', 'TRC / NMC', 
  'Horticulture', 'Plumbing'
];

export default function DevAdminPage() {
  const [activeTab, setActiveTab] = useState('masters'); // 'masters', 'users'
  const [showEditRole, setShowEditRole] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedRoleToEdit, setSelectedRoleToEdit] = useState('unit_head_Hostels');
  const [checkedResources, setCheckedResources] = useState({});
  const [usersList, setUsersList] = useState([]);
  const [newUser, setNewUser] = useState({ role: 'unit_head', unitName: '', username: '', name: '', password: '', email: '', status: true });
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const usersToUpload = data.map(rawRow => {
          const row = {};
          Object.keys(rawRow).forEach(k => {
            row[String(k).toLowerCase().replace(/[^a-z0-9]/g, '')] = rawRow[k];
          });
          
          const rawRole = String(row.systemrole || row.role || '').toLowerCase();
          const parsedRole = rawRole.includes('admin') ? (rawRole.includes('dev') ? 'dev_admin' : 'admin') : 'unit_head';
          
          const email = String(row.mailid || row.emailid || row.email || '').trim();
          const username = String(row.username || '').trim() || (email ? email.split('@')[0] : '');
          const name = String(row.name || row.fullname || '').trim() || username;
          
          return {
            username: username,
            password: String(row.password || '').trim(),
            email: email,
            role: parsedRole,
            unitName: String(row.assignedunit || row.unit || '').trim(),
            name: name,
            status: true
          };
        }).filter(u => u.email || (u.username && u.password));

        if (usersToUpload.length === 0) {
          alert('No valid users found in the Excel file. Please provide either (username & password) OR email.');
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = usersToUpload.filter(u => u.email && !emailRegex.test(u.email));
        if (invalidEmails.length > 0) {
          alert(`Found ${invalidEmails.length} invalid email(s) in bulk upload. Please fix them before uploading.`);
          return;
        }

        await fetch(API_BASE + '/api/users/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(usersToUpload)
        });

        fetchUsers();
        alert(`Successfully imported ${usersToUpload.length} users!`);
      } catch (err) {
        console.error('Error uploading bulk users:', err);
        alert('Failed to parse Excel file. Make sure it matches the required schema.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const downloadSampleExcel = () => {
    const ws = XLSX.utils.json_to_sheet([{
      'name': 'John Doe',
      'mail id': 'john.doe@example.com',
      'assigned unit': 'Hostels',
      'system_role': 'unit_head'
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users Sample");
    XLSX.writeFile(wb, "bulk_users_sample.xlsx");
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(API_BASE + '/api/users');
      const data = await res.json();
      setUsersList(data || []);
    } catch (e) {
      console.error('Failed to fetch users', e);
    }
  };

  const handleSaveUser = async () => {
    if (!newUser.username && !newUser.email) {
      alert('Please provide either a Username or an Email ID.');
      return;
    }
    if (newUser.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newUser.email)) {
        alert('Please enter a valid email address.');
        return;
      }
    }

    const userToSave = { ...newUser };
    if (!userToSave.username && userToSave.email) {
      userToSave.username = userToSave.email.split('@')[0];
    }
    if (!userToSave.name) {
      userToSave.name = userToSave.username;
    }

    try {
      await fetch(API_BASE + '/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userToSave)
      });
      setShowAddUser(false);
      setNewUser({ role: 'unit_head', unitName: '', username: '', name: '', password: '', email: '', status: true });
      fetchUsers();
    } catch (e) {
      console.error('Failed to save user', e);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await fetch(API_BASE + '/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, status: !user.status })
      });
      fetchUsers();
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  const handleUpdateRole = async () => {
    try {
      let targetRole = selectedRoleToEdit;
      let targetUnit = 'All Units';
      
      if (selectedRoleToEdit.startsWith('unit_head_')) {
        targetRole = 'unit_head';
        targetUnit = selectedRoleToEdit.replace('unit_head_', '');
      }

      // Find all users that match this role and unit (e.g., all Hostels Heads)
      const usersToUpdate = usersList.filter(u => u.role === targetRole && (targetRole !== 'unit_head' || u.unitName === targetUnit));
      
      const dashboardAccess = !!checkedResources['Global Executive Dashboard'];
      const accessibleUnitsList = PROJECT_UNITS.filter(u => checkedResources[u] && u !== targetUnit);
      const accessibleUnitsStr = accessibleUnitsList.join(',');
      
      // Update each matching user's dashboardAccess and accessibleUnits flags
      for (const user of usersToUpdate) {
        await fetch(API_BASE + '/api/users/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...user, dashboardAccess, accessibleUnits: accessibleUnitsStr })
        });
      }
      
      setShowEditRole(false);
      fetchUsers();
      alert(`Role permissions updated successfully for ${targetUnit} Head!`);
    } catch (e) {
      console.error('Failed to update role permissions', e);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to completely delete this user? This cannot be undone.")) return;
    try {
      await fetch(API_BASE + '/api/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      fetchUsers();
    } catch (e) {
      console.error('Failed to delete user', e);
    }
  };

  React.useEffect(() => {
    const newChecked = { 'Global Executive Dashboard': false, 'Campus Units Forms': false };
    PROJECT_UNITS.forEach(u => newChecked[u] = false);

    if (selectedRoleToEdit === 'dev_admin') {
      Object.keys(newChecked).forEach(k => newChecked[k] = true);
    } else if (selectedRoleToEdit === 'admin') {
      newChecked['Global Executive Dashboard'] = true;
    } else if (selectedRoleToEdit.startsWith('unit_head_')) {
      const unitName = selectedRoleToEdit.replace('unit_head_', '');
      newChecked[unitName] = true;
      
      // Check if any user with this role/unit currently has dashboard access in the database
      const existingUser = usersList.find(u => u.role === 'unit_head' && u.unitName === unitName);
      if (existingUser) {
        if (existingUser.dashboardAccess) {
          newChecked['Global Executive Dashboard'] = true;
        }
        if (existingUser.accessibleUnits) {
          const accUnits = existingUser.accessibleUnits.split(',');
          accUnits.forEach(u => {
            if (PROJECT_UNITS.includes(u.trim())) {
              newChecked[u.trim()] = true;
            }
          });
        }
        newChecked['Campus Units Forms'] = PROJECT_UNITS.every(u => newChecked[u]);
      }
    }
    setCheckedResources(newChecked);
  }, [selectedRoleToEdit, usersList]);

  const toggleResource = (res) => {
    if (res === 'Campus Units Forms') {
      setCheckedResources(prev => {
        const newState = !prev['Campus Units Forms'];
        const next = { ...prev, 'Campus Units Forms': newState };
        PROJECT_UNITS.forEach(u => next[u] = newState);
        return next;
      });
    } else {
      setCheckedResources(prev => {
        const next = { ...prev, [res]: !prev[res] };
        const allUnitsChecked = PROJECT_UNITS.every(u => next[u]);
        next['Campus Units Forms'] = allUnitsChecked;
        return next;
      });
    }
  };

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'var(--font-sans, "Inter", sans-serif)' }}>
      {showEditRole && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '600px', borderRadius: '16px', padding: '32px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <button onClick={() => setShowEditRole(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontWeight: 600 }}>
                &larr; Back to List
              </button>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>Edit Role</h3>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>Select Role / User to Edit</label>
              <select 
                value={selectedRoleToEdit} 
                onChange={(e) => setSelectedRoleToEdit(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none', background: '#fff' }}
              >
                <option value="dev_admin">Developer Admin</option>
                <option value="admin">Admin (Dean)</option>
                <optgroup label="Unit Heads">
                  {PROJECT_UNITS.map(unit => (
                    <option key={unit} value={`unit_head_${unit}`}>{unit} Head</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>Assign Resources *</label>
                <span 
                  style={{ fontSize: '0.8rem', color: '#6366f1', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => {
                    const cleared = {};
                    Object.keys(checkedResources).forEach(k => cleared[k] = false);
                    setCheckedResources(cleared);
                  }}
                >
                  Deselect All
                </span>
              </div>
              
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', maxHeight: '250px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <input type="checkbox" checked={!!checkedResources['Global Executive Dashboard']} onChange={() => toggleResource('Global Executive Dashboard')} style={{ width: '18px', height: '18px', accentColor: '#4f46e5', cursor: 'pointer' }} />
                  <span style={{ fontSize: '0.95rem', color: '#1e293b', fontWeight: 500 }}>Global Executive Dashboard</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                  <input type="checkbox" checked={!!checkedResources['Campus Units Forms']} onChange={() => toggleResource('Campus Units Forms')} style={{ width: '18px', height: '18px', accentColor: '#4f46e5', marginTop: '2px', cursor: 'pointer' }} />
                  <div>
                    <span style={{ fontSize: '0.95rem', color: '#1e293b', fontWeight: 500, display: 'block', marginBottom: '8px' }}>Campus Units Forms</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginLeft: '8px' }}>
                      {PROJECT_UNITS.map(unit => (
                        <label key={unit} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={!!checkedResources[unit]} onChange={() => toggleResource(unit)} style={{ width: '16px', height: '16px', accentColor: '#4f46e5', cursor: 'pointer' }} />
                          <span style={{ fontSize: '0.9rem', color: '#475569' }}>{unit}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '8px' }}>Selected access points configured based on role</div>
            </div>

            <button onClick={handleUpdateRole} style={{ width: '100%', padding: '14px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#4338ca'} onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}>
              Update Role
            </button>
          </div>
        </div>
      )}

      {showAddUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#f8fafc', width: '90%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', padding: '32px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <button onClick={() => setShowAddUser(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontWeight: 600 }}>
                &larr; Back to List
              </button>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>Add New User</h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={downloadSampleExcel} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', color: '#334155' }}>Download Sample</button>
                <input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  style={{ display: 'none' }} 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                />
                <button onClick={() => fileInputRef.current && fileInputRef.current.click()} style={{ padding: '8px 16px', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', color: '#166534' }}>Import Excel</button>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Credentials</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>System Role</label>
                  <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}><option value="unit_head">unit_head</option><option value="admin">admin</option><option value="dev_admin">dev_admin</option></select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Assigned Unit</label>
                  <select value={newUser.unitName} onChange={(e) => setNewUser({...newUser, unitName: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}>
                    <option value="">All Units (Admin)</option>
                    {PROJECT_UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Username</label>
                  <input type="text" placeholder="e.g. power.head" value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }} />
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Basic Info</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '20px' }}>
                <div style={{ gridColumn: 'span 1' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Full Name *</label>
                  <input type="text" placeholder="Name of User" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }} />
                </div>
                <div style={{ gridColumn: 'span 1' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Password</label>
                  <input type="password" placeholder="Set password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }} />
                </div>
                <div style={{ gridColumn: 'span 1' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Email ID</label>
                  <input type="email" placeholder="e.g. user@domain.com" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }} />
                </div>
                <div style={{ gridColumn: 'span 1' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Status</label>
                  <select value={newUser.status} onChange={(e) => setNewUser({...newUser, status: e.target.value === 'true'})} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowAddUser(false)} style={{ padding: '12px 24px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', color: '#334155' }}>Cancel</button>
              <button onClick={handleSaveUser} style={{ padding: '12px 24px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}>Save User</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#64748b', marginBottom: '4px' }}>
            System <span style={{ fontSize: '0.8rem' }}>&gt;</span> <span style={{ color: '#0f172a', fontWeight: 500 }}>{activeTab === 'masters' ? 'Masters' : 'Users'}</span>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a', letterSpacing: '-0.5px' }}>{activeTab === 'masters' ? 'Masters' : 'System User Registries'}</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>{activeTab === 'masters' ? 'Manage system configurations' : 'Manage user profiles, permissions, and roles.'}</p>
        </div>
        {activeTab === 'users' && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setShowAddUser(true)} style={{ background: '#4f46e5', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(79, 70, 229, 0.2)' }}>
              <span>+</span> Add User Account
            </button>
          </div>
        )}
      </div>

      {activeTab === 'masters' ? (
        <div style={{ display: 'flex', gap: '32px' }}>
          <div onClick={() => setShowEditRole(true)} style={{ background: '#fff', borderRadius: '16px', padding: '50px 32px', width: '380px', textAlign: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(0,0,0,0.06)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.02)'; }}>
            <div style={{ width: '80px', height: '80px', background: '#f0f9ff', color: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
              <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            </div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.25rem', color: '#0f172a', fontWeight: 700 }}>Role Details</h3>
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#64748b', lineHeight: '1.5' }}>Manage system roles and access levels</p>
          </div>

          <div onClick={() => setActiveTab('users')} style={{ background: '#fff', borderRadius: '16px', padding: '50px 32px', width: '380px', textAlign: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(0,0,0,0.06)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.02)'; }}>
            <div style={{ width: '80px', height: '80px', background: '#f5f3ff', color: '#8b5cf6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
              <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            </div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.25rem', color: '#0f172a', fontWeight: 700 }}>User Details</h3>
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#64748b', lineHeight: '1.5' }}>Manage user profiles, permissions, and roles</p>
          </div>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ color: '#4f46e5' }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
              <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Active Users Profile List</h4>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total Records: {usersList.length} of {usersList.length}</div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input type="text" placeholder="Search by name, email, user ID, department, role..." style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }} />
              <svg width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24" style={{ position: 'absolute', left: '14px', top: '12px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <select style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', background: '#fff', minWidth: '180px', color: '#334155', fontWeight: 500 }}>
              <option>All User Types</option>
              <option>Dean / Admin</option>
              <option>Developer Admin</option>
              <option>Unit Head</option>
            </select>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 8px', fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>S. No</th>
                  <th style={{ padding: '12px 8px', fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Username</th>
                  <th style={{ padding: '12px 8px', fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Name</th>
                  <th style={{ padding: '12px 8px', fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Email</th>
                  <th style={{ padding: '12px 8px', fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Assigned Unit</th>
                  <th style={{ padding: '12px 8px', fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>System Role</th>
                  <th style={{ padding: '12px 8px', fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '12px 8px', fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u, idx) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px 8px', fontSize: '0.9rem', color: '#1e293b', fontWeight: 600 }}>{idx + 1}</td>
                    <td style={{ padding: '16px 8px', fontSize: '0.9rem', color: '#1e293b', fontWeight: 600 }}>{u.username}</td>
                    <td style={{ padding: '16px 8px', fontSize: '0.9rem', color: '#475569' }}>{u.name}</td>
                    <td style={{ padding: '16px 8px', fontSize: '0.9rem', color: '#475569' }}>{u.email || '-'}</td>
                    <td style={{ padding: '16px 8px', fontSize: '0.9rem', color: '#475569' }}>{u.unitName}</td>
                    <td style={{ padding: '16px 8px' }}>
                      <span style={{ color: u.role === 'admin' || u.role === 'dev_admin' ? '#3b82f6' : '#f59e0b', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>{u.role}</span>
                    </td>
                    <td style={{ padding: '16px 8px' }}>
                      <div onClick={() => handleToggleStatus(u)} style={{ width: '40px', height: '20px', background: u.status ? '#4f46e5' : '#cbd5e1', borderRadius: '10px', position: 'relative', cursor: 'pointer' }}>
                        <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', right: u.status ? '2px' : 'auto', left: u.status ? 'auto' : '2px', top: '2px' }}></div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 8px', display: 'flex', gap: '8px' }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }} onClick={() => setShowEditRole(true)}>✎</button>
                      <button onClick={() => handleDeleteUser(u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
