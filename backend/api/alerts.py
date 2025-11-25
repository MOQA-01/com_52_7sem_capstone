"""
Alerts API Endpoints
"""
from fastapi import APIRouter, Depends
from typing import List
from pydantic import BaseModel

from api.auth import require_viewer

router = APIRouter()

class Alert(BaseModel):
    id: str
    type: str
    message: str
    status: str

@router.get("/", response_model=List[Alert])
async def get_alerts(current_user = Depends(require_viewer)):
    return []
