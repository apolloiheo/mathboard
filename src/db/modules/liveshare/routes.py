from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from db.modules.liveshare.connection_manager import ConnectionManager

manager = ConnectionManager()

router = APIRouter()

@router.websocket("/ws/docs/{doc_id}")
async def websocket_endpoint(websocket: WebSocket, doc_id: int):
    await manager.connect(websocket, doc_id)

    try:
        while True:
            data = await websocket.receive_json()
            print("received:", data)

            # broadcast to ALL other users
            await manager.broadcast(doc_id, data)

    except WebSocketDisconnect:
        manager.disconnect(websocket, doc_id)
