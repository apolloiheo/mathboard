export type CreateUserInput = {
  username: string
  email: string
  password: string
}

export type CreateUserResponse = {
  code: number
  user?: any
  token?: string
}

export async function createUser(data: CreateUserInput): Promise<CreateUserResponse> {
  const res = await fetch("http://localhost:12001/create-user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    throw new Error("Network error")
  }

  return res.json()
}