from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, String, Text, DateTime, Integer
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime
import json

# Create FastAPI app
app = FastAPI(title="Gmail Email Tracker API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Database setup
DATABASE_URL = "sqlite:///./emails.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database model


class Email(Base):
    __tablename__ = "emails"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(String, index=True)
    subject = Column(String)
    sender = Column(String)
    timestamp = Column(String)
    body = Column(Text)
    url = Column(String)
    captured_at = Column(DateTime, default=datetime.utcnow)
    annotations = Column(Text, default="")


# Create database tables
Base.metadata.create_all(bind=engine)

# Pydantic models


class EmailCapture(BaseModel):
    message_id: str | None = None
    subject: str
    sender: str
    timestamp: str
    body: str
    url: str
    captured_at: str


class EmailResponse(BaseModel):
    id: int
    message_id: str
    subject: str
    sender: str
    timestamp: str
    body: str
    url: str
    captured_at: datetime
    annotations: str

    class Config:
        from_attributes = True


@app.post("/capture")
async def capture_email(email_data: EmailCapture):
    """Capture an email from Gmail"""
    print(f"Received capture request: {email_data}")
    db = SessionLocal()
    try:
        # Generate message_id if not provided
        message_id = email_data.message_id
        if not message_id:
            # Create a unique ID from content
            import hashlib
            content_hash = hashlib.md5(
                f"{email_data.subject}-{email_data.sender}-{email_data.timestamp}".encode()).hexdigest()
            message_id = f"gen_{content_hash[:16]}"
            print(f"Generated message_id: {message_id}")

        # Check if email already exists
        existing_email = db.query(Email).filter(
            Email.message_id == message_id).first()
        if existing_email:
            print(f"Email already exists: {message_id}")
            raise HTTPException(
                status_code=400, detail="Email already captured")

        # Create new email record
        db_email = Email(
            message_id=message_id,
            subject=email_data.subject,
            sender=email_data.sender,
            timestamp=email_data.timestamp,
            body=email_data.body,
            url=email_data.url,
            captured_at=datetime.fromisoformat(
                email_data.captured_at.replace('Z', '+00:00'))
        )

        db.add(db_email)
        db.commit()
        db.refresh(db_email)

        print(f"Email captured successfully: {db_email.id}")
        return {
            "id": db_email.id,
            "message_id": db_email.message_id,
            "subject": db_email.subject,
            "sender": db_email.sender,
            "timestamp": db_email.timestamp,
            "body": db_email.body,
            "url": db_email.url,
            "captured_at": db_email.captured_at.isoformat(),
            "annotations": db_email.annotations
        }
    except Exception as e:
        print(f"Error capturing email: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.get("/emails")
async def get_emails():
    """Get all captured emails"""
    db = SessionLocal()
    try:
        emails = db.query(Email).order_by(Email.captured_at.desc()).all()
        return [
            {
                "id": email.id,
                "message_id": email.message_id,
                "subject": email.subject,
                "sender": email.sender,
                "timestamp": email.timestamp,
                "body": email.body,
                "url": email.url,
                "captured_at": email.captured_at.isoformat(),
                "annotations": email.annotations
            }
            for email in emails
        ]
    finally:
        db.close()


@app.get("/emails/{email_id}")
async def get_email(email_id: int):
    """Get a specific email by ID"""
    db = SessionLocal()
    try:
        email = db.query(Email).filter(Email.id == email_id).first()
        if not email:
            raise HTTPException(status_code=404, detail="Email not found")
        return {
            "id": email.id,
            "message_id": email.message_id,
            "subject": email.subject,
            "sender": email.sender,
            "timestamp": email.timestamp,
            "body": email.body,
            "url": email.url,
            "captured_at": email.captured_at.isoformat(),
            "annotations": email.annotations
        }
    finally:
        db.close()


@app.put("/emails/{email_id}")
async def update_email(email_id: int, annotations: str):
    """Update email annotations"""
    db = SessionLocal()
    try:
        email = db.query(Email).filter(Email.id == email_id).first()
        if not email:
            raise HTTPException(status_code=404, detail="Email not found")

        email.annotations = annotations
        db.commit()
        return {"message": "Email updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.delete("/emails/{email_id}")
async def delete_email(email_id: int):
    """Delete an email"""
    db = SessionLocal()
    try:
        email = db.query(Email).filter(Email.id == email_id).first()
        if not email:
            raise HTTPException(status_code=404, detail="Email not found")

        db.delete(email)
        db.commit()
        return {"message": "Email deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Gmail Email Tracker API", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn

    # Run with HTTP for development
    print("Starting Gmail Email Tracker API on http://localhost:8000")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000
    )
