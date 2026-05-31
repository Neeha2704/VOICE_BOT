// ── Config ────────────────────────────────────────────────────────────────────
const GROQ_API_KEY = "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";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions";

// ── System Prompt (Neehamadhuri's persona) ────────────────────────────────────
const SYSTEM_PROMPT = `You are Neehamadhuri Barakala — responding as yourself in a job interview voice bot. 
Speak naturally in first person, as if talking directly to a recruiter. 
Keep answers warm, genuine, and conversational — 2 to 5 sentences unless more detail is asked for. 
Never say you are an AI unless directly asked.

ABOUT ME:
I'm Neehamadhuri, a final-year Mining Engineering student at IIT (ISM) Dhanbad (Batch 2022, GPA 7.75/10). 
Despite my core field being mining, I've developed a deep passion for technology — data science, AI, and software development — entirely through self-learning.

MY LIFE STORY:
Hi, I'm Neehamadhuri, a final-year Mining Engineering student at IIT (ISM) Dhanbad. While my academic background is in mining, I've developed a strong interest in technology, particularly data science, AI, and software development. Throughout college, I've actively explored these areas through self-learning, coding practice, and projects. I enjoy solving problems, learning new skills, and challenging myself to grow beyond my comfort zone. My journey has taught me the importance of adaptability, continuous learning, and staying curious about new opportunities.

MY #1 SUPERPOWER:
My biggest superpower is my ability to learn and adapt quickly. Coming from a non-computer science background, I took the initiative to learn programming, machine learning, and data analytics on my own. Whenever I encounter something unfamiliar, I enjoy breaking it down, understanding it step by step, and applying it practically. I believe this willingness to learn has helped me grow both personally and professionally.

TOP 3 AREAS I WANT TO GROW IN:
1. AI and data science — I'm excited by the potential of using data to solve real-world problems.
2. Software development — I want to strengthen my ability to build scalable and impactful applications.
3. Leadership and communication — I believe collaborating effectively and communicating ideas clearly is just as important as technical skills.

MISCONCEPTION PEOPLE HAVE ABOUT ME:
People sometimes think I'm quiet or reserved when they first meet me. In reality, I like to take some time to observe, understand the situation, and listen before sharing my thoughts. Once I'm comfortable, I'm very collaborative, enjoy discussing ideas, and actively contribute to team efforts.

HOW I PUSH MY LIMITS:
I push my boundaries by taking on challenges outside my immediate area of expertise. Despite studying Mining Engineering, I invested time learning programming, machine learning, and data analytics out of genuine interest. Whenever I encounter something difficult, I view it as an opportunity to learn rather than a reason to step back. That mindset has helped me continuously grow.

MY PROJECTS:
1. Book Recommendation System — Hybrid engine (collaborative + content-based filtering) using Python, TensorFlow, and ANNs. Built a full end-to-end ML pipeline.
2. Brain Tumour Detection — CNN model to classify brain MRI scans into tumor categories using supervised learning, data augmentation, and evaluation metrics like accuracy, precision, recall.
3. Doctor Appointment Booking System — Full-stack app with React, Node.js, Express.js, MongoDB. Features secure login, scheduling, real-time alerts, and role-based access.

MY TECHNICAL SKILLS:
- Languages: Python, C++, SQL
- Libraries/Frameworks: NumPy, Pandas, Scikit-learn, TensorFlow, Keras, React JS, Node JS, Express JS, MongoDB
- Concepts: EDA, Data Visualization, Machine Learning, Deep Learning, DSA

MY ACHIEVEMENTS:
- Final round of Walmart Global Tech India Sparkplug 2025
- Won Hackathon MasterStack at Concetto 2023 (Tech Fest, IIT Dhanbad)
- AIR (OBC NCL) 8871 in JEE Advanced 2022
- Qualified second round of NTSE 2019
- 5-star rating on HackerRank in problem solving
- Solved 500+ problems across competitive programming platforms

EXTRACURRICULARS:
- Chess Club, IIT Dhanbad
- Kartavya NGO (child education, women empowerment)
- Organizer: Security Team, Parakram'24 sports fest
- Organizer: Promotion & Marketing, Concetto'25
- Sports: Badminton, Chess`;

// ── State ─────────────────────────────────────────────────────────────────────
let history      = [];
let isSpeaking   = false;
let isListening  = false;
let currentUtterance = null;

// ── DOM ───────────────────────────────────────────────────────────────────────
const chatWindow = document.getElementById("chatWindow");
const textInput  = document.getElementById("textInput");
const sendBtn    = document.getElementById("sendBtn");
const micBtn     = document.getElementById("micBtn");
const micStatus  = document.getElementById("micStatus");
const visualizer = document.getElementById("visualizer");
const toast      = document.getElementById("toast");

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg, ms = 3500) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), ms);
}

// ── Chat rendering ────────────────────────────────────────────────────────────
function addMessage(role, text) {
  const wrap   = document.createElement("div");
  wrap.className = `message ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "msg-avatar";
  avatar.textContent = role === "bot" ? "N" : "👤";

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.textContent = text;

  wrap.appendChild(avatar);
  wrap.appendChild(bubble);
  chatWindow.appendChild(wrap);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function addTyping() {
  const wrap = document.createElement("div");
  wrap.className = "message bot";
  wrap.id = "typingWrap";

  const avatar = document.createElement("div");
  avatar.className = "msg-avatar";
  avatar.textContent = "N";

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';

  wrap.appendChild(avatar);
  wrap.appendChild(bubble);
  chatWindow.appendChild(wrap);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById("typingWrap");
  if (t) t.remove();
}

// ── Text-to-Speech ────────────────────────────────────────────────────────────
function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.lang  = "en-IN";
  currentUtterance.rate  = 0.93;
  currentUtterance.pitch = 1.05;

  // Pick best available voice
  const voices = window.speechSynthesis.getVoices();
  const pick = voices.find(v =>
    v.lang.startsWith("en") &&
    (v.name.includes("Female") || v.name.includes("Google") ||
     v.name.includes("Samantha") || v.name.includes("Zira") || v.name.includes("Karen"))
  ) || voices.find(v => v.lang.startsWith("en"));
  if (pick) currentUtterance.voice = pick;

  currentUtterance.onstart = () => {
    isSpeaking = true;
    visualizer.classList.add("active");
  };
  currentUtterance.onend = currentUtterance.onerror = () => {
    isSpeaking = false;
    visualizer.classList.remove("active");
  };

  window.speechSynthesis.speak(currentUtterance);
}

// Load voices async (required on some browsers)
if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}
window.speechSynthesis && window.speechSynthesis.getVoices();

// ── Groq API ──────────────────────────────────────────────────────────────────
async function askGroq(userMessage) {
  history.push({ role: "user", content: userMessage });

  sendBtn.disabled = true;
  addTyping();

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model:       GROQ_MODEL,
        max_tokens:  400,
        temperature: 0.75,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...history
        ]
      })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error?.message || "API error");

    const reply = data.choices?.[0]?.message?.content?.trim() || "Sorry, I couldn't respond.";
    history.push({ role: "assistant", content: reply });

    removeTyping();
    addMessage("bot", reply);
    speak(reply);

  } catch (err) {
    removeTyping();
    history.pop();
    addMessage("bot", "Oops, something went wrong. Please try again!");
    showToast("Error: " + err.message);
  } finally {
    sendBtn.disabled = false;
  }
}

// ── Send message ──────────────────────────────────────────────────────────────
function sendMessage(text) {
  const msg = (text || textInput.value).trim();
  if (!msg) return;
  textInput.value = "";
  if (isSpeaking) { window.speechSynthesis.cancel(); visualizer.classList.remove("active"); }
  addMessage("user", msg);
  askGroq(msg);
}

sendBtn.addEventListener("click", () => sendMessage());
textInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

// ── Quick pills ───────────────────────────────────────────────────────────────
document.getElementById("quickPills").addEventListener("click", e => {
  if (e.target.classList.contains("pill")) sendMessage(e.target.textContent);
});

// ── Speech Recognition ────────────────────────────────────────────────────────
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SR) {
  micBtn.style.opacity = "0.35";
  micBtn.style.cursor  = "not-allowed";
  micBtn.title = "Use Chrome or Edge for voice input";
  micStatus.textContent = "voice: use chrome/edge";
} else {
  const recognition = new SR();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = e => {
    const transcript = e.results[0][0].transcript;
    sendMessage(transcript);
  };

  recognition.onstart = () => {
    isListening = true;
    micBtn.classList.add("listening");
    micStatus.textContent = "listening…";
    if (isSpeaking) { window.speechSynthesis.cancel(); visualizer.classList.remove("active"); }
  };

  recognition.onend = () => {
    isListening = false;
    micBtn.classList.remove("listening");
    micStatus.textContent = "tap mic to speak";
  };

  recognition.onerror = e => {
    isListening = false;
    micBtn.classList.remove("listening");
    micStatus.textContent = "tap mic to speak";
    if (e.error === "not-allowed") showToast("Microphone access denied. Please allow mic in browser.");
    else if (e.error !== "no-speech") showToast("Mic error: " + e.error);
  };

  micBtn.addEventListener("click", () => {
    if (isListening) {
      recognition.stop();
    } else {
      try { recognition.start(); }
      catch (e) { showToast("Could not start mic. Try again."); }
    }
  });
}
