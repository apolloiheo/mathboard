"use client"

import { DocumentBlock, DocumentResponsePermission } from "@/api/docs"
import { useAutoSaveDocument } from "@/hooks/autoSaveDoc"
import { ChangeEventHandler, useEffect, useReducer, useRef, useState } from "react"
import { applyOp, DocumentBlock2, Op, reducer } from "./op"

const API_URL = process.env.NEXT_PUBLIC_API_URL
const WS_URL = process.env.NEXT_PUBLIC_WS_URL

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
        const socket = new WebSocket(`${WS_URL}/ws/docs/${doc.id}?token=${token}`)
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

    const blockRefs = useRef<(HTMLTextAreaElement | null)[]>([])
    const [focusIndex, setFocusIndex] = useState<number | null>(null)
    const [focusAtEnd, setFocusAtEnd] = useState(false)

    const requestFocus = (index: number, atEnd = false) => {
        setFocusIndex(index)
        setFocusAtEnd(atEnd)
    }

    const sendOpWithFocus = (op: Op, focus?: { index: number, atEnd?: boolean }) => {
        if (focus) {
            setFocusIndex(focus.index)
            setFocusAtEnd(!!focus.atEnd)
        }

        sendOp(op)
    }

    useEffect(() => {
        if (focusIndex === null) return

        const el = blockRefs.current[focusIndex]
        if (!el) return

        el.focus()

        if (focusAtEnd) {
            const length = el.value.length
            el.setSelectionRange(length, length)
        } else {
            el.setSelectionRange(0, 0)
        }

        setFocusIndex(null)
    }, [state.order])

    return (
        <div className="flex-1 flex flex-col bg-white align-items
                h-[calc(100vh-180px)] p-16">
            {state.order.map((id, i) =>
                <BlockEditor
                    key={id}
                    block={state.blocks[id]}
                    position={i}
                    sendOp={sendOpWithFocus}
                    permission={doc.permission}
                    textareaRef={(el) => (blockRefs.current[i] = el)}
                    requestFocus={requestFocus}
                />
            )}
        </div>
    )
}

function BlockEditor({
    block,
    position,
    sendOp,
    permission,
    textareaRef,
    requestFocus,
}: {
    block: DocumentBlock2
    position: number
    sendOp: (op: Op) => void
    permission: "owner" | "read" | "write"
    textareaRef: (el: HTMLTextAreaElement | null) => void
    requestFocus: (index: number, atEnd?: boolean) => void
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

            requestFocus(position + 1)
        }

        // BACKSPACE on empty → delete block
        if (e.key === "Backspace" && value === "" && position !== 0) {
            console.log("BACKSPACE", position)
            e.preventDefault()

            sendOp({
                type: "delete_block",
                position
            })

            requestFocus(position - 1, true)
        }
    }

    return (
        <div key={block.id} className="w-full max-w-3xl">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Start writing..."
                className="
                w-full
                resize-none
                outline-none
                text-base
                font-serif
                "
                disabled={permission === "read"}
            />

        </div>
    )
}