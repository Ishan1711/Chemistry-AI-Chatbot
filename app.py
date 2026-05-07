from dotenv import load_dotenv
load_dotenv()
import json
import os
from datetime import datetime
from flask import Flask, request, jsonify, render_template
from api import get_reply

app = Flask(__name__)

DATA_FILE = "data/chats.json"

# ensure file exists
if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, "w") as f:
        json.dump([], f)

def load_data():
    with open(DATA_FILE, "r") as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/get_chats")
def get_chats():
    return jsonify(load_data())

@app.route("/new_chat", methods=["POST"])
def new_chat():
    chats = load_data()

    chat = {
        "id": int(datetime.now().timestamp()),
        "title": "New Chat",
        "messages": []
    }

    chats.insert(0, chat)
    save_data(chats)

    return jsonify(chat)

@app.route("/save_message", methods=["POST"])
def save_message():
    data = request.json
    chats = load_data()

    for chat in chats:
        if chat["id"] == data["id"]:
            time_now = datetime.now().strftime("%I:%M %p")

            chat["messages"].append({
                "role": "user",
                "text": data["user"],
                "time": time_now
            })

            chat["messages"].append({
                "role": "ai",
                "text": data["ai"],
                "time": time_now
            })

            if chat["title"] == "New Chat":
                chat["title"] = data["user"][:25]

    save_data(chats)
    return jsonify({"status": "saved"})

@app.route("/send_message", methods=["POST"])
def send_message():
    msg = request.json.get("message")
    mode = request.json.get("mode", "general")
    reply = get_reply(msg, mode)
    return jsonify({"reply": reply})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)