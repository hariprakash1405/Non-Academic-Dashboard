        {chillerTab === 'vrv' && (
          <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, color: '#0f172a' }}>🌀 VRV A/C Data Entry</h4>
                <button onClick={() => setVrvUnits([...vrvUnits, { make: '', ton: '', model: '', block: '', dept: '', qty: '', totTon: '', loc: '', notes: '' }])} style={{ padding: '6px 12px', background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>+ Add VRV</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto' }}>
                {vrvUnits.map((u, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(9, minmax(100px, 1fr)) 40px', gap: '8px', alignItems: 'center', background: '#fff', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                    <input type="text" placeholder="Make" value={u.make} onChange={e => { const n = [...vrvUnits]; n[i].make = e.target.value; setVrvUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    <input type="number" placeholder="Ton" value={u.ton} onChange={e => { const n = [...vrvUnits]; n[i].ton = e.target.value; setVrvUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    <input type="text" placeholder="Model" value={u.model} onChange={e => { const n = [...vrvUnits]; n[i].model = e.target.value; setVrvUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    <input type="text" placeholder="Block No" value={u.block} onChange={e => { const n = [...vrvUnits]; n[i].block = e.target.value; setVrvUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    <input type="text" placeholder="Depart." value={u.dept} onChange={e => { const n = [...vrvUnits]; n[i].dept = e.target.value; setVrvUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    <input type="number" placeholder="Qty" value={u.qty} onChange={e => { const n = [...vrvUnits]; n[i].qty = e.target.value; setVrvUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    <input type="number" placeholder="Total Ton" value={u.totTon} onChange={e => { const n = [...vrvUnits]; n[i].totTon = e.target.value; setVrvUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    <input type="text" placeholder="Location" value={u.loc} onChange={e => { const n = [...vrvUnits]; n[i].loc = e.target.value; setVrvUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    <input type="text" placeholder="Notes" value={u.notes} onChange={e => { const n = [...vrvUnits]; n[i].notes = e.target.value; setVrvUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    <button onClick={() => setVrvUnits(vrvUnits.filter((_, idx) => idx !== i))} style={{ padding: '8px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer', height: '100%' }}>✖</button>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', textAlign: 'right' }}>
                <button style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }} onClick={onSaveVrvUnits}>Save VRV Units</button>
              </div>
            </div>

            {existingVrvUnits.length > 0 && (
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, color: '#0f172a' }}>📋 Existing VRV Units</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                  {existingVrvUnits.map((u, i) => (
                    <div key={u.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(9, minmax(100px, 1fr)) 80px', gap: '8px', alignItems: 'center', background: '#fff', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                      <input type="text" placeholder="Make" value={u.make} onChange={e => { const n = [...existingVrvUnits]; n[i].make = e.target.value; setExistingVrvUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                      <input type="number" placeholder="Ton" value={u.ton} onChange={e => { const n = [...existingVrvUnits]; n[i].ton = e.target.value; setExistingVrvUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                      <input type="text" placeholder="Model" value={u.model} onChange={e => { const n = [...existingVrvUnits]; n[i].model = e.target.value; setExistingVrvUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                      <input type="text" placeholder="Block No" value={u.block} onChange={e => { const n = [...existingVrvUnits]; n[i].block = e.target.value; setExistingVrvUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                      <input type="text" placeholder="Depart." value={u.dept} onChange={e => { const n = [...existingVrvUnits]; n[i].dept = e.target.value; setExistingVrvUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                      <input type="number" placeholder="Qty" value={u.qty} onChange={e => { const n = [...existingVrvUnits]; n[i].qty = e.target.value; setExistingVrvUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                      <input type="number" placeholder="Total Ton" value={u.totTon} onChange={e => { const n = [...existingVrvUnits]; n[i].totTon = e.target.value; setExistingVrvUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                      <input type="text" placeholder="Location" value={u.loc} onChange={e => { const n = [...existingVrvUnits]; n[i].loc = e.target.value; setExistingVrvUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                      <input type="text" placeholder="Notes" value={u.notes} onChange={e => { const n = [...existingVrvUnits]; n[i].notes = e.target.value; setExistingVrvUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => handleUpdateExistingVrvUnit(u)} style={{ padding: '8px', background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '6px', cursor: 'pointer', height: '100%' }}>💾</button>
                        <button onClick={() => handleDeleteExistingVrvUnit(u.id)} style={{ padding: '8px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer', height: '100%' }}>✖</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {chillerTab === 'coldroom' && (
          <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, color: '#0f172a' }}>🧊 COLD Room Data Entry</h4>
                <button onClick={() => setColdRoomUnits([...coldRoomUnits, { make: '', ton: '', model: '', block: '', dept: '', qty: '', totTon: '', loc: '' }])} style={{ padding: '6px 12px', background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>+ Add COLD Room</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto' }}>
                {coldRoomUnits.map((u, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(100px, 1fr)) 40px', gap: '8px', alignItems: 'center', background: '#fff', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                    <input type="text" placeholder="Make" value={u.make} onChange={e => { const n = [...coldRoomUnits]; n[i].make = e.target.value; setColdRoomUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    <input type="number" placeholder="Ton" value={u.ton} onChange={e => { const n = [...coldRoomUnits]; n[i].ton = e.target.value; setColdRoomUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    <input type="text" placeholder="Model" value={u.model} onChange={e => { const n = [...coldRoomUnits]; n[i].model = e.target.value; setColdRoomUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    <input type="text" placeholder="Block No" value={u.block} onChange={e => { const n = [...coldRoomUnits]; n[i].block = e.target.value; setColdRoomUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    <input type="text" placeholder="Depart." value={u.dept} onChange={e => { const n = [...coldRoomUnits]; n[i].dept = e.target.value; setColdRoomUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    <input type="number" placeholder="Qty" value={u.qty} onChange={e => { const n = [...coldRoomUnits]; n[i].qty = e.target.value; setColdRoomUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    <input type="number" placeholder="Total Ton" value={u.totTon} onChange={e => { const n = [...coldRoomUnits]; n[i].totTon = e.target.value; setColdRoomUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    <input type="text" placeholder="Location" value={u.loc} onChange={e => { const n = [...coldRoomUnits]; n[i].loc = e.target.value; setColdRoomUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    <button onClick={() => setColdRoomUnits(coldRoomUnits.filter((_, idx) => idx !== i))} style={{ padding: '8px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer', height: '100%' }}>✖</button>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', textAlign: 'right' }}>
                <button style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }} onClick={onSaveColdRoomUnits}>Save COLD Room Units</button>
              </div>
            </div>

            {existingColdRoomUnits.length > 0 && (
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, color: '#0f172a' }}>📋 Existing COLD Room Units</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                  {existingColdRoomUnits.map((u, i) => (
                    <div key={u.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(100px, 1fr)) 80px', gap: '8px', alignItems: 'center', background: '#fff', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                      <input type="text" placeholder="Make" value={u.make} onChange={e => { const n = [...existingColdRoomUnits]; n[i].make = e.target.value; setExistingColdRoomUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                      <input type="number" placeholder="Ton" value={u.ton} onChange={e => { const n = [...existingColdRoomUnits]; n[i].ton = e.target.value; setExistingColdRoomUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                      <input type="text" placeholder="Model" value={u.model} onChange={e => { const n = [...existingColdRoomUnits]; n[i].model = e.target.value; setExistingColdRoomUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                      <input type="text" placeholder="Block No" value={u.block} onChange={e => { const n = [...existingColdRoomUnits]; n[i].block = e.target.value; setExistingColdRoomUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                      <input type="text" placeholder="Depart." value={u.dept} onChange={e => { const n = [...existingColdRoomUnits]; n[i].dept = e.target.value; setExistingColdRoomUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                      <input type="number" placeholder="Qty" value={u.qty} onChange={e => { const n = [...existingColdRoomUnits]; n[i].qty = e.target.value; setExistingColdRoomUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                      <input type="number" placeholder="Total Ton" value={u.totTon} onChange={e => { const n = [...existingColdRoomUnits]; n[i].totTon = e.target.value; setExistingColdRoomUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                      <input type="text" placeholder="Location" value={u.loc} onChange={e => { const n = [...existingColdRoomUnits]; n[i].loc = e.target.value; setExistingColdRoomUnits(n); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => handleUpdateExistingColdRoomUnit(u)} style={{ padding: '8px', background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '6px', cursor: 'pointer', height: '100%' }}>💾</button>
                        <button onClick={() => handleDeleteExistingColdRoomUnit(u.id)} style={{ padding: '8px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer', height: '100%' }}>✖</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
