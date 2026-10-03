import { redirect } from "next/navigation";

// Schedule now lives under Today (/admin#schedule).
export default function SchedulePage() {
  redirect("/admin#schedule");
}
