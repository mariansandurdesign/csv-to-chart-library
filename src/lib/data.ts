import Papa from "papaparse";

export type Column = { id: string; name: string };
export type DataRow = Record<string, string>;
export type Dataset = { columns: Column[]; rows: DataRow[] };
type RawCell = string | number | boolean | Date | null | undefined;
export const MAX_ROWS = 10_000;
export const MAX_COLUMNS = 50;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const CHART_ROW_LIMIT = 100;

/** Empty and nonnumeric cells stay missing, rather than silently becoming zero. */
export function numericValue(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  let normalized = value.trim();
  if (/^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(normalized)) {
    normalized = normalized.replaceAll(",", "");
  }
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(normalized))
    return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

export function numericColumns(dataset: Dataset): Column[] {
  return dataset.columns.filter((column) => {
    const nonempty = dataset.rows
      .map((row) => row[column.id])
      .filter((value) => value?.trim());
    return (
      nonempty.length > 0 &&
      nonempty.filter((value) => numericValue(value) !== null).length >=
        nonempty.length / 2
    );
  });
}

function cellToString(value: RawCell): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function uniqueColumns(headers: RawCell[]): Column[] {
  if (headers.length > MAX_COLUMNS)
    throw new Error(`Please use at most ${MAX_COLUMNS} columns.`);
  const names = new Set<string>();
  return headers.map((header, index) => {
    const base = cellToString(header).trim() || `Column ${index + 1}`;
    let name = base;
    let suffix = 2;
    while (names.has(name)) name = `${base} (${suffix++})`;
    names.add(name);
    return { id: `c${index}`, name };
  });
}

function datasetFromRows(rows: RawCell[][], source: string): Dataset {
  const nonempty = rows.filter((row) =>
    row.some((cell) => cellToString(cell).trim()),
  );
  const [headers, ...body] = nonempty;
  if (!headers?.length || !body.length)
    throw new Error(
      `Your ${source} needs a header row and at least one data row.`,
    );
  if (body.length > MAX_ROWS)
    throw new Error(`Please use at most ${MAX_ROWS.toLocaleString()} rows.`);
  const columns = uniqueColumns(headers);
  return {
    columns,
    rows: body.map((row, index) => {
      if (row.length > columns.length)
        throw new Error(
          `Row ${index + 2} has more cells than the header. Check its separators and quotes.`,
        );
      return Object.fromEntries(
        columns.map((column, columnIndex) => [
          column.id,
          cellToString(row[columnIndex]),
        ]),
      );
    }),
  };
}

export function parseCsv(text: string): Dataset {
  if (new Blob([text]).size > MAX_FILE_BYTES)
    throw new Error("Please choose a CSV smaller than 5 MB.");
  const result = Papa.parse<string[]>(text.replace(/^\uFEFF/, ""), {
    skipEmptyLines: "greedy",
    delimitersToGuess: [",", ";", "\t", "|"],
  });
  const error = result.errors.find(
    (item) => item.code !== "UndetectableDelimiter",
  );
  if (error) throw new Error(`Could not read CSV: ${error.message}`);
  return datasetFromRows(result.data, "CSV");
}

function rowsFromObjects(records: Record<string, unknown>[]): Dataset {
  if (!records.length)
    throw new Error("Your JSON needs at least one data object.");
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const record of records) {
    for (const key of Object.keys(record)) {
      if (!seen.has(key)) {
        seen.add(key);
        keys.push(key);
      }
    }
  }
  if (!keys.length) throw new Error("Your JSON needs at least one column.");
  if (records.length > MAX_ROWS)
    throw new Error(`Please use at most ${MAX_ROWS.toLocaleString()} rows.`);
  const columns = uniqueColumns(keys);
  return {
    columns,
    rows: records.map((record) =>
      Object.fromEntries(
        columns.map((column, index) => [
          column.id,
          cellToString(record[keys[index]] as RawCell),
        ]),
      ),
    ),
  };
}

function tabularJsonSource(value: unknown): unknown {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    const container = value as Record<string, unknown>;
    for (const key of ["data", "rows", "items", "records"]) {
      if (Array.isArray(container[key])) return container[key];
    }
  }
  return value;
}

export function parseJson(text: string): Dataset {
  if (new Blob([text]).size > MAX_FILE_BYTES)
    throw new Error("Please choose a JSON file smaller than 5 MB.");
  let value: unknown;
  try {
    value = JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    throw new Error("Could not read JSON: check its syntax.");
  }
  const source = tabularJsonSource(value);
  if (!Array.isArray(source))
    throw new Error("Your JSON should be an array, or an object with rows.");
  if (!source.length) throw new Error("Your JSON needs data to import.");
  if (source.every((row) => Array.isArray(row)))
    return datasetFromRows(source as RawCell[][], "JSON");
  if (
    source.every((row) => row && typeof row === "object" && !Array.isArray(row))
  )
    return rowsFromObjects(source as Record<string, unknown>[]);
  throw new Error(
    "Your JSON rows should all be objects, or all be arrays with a header row.",
  );
}

export async function parseXlsx(input: Blob | ArrayBuffer): Promise<Dataset> {
  const { readSheet } = await import("read-excel-file/browser");
  const rows = await readSheet(input);
  return datasetFromRows(rows as RawCell[][], "XLSX");
}

export function serializeCsv(dataset: Dataset, protectFormulas = true): string {
  const safeCell = (value: string) =>
    protectFormulas &&
    /^[=+\-@\t\r]/.test(value) &&
    numericValue(value) === null
      ? `'${value}`
      : value;
  return Papa.unparse({
    fields: dataset.columns.map((column) => safeCell(column.name)),
    data: dataset.rows.map((row) =>
      dataset.columns.map((column) => safeCell(row[column.id] ?? "")),
    ),
  });
}

export function summarize(values: Array<number | null>) {
  const valid = values.filter((value): value is number => value !== null);
  if (!valid.length)
    return { count: 0, total: null, average: null, min: null, max: null };
  const total = valid.reduce((sum, value) => sum + value, 0);
  return {
    count: valid.length,
    total,
    average: total / valid.length,
    min: Math.min(...valid),
    max: Math.max(...valid),
  };
}

export const SAMPLE_CSV = `Month,Revenue,Expenses
Jan,4200,2800
Feb,5800,3400
Mar,5100,3100
Apr,6700,3800
May,7200,4100
Jun,6900,3700`;

export const SAMPLE_DATA = parseCsv(SAMPLE_CSV);
