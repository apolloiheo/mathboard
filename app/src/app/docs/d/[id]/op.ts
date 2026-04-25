import { DocumentBlock } from "@/api/docs";

export type CharOp = 
  | { type: "insert", index: number, text: string }
  | { type: "delete", index: number, length: number }
  | { type: "replace", index: number, text: string, length: number }

export type Op =
  | { type: "insert"; pos: number; text: string }
  | { type: "delete"; pos: number; length: number }
  | { type: "init"; content: DocumentBlock[]; }

  | { type: "create_block"; position: number; id: string }
  | { type: "update_block"; position: number; block_type: string; diff: CharOp }
  | { type: "delete_block"; position: number }

export const applyOp = (val: string, op: any) => {
  if (op.type === "insert") {
    return val.slice(0, op.pos) + op.text + val.slice(op.pos)
  }

  if (op.type === "delete") {
    return val.slice(0, op.pos) + val.slice(op.pos + op.length)
  }

  return val
}

const applyCharOp = (val: string, op: CharOp) => {
  if (op.type == "insert") {
    return val.slice(0, op.index) + op.text + val.slice(op.index)
  }
  if (op.type == "delete") {
    return val.slice(0, op.index) + val.slice(op.index + op.length)
  }
  if (op.type == "replace") {
    return val.slice(0, op.index) + op.text + val.slice(op.index + op.length)
  }
  return val
}

export type Block =
  | {
    id: string;
    type: "paragraph";
    content: string;
  }
  | {
    id: string;
    type: "math_block";
    latex: string;
  };

export type DocumentBlock2 = {
  id: string;
  doc_id?: number;
  position?: number;
  type: string;
  content: string;
  updated_at?: string;
}


type DocumentState = {
  order: string[]                         // [block_id, block_id, ...]
  blocks: Record<string, DocumentBlock2>   // block_id -> block
}


export function reducer(state: DocumentState, op: Op): DocumentState {
  const newState = {
    order: [...state.order],
    blocks: { ...state.blocks }
  }

  switch (op.type) {
    case "init": {
      const blocksArray = op.content

      const order: string[] = []
      const blocks: Record<string, DocumentBlock2> = {}

      for (const block of blocksArray) {
        order.push(block.id)
        blocks[block.id] = block
      }

      return {
        order,
        blocks
      }
    }

    case "create_block": {
      const id = op.id

      newState.order.splice(op.position, 0, id)
      newState.blocks[id] = {
        id,
        type: "paragraph",
        content: ""
      }
      return newState
    }

    case "update_block": {
      const id = newState.order[op.position]
      if (!id) return state

      newState.blocks[id] = {
        ...newState.blocks[id],
        type: op.block_type,
        content: applyCharOp(newState.blocks[id].content, op.diff)
      }
      console.log({newState})
      return newState
    }

    case "delete_block": {
      const id = newState.order[op.position]
      if (!id) return state

      newState.order.splice(op.position, 1)
      delete newState.blocks[id]
      return newState
    }

    default:
      return state
  }
}