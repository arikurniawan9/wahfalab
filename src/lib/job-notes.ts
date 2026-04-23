const INVOICE_REQUEST_MARKER = "[INVOICE_REQUESTED]";

export function getDisplayJobNotes(notes?: string | null) {
  if (!notes) {
    return "";
  }

  return notes
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.includes(INVOICE_REQUEST_MARKER))
    .join("\n")
    .trim();
}
