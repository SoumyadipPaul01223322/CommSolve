import json
import logging
import re
import httpx
from typing import Dict, Any
from app.config import settings
from app.models.schemas import AnalyzeResponse, AIResponse, StructuredQuestion

logger = logging.getLogger(__name__)


async def call_ai(prompt: str, system_prompt: str = "You are a helpful assistant for non-technical users.") -> Dict[str, Any]:
    """Send request to OpenRouter API and return response."""
    if not settings.OPENROUTER_API_KEY:
        return {"error": "OpenRouter API key not configured"}

    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "CommSolve",
    }

    payload = {
        "model": settings.OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.7,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                settings.OPENROUTER_API_URL, headers=headers, json=payload
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"OpenRouter API call failed: {e}")
            return {"error": str(e)}


def _extract_json(text: str) -> dict | None:
    """Robustly extract the first JSON object from LLM output."""
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    return None


async def analyze_intent(user_input: str) -> AnalyzeResponse:
    """Convert raw user input into structured problem analysis."""
    prompt = f"""Analyze the user's problem and return a JSON response with:
- goal: Clear statement of what they want to achieve
- category: One of: "Online Presence", "Sell Something", "Organize Community", "Automate Something", "Fix Something"
- difficulty: "Beginner", "Intermediate", or "Advanced"
- suggestions: Array of 2-3 specific suggestions

User input: {user_input}

Return ONLY valid JSON, no other text."""
    
    response = await call_ai(prompt, "You are a technical analyst helping non-technical users.")
    
    fallback = AnalyzeResponse(
        goal="Analyze your goal",
        category="Online Presence",
        difficulty="Beginner",
        suggestions=["Tell us more about what you need"],
    )

    if "error" in response:
        logger.warning(f"AI analyze_intent error: {response['error']}")
        return fallback

    try:
        content = response["choices"][0]["message"]["content"]
        logger.info(f"AI analyze raw content: {content[:300]}")
        data = _extract_json(content)
        if data:
            return AnalyzeResponse(**data)
        logger.warning("Could not extract JSON from AI response")
        return fallback
    except Exception as e:
        logger.error(f"analyze_intent parsing failed: {e}")
        return fallback


async def ask_ai(question: str, context: str = "") -> AIResponse:
    """Provide initial AI solution before community help."""
    prompt = f"""Help solve this technical problem. Provide a clear, step-by-step solution.
Keep it simple and beginner-friendly.

Question: {question}
Context: {context}

Return your answer with a confidence score (0-1) at the end in format: [CONFIDENCE: 0.XX]"""
    
    response = await call_ai(prompt, "You are a helpful technical guide for beginners.")
    
    if "error" in response:
        return AIResponse(answer="AI service unavailable. Please ask the community.", confidence=0.0)

    try:
        content = response["choices"][0]["message"]["content"]
        confidence = 0.7

        if "[CONFIDENCE:" in content:
            parts = content.split("[CONFIDENCE:")
            answer = parts[0].strip()
            try:
                confidence = float(parts[1].split("]")[0].strip())
            except (ValueError, IndexError):
                pass
        else:
            answer = content

        return AIResponse(answer=answer, confidence=min(max(confidence, 0.0), 1.0))
    except Exception:
        return AIResponse(answer="Could not process AI response.", confidence=0.0)


async def verify_answer(question: str, answer: str) -> dict:
    """AI verifies if an answer is relevant and not spam."""
    prompt = f"""You are a content moderator. Analyze if this answer is relevant, helpful, and not spam.

Question: {question}
Answer: {answer}

Return ONLY valid JSON:
{{"is_valid": true/false, "reason": "brief explanation", "quality": "good"/"low"/"spam"}}"""

    response = await call_ai(prompt, "You are a strict content moderator. Be concise.")

    fallback = {"is_valid": True, "reason": "Could not verify", "quality": "unknown"}

    if "error" in response:
        return fallback

    try:
        content = response["choices"][0]["message"]["content"]
        data = _extract_json(content)
        if data:
            return data
        return fallback
    except Exception:
        return fallback


async def structure_question(user_input: str) -> StructuredQuestion:
    """Convert messy input into structured question format."""
    prompt = f"""Convert this messy problem description into a structured format:
- goal: What they're trying to achieve
- attempted: What they've already tried
- error: The error or problem they're facing
- possible_causes: Array of 2-3 possible causes

User input: {user_input}

Return ONLY valid JSON, no other text."""
    
    response = await call_ai(prompt, "You are a technical support specialist.")
    
    fallback = StructuredQuestion(
        goal=user_input,
        attempted="Not specified",
        error="Not specified",
        possible_causes=["Need more information"],
    )

    if "error" in response:
        return fallback

    try:
        content = response["choices"][0]["message"]["content"]
        data = _extract_json(content)
        if data:
            return StructuredQuestion(**data)
        return fallback
    except Exception:
        return fallback
