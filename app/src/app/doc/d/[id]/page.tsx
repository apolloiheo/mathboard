// app/docs/d/[id]/page.tsx
import { redirect } from "next/navigation";

export default function EditorPage({ params }) {
  const user = null;

  if (!user) {
    redirect(`/signin?redirect=/docs/d/${params.id}`);
  }

  return <div>Editor</div>;
}