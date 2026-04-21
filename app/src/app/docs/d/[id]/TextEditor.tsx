"use client"

import { DocumentResponsePermission } from "@/api/docs"
import { useAutoSaveDocument } from "@/hooks/autoSaveDoc"
import { useEffect, useState } from "react"

type Props = {
    doc: DocumentResponsePermission
    user: any
    initialValue?: string
}

export function TextEditor({
    doc,
    user,
    initialValue = ""
}: Props) {
    const { value, setValue, status } = useAutoSaveDocument(doc.id, initialValue)
    const isOwner = doc && user && doc.owner_id == user.id;

    return (
        <div className="flex-1 flex justify-center bg-white">
        <div className="w-full max-w-3xl p-8">

          <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
            placeholder="Start writing..."
            className="
              w-full
              h-[calc(100vh-140px)]
              resize-none
              outline-none
              text-base
              leading-relaxed
              font-serif
            "
            disabled={doc.permission === "read"}
          />

        </div>
      </div>
    )
}