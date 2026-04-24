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

function BlockEditor({
    block,
    position,
    sendOp,
    permission,
    textareaRef,
    requestFocus,
    containerRef,
    emptyDoc,
}: {
    block: DocumentBlock2
    position: number
    sendOp: (op: Op) => void
    permission: "owner" | "read" | "write"
    textareaRef: (el: HTMLTextAreaElement | null) => void
    requestFocus: (index: number, atEnd?: boolean) => void
    containerRef: any
    emptyDoc: boolean
}) {
    const [isFocused, setIsFocused] = useState(false)
    const localRef = useRef<HTMLTextAreaElement | null>(null);
    const [value, setValue] = useState(block.content)

    useEffect(() => {
        if (emptyDoc && position === 0) {
            setIsFocused(true)
        }
    }, [])


    // keep local state in sync with external updates
    const prevValueRef = useRef(value);
    useEffect(() => {
        const el = localRef.current;
        if (!el) return;

        const incoming = block.content;
        const current = value;
        const prev = prevValueRef.current;

        // if nothing changed, skip
        if (incoming === current) return;

        // simple merge: append difference
        if (incoming.startsWith(prev)) {
            const addition = incoming.slice(prev.length);

            const start = el.selectionStart;
            const end = el.selectionEnd;

            const newValue =
                current.slice(0, start) +
                addition +
                current.slice(end);

            setValue(newValue);

            // keep cursor where it was w/o interruption
            requestAnimationFrame(() => {
                const newCursor = start + addition.length;
                el.setSelectionRange(newCursor, newCursor);
            });
        } else {
            // fallback (overwrite if complex conflict)
            setValue(incoming);
        }

        prevValueRef.current = incoming;
    }, [block.content]);

    useEffect(() => {
        // removes extra line browsers leave for textarea at bottom for consistent vertical spacing
        const el = localRef.current;
        if (!el) return;

        el.style.height = "0px";
        el.style.height = el.scrollHeight + "px";

        ensureVisibleWithBuffer();
    }, [value])

    const ensureVisibleWithBuffer = () => {
        const el = localRef.current;
        const container = containerRef.current;
        if (!el || !container) return;

        const buffer = 120;

        // position of textarea bottom INSIDE scroll container
        const elBottom = el.offsetTop + el.scrollHeight;

        // current visible bottom of container
        const containerBottom =
            container.scrollTop + container.clientHeight;

        const distanceFromBottom = containerBottom - elBottom;

        if (distanceFromBottom < buffer) {
            container.scrollTop += buffer - distanceFromBottom;
        }
    };

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
        ensureVisibleWithBuffer();
    }, [isFocused]);

    return (
        <div className="w-full flex justify-center">
            <div key={block.id} className="w-full max-w-4xl grid">
                <div
                    onClick={() => setIsFocused(true)}
                    className={`
                        col-start-1 row-start-1
                        text-base font-serif leading-relaxed whitespace-pre-wrap break-words
                        ${isFocused ? "opacity-0 pointer-events-none" : "opacity-100"}
                        z-0
                        px-10 py-2
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
                    placeholder={position == 0 ? "Start writing..." : ""}
                    className={`
                        col-start-1 row-start-1
                        leading-relaxed
                        px-10 py-2
                        w-full
                        resize-none
                        outline-none
                        text-base
                        font-serif
                        ${isFocused ? "bg-gray-100" : "bg-transparent"}
                        ${isFocused ? "opacity-100" : "opacity-0 pointer-events-none"}
                        z-10
                    `}
                    disabled={permission === "read"}
                    onBlur={() => {
                        if (isFocused) setIsFocused(false)
                    }}
                    onFocus={() => {
                        if (!isFocused) setIsFocused(true)
                    }}
                />
            </div>
        </div>
    )
}