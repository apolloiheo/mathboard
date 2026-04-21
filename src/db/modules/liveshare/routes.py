from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect

from sqlalchemy.orm import Session

from db.database import get_db
from db.modules.docs.schemas import DocumentUpdate
from db.modules.docs.services import update_doc_text__check_permissions, user_can_write_document
from db.modules.liveshare.connection_manager import ConnectionManager
from db.modules.users.schemas import UserPrivateResponse
from db.modules.users.services import get_current_user_ws

manager = ConnectionManager()

router = APIRouter()

@router.websocket("/ws/docs/{doc_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    doc_id: int,

    db: Session = Depends(get_db),
    current_user_id: int|None = Depends(get_current_user_ws),
):
    await manager.connect(websocket, doc_id)

    try:
        while True:
            data = await websocket.receive_json()
            print("received:", data)

            # broadcast to ALL other users
            if current_user_id and user_can_write_document(doc_id, current_user_id, db):
                await manager.broadcast(doc_id, data)

                update_doc_text__check_permissions(
                    doc_id,
                    current_user_id,
                    DocumentUpdate.model_validate({"text": data["content"]}),
                    db
                )

                

    except WebSocketDisconnect:
        manager.disconnect(websocket, doc_id)
