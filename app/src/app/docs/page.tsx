// app/docs/page.tsx
import { redirect } from "next/navigation";

export default async function DocsPage() {
  const user = null; // replace with real auth

  if (!user) {
    redirect("/signin?redirect=/docs");
  }

  return <div>Docs Dashboard</div>;
}