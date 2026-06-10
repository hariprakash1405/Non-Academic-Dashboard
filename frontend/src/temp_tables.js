function VRVTable({ vrvData = [] }) {
  const totalQty = vrvData.reduce((sum, item) => sum + (parseInt(item.qty) || 0), 0);
  const totalTon = vrvData.reduce((sum, item) => sum + (parseFloat(item.totTon) || 0), 0);

  return (
    <>
      <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>🏨 Guest House - VRV A/C System</h3>
      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '10px', marginBottom: '24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#dcfce7', color: '#166534', borderBottom: '2px solid #22c55e' }}>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>S.No</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Make</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Ton</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Model</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Block No</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Depart.</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Qty (Nos.)</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Total (Ton)</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Location</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {vrvData.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#f0fdf4' }}>
                <td style={{ padding: '10px 8px', fontWeight: 600 }}>{idx + 1}</td>
                <td style={{ padding: '10px 8px' }}>{row.make}</td>
                <td style={{ padding: '10px 8px' }}>{row.ton}</td>
                <td style={{ padding: '10px 8px' }}>{row.model}</td>
                <td style={{ padding: '10px 8px' }}>{row.block}</td>
                <td style={{ padding: '10px 8px' }}>{row.dept}</td>
                <td style={{ padding: '10px 8px', fontWeight: 600 }}>{row.qty}</td>
                <td style={{ padding: '10px 8px', fontWeight: 600 }}>{row.totTon}</td>
                <td style={{ padding: '10px 8px' }}>{row.loc}</td>
                <td style={{ padding: '10px 8px', color: '#64748b', fontStyle: 'italic' }}>{row.notes}</td>
              </tr>
            ))}
            <tr style={{ background: '#bfdbfe', fontWeight: 'bold' }}>
              <td colSpan="6" style={{ padding: '12px 8px', textAlign: 'center' }}>TOTAL</td>
              <td style={{ padding: '12px 8px' }}>{totalQty}</td>
              <td style={{ padding: '12px 8px' }}>{totalTon.toFixed(2)}</td>
              <td colSpan="2" style={{ padding: '12px 8px' }}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

function ColdRoomTable({ coldRoomData = [] }) {
  const totalQty = coldRoomData.reduce((sum, item) => sum + (parseInt(item.qty) || 0), 0);
  const totalTon = coldRoomData.reduce((sum, item) => sum + (parseFloat(item.totTon) || 0), 0);

  return (
    <>
      <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>❄️ COLD Room</h3>
      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '10px', marginBottom: '24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#dcfce7', color: '#166534', borderBottom: '2px solid #22c55e' }}>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>S.No</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Make</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Ton</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Model</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Block No</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Depart.</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Qty (Nos.)</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Total (Ton)</th>
              <th style={{ padding: '12px 8px', fontWeight: 700 }}>Location</th>
            </tr>
          </thead>
          <tbody>
            {coldRoomData.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#f0fdf4' }}>
                <td style={{ padding: '10px 8px', fontWeight: 600 }}>{idx + 1}</td>
                <td style={{ padding: '10px 8px' }}>{row.make}</td>
                <td style={{ padding: '10px 8px' }}>{row.ton}</td>
                <td style={{ padding: '10px 8px' }}>{row.model}</td>
                <td style={{ padding: '10px 8px' }}>{row.block}</td>
                <td style={{ padding: '10px 8px' }}>{row.dept}</td>
                <td style={{ padding: '10px 8px', fontWeight: 600 }}>{row.qty}</td>
                <td style={{ padding: '10px 8px', fontWeight: 600 }}>{row.totTon}</td>
                <td style={{ padding: '10px 8px' }}>{row.loc}</td>
              </tr>
            ))}
            <tr style={{ background: '#bfdbfe', fontWeight: 'bold' }}>
              <td colSpan="6" style={{ padding: '12px 8px', textAlign: 'center' }}>TOTAL</td>
              <td style={{ padding: '12px 8px' }}>{totalQty}</td>
              <td style={{ padding: '12px 8px' }}>{totalTon.toFixed(2)}</td>
              <td style={{ padding: '12px 8px' }}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

export { VRVTable, ColdRoomTable };
