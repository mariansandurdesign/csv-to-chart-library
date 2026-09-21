"use client";

import Link from "next/link";
import { GitFork, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlotroomLogo } from "@/components/plotroom-logo";

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
          <PlotroomLogo className="brand-logo" />
          <strong>Plotroom</strong>
          <span>Data to chart</span>
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
