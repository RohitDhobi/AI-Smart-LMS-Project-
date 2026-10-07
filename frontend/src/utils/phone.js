// Shared phone validation used by every form with a phone field.
// While typing: digits, "+", "-" and spaces only, max 18 characters.
// On submit: empty (phone is optional) or 7–15 digits (E.164 allows up to 15).

export function sanitizePhone(value) {
  return String(value ?? "").replace(/[^\d+\-\s]/g, "").slice(0, 18);
}

export function phoneError(value) {
  const raw = String(value ?? "");
  const digits = raw.replace(/\D/g, "");
  if (!raw.trim()) return "";
  if (digits.length < 7 || digits.length > 15) {
    return "Invalid phone number: enter 7–15 digits, optionally starting with +.";
  }
  return "";
}
