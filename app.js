import { dbService } from "./dbService.js";

const form = document.getElementById("rapportinoForm");
const list = document.getElementById("rapportiniList");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const report = {
    date: document.getElementById("data").value,
    project: document.getElementById("progetto").value,
    people: document.getElementById("persone").value,
    hours: document.getElementById("ore").value,
    notes: document.getElementById("note").value
  };

  dbService.saveReport(report);
  renderReports();
  form.reset();
});

function renderReports() {
  const reports = dbService.getReports();
  list.innerHTML = "";

  reports.forEach((r) => {
    const item = document.createElement("div");
    item.className = "report-item";
    item.innerHTML = `
      <strong>${r.date}</strong> — ${r.project}<br>
      Persone: ${r.people}, Ore: ${r.hours}<br>
      Note: ${r.notes || "—"}
    `;
    list.appendChild(item);
  });
}

renderReports();
