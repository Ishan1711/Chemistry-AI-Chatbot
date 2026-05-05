const chatBox = document.getElementById("chat-box");
const historyBox = document.getElementById("history");

let chats = [];
let currentChat = null;
let currentMode = "general";

function setMode(mode) {
    currentMode = mode;

    // update UI
    document.querySelectorAll(".tile").forEach(t => t.classList.remove("active"));
    document.getElementById(`tile-${mode}`).classList.add("active");

    const modeNames = {
        "general": "General",
        "inorganic": "Inorganic",
        "organic": "Organic",
        "reaction": "Reactions",
        "difference": "Difference"
    };

    document.getElementById("current-mode-display").innerText = `(${modeNames[mode]})`;

    // Toggle inputs
    if (mode === "difference") {
        document.getElementById("single-input-container").style.display = "none";
        document.getElementById("dual-input-container").style.display = "flex";
    } else {
        document.getElementById("single-input-container").style.display = "flex";
        document.getElementById("dual-input-container").style.display = "none";
    }
}

/* FORMAT TEXT (CLEAN FIX) */
function formatText(text) {
    return text.split('\n').map(line => {
        let trimmed = line.trim();
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
            return '• ' + trimmed.substring(2).trim();
        } else if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
            return '• ' + trimmed.substring(1).trim();
        }
        return trimmed;
    }).join('<br>');
}

/* LOAD CHATS (FIXED) */
async function loadChats() {
    const res = await fetch("/get_chats");
    chats = await res.json();

    renderHistory();

    if (chats.length) {
        currentChat = chats[0];

        setTimeout(() => {
            renderChat();   // 🔥 ensures proper render after load
        }, 50);
    }
}

/* NEW CHAT */
document.getElementById("tile-new-chat").addEventListener("click", async () => {

    const res = await fetch("/new_chat", { method: "POST" });
    const data = await res.json();

    chats.unshift(data);
    currentChat = data;

    renderHistory();
    renderChat();
});

/* RENDER HISTORY */
function renderHistory() {
    historyBox.innerHTML = "";

    chats.forEach(chat => {
        const div = document.createElement("div");
        div.className = "history-item";
        div.innerText = chat.title;

        div.onclick = () => {
            currentChat = chat;
            renderChat();
        };

        historyBox.appendChild(div);
    });
}

/* RENDER CHAT */
function renderChat() {
    chatBox.innerHTML = "";

    if (!currentChat) return;

    currentChat.messages.forEach(msg => {
        addMsg(msg.text, msg.role, msg.time, false);
    });
}

/* ADD MESSAGE (FIXED TYPING + HTML SAFE) */
function addMsg(text, role, time, typing = true) {

    const div = document.createElement("div");
    div.className = "msg " + role;

    const content = document.createElement("div");
    div.appendChild(content);

    const timeEl = document.createElement("div");
    timeEl.className = "time";
    timeEl.innerText = time;
    div.appendChild(timeEl);

    chatBox.appendChild(div);

    const formatted = formatText(text);

    if (typing && role === "ai") {

        const temp = document.createElement("div");
        temp.innerHTML = formatted;
        const plainText = temp.innerText; // remove HTML for typing

        let i = 0;

        function type() {
            if (i < plainText.length) {
                content.innerText += plainText[i];
                i++;
                chatBox.scrollTop = chatBox.scrollHeight;
                setTimeout(type, 10);
            } else {
                // replace with proper formatted HTML AFTER typing
                content.innerHTML = formatted;
            }
        }

        type();

    } else {
        content.innerHTML = formatted;
    }

    chatBox.scrollTop = chatBox.scrollHeight;
}

/* SEND MESSAGE */
async function send() {
    let msg = "";

    if (currentMode === "difference") {
        const i1 = document.getElementById("input-1").value.trim();
        const i2 = document.getElementById("input-2").value.trim();
        if (!i1 || !i2) return;
        msg = `Difference between ${i1} and ${i2}`;
        document.getElementById("input-1").value = "";
        document.getElementById("input-2").value = "";
        document.getElementById("input-1").style.height = "auto";
        document.getElementById("input-2").style.height = "auto";
    } else {
        const input = document.getElementById("input");
        msg = input.value.trim();
        if (!msg) return;
        input.value = "";
        input.style.height = "auto";
    }

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    addMsg(msg, "user", time, false);

    const res = await fetch("/send_message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, mode: currentMode })
    });

    const data = await res.json();

    addMsg(data.reply, "ai", new Date().toLocaleTimeString());

    await fetch("/save_message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            id: currentChat.id,
            user: msg,
            ai: data.reply
        })
    });

    loadChats();
}

/* ENTER TO SEND */
function handleEnter(e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
    }
}
document.getElementById("input").addEventListener("keydown", handleEnter);
document.getElementById("input-1").addEventListener("keydown", handleEnter);
document.getElementById("input-2").addEventListener("keydown", handleEnter);

/* AUTO RESIZE */
function handleResize() {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
}
document.getElementById("input").addEventListener("input", handleResize);
document.getElementById("input-1").addEventListener("input", handleResize);
document.getElementById("input-2").addEventListener("input", handleResize);

/* BUTTON */
document.getElementById("send-btn").onclick = send;

/* INIT (FIXED LOAD TIMING) */
window.onload = () => {
    loadChats();
};