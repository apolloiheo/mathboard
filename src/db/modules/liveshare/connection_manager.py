
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, doc_id: int):
        await websocket.accept()
        self.active_connections.setdefault(doc_id, []).append(websocket)

    def disconnect(self, websocket: WebSocket, doc_id: int):
        self.active_connections[doc_id].remove(websocket)

    async def broadcast(self, doc_id: int, message: dict):
        for connection in self.active_connections.get(doc_id, []):
            await connection.send_json(message)