export type Op =
  | { type: "insert"; pos: number; text: string }
  | { type: "delete"; pos: number; length: number }
  | { type: "init"; content: string; }

export const applyOp = (val: string, op: any) => {
  if (op.type === "insert") {
    return val.slice(0, op.pos) + op.text + val.slice(op.pos)
  }

  if (op.type === "delete") {
    return val.slice(0, op.pos) + val.slice(op.pos + op.length)
  }

  return val
}

export type Block =
  | {
      id: string;
      type: "paragraph";
      content: string;
      version: number;
    }
  | {
      id: string;
      type: "math_block";
      latex: string;
      version: number;
    };