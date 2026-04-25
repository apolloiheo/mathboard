import { CharOp } from "./op";

export function getDiff(prev: string, next: string) {
    let start = 0;

    // find first difference
    while (
        start < prev.length &&
        start < next.length &&
        prev[start] === next[start]
    ) {
        start++;
    }

    let endPrev = prev.length - 1;
    let endNext = next.length - 1;

    // find last difference
    while (
        endPrev >= start &&
        endNext >= start &&
        prev[endPrev] === next[endNext]
    ) {
        endPrev--;
        endNext--;
    }

    // insertion
    if (next.length > prev.length) {
        return {
            type: "insert",
            index: start,
            text: next.slice(start, endNext + 1),
        } as CharOp;
    }

    // deletion
    if (next.length < prev.length) {
        return {
            type: "delete",
            index: start,
            length: endPrev - start + 1,
        } as CharOp;
    }

    // replace (treat as delete + insert)
    return {
        type: "replace",
        index: start,
        length: endPrev - start + 1,
        text: next.slice(start, endNext + 1),
    } as CharOp;
}