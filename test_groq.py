import os
from groq import Groq

# Use the key you provided
API_KEY = "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"
client = Groq(api_key=API_KEY)

print("🔍 Testing Groq Connectivity from PythonAnywhere...")

try:
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "user", "content": "Hello! Are you online?"}
        ],
        max_tokens=10
    )
    print("✅ Groq is Reachable! Response:")
    print(completion.choices[0].message.content)
except Exception as e:
    print("❌ Groq Connectivity Failed!")
    print(f"Error: {str(e)}")
    print("\n💡 Tip: If you are on the FREE tier of PythonAnywhere, you cannot connect to external APIs like Groq.")
    print("You need a paid PythonAnywhere account OR to run the server locally using the instructions I provided.")
