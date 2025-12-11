import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("Firebase initialized");

// 🔹 3. Grab the button and log it
const btn = document.getElementById("test-button");
console.log("Button element:", btn);

if (!btn) {
  alert("Could not find the button with id 'test-button'. Check index.html.");
}

// 🔹 4. Only add listener if button exists
btn?.addEventListener("click", async () => {
  console.log("Button clicked – attempting to write to Firestore...");
  try {
    const docRef = await addDoc(collection(db, "consultations"), {
      createdAt: new Date(),
      test: true,
      note: "Hello from GitHub + Firebase!"
    });

    alert("Created test consultation with ID: " + docRef.id);
    console.log("Document written with ID:", docRef.id);
  } catch (error) {
    console.error("Error adding document:", error);
    alert("Error adding document. Check console for details.");
  }
});
