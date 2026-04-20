"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export type User = {
  id: number
  username: string
  email: string
}

export function useAuth() {
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("token")

      if (!token) {
        router.replace("/signin")
        return
      }

      try {
        const res = await fetch("http://127.0.0.1:12001/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) {
          throw new Error("Unauthorized")
        }

        const data: User = await res.json()
        setUser(data)
      } catch (err) {
        localStorage.removeItem("token")
        router.replace("/signin")
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [router])

  return { user, loading }
}