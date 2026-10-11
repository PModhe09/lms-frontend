const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});
const INR_WHOLE = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Amounts travel as integer paise; rupees exist only on screen. */
export const formatINR = (paise: number) => INR.format(paise / 100);
export const formatINRWhole = (paise: number) => INR_WHOLE.format(paise / 100);

export const rupeesToPaise = (rupees: number) => Math.round(rupees * 100);

const DATE = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const DATE_TIME = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export const formatDate = (iso: string) => DATE.format(new Date(iso));
export const formatDateTime = (iso: string) => DATE_TIME.format(new Date(iso));

export const formatBytes = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/** Today's date in India as YYYY-MM-DD (business dates are IST). */
export const todayIST = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
