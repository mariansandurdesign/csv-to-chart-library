export const chartTypes = [
  { id: "bar", name: "Bar", description: "Compare categories side by side" },
  { id: "line", name: "Line", description: "Follow changes over time" },
  { id: "area", name: "Area", description: "Show volume and trends" },
  { id: "pie", name: "Pie", description: "See each part of the whole" },
  {
    id: "donut",
    name: "Donut",
    description: "A little perspective on proportions",
  },
  {
    id: "scatter",
    name: "Scatter",
    description: "Find relationships between numbers",
  },
  {
    id: "radar",
    name: "Radar",
    description: "Compare across several dimensions",
  },
] as const;
export type ChartType = (typeof chartTypes)[number]["id"];
export const palettes = [
  {
    name: "Evergreen",
    colors: ["#247a59", "#8bb89a", "#d2dfb0", "#456d64", "#c6ab69", "#a1c9c4"],
  },
  {
    name: "Coast",
    colors: ["#3474c4", "#69adcc", "#b2d9e3", "#655cb5", "#9b96d3", "#d5c7e9"],
  },
  {
    name: "Sunset",
    colors: ["#d76c44", "#eda477", "#f2cf8a", "#a74f62", "#c993a1", "#dfbfab"],
  },
  {
    name: "Ink",
    colors: ["#303d48", "#697b8a", "#a3b2bd", "#4d5b67", "#8396a5", "#cbd4dc"],
  },
];
export const compactNumber = (value: number) =>
  new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
export const displayNumber = (value: number | null) =>
  value === null
    ? "—"
    : new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(value);
