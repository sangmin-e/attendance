import * as XLSX from "xlsx";
import { idFromCell, type StudentInfo } from "@/lib/students-store";

function rowStrings(row: unknown[]): string[] {
  return row.map((cell) => String(cell ?? "").trim());
}

function isHeaderRow(cells: string[]): boolean {
  const joined = cells.join(" ");
  return (
    /(학번|번호|학생번호|No\.?)/i.test(joined) &&
    /(이름|성명|학생명|name)/i.test(joined)
  );
}

function headerColIndex(headers: string[], patterns: RegExp[]): number {
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i] ?? "";
    if (patterns.some((pattern) => pattern.test(header))) return i;
  }
  return -1;
}

export function parseStudentWorkbook(buffer: Buffer): StudentInfo[] {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) return [];

  const ws = wb.Sheets[firstSheetName];
  if (!ws) return [];

  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown[][];

  const students: StudentInfo[] = [];
  if (rows.length === 0) return students;

  let idCol = 0;
  let nameCol = 1;
  let typeCol = 2;
  let start = 0;

  const firstRow = rowStrings((rows[0] ?? []) as unknown[]);
  if (firstRow.some(Boolean) && isHeaderRow(firstRow)) {
    const idIdx = headerColIndex(firstRow, [/학번/i, /^번호$/i, /학생번호/i, /No\.?/i]);
    const nameIdx = headerColIndex(firstRow, [/이름/i, /성명/i, /학생명/i, /^name$/i]);
    const typeIdx = headerColIndex(firstRow, [/유형/i, /구분/i, /분류/i, /^type$/i, /category/i]);
    if (idIdx >= 0) idCol = idIdx;
    if (nameIdx >= 0) nameCol = nameIdx;
    if (typeIdx >= 0) typeCol = typeIdx;
    start = 1;
  }

  for (let rowIndex = start; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex] as unknown[];
    if (!row?.length) continue;

    const id = idFromCell(row[idCol]);
    const name = String(row[nameCol] ?? "").trim();
    const studentType = String(row[typeCol] ?? "").trim();
    if (!id || !name) continue;

    students.push({ studentId: id, name, studentType });
  }

  return students;
}
