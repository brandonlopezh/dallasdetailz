// Cheap, dependency-free sanity check shared by the booking form and the
// server: a service address must start with a street number followed by a
// street name ("1500 Marilla St, Dallas, TX 75201"). A bare ZIP such as
// "75212", or just a city, fails. This is only the first gate; the real
// check is the geocoder lookup in lib/distance.ts.
export function looksLikeStreetAddress(address: string): boolean {
  return /^\d+[a-z]?(-\d+)?\s+\S*[a-z]/i.test(address.trim());
}

export type AddressStatus = "found" | "not_found" | "unverified";
