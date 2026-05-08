import * as XLSX from "xlsx";
import { idFromCell, type StudentInfo } from "@/lib/students-store";

function rowStrings(row: unknown[]): string[] {
  return row.map((c) => String(c ?? "").trim());
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
    if (patterns.some((p) => p.test(header))) return i;
  }
  return -1;
}

/**
 * 첫 시트에서 학번, 이름, 유형을 추출합니다.
 * 헤더가 없으면 A=학번, B=이름, C=유형으로 처리합니다.
 */
export function parseStudentWorkbook(buffer: Buffer): Record<string, StudentInfo> {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const name0 = wb.SheetNames[0];
  if (!name0) return {};
  const ws = wb.Sheets[name0];
  if (!ws) return {};

  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown[][];

  const map: Record<string, StudentInfo> = {};
  if (rows.length === 0) return map;

  let idCol = 0;
  let nameCol = 1;
  let typeCol = 2;
  let start = 0;

  const first = rows[0] ?? [];
  const firstStr = rowStrings(first as unknown[]);
  if (firstStr.some(Boolean) && isHeaderRow(firstStr)) {
    const idIdx = headerColIndex(firstStr, [/학번/i, /^번호$/i, /학생번호/i, /No\.?/i]);
    const nameIdx = headerColIndex(firstStr, [/이름/i, /성명/i, /학생명/i, /^name$/i]);
    const typeIdx = headerColIndex(firstStr, [/유형/i, /구분/i, /분류/i, /^type$/i, /category/i]);
    if (idIdx >= 0) idCol = idIdx;
    if (nameIdx >= 0) nameCol = nameIdx;
    if (typeIdx >= 0) typeCol = typeIdx;
    start = 1;
  }

  for (let r = start; r < rows.length; r++) {
    const row = rows[r] as unknown[];
    if (!row?.length) continue;
    const id = idFromCell(row[idCol]);
    const name = String(row[nameCol] ?? "").trim();
    const studentType = String(row[typeCol] ?? "").trim();
    if (!id || !name) continue;
    map[id] = { name, studentType };
  }

  return map;
}
