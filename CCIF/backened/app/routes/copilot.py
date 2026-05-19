import json
import os
import urllib.error
import urllib.request

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class CopilotQuery(BaseModel):
    query: str


@router.post("/query")
def copilot_query(payload: CopilotQuery):
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Missing ANTHROPIC_API_KEY environment variable")

    completion_payload = {
        "model": "claude-sonnet-4-20250514",
        "prompt": f"\n\nHuman: {payload.query}\n\nAssistant:",
        "max_tokens_to_sample": 1000,
        "temperature": 0.2,
    }

    request = urllib.request.Request(
        "https://api.anthropic.com/v1/complete",
        data=json.dumps(completion_payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "X-API-Key": api_key,
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            response_body = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        try:
            error_text = exc.read().decode("utf-8")
        except Exception:
            error_text = str(exc)
        raise HTTPException(status_code=exc.code, detail=error_text)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    try:
        payload_data = json.loads(response_body)
        completion_text = payload_data.get("completion", "")
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Unable to decode response from Anthropic")

    return {"query": payload.query, "response": completion_text}
