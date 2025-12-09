// Import Firebase modules from CDN (no install needed)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. Paste YOUR firebaseConfig from Firebase console here:
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "XXXXXXXXXXXX",
  appId: "1:XXXXXXXXXXXX:web:XXXXXXXXXXXX"
};

// 2. Initialize Firebase + Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("Firebase initialized");

// 3. Button logic – create a test Firestore document
const btn = document.getElementById("test-button");

btn.addEventListener("click", async () => {
  try {
    const docRef = await addDoc(collection(db, "consultations"), {
      createdAt: new Date(),
      test: true,
      note: "Hello from GitHub + Firebase!"
    });

    alert("Created test consultation with ID: " + docRef.id);
  } catch (error) {
    console.error("Error adding document:", error);
    alert("Error adding document. Open console for details.");
  }
});
