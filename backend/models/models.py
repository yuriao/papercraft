import json
from datetime import datetime
from sqlalchemy import String, Text, Integer, Float, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database import Base


class Paper(Base):
    __tablename__ = "papers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    title: Mapped[str] = mapped_column(String(500), default="")
    authors_json: Mapped[str] = mapped_column(Text, default="[]")
    abstract: Mapped[str] = mapped_column(Text, default="")
    content_json: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    figures: Mapped[list["Figure"]] = relationship(
        "Figure", back_populates="paper", cascade="all, delete-orphan", order_by="Figure.number"
    )

    @property
    def authors(self) -> list[str]:
        return json.loads(self.authors_json or "[]")

    @authors.setter
    def authors(self, value: list[str]):
        self.authors_json = json.dumps(value)

    @property
    def content(self) -> dict:
        return json.loads(self.content_json or "{}")

    @content.setter
    def content(self, value: dict):
        self.content_json = json.dumps(value)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "authors": self.authors,
            "abstract": self.abstract,
            "content": self.content,
            "figures": [f.to_dict() for f in self.figures],
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class Figure(Base):
    __tablename__ = "figures"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    paper_id: Mapped[str] = mapped_column(String(36), ForeignKey("papers.id"))
    number: Mapped[int] = mapped_column(Integer, default=1)
    title: Mapped[str] = mapped_column(String(500), default="")
    legend: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    paper: Mapped["Paper"] = relationship("Paper", back_populates="figures")
    panels: Mapped[list["Panel"]] = relationship(
        "Panel", back_populates="figure", cascade="all, delete-orphan", order_by="Panel.label"
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "paperId": self.paper_id,
            "number": self.number,
            "title": self.title,
            "legend": self.legend,
            "panels": [p.to_dict() for p in self.panels],
        }


class Panel(Base):
    __tablename__ = "panels"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    figure_id: Mapped[str] = mapped_column(String(36), ForeignKey("figures.id"))
    label: Mapped[str] = mapped_column(String(10), default="A")
    code: Mapped[str] = mapped_column(Text, default="")
    data_file: Mapped[str | None] = mapped_column(String(500), nullable=True)
    plotly_data_json: Mapped[str] = mapped_column(Text, default="[]")
    plotly_layout_json: Mapped[str] = mapped_column(Text, default="{}")
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    figure: Mapped["Figure"] = relationship("Figure", back_populates="panels")
    data_files: Mapped[list["DataFile"]] = relationship(
        "DataFile", back_populates="panel", cascade="all, delete-orphan"
    )

    @property
    def plotly_data(self) -> list:
        return json.loads(self.plotly_data_json or "[]")

    @plotly_data.setter
    def plotly_data(self, value: list):
        self.plotly_data_json = json.dumps(value)

    @property
    def plotly_layout(self) -> dict:
        return json.loads(self.plotly_layout_json or "{}")

    @plotly_layout.setter
    def plotly_layout(self, value: dict):
        self.plotly_layout_json = json.dumps(value)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "figureId": self.figure_id,
            "label": self.label,
            "code": self.code,
            "dataFile": self.data_file,
            "plotlyData": self.plotly_data,
            "plotlyLayout": self.plotly_layout,
            "imageUrl": self.image_url,
        }


class DataFile(Base):
    __tablename__ = "data_files"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    panel_id: Mapped[str] = mapped_column(String(36), ForeignKey("panels.id"))
    filename: Mapped[str] = mapped_column(String(500))
    original_name: Mapped[str] = mapped_column(String(500))
    file_path: Mapped[str] = mapped_column(String(1000))
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    panel: Mapped["Panel"] = relationship("Panel", back_populates="data_files")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "panelId": self.panel_id,
            "filename": self.filename,
            "originalName": self.original_name,
            "uploadedAt": self.uploaded_at.isoformat() if self.uploaded_at else None,
        }
