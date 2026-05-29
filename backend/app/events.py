import json
from dataclasses import dataclass


@dataclass
class SSEEvent:
    type: str  # thinking|message|tool_call|ticket_created|search_results|tasks_updated|done|error
    content: str

    def to_sse(self) -> str:
        return f"data: {json.dumps({'type': self.type, 'content': self.content})}\n\n"
