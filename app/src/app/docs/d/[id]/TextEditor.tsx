"use client"

import { DocumentBlock, DocumentResponsePermission } from "@/api/docs"
import { useAutoSaveDocument } from "@/hooks/autoSaveDoc"
import { ChangeEventHandler, useEffect, useReducer, useRef, useState } from "react"
import { applyOp, Op, reducer } from "./op"

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
    const prevValueRef = useRef(initialValue)

    useEffect(() => {
        const token = localStorage.getItem("token")
        const socket = new WebSocket(`ws://localhost:12001/ws/docs/${doc.id}?token=${token}`)
        wsRef.current = socket

        socket.onmessage = (event) => {
            const op: Op = JSON.parse(event.data)

            dispatch(op)
        }

        return () => {
            socket.close()
        }
    }, [])

    const [state, dispatch] = useReducer(reducer, {
        order: [],
        blocks: {}
    })

    const wsRef = useRef<WebSocket | null>(null)

    const sendOp = (op: Op) => {
        // optimistic update
        dispatch(op)

        wsRef.current?.send(JSON.stringify(op))
    }

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
        <div className="flex-1 flex flex-col justify-center bg-white
                h-[calc(100vh-180px)]">
            {state.order.map((id, i) =>
                <BlockEditor key={id} block={state.blocks[id]} position={i} sendOp={sendOp} />
            )}
        </div>
    )
}

function BlockEditor({
    block,
    position,
    sendOp
}: {
    block: DocumentBlock
    position: number
    sendOp: (op: Op) => void
}) {
    const [value, setValue] = useState(block.content)

    // keep local state in sync with external updates
    useEffect(() => {
        setValue(block.content)
    }, [block.content])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value
        setValue(newValue)

        sendOp({
            type: "update_block",
            position,
            content: newValue,
            block_type: block.type
        })
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // ENTER → create new block
        if (e.key === "Enter") {
            e.preventDefault()

            sendOp({
                id: crypto.randomUUID(),
                type: "create_block",
                position: position + 1,
            })
        }

        // BACKSPACE on empty → delete block
        if (e.key === "Backspace" && value === "") {
            e.preventDefault()

            sendOp({
                type: "delete_block",
                position
            })
        }
    }

    return (
        <div key={block.id} className="w-full max-w-3xl p-8">
            <textarea
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Start writing..."
                className="
                w-full
                resize-none
                outline-none
                text-base
                leading-relaxed
                font-serif
                "
            // disabled={doc.permission === "read"}
            />

        </div>
    )
}