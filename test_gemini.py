import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
key = os.getenv("GEMINI_API_KEY")
print("Key from env:", key)

genai.configure(api_key=key)

print("google-generativeai version:", genai.__version__)

model = genai.GenerativeModel("models/gemini-2.5-flash")

resp = model.generate_content("Say 'hello from Gemini' in one short sentence.")
print("Gemini reply:", resp.text)
