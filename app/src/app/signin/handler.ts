import { createUser } from "@/services/api";

export type CreateAccountResult =
  | { ok: true; token: string }
  | { ok: false; error: string }

export async function createAccountHandler(data: {
  username: string
  email: string
  password: string
}): Promise<CreateAccountResult> {
  const res = await createUser(data)

  switch (res.code) {
    case 100:
      return {
        ok: true,
        token: res.token!,
      }

    case 10:
      return { ok: false, error: "Invalid username" }

    case 20:
      return { ok: false, error: "Invalid email" }

    case 30:
      return { ok: false, error: "Invalid password" }

    case 90:
      return { ok: false, error: "Account already exists" }

    default:
      return { ok: false, error: "Unknown error" }
  }
}