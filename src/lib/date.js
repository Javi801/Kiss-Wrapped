const ZODIAC_MONTH_NAMES = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

// Parses {month, day} from the end portion of a zodiac sign string.
// Handles EN ("April 19") and ES ("19 abril") formats.
export function getZodiacEndDate(zodiacSign) {
  if (!zodiacSign) return null;
  const match = zodiacSign.match(/\(.*?-\s*(.+?)\)/);
  if (!match) return null;
  const endPart = match[1].trim();

  // English: "April 19"
  const enMatch = endPart.match(/^([A-Za-z]+)\s+(\d+)$/);
  if (enMatch) {
    const month = ZODIAC_MONTH_NAMES[enMatch[1].toLowerCase()];
    const day = parseInt(enMatch[2]);
    if (month && day) return { month, day };
  }

  // Spanish: "19 abril"
  const esMatch = endPart.match(/^(\d+)\s+([A-Za-záéíóúüñ]+)$/i);
  if (esMatch) {
    const month = ZODIAC_MONTH_NAMES[esMatch[2].toLowerCase()];
    const day = parseInt(esMatch[1]);
    if (month && day) return { month, day };
  }

  return null;
}

// Calculates dynamic age: increments when the zodiac sign period ends each year.
export function calculateAge(birthYear, zodiacSign) {
  if (!birthYear || !zodiacSign) return null;
  const endDate = getZodiacEndDate(zodiacSign);
  if (!endDate) return null;
  const today = new Date();
  const currentYear = today.getFullYear();
  const endThisYear = new Date(currentYear, endDate.month - 1, endDate.day);
  return today >= endThisYear ? currentYear - birthYear : currentYear - birthYear - 1;
}

// Derives birth year from a known current age and zodiac sign.
// If the zodiac period end has already passed this year, the person already
// turned `age` this year → birthYear = currentYear - age.
// Otherwise the birthday is still ahead → birthYear = currentYear - age - 1.
export function deriveBirthYear(age, zodiacSign) {
  const endDate = getZodiacEndDate(zodiacSign);
  const today = new Date();
  const currentYear = today.getFullYear();
  if (!endDate) return currentYear - age;
  const endThisYear = new Date(currentYear, endDate.month - 1, endDate.day);
  return today >= endThisYear ? currentYear - age : currentYear - age - 1;
}

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