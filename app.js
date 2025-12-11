import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Helper: log to page + console
function log(msg) {
  console.log(msg);
  const el = document.getElementById("log");
  if (el) el.textContent += msg + "\n";
}

// 🔹 1. YOUR firebaseConfig (use the SAME one that is already working)
const firebaseConfig = {
  apiKey: "AIzaSyB1-RcRXGpeJVTWNj21mFnggYy1s_h4gE0",
  authDomain: "marketmatch-app.firebaseapp.com",
  projectId: "marketmatch-app",
  storageBucket: "marketmatch-app.firebasestorage.app",
  messagingSenderId: "597641515702",
  appId: "1:597641515702:web:e829304eaed5691d2d4c17",
  measurementId: "G-2RZPS8QLLM"
};

// 🔹 2. Initialize Firebase + Firestore
let app, db;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  log("Firebase initialized OK");
} catch (e) {
  log("Error initializing Firebase: " + e.message);
}

// 🔹 3. Grab the form + inputs
const form = document.getElementById("consultation-form");
const budgetInput = document.getElementById("budget");
const skillsInput = document.getElementById("skills");
const interestsInput = document.getElementById("interests");

if (!form) {
  log("Consultation form NOT FOUND");
} else {
  log("Consultation form FOUND");
}

// 🔹 4. Handle form submit
if (form && db) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); // stop page reload
    log("Form submitted – preparing data...");

    const budget = Number(budgetInput.value || 0);
    const skills = (skillsInput.value || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
    const interests = (interestsInput.value || "")
      .split(",")
      .map(i => i.trim())
      .filter(Boolean);

    const consultationData = {
      createdAt: new Date(),
      status: "questions_completed",
      answers: {
        budget,
        skills,
        interests
      }
    };

    log("Saving consultation to Firestore...");
    try {
      const docRef = await addDoc(collection(db, "consultations"), consultationData);
      log("SUCCESS: Consultation saved with ID: " + docRef.id);
      alert("Consultation saved! ID: " + docRef.id);

      // Optional: clear form
      form.reset();
    } catch (error) {
      log("ERROR saving consultation: " + error.message);
      alert("ERROR saving consultation: " + error.message);
    }
  });
} else {
  log("Either form or db missing – no submit handler attached.");
}
