import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { DocumentBlock2, Op } from "./op"
import LatexRenderer from "@/components/LatexRenderer"
import { getDiff } from "./utils"

export function BlockEditor({
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
useEffect(() => {
    const el = localRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;

    setValue(block.content);

    requestAnimationFrame(() => {
        const el2 = localRef.current;
        if (!el2) return;

        const max = el2.value.length;

        el2.setSelectionRange(
            Math.min(start, max),
            Math.min(end, max)
        );
    });
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

    const prevValueRef = useRef(value);
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        const prevValue = value;
        const diff = getDiff(prevValue, newValue);
        setValue(newValue)


        sendOp({
            type: "update_block",
            position,
            block_type: block.type,
            diff
        })

        prevValueRef.current = newValue;
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