export type Lang = "fa" | "en";

interface Messages {
  loading: string;
  loadError: string;
  submitted: string;
  submitting: string;
  submit: string;
  submissionFailed: string;
  selectPlaceholder: string;
  required: (label: string) => string;
  email: (label: string) => string;
  url: (label: string) => string;
  tooLong: (label: string) => string;
  tooShort: (label: string) => string;
  patternInvalid: (label: string) => string;
  notNumber: (label: string) => string;
  tooSmall: (label: string) => string;
  tooLarge: (label: string) => string;
}

const fa: Messages = {
  loading: "در حال بارگذاری…",
  loadError: "خطا در بارگذاری فرم",
  submitted: "ثبت شد",
  submitting: "در حال ارسال…",
  submit: "ارسال",
  submissionFailed: "ارسال ناموفق بود",
  selectPlaceholder: "— انتخاب کنید —",
  required: (l) => `${l} الزامی است`,
  email: (l) => `${l} باید یک ایمیل معتبر باشد`,
  url: (l) => `${l} باید یک آدرس اینترنتی معتبر باشد`,
  tooLong: (l) => `${l} خیلی طولانی است`,
  tooShort: (l) => `${l} خیلی کوتاه است`,
  patternInvalid: (l) => `فرمت ${l} نامعتبر است`,
  notNumber: (l) => `${l} باید عدد باشد`,
  tooSmall: (l) => `${l} خیلی کوچک است`,
  tooLarge: (l) => `${l} خیلی بزرگ است`,
};

const en: Messages = {
  loading: "Loading…",
  loadError: "Failed to load form",
  submitted: "Submitted",
  submitting: "Submitting…",
  submit: "Submit",
  submissionFailed: "Submission failed",
  selectPlaceholder: "— select —",
  required: (l) => `${l} is required`,
  email: (l) => `${l} must be a valid email`,
  url: (l) => `${l} must be a valid URL`,
  tooLong: (l) => `${l} is too long`,
  tooShort: (l) => `${l} is too short`,
  patternInvalid: (l) => `${l} format is invalid`,
  notNumber: (l) => `${l} must be a number`,
  tooSmall: (l) => `${l} is too small`,
  tooLarge: (l) => `${l} is too large`,
};

export const translations: Record<Lang, Messages> = { fa, en };

export function t(lang: Lang): Messages {
  return translations[lang] ?? fa;
}
