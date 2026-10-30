/**
 * Export the Follow-up Summary sheet into the public dashboard's JSON format.
 * The script reads only summary figures; it never exports the individual follow-up log.
 */
function main(workbook: ExcelScript.Workbook): string {
  const sheets = workbook.getWorksheets();
  const sheet = sheets.find(item => item.getName() === "Follow-up Summary") ?? sheets.find(item => item.getName() === "Summary");
  if (!sheet) throw new Error("Could not find the 'Follow-up Summary' or 'Summary' sheet.");
  const used = sheet.getUsedRange();
  if (!used) throw new Error("The summary sheet is empty.");
  const values = used.getValues();
  const texts = used.getTexts();
  const firstRow = used.getRowIndex();
  const firstCol = used.getColumnIndex();
  const norm = (value: unknown) => String(value ?? "").trim().toLowerCase();
  let headerRow = -1;
  let columns: { [key: string]: number } = {};
  for (let r = 0; r < values.length; r++) {
    const labels = values[r].map(norm);
    const person = labels.findIndex(v => v.includes("salesperson"));
    if (person < 0) continue;
    headerRow = r;
    columns = {
      person,
      entries: labels.findIndex(v => v.includes("entries")),
      open: labels.findIndex(v => v.includes("open") || v.includes("planned") || v.includes("progress")),
      awaiting: labels.findIndex(v => v.includes("awaiting")),
      closed: labels.findIndex(v => v.includes("closed") || v.includes("done")),
      sales: labels.findIndex(v => v.includes("sales value") || v.includes("sales amount"))
    };
    break;
  }
  if (headerRow < 0 || columns.sales < 0) throw new Error("Could not find the salesperson header and Sales value column.");

  const salespeople: { name: string; entries: number; open: number; awaiting: number; closed: number; sales: number }[] = [];
  const totals = { sales: 0, entries: 0, open: 0, awaiting: 0, closed: 0, target: 0 };
  let sourceSalesTotal: number | null = null;
  let dateFrom = "";
  let dateTo = "";
  const num = (row: (string | number | boolean)[], col: number) => col < 0 ? 0 : Number(row[col]) || 0;

  for (let r = 0; r < values.length; r++) {
    const rowText = texts[r].map(norm);
    const label = norm(values[r][columns.person >= 0 ? columns.person : 0]);
    if (rowText.includes("from")) {
      const c = rowText.indexOf("from"); dateFrom = String(texts[r][c + 1] ?? "").trim();
    }
    if (rowText.includes("to")) {
      const c = rowText.indexOf("to"); dateTo = String(texts[r][c + 1] ?? "").trim();
    }
    if (r <= headerRow) continue;
    if (label.includes("target")) { totals.target = num(values[r], columns.sales); continue; }
    if (label.includes("orders till") || label.includes("total sales")) { sourceSalesTotal = num(values[r], columns.sales); continue; }
    if (!label || label.includes("total")) continue;
    const entriesCol = columns.entries;
    const record = {
      name: String(values[r][columns.person] ?? "").trim(),
      entries: num(values[r], entriesCol),
      open: num(values[r], columns.open),
      awaiting: num(values[r], columns.awaiting),
      closed: num(values[r], columns.closed),
      sales: num(values[r], columns.sales)
    };
    if (record.name) {
      salespeople.push(record);
      totals.entries += record.entries; totals.open += record.open;
      totals.awaiting += record.awaiting; totals.closed += record.closed; totals.sales += record.sales;
    }
  }
  if (!salespeople.length) throw new Error("No salesperson rows were found under the summary headers.");
  if (sourceSalesTotal !== null) totals.sales = sourceSalesTotal;
  return JSON.stringify({ updatedAt: new Date().toISOString(), dateRange: { from: dateFrom, to: dateTo }, totals, salespeople });
}