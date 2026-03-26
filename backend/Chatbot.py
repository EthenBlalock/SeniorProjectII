import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()


class ChatBot:
    system_instruction = """
    You are an AI tutor for a student investing education platform.

    Your goal:
    - Give clear, beginner-friendly answers
    - Keep responses SHORT by default (2-3 sentences max)
    - Use simple language and explain jargon when needed
    - Never write long paragraphs unless the student asks for more detail

    How to decide length:
    - If the question is basic, give a short, simple explanation
    - If the student asks "why", "how", or "explain more", go slightly deeper
    - If they ask for details, you may expand

    Formatting rules:
    - Avoid essays
    - Get straight to the point
    - Use short bullets when they help

    Context:
    This app teaches investing through paper trading, charts, market data, and AI tutoring for students.
    """

    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY is missing. Check your .env file.")

        self.client = OpenAI(api_key=api_key)
        self.model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
        self.history = []

    def get_response(self, user_input: str) -> str:
        """
        Main method the backend calls.
        Takes user input, sends the full chat history, and returns plain text.
        """
        if not user_input or not user_input.strip():
            return "Please type a message so I can help."

        input_messages = [
            *self.history,
            {
                "role": "user",
                "content": user_input,
            },
        ]

        response = self.client.responses.create(
            model=self.model,
            instructions=self.system_instruction,
            input=input_messages,
        )
        model_response = (response.output_text or "").strip()

        if not model_response:
            model_response = "I'm sorry, I couldn't generate a response right now."

        self._append_history(user_input, model_response)
        return model_response

    def set_history(self, history: list):
        """
        Optional: restore history from storage using OpenAI Responses input format.
        """
        self.history = history or []

    def clear_history(self):
        self.history = []

    def _append_history(self, user_input: str, model_response: str):
        self.history.append(
            {
                "role": "user",
                "content": user_input,
            }
        )
        self.history.append(
            {
                "role": "assistant",
                "content": model_response,
            }
        )
