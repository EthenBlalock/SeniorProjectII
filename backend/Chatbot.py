import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()


class ChatBot:
    # Keep your config format (class constant style)
    generation_config = {
        "temperature": 1,
        "response_mime_type": "text/plain",
        "top_p": 0.95,
        "top_k": 1,
    }

    system_instruction = (
        """
        You are an AI tutor for a student investing education platform.

        Your goal:
        - Give clear, beginner-friendly answers
        - Keep responses SHORT by default (2–3 sentences max)
        - Use simple language — no jargon unless explained
        - Never write long paragraphs unless the student asks for more detail

        How to decide length:
        - If the question is basic → give a short, simple explanation
        - If the student asks "why", "how", or "explain more" → go slightly deeper
        - If they ask for details → you may expand

        Formatting rules:
        - Avoid essays
        - Get straight to the point

        Example:

        Q: What is a mutual fund?  
        A:
        • A mutual fund pools money from many investors  
        • It invests in stocks, bonds, or both  
        • It spreads risk so you don’t rely on one company

        Context:
        This app teaches investing through paper trading, charts, market data, and AI tutoring for students.
        """
    )

    def __init__(self):
        # Configure once when an instance is created
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is missing. Check your .env file.")

        genai.configure(api_key=api_key)

        self.model = genai.GenerativeModel(
            model_name="gemini-3-flash-preview",
            generation_config=self.generation_config,
            system_instruction=self.system_instruction,
        )

        # Per-instance conversation state
        self.history = []
        self.chat_session = self.model.start_chat(history=self.history)

    def get_response(self, user_input: str) -> str:
        """
        Main method your frontend/backend should call.
        Takes user_input -> sends to model -> returns model text.
        """
        if not user_input or not user_input.strip():
            return "Please type a message so I can help."

        response = self.chat_session.send_message(user_input)
        model_response = response.text

        # Keep your history update idea
        self._append_history(user_input, model_response)

        return model_response

    def set_history(self, history: list):
        """
        Optional: if you want to restore history from a DB or frontend.
        Must match the structure Gemini expects.
        """
        self.history = history or []
        self.chat_session = self.model.start_chat(history=self.history)

    def clear_history(self):
        self.history = []
        self.chat_session = self.model.start_chat(history=self.history)

    def _append_history(self, user_input: str, model_response: str):
        self.history.append({"role": "user", "parts": [user_input]})
        self.history.append({"role": "model", "parts": [model_response]})


#if __name__ == "__main__":
#    generate()
