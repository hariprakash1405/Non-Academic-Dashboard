import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Build rows for every unit form field + submitted value (blank if missing).
 */
export function buildUnitDetailRows(unitFormFields, readUnitSubmittedValues) {
  const rows = [];
  const unitNames = Object.keys(unitFormFields || {});
  unitNames.forEach((unitName) => {
    const fields = unitFormFields[unitName] || [];
    const submitted = readUnitSubmittedValues(unitName) || {};
    fields.forEach((f) => {
      const val = submitted[f.key];
      rows.push([
        unitName,
        f.parameter,
        f.description || '',
        f.frequency || '',
        f.unit || '',
        val != null && String(val).trim() !== '' ? String(val) : '',
      ]);
    });
  });
  return rows;
}

export function buildExecutivePayload({
  modules,
  getKpiBand,
  monthlyRows,
  trendRows,
  alerts,
  activeAlertUnitNames,
  readUnitSubmittedValues,
  unitFormFields,
}) {
  const dashboardRows = modules.map((m) => [
    m.name,
    String(m.kpiScore),
    getKpiBand(m.kpiScore),
    activeAlertUnitNames.includes(m.name) ? 'Yes' : 'No',
    m.details || '',
  ]);

  const monthlyBody = monthlyRows.map((r) => [
    r.label,
    String(r.energyCostLakh),
    String(r.waterKL),
    String(r.maintenanceLakh),
  ]);

  const trendBody = trendRows.map((r) => [
    r.month,
    String(r.energyCostLakh),
    String(r.waterKL),
    String(r.maintenanceLakh),
  ]);

  const alertBody = alerts.map((a) => [a.category, a.unit, a.occurredAt, a.detail]);

  const unitDetailRows = buildUnitDetailRows(unitFormFields, readUnitSubmittedValues);

  return {
    dashboardRows,
    monthlyBody,
    trendBody,
    alertBody,
    unitDetailRows,
  };
}

function stampPdf(doc, startY, title) {
  let y = startY;
  doc.setFontSize(11);
  doc.setTextColor(26, 35, 126);
  doc.text(title, 14, y);
  doc.setTextColor(0, 0, 0);
  return y + 6;
}

export function exportExecutivePdf(payload) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFontSize(15);
  doc.text('Non-Academic Services — Executive Report', 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
  doc.setTextColor(0, 0, 0);

  let y = 28;

  autoTable(doc, {
    startY: y,
    head: [['Unit name', 'KPI score', 'RAG band', 'Open alert', 'Summary line']],
    body: payload.dashboardRows,
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [26, 35, 126], textColor: 255 },
    margin: { left: 14, right: 14 },
  });
  y = doc.lastAutoTable.finalY + 10;

  if (y > 250) {
    doc.addPage();
    y = 16;
  }
  y = stampPdf(doc, y, '1. Monthly comparison (campus totals — demo)');
  autoTable(doc, {
    startY: y,
    head: [['Month', 'Energy cost (Rs Lakhs)', 'Water (KL)', 'Maintenance (Rs Lakhs)']],
    body: payload.monthlyBody,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [21, 101, 192] },
    margin: { left: 14, right: 14 },
  });
  y = doc.lastAutoTable.finalY + 10;

  if (y > 245) {
    doc.addPage();
    y = 16;
  }
  y = stampPdf(doc, y, '2. Trend analysis — last 6 months (same metrics as dashboard charts)');
  autoTable(doc, {
    startY: y,
    head: [['Month', 'Energy (Rs Lakhs)', 'Water (KL)', 'Maintenance (Rs Lakhs)']],
    body: payload.trendBody,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 137, 123] },
    margin: { left: 14, right: 14 },
  });
  y = doc.lastAutoTable.finalY + 10;

  if (y > 230) {
    doc.addPage();
    y = 16;
  }
  y = stampPdf(doc, y, '3. Critical alerts log');
  autoTable(doc, {
    startY: y,
    head: [['Category', 'Unit', 'Time', 'Detail']],
    body: payload.alertBody,
    styles: { fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 28 },
      2: { cellWidth: 28 },
      3: { cellWidth: pageW - 14 * 2 - 32 - 28 - 28 },
    },
    headStyles: { fillColor: [198, 40, 40] },
    margin: { left: 14, right: 14 },
  });
  y = doc.lastAutoTable.finalY + 10;

  if (y > 220) {
    doc.addPage();
    y = 16;
  }
  y = stampPdf(doc, y, '4. Unit data collection — all parameters (submitted values or blank)');
  autoTable(doc, {
    startY: y + 2,
    head: [['Unit', 'Parameter', 'Description', 'Frequency', 'Unit', 'Submitted value']],
    body: payload.unitDetailRows,
    styles: { fontSize: 6 },
    headStyles: { fillColor: [69, 90, 100] },
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 32 },
      2: { cellWidth: 38 },
      3: { cellWidth: 22 },
      4: { cellWidth: 18 },
      5: { cellWidth: 42 },
    },
  });

  const safeTs = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  doc.save(`NonAcademic_Executive_Report_${safeTs}.pdf`);
}

export function exportExecutiveExcel(payload) {
  const wb = XLSX.utils.book_new();

  const dashAoA = [
    ['Unit name', 'KPI score', 'RAG band', 'Open maintenance alert', 'Summary line'],
    ...payload.dashboardRows,
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dashAoA), 'Dashboard_Units');

  const monthlyAoA = [
    ['Month', 'Energy cost (Rs Lakhs)', 'Water (KL)', 'Maintenance (Rs Lakhs)'],
    ...payload.monthlyBody,
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(monthlyAoA), 'Monthly_Comparison');

  const trendAoA = [
    ['Month', 'Energy cost (Rs Lakhs)', 'Water (KL)', 'Maintenance (Rs Lakhs)'],
    ...payload.trendBody,
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(trendAoA), 'Trend_6_Months');

  const alertAoA = [['Category', 'Unit', 'Occurred at', 'Detail'], ...payload.alertBody];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(alertAoA), 'Critical_Alerts');

  const detailAoA = [
    ['Unit', 'Parameter', 'Description', 'Frequency', 'Unit of measure', 'Submitted value'],
    ...payload.unitDetailRows,
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(detailAoA), 'Unit_Data_All_Fields');

  const safeTs = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  XLSX.writeFile(wb, `NonAcademic_Executive_Report_${safeTs}.xlsx`);
}
