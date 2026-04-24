"use client"

import { DocumentBlock, DocumentResponsePermission } from "@/api/docs"
import { useAutoSaveDocument } from "@/hooks/autoSaveDoc"
import { ChangeEventHandler, useEffect, useLayoutEffect, useReducer, useRef, useState } from "react"
import { applyOp, DocumentBlock2, Op, reducer } from "./op"
import LatexRenderer from "@/components/LatexRenderer"

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
    const [isFocused, setIsFocused] = useState(false)
    const localRef = useRef<HTMLTextAreaElement | null>(null);
    const [value, setValue] = useState(block.content)


    // keep local state in sync with external updates
    useEffect(() => {
        setValue(block.content)
    }, [block.content])

    useEffect(() => {
        if (!value) setIsFocused(true);
    }, [value])

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
        // SHIFT+ENTER → allow newline
        if (e.key === "Enter" && e.shiftKey) {
            return; // let textarea handle it naturally
        }

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

    useLayoutEffect(() => {
        if (!isFocused) return;
        const el = localRef.current;
        if (!el) return;
        el.focus();
        const len = el.value.length;
        el.setSelectionRange(len, len);
    }, [isFocused]);

    return (
        <div className="w-full flex justify-center">
            <div key={block.id} className="w-full max-w-4xl grid">
                <div
                    onClick={() => setIsFocused(true)}
                    className={`
      col-start-1 row-start-1
      text-base font-serif whitespace-pre-wrap break-words
                        ${isFocused || position === 0 ? "opacity-0 pointer-events-none" : "opacity-100"}
                        z-0
                    `}
                >
                    <LatexRenderer content={value} />
                </div>
                <textarea
                    ref={(el) => {
                        localRef.current = el;
                        textareaRef(el);
                    }}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Start writing..."
                    className={`
      col-start-1 row-start-1
                    w-full
                    resize-none
                    outline-none
                    text-base
                    font-serif
                    bg-transparent
                    ${isFocused || position === 0 ? "opacity-100" : "opacity-0 pointer-events-none"}
                    z-10
                `}
                    disabled={permission === "read"}
                    onBlur={() => {
                        if (value && isFocused) setIsFocused(false)
                    }}
                    onFocus={() => {
                        if (!isFocused) setIsFocused(true)
                    }}
                />
            </div>
        </div>
    )
}