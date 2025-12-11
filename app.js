// Import Firebase modules from CDN (this works on GitHub Pages)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Helper: log to page + console
function log(msg) {
  console.log(msg);
  const el = document.getElementById("log");
  if (el) el.textContent += msg + "\n";
}

// 🔹 Your actual Firebase config (already filled correctly)
const firebaseConfig = {
  apiKey: "AIzaSyB1-RcRXGpeJVTWNj21mFnggYy1s_s_h4gE0",
  authDomain: "marketmatch-app.firebaseapp.com",
  projectId: "marketmatch-app",
  storageBucket: "marketmatch-app.firebasestorage.app",
  messagingSenderId: "597641515702",
  appId: "1:597641515702:web:e829304eaed5691d2d4c17",
  measurementId: "G-2RZPS8QLLM"
};

// Initialize Firebase + Firestore
let app, db;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  log("Firebase initialized OK");
} catch (e) {
  log("Error initializing Firebase: " + e.message);
}

// Get button
const btn = document.getElementById("test-button");
log("Button element: " + (btn ? "FOUND" : "NOT FOUND"));

// Add event listener
if (btn && db) {
  btn.addEventListener("click", async () => {
    log("Button clicked – starting addDoc...");

    try {
      const docRef = await addDoc(collection(db, "consultations"), {
        createdAt: new Date(),
        test: true,
        note: "Hello from GitHub + Firebase!"
      });

      log("SUCCESS: Document written with ID: " + docRef.id);
      alert("Created test consultation with ID: " + docRef.id);
    } catch (error) {
      log("ERROR adding document: " + error.message);
      alert("ERROR writing to Firestore: " + error.message);
    }
  });
} else {
  log("Either button or db missing – cannot attach click handler.");
}
