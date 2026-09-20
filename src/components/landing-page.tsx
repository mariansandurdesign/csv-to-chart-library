"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  ChartArea,
  ChartLine,
  ChartPie,
  Check,
  ChevronDown,
  CircleSmall,
  Download,
  FileSpreadsheet,
  GitFork,
  LockKeyhole,
  PencilLine,
  Radar,
  ScatterChart,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ChartPreview } from "@/components/chart-preview";
import { chartTypes, ChartType, palettes } from "@/lib/chart-config";
import { numericValue, SAMPLE_DATA } from "@/lib/data";

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
const steps = [
  {
    icon: FileSpreadsheet,
    title: "Bring your data",
    text: "Paste a CSV, drop in a spreadsheet, JSON file, or start with our sample. Your columns are detected automatically.",
    note: "CSV, JSON & XLSX supported",
  },
  {
    icon: PencilLine,
    title: "Make it your own",
    text: "Pick a chart, edit a cell, adjust the colors. See your changes in the preview as you work.",
    note: "Seven chart types, one editor",
  },
  {
    icon: Download,
    title: "Take it anywhere",
    text: "Download a crisp PNG or a scalable SVG. Drop it straight into your slides, reports, or next project.",
    note: "No watermarks. No account.",
  },
];
const questions = [
  {
    question: "Is Plotroom free to use?",
    answer:
      "Yes. Plotroom is free and open source under the MIT license. There is no sign-up, subscription, or watermark on your downloads.",
  },
  {
    question: "What happens to my data?",
    answer:
      "Your data is processed entirely in this browser tab. It is never sent to an upload server. Refreshing clears your changes, so download your edited CSV from the table if you want to keep them.",
  },
  {
    question: "What kind of files can I use?",
    answer:
      "Use CSV, TSV, or XLSX files with column names in the first row, or JSON as an array of objects or arrays. Files can contain up to 10,000 rows and 50 columns, with a 5 MB limit. CSV separators are detected automatically.",
  },
  {
    question: "Can I edit the data after uploading?",
    answer:
      "Yes. Open the Edit table tab, change any cell, and press Enter to apply it. You can also add or delete rows, undo data changes, and download the edited CSV.",
  },
  {
    question: "What can I download?",
    answer:
      "Export PNG images at 1×, 2×, or 3× resolution, or SVG files that stay sharp at any size. Both include your title and legend on a white background. Charts show the first 100 rows, or 12 rows for pie, donut, and radar; the editor tells you when this limit applies.",
  },
];

export function LandingPage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [type, setType] = useState<ChartType>("bar");
  const round = type === "pie" || type === "donut";
  const series = SAMPLE_DATA.columns.slice(1, round ? 2 : 3);
  const data = SAMPLE_DATA.rows.map((row) => ({
    label: row.c0,
    x: numericValue(row.c1),
    c1: numericValue(row.c1),
    c2: numericValue(row.c2),
  }));
  const colors = palettes[0].colors;
  const legend = round
    ? data.map((row, index) => ({
        name: row.label,
        color: colors[index % colors.length],
      }))
    : series.map((column, index) => ({
        name: column.name,
        color: colors[index],
      }));
  return (
    <div className={`app-shell landing-page ${theme}`}>
      <SiteHeader theme={theme} onThemeChange={setTheme} />
      <main className="landing-main">
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-content">
            <div className="hero-badge">
              <span />
              Open source · Built with shadcn/ui
            </div>
            <h1 id="landing-title">
              Good data deserves
              <br />
              <em>a great chart.</em>
            </h1>
            <p>
              Turn CSV, JSON, or XLSX into something worth sharing. Choose a
              chart, edit your data, and download a beautiful image. All in your
              browser.
            </p>
            <div className="hero-actions">
              <Link href="/charts" className="landing-button primary">
                Create a chart
                <ArrowRight size={16} />
              </Link>
              <a
                href={sourceUrl}
                className="landing-button secondary"
                target="_blank"
                rel="noreferrer"
              >
                <GitFork size={16} />
                View on GitHub
              </a>
            </div>
            <div className="hero-reassurance">
              <span>
                <Check size={12} />
                Free to use
              </span>
              <span>
                <Check size={12} />
                No sign-up
              </span>
              <span>
                <Check size={12} />
                Your data stays private
              </span>
            </div>
          </div>
          <div className="landing-demo-area">
            <div className="demo-types" aria-label="Preview chart types">
              {chartTypes.map((chart) => {
                const Icon = icons[chart.id];
                return (
                  <button
                    key={chart.id}
                    aria-pressed={type === chart.id}
                    onClick={() => setType(chart.id)}
                    className={type === chart.id ? "selected" : ""}
                  >
                    <Icon size={14} />
                    {chart.name}
                  </button>
                );
              })}
            </div>
            <div className="landing-demo">
              <div className="demo-titlebar">
                <div>
                  <span className="window-dots" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span>revenue.csv</span>
                </div>
                <Link
                  href={`/charts/${type}`}
                  aria-label={`Open ${type} chart editor`}
                >
                  <span>Open editor</span>
                  <ArrowUpRight size={13} />
                </Link>
              </div>
              <div className="demo-chart-body">
                <div className="demo-chart-heading">
                  <div>
                    <h2>Revenue & expenses</h2>
                    <p>January–June 2026</p>
                  </div>
                  <span className="sample-label">Sample data</span>
                </div>
                <div className="demo-legend">
                  {legend.map((item) => (
                    <span key={item.name}>
                      <i style={{ background: item.color }} />
                      {item.name}
                    </span>
                  ))}
                </div>
                <div
                  className="demo-chart"
                  role="img"
                  aria-label={`Sample ${type} chart showing revenue and expenses from January to June`}
                >
                  <ChartPreview
                    type={type}
                    data={data}
                    series={series}
                    colors={colors}
                    showGrid
                  />
                </div>
              </div>
              <div className="demo-bottom">
                <span>
                  <LockKeyhole size={12} />
                  Rendered in your browser
                </span>
                <span>
                  Try a chart type above
                  <ArrowUpRight size={12} />
                </span>
              </div>
            </div>
          </div>
        </section>
        <section className="landing-steps" aria-labelledby="steps-title">
          <div className="landing-section-heading">
            <span className="section-eyebrow">FROM FILE TO FINISHED</span>
            <h2 id="steps-title">Three steps. That’s it.</h2>
            <p>
              No setup or design skills needed. Just your data and a few clicks.
            </p>
          </div>
          <div className="steps-grid">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article key={step.title}>
                  <div className="step-top">
                    <span>0{index + 1}</span>
                    <Icon size={20} strokeWidth={1.5} />
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                  <span className="step-note">{step.note}</span>
                </article>
              );
            })}
          </div>
        </section>
        <section className="landing-library" aria-labelledby="library-title">
          <div className="library-heading">
            <div>
              <span className="section-eyebrow">FIND YOUR PERSPECTIVE</span>
              <h2 id="library-title">A chart for every story.</h2>
              <p>
                Compare, explore, and make your numbers easier to understand.
              </p>
            </div>
            <Link href="/charts">
              Open the editor
              <ArrowRight size={15} />
            </Link>
          </div>
          <div className="chart-library-grid">
            {chartTypes.map((chart) => {
              const Icon = icons[chart.id];
              return (
                <Link
                  href={`/charts/${chart.id}`}
                  className="chart-library-link"
                  key={chart.id}
                >
                  <Icon size={24} strokeWidth={1.5} />
                  <h3>{chart.name}</h3>
                  <p>{chart.description}.</p>
                  <ArrowUpRight className="library-arrow" size={15} />
                </Link>
              );
            })}
          </div>
        </section>
        <section className="landing-faq" aria-labelledby="faq-title">
          <div>
            <span className="section-eyebrow">A FEW DETAILS</span>
            <h2 id="faq-title">
              Good questions.
              <br />
              Simple answers.
            </h2>
          </div>
          <div className="faq-list">
            {questions.map((item) => (
              <details key={item.question}>
                <summary>
                  {item.question}
                  <ChevronDown size={16} />
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="landing-last-call">
          <h2>Your next chart starts here.</h2>
          <p>Bring your data. We’ll make it easy to share.</p>
          <Link href="/charts" className="landing-button primary">
            Create your first chart
            <ArrowRight size={16} />
          </Link>
        </section>
        <footer className="landing-footer">
          <div>
            <Link className="footer-wordmark" href="/">
              Plotroom
            </Link>
            <span>Small tool. Clearer stories.</span>
          </div>
          <div>
            <Link href="/charts">Charts</Link>
            <a href={sourceUrl} target="_blank" rel="noreferrer">
              GitHub
            </a>
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
