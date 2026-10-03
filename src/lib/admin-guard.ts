import "server-only";
import { redirect } from "next/navigation";
import { getAdminUser, type AdminUser } from "./auth";

/** For admin pages about bookings/customers: editors are sent to Website Edits. */
export async function requireBookingsAccess(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  if (user.role === "editor") redirect("/admin/website");
  return user;
}

/** For the Users page: master accounts only. */
export async function requireMaster(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "master") redirect("/admin");
  return user;
}
