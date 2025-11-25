"""
Authentication and Authorization with JWT and Role-Based Access Control (RBAC)
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
import logging

from config import settings

logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

router = APIRouter()

# ==========================================
# MODELS
# ==========================================

class User(BaseModel):
    id: str
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    role: str  # admin, operator, viewer, citizen
    is_active: bool = True

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: str = "viewer"

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: User

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

# ==========================================
# PASSWORD UTILITIES
# ==========================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash password"""
    return pwd_context.hash(password)

# ==========================================
# JWT TOKEN UTILITIES
# ==========================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> dict:
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# ==========================================
# USER AUTHENTICATION
# ==========================================

# Mock user database (replace with actual database)
fake_users_db = {
    "admin": {
        "id": "1",
        "username": "admin",
        "email": "admin@jaljeevan.gov.in",
        "full_name": "System Administrator",
        "hashed_password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILuxW6G8K",  # admin123
        "role": "admin",
        "is_active": True
    },
    "operator": {
        "id": "2",
        "username": "operator",
        "email": "operator@jaljeevan.gov.in",
        "full_name": "Field Operator",
        "hashed_password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILuxW6G8K",  # admin123
        "role": "operator",
        "is_active": True
    },
    "viewer": {
        "id": "3",
        "username": "viewer",
        "email": "viewer@jaljeevan.gov.in",
        "full_name": "Data Viewer",
        "hashed_password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILuxW6G8K",  # admin123
        "role": "viewer",
        "is_active": True
    }
}

def get_user(username: str) -> Optional[dict]:
    """Get user from database"""
    return fake_users_db.get(username)

def authenticate_user(username: str, password: str) -> Optional[dict]:
    """Authenticate user with username and password"""
    user = get_user(username)
    if not user:
        return None
    if not verify_password(password, user["hashed_password"]):
        return None
    return user

# ==========================================
# DEPENDENCY FUNCTIONS
# ==========================================

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Get current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(token)
        username: str = payload.get("sub")
        role: str = payload.get("role")

        if username is None:
            raise credentials_exception

        token_data = TokenData(username=username, role=role)
    except JWTError:
        raise credentials_exception

    user = get_user(username=token_data.username)
    if user is None:
        raise credentials_exception

    return User(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        full_name=user.get("full_name"),
        role=user["role"],
        is_active=user["is_active"]
    )

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Ensure current user is active"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# ==========================================
# ROLE-BASED ACCESS CONTROL
# ==========================================

class RoleChecker:
    """Dependency to check user role"""

    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_active_user)):
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required roles: {self.allowed_roles}"
            )
        return user

# Role dependencies
require_admin = RoleChecker(["admin"])
require_operator = RoleChecker(["admin", "operator"])
require_viewer = RoleChecker(["admin", "operator", "viewer"])

# ==========================================
# AUTHENTICATION ENDPOINTS
# ==========================================

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login endpoint - returns JWT tokens"""
    user = authenticate_user(form_data.username, form_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create tokens
    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"]}
    )
    refresh_token = create_refresh_token(
        data={"sub": user["username"], "role": user["role"]}
    )

    user_obj = User(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        full_name=user.get("full_name"),
        role=user["role"],
        is_active=user["is_active"]
    )

    logger.info(f"User logged in: {user['username']}")

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_obj
    )

@router.post("/refresh", response_model=Token)
async def refresh_token(refresh_token: str):
    """Refresh access token using refresh token"""
    try:
        payload = decode_token(refresh_token)

        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )

        username = payload.get("sub")
        role = payload.get("role")

        user = get_user(username)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        # Create new tokens
        new_access_token = create_access_token(
            data={"sub": username, "role": role}
        )
        new_refresh_token = create_refresh_token(
            data={"sub": username, "role": role}
        )

        user_obj = User(
            id=user["id"],
            username=user["username"],
            email=user["email"],
            full_name=user.get("full_name"),
            role=user["role"],
            is_active=user["is_active"]
        )

        return Token(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            user=user_obj
        )

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

@router.get("/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    return current_user

@router.post("/register", response_model=User, dependencies=[Depends(require_admin)])
async def register_user(user_data: UserCreate):
    """Register new user (admin only)"""
    # Check if user exists
    if get_user(user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    # Hash password
    hashed_password = get_password_hash(user_data.password)

    # Create user (store in database)
    new_user = {
        "id": str(len(fake_users_db) + 1),
        "username": user_data.username,
        "email": user_data.email,
        "full_name": user_data.full_name,
        "hashed_password": hashed_password,
        "role": user_data.role,
        "is_active": True
    }

    fake_users_db[user_data.username] = new_user

    logger.info(f"New user registered: {user_data.username}")

    return User(
        id=new_user["id"],
        username=new_user["username"],
        email=new_user["email"],
        full_name=new_user.get("full_name"),
        role=new_user["role"],
        is_active=new_user["is_active"]
    )

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_active_user)):
    """Logout (invalidate token - implement token blacklist in production)"""
    logger.info(f"User logged out: {current_user.username}")
    return {"message": "Successfully logged out"}
