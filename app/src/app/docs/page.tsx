"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { useDocuments } from "@/hooks/useDocs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { TemplateDocsRow } from "./TemplateDocs"

export default function DocsPage() {
  const router = useRouter()

  const { user, loading: authLoading } = useAuth()
  const { docs, loading: docsLoading } = useDocuments()

  // auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/signin?redirect=/docs")
    }
  }, [user, authLoading, router])

  // loading state
  if (authLoading || docsLoading) {
    return (
      <div className="h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading your workspace...
      </div>
    )
  }

  // not authenticated (avoid flicker)
  if (!user) return null

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <div className="border-b px-4 py-2 font-medium">
        Mathboard Docs
      </div>

      <div className="flex flex-1">
        {/* Left-side */}
        <div className="w-full border-r p-3 bg-muted/20 flex flex-col gap-3">
          <div className="text-xs text-muted-foreground mb-2">
            START NEW DOCUMENT
          </div>

          <TemplateDocsRow/>

          <div className="text-xs text-muted-foreground mb-2">
            YOUR DOCUMENTS
          </div>

          <div className="space-y-1">
            {docs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => router.push(`/docs/${doc.id}`)}
                className="p-2 rounded hover:bg-muted cursor-pointer"
              >
                <div className="text-sm font-medium truncate">
                  {doc.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}