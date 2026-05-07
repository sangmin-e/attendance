import * as XLSX from "xlsx";
import { idFromCell } from "@/lib/students-store";

function rowStrings(row: unknown[]): string[] {
  return row.map((c) => String(c ?? "").trim());
}

function isHeaderRow(cells: string[]): boolean {
  const j = cells.join(" ");
  return /학번|번호|학생번호|No\.?/i.test(j) && /이름|성명|학생명|name/i.test(j);
}

function headerColIndex(headers: string[], patterns: RegExp[]): number {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i] ?? "";
    if (patterns.some((p) => p.test(h))) return i;
  }
  return -1;
}

/**
 * 첫 시트에서 학번 → 이름 맵 추출.
 * 표준 형식: 1행 A열「학번」, B열「이름」 / 2행부터 학번·이름 행 (예: 10515, 이상민).
 */
export function parseStudentWorkbook(buffer: Buffer): Record<string, string> {
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

  const map: Record<string, string> = {};
  if (rows.length === 0) return map;

  let idCol = 0;
  let nameCol = 1;
  let start = 0;

  const first = rows[0] ?? [];
  const firstStr = rowStrings(first as unknown[]);
  if (firstStr.some(Boolean) && isHeaderRow(firstStr)) {
    const idIdx = headerColIndex(firstStr, [/학번/i, /^번호$/i, /학생번호/i, /No\.?/i]);
    const nmIdx = headerColIndex(firstStr, [/이름/i, /성명/i, /학생명/i, /^name$/i]);
    if (idIdx >= 0) idCol = idIdx;
    if (nmIdx >= 0) nameCol = nmIdx;
    start = 1;
  }

  for (let r = start; r < rows.length; r++) {
    const row = rows[r] as unknown[];
    if (!row?.length) continue;
    const id = idFromCell(row[idCol]);
    const name = String(row[nameCol] ?? "").trim();
    if (!id || !name) continue;
    map[id] = name;
  }

  return map;
}
