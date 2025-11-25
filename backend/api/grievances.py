"""
Grievances API Endpoints
"""
from fastapi import APIRouter, Depends
from typing import List
from pydantic import BaseModel

from api.auth import require_viewer

router = APIRouter()

class Grievance(BaseModel):
    id: str
    grievance_number: str
    category: str
    title: str
    description: str
    priority: str
    status: str

@router.get("/", response_model=List[Grievance])
async def get_grievances(current_user = Depends(require_viewer)):
    return []
