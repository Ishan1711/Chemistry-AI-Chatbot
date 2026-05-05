# api.py


import os
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def is_small_talk(message):
    msg = message.lower().strip()
    greetings = ["hi", "hello", "hey", "hii", "good morning", "good evening"]
    return any(greet in msg for greet in greetings)


def get_reply(message, mode="general"):
    try:
        # 👉 HANDLE NORMAL CONVERSATION
        if mode == "general" and is_small_talk(message):
            return "Hello! 👋 I'm your Chemistry AI. Ask me anything about chemistry."

        system_prompts = {
            "general": "You are a Chemistry expert AI.",
            "inorganic": "You are an Inorganic Chemistry expert AI. Answer ONLY in the context of inorganic chemistry.",
            "organic": "You are an Organic Chemistry expert AI. Answer ONLY in the context of organic chemistry.",
            "reaction": "You are a Chemical Reaction expert AI. Explain chemical reactions clearly, focusing on mechanism or steps in simple terms.",
            "difference": "You are a Chemistry comparison AI. Return structured differences (point-wise comparison) between the two provided topics."
        }

        base_prompt = system_prompts.get(mode, system_prompts["general"])

        full_system_prompt = (
            f"{base_prompt}\n\n"
            "STRICT RULES:\n"
            "1. Answer ONLY chemistry related questions.\n"
            "2. Provide clear, slightly detailed but concise answers.\n"
            "3. ALWAYS format your responses using bullet points (using *).\n"
            "4. Each point MUST be on a new line.\n"
            "5. Do NOT write long single-line paragraphs.\n"
        )
        
        if mode == "difference":
            full_system_prompt += (
                "6. For this mode, you MUST use exactly this structure:\n"
                "Component 1 (Name):\n"
                "* Point 1\n"
                "* Point 2\n\n"
                "Component 2 (Name):\n"
                "* Point 1\n"
                "* Point 2\n\n"
                "Differences:\n"
                "* Difference 1\n"
                "* Difference 2\n"
            )

        # 👉 CHEMISTRY RESPONSE
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": full_system_prompt
                },
                {
                    "role": "user",
                    "content": message
                }
            ],
            temperature=0.3
        )

        reply = response.choices[0].message.content

        # 🔥 CLEAN FORMAT
        return reply.strip()

    except Exception as e:
        return f"API Error: {str(e)}"