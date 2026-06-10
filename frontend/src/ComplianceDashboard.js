import React from 'react';

const COMPLIANCE_DATA = [
  { id: 1, unit: 'STP', norm: 'TNPCB / CPCB', parameter: 'BOD / COD / TSS limits', status: 'Compliant', lastInspection: '2026-04-15' },
  { id: 2, unit: 'RO Plant', norm: 'IS 10500', parameter: 'TDS / pH / Hardness', status: 'Compliant', lastInspection: '2026-05-02' },
  { id: 3, unit: 'Power House', norm: 'CEIG', parameter: 'Earthing / Safety clear.', status: 'Pending Review', lastInspection: '2025-11-10' },
  { id: 4, unit: 'Hostels', norm: 'AICTE / FSSAI', parameter: 'Room size / Hygiene', status: 'Compliant', lastInspection: '2026-01-20' },
  { id: 5, unit: 'Mess', norm: 'FSSAI', parameter: 'Food Safety / Hygiene', status: 'Warning', lastInspection: '2026-03-05' },
  { id: 6, unit: 'Medical Centre', norm: 'MCI / Local Health', parameter: 'Bio-Medical Waste', status: 'Compliant', lastInspection: '2026-04-22' },
  { id: 7, unit: 'Transport', norm: 'RTO', parameter: 'FC / Insurance / Pollution', status: 'Action Required', lastInspection: '2026-02-15' },
];

export default function ComplianceDashboard() {
  return (
    <div className="compliance-dashboard unit-detail-container">
      <h2>Compliance Dashboard</h2>
      <p style={{ color: '#607d8b', marginBottom: '24px' }}>
        Monitoring of institutional units against statutory norms (CPCB, TNPCB, AICTE, etc.)
      </p>
      
      <div className="unit-form-table-wrap">
        <table className="unit-form-table">
          <thead>
            <tr>
              <th>Unit</th>
              <th>Applicable Norms</th>
              <th>Key Parameters</th>
              <th>Status</th>
              <th>Last Inspection</th>
            </tr>
          </thead>
          <tbody>
            {COMPLIANCE_DATA.map(row => {
              let badgeColor = '#4caf50';
              let badgeBg = '#e8f5e9';
              if (row.status === 'Pending Review') {
                badgeColor = '#f57c00';
                badgeBg = '#fff3e0';
              } else if (row.status === 'Warning') {
                badgeColor = '#d32f2f';
                badgeBg = '#ffebee';
              } else if (row.status === 'Action Required') {
                badgeColor = '#c62828';
                badgeBg = '#ffcdd2';
              }
              return (
                <tr key={row.id}>
                  <td><strong>{row.unit}</strong></td>
                  <td>{row.norm}</td>
                  <td>{row.parameter}</td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      color: badgeColor,
                      backgroundColor: badgeBg
                    }}>
                      {row.status}
                    </span>
                  </td>
                  <td>{row.lastInspection}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
