
import asyncio
import time

from fastapi import WebSocket
from sqlalchemy.orm import Session

from db.database import SessionLocal
from db.modules.docs.crud import get_document_by_id
from db.modules.liveshare.op import apply_op

class ConnectionManager:
    MAX_INTERVAL_SAVE = 5

    def __init__(self):
        self.active_connections: dict[int, list[WebSocket]] = {}
        self.doc_contents: dict[int, str] = {}

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
            self.doc_contents[doc_id] = doc.text

        # debounce
        if doc_id in self.save_tasks:
            self.save_tasks[doc_id].cancel()
        self.save_tasks[doc_id] = asyncio.create_task(
            self.debounce_save(doc_id)
        )

        # max-interval save
        last = self.last_save_time.get(doc_id, 0)
        now = time.time()

        if now - last > self.MAX_INTERVAL_SAVE:
            db2 = SessionLocal()
            try:
                doc = get_document_by_id(doc_id, db2)
                if doc is None:
                    return
                doc.text = self.doc_contents[doc_id]
                db2.commit()
                self.last_save_time[doc_id] = now
            finally:
                db2.close()

    def disconnect(self, websocket: WebSocket, doc_id: int):
        self.active_connections[doc_id].remove(websocket)
        if len(self.active_connections[doc_id]) == 0:
            self.save_tasks[doc_id].cancel()

    async def broadcast(self, doc_id: int, message: dict, sender: WebSocket):
        for conn in self.active_connections.get(doc_id, []):
            if conn != sender:
                await conn.send_json(message)
        self.doc_contents[doc_id] = apply_op(self.doc_contents[doc_id], message)

    # - util
    async def debounce_save(self, doc_id: int, sec: int=2):
        await asyncio.sleep(sec)

        db = SessionLocal()
        try:
            doc = get_document_by_id(doc_id, db)
            if doc is None:
                return
            doc.text = self.doc_contents[doc_id]
            db.commit()
        finally:
            db.close()
