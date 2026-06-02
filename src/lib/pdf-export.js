import jsPDF from "jspdf";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { CHART_COLORS, PALETTE } from "@/lib/constants";
import { hexToRgb } from "@/lib/helpers";
import { getStatsData } from "@/lib/stats";
import { getColorForCategory } from "@/lib/format";

const SLIDE_BG = "#fff6fb";
const INK = "#4a243c";
const SOFT_INK = "#7b6574";
const PANEL = "#ffffff";
const PANEL_SOFT = "#f9edf5";
const GRID = "#ead5e2";

function rgb(hex) {
  return hexToRgb(hex);
}

function setColor(doc, method, color) {
  const c = rgb(color);
  doc[method](c.r, c.g, c.b);
}

function fillPage(doc, pageW, pageH, index) {
  setColor(doc, "setFillColor", SLIDE_BG);
  doc.rect(0, 0, pageW, pageH, "F");

  setColor(doc, "setFillColor", index % 2 ? "#eef8fb" : "#fae3ef");
  doc.circle(pageW - 24, 20, 35, "F");
  setColor(doc, "setFillColor", index % 2 ? "#fee7df" : "#e7ecff");
  doc.circle(18, pageH - 14, 30, "F");

  setColor(doc, "setTextColor", SOFT_INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("KISSWRAPPED", 14, 13);
  doc.text(String(index).padStart(2, "0"), pageW - 20, pageH - 10);
}

function fitText(doc, text, maxWidth, size) {
  doc.setFontSize(size);
  return doc.splitTextToSize(String(text), maxWidth);
}

function drawTitle(doc, title, subtitle, x, y, w) {
  setColor(doc, "setTextColor", INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text(fitText(doc, title, w, 28), x, y);

  if (!subtitle) return;
  setColor(doc, "setTextColor", SOFT_INK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(fitText(doc, subtitle, w, 11), x, y + 16);
}

function drawPill(doc, x, y, text, fill = PALETTE.accent) {
  const label = String(text).toUpperCase();
  const width = Math.max(45, label.length * 2.2 + 10);
  setColor(doc, "setFillColor", fill);
  doc.roundedRect(x, y, width, 10, 5, 5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(label, x + 5, y + 6.6);
}

function drawHeroMetric(doc, x, y, value, label, helper, color = PALETTE.accent) {
  setColor(doc, "setTextColor", color);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(44);
  doc.text(String(value), x, y);

  setColor(doc, "setTextColor", INK);
  doc.setFontSize(13);
  doc.text(String(label), x, y + 13);

  if (helper) {
    setColor(doc, "setTextColor", SOFT_INK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(fitText(doc, helper, 62, 9), x, y + 22);
  }
}

function drawMetricCard(doc, x, y, w, h, label, value, helper, color = PALETTE.accent) {
  setColor(doc, "setFillColor", PANEL);
  setColor(doc, "setDrawColor", "#eed7e3");
  doc.roundedRect(x, y, w, h, 5, 5, "FD");
  drawHeroMetric(doc, x + 7, y + 20, value, label, helper, color);
}

function drawRankList(doc, x, y, w, title, items, emptyText) {
  setColor(doc, "setTextColor", INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, x, y);

  const rows = items.filter((item) => item.value > 0).slice(0, 7);
  if (!rows.length) {
    setColor(doc, "setTextColor", SOFT_INK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(emptyText, x, y + 12);
    return;
  }

  const max = Math.max(...rows.map((item) => item.value), 1);
  rows.forEach((item, index) => {
    const rowY = y + 14 + index * 11;
    const barW = Math.max(10, ((w - 58) * item.value) / max);
    const color = CHART_COLORS[index % CHART_COLORS.length];

    setColor(doc, "setTextColor", SOFT_INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(String(index + 1), x, rowY + 4);

    setColor(doc, "setFillColor", PANEL_SOFT);
    doc.roundedRect(x + 8, rowY, w - 42, 7, 3, 3, "F");
    setColor(doc, "setFillColor", color);
    doc.roundedRect(x + 8, rowY, barW, 7, 3, 3, "F");

    setColor(doc, "setTextColor", INK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(String(item.label).slice(0, 22), x + 11, rowY + 5);
    doc.setFont("helvetica", "bold");
    doc.text(String(item.value), x + w - 18, rowY + 5);
  });
}

function drawColumnChart(doc, x, y, w, h, title, data, color = PALETTE.accent) {
  setColor(doc, "setTextColor", INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, x, y);

  const rows = data.filter((item) => item.value > 0).slice(-12);
  if (!rows.length) {
    setColor(doc, "setTextColor", SOFT_INK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("No data", x, y + 12);
    return;
  }

  const chartTop = y + 14;
  const chartBottom = y + h;
  const chartH = h - 26;
  const max = Math.max(...rows.map((item) => item.value), 1);
  const step = w / rows.length;
  const barW = Math.max(5, step - 5);

  setColor(doc, "setDrawColor", GRID);
  doc.setLineWidth(0.25);
  for (let i = 0; i < 4; i++) {
    const gy = chartTop + (chartH / 3) * i;
    doc.line(x, gy, x + w, gy);
  }

  rows.forEach((item, index) => {
    const bh = Math.max(2, (item.value / max) * chartH);
    const bx = x + index * step + (step - barW) / 2;
    setColor(doc, "setFillColor", color);
    doc.roundedRect(bx, chartBottom - bh, barW, bh, 2, 2, "F");

    setColor(doc, "setTextColor", SOFT_INK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(String(item.label).slice(-7), bx - 1, chartBottom + 6, { angle: 330 });
  });
}

function drawBubbleLegend(doc, x, y, title, items) {
  setColor(doc, "setTextColor", INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, x, y);

  items.filter((item) => item.value > 0).slice(0, 6).forEach((item, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const itemX = x + col * 64;
    const itemY = y + 15 + row * 16;
    const color = getColorForCategory(item.label) || CHART_COLORS[index % CHART_COLORS.length];

    setColor(doc, "setFillColor", color);
    doc.circle(itemX, itemY, 4, "F");
    setColor(doc, "setTextColor", INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(String(item.value), itemX + 8, itemY + 1);
    setColor(doc, "setTextColor", SOFT_INK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(String(item.label).slice(0, 18), itemX + 19, itemY + 1);
  });
}

function addSlide(doc, pageW, pageH, index, draw) {
  if (index > 1) doc.addPage();
  fillPage(doc, pageW, pageH, index);
  draw();
}

function topLabel(data) {
  return data.find((item) => item.value > 0)?.label || "-";
}

function buildWrappedCopy(t) {
  const es = t.langCode === "es";
  return {
    title: "kisswrapped",
    subtitle: es
      ? "Una presentación privada para hablar de tus estadísticas de KissRecorder."
      : "A private deck for talking through your KissRecorder statistics.",
    yearLabel: es ? "Tu recorrido en números" : "Your story in numbers",
    headline: es ? "Tu resumen ya está listo" : "Your recap is ready",
    peopleSlide: es ? "Las personas que marcaron el ritmo" : "The people who set the rhythm",
    timeSlide: es ? "Así se movió el tiempo" : "How time moved",
    profileSlide: es ? "El mapa de perfiles" : "The profile map",
    scoreSlide: es ? "Las calificaciones cuentan otra parte" : "Ratings tell another part",
    closeSlide: es ? "Fin de kisswrapped" : "End of kisswrapped",
    closeText: es
      ? "Hecho para revisar patrones, recordar momentos y contar la historia detrás de los datos."
      : "Made to review patterns, remember moments, and tell the story behind the data.",
  };
}

function buildScoreLabels(scoresByKisses, t) {
  return scoresByKisses.map((item, index) => ({
    label: index === 0 ? t.noScore : `${index} ${index === 1 ? t.kiss : t.kisses}`,
    value: item.value,
  }));
}

/**
 * Exports the statistics as a KissWrapped deck: a landscape, slide-like PDF.
 * On native platforms the file is saved to cache and shared through the system sheet.
 */
export async function exportStatsPdf(people, t) {
  const stats = getStatsData(people, t);
  const copy = buildWrappedCopy(t);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const topPersonValue = stats.mostActiveCount ? stats.mostActivePerson : "-";
  const topMonth = topLabel(stats.eventsPerMonth);
  const topYear = topLabel(stats.eventsPerYear);
  const scoresByLabel = buildScoreLabels(stats.scoresByKisses, t);

  addSlide(doc, pageW, pageH, 1, () => {
    drawPill(doc, 20, 24, copy.yearLabel);
    setColor(doc, "setTextColor", PALETTE.accentEmphasis2);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(52);
    doc.text(copy.title, 20, 66);
    setColor(doc, "setTextColor", INK);
    doc.setFontSize(24);
    doc.text(copy.headline, 21, 85);
    setColor(doc, "setTextColor", SOFT_INK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(fitText(doc, copy.subtitle, 118, 12), 22, 101);

    drawMetricCard(doc, 170, 45, 46, 55, t.peopleSaved, people.length, "", PALETTE.accent);
    drawMetricCard(doc, 222, 45, 46, 55, t.totalEvents, stats.allEvents.length, "", PALETTE.accent2);
    drawMetricCard(doc, 170, 108, 98, 48, t.topPerson, topPersonValue, `${stats.mostActiveCount} ${t.events}`, PALETTE.aqua);
  });

  addSlide(doc, pageW, pageH, 2, () => {
    drawTitle(doc, copy.peopleSlide, t.topTracked, 18, 38, 124);
    drawHeroMetric(doc, 22, 96, stats.mostActiveCount, t.topPerson, topPersonValue, PALETTE.accent);
    drawRankList(doc, 145, 38, 110, t.peopleMostEvents, stats.peopleMostEvents, t.noDataYet);
  });

  addSlide(doc, pageW, pageH, 3, () => {
    drawTitle(doc, copy.timeSlide, t.monthlyActivity, 18, 36, 122);
    drawMetricCard(doc, 22, 80, 58, 50, t.chartYear, topYear, t.yearlyTotals, PALETTE.accent2);
    drawMetricCard(doc, 88, 80, 58, 50, t.granMonth, topMonth, t.monthlyActivity, PALETTE.accent);
    drawColumnChart(doc, 156, 38, 104, 95, t.eventsPerMonth, stats.eventsPerMonth, PALETTE.accent);
    drawRankList(
      doc,
      22,
      148,
      220,
      t.multiYearPeople,
      stats.personsWithEventsInMultipleYears.map((item) => ({
        label: `${item.label} (${item.years.join(", ")})`,
        value: item.value,
      })),
      t.noMultiYearPeopleYet,
    );
  });

  addSlide(doc, pageW, pageH, 4, () => {
    drawTitle(doc, copy.profileSlide, t.statsGroupProfiles, 18, 34, 126);
    drawRankList(doc, 20, 72, 105, t.eventsByZodiac, stats.eventsByZodiac, t.noDataYet);
    drawRankList(doc, 144, 72, 105, t.eventsByActivity, stats.eventsByActivity, t.noDataYet);
    drawBubbleLegend(doc, 20, 160, t.personsByGender, stats.personsByGender);
    drawBubbleLegend(doc, 154, 160, t.eventsByGender, stats.eventsByGender);
  });

  addSlide(doc, pageW, pageH, 5, () => {
    drawTitle(doc, copy.scoreSlide, t.scoreDistributionDesc, 18, 36, 132);
    drawMetricCard(doc, 22, 82, 62, 52, t.averageScore, stats.averageScore, t.scoreOutOf, PALETTE.accent);
    drawRankList(doc, 112, 46, 105, t.scoreDistribution, scoresByLabel, t.noDataYet);
    drawBubbleLegend(doc, 22, 154, t.scoredVsUnscored, stats.scoredVsUnscored);
  });

  addSlide(doc, pageW, pageH, 6, () => {
    setColor(doc, "setTextColor", PALETTE.accentEmphasis2);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(42);
    doc.text(copy.closeSlide, 26, 78);
    setColor(doc, "setTextColor", SOFT_INK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text(fitText(doc, copy.closeText, 145, 14), 28, 98);
    drawMetricCard(doc, 198, 70, 58, 50, t.totalEvents, stats.allEvents.length, t.reportGenerated, PALETTE.accent);
  });

  const fileName = `kisswrapped-${new Date().toISOString().slice(0, 10)}.pdf`;
  const base64 = doc.output("datauristring").split(",")[1];

  await Filesystem.writeFile({
    path: fileName,
    directory: Directory.Cache,
    data: base64,
    recursive: true,
  });
  const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
  await Share.share({ files: [uri] });
  Filesystem.deleteFile({ path: fileName, directory: Directory.Cache }).catch(() => {});
}

/**
 * Saves an error log to cache and opens the system share sheet.
 * The caller is responsible for any user-visible feedback.
 */
export async function saveErrorLog(error) {
  const timestamp = new Date().toISOString();
  const content = `KissRecorder PDF Export Error\n${timestamp}\n\n${error?.message || String(error)}`;
  const fileName = `kiss-recorder-error-${timestamp.slice(0, 10)}.txt`;

  await Filesystem.writeFile({
    path: fileName,
    directory: Directory.Cache,
    data: content,
    encoding: Encoding.UTF8,
    recursive: true,
  });
  const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
  await Share.share({ files: [uri] });
  Filesystem.deleteFile({ path: fileName, directory: Directory.Cache }).catch(() => {});
}
