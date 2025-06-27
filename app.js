const headers = [
  "תאריך",
  "אוגדה",
  "יחידה",
  "התראה",
  "מספר צופר",
  "מיגון",
  "כמות",
  "שם המפקד",
  "טלפון",
];

const rows = JSON.parse(localStorage.getItem("rapidreport_data") || "[]");
const sheetName = "דיווחים";
const workbook = XLSX.utils.book_new();

// Render the data table
function renderTable() {
  const container = document.getElementById("inspectTable");
  container.innerHTML = "";

  const table = document.createElement("table");
  table.className = "table table-bordered table-sm text-center align-middle";
  table.style.fontSize = "0.75rem";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");

  // Header row
  headers.forEach(header => {
    const th = document.createElement("th");
    th.textContent = header;
    headRow.appendChild(th);
  });

  // Add "פעולות" column
  const actionTh = document.createElement("th");
  actionTh.textContent = "פעולות";
  headRow.appendChild(actionTh);
  thead.appendChild(headRow);
  table.appendChild(thead);

  // Table body
  const tbody = document.createElement("tbody");

  rows.forEach((row, rowIndex) => {
    const tr = document.createElement("tr");

    headers.forEach(header => {
      const td = document.createElement("td");
      const input = document.createElement("input");
      input.value = row[header];
      input.className = "form-control form-control-sm text-center";
      input.style.padding = "0.25rem";
      input.style.fontSize = "0.75rem";
      input.addEventListener("input", () => {
        row[header] = input.value;
        localStorage.setItem("rapidreport_data", JSON.stringify(rows));
      });
      td.appendChild(input);
      tr.appendChild(td);
    });

    // Actions (delete + edit)
    const tdActions = document.createElement("td");
    tdActions.className = "text-center";

    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = "❌";
    deleteBtn.className = "btn btn-danger btn-sm me-1";
    deleteBtn.addEventListener("click", () => {
      if (confirm("האם אתה בטוח שברצונך למחוק שורה זו?")) {
        rows.splice(rowIndex, 1);
        localStorage.setItem("rapidreport_data", JSON.stringify(rows));
        renderTable();
      }
    });

    const editBtn = document.createElement("button");
    editBtn.innerHTML = "✏️";
    editBtn.className = "btn btn-warning btn-sm";
    editBtn.addEventListener("click", () => {
      const selected = rows[rowIndex];
      headers.forEach(h => {
        document.getElementById(h).value = selected[h];
      });
      document.getElementById("inspectView").style.display = "none";
      document.getElementById("formView").style.display = "block";
    });

    tdActions.appendChild(deleteBtn);
    tdActions.appendChild(editBtn);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}

// Save form data to localStorage
document.getElementById("reportForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const row = {};
  let allFilled = true;

  headers.forEach(header => {
    const value = document.getElementById(header).value.trim();
    row[header] = value;
    if (!value) allFilled = false;
  });

  if (!allFilled) {
    alert("יש למלא את כל השדות לפני השמירה.");
    return;
  }

  rows.push(row);
  localStorage.setItem("rapidreport_data", JSON.stringify(rows));
  alert("נשמר בהצלחה!");
  document.getElementById("reportForm").reset();

  // Reset date field to today
  const today = new Date();
  const formatted = today.toISOString().split("T")[0];
  const hebrewFormatted = formatted.split("-").reverse().join("-");
  document.getElementById("תאריך").value = hebrewFormatted;
});

// Download the Excel file with all rows
document.getElementById("downloadBtn").addEventListener("click", function () {
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "rapidreport.xlsx";
  a.click();
});

// Switch to table view
document.getElementById("inspectBtn").addEventListener("click", function () {
  renderTable();
  document.getElementById("formView").style.display = "none";
  document.getElementById("inspectView").style.display = "block";
});

// Back to form view
document.getElementById("backBtn").addEventListener("click", function () {
  document.getElementById("inspectView").style.display = "none";
  document.getElementById("formView").style.display = "block";

  // Restore today's date if needed
  const dateField = document.getElementById("תאריך");
  if (!dateField.value) {
    const today = new Date();
    const formatted = today.toISOString().split("T")[0];
    const hebrewFormatted = formatted.split("-").reverse().join("-");
    dateField.value = hebrewFormatted;
  }
});

// Pre-fill today's date on load
document.addEventListener("DOMContentLoaded", () => {
  const dateField = document.getElementById("תאריך");
  if (!dateField.value) {
    const today = new Date();
    const formatted = today.toISOString().split("T")[0];
    const hebrewFormatted = formatted.split("-").reverse().join("-");
    dateField.value = hebrewFormatted;
  }
});