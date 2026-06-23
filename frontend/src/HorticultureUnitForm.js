import React, { useState, useEffect } from 'react';

const API = '/api/horticulture';
const inp = { padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', width: '100%', boxSizing: 'border-box', background: '#fff' };
const lbl = { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' };
const sec = { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '16px' };

const TABS = [
  { key: 'plants', label: '🌱 Plant Master' },
  { key: 'locations', label: '📍 Garden Locations' },
  { key: 'maintenance', label: '🔧 Maintenance Tracker' },
];

function today() { return new Date().toISOString().split('T')[0]; }

const Grid = ({ cols = 2, children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>{children}</div>
);

const Btn = ({ color = 'blue', children, ...p }) => (
  <button {...p} style={{
    padding: '9px 22px', borderRadius: '8px', border: 'none', cursor: 'pointer',
    fontWeight: 700, fontSize: '0.85rem', transition: 'opacity 0.15s',
    background: color === 'green' ? '#10b981' : color === 'gray' ? '#e2e8f0' : color === 'red' ? '#ef4444' : '#1976d2',
    color: color === 'gray' ? '#475569' : '#fff', opacity: p.disabled ? 0.6 : 1
  }}>{children}</button>
);

export default function HorticultureUnitForm({ onDataSaved }) {
  const [tab, setTab] = useState('plants');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState(null);

  const fetchData = () => {
    fetch(API)
      .then(r => r.json())
      .then(d => setApiData(d))
      .catch(() => {});
  };

  useEffect(() => {
    fetchData();
  }, []);

  const plants = apiData?.plants || [];
  const locations = apiData?.locations || [];
  const maintenance = apiData?.maintenance || [];

  const [locForm, setLocForm] = useState({ name: '', description: '' });
  const [delLoc, setDelLoc] = useState('');

  // Plant form
  const [plantForm, setPlantForm] = useState({
    id: '', name: '', scientificName: '', category: 'Tree', age: '', datePlanted: today(), status: 'Healthy', remarks: '',
    locMap: {} // { 'Main Entrance': 15, 'Garden Zones': 10 }
  });
  
  const [delPlant, setDelPlant] = useState('');

  // Maint form
  const [maintForm, setMaintForm] = useState({
    plantId: '', locationName: '', wateringSchedule: 'Daily', fertilizerSchedule: 'Monthly', pruningSchedule: 'Quarterly', 
    pestControlSchedule: 'Quarterly', lastMaintenanceDate: today(), nextMaintenanceDueDate: '', assignedStaff: ''
  });

  const toast$ = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const post = async (url, body, msg, reset) => {
    setLoading(true);
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) {
        toast$(await r.text(), false);
        setLoading(false);
        return;
      }
      toast$(msg);
      fetchData();
      reset && reset();
      onDataSaved && onDataSaved();
    } catch {
      toast$('Connection error', false);
    }
    setLoading(false);
  };

  // Handlers
  const submitLocation = e => {
    e.preventDefault();
    if (!locForm.name) { toast$('Location Name required', false); return; }
    post(`${API}/add-location`, locForm, 'Location added successfully!', () => setLocForm({ name: '', description: '' }));
  };

  const submitDeleteLocation = e => {
    e.preventDefault();
    if (!delLoc) return;
    post(`${API}/delete-location`, { name: delLoc }, 'Location deleted!', () => setDelLoc(''));
  };

  const submitPlant = e => {
    e.preventDefault();
    if (!plantForm.name || !plantForm.category) { toast$('Name and Category required', false); return; }
    
    // transform locMap to array
    const locArr = Object.keys(plantForm.locMap).map(locName => ({
      locationName: locName,
      quantity: parseInt(plantForm.locMap[locName]) || 0
    })).filter(l => l.quantity > 0);

    const payload = {
      ...plantForm,
      locations: locArr
    };

    post(`${API}/add-plant`, payload, 'Plant species saved successfully!', () => setPlantForm({
       id: '', name: '', scientificName: '', category: 'Tree', age: '', datePlanted: today(), status: 'Healthy', remarks: '', locMap: {}
    }));
  };
  
  const handleLoadPlantForEdit = (pid) => {
     if (!pid) {
        setPlantForm({ id: '', name: '', scientificName: '', category: 'Tree', age: '', datePlanted: today(), status: 'Healthy', remarks: '', locMap: {} });
        return;
     }
     const p = plants.find(x => x.id === pid);
     if (p) {
        const lmap = {};
        p.locations?.forEach(l => {
           lmap[l.locationName] = l.quantity;
        });
        setPlantForm({
           id: p.id, name: p.name, scientificName: p.scientificName, category: p.category, age: p.age, datePlanted: p.datePlanted,
           status: p.status, remarks: p.remarks, locMap: lmap
        });
     }
  };

  const submitDeletePlant = e => {
    e.preventDefault();
    if (!delPlant) return;
    post(`${API}/delete-plant`, { id: delPlant }, 'Plant species removed!', () => setDelPlant(''));
  };

  const submitMaint = e => {
     e.preventDefault();
     if (!maintForm.plantId || !maintForm.locationName) { toast$('Plant and Location required', false); return; }
     post(`${API}/update-maintenance`, maintForm, 'Maintenance schedule updated!', () => setMaintForm({
       plantId: '', locationName: '', wateringSchedule: 'Daily', fertilizerSchedule: 'Monthly', pruningSchedule: 'Quarterly', 
       pestControlSchedule: 'Quarterly', lastMaintenanceDate: today(), nextMaintenanceDueDate: '', assignedStaff: ''
     }));
  }

  // Renders
  const renderLocations = () => (
    <>
      <form onSubmit={submitLocation}>
        <div style={sec}>
          <h4 style={{ margin: '0 0 14px' }}>📍 Add / Update Campus Location</h4>
          <Grid>
             <label style={lbl}>Location Name *
               <input style={inp} value={locForm.name} onChange={e => setLocForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Science Block Garden" required />
             </label>
             <label style={lbl}>Description
               <input style={inp} value={locForm.description} onChange={e => setLocForm(f => ({...f, description: e.target.value}))} placeholder="Brief description of the zone" />
             </label>
          </Grid>
          <div style={{ marginTop: '16px' }}>
            <Btn color="green" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Location'}</Btn>
          </div>
        </div>
      </form>
      <form onSubmit={submitDeleteLocation}>
        <div style={{ ...sec, background: '#fff5f5', borderColor: '#fee2e2' }}>
           <h4 style={{ margin: '0 0 14px', color: '#991b1b' }}>⚠️ Delete Location</h4>
           <Grid>
             <label style={lbl}>Select Location to Delete *
                <select style={inp} value={delLoc} onChange={e => setDelLoc(e.target.value)} required>
                   <option value="">Select...</option>
                   {locations.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
                </select>
             </label>
           </Grid>
           <div style={{ marginTop: '16px' }}>
             <Btn color="red" type="submit" disabled={loading}>Delete Location</Btn>
           </div>
        </div>
      </form>
    </>
  );

  const renderPlants = () => (
    <>
      <div style={sec}>
         <h4 style={{ margin: '0 0 14px' }}>✏️ Edit Existing Plant Species</h4>
         <Grid>
            <label style={lbl}>Select Species to Edit
               <select style={inp} value={plantForm.id} onChange={e => handleLoadPlantForEdit(e.target.value)}>
                  <option value="">-- Add New Species --</option>
                  {plants.map(p => <option key={p.id} value={p.id}>{p.name} ({p.scientificName})</option>)}
               </select>
            </label>
         </Grid>
      </div>

      <form onSubmit={submitPlant}>
         <div style={sec}>
            <h4 style={{ margin: '0 0 14px' }}>{plantForm.id ? '🌱 Update Species Details' : '🌱 Register New Plant Species'}</h4>
            <Grid cols={3}>
               <label style={lbl}>Name *<input style={inp} value={plantForm.name} onChange={e => setPlantForm(f => ({...f, name: e.target.value}))} required /></label>
               <label style={lbl}>Scientific Name<input style={inp} value={plantForm.scientificName} onChange={e => setPlantForm(f => ({...f, scientificName: e.target.value}))} /></label>
               <label style={lbl}>Category *
                 <select style={inp} value={plantForm.category} onChange={e => setPlantForm(f => ({...f, category: e.target.value}))}>
                    <option>Tree</option><option>Flowering Plant</option><option>Medicinal Plant</option><option>Shrub</option><option>Indoor Plant</option><option>Lawn Plant</option>
                 </select>
               </label>
               <label style={lbl}>Age / Vintage<input style={inp} value={plantForm.age} onChange={e => setPlantForm(f => ({...f, age: e.target.value}))} placeholder="e.g. 5 Years" /></label>
               <label style={lbl}>Date Planted<input type="date" style={inp} value={plantForm.datePlanted} onChange={e => setPlantForm(f => ({...f, datePlanted: e.target.value}))} /></label>
               <label style={lbl}>Status
                 <select style={inp} value={plantForm.status} onChange={e => setPlantForm(f => ({...f, status: e.target.value}))}>
                    <option>Healthy</option><option>Needs Attention</option><option>Diseased</option><option>Removed</option>
                 </select>
               </label>
               <label style={{ ...lbl, gridColumn: 'span 3' }}>Remarks<input style={inp} value={plantForm.remarks} onChange={e => setPlantForm(f => ({...f, remarks: e.target.value}))} /></label>
            </Grid>
         </div>

         <div style={sec}>
            <h4 style={{ margin: '0 0 14px' }}>📍 Map Quantities to Locations</h4>
            {locations.length === 0 ? <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>No locations available. Please add locations first.</p> : (
               <Grid cols={3}>
                  {locations.map(loc => (
                     <label key={loc.name} style={lbl}>{loc.name}
                        <input type="number" min="0" style={inp} placeholder="Quantity" value={plantForm.locMap[loc.name] || ''} 
                               onChange={e => setPlantForm(f => ({...f, locMap: {...f.locMap, [loc.name]: e.target.value}}))} />
                     </label>
                  ))}
               </Grid>
            )}
            <div style={{ marginTop: '24px' }}>
               <Btn color="blue" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Plant Species'}</Btn>
            </div>
         </div>
      </form>
      
      <form onSubmit={submitDeletePlant}>
        <div style={{ ...sec, background: '#fff5f5', borderColor: '#fee2e2' }}>
           <h4 style={{ margin: '0 0 14px', color: '#991b1b' }}>⚠️ Delete Species</h4>
           <Grid>
             <label style={lbl}>Select Species to Delete *
                <select style={inp} value={delPlant} onChange={e => setDelPlant(e.target.value)} required>
                   <option value="">Select...</option>
                   {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
             </label>
           </Grid>
           <div style={{ marginTop: '16px' }}>
             <Btn color="red" type="submit" disabled={loading}>Delete Species</Btn>
           </div>
        </div>
      </form>
    </>
  );

  const renderMaintenance = () => {
    return (
      <form onSubmit={submitMaint}>
         <div style={sec}>
            <h4 style={{ margin: '0 0 14px' }}>🔧 Update Maintenance Schedule</h4>
            <Grid>
               <label style={lbl}>Select Plant *
                  <select style={inp} value={maintForm.plantId} onChange={e => {
                     const pid = e.target.value;
                     setMaintForm(f => ({ ...f, plantId: pid, locationName: '' })); // reset loc
                  }} required>
                     <option value="">Select...</option>
                     {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
               </label>
               <label style={lbl}>Select Location *
                  <select style={inp} value={maintForm.locationName} onChange={e => {
                     const lname = e.target.value;
                     // Try to load existing maintenance if any
                     const existing = maintenance.find(m => m.plantId === maintForm.plantId && m.locationName === lname);
                     if (existing) {
                        setMaintForm(f => ({ ...f, ...existing }));
                     } else {
                        setMaintForm(f => ({ ...f, locationName: lname, wateringSchedule: 'Daily', fertilizerSchedule: 'Monthly', pruningSchedule: 'Quarterly', pestControlSchedule: 'Quarterly', nextMaintenanceDueDate: '', assignedStaff: '' }));
                     }
                  }} required disabled={!maintForm.plantId}>
                     <option value="">Select...</option>
                     {/* Only show locations where this plant exists */}
                     {plants.find(p => p.id === maintForm.plantId)?.locations?.map(l => (
                        <option key={l.locationName} value={l.locationName}>{l.locationName}</option>
                     ))}
                  </select>
               </label>
            </Grid>
            {maintForm.locationName && (
               <div style={{ marginTop: '20px' }}>
                  <Grid cols={3}>
                     <label style={lbl}>Watering Schedule<input style={inp} value={maintForm.wateringSchedule} onChange={e => setMaintForm(f => ({...f, wateringSchedule: e.target.value}))} placeholder="e.g. Daily" /></label>
                     <label style={lbl}>Fertilizer Schedule<input style={inp} value={maintForm.fertilizerSchedule} onChange={e => setMaintForm(f => ({...f, fertilizerSchedule: e.target.value}))} placeholder="e.g. Monthly" /></label>
                     <label style={lbl}>Pruning Schedule<input style={inp} value={maintForm.pruningSchedule} onChange={e => setMaintForm(f => ({...f, pruningSchedule: e.target.value}))} placeholder="e.g. Annual" /></label>
                     <label style={lbl}>Pest Control<input style={inp} value={maintForm.pestControlSchedule} onChange={e => setMaintForm(f => ({...f, pestControlSchedule: e.target.value}))} placeholder="e.g. Quarterly" /></label>
                     <label style={lbl}>Assigned Staff<input style={inp} value={maintForm.assignedStaff} onChange={e => setMaintForm(f => ({...f, assignedStaff: e.target.value}))} placeholder="e.g. Ramesh Kumar" /></label>
                     <div />
                     <label style={lbl}>Last Maintenance Date<input type="date" style={inp} value={maintForm.lastMaintenanceDate} onChange={e => setMaintForm(f => ({...f, lastMaintenanceDate: e.target.value}))} /></label>
                     <label style={lbl}>Next Maintenance Due<input type="date" style={inp} value={maintForm.nextMaintenanceDueDate} onChange={e => setMaintForm(f => ({...f, nextMaintenanceDueDate: e.target.value}))} /></label>
                  </Grid>
                  <div style={{ marginTop: '24px' }}>
                     <Btn color="blue" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Maintenance Schedule'}</Btn>
                  </div>
               </div>
            )}
         </div>
      </form>
    );
  };

  return (
    <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '16px', height: '80vh', overflowY: 'auto' }}>
      <h2 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Horticulture Data Entry</h2>
      <p style={{ margin: '0 0 24px 0', color: '#64748b' }}>Manage campus plants, garden locations, and maintenance tracking.</p>

      {toast && (
        <div style={{ padding: '12px 16px', background: toast.ok ? '#dcfce7' : '#fee2e2', color: toast.ok ? '#166534' : '#991b1b', borderRadius: '8px', marginBottom: '20px', fontWeight: 600 }}>
          {toast.msg}
        </div>
      )}

      {/* TABS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', paddingBottom: '12px', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 16px', background: tab === t.key ? '#1e293b' : 'transparent', color: tab === t.key ? '#fff' : '#64748b',
              border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!apiData && !loading ? (
         <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading form data...</div>
      ) : (
         <>
            {tab === 'plants' && renderPlants()}
            {tab === 'locations' && renderLocations()}
            {tab === 'maintenance' && renderMaintenance()}
         </>
      )}
    </div>
  );
}
