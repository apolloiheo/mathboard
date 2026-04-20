"use client"
import { useAuth } from "@/hooks/useAuth";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function DocsPage() {
  const { user, loading } = useAuth()
    useEffect(() => {
      if (!loading && !user) {
        redirect("/signin?redirect=/docs");
      }
    }, [user, loading])


  return <div>Docs Dashboard</div>;
}