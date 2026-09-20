import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChartWorkspace } from "@/components/chart-workspace";
import { chartTypes } from "@/lib/chart-config";

export function generateStaticParams() {
  return chartTypes.map((chart) => ({ type: chart.id }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps<"/charts/[type]">): Promise<Metadata> {
  const { type } = await params;
  const chart = chartTypes.find((item) => item.id === type);
  return {
    title: chart
      ? `${chart.name} chart editor — Plotroom`
      : "Chart not found — Plotroom",
  };
}

export default async function ChartPage({
  params,
}: PageProps<"/charts/[type]">) {
  const { type } = await params;
  const chart = chartTypes.find((item) => item.id === type);
  if (!chart) notFound();
  return <ChartWorkspace initialType={chart.id} />;
}
