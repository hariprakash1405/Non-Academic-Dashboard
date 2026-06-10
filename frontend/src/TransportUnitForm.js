import React, { useState, useEffect } from 'react';

const API = 'http://localhost:8085/api/transport';
const inp = { padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', width: '100%', boxSizing: 'border-box', background: '#fff' };
const lbl = { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' };
const sec = { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '16px' };

const TABS = [
  { key: 'vehicle', label: '🚌 Bus Details' },
  { key: 'driver', label: '👤 Driver' },
  { key: 'fuel', label: '⛽ Fuel Log' },
  { key: 'dailyops', label: '📊 Trips Log' },
  { key: 'students', label: '🎓 Students Master' },
  { key: 'maintenance', label: '🔧 Maintenance' },
];

function today() { return new Date().toISOString().split('T')[0]; }

const Grid = ({ cols = 2, children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>{children}</div>
);

const Btn = ({ color = 'blue', children, ...p }) => (
  <button {...p} style={{
    padding: '9px 22px', borderRadius: '8px', border: 'none', cursor: 'pointer',
    fontWeight: 700, fontSize: '0.85rem', transition: 'opacity 0.15s',
    background: color === 'green' ? '#10b981' : color === 'gray' ? '#e2e8f0' : '#1976d2',
    color: color === 'gray' ? '#475569' : '#fff', opacity: p.disabled ? 0.6 : 1
  }}>{children}</button>
);

export default function TransportUnitForm({ vehicles: vProp = [], drivers: dProp = [], fuelLogs: fProp = [], maintenance: mProp = [], onDataSaved }) {
  const [tab, setTab] = useState('vehicle');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState(null);

  const fetchData = () => {
    fetch(API)
      .then(r => r.json())
      .then(d => setApiData(d))
      .catch(() => { });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const vehicles = apiData?.vehicles?.map(v => ({ ...v, mileage: `${v.mileageKmpl} kmpl` })) || [];
  const drivers = apiData?.drivers || [];
  const fuelLogs = apiData?.fuelByVehicle || [];
  const maintenance = apiData?.maintenance || [];
  const trips = apiData?.trips || [];
  const students = apiData?.students || [];

  const [vForm, setVForm] = useState({ number: '', status: 'Active', route: '', driver: '' });
  const [dForm, setDForm] = useState({ id: '', status: 'Present', morningRoute: '', morningBus: '', eveningRoute: '', eveningBus: '', specialPlace: '', specialOut: '', specialReturn: '', carOrEV: 'No' });
  const [fForm, setFForm] = useState({ vehicle: '', date: today(), litres: '', odometer: '', prevOdometer: '' });
  const [mForm, setMForm] = useState({ vehicle: '', cost: '', service: '', status: 'Pending', date: today() });

  const [newVForm, setNewVForm] = useState({ busNo: '', number: '', type: 'Bus', status: 'Active', mileageKmpl: '', route: '', driver: '', lastFC: '', nextFC: '' });
  const [editVForm, setEditVForm] = useState({ oldNumber: '', busNo: '', number: '', type: 'Bus', status: 'Active', mileageKmpl: '', route: '', driver: '', lastFC: '', nextFC: '' });
  const [newDForm, setNewDForm] = useState({ name: '', status: 'Present', morningRoute: '', morningBus: '', eveningRoute: '', eveningBus: '', specialPlace: '', specialOut: '', specialReturn: '', carOrEV: 'No' });
  const [delVehicle, setDelVehicle] = useState('');
  const [delDriver, setDelDriver] = useState('');

  const [tripForm, setTripForm] = useState({
    date: today(),
    busNumber: '',
    tripType: 'Morning',
    routeName: '',
    driverName: '',
    startTime: '',
    endTime: '',
    startKM: '',
    endKM: '',
    studentCount: '',
    attendance: '',
    fuelUsage: '',
    remarks: '',
    purpose: '',
    requestedBy: '',
    expectedEndTime: '',
  });

  const [studentForm, setStudentForm] = useState({
    name: '',
    rollNumber: '',
    year: '1st Year',
    boardingPoint: '',
    routeAssigned: '',
    busAssigned: '',
    status: 'Active',
  });

  const [studentSearch, setStudentSearch] = useState('');

  const getVehicleLabel = (v) => {
    if (!v.busNo) return v.number;
    const typeStr = v.type ? v.type : 'Bus';
    const no = v.busNo.replace(new RegExp(`^${typeStr}\\s*`, 'i'), '');
    return `${typeStr} ${no} (${v.number})`;
  };

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
      try {
        const d = await fetch(API).then(res => res.json());
        setApiData(d);
      } catch (err) { }
      reset && reset();
      onDataSaved && onDataSaved();
    } catch {
      toast$('Connection error', false);
    }
    setLoading(false);
  };

  const submitVehicle = e => {
    e.preventDefault();
    if (!vForm.number) { toast$('Select a bus', false); return; }
    post(`${API}/update-vehicle`, vForm, `${vForm.number} updated!`, () => setVForm({ number: '', status: 'Active', route: '', driver: '' }));
  };

  const submitNewVehicle = e => {
    e.preventDefault();
    if (!newVForm.busNo || !newVForm.number || !newVForm.type) { toast$('Bus No, Vehicle Plate Number and type are required', false); return; }
    post(`${API}/add-vehicle`, { ...newVForm, mileageKmpl: parseFloat(newVForm.mileageKmpl) || 0 },
      `${newVForm.type || 'Bus'} ${newVForm.busNo} (${newVForm.number}) added to fleet!`,
      () => setNewVForm({ busNo: '', number: '', type: 'Bus', status: 'Active', mileageKmpl: '', route: '', driver: '', lastFC: '', nextFC: '' }));
  };

  const handleSelectEditVehicle = (num) => {
    if (!num) {
      setEditVForm({ oldNumber: '', busNo: '', number: '', type: 'Bus', status: 'Active', mileageKmpl: '', route: '', driver: '', lastFC: '', nextFC: '' });
      return;
    }
    const v = vehicles.find(x => x.number === num);
    if (v) {
      setEditVForm({
        oldNumber: v.number,
        busNo: v.busNo || '',
        number: v.number,
        type: v.type || 'Bus',
        status: v.status || 'Active',
        mileageKmpl: v.mileageKmpl || '',
        route: v.route || '',
        driver: v.driver || '',
        lastFC: v.lastFC || '',
        nextFC: v.nextFC || ''
      });
    }
  };

  const submitEditVehicle = e => {
    e.preventDefault();
    if (!editVForm.oldNumber || !editVForm.busNo || !editVForm.number || !editVForm.type) { toast$('Please select a vehicle, and ensure Bus No, Plate Number and Type are filled', false); return; }

    // We send the oldNumber to locate the vehicle, and the new data to update it.
    // Wait, the backend endpoint I created uses req.Number to find the vehicle! If they change the plate number, it will look for the NEW plate number and fail.
    // I should change the backend to use ID or oldNumber if the plate number changes, OR they cannot edit the plate number.
    // For simplicity, let's make the plate number readonly in the edit form, or send it as is.
    post(`${API}/edit-vehicle`, { ...editVForm, mileageKmpl: parseFloat(editVForm.mileageKmpl) || 0 },
      `${editVForm.type || 'Bus'} ${editVForm.busNo} updated!`,
      () => setEditVForm({ oldNumber: '', busNo: '', number: '', type: 'Bus', status: 'Active', mileageKmpl: '', route: '', driver: '', lastFC: '', nextFC: '' }));
  };

  const submitDeleteVehicle = e => {
    e.preventDefault();
    if (!delVehicle) { toast$('Select a bus to delete', false); return; }
    post(`${API}/delete-vehicle`, { number: delVehicle }, `${delVehicle} removed from fleet!`, () => setDelVehicle(''));
  };

  const submitDriver = e => {
    e.preventDefault();
    if (!dForm.id) { toast$('Select a driver', false); return; }
    const payload = { ...dForm, id: parseInt(dForm.id) };
    post(`${API}/update-driver`, payload, 'Driver updated!', () => setDForm({ id: '', status: 'Present', morningRoute: '', morningBus: '', eveningRoute: '', eveningBus: '', specialPlace: '', specialOut: '', specialReturn: '', carOrEV: 'No' }));
  };

  const submitNewDriver = e => {
    e.preventDefault();
    if (!newDForm.name) { toast$('Driver name is required', false); return; }
    post(`${API}/add-driver`, newDForm, `${newDForm.name} added to roster!`,
      () => setNewDForm({ name: '', status: 'Present', morningRoute: '', morningBus: '', eveningRoute: '', eveningBus: '', specialPlace: '', specialOut: '', specialReturn: '', carOrEV: 'No' }));
  };

  const submitDeleteDriver = e => {
    e.preventDefault();
    if (!delDriver) { toast$('Select a driver to remove', false); return; }
    const d = drivers.find(x => x.id === parseInt(delDriver));
    post(`${API}/delete-driver`, { id: parseInt(delDriver) }, `${d?.name || 'Driver'} removed!`, () => setDelDriver(''));
  };

  const submitFuel = e => {
    e.preventDefault();
    if (!fForm.vehicle || !fForm.litres || parseFloat(fForm.litres) <= 0) { toast$('Bus & valid litres required', false); return; }
    const odometer = parseFloat(fForm.odometer) || 0;
    const prevOdometer = parseFloat(fForm.prevOdometer) || 0;
    const body = { ...fForm, litres: parseFloat(fForm.litres), odometer, prevOdometer };
    post(`${API}/add-fuel-log`, body, 'Fuel log saved! Mileage updated in dashboard.', () => setFForm({ vehicle: '', date: today(), litres: '', odometer: '', prevOdometer: '' }));
  };

  const submitTrip = e => {
    e.preventDefault();
    if (!tripForm.busNumber || !tripForm.driverName || !tripForm.routeName) {
      toast$('Bus Number, Driver, and Route Name/Place Travelled are required', false);
      return;
    }

    const start = parseFloat(tripForm.startKM) || 0;
    const end = parseFloat(tripForm.endKM) || 0;

    if (tripForm.tripType !== 'Special' && end <= start) {
      toast$('Validation Error: End KM must be greater than Start KM.', false);
      return;
    }

    if (tripForm.tripType === 'Special') {
      if (!tripForm.requestedBy || !tripForm.startTime || !tripForm.expectedEndTime) {
        toast$('Requested By, Start Time, and Expected End Time are mandatory for Special Trips', false);
        return;
      }
      if (tripForm.expectedEndTime < tripForm.startTime) {
        toast$('Expected End Time cannot be before Start Time', false);
        return;
      }
    }

    const payload = {
      ...tripForm,
      startKM: start,
      endKM: end,
      studentCount: parseInt(tripForm.studentCount) || 0,
      attendance: parseInt(tripForm.attendance) || 0,
      fuelUsage: parseFloat(tripForm.fuelUsage) || 0,
    };

    post(`${API}/add-trip`, payload, tripForm.tripType === 'Special' ? 'Special Trip submitted for approval!' : 'Trip logged successfully!', () => {
      setTripForm({
        date: today(),
        busNumber: '',
        tripType: 'Morning',
        routeName: '',
        driverName: '',
        startTime: '',
        endTime: '',
        startKM: '',
        endKM: '',
        studentCount: '',
        attendance: '',
        fuelUsage: '',
        remarks: '',
        purpose: '',
        requestedBy: '',
        expectedEndTime: '',
      });
      setDForm({ id: '', status: 'Present', morningRoute: '', morningBus: '', eveningRoute: '', eveningBus: '', specialPlace: '', specialOut: '', specialReturn: '', carOrEV: 'No' });
      setVForm({ number: '', status: 'Active', route: '', driver: '' });
    });
  };

  const deleteTrip = id => {
    post(`${API}/delete-trip`, { id }, 'Trip deleted successfully!');
  };

  const submitStudent = e => {
    e.preventDefault();
    if (!studentForm.name || !studentForm.rollNumber) {
      toast$('Student Name and Roll Number are required', false);
      return;
    }
    post(`${API}/add-student`, studentForm, `${studentForm.name} registered successfully!`, () => {
      setStudentForm({
        name: '',
        rollNumber: '',
        year: '1st Year',
        boardingPoint: '',
        routeAssigned: '',
        busAssigned: '',
        status: 'Active',
      });
    });
  };

  const deleteStudent = id => {
    post(`${API}/delete-student`, { id }, 'Student deleted successfully!');
  };

  const submitMaint = e => {
    e.preventDefault();
    if (!mForm.vehicle || !mForm.service) { toast$('Bus & service required', false); return; }
    post(`${API}/add-maintenance`, mForm, 'Maintenance record added!', () => setMForm({ vehicle: '', cost: '', service: '', status: 'Pending', date: today() }));
  };

  const updateMaintStatus = (id, status) =>
    post(`${API}/update-maintenance`, { id, status }, `Status → ${status}`);

  /* ── BUS DETAILS TAB ── */
  const renderVehicle = () => {
    const cur = vehicles.find(v => v.number === vForm.number);
    const divider = <div style={{ borderTop: '2px dashed #e2e8f0', margin: '20px 0' }} />;
    return (
      <>
        {/* Update existing */}
        <form onSubmit={submitVehicle}>
          <div style={sec}>
            <h4 style={{ margin: '0 0 14px', color: '#1e293b' }}>⚙️ Quick Status & Route Assignment</h4>
            <Grid>
              <label style={lbl}>Bus Number *
                <select style={inp} value={vForm.number} onChange={e => setVForm(f => ({ ...f, number: e.target.value }))} required>
                  <option value="">Select...</option>
                  {vehicles.map(v => <option key={v.number} value={v.number}>{getVehicleLabel(v)}</option>)}
                </select>
              </label>
              <label style={lbl}>Status
                <select style={inp} value={vForm.status} onChange={e => setVForm(f => ({ ...f, status: e.target.value }))}>
                  <option>Active</option><option>In Parking</option><option>In Town</option><option>Under Maintenance</option>
                </select>
              </label>
              <label style={lbl}>Assigned Route (Current)<input style={inp} value={vForm.route} onChange={e => setVForm(f => ({ ...f, route: e.target.value }))} placeholder={cur?.route || "e.g. Route 4B"} /></label>
              <label style={lbl}>Assigned Driver (Current)
                <select style={inp} value={vForm.driver} onChange={e => setVForm(f => ({ ...f, driver: e.target.value }))}>
                  <option value="">No Driver</option>
                  {drivers.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                </select>
              </label>
            </Grid>
          </div>
          <Btn type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save Vehicle Assignment'}</Btn>
        </form>

        {divider}

        {/* Add new vehicle */}
        <form onSubmit={submitNewVehicle}>
          <div style={sec}>
            <h4 style={{ margin: '0 0 14px', color: '#1e293b' }}>➕ Add New Bus to Fleet</h4>
            <Grid cols={3}>
              <label style={lbl}>Bus No (e.g. 1 or 2) *<input style={inp} value={newVForm.busNo} onChange={e => setNewVForm(f => ({ ...f, busNo: e.target.value }))} placeholder="e.g. 1" required /></label>
              <label style={lbl}>Vehicle Plate No (e.g. TN-29-BZ-9090) *<input style={inp} value={newVForm.number} onChange={e => setNewVForm(f => ({ ...f, number: e.target.value }))} placeholder="e.g. TN-29-BZ-9090" required /></label>
              <label style={lbl}>Type *
                <select style={inp} value={newVForm.type} onChange={e => setNewVForm(f => ({ ...f, type: e.target.value }))}>
                  <option>Bus</option><option>Van</option><option>Car</option><option>EV</option>
                </select>
              </label>
              <label style={lbl}>Status
                <select style={inp} value={newVForm.status} onChange={e => setNewVForm(f => ({ ...f, status: e.target.value }))}>
                  <option>Active</option><option>In Parking</option><option>In Town</option><option>Under Maintenance</option>
                </select>
              </label>
              <label style={lbl}>Base Mileage (kmpl)<input type="number" step="0.1" style={inp} value={newVForm.mileageKmpl} onChange={e => setNewVForm(f => ({ ...f, mileageKmpl: e.target.value }))} placeholder="e.g. 5.5" /></label>
              <label style={lbl}>Last FC Date<input type="date" style={inp} value={newVForm.lastFC} onChange={e => setNewVForm(f => ({ ...f, lastFC: e.target.value }))} /></label>
              <label style={lbl}>Next FC Date<input type="date" style={inp} value={newVForm.nextFC} onChange={e => setNewVForm(f => ({ ...f, nextFC: e.target.value }))} /></label>
            </Grid>
          </div>
          <Btn color="green" type="submit" disabled={loading}>{loading ? 'Adding…' : 'Add Bus'}</Btn>
        </form>

        {divider}

        {/* Edit existing vehicle */}
        <form onSubmit={submitEditVehicle}>
          <div style={sec}>
            <h4 style={{ margin: '0 0 14px', color: '#1e293b' }}>✏️ Edit Bus / Car Details</h4>
            <Grid>
              <label style={lbl}>Select Vehicle to Edit *
                <select style={inp} value={editVForm.oldNumber} onChange={e => handleSelectEditVehicle(e.target.value)} required>
                  <option value="">Select...</option>
                  {vehicles.map(v => <option key={v.number} value={v.number}>{getVehicleLabel(v)}</option>)}
                </select>
              </label>
            </Grid>
            {editVForm.oldNumber && (
              <div style={{ marginTop: '16px' }}>
                <Grid cols={3}>
                  <label style={lbl}>Bus No *<input style={inp} value={editVForm.busNo} onChange={e => setEditVForm(f => ({ ...f, busNo: e.target.value }))} required /></label>
                  <label style={lbl}>Vehicle Plate No (Read-Only) *<input style={inp} value={editVForm.number} disabled /></label>
                  <label style={lbl}>Type *
                    <select style={inp} value={editVForm.type} onChange={e => setEditVForm(f => ({ ...f, type: e.target.value }))}>
                      <option>Bus</option><option>Van</option><option>Car</option><option>EV</option>
                    </select>
                  </label>
                  <label style={lbl}>Status
                    <select style={inp} value={editVForm.status} onChange={e => setEditVForm(f => ({ ...f, status: e.target.value }))}>
                      <option>Active</option><option>In Parking</option><option>In Town</option><option>Under Maintenance</option>
                    </select>
                  </label>
                  <label style={lbl}>Base Mileage (kmpl)<input type="number" step="0.1" style={inp} value={editVForm.mileageKmpl} onChange={e => setEditVForm(f => ({ ...f, mileageKmpl: e.target.value }))} /></label>
                  <label style={lbl}>Last FC Date<input type="date" style={inp} value={editVForm.lastFC} onChange={e => setEditVForm(f => ({ ...f, lastFC: e.target.value }))} /></label>
                  <label style={lbl}>Next FC Date<input type="date" style={inp} value={editVForm.nextFC} onChange={e => setEditVForm(f => ({ ...f, nextFC: e.target.value }))} /></label>
                </Grid>
                <div style={{ marginTop: '16px' }}>
                  <Btn color="blue" type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save Changes'}</Btn>
                </div>
              </div>
            )}
          </div>
        </form>

        {divider}

        {/* Delete Vehicle */}
        <form onSubmit={submitDeleteVehicle}>
          <div style={{ ...sec, background: '#fff5f5', borderColor: '#fee2e2' }}>
            <h4 style={{ margin: '0 0 14px', color: '#991b1b' }}>⚠️ Retract / Delete Bus</h4>
            <Grid>
              <label style={lbl}>Select Bus to Delete *
                <select style={inp} value={delVehicle} onChange={e => setDelVehicle(e.target.value)} required>
                  <option value="">Select...</option>
                  {vehicles.map(v => <option key={v.number} value={v.number}>{getVehicleLabel(v)}</option>)}
                </select>
              </label>
            </Grid>
          </div>
          <Btn color="gray" style={{ background: '#ef4444', color: '#fff' }} type="submit" disabled={loading}>{loading ? 'Deleting…' : 'Delete Bus'}</Btn>
        </form>
      </>
    );
  };

  /* ── DRIVER TAB ── */
  const renderDriver = () => {
    const divider = <div style={{ borderTop: '2px dashed #e2e8f0', margin: '20px 0' }} />;
    return (
      <>
        {/* Update Driver */}
        <form onSubmit={submitDriver}>
          <div style={sec}>
            <h4 style={{ margin: '0 0 14px', color: '#1e293b' }}>⚙️ Quick Status & Bus Assignment</h4>
            <Grid>
              <label style={lbl}>Driver *
                <select style={inp} value={dForm.id} onChange={e => {
                  const id = e.target.value;
                  const driver = drivers.find(d => d.id == id);
                  const todayStr = new Date().toISOString().split('T')[0];
                  const todaySched = driver?.schedule?.find(s => s.date === todayStr) || {};
                  setDForm(f => ({
                    ...f,
                    id,
                    status: driver?.status || 'Present',
                    vehicleType: driver?.vehicleType || 'Bus',
                    todayBus: driver?.todayBus || '',
                    todayRoute: driver?.todayRoute || '',
                    morningRoute: todaySched.morningRoute || '',
                    morningBus: todaySched.morningBus || '',
                    eveningRoute: todaySched.eveningRoute || '',
                    eveningBus: todaySched.eveningBus || '',
                    specialPlace: todaySched.specialPlace || '',
                    specialOut: todaySched.specialOut || '',
                    specialReturn: todaySched.specialReturn || '',
                    carOrEV: todaySched.carOrEV || 'No'
                  }));
                }} required>
                  <option value="">Select...</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.status} • {d.vehicleType || 'Bus'})</option>)}
                </select>
              </label>
              <label style={lbl}>Status
                <select style={inp} value={dForm.status} onChange={e => setDForm(f => ({ ...f, status: e.target.value }))}>
                  <option>Present</option><option>Absent</option>
                </select>
              </label>
            </Grid>
            <h5 style={{ margin: '14px 0 10px', color: '#1e293b' }}>📝 Today's Detailed Schedule</h5>
            <Grid cols={3}>
              <label style={lbl}>Morning Bus No.<input style={inp} value={dForm.morningBus} onChange={e => setDForm(f => ({ ...f, morningBus: e.target.value }))} placeholder="e.g. 1 or 41" /></label>
              <label style={lbl}>Morning Route<input style={inp} value={dForm.morningRoute} onChange={e => setDForm(f => ({ ...f, morningRoute: e.target.value }))} placeholder="e.g. Route A" /></label>
              <div />
              <label style={lbl}>Evening Bus No.<input style={inp} value={dForm.eveningBus} onChange={e => setDForm(f => ({ ...f, eveningBus: e.target.value }))} placeholder="e.g. 1 or 41" /></label>
              <label style={lbl}>Evening Route<input style={inp} value={dForm.eveningRoute} onChange={e => setDForm(f => ({ ...f, eveningRoute: e.target.value }))} placeholder="e.g. Route B" /></label>
              <div />
              <label style={lbl}>Special Trip Place<input style={inp} value={dForm.specialPlace} onChange={e => setDForm(f => ({ ...f, specialPlace: e.target.value }))} placeholder="e.g. Camp" /></label>
              <label style={lbl}>Special Out Time<input type="time" style={inp} value={dForm.specialOut} onChange={e => setDForm(f => ({ ...f, specialOut: e.target.value }))} /></label>
              <label style={lbl}>Special Return Time<input type="time" style={inp} value={dForm.specialReturn} onChange={e => setDForm(f => ({ ...f, specialReturn: e.target.value }))} /></label>
              <label style={lbl}>Car or EV Assigned?
                <select style={inp} value={dForm.carOrEV} onChange={e => setDForm(f => ({ ...f, carOrEV: e.target.value }))}>
                  <option>No</option><option>Yes</option>
                </select>
              </label>
            </Grid>
          </div>
          <Btn type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save Driver Assignment'}</Btn>
        </form>

        {divider}

        {/* Add Driver */}
        <form onSubmit={submitNewDriver}>
          <div style={sec}>
            <h4 style={{ margin: '0 0 14px', color: '#1e293b' }}>➕ Add New Driver to Roster</h4>
            <Grid>
              <label style={lbl}>Driver Name *<input style={inp} value={newDForm.name} onChange={e => setNewDForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Ravi Kumar" required /></label>
              <label style={lbl}>Status
                <select style={inp} value={newDForm.status} onChange={e => setNewDForm(f => ({ ...f, status: e.target.value }))}>
                  <option>Present</option><option>Absent</option>
                </select>
              </label>
            </Grid>
            <h5 style={{ margin: '14px 0 10px', color: '#1e293b' }}>📝 Default Schedule (Optional)</h5>
            <Grid cols={3}>
              <label style={lbl}>Morning Bus No.<input style={inp} value={newDForm.morningBus} onChange={e => setNewDForm(f => ({ ...f, morningBus: e.target.value }))} placeholder="e.g. 1 or 41" /></label>
              <label style={lbl}>Morning Route<input style={inp} value={newDForm.morningRoute} onChange={e => setNewDForm(f => ({ ...f, morningRoute: e.target.value }))} placeholder="e.g. Route A" /></label>
              <div />
              <label style={lbl}>Evening Bus No.<input style={inp} value={newDForm.eveningBus} onChange={e => setNewDForm(f => ({ ...f, eveningBus: e.target.value }))} placeholder="e.g. 1 or 41" /></label>
              <label style={lbl}>Evening Route<input style={inp} value={newDForm.eveningRoute} onChange={e => setNewDForm(f => ({ ...f, eveningRoute: e.target.value }))} placeholder="e.g. Route B" /></label>
              <div />
              <label style={lbl}>Special Trip Place<input style={inp} value={newDForm.specialPlace} onChange={e => setNewDForm(f => ({ ...f, specialPlace: e.target.value }))} placeholder="e.g. Camp" /></label>
              <label style={lbl}>Special Out Time<input type="time" style={inp} value={newDForm.specialOut} onChange={e => setNewDForm(f => ({ ...f, specialOut: e.target.value }))} /></label>
              <label style={lbl}>Special Return Time<input type="time" style={inp} value={newDForm.specialReturn} onChange={e => setNewDForm(f => ({ ...f, specialReturn: e.target.value }))} /></label>
              <label style={lbl}>Car or EV Assigned?
                <select style={inp} value={newDForm.carOrEV} onChange={e => setNewDForm(f => ({ ...f, carOrEV: e.target.value }))}>
                  <option>No</option><option>Yes</option>
                </select>
              </label>
            </Grid>
          </div>
          <Btn color="green" type="submit" disabled={loading}>{loading ? 'Adding…' : 'Add Driver'}</Btn>
        </form>

        {divider}

        {/* Delete Driver */}
        <form onSubmit={submitDeleteDriver}>
          <div style={{ ...sec, background: '#fff5f5', borderColor: '#fee2e2' }}>
            <h4 style={{ margin: '0 0 14px', color: '#991b1b' }}>⚠️ Remove Driver from Roster</h4>
            <Grid>
              <label style={lbl}>Select Driver to Delete *
                <select style={inp} value={delDriver} onChange={e => setDelDriver(e.target.value)} required>
                  <option value="">Select...</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </label>
            </Grid>
          </div>
          <Btn color="gray" style={{ background: '#ef4444', color: '#fff' }} type="submit" disabled={loading}>{loading ? 'Deleting…' : 'Remove Driver'}</Btn>
        </form>
      </>
    );
  };

  /* ── FUEL TAB ── */
  const renderFuel = () => (
    <form onSubmit={submitFuel}>
      <div style={sec}>
        <h4 style={{ margin: '0 0 14px', color: '#1e293b' }}>⛽ Log Fuel Purchase</h4>
        <Grid>
          <label style={lbl}>Bus Number *
            <select style={inp} value={fForm.vehicle} onChange={e => setFForm(f => ({ ...f, vehicle: e.target.value }))} required>
              <option value="">Select...</option>
              {vehicles.map(v => <option key={v.number} value={v.number}>{getVehicleLabel(v)}</option>)}
            </select>
          </label>
          <label style={lbl}>Date *<input type="date" style={inp} value={fForm.date} max={today()} onChange={e => setFForm(f => ({ ...f, date: e.target.value }))} required /></label>
          <label style={lbl}>Litres Purchased *<input type="number" step="0.01" min="0" style={inp} value={fForm.litres} onChange={e => setFForm(f => ({ ...f, litres: e.target.value }))} placeholder="e.g. 85.50" required /></label>
          <label style={lbl}>Previous Odometer Reading<input type="number" step="0.1" min="0" style={inp} value={fForm.prevOdometer} onChange={e => setFForm(f => ({ ...f, prevOdometer: e.target.value }))} placeholder="e.g. 12800" /></label>
          <label style={lbl}>Current Odometer Reading<input type="number" step="0.1" min="0" style={inp} value={fForm.odometer} onChange={e => setFForm(f => ({ ...f, odometer: e.target.value }))} placeholder="e.g. 12900" /></label>
        </Grid>
      </div>

      {fuelLogs.length > 0 && (
        <div style={{ ...sec, marginTop: 16 }}>
          <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Recent Fuel Entries</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead><tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Bus No', 'Date', 'Litres', 'KM Driven', 'Mileage'].map(h => <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>{h}</th>)}
              </tr></thead>
              <tbody>{fuelLogs.slice(0, 6).map((f, i) => {
                const m = f.kmDriven > 0 ? (f.kmDriven / f.litres).toFixed(2) : null;
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '9px 12px', fontWeight: 700 }}>{f.vehicle}</td>
                    <td style={{ padding: '9px 12px', color: '#64748b' }}>{f.date}</td>
                    <td style={{ padding: '9px 12px', color: '#f59e0b', fontWeight: 700 }}>{f.litres} L</td>
                    <td style={{ padding: '9px 12px', color: '#1976d2', fontWeight: 700 }}>{f.kmDriven > 0 ? `${f.kmDriven} km` : '—'}</td>
                    <td style={{ padding: '9px 12px', color: m ? '#166534' : '#94a3b8', fontWeight: 700 }}>{m ? `${m} km/L` : '—'}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      )}
      <Btn color="green" type="submit" disabled={loading}>{loading ? 'Saving…' : '⛽ Add Fuel Entry'}</Btn>
    </form>
  );

  /* ── TRIP LOGS TAB ── */
  const renderDailyOps = () => {
    const handleBusChange = e => {
      const bNum = e.target.value;
      const vehicle = vehicles.find(v => v.number === bNum);
      setTripForm(f => ({
        ...f,
        busNumber: bNum,
        driverName: vehicle ? (vehicle.driver || '') : f.driverName,
        routeName: vehicle ? (vehicle.route || '') : f.routeName
      }));
    };

    return (
      <>
        <form onSubmit={submitTrip}>
          <div style={sec}>
            <h4 style={{ margin: '0 0 14px', color: '#1e293b' }}>📊 Log New Trip Details</h4>
            <Grid cols={3}>
              <label style={lbl}>Date *<input type="date" style={inp} value={tripForm.date} max={today()} onChange={e => setTripForm(f => ({ ...f, date: e.target.value }))} required /></label>
              <label style={lbl}>Bus/Car Number *
                <select style={inp} value={tripForm.busNumber} onChange={handleBusChange} required>
                  <option value="">Select Vehicle...</option>
                  {vehicles.map(v => <option key={v.number} value={v.number}>{getVehicleLabel(v)}</option>)}
                </select>
              </label>
              <label style={lbl}>Trip Type *
                <select style={inp} value={tripForm.tripType} onChange={e => setTripForm(f => ({ ...f, tripType: e.target.value }))} required>
                  <option value="Morning">Morning</option>
                  <option value="Evening">Evening</option>
                  <option value="Special">Special</option>
                </select>
              </label>
              <label style={lbl}>Driver Assigned *
                <select style={inp} value={tripForm.driverName} onChange={e => setTripForm(f => ({ ...f, driverName: e.target.value }))} required>
                  <option value="">Select Driver...</option>
                  {drivers.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                </select>
              </label>
              {tripForm.tripType === 'Special' ? (
                <>
                  <label style={lbl}>Special Trip Name / Purpose *<input style={inp} value={tripForm.purpose} onChange={e => setTripForm(f => ({ ...f, purpose: e.target.value }))} placeholder="e.g. Science Exhibition Visit" required /></label>
                  <label style={lbl}>Requested By *<input style={inp} value={tripForm.requestedBy} onChange={e => setTripForm(f => ({ ...f, requestedBy: e.target.value }))} placeholder="e.g. Principal" required /></label>
                  <label style={lbl}>Place Travelled *<input style={inp} value={tripForm.routeName} onChange={e => setTripForm(f => ({ ...f, routeName: e.target.value }))} placeholder="e.g. Science Center" required /></label>
                  <label style={lbl}>Start Date & Time *<input type="datetime-local" style={inp} value={tripForm.startTime} onChange={e => setTripForm(f => ({ ...f, startTime: e.target.value }))} required /></label>
                  <label style={lbl}>Expected End Date & Time *<input type="datetime-local" style={inp} value={tripForm.expectedEndTime} onChange={e => setTripForm(f => ({ ...f, expectedEndTime: e.target.value }))} required /></label>
                  <label style={lbl}>Start KM (Optional)<input type="number" step="0.1" style={inp} value={tripForm.startKM} onChange={e => setTripForm(f => ({ ...f, startKM: e.target.value }))} placeholder="e.g. 10450" /></label>
                  <label style={{ ...lbl, gridColumn: 'span 3' }}>Remarks<input style={inp} value={tripForm.remarks} onChange={e => setTripForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Any notes, route deviation, delays, etc." /></label>
                </>
              ) : (
                <>
                  <label style={lbl}>Route Name *<input style={inp} value={tripForm.routeName} onChange={e => setTripForm(f => ({ ...f, routeName: e.target.value }))} placeholder="e.g. Main Route" required /></label>
                  <label style={lbl}>Start Time<input type="time" style={inp} value={tripForm.startTime} onChange={e => setTripForm(f => ({ ...f, startTime: e.target.value }))} /></label>
                  <label style={lbl}>End Time<input type="time" style={inp} value={tripForm.endTime} onChange={e => setTripForm(f => ({ ...f, endTime: e.target.value }))} /></label>
                  <label style={lbl}>Start KM *<input type="number" step="0.1" style={inp} value={tripForm.startKM} onChange={e => setTripForm(f => ({ ...f, startKM: e.target.value }))} placeholder="e.g. 10450" required /></label>
                  <label style={lbl}>End KM *<input type="number" step="0.1" style={inp} value={tripForm.endKM} onChange={e => setTripForm(f => ({ ...f, endKM: e.target.value }))} placeholder="e.g. 10482" required /></label>
                  <label style={lbl}>Students Assigned<input type="number" style={inp} value={tripForm.studentCount} onChange={e => setTripForm(f => ({ ...f, studentCount: e.target.value }))} placeholder="e.g. 40" /></label>
                  <label style={lbl}>Attendance (Present)<input type="number" style={inp} value={tripForm.attendance} onChange={e => setTripForm(f => ({ ...f, attendance: e.target.value }))} placeholder="e.g. 38" /></label>
                  <label style={lbl}>Fuel Usage (Litres)<input type="number" step="0.1" style={inp} value={tripForm.fuelUsage} onChange={e => setTripForm(f => ({ ...f, fuelUsage: e.target.value }))} placeholder="e.g. 15.5" /></label>
                  <label style={{ ...lbl, gridColumn: 'span 3' }}>Remarks<input style={inp} value={tripForm.remarks} onChange={e => setTripForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Any notes, route deviation, delays, etc." /></label>
                </>
              )}
            </Grid>
          </div>
          <Btn type="submit" disabled={loading}>{loading ? 'Saving…' : '📊 Log Trip'}</Btn>
        </form>

        {trips.length > 0 && (
          <div style={{ ...sec, marginTop: 24 }}>
            <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Recent Trips Logged</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {['Date', 'Bus', 'Type', 'Route', 'Driver', 'Distance', 'Attendance', 'Fuel', 'Action'].map(h => (
                      <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trips.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '9px 12px' }}>{t.date}</td>
                      <td style={{ padding: '9px 12px', fontWeight: 700 }}>{t.busNumber}</td>
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{
                          padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700,
                          background: t.tripType === 'Morning' ? '#e0f2fe' : t.tripType === 'Evening' ? '#f3e8ff' : '#fef3c7',
                          color: t.tripType === 'Morning' ? '#0369a1' : t.tripType === 'Evening' ? '#6b21a8' : '#92400e'
                        }}>{t.tripType}</span>
                      </td>
                      <td style={{ padding: '9px 12px' }}>{t.routeName}</td>
                      <td style={{ padding: '9px 12px' }}>{t.driverName}</td>
                      <td style={{ padding: '9px 12px' }}>{t.distance ? `${t.distance.toFixed(1)} km` : '—'}</td>
                      <td style={{ padding: '9px 12px' }}>{t.attendance} / {t.studentCount} ({t.studentCount > 0 ? Math.round((t.attendance / t.studentCount) * 100) : 0}%)</td>
                      <td style={{ padding: '9px 12px' }}>{t.fuelUsage > 0 ? `${t.fuelUsage} L` : '—'}</td>
                      <td style={{ padding: '9px 12px' }}>
                        <button onClick={() => deleteTrip(t.id)} style={{ padding: '4px 8px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </>
    );
  };

  /* ── STUDENT MASTER TAB ── */
  const renderStudents = () => {
    const filteredStudents = students.filter(s =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.busAssigned && s.busAssigned.toLowerCase().includes(studentSearch.toLowerCase())) ||
      (s.routeAssigned && s.routeAssigned.toLowerCase().includes(studentSearch.toLowerCase()))
    );

    return (
      <>
        <form onSubmit={submitStudent}>
          <div style={sec}>
            <h4 style={{ margin: '0 0 14px', color: '#1e293b' }}>🎓 Register New Student</h4>
            <Grid cols={3}>
              <label style={lbl}>Student Name *<input style={inp} value={studentForm.name} onChange={e => setStudentForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Rahul Sharma" required /></label>
              <label style={lbl}>Roll Number / ID *<input style={inp} value={studentForm.rollNumber} onChange={e => setStudentForm(f => ({ ...f, rollNumber: e.target.value }))} placeholder="e.g. 23BEC1050" required /></label>
              <label style={lbl}>Year *
                <select style={inp} value={studentForm.year} onChange={e => setStudentForm(f => ({ ...f, year: e.target.value }))} required>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="PG/Research">PG/Research</option>
                </select>
              </label>
              <label style={lbl}>Boarding Point<input style={inp} value={studentForm.boardingPoint} onChange={e => setStudentForm(f => ({ ...f, boardingPoint: e.target.value }))} placeholder="e.g. City Centre Mall" /></label>
              <label style={lbl}>Route Assigned<input style={inp} value={studentForm.routeAssigned} onChange={e => setStudentForm(f => ({ ...f, routeAssigned: e.target.value }))} placeholder="e.g. Main Route" /></label>
              <label style={lbl}>Bus Assigned
                <select style={inp} value={studentForm.busAssigned} onChange={e => setStudentForm(f => ({ ...f, busAssigned: e.target.value }))}>
                  <option value="">Select Bus...</option>
                  {vehicles.map(v => <option key={v.number} value={v.number}>{getVehicleLabel(v)}</option>)}
                </select>
              </label>
              <label style={lbl}>Transport Status *
                <select style={inp} value={studentForm.status} onChange={e => setStudentForm(f => ({ ...f, status: e.target.value }))} required>
                  <option value="Active">Active</option>
                  <option value="Discontinued">Discontinued</option>
                </select>
              </label>
            </Grid>
          </div>
          <Btn type="submit" color="green" disabled={loading}>{loading ? 'Saving…' : '🎓 Add Student'}</Btn>
        </form>

        <div style={{ ...sec, marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Registered Students Master List ({filteredStudents.length})</p>
            <input
              style={{ ...inp, width: '250px', padding: '6px 12px' }}
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
              placeholder="🔍 Search name, roll no, route, bus..."
            />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Roll Number', 'Student Name', 'Year', 'Boarding Point', 'Route Assigned', 'Bus Assigned', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '9px 12px', fontWeight: 700 }}>{s.rollNumber}</td>
                    <td style={{ padding: '9px 12px' }}>{s.name}</td>
                    <td style={{ padding: '9px 12px', color: '#64748b' }}>{s.year}</td>
                    <td style={{ padding: '9px 12px' }}>{s.boardingPoint || '—'}</td>
                    <td style={{ padding: '9px 12px' }}>{s.routeAssigned || '—'}</td>
                    <td style={{ padding: '9px 12px', fontWeight: 700, color: '#1976d2' }}>{s.busAssigned || '—'}</td>
                    <td style={{ padding: '9px 12px' }}>
                      <span style={{
                        padding: '2px 6px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700,
                        background: s.status === 'Active' ? '#dcfce7' : '#fee2e2',
                        color: s.status === 'Active' ? '#15803d' : '#b91c1c'
                      }}>{s.status}</span>
                    </td>
                    <td style={{ padding: '9px 12px' }}>
                      <button onClick={() => deleteStudent(s.id)} style={{ padding: '4px 8px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}>Delete</button>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No students found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  /* ── MAINTENANCE TAB ── */
  const renderMaintenance = () => (
    <>
      <form onSubmit={submitMaint}>
        <div style={sec}>
          <h4 style={{ margin: '0 0 14px', color: '#1e293b' }}>🔧 Add Maintenance Record</h4>
          <Grid>
            <label style={lbl}>Bus Number *
              <select style={inp} value={mForm.vehicle} onChange={e => setMForm(f => ({ ...f, vehicle: e.target.value }))} required>
                <option value="">Select...</option>
                {vehicles.map(v => <option key={v.number} value={v.number}>{getVehicleLabel(v)}</option>)}
              </select>
            </label>
            <label style={lbl}>Cost (₹)<input style={inp} value={mForm.cost} onChange={e => setMForm(f => ({ ...f, cost: e.target.value }))} placeholder="e.g. ₹12,500" /></label>
            <label style={{ ...lbl, gridColumn: 'span 2' }}>Service Description *<input style={inp} value={mForm.service} onChange={e => setMForm(f => ({ ...f, service: e.target.value }))} placeholder="e.g. Brake Pad Replacement" required /></label>
            <label style={lbl}>Service Date *<input type="date" style={inp} value={mForm.date} onChange={e => setMForm(f => ({ ...f, date: e.target.value }))} required /></label>
            <label style={lbl}>Status
              <select style={inp} value={mForm.status} onChange={e => setMForm(f => ({ ...f, status: e.target.value }))}>
                <option>Pending</option><option>Completed</option>
              </select>
            </label>
          </Grid>
        </div>
        <Btn color="green" type="submit" disabled={loading}>{loading ? 'Saving…' : '🔧 Add Record'}</Btn>
      </form>

      {maintenance.length > 0 && (
        <div style={{ ...sec, marginTop: 16 }}>
          <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Maintenance Log</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead><tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Bus No', 'Service', 'Cost', 'Date', 'Status', 'Update'].map(h => <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>{h}</th>)}
              </tr></thead>
              <tbody>{maintenance.map((m, i) => (
                <tr key={m.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '9px 12px', fontWeight: 700 }}>{m.vehicle}</td>
                  <td style={{ padding: '9px 12px' }}>{m.service}</td>
                  <td style={{ padding: '9px 12px', color: '#be123c', fontWeight: 700 }}>{m.cost || '—'}</td>
                  <td style={{ padding: '9px 12px', color: '#64748b' }}>{m.date}</td>
                  <td style={{ padding: '9px 12px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, background: m.status === 'Completed' ? '#dcfce7' : '#fef3c7', color: m.status === 'Completed' ? '#166534' : '#92400e' }}>{m.status}</span>
                  </td>
                  <td style={{ padding: '9px 12px' }}>
                    <select defaultValue={m.status} onChange={e => updateMaintStatus(m.id, e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <option>Pending</option><option>Completed</option>
                    </select>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div style={{ marginTop: 32, border: '2px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', background: '#f8fafc' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1976d2,#1565c0)', padding: '18px 24px' }}>
        <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>📋 Transport Unit Data Form</h3>
        <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem' }}>Enter data for buses, drivers, fuel, trips, students and maintenance below</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', overflowX: 'auto', background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 8px' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: 'none', border: 'none', padding: '12px 16px', cursor: 'pointer',
            fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap',
            color: tab === t.key ? '#1976d2' : '#64748b',
            borderBottom: tab === t.key ? '2px solid #1976d2' : '2px solid transparent',
            transition: 'all 0.2s'
          }}>{t.label}</button>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ margin: '12px 20px 0', padding: '10px 14px', borderRadius: '8px', background: toast.ok ? '#dcfce7' : '#fee2e2', color: toast.ok ? '#166534' : '#991b1b', fontWeight: 600, fontSize: '0.85rem' }}>
          {toast.ok ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      {/* Body */}
      <div style={{ padding: '20px' }}>
        {tab === 'vehicle' && renderVehicle()}
        {tab === 'driver' && renderDriver()}
        {tab === 'fuel' && renderFuel()}
        {tab === 'dailyops' && renderDailyOps()}
        {tab === 'students' && renderStudents()}
        {tab === 'maintenance' && renderMaintenance()}
      </div>
    </div>
  );
}
