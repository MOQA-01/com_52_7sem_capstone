"""
Assets API Endpoints
"""
from fastapi import APIRouter, Depends
from typing import List
from pydantic import BaseModel

from api.auth import require_viewer

router = APIRouter()

class Asset(BaseModel):
    id: str
    name: str
    type: str
    status: str

@router.get("/", response_model=List[Asset])
async def get_assets(current_user = Depends(require_viewer)):
    return []
