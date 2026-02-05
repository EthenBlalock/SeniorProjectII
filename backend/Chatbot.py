import os
import google.generativeai as genai
from dotenv import load_dotenv
load_dotenv()

genai.configure(api_key=os.getenv("GENAI_API_KEY"))

generation_config = {
    "temperature": 1,
    "response_mime_type": "text/plain",
    "top_p": 0.95,
    "top_k": 1,
}

model = genai.GenerativeModel(
    model_name = "gemini-3-flash-preview",
    generation_config = generation_config,
    system_instruction = "You are a Stock expert that will be teaching/assisting students about stocks and giving them "
                       "helpful tips, tricks, and ideas. Your task is to engage with students and have meaningful and "
                       "helpful conversations. You should inform them about topics they have questions about and "
                       "explain in further detail things that may be confusing to them so that it is easy to "
                        "understand.Suggest ways that they will be able to better understand these topics. "
                       "Lastly, make these lessons educational and interesting and being nice overall. "

)

history = []

print("Bot: Hello, How can I help you?")

while True:
    user_input = input("You: ")

    chat_session = model.start_chat(
        history = history
    )

    response = chat_session.send_message(user_input)
    model_response = response.text

    print(f'Bot: {model_response}')
    print()

    history.append({"role" : "user", "parts" : [user_input]})
    history.append({"role" : "model", "parts" : [model_response]})

#if __name__ == "__main__":
#    generate()
