"use client";

import Link from "next/link";
import { ChartNoAxesCombined, GitFork, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader({
  theme,
  onThemeChange,
}: {
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
}) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="Plotroom home">
          <ChartNoAxesCombined size={23} strokeWidth={2} />
          Plotroom<span>CSV to chart</span>
        </Link>
        <nav>
          <Link className="github-link" href="/charts">
            Charts
          </Link>
          <a
            className="github-link"
            href="https://github.com/mariansandurdesign/csv-to-chart-library"
            target="_blank"
            rel="noreferrer"
          >
            <GitFork size={15} />
            GitHub
          </a>
          <Button
            variant="ghost"
            size="icon"
            aria-label={
              theme === "dark"
                ? "Switch to light theme"
                : "Switch to dark theme"
            }
            onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </Button>
        </nav>
      </div>
    </header>
  );
}
