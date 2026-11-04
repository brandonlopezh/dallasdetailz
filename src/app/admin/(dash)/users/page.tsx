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

  // Names live in admin_profiles (empty until the 0014 migration is run).
  const { data: profiles } = await supabaseAdmin().from("admin_profiles").select("email, first_name, last_name");
  const names: Record<string, { first: string; last: string }> = {};
  for (const p of profiles ?? []) names[p.email] = { first: p.first_name, last: p.last_name };

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
          names={names}
          setupError={error ? "The users table isn't set up yet. Run the 0008_admin_users.sql migration in Supabase." : null}
        />
      </div>
    </div>
  );
}
