"use client"

import { DocumentResponsePermission } from "@/api/docs"
import { useAutoSaveDocument } from "@/hooks/autoSaveDoc"
import { ChangeEventHandler, useEffect, useRef, useState } from "react"
import { applyOp } from "./op"

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
    const [ready, setReady] = useState(false)
    const [value, setValue] = useState(initialValue)
    const prevValueRef = useRef(initialValue)
    const [ws, setWs] = useState<WebSocket | null>(null)

    useEffect(() => {
        const token = localStorage.getItem("token")
        const socket = new WebSocket(`ws://localhost:12001/ws/docs/${doc.id}?token=${token}`)
        setWs(socket)

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data)
            if (data.type === "insert" || data.type == "delete") {
                setValue((prev) => {
                    const newVal = applyOp(prev, data)
                    prevValueRef.current = newVal
                    return newVal
                })
            }
            if (data.type == "init") {
                setValue(data.content)
                prevValueRef.current = data.content
                setReady(true)
            }
        }

        return () => {
            socket.close()
        }
    }, [])


    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value
        const oldValue = prevValueRef.current

        // find first diff
        let start = 0
        while (
            start < oldValue.length &&
            start < newValue.length &&
            oldValue[start] === newValue[start]
        ) {
            start++
        }

        // find end diff
        let oldEnd = oldValue.length - 1
        let newEnd = newValue.length - 1

        while (
            oldEnd >= start &&
            newEnd >= start &&
            oldValue[oldEnd] === newValue[newEnd]
        ) {
            oldEnd--
            newEnd--
        }

        let op

        if (newValue.length > oldValue.length) {
            // INSERT
            op = {
                type: "insert",
                pos: start,
                text: newValue.slice(start, newEnd + 1),
            }
        } else {
            // DELETE
            op = {
                type: "delete",
                pos: start,
                length: oldEnd - start + 1,
            }
        }

        setValue(newValue)
        prevValueRef.current = newValue

        ws?.send(JSON.stringify(op))
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