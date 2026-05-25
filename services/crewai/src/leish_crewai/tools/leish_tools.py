from typing import Type
from crewai.tools import BaseTool
from pydantic import BaseModel, Field

class FetchLeishDataInput(BaseModel):
    query: str = Field(..., description="Query for data from Leish marketplace")

class FetchLeishDataTool(BaseTool):
    name: str = "fetch_leish_data"
    description: str = "Fetches marketplace data from Leish database."
    args_schema: Type[BaseModel] = FetchLeishDataInput
    def _run(self, query: str) -> str:
        return f"[Data for: {query}]"

class SendNotificationInput(BaseModel):
    message: str = Field(..., description="Notification message")
    channel: str = Field(default="email", description="email or log")

class SendNotificationTool(BaseTool):
    name: str = "send_notification"
    description: str = "Sends a notification for human attention."
    args_schema: Type[BaseModel] = SendNotificationInput
    def _run(self, message: str, channel: str = "email") -> str:
        return f"[Notification via {channel}: {message}]"
