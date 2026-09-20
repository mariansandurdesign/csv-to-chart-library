import Papa from "papaparse";

export type Column = { id: string; name: string };
export type DataRow = Record<string, string>;
export type Dataset = { columns: Column[]; rows: DataRow[] };
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
  const [headers, ...rows] = result.data;
  if (!headers?.length || !rows.length)
    throw new Error("Your CSV needs a header row and at least one data row.");
  if (headers.length > MAX_COLUMNS)
    throw new Error(`Please use at most ${MAX_COLUMNS} columns.`);
  if (rows.length > MAX_ROWS)
    throw new Error(`Please use at most ${MAX_ROWS.toLocaleString()} rows.`);
  const names = new Set<string>();
  const columns = headers.map((header, index) => {
    const base = header.trim() || `Column ${index + 1}`;
    let name = base;
    let suffix = 2;
    while (names.has(name)) name = `${base} (${suffix++})`;
    names.add(name);
    return { id: `c${index}`, name };
  });
  return {
    columns,
    rows: rows.map((row, index) => {
      if (row.length > columns.length)
        throw new Error(
          `Row ${index + 2} has more cells than the header. Check its separators and quotes.`,
        );
      return Object.fromEntries(
        columns.map((column, columnIndex) => [
          column.id,
          row[columnIndex] ?? "",
        ]),
      );
    }),
  };
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
