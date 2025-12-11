import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔹 0. Helper: log to page AND console
function log(msg) {
  console.log(msg);
  const el = document.getElementById("log");
  if (el) {
    el.textContent += msg + "\n";
  }
}

// 🔹 1. YOUR firebaseConfig from Firebase console:
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "XXXXXXXXXXXX",
  appId: "1:XXXXXXXXXXXX:web:XXXXXXXXXXXX"
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

// 🔹 3. Grab the button
const btn = document.getElementById("test-button");
log("Button element: " + (btn ? "FOUND" : "NOT FOUND"));

if (!btn) {
  alert("Could not find the button with id 'test-button'. Check index.html.");
}

// 🔹 4. Click handler with detailed logging
if (btn && db) {
  btn.addEventListener("click", () => {
    log("Button clicked – starting addDoc...");

    addDoc(collection(db, "consultations"), {
      createdAt: new Date(),
      test: true,
      note: "Hello from GitHub + Firebase!"
    })
      .then((docRef) => {
        log("SUCCESS: Document written with ID: " + docRef.id);
        alert("Created test consultation with ID: " + docRef.id);
      })
      .catch((error) => {
        log("ERROR adding document: " + error.message);
        alert("ERROR writing to Firestore: " + error.message);
      });
  });
} else {
  log("Either btn or db is missing, no click handler attached.");
}
