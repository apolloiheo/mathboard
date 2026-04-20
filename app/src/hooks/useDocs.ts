"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export type Document = {
  id: number
  title: string
  text: string
  updated_at: string
}

export function useDocuments() {
  const router = useRouter()

  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDocs() {
      const token = localStorage.getItem("token")

      if (!token) {
        router.replace("/signin")
        return
      }

      try {
        const res = await fetch("http://127.0.0.1:12001/docs", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) {
          throw new Error("Failed to fetch documents")
        }

        const data: Document[] = await res.json()
        setDocs(data)
      } catch (err) {
      } finally {
        setLoading(false)
      }
    }

    loadDocs()
  }, [router])

  return { docs, loading }
}