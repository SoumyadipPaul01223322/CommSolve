import logging
from fastapi import APIRouter, HTTPException
from app.db.connection import get_db, fetchall_dict, fetchone_dict
from app.models.schemas import QuestionCreate, QuestionResponse, AnswerCreate, AnswerResponse
from app.services.ai_service import ask_ai, verify_answer as ai_verify_answer
from app.routes.notifications import create_notification
from typing import List, Optional

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/", response_model=QuestionResponse)
async def create_question(question: QuestionCreate):
    """Create a new question and auto-generate an AI answer."""
    db = get_db()

    try:
        db.execute(
            """INSERT INTO questions
               (user_id, title, description, category,
                structured_goal, structured_attempted, structured_error)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (question.user_id, question.title, question.description,
             question.category, question.structured_goal,
             question.structured_attempted, question.structured_error),
        )
        db.commit()

        cur = db.execute(
            "SELECT * FROM questions ORDER BY id DESC LIMIT 1"
        )
        row = fetchone_dict(cur)

        # Generate initial AI answer (no FK on user_id for AI answers)
        ai_result = await ask_ai(question.description, f"Category: {question.category}")
        db.execute(
            """INSERT INTO answers (question_id, content, is_ai_generated)
               VALUES (?, ?, ?)""",
            (row["id"], ai_result.answer, 1),
        )
        db.commit()

        return QuestionResponse(**row)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[QuestionResponse])
async def get_questions(category: Optional[str] = None, limit: int = 20):
    """Get all questions with optional filtering."""
    db = get_db()

    if category:
        cur = db.execute(
            "SELECT * FROM questions WHERE category = ? ORDER BY created_at DESC LIMIT ?",
            (category, limit),
        )
    else:
        cur = db.execute(
            "SELECT * FROM questions ORDER BY created_at DESC LIMIT ?",
            (limit,),
        )

    return [QuestionResponse(**r) for r in fetchall_dict(cur)]


@router.get("/{question_id}", response_model=QuestionResponse)
async def get_question(question_id: int):
    """Get a specific question by ID."""
    db = get_db()
    cur = db.execute("SELECT * FROM questions WHERE id = ?", (question_id,))
    row = fetchone_dict(cur)

    if not row:
        raise HTTPException(status_code=404, detail="Question not found")

    return QuestionResponse(**row)


@router.post("/{question_id}/answers", response_model=AnswerResponse)
async def create_answer(question_id: int, answer: AnswerCreate):
    """Submit an answer to a question. AI verifies non-AI answers for spam."""
    db = get_db()

    cur = db.execute("SELECT id, user_id, title, description FROM questions WHERE id = ?", (question_id,))
    question_row = fetchone_dict(cur)
    if not question_row:
        raise HTTPException(status_code=404, detail="Question not found")

    # AI spam verification for community (non-AI) answers
    ai_quality = "good"
    if not answer.is_ai_generated:
        try:
            q_text = f"{question_row['title']}. {question_row['description']}"
            verdict = await ai_verify_answer(q_text, answer.content)
            ai_quality = verdict.get("quality", "unknown")
            if verdict.get("quality") == "spam":
                raise HTTPException(
                    status_code=400,
                    detail=f"Your answer was flagged as spam: {verdict.get('reason', 'Not relevant')}"
                )
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"AI verification failed, allowing answer: {e}")

    try:
        db.execute(
            """INSERT INTO answers (question_id, user_id, content, is_ai_generated)
               VALUES (?, ?, ?, ?)""",
            (question_id, answer.user_id, answer.content, int(answer.is_ai_generated)),
        )
        db.commit()

        cur = db.execute(
            "SELECT * FROM answers WHERE question_id = ? ORDER BY id DESC LIMIT 1",
            (question_id,),
        )
        row = fetchone_dict(cur)

        resp = AnswerResponse(**row)
        resp.ai_quality = ai_quality

        # Notify question owner about new answer
        q_owner = question_row.get("user_id")
        if q_owner and q_owner != answer.user_id:
            create_notification(
                q_owner, "new_answer",
                f"New answer on: {question_row['title'][:50]}",
                answer.content[:100],
                "/questions"
            )

        return resp
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create answer: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{question_id}/answers", response_model=List[AnswerResponse])
async def get_answers(question_id: int):
    """Get all answers for a question."""
    db = get_db()
    cur = db.execute(
        """SELECT * FROM answers
           WHERE question_id = ?
           ORDER BY is_accepted DESC, created_at ASC""",
        (question_id,),
    )
    rows = fetchall_dict(cur)

    return [AnswerResponse(**r) for r in rows]


@router.put("/answers/{answer_id}/accept")
async def accept_answer(answer_id: int):
    """Mark an answer as accepted and award reputation."""
    db = get_db()

    cur = db.execute(
        "SELECT question_id, user_id FROM answers WHERE id = ?", (answer_id,)
    )
    row = fetchone_dict(cur)

    if not row:
        raise HTTPException(status_code=404, detail="Answer not found")

    question_id = row["question_id"]
    user_id = row["user_id"]

    try:
        db.execute("UPDATE answers SET is_accepted = 0 WHERE question_id = ?", (question_id,))
        db.execute("UPDATE answers SET is_accepted = 1 WHERE id = ?", (answer_id,))
        db.execute("UPDATE questions SET status = 'solved' WHERE id = ?", (question_id,))

        if user_id and user_id != 0:
            db.execute("UPDATE users SET reputation = reputation + 10 WHERE id = ?", (user_id,))

        db.commit()
        return {"message": "Answer accepted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
