import { redirect } from "next/navigation";

// Merged into Website Edits.
export default function MediaRedirect() {
  redirect("/admin/website?edit=images");
}
