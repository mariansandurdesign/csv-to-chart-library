"use client";

import { useMemo, useRef, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import {
  ArrowDownToLine,
  BarChart3,
  ChartArea,
  ChartLine,
  ChartNoAxesCombined,
  ChartPie,
  Check,
  ChevronDown,
  CircleHelp,
  CircleSmall,
  Loader2,
  Radar,
  RotateCcw,
  ScatterChart,
  SlidersHorizontal,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChartPreview, ChartPoint } from "@/components/chart-preview";
import { DataTable } from "@/components/data-table";
import {
  chartTypes,
  ChartType,
  displayNumber,
  palettes,
} from "@/lib/chart-config";
import {
  CHART_ROW_LIMIT,
  Dataset,
  MAX_FILE_BYTES,
  numericColumns,
  numericValue,
  parseCsv,
  parseJson,
  parseXlsx,
  SAMPLE_CSV,
  SAMPLE_DATA,
  serializeCsv,
  summarize,
} from "@/lib/data";
import { downloadBlob, exportChart } from "@/lib/export-chart";

const icons = {
  bar: BarChart3,
  line: ChartLine,
  area: ChartArea,
  pie: ChartPie,
  donut: CircleSmall,
  scatter: ScatterChart,
  radar: Radar,
};
const sourceUrl = "https://github.com/mariansandurdesign/csv-to-chart-library";
const supportedFilePattern = /\.(csv|tsv|json|xlsx)$/i;
const supportedFileTypes =
  ".csv,.tsv,.json,.xlsx,text/csv,text/tab-separated-values,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function ChartWorkspace({
  initialType = "bar",
}: {
  initialType?: ChartType;
}) {
  const [dataset, setDataset] = useState<Dataset>(SAMPLE_DATA);
  const [history, setHistory] = useState<Dataset[]>([]);
  const [filename, setFilename] = useState("revenue.csv");
  const [inputMode, setInputMode] = useState("paste");
  const [csvDraft, setCsvDraft] = useState(SAMPLE_CSV);
  const [appliedCsv, setAppliedCsv] = useState(SAMPLE_CSV);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [type, setType] = useState<ChartType>(initialType);
  const [labelColumn, setLabelColumn] = useState("c0");
  const [xColumn, setXColumn] = useState("c1");
  const [selectedSeries, setSelectedSeries] = useState(["c1", "c2"]);
  const [title, setTitle] = useState("Revenue & expenses");
  const [subtitle, setSubtitle] = useState("January–June 2026");
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [format, setFormat] = useState<"png" | "svg">("png");
  const [scale, setScale] = useState(2);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState<{
    kind: "error" | "success";
    text: string;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const numbers = useMemo(() => numericColumns(dataset), [dataset]);
  const currentChart = chartTypes.find((chart) => chart.id === type)!;
  const palette = palettes[paletteIndex];
  const draftChanged = csvDraft !== appliedCsv;
  const isRound = type === "pie" || type === "donut";
  const isRadial = isRound || type === "radar";
  const series = dataset.columns
    .filter((column) => selectedSeries.includes(column.id))
    .slice(0, isRound ? 1 : 6);
  const rowLimit = isRadial ? 12 : CHART_ROW_LIMIT;
  const data: ChartPoint[] = dataset.rows
    .slice(0, rowLimit)
    .map((row, index) => ({
      ...Object.fromEntries(
        series.map((column) => [column.id, numericValue(row[column.id])]),
      ),
      label: row[labelColumn]?.trim() || `Row ${index + 1}`,
      x: numericValue(row[xColumn]),
    }));
  const statistics = summarize(
    dataset.rows.map((row) => numericValue(row[series[0]?.id])),
  );
  const missing = data.reduce(
    (total, row) =>
      total + series.filter((column) => row[column.id] === null).length,
    0,
  );
  let chartIssue = "";
  if (!series.length)
    chartIssue =
      "Choose a numeric column under Customize → Values to start your chart.";
  else if (
    !data.some((row) =>
      series.some((column) => typeof row[column.id] === "number"),
    )
  )
    chartIssue =
      "No numeric values to chart. Edit your cells or choose another column.";
  else if (
    isRadial &&
    data.some((row) =>
      series.some(
        (column) =>
          typeof row[column.id] === "number" && Number(row[column.id]) < 0,
      ),
    )
  )
    chartIssue =
      "This chart needs nonnegative values. Try a bar, line, area, or scatter chart for negative numbers.";
  else if (isRound && !data.some((row) => Number(row[series[0]?.id]) > 0))
    chartIssue = "A pie or donut chart needs at least one positive value.";
  else if (
    type === "scatter" &&
    !data.some(
      (row) =>
        typeof row.x === "number" &&
        series.some((column) => typeof row[column.id] === "number"),
    )
  )
    chartIssue =
      "Choose numeric X and Y columns under Customize, with values on the same rows.";
  const legend = isRound
    ? data.map((row, index) => ({
        name: String(row.label),
        color: palette.colors[index % palette.colors.length],
      }))
    : series.map((column, index) => ({
        name: column.name,
        color: palette.colors[index % palette.colors.length],
      }));

  function syncDraft(next: Dataset) {
    const csv = serializeCsv(next, false);
    setCsvDraft(csv);
    setAppliedCsv(csv);
  }
  function updateDataset(next: Dataset) {
    setHistory((previous) => [...previous.slice(-19), dataset]);
    setDataset(next);
    syncDraft(next);
  }
  function loadDataset(
    next: Dataset,
    name: string,
    csv = serializeCsv(next, false),
  ) {
    const numeric = numericColumns(next);
    setDataset(next);
    setHistory([]);
    setFilename(name);
    setLabelColumn(
      next.columns.find(
        (column) => !numeric.some((item) => item.id === column.id),
      )?.id ?? next.columns[0].id,
    );
    setXColumn(numeric[0]?.id ?? next.columns[0].id);
    setSelectedSeries(numeric.slice(0, 3).map((column) => column.id));
    setCsvDraft(csv);
    setAppliedCsv(csv);
    setNotice({
      kind: "success",
      text: `${next.rows.length.toLocaleString()} rows imported.${numeric.length ? "" : " Add numbers in the table to create a chart."}`,
    });
  }
  function applyCsv() {
    try {
      loadDataset(parseCsv(csvDraft), filename, csvDraft);
    } catch (error) {
      setNotice({
        kind: "error",
        text:
          error instanceof Error ? error.message : "Could not read this CSV.",
      });
    }
  }
  async function importFile(file?: File) {
    if (!file) return;
    if (!supportedFilePattern.test(file.name))
      return setNotice({
        kind: "error",
        text: "Please choose a .csv, .tsv, .json, or .xlsx file.",
      });
    if (file.size > MAX_FILE_BYTES)
      return setNotice({
        kind: "error",
        text: "Please choose a file smaller than 5 MB.",
      });
    setImporting(true);
    try {
      const dataset = /\.(csv|tsv)$/i.test(file.name)
        ? parseCsv(await file.text())
        : /\.json$/i.test(file.name)
          ? parseJson(await file.text())
          : await parseXlsx(file);
      loadDataset(dataset, file.name);
      setTitle(
        file.name.replace(supportedFilePattern, "").replace(/[-_]/g, " "),
      );
      setSubtitle("");
      setInputMode("table");
    } catch (error) {
      setNotice({
        kind: "error",
        text:
          error instanceof Error ? error.message : "Could not read that file.",
      });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  function resetSample() {
    loadDataset(SAMPLE_DATA, "revenue.csv", SAMPLE_CSV);
    setTitle("Revenue & expenses");
    setSubtitle("January–June 2026");
    setNotice(null);
  }
  async function downloadChart() {
    if (!chartRef.current || chartIssue || exporting) return;
    setExporting(true);
    try {
      await exportChart({
        container: chartRef.current,
        title,
        subtitle,
        legend: showLegend ? legend : [],
        format,
        scale,
      });
      setNotice({
        kind: "success",
        text: `${format.toUpperCase()} downloaded.`,
      });
    } catch (error) {
      setNotice({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "Download failed. Please try again.",
      });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className={`app-shell ${theme}`}>
      <SiteHeader theme={theme} onThemeChange={setTheme} />
      <main>
        <div className="chart-navigation" aria-label="Chart types">
          {chartTypes.map((chart) => {
            const Icon = icons[chart.id];
            return (
              <button
                key={chart.id}
                className={type === chart.id ? "selected" : ""}
                aria-pressed={type === chart.id}
                onClick={() => setType(chart.id)}
              >
                <Icon size={16} />
                <span>{chart.name}</span>
              </button>
            );
          })}
        </div>
        <section className="page-heading">
          <h1>{currentChart.name} chart</h1>
          <p>
            {currentChart.description}. Paste CSV data or upload CSV, TSV, JSON,
            or XLSX to get started.
          </p>
        </section>
        {notice && (
          <div
            className={`notice ${notice.kind}`}
            role={notice.kind === "error" ? "alert" : "status"}
          >
            <span>
              {notice.kind === "success" ? (
                <Check size={15} />
              ) : (
                <CircleHelp size={15} />
              )}
              {notice.text}
            </span>
            <button
              aria-label="Dismiss message"
              onClick={() => setNotice(null)}
            >
              <X size={14} />
            </button>
          </div>
        )}
        <div className="workspace">
          <aside className="data-column" aria-label="Data and settings">
            <input
              ref={fileRef}
              type="file"
              accept={supportedFileTypes}
              className="sr-only"
              aria-label="Upload data file"
              onChange={(event) => importFile(event.target.files?.[0])}
            />
            <Tabs value={inputMode} onValueChange={setInputMode}>
              <TabsList className="input-tabs">
                <TabsTrigger value="paste">Paste CSV</TabsTrigger>
                <TabsTrigger value="upload">Upload file</TabsTrigger>
                <TabsTrigger value="table" disabled={draftChanged}>
                  Edit table
                </TabsTrigger>
              </TabsList>
              <TabsContent value="paste">
                <label className="sr-only" htmlFor="csv-input">
                  CSV data
                </label>
                <textarea
                  id="csv-input"
                  className="csv-editor"
                  spellCheck={false}
                  value={csvDraft}
                  onChange={(event) => setCsvDraft(event.target.value)}
                />
                <div className="input-actions">
                  <span>
                    {draftChanged
                      ? "Unapplied changes"
                      : `${dataset.rows.length} rows · ${dataset.columns.length} columns`}
                  </span>
                  <div>
                    {draftChanged && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCsvDraft(appliedCsv);
                          setNotice(null);
                        }}
                      >
                        Discard
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant={draftChanged ? "default" : "outline"}
                      onClick={applyCsv}
                      disabled={!draftChanged}
                    >
                      Apply CSV
                    </Button>
                  </div>
                </div>
                {draftChanged && (
                  <p className="input-note">
                    Apply your CSV to update the chart and edit table.
                  </p>
                )}
              </TabsContent>
              <TabsContent value="upload">
                <button
                  className={`upload-zone ${dragging ? "dragging" : ""}`}
                  disabled={importing}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    if (!importing)
                      void importFile(event.dataTransfer.files[0]);
                  }}
                >
                  {importing ? (
                    <Loader2 size={24} className="spin" />
                  ) : (
                    <Upload size={24} />
                  )}
                  <strong>
                    {importing ? "Reading file…" : "Drop your data file here"}
                  </strong>
                  <span>or click to browse</span>
                  <small>CSV, TSV, JSON, or XLSX · up to 5 MB</small>
                </button>
                <p className="input-note">
                  CSV, TSV, and XLSX use the first row as column names. JSON can
                  be an array of objects or arrays.
                </p>
              </TabsContent>
              <TabsContent value="table">
                <DataTable
                  key={filename}
                  dataset={dataset}
                  onEdit={(rowIndex, column, value) =>
                    updateDataset({
                      ...dataset,
                      rows: dataset.rows.map((row, index) =>
                        index === rowIndex ? { ...row, [column]: value } : row,
                      ),
                    })
                  }
                  onAdd={() =>
                    updateDataset({
                      ...dataset,
                      rows: [
                        ...dataset.rows,
                        Object.fromEntries(
                          dataset.columns.map((column) => [column.id, ""]),
                        ),
                      ],
                    })
                  }
                  onDelete={(rowIndex) =>
                    updateDataset({
                      ...dataset,
                      rows: dataset.rows.filter(
                        (_, index) => index !== rowIndex,
                      ),
                    })
                  }
                  canUndo={history.length > 0}
                  onUndo={() => {
                    if (history.length) {
                      const previous = history[history.length - 1];
                      setDataset(previous);
                      syncDraft(previous);
                      setHistory(history.slice(0, -1));
                    }
                  }}
                  onDownload={() =>
                    downloadBlob(
                      new Blob([serializeCsv(dataset)], {
                        type: "text/csv;charset=utf-8",
                      }),
                      filename.replace(/\.(csv|tsv)$/i, "") + "-edited.csv",
                    )
                  }
                />
              </TabsContent>
            </Tabs>
            <div className="source-actions">
              <button onClick={resetSample}>
                <RotateCcw size={13} /> Reset sample
              </button>
              <span>Processed in your browser</span>
            </div>
            <details className="customize">
              <summary>
                <SlidersHorizontal size={15} />
                Customize
                <ChevronDown size={14} />
              </summary>
              <div className="settings-content">
                <div className="field">
                  <label htmlFor="chart-title">Chart title</label>
                  <Input
                    id="chart-title"
                    value={title}
                    maxLength={120}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="chart-subtitle">Subtitle</label>
                  <Input
                    id="chart-subtitle"
                    value={subtitle}
                    maxLength={180}
                    onChange={(event) => setSubtitle(event.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="field">
                  <label htmlFor="label-column">Labels</label>
                  <div className="select-wrap">
                    <select
                      id="label-column"
                      value={labelColumn}
                      onChange={(event) => setLabelColumn(event.target.value)}
                    >
                      {dataset.columns.map((column) => (
                        <option key={column.id} value={column.id}>
                          {column.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} />
                  </div>
                </div>
                {type === "scatter" && (
                  <div className="field">
                    <label htmlFor="x-column">X axis</label>
                    <div className="select-wrap">
                      <select
                        id="x-column"
                        value={xColumn}
                        onChange={(event) => setXColumn(event.target.value)}
                      >
                        {dataset.columns.map((column) => (
                          <option key={column.id} value={column.id}>
                            {column.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} />
                    </div>
                  </div>
                )}
                <div className="field">
                  <label>
                    Values{" "}
                    <span>{isRound ? "Select one" : "Up to 6 series"}</span>
                  </label>
                  <div className="series-options">
                    {dataset.columns
                      .filter(
                        (column) =>
                          numbers.some((number) => number.id === column.id) ||
                          selectedSeries.includes(column.id),
                      )
                      .map((column) => {
                        const selected = series.some(
                          (item) => item.id === column.id,
                        );
                        return (
                          <button
                            key={column.id}
                            className={selected ? "selected" : ""}
                            aria-pressed={selected}
                            onClick={() => {
                              if (isRound) setSelectedSeries([column.id]);
                              else if (selected)
                                setSelectedSeries(
                                  selectedSeries.filter(
                                    (id) => id !== column.id,
                                  ),
                                );
                              else if (selectedSeries.length < 6)
                                setSelectedSeries([
                                  ...selectedSeries,
                                  column.id,
                                ]);
                            }}
                          >
                            {selected && <Check size={12} />}
                            {column.name}
                          </button>
                        );
                      })}
                    {!numbers.length && !selectedSeries.length && (
                      <p className="input-note">
                        Add numeric values to your table first.
                      </p>
                    )}
                  </div>
                </div>
                <div className="field">
                  <label>
                    Palette <span>{palette.name}</span>
                  </label>
                  <div className="palette-options">
                    {palettes.map((option, index) => (
                      <button
                        key={option.name}
                        className={paletteIndex === index ? "selected" : ""}
                        aria-label={`${option.name} palette`}
                        aria-pressed={paletteIndex === index}
                        onClick={() => setPaletteIndex(index)}
                      >
                        {option.colors.slice(0, 3).map((color) => (
                          <span
                            key={color}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="toggle-row">
                  <label htmlFor="show-grid">Grid lines</label>
                  <Switch
                    id="show-grid"
                    checked={showGrid}
                    onCheckedChange={setShowGrid}
                  />
                </div>
                <div className="toggle-row">
                  <label htmlFor="show-legend">Legend</label>
                  <Switch
                    id="show-legend"
                    checked={showLegend}
                    onCheckedChange={setShowLegend}
                  />
                </div>
              </div>
            </details>
          </aside>
          <section className="preview-column" aria-label="Chart preview">
            <div className="preview-card">
              <div className="chart-heading">
                <h2>{title || "Untitled chart"}</h2>
                {subtitle && <p>{subtitle}</p>}
              </div>
              {showLegend && !chartIssue && (
                <div className="chart-legend">
                  {legend.map((item, index) => (
                    <span key={`${item.name}-${index}`}>
                      <i style={{ background: item.color }} />
                      {item.name}
                    </span>
                  ))}
                </div>
              )}
              <div
                className="chart-container"
                ref={chartRef}
                role="img"
                aria-label={`${type} chart: ${title}. ${data.length} rows, ${series.map((column) => column.name).join(", ")}. Values are available in the Edit table tab.`}
              >
                {chartIssue ? (
                  <div className="chart-empty">
                    <ChartNoAxesCombined size={30} />
                    <p>{chartIssue}</p>
                  </div>
                ) : (
                  <ChartPreview
                    type={type}
                    data={data}
                    series={series}
                    colors={palette.colors}
                    showGrid={showGrid}
                  />
                )}
              </div>
              <div
                className="insights"
                aria-label={`Data summary for ${series[0]?.name ?? "selected series"}, all rows`}
              >
                <div className="insight">
                  <span>{series[0]?.name ?? "Value"} total</span>
                  <strong>{displayNumber(statistics.total)}</strong>
                </div>
                <div className="insight">
                  <span>Average</span>
                  <strong>{displayNumber(statistics.average)}</strong>
                </div>
                <div className="insight">
                  <span>Highest</span>
                  <strong>{displayNumber(statistics.max)}</strong>
                </div>
              </div>
            </div>
            {(dataset.rows.length > rowLimit || missing > 0) && (
              <div className="chart-data-note">
                {dataset.rows.length > rowLimit && (
                  <span>
                    Chart and image show the first {rowLimit} rows. Summaries
                    use all {dataset.rows.length.toLocaleString()} rows.
                  </span>
                )}
                {missing > 0 && (
                  <span>
                    {missing} blank or nonnumeric value
                    {missing === 1 ? " is" : "s are"} omitted.
                  </span>
                )}
              </div>
            )}
            <div className="export-toolbar">
              <span>Watermark-free. Ready to use anywhere.</span>
              <div className="export-actions">
                <div className="select-wrap">
                  <select
                    aria-label="Image format"
                    value={format}
                    onChange={(event) =>
                      setFormat(event.target.value as "png" | "svg")
                    }
                  >
                    <option value="png">PNG</option>
                    <option value="svg">SVG</option>
                  </select>
                  <ChevronDown size={12} />
                </div>
                {format === "png" && (
                  <div className="select-wrap">
                    <select
                      aria-label="Image resolution"
                      value={scale}
                      onChange={(event) => setScale(Number(event.target.value))}
                    >
                      <option value={1}>1×</option>
                      <option value={2}>2×</option>
                      <option value={3}>3×</option>
                    </select>
                    <ChevronDown size={12} />
                  </div>
                )}
                <Button
                  onClick={downloadChart}
                  disabled={exporting || !!chartIssue}
                >
                  {exporting ? (
                    <Loader2 size={15} className="spin" />
                  ) : (
                    <ArrowDownToLine size={15} />
                  )}
                  {exporting ? "Exporting…" : "Download chart"}
                </Button>
              </div>
            </div>
          </section>
        </div>
        <footer>
          <span>Open source. No account needed.</span>
          <div>
            <Dialog>
              <DialogTrigger
                render={
                  <Button variant="ghost" size="sm" aria-label="How it works" />
                }
              >
                How it works
              </DialogTrigger>
              <DialogContent className={`help-dialog ${theme}`}>
                <DialogHeader>
                  <DialogTitle>Data in. Chart out.</DialogTitle>
                  <DialogDescription>
                    Paste, upload, or edit your data. Download the result.
                  </DialogDescription>
                </DialogHeader>
                <div className="help-copy">
                  <p>
                    Paste a CSV and click <strong>Apply CSV</strong>, or upload
                    CSV, TSV, JSON, or XLSX. Tabular files use the first row for
                    column names. JSON can be an array of objects or arrays. Up
                    to 10,000 rows, 50 columns, and 5 MB.
                  </p>
                  <p>
                    Use <strong>Edit table</strong> to change cells. Press Enter
                    or leave a cell to save it; Escape cancels. Undo reverses up
                    to 20 data changes. Editing keeps the CSV tab in sync.
                  </p>
                  <p>
                    Choose from seven charts. Open <strong>Customize</strong>{" "}
                    for titles, columns, palettes, and legend/grid settings.
                  </p>
                  <p>
                    Download a PNG at 1×–3× resolution, or a scalable SVG.
                    Images have a white background and include your title and
                    legend.
                  </p>
                  <p>
                    Everything stays in this browser tab. Refreshing clears
                    changes. Download your edited CSV from the table to keep it.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
            <a
              href={`${sourceUrl}/blob/main/LICENSE`}
              target="_blank"
              rel="noreferrer"
            >
              MIT License
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
