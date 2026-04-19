import { redirect } from "next/navigation";

export default function HomePage() {
  const user = null; // replace with auth logic

  if (user) {
    redirect("/docs");
  }

  return <div>Landing Page</div>;
}