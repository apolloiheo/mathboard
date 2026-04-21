"use client"

import { DocumentResponsePermission } from "@/api/docs"
import { useAutoSaveDocument } from "@/hooks/autoSaveDoc"
import { ChangeEventHandler, useEffect, useState } from "react"

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
    const [value, setValue] = useState(initialValue)
    const [ws, setWs] = useState<WebSocket | null>(null)

    useEffect(() => {
        const token = localStorage.getItem("token")
        const socket = new WebSocket(`ws://localhost:12001/ws/docs/${doc.id}?token=${token}`)
        setWs(socket)

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data)

            if (data.type === "edit" && data.content !== value) {
                setValue(data.content)
            }
        }

        return () => {
            socket.close()
        }
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value
        setValue(newValue)

        ws?.send(
            JSON.stringify({
            type: "edit",
            content: newValue,
            })
        )
    }

    return (
        <div className="flex-1 flex justify-center bg-white">
            <div className="w-full max-w-3xl p-8">

                <textarea
                    value={value}
                    onChange={handleChange}
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