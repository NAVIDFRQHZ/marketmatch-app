import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
const form = document.getElementById("consultationForm");
const statusEl = document.getElementById("consultationStatus");
const oppsEl = document.getElementById("oppsList");

let currentConsultationId = null;

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Read values from form
  const budgetCad = Number(document.getElementById("budgetCad").value || 0);
  const category = document.getElementById("category").value;
  const priceMin = Number(document.getElementById("priceMin").value || 0);
  const priceMax = Number(document.getElementById("priceMax").value || 0);
  const smallLightOnly = document.getElementById("smallLightOnly").checked;
  const notes = document.getElementById("notes").value || "";

  // Create consultation doc
  const docRef = await addDoc(collection(db, "consultations"), {
    status: "queued",
    budgetCad,
    category,
    priceMin,
    priceMax,
    smallLightOnly,
    notes,
    createdAt: serverTimestamp(),
  });

  currentConsultationId = docRef.id;

  statusEl.innerHTML = `
    ✅ Consultation created.<br/>
    <b>Consultation ID:</b> <code>${currentConsultationId}</code><br/>
    Run the agent locally with:<br/>
    <code>BRAVE_API_KEY="YOUR_KEY" node ./agent.js ${currentConsultationId}</code>
  `;

  // Start listening for Top 10 results
  listenForOpportunities(currentConsultationId);
});

function listenForOpportunities(consultationId) {
  oppsEl.textContent = "Waiting for results...";

  const q = query(
    collection(db, "opportunities"),
    where("consultationId", "==", consultationId),
    orderBy("competitionScore", "desc"),
    limit(10)
  );

  onSnapshot(q, (snap) => {
    if (snap.empty) {
      oppsEl.textContent = "No results yet (run the agent).";
      return;
    }

    const items = snap.docs.map((d) => d.data());

    oppsEl.innerHTML = items
      .map((x, i) => `
        <div style="padding:8px 0; border-bottom:1px solid #ddd;">
          <b>${i + 1}.</b> ${x.keyword}<br/>
          <small>
            noun: <code>${x.productNoun || ""}</code> |
            score: <code>${x.competitionScore}</code> |
            marketplaces: <code>${x.marketplaceCount}</code>
          </small>
        </div>
      `)
      .join("");
  });
}
