import jsPDF from "jspdf";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { CHART_COLORS, PALETTE } from "@/lib/constants";
import { isNativePlatform } from "@/lib/device-storage";
import { hexToRgb } from "@/lib/helpers";
import { getStatsData } from "@/lib/stats";
import { getColorForCategory } from "@/lib/format";

/**
 * Draws a window-style container used as the main card on each PDF page.
 * It also delegates the inner content rendering through the body callback.
 */
function drawWindowCard(doc, x, y, w, h, title, bodyFn) {
  // Build the card and line colors from the shared palette.
  const cardRgb = hexToRgb("#f5edf7");
  const lineRgb = hexToRgb(PALETTE.accentEmphasis2);

  // Paint the rounded card background.
  doc.setFillColor(cardRgb.r, cardRgb.g, cardRgb.b);
  doc.roundedRect(x, y, w, h, 8, 8, "F");

  // Draw the header separator line.
  doc.setDrawColor(lineRgb.r, lineRgb.g, lineRgb.b);
  doc.setLineWidth(0.6);
  doc.line(x, y + 12, x + w, y + 12);

  // Draw the decorative circles at the top-left of the card.
  const pink = hexToRgb(PALETTE.accent);
  const lilac = hexToRgb(PALETTE.emphasisEnd);
  const sky = hexToRgb(PALETTE.accent2);

  doc.setFillColor(pink.r, pink.g, pink.b);
  doc.circle(x + 8, y + 6, 1.6, "F");

  doc.setFillColor(lilac.r, lilac.g, lilac.b);
  doc.circle(x + 14, y + 6, 1.6, "F");

  doc.setFillColor(sky.r, sky.g, sky.b);
  doc.circle(x + 20, y + 6, 1.6, "F");

  // Render the card title.
  doc.setTextColor(lineRgb.r, lineRgb.g, lineRgb.b);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, x + 12, y + 28);

  // Let the caller draw the inner content inside the safe content area.
  bodyFn?.(doc, x + 12, y + 38, w - 24, h - 50);
}

/**
 * Draws a compact metric block with label, value, and optional helper text.
 * This is used for summary KPIs across the PDF pages.
 */
function drawMetric(doc, x, y, w, h, label, value, helper) {
  // Resolve the colors used in the metric block.
  const fill = hexToRgb("#fff7fb");
  const line = hexToRgb("#ecd6e0");
  const text = hexToRgb(PALETTE.text);
  const soft = hexToRgb(PALETTE.textSoft);

  // Draw the metric container.
  doc.setFillColor(fill.r, fill.g, fill.b);
  doc.setDrawColor(line.r, line.g, line.b);
  doc.roundedRect(x, y, w, h, 5, 5, "FD");

  // Render the top label.
  doc.setTextColor(soft.r, soft.g, soft.b);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(label, x + 6, y + 10);

  // Render the main metric value.
  doc.setTextColor(text.r, text.g, text.b);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text(String(value), x + 6, y + 24);

  // Render helper text only when available.
  if (helper) {
    doc.setTextColor(soft.r, soft.g, soft.b);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(helper, x + 6, y + 34);
  }
}

/**
 * Draws a simple bar chart directly into the PDF canvas.
 * The chart is intentionally lightweight to keep output stable and predictable.
 */
function drawSimpleBarChart(
  doc,
  x,
  y,
  w,
  h,
  title,
  data,
  color = PALETTE.accent,
  rotateLabels = false,
) {
  // Resolve chart colors once to keep the drawing code cleaner.
  const text = hexToRgb(PALETTE.text);
  const soft = hexToRgb(PALETTE.textSoft);
  const grid = hexToRgb("#eadbe4");
  const bar = hexToRgb(color);

  // Render the chart title first.
  doc.setTextColor(text.r, text.g, text.b);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, x, y);

  // Stop early when there is no data to draw.
  if (!data.length) {
    doc.setTextColor(soft.r, soft.g, soft.b);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("No data", x, y + 12);
    return;
  }

  // Compute chart dimensions and scaling values.
  const chartTop = y + 10;
  const chartHeight = h - 28;
  const chartBottom = chartTop + chartHeight;
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.max(8, (w - 12) / data.length - 4);

  // Draw horizontal guide lines to make values easier to read.
  doc.setDrawColor(grid.r, grid.g, grid.b);
  for (let i = 0; i <= 4; i++) {
    const gy = chartTop + (chartHeight / 4) * i;
    doc.line(x, gy, x + w, gy);
  }

  // Draw every bar using the normalized scale against the max value.
  data.forEach((item, index) => {
    const bx = x + 4 + index * ((w - 8) / data.length);
    const bh = (item.value / maxValue) * (chartHeight - 10);

    doc.setFillColor(bar.r, bar.g, bar.b);
    doc.roundedRect(bx, chartBottom - bh, barWidth, bh, 2, 2, "F");

    // Draw the label below the bar and rotate it when requested.
    doc.setTextColor(soft.r, soft.g, soft.b);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    const label = String(item.label).slice(0, 12);
    if (rotateLabels) {
      doc.text(label, bx + 1, chartBottom + 8, { angle: 320 });
    } else {
      doc.text(label, bx, chartBottom + 6);
    }
  });
}

/**
 * Draws a simple legend list with colored bullets and text labels.
 * It is useful for categorical summaries that do not need full charts.
 */
function drawLegendList(doc, x, y, items) {
  // Use shared text color for all legend labels.
  const text = hexToRgb(PALETTE.text);

  items.forEach((item, index) => {
    // Prefer category-specific colors and fall back to the chart palette.
    const color =
      getColorForCategory(item.label) ||
      CHART_COLORS[index % CHART_COLORS.length];
    const rgb = hexToRgb(color);
    const rowY = y + index * 8;

    // Draw the colored bullet.
    doc.setFillColor(rgb.r, rgb.g, rgb.b);
    doc.circle(x, rowY, 1.5, "F");

    // Draw the label and numeric value next to the bullet.
    doc.setTextColor(text.r, text.g, text.b);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`${item.label}: ${item.value}`, x + 4, rowY + 1);
  });
}

/**
 * Paints the shared decorative background for a PDF page.
 * This keeps every page visually consistent across the report.
 */
function paintBackground(doc, pageW, pageH) {
  // Prepare the layered background colors.
  const bg1 = hexToRgb(PALETTE.accentMuted);
  const bg2 = hexToRgb("#f6ecfb");
  const bg3 = hexToRgb(PALETTE.gradientEnd);

  // Fill the full-page background.
  doc.setFillColor(bg1.r, bg1.g, bg1.b);
  doc.rect(0, 0, pageW, pageH, "F");

  // Add the inner rounded panel.
  doc.setFillColor(bg2.r, bg2.g, bg2.b);
  doc.roundedRect(10, 10, pageW - 20, pageH - 20, 10, 10, "F");

  // Add subtle decorative circles with low opacity.
  doc.setFillColor(bg3.r, bg3.g, bg3.b);
  doc.setGState?.(new doc.GState({ opacity: 0.08 }));
  doc.circle(pageW - 25, 20, 18, "F");
  doc.circle(22, pageH - 20, 16, "F");

  // Restore default opacity when supported by the environment.
  if (doc.setGState) {
    doc.setGState(new doc.GState({ opacity: 1 }));
  }
}

/**
 * Exports the statistics report as a multi-page PDF.
 * On native platforms the file is saved to Documents, and on web it is downloaded.
 */
export async function exportStatsPdf(people, t) {
  // Build all derived statistics once to reuse them across the report.
  const stats = getStatsData(people, t);

  // Create the PDF document and cache page dimensions.
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Draw the cover page with the most important summary metrics.
  paintBackground(doc, pageW, pageH);
  drawWindowCard(
    doc,
    24,
    24,
    pageW - 48,
    pageH - 48,
    t.appTitle,
    (pdf, x, y) => {
      // Use stronger contrast for the cover title and softer text for the subtitle.
      const text = hexToRgb(PALETTE.accentEmphasis2);
      const soft = hexToRgb(PALETTE.textSoft);

      pdf.setTextColor(text.r, text.g, text.b);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(30);
      pdf.text(t.pdfReady, x + 10, y + 25);

      pdf.setTextColor(soft.r, soft.g, soft.b);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.text(t.reportGenerated, x + 10, y + 40);

      // Render headline metrics for people, events, and top person.
      drawMetric(pdf, x + 8, y + 75, 48, 34, t.peopleSaved, people.length, "");
      drawMetric(
        pdf,
        x + 62,
        y + 75,
        48,
        34,
        t.totalEvents,
        stats.allEvents.length,
        "",
      );
      drawMetric(
        pdf,
        x + 116,
        y + 75,
        48,
        34,
        t.topPerson,
        stats.mostActiveCount,
        stats.mostActivePerson,
      );
    },
  );

  // Add the overview page with aggregate metrics and top tracked people.
  doc.addPage();
  paintBackground(doc, pageW, pageH);
  drawWindowCard(
    doc,
    16,
    16,
    pageW - 32,
    pageH - 32,
    t.overview,
    (pdf, x, y, w) => {
      drawMetric(
        pdf,
        x,
        y,
        50,
        34,
        t.avgEvents,
        stats.averageEventsPerPerson,
        t.acrossAll,
      );
      drawMetric(
        pdf,
        x + 56,
        y,
        50,
        34,
        t.averageScore,
        stats.averageScore,
        t.scores,
      );
      drawMetric(
        pdf,
        x + 112,
        y,
        50,
        34,
        t.topPerson,
        stats.mostActiveCount,
        stats.mostActivePerson,
      );

      // Show the people with the highest number of events.
      drawSimpleBarChart(
        pdf,
        x,
        y + 52,
        w,
        120,
        t.peopleMostEvents,
        stats.peopleMostEvents,
        PALETTE.accent,
        true,
      );
    },
  );

  // Add the time page with monthly, yearly, and multi-year activity.
  doc.addPage();
  paintBackground(doc, pageW, pageH);
  drawWindowCard(
    doc,
    16,
    16,
    pageW - 32,
    pageH - 32,
    t.time,
    (pdf, x, y, w) => {
      drawSimpleBarChart(
        pdf,
        x,
        y,
        w,
        72,
        t.eventsPerMonth,
        stats.eventsPerMonth,
        PALETTE.accent,
        true,
      );
      drawSimpleBarChart(
        pdf,
        x,
        y + 84,
        w,
        56,
        t.eventsPerYear,
        stats.eventsPerYear,
        PALETTE.accent2,
        false,
      );

      // Add the list of people whose events span multiple years.
      const text = hexToRgb(PALETTE.text);
      pdf.setTextColor(text.r, text.g, text.b);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.text(t.multiYearPeople, x, y + 150);

      drawLegendList(
        pdf,
        x + 2,
        y + 160,
        stats.personsWithEventsInMultipleYears.slice(0, 8).map((item) => ({
          label: `${item.label} (${item.years.join(", ")})`,
          value: item.value,
        })),
      );
    },
  );

  // Add the people page with zodiac, activity, and gender summaries.
  doc.addPage();
  paintBackground(doc, pageW, pageH);
  drawWindowCard(
    doc,
    16,
    16,
    pageW - 32,
    pageH - 32,
    t.peopleStats,
    (pdf, x, y, w) => {
      drawSimpleBarChart(
        pdf,
        x,
        y,
        w,
        58,
        t.eventsByZodiac,
        stats.eventsByZodiac,
        PALETTE.accent,
        true,
      );
      drawSimpleBarChart(
        pdf,
        x,
        y + 70,
        w,
        52,
        t.eventsByActivity,
        stats.eventsByActivity,
        PALETTE.aqua,
        true,
      );

      // Split the lower area into two legend-based summaries by gender.
      const text = hexToRgb(PALETTE.text);
      pdf.setTextColor(text.r, text.g, text.b);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.text(t.personsByGender, x, y + 136);
      drawLegendList(pdf, x + 2, y + 146, stats.personsByGender);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.text(t.eventsByGender, x + 82, y + 136);
      drawLegendList(pdf, x + 84, y + 146, stats.eventsByGender);
    },
  );

  // Add the scores page with scoring distribution and event-count buckets.
  doc.addPage();
  paintBackground(doc, pageW, pageH);
  drawWindowCard(
    doc,
    16,
    16,
    pageW - 32,
    pageH - 32,
    t.scores,
    (pdf, x, y, w) => {
      drawSimpleBarChart(
        pdf,
        x,
        y,
        w,
        64,
        t.scoreDistribution,
        stats.scoresByKisses.filter((d) => d.value > 0),
        PALETTE.accent,
        true,
      );
      drawSimpleBarChart(
        pdf,
        x,
        y + 78,
        w,
        58,
        t.eventsByPersonCount,
        stats.numberOfEventsByNumberOfPersons,
        PALETTE.accent2,
        false,
      );

      // Add a final legend comparing scored and unscored events.
      const text = hexToRgb(PALETTE.text);
      pdf.setTextColor(text.r, text.g, text.b);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.text(t.scoreDistributionDesc, x, y + 150);
      drawLegendList(pdf, x + 2, y + 160, stats.scoredVsUnscored);
    },
  );

  // Build a date-based file name to make exports easy to identify.
  const fileName = `kiss-recorder-stats-2-${new Date().toISOString().slice(0, 10)}.pdf`;

  // Save to the native Documents directory when running on device.
  if (isNativePlatform()) {
    const base64 = doc.output("datauristring").split(",")[1];

    await Filesystem.writeFile({
      path: fileName,
      directory: Directory.External,
      data: base64,
      recursive: true,
    });
    return;
  }

  // Fall back to the browser download flow on web.
  doc.save(fileName);
}

/**
 * Saves an error log to Documents (native) or triggers a text file download (web).
 * No feedback is shown after saving — the caller is responsible for any UI.
 */
export async function saveErrorLog(error) {
  const timestamp = new Date().toISOString();
  const content = `KissRecorder PDF Export Error\n${timestamp}\n\n${error?.message || String(error)}`;
  const fileName = `kiss-recorder-error-${timestamp.slice(0, 10)}.txt`;

  if (isNativePlatform()) {
    await Filesystem.writeFile({
      path: fileName,
      directory: Directory.External,
      data: content,
      encoding: Encoding.UTF8,
      recursive: true,
    });
    return;
  }

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}