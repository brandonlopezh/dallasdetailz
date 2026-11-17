// Phone helpers shared by the booking form and the server. US numbers only.

/** The 10 digits of a US number, or null if the input isn't one. */
export function phoneDigits(input: string): string | null {
  const d = input.replace(/\D/g, "");
  const ten = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  return ten.length === 10 ? ten : null;
}

/** How numbers are saved: "214-555-1234" (readable, and valid in tel:/sms: links). */
export function formatPhone(digits: string): string {
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** "+12145551234", the form SMS gateways expect. Null if not a US number. */
export function toE164(input: string): string | null {
  const d = phoneDigits(input);
  return d ? `+1${d}` : null;
}
