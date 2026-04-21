"use client"

import { useAutoSaveDocument } from "@/hooks/autoSaveDoc"
import { useEffect, useState } from "react"

type Props = {
    docId: string
    initialValue?: string
}

export function TextEditor({
    docId,
    initialValue = ""
}: Props) {
    const { value, setValue, status } = useAutoSaveDocument(docId, initialValue)

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
          />

        </div>
      </div>
    )
}