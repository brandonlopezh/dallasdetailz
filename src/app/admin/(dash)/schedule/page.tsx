import { redirect } from "next/navigation";

// The calendar now opens from Today (/admin).
export default function SchedulePage() {
  redirect("/admin");
}
