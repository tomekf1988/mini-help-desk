import datetime
from pathlib import Path

from langchain_core.prompts import PromptTemplate

from app.agent_tools import CREATE_TICKET_EXAMPLES, SEARCH_TICKETS_EXAMPLES

_template = PromptTemplate.from_file(Path(__file__).parent / "assistant.md")


def get_system_prompt() -> str:
    today = datetime.date.today()
    tomorrow = today + datetime.timedelta(days=1)
    tomorrow_str = tomorrow.isoformat()
    return _template.format(
        today=today.isoformat(),
        tomorrow=tomorrow_str,
        create_ticket_examples=CREATE_TICKET_EXAMPLES.format(tomorrow=tomorrow_str),
        search_tickets_examples=SEARCH_TICKETS_EXAMPLES.format(tomorrow=tomorrow_str),
    )
