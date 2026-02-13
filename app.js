import { dbService } from "./dbService.js";

// Elementi UI
const form = document.getElementById("rapportinoForm");
const listContainer = document.getElementById("rapportiniList");

// Render iniziale
renderList();

// Gestione submit form
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const rapportino = {
    id: crypto.randomUUID(),
    date: document.getElementById("date").value,
    project: document.getElementById("project").value,
    people: Number(document.getElementById("people").value),
    hours: Number(document.getElementById("hours").value),
    notes: document.getElementById("notes").value.trim(),
  };

  dbService.addRapportino(rapportino);
  form.reset();
  renderList();
});

// Render lista rapportini
function renderList() {
  const rapportini = dbService.getRapportini();

  if (rapportini.length === 0) {
    listContainer.innerHTML = "<p>Nessun rapportino salvato.</p>";
    return;
  }

  listContainer.innerHTML = "";

  rapportini.forEach((r) => {
    const card = document.createElement("div");
    card.className = "rapportino-card";

    card.innerHTML = `
      <strong>${r.date} — ${r.project}</strong>
      <p><strong>Persone:</strong> ${r.people}</p>
      <p><strong>Ore:</strong> ${r.hours}</p>
      ${r.notes ? `<p><strong>Note:</strong> ${r.notes}</p>` : ""}
      <button class="delete-btn" data-id="${r.id}">Elimina</button>
    `;

    listContainer.appendChild(card);
  });

  // Gestione pulsanti elimina
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      dbService.deleteRapportino(id);
      renderList();
    });
  });
}
