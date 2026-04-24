"use client";

import { useEffect, useRef } from "react";
import katex from "katex";
// @ts-ignore
import renderMathInElement from "katex/dist/contrib/auto-render";

interface Props {
  content: string;
}

export default function LatexRenderer({ content }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    renderMathInElement(containerRef.current, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\[", right: "\\]", display: true },
        { left: "$", right: "$", display: false },
      ],
      throwOnError: false,
    });
  }, [content]);

  return (
    <div
      ref={containerRef}
      className="
        w-full
        text-base
        font-serif
        leading-relaxed
        min-h-[1.5em]
        whitespace-pre-wrap
        break-words
      "
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
