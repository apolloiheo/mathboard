
export type UserPublicResponse = {
    id: number
    authuser_id: number
    authuser: any
}

export type GetUserResponse = {
    success: boolean
    user?: UserPublicResponse
}

export async function getUserByUsername(
  username: string
): Promise<GetUserResponse> {
  const token = localStorage.getItem("token")

  const res = await fetch(`http://localhost:12001/user?username=${username}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }
  })

  if (!res.ok) {
    throw new Error("Network error")
  }

  return res.json()
}