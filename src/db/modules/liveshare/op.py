from sqlalchemy import text

from db.modules.docs.crud import create_document_block, delete_document_block, get_document_block_by_id, get_document_block_by_ids

from db.database import SessionLocal
from sqlalchemy.orm import Session
import uuid

def apply_op_old(content: str, op: dict) -> str:
    if op["type"] == "insert":
        return content[:op["pos"]] + op["text"] + content[op["pos"]:]
    
    if op["type"] == "delete":
        return content[:op["pos"]] + content[op["pos"] + op["length"]:]
    
    return content

class BlockCache:

    def __init__(self, doc_id: int, db: Session):
        self.db = db
        self.doc_id = doc_id
        self.load_index() # lazy load block.id
        self.blocks: dict[str,dict] = {}

        self.new = set()
        self.dirty_content = set()
        self.dirty_position = set()
        self.deleted = set()

    # - db
    def load_index(self):
        rows = self.db.execute(text("""
            SELECT id FROM document_blocks
            WHERE doc_id = :doc_id
            ORDER BY position
        """), {"doc_id": self.doc_id}) # type: ignore

        self.doc_index = [row[0] for row in rows]

    # - system cache
    def load_block(self, block_position: int) -> dict|None:
        if block_position > len(self.doc_index):
            return None
        block_id = self.doc_index[block_position]
        if not self.blocks.get(block_id):
            block = get_document_block_by_id(block_id, self.db)
            if block is None:
                return None
            self.blocks[block_id] = {
                "type": block.type,
                "content": block.content
            }
        return self.blocks[block_id]

    def create_block(self, block_position: int, type: str, content: str) -> bool:
        if block_position > len(self.doc_index):
            return False
        block_id = str(uuid.uuid4())
        self.blocks[block_id] = {
            "type": type,
            "content": content
        }
        self.doc_index.insert(block_position, block_id)
        self.new.update(self.doc_index[block_position])
        self.dirty_position.update(self.doc_index[block_position:])
        return True

    def update_block(self, block_position: int, type: str, content: str) -> bool:
        if block_position > len(self.doc_index):
            return False
        block_id = self.doc_index[block_position]
        block = self.load_block(block_position)
        if block is None:
            return False
        block.update({
            "type": type,
            "content": content
        })
        self.dirty_content.add(block_id)
        return True

    def delete_block(self, block_position: int) -> bool:
        if block_position > len(self.doc_index):
            return False
        block_id = self.doc_index[block_position]
        self.doc_index.pop(block_position)
        self.dirty_position.update(self.doc_index[block_position:])
        self.deleted.add(block_id)
        return True

    # OP
    def apply_op(self, op: dict) -> bool:
        if op["type"] == "create_block":
            return self.create_block(
                op["position"],
                "paragraph",
                ""
            )
        if op["type"] == "update_block":
            return self.update_block(
                op["position"],
                op["type"],
                op["content"]
            )
        if op["type"] == "delete_block":
            return self.delete_block(
                op["position"]
            )
        
        return False
    
    # Flush
    def flush(self):
        # 1. DELETE
        for block_id in self.deleted:
            self.db.execute(
                "DELETE FROM document_blocks WHERE id = :id", # type: ignore
                {"id": block_id}
            ) # type: ignore

        # 2. INSERT (new blocks)
        for block_id in self.new:
            block = self.blocks[block_id]

            position = self.doc_index.index(block_id)

            self.db.execute(text("""
                INSERT INTO document_blocks (id, doc_id, type, content, position)
                VALUES (:id, :doc_id, :type, :content, :position)
            """), { # type: ignore
                "id": block_id,
                "doc_id": self.doc_id,
                "type": block["type"],
                "content": block["content"],
                "position": position
            }) # type: ignore

        # 3. UPDATE content
        for block_id in self.dirty_content:
            if block_id in self.new or block_id in self.deleted:
                continue

            block = self.blocks[block_id]

            self.db.execute(text("""
                UPDATE document_blocks
                SET type = :type, content = :content
                WHERE id = :id
            """), { # type: ignore
                "id": block_id,
                "type": block["type"],
                "content": block["content"]
            }) # type: ignore

        # 4. UPDATE positions
        for position, block_id in enumerate(self.doc_index):
            if block_id in self.deleted:
                continue

            if block_id in self.new or block_id in self.dirty_position:
                self.db.execute(text("""
                    UPDATE document_blocks
                    SET position = :position
                    WHERE id = :id
                """), { # type: ignore
                    "id": block_id,
                    "position": position
                }) # type: ignore

        self.db.commit()

        # 5. clear state
        self.new.clear()
        self.dirty_content.clear()
        self.dirty_position.clear()
        self.deleted.clear()