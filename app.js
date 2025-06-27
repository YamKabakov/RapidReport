// Initialize workbook and state
let workbook = XLSX.utils.book_new();
let sheetName = "Sheet1";
let headers = ["תאריך", "אוגדה", "יחידה", "התראה", "מספר צופר", "מיגון", "כמות", "שם המפקד", "טלפון"];
let rows = JSON.parse(localStorage.getItem("rapidreport_data")) || [];

// Render the saved rows into a table (for inspect view)
// Initial sort state: sort by date ascending
let sortDirection = "asc";

// Sort rows by the "תאריך" field (auto-run before render)
function sortRowsByDate() {
  rows.sort((a, b) => {
    const dateA = parseDate(a["תאריך"]);
    const dateB = parseDate(b["תאריך"]);
    return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
  });
}

// Parse "DD-MM-YYYY" string into a Date object
function parseDate(str) {
  if (!str) return new Date(0);
  const parts = str.split("-");
  return new Date(parts[2], parts[1] - 1, parts[0]); // YYYY, MM-1, DD
}

// Toggle sort direction and re-render
function toggleSortDirection() {
  sortDirection = sortDirection === "asc" ? "desc" : "asc";
  renderTable();
}

// Render table, now auto-sorted by date
function renderTable() {
  sortRowsByDate(); // always sort before displaying

  const container = document.getElementById("inspectTable");
  container.innerHTML = "";

  if (rows.length === 0) {
    container.innerHTML = "<p>אין נתונים להצגה.</p>";
    return;
  }

  const table = document.createElement("table");
  table.className = "table table-bordered table-striped text-center align-middle";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  headers.forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    headerRow.appendChild(th);
  });

  // Replace "תאריך" header with sort toggle button
  const dateIndex = headers.indexOf("תאריך");
  const dateTh = headerRow.children[dateIndex];
  dateTh.innerHTML = ""; // Clear the header cell
  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = sortDirection === "asc" ? "⬇ תאריך" : "⬆ תאריך";
  toggleBtn.className = "btn btn-sm btn-outline-secondary";
  toggleBtn.onclick = toggleSortDirection;
  dateTh.appendChild(toggleBtn);

  // Add "פעולה" header column after all data headers (including modified "תאריך")
  const thAction = document.createElement("th");
  thAction.textContent = "פעולות";
  headerRow.appendChild(thAction);

  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  rows.forEach((row, rowIndex) => {
    const tr = document.createElement("tr");

    headers.forEach(h => {
      const td = document.createElement("td");
      const input = document.createElement("input");
      input.type = "text";
      input.value = row[h];
      input.className = "form-control form-control-sm text-center";
      input.disabled = true;
      input.dataset.key = h;
      td.appendChild(input);
      tr.appendChild(td);
    });

    // Create action buttons (edit/save/delete)
    const tdAction = document.createElement("td");

    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.className = "btn btn-sm btn-warning";

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "💾";
    saveBtn.className = "btn btn-sm btn-success";
    saveBtn.style.display = "none";

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "❌";
    deleteBtn.className = "btn btn-sm";
    deleteBtn.style.backgroundColor = "black";
    deleteBtn.style.color = "white";

    // Group buttons in one div
    const buttonWrapper = document.createElement("div");
    buttonWrapper.className = "d-flex justify-content-center gap-2";
    buttonWrapper.appendChild(editBtn);
    buttonWrapper.appendChild(saveBtn);
    buttonWrapper.appendChild(deleteBtn);
    tdAction.appendChild(buttonWrapper);
    tr.appendChild(tdAction);

    // Button actions
    editBtn.addEventListener("click", () => {
      tr.querySelectorAll("input").forEach(i => (i.disabled = false));
      editBtn.style.display = "none";
      saveBtn.style.display = "inline-block";
    });

    saveBtn.addEventListener("click", () => {
      const updatedRow = {};
      tr.querySelectorAll("input").forEach(input => {
        updatedRow[input.dataset.key] = input.value.trim();
        input.disabled = true;
      });
      rows[rowIndex] = updatedRow;
      localStorage.setItem("rapidreport_data", JSON.stringify(rows));
      editBtn.style.display = "inline-block";
      saveBtn.style.display = "none";
    });

    deleteBtn.addEventListener("click", () => {
      if (confirm("האם אתה בטוח שברצונך למחוק שורה זו?")) {
        rows.splice(rowIndex, 1);
        localStorage.setItem("rapidreport_data", JSON.stringify(rows));
        renderTable();
      }
    });

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