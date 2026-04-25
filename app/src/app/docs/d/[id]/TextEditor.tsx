"use client"

import { DocumentResponsePermission } from "@/api/docs"
import { useEffect, useReducer, useRef, useState } from "react"
import { Op, reducer } from "./op"
import { BlockEditor } from "./BlockEditor"

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

    const containerRef = useRef<HTMLDivElement | null>(null);

    return (
        <div className="flex-1 flex flex-col bg-white align-items
                h-[calc(100vh-180px)] p-16
                overflow-y-auto
        "
            ref={containerRef}
        >
            {state.order.map((id, i) =>
                <BlockEditor
                    key={id}
                    block={state.blocks[id]}
                    position={i}
                    sendOp={sendOpWithFocus}
                    permission={doc.permission}
                    textareaRef={(el) => (blockRefs.current[i] = el)}
                    requestFocus={requestFocus}
                    containerRef={containerRef}
                    emptyDoc={state.blocks[state.order[0]].content === ""}
                />
            )}
            <div className="h-[240px] shrink-0" />
        </div>
    )
}