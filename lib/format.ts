import type { Timestamp } from "firebase/firestore";

export function formatCurrency(value: number | null | undefined, currency = "USD"): string {
  const amount = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatCompactCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);
}

export function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

export function toDate(value: Timestamp | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof (value as Timestamp).toDate === "function") return (value as Timestamp).toDate();
  return null;
}

export function formatDate(value: Timestamp | Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? parseDateInput(value) : toDate(value);
  if (!date) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(value: Timestamp | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Parses a yyyy-MM-dd input value as a local date, not UTC midnight. */
export function parseDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function todayInput(): string {
  return toDateInput(new Date());
}

export function toDateInput(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function relativeTime(value: Timestamp | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return "just now";
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

export function isOverdue(dueDate: string | null, completed: boolean): boolean {
  if (!dueDate || completed) return false;
  const date = parseDateInput(dueDate);
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() < today.getTime();
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function titleCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Maps a Firestore error to a message worth showing a user. */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as { code?: string }).code;
    switch (code) {
      case "permission-denied":
        return "Your role does not allow that action.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
        return "That email and password combination is not correct.";
      case "auth/user-not-found":
        return "No account exists for that email address.";
      case "auth/email-already-in-use":
        return "An account with that email address already exists.";
      case "auth/weak-password":
        return "Choose a password with at least 6 characters.";
      case "auth/popup-closed-by-user":
        return "The Google sign-in window was closed before finishing.";
      case "auth/account-exists-with-different-credential":
        return "That email is already registered with a different sign-in method.";
      case "auth/too-many-requests":
        return "Too many attempts. Please wait a moment and try again.";
      case "failed-precondition":
        return "Firestore needs an index for this query. Open the browser console for the creation link.";
      default:
        return error.message;
    }
  }
  return "Something went wrong. Please try again.";
}
