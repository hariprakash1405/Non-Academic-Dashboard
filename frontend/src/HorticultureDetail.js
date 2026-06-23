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
} from 'recharts';

export default function HorticultureDetail({ currentUser }) {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'locations'
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/horticulture');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to fetch horticulture data', err);
      }
    };
    fetchData();
  }, []);

  const plants = data?.plants || [];
  const locations = data?.locations || [];
  const maints = data?.maintenance || [];

  const totalTrees = plants.filter(p => p.category === 'Tree').reduce((acc, curr) => acc + curr.quantity, 0);
  const totalPlants = plants.filter(p => p.category !== 'Tree').reduce((acc, curr) => acc + curr.quantity, 0);
  const totalSpecies = plants.length;
  const totalGardenAreas = locations.length;
  
  // Calculate removed/dead
  const deadRemoved = plants.filter(p => p.status === 'Removed' || p.status === 'Diseased').length; // Assuming status is per species or we count species

  // Categories
  const categoryCounts = {};
  plants.forEach(p => {
    if (!categoryCounts[p.category]) categoryCounts[p.category] = 0;
    categoryCounts[p.category] += p.quantity;
  });

  const categoryPieData = Object.keys(categoryCounts).map(cat => ({
    name: cat,
    value: categoryCounts[cat]
  }));
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Handle drill downs
  const handleSpeciesClick = (species) => {
    setSelectedSpecies(species);
  };
  
  const handleLocationClick = (loc) => {
    setSelectedLocation(loc);
  };

  const renderDashboard = () => (
    <>
      <div className="detail-kpi-row" style={{ marginBottom: '24px' }}>
        <div className="detail-kpi-card" style={{ borderLeft: '4px solid #2e7d32' }} onClick={() => setActiveTab('inventory')}>
          <div className="kpi-label">Total Trees</div>
          <div className="kpi-value">{totalTrees}</div>
          <div className="kpi-label">View Inventory</div>
        </div>
        <div className="detail-kpi-card" style={{ borderLeft: '4px solid #43a047' }} onClick={() => setActiveTab('inventory')}>
          <div className="kpi-label">Total Plants</div>
          <div className="kpi-value">{totalPlants}</div>
          <div className="kpi-label">View Inventory</div>
        </div>
        <div className="detail-kpi-card" style={{ borderLeft: '4px solid #0288d1' }}>
          <div className="kpi-label">Species Count</div>
          <div className="kpi-value">{totalSpecies}</div>
          <div className="kpi-label">Registered Species</div>
        </div>
        <div className="detail-kpi-card" style={{ borderLeft: '4px solid #fbc02d' }} onClick={() => setActiveTab('locations')}>
          <div className="kpi-label">Garden Areas</div>
          <div className="kpi-value">{totalGardenAreas}</div>
          <div className="kpi-label">Campus Locations</div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 16px 0' }}>Plant Distribution by Category</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryPieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {categoryPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: '2 1 400px', background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 16px 0' }}>Top 5 Species by Quantity</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[...plants].sort((a,b) => b.quantity - a.quantity).slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantity" fill="#43a047" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );

  const renderInventory = () => (
    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', overflowX: 'auto' }}>
      <h3 style={{ margin: '0 0 16px 0' }}>Plant & Tree Master Inventory</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: '0.85rem' }}>
            <th style={{ padding: '12px' }}>Name / Species</th>
            <th style={{ padding: '12px' }}>Scientific Name</th>
            <th style={{ padding: '12px' }}>Category</th>
            <th style={{ padding: '12px' }}>Quantity</th>
            <th style={{ padding: '12px' }}>Status</th>
            <th style={{ padding: '12px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {plants.map(p => (
            <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '12px', fontWeight: 600 }}>{p.name}</td>
              <td style={{ padding: '12px', fontStyle: 'italic', color: '#64748b' }}>{p.scientificName}</td>
              <td style={{ padding: '12px' }}>{p.category}</td>
              <td style={{ padding: '12px', fontWeight: 'bold' }}>{p.quantity}</td>
              <td style={{ padding: '12px' }}>
                <span style={{
                  padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                  background: p.status === 'Healthy' ? '#dcfce7' : p.status === 'Diseased' ? '#fee2e2' : '#fef3c7',
                  color: p.status === 'Healthy' ? '#166534' : p.status === 'Diseased' ? '#991b1b' : '#92400e'
                }}>{p.status}</span>
              </td>
              <td style={{ padding: '12px' }}>
                <button onClick={() => handleSpeciesClick(p)} style={{ padding: '6px 12px', background: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Details</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderLocations = () => (
    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
      <h3 style={{ margin: '0 0 16px 0' }}>Campus Garden Locations</h3>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {locations.map(loc => {
          // Count total plants in this location
          let locTotal = 0;
          plants.forEach(p => {
             const locData = p.locations?.find(l => l.locationName === loc.name);
             if (locData) locTotal += locData.quantity;
          });
          
          return (
            <div key={loc.name} style={{ width: '250px', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => handleLocationClick(loc)}>
              <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>{loc.name}</h4>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: '#64748b' }}>{loc.description}</p>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2e7d32' }}>{locTotal} Plants</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSpeciesDetails = () => {
    if (!selectedSpecies) return null;
    return (
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginTop: '24px' }}>
        <button onClick={() => setSelectedSpecies(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '16px', fontWeight: 600 }}>← Back to List</button>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.5rem' }}>{selectedSpecies.name} <span style={{ fontSize: '1rem', fontStyle: 'italic', color: '#64748b' }}>({selectedSpecies.scientificName})</span></h3>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ padding: '8px 16px', background: '#f1f5f9', borderRadius: '8px' }}><strong>Category:</strong> {selectedSpecies.category}</div>
          <div style={{ padding: '8px 16px', background: '#f1f5f9', borderRadius: '8px' }}><strong>Status:</strong> {selectedSpecies.status}</div>
          <div style={{ padding: '8px 16px', background: '#f1f5f9', borderRadius: '8px' }}><strong>Total Qty:</strong> {selectedSpecies.quantity}</div>
          <div style={{ padding: '8px 16px', background: '#f1f5f9', borderRadius: '8px' }}><strong>Date Planted:</strong> {selectedSpecies.datePlanted}</div>
        </div>
        
        <h4>Location Distribution</h4>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {selectedSpecies.locations?.map((l, i) => (
            <li key={i} style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
              <span>{l.locationName}</span>
              <strong style={{ color: '#2e7d32' }}>{l.quantity} units</strong>
            </li>
          ))}
        </ul>

        <h4 style={{ marginTop: '24px' }}>Maintenance Schedules</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
          {selectedSpecies.maintenance?.map((m, i) => (
             <div key={i} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
               <h5 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>{m.locationName}</h5>
               <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                 <div><strong>Watering:</strong> {m.wateringSchedule}</div>
                 <div><strong>Fertilizer:</strong> {m.fertilizerSchedule}</div>
                 <div><strong>Pruning:</strong> {m.pruningSchedule}</div>
                 <div><strong>Last Maint:</strong> {m.lastMaintenanceDate}</div>
                 <div><strong>Next Due:</strong> <span style={{ color: '#d97706', fontWeight: 'bold' }}>{m.nextMaintenanceDueDate}</span></div>
                 <div><strong>Staff:</strong> {m.assignedStaff}</div>
               </div>
             </div>
          ))}
        </div>
      </div>
    );
  };
  
  const renderLocationDetails = () => {
     if (!selectedLocation) return null;
     
     // Find all plants in this location
     const locationPlants = [];
     plants.forEach(p => {
       const locData = p.locations?.find(l => l.locationName === selectedLocation.name);
       if (locData) {
         locationPlants.push({
           name: p.name,
           category: p.category,
           status: p.status,
           quantity: locData.quantity
         });
       }
     });

     return (
       <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginTop: '24px' }}>
          <button onClick={() => setSelectedLocation(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '16px', fontWeight: 600 }}>← Back to Locations</button>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.5rem' }}>Location: {selectedLocation.name}</h3>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>{selectedLocation.description}</p>
          
          <h4>Plants in this Area</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: '0.85rem' }}>
                <th style={{ padding: '12px' }}>Species</th>
                <th style={{ padding: '12px' }}>Category</th>
                <th style={{ padding: '12px' }}>Quantity</th>
                <th style={{ padding: '12px' }}>Overall Status</th>
              </tr>
            </thead>
            <tbody>
              {locationPlants.map((lp, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{lp.name}</td>
                  <td style={{ padding: '12px' }}>{lp.category}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#2e7d32' }}>{lp.quantity}</td>
                  <td style={{ padding: '12px' }}>{lp.status}</td>
                </tr>
              ))}
              {locationPlants.length === 0 && (
                <tr><td colSpan="4" style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>No plants mapped to this location yet.</td></tr>
              )}
            </tbody>
          </table>
       </div>
     )
  }

  return (
    <div className="unit-detail-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Horticulture Dashboard</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
           <button onClick={() => { setActiveTab('inventory'); setSelectedSpecies(null); setSelectedLocation(null); }} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: activeTab === 'inventory' && !selectedSpecies && !selectedLocation ? '#e2e8f0' : '#fff', cursor: 'pointer', fontWeight: 600 }}>Overview & Inventory</button>
           <button onClick={() => { setActiveTab('locations'); setSelectedSpecies(null); setSelectedLocation(null); }} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: activeTab === 'locations' && !selectedSpecies && !selectedLocation ? '#e2e8f0' : '#fff', cursor: 'pointer', fontWeight: 600 }}>Locations</button>
        </div>
      </div>
      
      {!data ? <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading horticulture data...</div> : (
        <>
          {!selectedSpecies && !selectedLocation && renderDashboard()}
          
          <div style={{ marginTop: '32px' }}>
            {selectedSpecies ? renderSpeciesDetails() : selectedLocation ? renderLocationDetails() : activeTab === 'inventory' ? renderInventory() : renderLocations()}
          </div>
        </>
      )}
    </div>
  );
}
