import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --------------------
// Helpers: logging + UI
// --------------------
function log(msg) {
  console.log(msg);
  const el = document.getElementById("log");
  if (el) el.textContent += msg + "\n";
}

function renderResults(recs) {
  const container = document.getElementById("results");
  if (!container) return;

  if (!recs.length) {
    container.innerHTML = "<p>No matches found (try different answers).</p>";
    return;
  }

  container.innerHTML = recs
    .map((r, idx) => {
      const why = (r.why || []).map(x => `<li>${x}</li>`).join("");
      return `
        <div style="border:1px solid #ddd; padding:12px; margin:12px 0;">
          <div style="font-weight:700;">${idx + 1}) ${r.title}</div>
          <div>Category: ${r.category}</div>
          <div>Score: <b>${r.totalScore}</b> / 100</div>
          <div style="margin-top:8px;">Why it fits:</div>
          <ul>${why}</ul>
          <div style="margin-top:8px; font-size: 0.95em; opacity: 0.9;">
            Fit ${r.scores.fit}/40 · Feasibility ${r.scores.feasibility}/25 · Competition ${r.scores.competition}/25 · Economics ${r.scores.economics}/10
          </div>
        </div>
      `;
    })
    .join("");
}

// Clamp helper
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// Checkbox helper
function getCheckedValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
    .map(cb => cb.value);
}

// --------------------
// Firebase config (yours)
// --------------------
const firebaseConfig = {
  apiKey: "AIzaSyB1-RcRXGpeJVTWNj21mFnggYy1s_h4gE0",
  authDomain: "marketmatch-app.firebaseapp.com",
  projectId: "marketmatch-app",
  storageBucket: "marketmatch-app.firebasestorage.app",
  messagingSenderId: "597641515702",
  appId: "1:597641515702:web:e829304eaed5691d2d4c17",
  measurementId: "G-2RZPS8QLLM"
};

let app, db;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  log("Firebase initialized OK");
} catch (e) {
  log("Error initializing Firebase: " + e.message);
}

// --------------------
// Matching Engine (v1)
// --------------------
function userPreferredCategories(answers) {
  // Based on productVsService and industries (entertainment)
  const prefs = new Set();
  if (answers.productVsService === "products") prefs.add("products");
  if (answers.productVsService === "services") prefs.add("services");
  if (answers.productVsService === "both" || answers.productVsService === "no_preference") {
    prefs.add("products");
    prefs.add("services");
  }
  if ((answers.industries || []).includes("entertainment")) prefs.add("entertainment");
  return Array.from(prefs);
}

function scoreOpportunity(answers, opp) {
  const why = [];

  // ---------- Fit (0–40) ----------
  let fit = 0;

  const preferredCats = userPreferredCategories(answers);
  if (preferredCats.includes(opp.category)) {
    fit += 10;
    why.push("Matches your preferred business type.");
  }

  const userMarkets = new Set(answers.industries || []);
  const oppMarkets = new Set(opp.markets || []);
  const marketOverlap = [...oppMarkets].some(m => userMarkets.has(m));
  if (marketOverlap) {
    fit += 10;
    why.push("Matches your interest markets.");
  }

  const userSkills = new Set(answers.skillCategories || []);
  const oppSkillSignals = new Set((opp.fitSignals && opp.fitSignals.goodForSkills) || []);
  const skillOverlap = [...oppSkillSignals].some(s => userSkills.has(s));
  if (skillOverlap) {
    fit += 10;
    why.push("Fits your broad skill strengths.");
  }

  // Online/offline fit
  const userOO = answers.onlineOffline; // online | offline | both
  const oppOO = opp.onlineOfflineFit || [];
  if (oppOO.includes(userOO) || (userOO === "both" && oppOO.length)) {
    fit += 10;
    why.push("Matches your online/offline preference.");
  }

  fit = clamp(fit, 0, 40);

  // ---------- Feasibility (0–25) ----------
  let feasibility = 0;

  // Budget
  const budget = Number(answers.budgetTotal || 0);
  if (budget >= (opp.budgetRequiredMin || 0)) {
    feasibility += 10;
    why.push("Fits your startup budget range.");
  } else {
    why.push("May be too expensive for your current budget.");
  }
  if (opp.budgetRequiredMax != null && budget <= opp.budgetRequiredMax) {
    feasibility += 5;
  }

  // Weekly hours (simple)
  const weeklyHours = Number(answers.weeklyHours || 0);
  const minHours = (opp.requirements && opp.requirements.minWeeklyHours) || 0;
  if (weeklyHours >= minHours) feasibility += 5;

  // Space
  const hasSpace = answers.hasSpace; // yes | limited | no
  const needsSpace = opp.requirements?.needsSpace || "no"; // no | limited | yes
  const spaceOk =
    needsSpace === "no" ||
    (needsSpace === "limited" && (hasSpace === "limited" || hasSpace === "yes")) ||
    (needsSpace === "yes" && hasSpace === "yes");
  if (spaceOk) feasibility += 3;
  else why.push("Needs more space/work area than you selected.");

  // Vehicle
  const hasVehicle = answers.hasVehicle; // yes | sometimes | no
  const needsVehicle = opp.requirements?.needsVehicle || "no"; // no | sometimes | yes
  const vehicleOk =
    needsVehicle === "no" ||
    (needsVehicle === "sometimes" && (hasVehicle === "sometimes" || hasVehicle === "yes")) ||
    (needsVehicle === "yes" && hasVehicle === "yes");
  if (vehicleOk) feasibility += 3;
  else why.push("May require transportation/vehicle more than you selected.");

  // Social comfort
  const userSocial = answers.socialLevel; // low/medium/high
  const needsSocial = opp.requirements?.needsSocial || "low";
  const socialRank = { low: 1, medium: 2, high: 3 };
  if (socialRank[userSocial] >= socialRank[needsSocial]) feasibility += 4;
  else why.push("This opportunity may require more customer interaction than you prefer.");

  feasibility = clamp(feasibility, 0, 25);

  // ---------- Competition (0–25) ----------
  let competition = 25;
  const seoDifficulty = opp.competition?.seoDifficulty ?? 3; // 1–5
  const avgDomainStrength = opp.competition?.avgDomainStrength ?? 3;
  const sellerSaturation = opp.competition?.sellerSaturation ?? 3;

  competition -= seoDifficulty * 3;
  competition -= sellerSaturation * 3;
  competition -= avgDomainStrength * 2;

  // CPC rule
  const cpcMax = opp.cpcMax ?? 999;
  if (cpcMax > 3) {
    competition -= 8;
    why.push("Ads CPC may exceed your target ($3 max).");
  } else {
    why.push("CPC target fits (≤ $3).");
  }

  competition = clamp(competition, 0, 25);

  // ---------- Economics (0–10) ----------
  let economics = 0;
  const margin = opp.economics?.targetMargin ?? 0.3; // 0–1
  const aov = opp.economics?.typicalAOV ?? 50;
  const repeat = opp.economics?.repeatPotential ?? 2; // 1–5

  // margin (0–4)
  economics += clamp(Math.round(margin * 4), 0, 4);

  // AOV (0–3) rough buckets
  economics += aov >= 200 ? 3 : aov >= 100 ? 2 : aov >= 50 ? 1 : 0;

  // repeat (0–3)
  economics += clamp(repeat - 2, 0, 3);

  economics = clamp(economics, 0, 10);

  const total = Math.round(fit + feasibility + competition + economics); // already sums to 100 max-ish

  return {
    totalScore: clamp(total, 0, 100),
    scores: { fit, feasibility, competition, economics },
    why
  };
}

async function fetchOpportunities() {
  const oppsRef = collection(db, "opportunities");
  const snap = await getDocs(oppsRef);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function saveRecommendations(consultationId, recs) {
  // Save top matches under a subcollection for the consultation
  const recsCol = collection(db, "consultations", consultationId, "recommendations");
  for (const r of recs) {
    await addDoc(recsCol, {
      createdAt: new Date(),
      opportunityId: r.opportunityId,
      title: r.title,
      category: r.category,
      totalScore: r.totalScore,
      scores: r.scores,
      why: r.why,
      planTemplateId: r.planTemplateId || null
    });
  }
}

async function runMatchingAndSave(consultationId, answers) {
  log("Fetching opportunities...");
  const opps = await fetchOpportunities();
  log(`Loaded ${opps.length} opportunities.`);

  // Score + filter impossible
  const scored = opps
    .map(opp => {
      const s = scoreOpportunity(answers, opp);

      // Hard filters (impossible cases)
      const budget = Number(answers.budgetTotal || 0);
      if (budget < (opp.budgetRequiredMin || 0)) return null;

      const hasSpace = answers.hasSpace;
      const needsSpace = opp.requirements?.needsSpace || "no";
      if (needsSpace === "yes" && hasSpace !== "yes") return null;

      const hasVehicle = answers.hasVehicle;
      const needsVehicle = opp.requirements?.needsVehicle || "no";
      if (needsVehicle === "yes" && hasVehicle !== "yes") return null;

      return {
        opportunityId: opp.id,
        title: opp.title,
        category: opp.category,
        totalScore: s.totalScore,
        scores: s.scores,
        why: s.why,
        planTemplateId: opp.planTemplateId || null
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 5);

  log("Top matches computed: " + scored.map(x => `${x.title} (${x.totalScore})`).join(", "));
  renderResults(scored);

  log("Saving recommendations to Firestore...");
  await saveRecommendations(consultationId, scored);
  log("Recommendations saved ✅");
}

// --------------------
// Form Submit (uses your 30-question form)
// --------------------
const form = document.getElementById("consultation-form");
if (!form) log("Consultation form NOT FOUND");
else log("Consultation form FOUND");

if (form && db) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    log("Form submitted – collecting answers...");

    // Collect from your 30-question form IDs
    const answers = {
      // Financial
      budgetTotal: Number(document.getElementById("budgetTotal").value || 0),
      monthlyBudget: Number(document.getElementById("monthlyBudget").value || 0),
      riskTolerance: document.getElementById("riskTolerance").value,
      timeHorizon: document.getElementById("timeHorizon").value,

      // Skills
      skillCategories: getCheckedValues("skillCat"),
      specialSkills: document.getElementById("specialSkills").value.trim(),
      likesHandsOn: document.getElementById("likesHandsOn").value,
      newToolsComfort: document.getElementById("newToolsComfort").value,

      // Interests
      industries: getCheckedValues("industry"),
      productVsService: document.getElementById("productVsService").value,
      physicalVsDigital: document.getElementById("physicalVsDigital").value,
      b2cVsB2b: document.getElementById("b2cVsB2b").value,

      // Work style
      workStyle: document.getElementById("workStyle").value,
      socialLevel: document.getElementById("socialLevel").value,
      indoorOutdoor: document.getElementById("indoorOutdoor").value,
      customerComfort: document.getElementById("customerComfort").value,
      workType: document.getElementById("workType").value,
      weeklyHours: Number(document.getElementById("weeklyHours").value || 0),

      // Logistics
      hasSpace: document.getElementById("hasSpace").value,
      hasVehicle: document.getElementById("hasVehicle").value,
      workFromHome: document.getElementById("workFromHome").value,
      onlineOffline: document.getElementById("onlineOffline").value,

      // Experience
      businessExperience: document.getElementById("businessExperience").value,
      importExperience: document.getElementById("importExperience").value,
      marketingExperience: document.getElementById("marketingExperience").value,
      customerService: document.getElementById("customerService").value,

      // Goals
      mainGoal: document.getElementById("mainGoal").value,
      launchTimeline: document.getElementById("launchTimeline").value,
      mainMotivation: document.getElementById("mainMotivation").value,
      mainConstraint: document.getElementById("mainConstraint").value
    };

    const consultationData = {
      createdAt: new Date(),
      status: "questions_completed",
      questionnaireVersion: 1,
      answers
    };

    log("Saving consultation to Firestore...");
    try {
      const docRef = await addDoc(collection(db, "consultations"), consultationData);
      log("SUCCESS: Consultation saved with ID: " + docRef.id);

      // Run matching + save recommendations
      await runMatchingAndSave(docRef.id, answers);

      alert("Consultation saved + recommendations generated!");
      // Optional: form.reset();
    } catch (error) {
      log("ERROR saving consultation: " + error.message);
      alert("ERROR: " + error.message);
    }
  });
} else {
  log("Either form or db missing – no submit handler attached.");
}
