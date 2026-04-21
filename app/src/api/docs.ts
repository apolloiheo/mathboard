export type CreateDocInput = {
    template?: string
    title?: string
}

export type CreateDocResponse = {
    doc_id: string
}

export async function createDoc(
  data: CreateDocInput
): Promise<CreateDocResponse> {
  const token = localStorage.getItem("token")

  const res = await fetch("http://localhost:12001/docs/new", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    throw new Error("Network error")
  }

  return res.json()
}

export type DocumentResponse = {
  id: number
  title: string
  text: string
}

export type DocumentResponsePermission = {
  id: number
  owner_id: number
  owner: any

  title: string
  text: string

  created_at: string
  updated_at: string

  permission: "read" | "write" | "owner"
  owner_username: string
}