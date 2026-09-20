import type { Metadata } from "next";
import { ChartWorkspace } from "@/components/chart-workspace";

export const metadata: Metadata = { title: "Chart editor — Plotroom" };

export default function ChartsPage() {
  return <ChartWorkspace />;
}
