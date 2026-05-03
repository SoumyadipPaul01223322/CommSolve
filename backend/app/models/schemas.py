from pydantic import BaseModel, Field
from typing import Optional, List


# ─── AI Schemas ────────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    input: str = Field(..., min_length=3, description="Raw user problem description")


class AnalyzeResponse(BaseModel):
    goal: str
    category: str
    difficulty: str
    suggestions: List[str]


class AskAIRequest(BaseModel):
    question: str = Field(..., min_length=3, description="User question for AI")
    context: Optional[str] = None


class AIResponse(BaseModel):
    answer: str
    confidence: float = Field(..., ge=0.0, le=1.0)


class StructureQuestionRequest(BaseModel):
    input: str = Field(..., min_length=3)


class StructuredQuestion(BaseModel):
    goal: str
    attempted: str
    error: str
    possible_causes: List[str]


# ─── Question / Answer Schemas ─────────────────────────────────────────────────

class QuestionCreate(BaseModel):
    user_id: str = Field(default="1", description="ID of the asking user")
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10)
    category: str
    structured_goal: Optional[str] = None
    structured_attempted: Optional[str] = None
    structured_error: Optional[str] = None


class QuestionResponse(BaseModel):
    id: int
    user_id: Optional[str] = None
    title: str
    description: str
    category: Optional[str] = None
    status: Optional[str] = "open"
    structured_goal: Optional[str] = None
    structured_attempted: Optional[str] = None
    structured_error: Optional[str] = None
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}


class AnswerCreate(BaseModel):
    user_id: str = Field(default="1", description="ID of the answering user")
    content: str = Field(..., min_length=1)
    is_ai_generated: bool = False


class AnswerResponse(BaseModel):
    id: int
    question_id: Optional[int] = None
    content: str
    is_accepted: bool = False
    is_ai_generated: bool = False
    ai_quality: Optional[str] = None
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}


# ─── Template / Build Path Schemas ─────────────────────────────────────────────

class TemplateCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    category: str
    difficulty: str
    stack: str
    author_id: int = 1


class TemplateResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    category: str
    difficulty: Optional[str] = None
    stack: Optional[str] = None
    usage_count: int = 0

    model_config = {"from_attributes": True}
