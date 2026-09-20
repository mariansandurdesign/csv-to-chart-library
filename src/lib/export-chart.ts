/** Serialize the rendered SVG, keeping exports independent of DOM screenshot services. */
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportChart(options: {
  container: HTMLElement;
  title: string;
  subtitle: string;
  legend: { name: string; color: string }[];
  format: "png" | "svg";
  scale: number;
}) {
  const original = options.container.querySelector<SVGSVGElement>(
    "svg.recharts-surface",
  );
  if (!original)
    throw new Error("The chart is not ready yet. Please try again.");
  const width = original.viewBox.baseVal.width || original.clientWidth;
  const height = original.viewBox.baseVal.height || original.clientHeight;
  if (!width || !height)
    throw new Error(
      "The chart has no visible size. Open the preview and try again.",
    );
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  const legendRows = Math.ceil(options.legend.length / 3);
  const outputWidth = width + 64;
  const outputHeight = height + 145 + legendRows * 24;
  svg.setAttribute("xmlns", ns);
  svg.setAttribute("width", String(outputWidth));
  svg.setAttribute("height", String(outputHeight));
  svg.setAttribute("viewBox", `0 0 ${outputWidth} ${outputHeight}`);
  svg.setAttribute("font-family", "Arial, Helvetica, sans-serif");
  const background = document.createElementNS(ns, "rect");
  background.setAttribute("width", "100%");
  background.setAttribute("height", "100%");
  background.setAttribute("fill", "#ffffff");
  svg.append(background);
  const addText = (
    content: string,
    x: number,
    y: number,
    size: number,
    color: string,
    bold = false,
    maxWidth = outputWidth - 64,
  ) => {
    const text = document.createElementNS(ns, "text");
    text.textContent = content;
    text.setAttribute("x", String(x));
    text.setAttribute("y", String(y));
    text.setAttribute("font-size", String(size));
    text.setAttribute("fill", color);
    if (bold) text.setAttribute("font-weight", "600");
    // Keep user-entered long titles inside the export without cutting off text.
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (context) {
      context.font = `${bold ? "600 " : ""}${size}px Arial`;
      if (context.measureText(content).width > maxWidth) {
        text.setAttribute("textLength", String(maxWidth));
        text.setAttribute("lengthAdjust", "spacingAndGlyphs");
      }
    }
    svg.append(text);
  };
  addText(options.title || "Untitled chart", 32, 46, 24, "#22372c", true);
  addText(options.subtitle, 32, 73, 13, "#738077");
  const clone = original.cloneNode(true) as SVGSVGElement;
  clone.removeAttribute("style");
  clone.setAttribute("x", "32");
  clone.setAttribute("y", "100");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.setAttribute("font-size", "12");
  clone
    .querySelectorAll("[tabindex]")
    .forEach((node) => node.removeAttribute("tabindex"));
  svg.append(clone);
  options.legend.forEach((item, index) => {
    const x = 36 + (index % 3) * ((outputWidth - 72) / 3);
    const y = height + 132 + Math.floor(index / 3) * 24;
    const dot = document.createElementNS(ns, "circle");
    dot.setAttribute("cx", String(x));
    dot.setAttribute("cy", String(y - 4));
    dot.setAttribute("r", "4");
    dot.setAttribute("fill", item.color);
    svg.append(dot);
    addText(
      item.name,
      x + 12,
      y,
      12,
      "#536158",
      false,
      (outputWidth - 72) / 3 - 24,
    );
  });
  const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
    type: "image/svg+xml;charset=utf-8",
  });
  const filename =
    (options.title || "chart")
      .replace(/[^a-z0-9\-_]+/gi, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "chart";
  if (options.format === "svg") return downloadBlob(blob, `${filename}.svg`);
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(
          new Error("Could not render the image. Try an SVG download instead."),
        );
      image.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(outputWidth * options.scale);
    canvas.height = Math.ceil(outputHeight * options.scale);
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("Your browser does not support image export.");
    context.scale(options.scale, options.scale);
    context.drawImage(image, 0, 0, outputWidth, outputHeight);
    const png = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (result) =>
          result ? resolve(result) : reject(new Error("Image export failed.")),
        "image/png",
      ),
    );
    downloadBlob(png, `${filename}.png`);
  } finally {
    URL.revokeObjectURL(url);
  }
}
