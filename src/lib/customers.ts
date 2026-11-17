import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { formatPhone, phoneDigits } from "./phone";

export interface CustomerMatch {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
}

/**
 * Finds a customer by phone number no matter how it was typed when saved
 * ("(214) 555-1234", "214.555.1234", "+1 214 555 1234" all match). Numbers
 * that aren't 10-digit US numbers fall back to an exact match.
 */
export async function findCustomerByPhone(
  sb: SupabaseClient,
  phone: string,
): Promise<CustomerMatch | null> {
  const cols = "id, name, phone, email, address";
  const digits = phoneDigits(phone);
  if (!digits) {
    const { data } = await sb.from("customers").select(cols).eq("phone", phone.trim()).limit(1);
    return (data?.[0] as CustomerMatch | undefined) ?? null;
  }
  // Loose database match (digits in order, any punctuation between the
  // groups), then an exact digit comparison here.
  const pattern = `%${digits.slice(0, 3)}%${digits.slice(3, 6)}%${digits.slice(6)}%`;
  const { data } = await sb.from("customers").select(cols).ilike("phone", pattern).limit(20);
  const match = (data ?? []).find((c) => phoneDigits(c.phone as string) === digits);
  return (match as CustomerMatch | undefined) ?? null;
}

/** The form a phone number is saved in: normalized when it's a US number. */
export function phoneForStorage(phone: string): string {
  const digits = phoneDigits(phone);
  return digits ? formatPhone(digits) : phone.trim();
}
