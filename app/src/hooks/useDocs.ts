"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export type Document = {
  id: number
  owner_id: number
  owner: any

  title: string
  text: string

  created_at: string
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
        const res = await fetch(`${API_URL}/my-docs`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) {
          throw new Error("Failed to fetch documents")
        }

        const data = await res.json()
        setDocs(data["docs"] as Document[])
      } catch (err) {
      } finally {
        setLoading(false)
      }
    }

    loadDocs()
  }, [router])

  return { docs, loading }
}