// Returns true if the date string (yyyy.MM.dd) is strictly after today
export function isFutureDate(value) {
  if (!isValidDateString(value)) return false;
  return value > todayString();
}

// Validates date string format yyyy.MM.dd and checks if it is a real date
export function isValidDateString(value) {
  if (!/^\d{4}\.\d{2}\.\d{2}$/.test(value)) return false;

  const [y, m, d] = value.split(".").map(Number);
  const date = new Date(y, m - 1, d);

  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
}

// Returns today's date formatted as yyyy.MM.dd
export function todayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  
  return `${y}.${m}.${day}`;
}

// Converts yyyy.MM.dd to dd/MM/yyyy for display
export function formatDisplayDate(value) {
  if (!isValidDateString(value)) return value || "—";

  const [y, m, d] = value.split(".");

  return `${d}/${m}/${y}`;
}

// Converts yyyy.MM.dd to a short human date with abbreviated month, e.g. "15 Jan 2024"
export function formatShortDate(value, language = "en") {
  if (!isValidDateString(value)) return value || "—";
  const [y, mo, d] = value.split(".").map(Number);
  return new Intl.DateTimeFormat(language === "es" ? "es-ES" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(y, mo - 1, d));
}

// Extracts month key in format yyyy-MM from valid date
export function getMonthKey(dateStr) {
  if (!isValidDateString(dateStr)) return null;
  return dateStr.slice(0, 7).replace(".", "-");
}

// Extracts year key in format yyyy from valid date
export function getYearKey(dateStr) {
  if (!isValidDateString(dateStr)) return null;
  return dateStr.slice(0, 4);
}