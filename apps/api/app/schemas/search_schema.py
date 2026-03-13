#apps/api/app/schemas/search_schema.py

from pydantic import BaseModel
from typing import Optional


class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str
    source: Optional[str] = None