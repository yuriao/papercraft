import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, JSON
from database import Base

def new_uuid():
    return str(uuid.uuid4())

class PaperModel(Base):
    __tablename__ = 'papers'
    id = Column(String, primary_key=True, default=new_uuid)
    title = Column(String, default='Untitled Paper')
    authors = Column(JSON, default=list)
    abstract = Column(Text, default='')
    content = Column(JSON, default=dict)
    figures = Column(JSON, default=list)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))
