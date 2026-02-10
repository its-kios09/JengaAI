"""FastAPI dependency injection utilities."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.core.security import decode_token

security_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Decode JWT and return the current user from DB.

    Uncomment the DB lookup once the User model is built.
    """
    payload = decode_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject claim",
        )

    # TODO: Uncomment when User model is built
    # from backend.app.models.user import User
    # user = await db.get(User, user_id)
    # if user is None:
    #     raise HTTPException(status_code=404, detail="User not found")
    # return user

    return {"id": user_id, **payload}
