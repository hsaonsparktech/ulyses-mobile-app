export const formatNumber = (value: number, locale = "en") =>
  new Intl.NumberFormat(locale).format(value);
export const formatCurrency = (
  value: number,
  currency: string,
  locale = "en",
) =>
  new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
export const formatDate = (value: Date, locale = "en", timeZone?: string) =>
  new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone }).format(
    value,
  );
export const formatTime = (value: Date, locale = "en", timeZone?: string) =>
  new Intl.DateTimeFormat(locale, { timeStyle: "short", timeZone }).format(
    value,
  );
