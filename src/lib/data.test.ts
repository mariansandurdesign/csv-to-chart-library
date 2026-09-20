import { describe, expect, it } from "vitest";
import {
  MAX_COLUMNS,
  MAX_ROWS,
  numericColumns,
  numericValue,
  parseCsv,
  parseJson,
  parseXlsx,
  SAMPLE_DATA,
  serializeCsv,
  summarize,
} from "./data";

const workbookBase64 =
  "UEsDBBQAAAAIAIWzNF35bOZCDQEAALgCAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbK1SyU7DMBC99yssX1HtlgNCKEkPLEfgUD5gcCaJFW/yuCX5e5yUTYiWS0+j0Vs1mmIzWMP2GEl7V/K1WHGGTvlau7bkL9uH5TVnlMDVYLzDko9IfFMtiu0YkFgWOyp5l1K4kZJUhxZI+IAuI42PFlJeYysDqB5alJer1ZVU3iV0aZkmD14tGCvusIGdSex+yMihS0RDnN0euFNcySEEoxWkjMu9q38FLT9CRFbOHOp0oItM4PJYyAQez/iWPuUTRV0je4aYHsFmohyMfPOxf/W+F6d9/ujqm0YrrL3a2SwRFCJCTR1iskbMU1jQ7kf7ExVmPsl5rM/c5cv//yqURoN07lvMpp/hhZwfr3oHUEsDBBQAAAAIAIWzNF1dh/QutQAAACwBAAALAAAAX3JlbHMvLnJlbHOFz00OgjAQBeA9p2hmLwUXxhgKG2PC1uABahl+Au00bVW4vV2KMXE5mZnv5RXVomf2ROdHMgLyNAOGRlE7ml7ArbnsjsB8kKaVMxkUsKKHqkyKK84yxB8/jNaziBgvYAjBnjj3akAtfUoWTdx05LQMcXQ9t1JNske+z7IDd58GlAljG5bVrQBXtzmwZrUx+z9PXTcqPJN6aDThR8rXRZSl6zEIWGb+IjfdiaY0osBjR74pWb4BUEsDBBQAAAAIAIWzNF2ALPYkwAAAACABAAAPAAAAeGwvd29ya2Jvb2sueG1sjU87bsMwDN19CoF7I7tDURiyshQFMrc9gGrRsRCLNEj1d/sqcbJneo8g3s/tf/NivlE0MQ3Q7VowSCPHRMcBPt5fH57BaAkUw8KEA/yhwt437ofl9Ml8MlVPOsBcytpbq+OMOeiOV6T6mVhyKPWUo9VVMESdEUte7GPbPtkcEsHm0Ms9HjxNacQXHr8yUtlMBJdQanud06rgG2PcJUT9hoZCrsXfzryrY854iHUrGOlTJXKIHVjv7FXWOHtb5/8BUEsDBBQAAAAIAIWzNF050x48ywAAAK8BAAAaAAAAeGwvX3JlbHMvd29ya2Jvb2sueG1sLnJlbHOtkM2KwkAQhO8+xdD3TScelmXJxMuy4FX0AYZJ5weTmWG6/cnbOyiKguLFU1Pd9FdFlYvjOKg9Re6901BkOShy1te9azVs1v9fP6BYjKvN4B1pmIhhUc3KFQ1G0g93fWCVII41dCLhF5FtR6PhzAdy6dL4OBpJMrYYjN2alnCe598Y7xlQzZR6wKplrSEu6wLUegrJ+z3eN01v6c/b3UhOnrjgwcctd0SSoCa2JBpuK8bzKLJEBXyZZ/7JPCzTkCq9hbnoa4ISH3quTlBLAwQUAAAACACFszRdDOcC9gkBAAAQAgAADQAAAHhsL3N0eWxlcy54bWylkT1vwyAQhvf8CsTekHSoqgqToZKlzkmlrsQ+x5bgsIBEdn99D3DbeM7E3cvLcx/Iw2QNu4EPg8OK77c7zgAb1w54qfjnqX565SxEja02DqHiMwR+UBsZ4mzg2ANERgQMFe9jHN+ECE0PVoetGwHppnPe6kipv4gwetBtSI+sEc+73YuwekCuNozJzmEMrHFXjNQHV1lQMnyzmzak7LlQErWFkr9rM5z9kERRnPkIhTUYs2aRoOSoYwSPNSVsiU/zSEMhjVZI2ZePQjo739Jy7llFSu7lMhsbMOaYdvLVrdxTx/Bqaxs/2orTclOTvyFVWcJCKkki39P+8A+T2dStS2S6FP9/qX4AUEsDBBQAAAAIAIWzNF3vzURiBAEAAEECAAAYAAAAeGwvd29ya3NoZWV0cy9zaGVldDEueG1sdZHLTsMwEEX3/QrLezppiiqEHFe8ukBiw+MDTDI0Fsk4soe0/D1Og9JWTXaea50517Ja7+tKtOiDdZTJxTyRAil3haVtJj/eN1c3UgQ2VJjKEWbyF4Nc65naOf8dSkQWcQGFTJbMzS1AyEusTZi7BinefDlfG46j30JoPJriANUVpEmygtpYknomhDrEj4ZNN8XZu53wsZDUKu8OdwspOJOWKkv4xj7mNmjF+sURlwpYK+gCyP+B+yngFVukHxxBHqaQp318TcBwzkDseN42HdqmE5ueDY117cBWLxIF7WmfPr4e0kvjcjAuJ4wb/BwzdmA0Hnf3xj5eXRgVnHyQguH39R9QSwECFAAUAAAACACFszRd+WzmQg0BAAC4AgAAEwAAAAAAAAAAAAAAAAAAAAAAW0NvbnRlbnRfVHlwZXNdLnhtbFBLAQIUABQAAAAIAIWzNF1dh/QutQAAACwBAAALAAAAAAAAAAAAAAAAAD4BAABfcmVscy8ucmVsc1BLAQIUABQAAAAIAIWzNF2ALPYkwAAAACABAAAPAAAAAAAAAAAAAAAAABwCAAB4bC93b3JrYm9vay54bWxQSwECFAAUAAAACACFszRdOdMePMsAAACvAQAAGgAAAAAAAAAAAAAAAAAJAwAAeGwvX3JlbHMvd29ya2Jvb2sueG1sLnJlbHNQSwECFAAUAAAACACFszRdDOcC9gkBAAAQAgAADQAAAAAAAAAAAAAAAAAMBAAAeGwvc3R5bGVzLnhtbFBLAQIUABQAAAAIAIWzNF3vzURiBAEAAEECAAAYAAAAAAAAAAAAAAAAAEAFAAB4bC93b3Jrc2hlZXRzL3NoZWV0MS54bWxQSwUGAAAAAAYABgCAAQAAegYAAAAA";

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

describe("JSON import", () => {
  it("imports arrays of objects and preserves discovered columns", () => {
    const result = parseJson(
      JSON.stringify([
        { Month: "Jan", Revenue: 10 },
        { Month: "Feb", Revenue: 14, Expenses: 6 },
      ]),
    );
    expect(result.columns.map((column) => column.name)).toEqual([
      "Month",
      "Revenue",
      "Expenses",
    ]);
    expect(result.rows).toEqual([
      { c0: "Jan", c1: "10", c2: "" },
      { c0: "Feb", c1: "14", c2: "6" },
    ]);
  });

  it("imports arrays with a header row and nested rows containers", () => {
    const result = parseJson(
      JSON.stringify({
        rows: [
          ["Month", "Revenue"],
          ["Jan", 10],
        ],
      }),
    );
    expect(result.columns.map((column) => column.name)).toEqual([
      "Month",
      "Revenue",
    ]);
    expect(result.rows[0]).toEqual({ c0: "Jan", c1: "10" });
  });

  it("rejects mixed or malformed JSON input", () => {
    expect(() => parseJson("{")).toThrow("syntax");
    expect(() => parseJson(JSON.stringify([["A"], { A: 1 }]))).toThrow(
      "rows should all be objects",
    );
  });
});

describe("XLSX import", () => {
  it("imports the first worksheet as tabular data", async () => {
    const bytes = Uint8Array.from(Buffer.from(workbookBase64, "base64"));
    const result = await parseXlsx(bytes.buffer);
    expect(result.columns.map((column) => column.name)).toEqual([
      "Month",
      "Revenue",
      "Expenses",
    ]);
    expect(result.rows).toEqual([
      { c0: "Jan", c1: "10", c2: "4" },
      { c0: "Feb", c1: "14", c2: "6" },
    ]);
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
  it("keeps formula-like text unchanged in the internal CSV editor", () => {
    const data = parseCsv("Name,Value\n=example,10");
    expect(parseCsv(serializeCsv(data, false))).toEqual(data);
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
