import UsersManager, { type UserRow } from "@/components/admin/UsersManager";
import { adminEmails } from "@/lib/auth";
import { requireMaster } from "@/lib/admin-guard";
import { supabaseAdmin } from "@/lib/supabase/server";

export const metadata = { title: "Users" };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const me = await requireMaster();
  const { data, error } = await supabaseAdmin()
    .from("admin_users")
    .select("email, role, created_at")
    .order("created_at");

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">Users</h1>
      <p className="mt-1 text-sm text-muted">
        Give other people access to the admin. They sign in at /admin/login with their email.
      </p>
      <div className="mt-6">
        <UsersManager
          masters={adminEmails()}
          me={me.email}
          users={(data ?? []) as UserRow[]}
          setupError={error ? "The users table isn't set up yet. Run the 0008_admin_users.sql migration in Supabase." : null}
        />
      </div>
    </div>
  );
}
