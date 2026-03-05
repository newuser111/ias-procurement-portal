import { redirect } from "next/navigation";

export default function ReorderRedirect() {
  redirect("/inventory?tab=reorder");
}
