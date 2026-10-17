import { format as fnsFormat } from "date-fns";

const ETHIOPIAN_MONTHS = [
  "መስከረም",
  "ጥቅምት",
  "ኅዳር",
  "ታኅሣሥ",
  "ጥር",
  "የካቲት",
  "መጋቢት",
  "ሚያዝያ",
  "ግንቦት",
  "ሰኔ",
  "ሐምሌ",
  "ነሐሴ",
  "ጳጉሜን",
];

export function formatDate(
  d: Date | string,
  locale: "en" | "am" = "en",
): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return fnsFormat(date, locale === "am" ? "dd MMM yyyy" : "dd MMM yyyy");
}

export function toEthiopian(date: Date): {
  year: number;
  month: number;
  day: number;
  monthName: string;
} {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();
  const newYearOffset = gm > 9 || (gm === 9 && gd >= 11) ? 7 : 8;
  const ey = gy - newYearOffset;
  // Simplified — production should use a proper library or full conversion
  return {
    year: ey,
    month: gm <= 9 ? gm + 3 : gm - 9,
    day: gd,
    monthName: ETHIOPIAN_MONTHS[gm] ?? "",
  };
}

export const ETHIOPIAN_CALENDAR_MONTHS = ETHIOPIAN_MONTHS;