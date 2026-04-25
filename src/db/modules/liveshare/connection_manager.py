
import asyncio
import time

from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from db.database import SessionLocal
from db.modules.docs.crud import get_document_by_id
from db.modules.liveshare.op import BlockCache, apply_op_old

class ConnectionManager:
    MAX_INTERVAL_SAVE = 5
    INITIAL_LOAD_BLOCKS = 20

    def __init__(self):
        self.active_connections: dict[int, list[WebSocket]] = {}
        self.doc_contents: dict[int, BlockCache] = {}

        # save
        self.save_tasks: dict[int, asyncio.Task] = {} # debounce tasks
        self.last_save_time: dict[int, float] = {} # max interval -> force save

    async def connect(self, websocket: WebSocket, doc_id: int, db: Session):
        await websocket.accept()
        self.active_connections.setdefault(doc_id, []).append(websocket)

        if doc_id not in self.doc_contents:
            doc = get_document_by_id(doc_id, db)
            if doc is None:
                return
            self.doc_contents[doc_id] = BlockCache(doc_id, db)

        # debounce
        if doc_id in self.save_tasks:
            self.save_tasks[doc_id].cancel()
        self.save_tasks[doc_id] = asyncio.create_task(
            self.debounce_save(doc_id)
        )

        # send cached initial state
        try:
            await websocket.send_json({
                "type": "init",
                "content": [
                    {
                        "id": id,
                        **self.doc_contents[doc_id].load_block(i) # type: ignore
                    }
                    for i, id in enumerate(self.doc_contents[doc_id].doc_index[:self.INITIAL_LOAD_BLOCKS])
                ]
            })
        except WebSocketDisconnect:
            # remove dead connection
            self.active_connections[doc_id].remove(websocket)
            if not self.active_connections[doc_id]:
                del self.active_connections[doc_id]
                del self.doc_contents[doc_id]
            return

    def disconnect(self, websocket: WebSocket, doc_id: int):
        self.active_connections[doc_id].remove(websocket)
        if len(self.active_connections[doc_id]) == 0:
            self.save_tasks[doc_id].cancel()

    async def broadcast(self, doc_id: int, message: dict, sender: WebSocket):
        print(message)
        # await asyncio.sleep(1)
        for conn in self.active_connections.get(doc_id, []):
            if conn != sender:
                await conn.send_json(message)
        self.doc_contents[doc_id].apply_op(message)

        # max-interval save
        last = self.last_save_time.get(doc_id, 0)
        if time.time() - last > self.MAX_INTERVAL_SAVE:
            self.force_save(doc_id)

    # - save
    async def debounce_save(self, doc_id: int, sec: int=2):
        await asyncio.sleep(sec)
        self.force_save(doc_id)

    def force_save(self, doc_id: int):
        db = SessionLocal()
        try:
            self.doc_contents[doc_id].flush()
        finally:
            db.close()

