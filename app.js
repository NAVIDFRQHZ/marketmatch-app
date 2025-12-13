import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Helper: log to page + console
function log(msg) {
  console.log(msg);
  const el = document.getElementById("log");
  if (el) el.textContent += msg + "\n";
}

// 🔹 Your Firebase config (same one that already works)
const firebaseConfig = {
  apiKey: "AIzaSyB1-RcRXGpeJVTWNj21mFnggYy1s_h4gE0",
  authDomain: "marketmatch-app.firebaseapp.com",
  projectId: "marketmatch-app",
  storageBucket: "marketmatch-app.firebasestorage.app",
  messagingSenderId: "597641515702",
  appId: "1:597641515702:web:e829304eaed5691d2d4c17",
  measurementId: "G-2RZPS8QLLM"
};

// 🔹 Initialize Firebase + Firestore
let app, db;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  log("Firebase initialized OK");
} catch (e) {
  log("Error initializing Firebase: " + e.message);
}

// Grab form
const form = document.getElementById("consultation-form");
if (!form) {
  log("Consultation form NOT FOUND");
} else {
  log("Consultation form FOUND");
}

// Helper to read checked checkboxes into array
function getCheckedValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
    .map(cb => cb.value);
}

// 🔹 Handle submit
if (form && db) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    log("Form submitted – collecting answers...");

    // SECTION 1: Financial Capacity
    const budgetTotal = Number(document.getElementById("budgetTotal").value || 0);
    const monthlyBudget = Number(document.getElementById("monthlyBudget").value || 0);
    const riskTolerance = document.getElementById("riskTolerance").value;
    const timeHorizon = document.getElementById("timeHorizon").value;

    // SECTION 2: Skills
    const skillCategories = getCheckedValues("skillCat");
    const specialSkills = document.getElementById("specialSkills").value.trim();
    const likesHandsOn = document.getElementById("likesHandsOn").value;
    const newToolsComfort = document.getElementById("newToolsComfort").value;

    // SECTION 3: Interests & Markets
    const industries = getCheckedValues("industry");
    const productVsService = document.getElementById("productVsService").value;
    const physicalVsDigital = document.getElementById("physicalVsDigital").value;
    const b2cVsB2b = document.getElementById("b2cVsB2b").value;

    // SECTION 4: Personality & Work Style
    const workStyle = document.getElementById("workStyle").value;
    const socialLevel = document.getElementById("socialLevel").value;
    const indoorOutdoor = document.getElementById("indoorOutdoor").value;
    const customerComfort = document.getElementById("customerComfort").value;
    const workType = document.getElementById("workType").value;
    const weeklyHours = Number(document.getElementById("weeklyHours").value || 0);

    // SECTION 5: Environment & Logistics
    const hasSpace = document.getElementById("hasSpace").value;
    const hasVehicle = document.getElementById("hasVehicle").value;
    const workFromHome = document.getElementById("workFromHome").value;
    const onlineOffline = document.getElementById("onlineOffline").value;

    // SECTION 6: Experience
    const businessExperience = document.getElementById("businessExperience").value;
    const importExperience = document.getElementById("importExperience").value;
    const marketingExperience = document.getElementById("marketingExperience").value;
    const customerService = document.getElementById("customerService").value;

    // SECTION 7: Motivation & Goals
    const mainGoal = document.getElementById("mainGoal").value;
    const launchTimeline = document.getElementById("launchTimeline").value;
    const mainMotivation = document.getElementById("mainMotivation").value;
    const mainConstraint = document.getElementById("mainConstraint").value;

    const consultationData = {
      createdAt: new Date(),
      status: "questions_completed",
      questionnaireVersion: 1,
      answers: {
        // Financial
        budgetTotal,
        monthlyBudget,
        riskTolerance,
        timeHorizon,

        // Skills
        skillCategories,
        specialSkills,
        likesHandsOn,
        newToolsComfort,

        // Interests & markets
        industries,
        productVsService,
        physicalVsDigital,
        b2cVsB2b,

        // Personality & work style
        workStyle,
        socialLevel,
        indoorOutdoor,
        customerComfort,
        workType,
        weeklyHours,

        // Environment & logistics
        hasSpace,
        hasVehicle,
        workFromHome,
        onlineOffline,

        // Experience
        businessExperience,
        importExperience,
        marketingExperience,
        customerService,

        // Motivation & goals
        mainGoal,
        launchTimeline,
        mainMotivation,
        mainConstraint
      }
    };

    log("Saving consultation to Firestore...");
    try {
      const docRef = await addDoc(collection(db, "consultations"), consultationData);
      log("SUCCESS: Consultation saved with ID: " + docRef.id);
      alert("Consultation saved! ID: " + docRef.id);
      form.reset();
    } catch (error) {
      log("ERROR saving consultation: " + error.message);
      alert("ERROR saving consultation: " + error.message);
    }
  });
} else {
  log("Either form or db missing – no submit handler attached.");
}
