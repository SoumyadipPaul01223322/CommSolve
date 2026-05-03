from fastapi import APIRouter, HTTPException
from app.models.schemas import AnalyzeRequest, AnalyzeResponse, AskAIRequest, AIResponse, StructureQuestionRequest, StructuredQuestion
from app.services.ai_service import analyze_intent, ask_ai, structure_question

router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    """Analyze user input and return structured intent."""
    try:
        result = await analyze_intent(request.input)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ask-ai", response_model=AIResponse)
async def ask_ai_endpoint(request: AskAIRequest):
    """Get AI-generated answer for a question."""
    try:
        result = await ask_ai(request.question, request.context or "")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/structure-question", response_model=StructuredQuestion)
async def structure_question_endpoint(request: StructureQuestionRequest):
    """Convert messy input into structured question format."""
    try:
        result = await structure_question(request.input)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
