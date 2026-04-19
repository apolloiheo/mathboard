// app/signin/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";

export default function SignInPage() {
  const params = useSearchParams();
  const router = useRouter();

  const redirectTo = params.get("redirect") || "/docs";

  function handleLogin() {
    // after auth success:
    router.push(redirectTo);
  }

  return (
    <button onClick={handleLogin}>
      Sign In
    </button>
  );
}