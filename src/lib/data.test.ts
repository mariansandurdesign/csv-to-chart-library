import { describe, expect, it } from "vitest";
import {
  MAX_COLUMNS,
  MAX_ROWS,
  numericColumns,
  numericValue,
  parseCsv,
  SAMPLE_DATA,
  serializeCsv,
  summarize,
} from "./data";

describe("CSV import", () => {
  it("parses quoted commas, embedded newlines, escaped quotes, BOM, and blank rows", () => {
    const result = parseCsv(
      '\uFEFFName,Amount\r\n"A, B",10\r\n"Two\nlines",20\r\n"Say ""hi""",30\r\n\r\n',
    );
    expect(result.rows).toEqual([
      { c0: "A, B", c1: "10" },
      { c0: "Two\nlines", c1: "20" },
      { c0: 'Say "hi"', c1: "30" },
    ]);
  });
  it.each([";", "\t", "|"])("detects %s-separated files", (delimiter) => {
    expect(
      parseCsv(`Name${delimiter}Value\nA${delimiter}1\nB${delimiter}2`).rows[1]
        .c1,
    ).toBe("2");
  });
  it("keeps duplicate, blank and prototype-like headers as safe distinct columns", () => {
    const result = parseCsv("Name,Name,Name (2),,__proto__\na,b,c,d,e");
    expect(new Set(result.columns.map((c) => c.name)).size).toBe(5);
    expect(result.rows[0]).toEqual({
      c0: "a",
      c1: "b",
      c2: "c",
      c3: "d",
      c4: "e",
    });
  });
  it("pads missing cells and rejects excess cells", () => {
    expect(parseCsv("A,B\n1").rows[0]).toEqual({ c0: "1", c1: "" });
    expect(() => parseCsv("A,B\n1,2,3")).toThrow("more cells");
  });
  it.each(["", "A,B", "\n\n", 'Name,Value\n"unterminated,2'])(
    "rejects empty or malformed input",
    (csv) => {
      expect(() => parseCsv(csv)).toThrow();
    },
  );
  it("rejects row and column limits rather than silently discarding data", () => {
    expect(() =>
      parseCsv(
        "A\n" + Array.from({ length: MAX_ROWS + 1 }, () => "1").join("\n"),
      ),
    ).toThrow("10,000");
    expect(() =>
      parseCsv(
        Array.from({ length: MAX_COLUMNS + 1 }, (_, i) => `C${i}`).join(",") +
          "\n1",
      ),
    ).toThrow("50 columns");
  });
});

describe("numeric data", () => {
  it.each([
    ["0", 0],
    [" -12.5 ", -12.5],
    ["1,234.56", 1234.56],
    ["2e3", 2000],
    [".5", 0.5],
    ["", null],
    [" ", null],
    ["NA", null],
    ["12abc", null],
    ["1,25", null],
    ["Infinity", null],
    ["0x10", null],
  ])("converts %s without manufacturing zeros", (input, expected) => {
    expect(numericValue(input as string)).toBe(expected);
  });
  it("identifies numeric columns and tolerates missing values", () => {
    expect(
      numericColumns(parseCsv("Name,A,B\nJan,10,\nFeb,20,3")).map(
        (column) => column.name,
      ),
    ).toEqual(["A", "B"]);
  });
  it("summarizes valid cells only, including zero and negative numbers", () => {
    expect(summarize([null, 0, -10, 20])).toEqual({
      count: 3,
      total: 10,
      average: 10 / 3,
      min: -10,
      max: 20,
    });
    expect(summarize([null])).toEqual({
      count: 0,
      total: null,
      average: null,
      min: null,
      max: null,
    });
  });
});

describe("CSV export", () => {
  it("round trips sample data", () => {
    expect(parseCsv(serializeCsv(SAMPLE_DATA))).toEqual(SAMPLE_DATA);
  });
  it("round trips signed numbers while escaping expressions", () => {
    const data = parseCsv("Label,Value\nA,-12.5\nB,+20\nC,-1+2");
    const result = parseCsv(serializeCsv(data));
    expect(result.rows.map((row) => row.c1)).toEqual(["-12.5", "+20", "'-1+2"]);
  });
  it("escapes formula-like strings before opening in a spreadsheet", () => {
    const csv = serializeCsv(
      parseCsv(
        'Label,Value\n"=HYPERLINK(""https://example.com"")",2\n@SUM(A1),3',
      ),
    );
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain("'@SUM");
  });
});
