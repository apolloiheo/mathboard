"use client"

import { useEffect, useRef, useState } from "react"

const updateTitleTimers: Record<string, ReturnType<typeof setTimeout>> = {}

export function updateTitle(doc_id: string, newTitle: string) {
    const token = localStorage.getItem("token")
    if (!token) return

    // clear previous timer for this doc
    if (updateTitleTimers[doc_id]) {
        clearTimeout(updateTitleTimers[doc_id])
    }

    // set new timer
    updateTitleTimers[doc_id] = setTimeout(async () => {
        try {
            const res = await fetch(`http://localhost:12001/update-doc`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    doc_id: Number(doc_id),
                    title: newTitle,
                }),
            })

            if (!res.ok) {
                const err = await res.json()
                console.log("FULL ERROR:", JSON.stringify(err, null, 2))
                return
            }

            const data = await res.json()
        } catch (err) {
            console.error(err)
        }
    }, 500) // 0.5 sec debounce
}


export function useAutoSaveDocument(docId: string, initialValue: string) {
  const [value, setValue] = useState(initialValue)
  const [status, setStatus] = useState<"saved" | "saving">("saved")

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  function updateValue(newValue: string) {
    setValue(newValue)
    setStatus("saving")

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(async () => {
      await saveToServer(newValue)
    }, 10000) // 10 seconds
  }

  async function saveToServer(text: string) {
    const token = localStorage.getItem("token")

    try {
      await fetch(`http://localhost:12001/documents/${docId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      })

      setStatus("saved")
    } catch (err) {
      console.error("Autosave failed:", err)
    }
  }

  // cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return {
    value,
    setValue: updateValue,
    status,
  }
}