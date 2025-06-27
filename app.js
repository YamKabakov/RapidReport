// Initialize a new Excel workbook
let workbook = XLSX.utils.book_new();
let sheetName = "Sheet1";

// Define the table/form fields (in Hebrew)
let headers = [
  "תאריך", "אוגדה", "יחידה", "התראה", "מספר צופר",
  "מיגון", "כמות", "שם המפקד", "טלפון"
];

// Load existing data from localStorage or start with empty array
let rows = JSON.parse(localStorage.getItem("rapidreport_data")) || [];

// Initial sort direction for the date column
let sortDirection = "asc";

// -------------------------------
// Sorting logic for date column
// -------------------------------
function sortRowsByDate() {
  rows.sort((a, b) => {
    const dateA = parseDate(a["תאריך"]);
    const dateB = parseDate(b["תאריך"]);
    return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
  });
}

// Convert "DD-MM-YYYY" string to JS Date object
function parseDate(str) {
  if (!str) return new Date(0); // fallback if empty
  const parts = str.split("-");
  return new Date(parts[2], parts[1] - 1, parts[0]); // year, month-1, day
}

// Toggle date sort direction and re-render
function toggleSortDirection() {
  sortDirection = sortDirection === "asc" ? "desc" : "asc";
  renderTable();
}

// --------------------------------
// Renders the table view of data
// --------------------------------
function renderTable() {
  sortRowsByDate(); // Always sort by date before rendering

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

  // Add toggleable date header
  const dateIndex = headers.indexOf("תאריך");
  const dateTh = headerRow.children[dateIndex];
  dateTh.innerHTML = "";
  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = sortDirection === "asc" ? "⬇ תאריך" : "⬆ תאריך";
  toggleBtn.className = "btn btn-sm btn-outline-secondary";
  toggleBtn.onclick = toggleSortDirection;
  dateTh.appendChild(toggleBtn);

  // Add action column header
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
      let input;

      const isDropdown = ["אוגדה", "התראה", "מיגון"].includes(h);
      if (isDropdown) {
        input = document.createElement("select");
        input.className = "form-select form-select-sm text-center";
        input.disabled = true;
        input.dataset.key = h;

        const optionsMap = {
          "אוגדה": ["בורדו 252", "36 סגול", "98 ורוד", "99 תכלת", "162 ירוק בהיר", "143 כתום"],
          "התראה": ["רותם", "ברק", "נוגה", "רעם", "רוני", "צופר קבע", "נופר"],
          "מיגון": ["קיט כפול", "קיט בודד", "רחבעם", "יונתן", "מובל מים", "(בחירת כמות)"]
        };

        optionsMap[h].forEach(optText => {
          const opt = document.createElement("option");
          opt.value = optText;
          opt.textContent = optText;
          if (optText === row[h]) opt.selected = true;
          input.appendChild(opt);
        });

      } else {
        input = document.createElement("input");
        input.type = "text";
        input.value = row[h];
        input.className = "form-control form-control-sm text-center";
        input.dataset.key = h;
        input.disabled = true;
      }

      td.appendChild(input);
      tr.appendChild(td);
    });

    // Create action buttons
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

    // Button group
    const buttonWrapper = document.createElement("div");
    buttonWrapper.className = "d-flex justify-content-center gap-2";
    buttonWrapper.appendChild(editBtn);
    buttonWrapper.appendChild(saveBtn);
    buttonWrapper.appendChild(deleteBtn);
    tdAction.appendChild(buttonWrapper);
    tr.appendChild(tdAction);

    // Edit button logic
    editBtn.addEventListener("click", () => {
      tr.querySelectorAll("input, select").forEach(i => (i.disabled = false));
      editBtn.style.display = "none";
      saveBtn.style.display = "inline-block";
    });

    // Save button logic
    saveBtn.addEventListener("click", () => {
      const updatedRow = {};
      tr.querySelectorAll("input, select").forEach(input => {
        updatedRow[input.dataset.key] = input.value.trim();
        input.disabled = true;
      });
      rows[rowIndex] = updatedRow;
      localStorage.setItem("rapidreport_data", JSON.stringify(rows));
      editBtn.style.display = "inline-block";
      saveBtn.style.display = "none";
    });

    // Delete button logic
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

// --------------------------------------------
// Handle form submission and saving to storage
// --------------------------------------------
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

  // Pre-fill today's date again
  const today = new Date();
  const formatted = today.toISOString().split("T")[0];
  const hebrewFormatted = formatted.split("-").reverse().join("-");
  document.getElementById("תאריך").value = hebrewFormatted;
});

// -------------------------------------
// Export stored data as Excel download
// -------------------------------------
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

// -------------------------------------
// Toggle views between form and table
// -------------------------------------
document.getElementById("inspectBtn").addEventListener("click", function () {
  renderTable();
  document.getElementById("formView").style.display = "none";
  document.getElementById("inspectView").style.display = "block";
});

document.getElementById("backBtn").addEventListener("click", function () {
  document.getElementById("inspectView").style.display = "none";
  document.getElementById("formView").style.display = "block";

  // Pre-fill today's date again if empty
  const dateField = document.getElementById("תאריך");
  if (!dateField.value) {
    const today = new Date();
    const formatted = today.toISOString().split("T")[0];
    const hebrewFormatted = formatted.split("-").reverse().join("-");
    dateField.value = hebrewFormatted;
  }
});

// -------------------------------------
// On page load, pre-fill current date
// -------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const dateField = document.getElementById("תאריך");
  if (!dateField.value) {
    const today = new Date();
    const formatted = today.toISOString().split("T")[0];
    const hebrewFormatted = formatted.split("-").reverse().join("-");
    dateField.value = hebrewFormatted;
  }
});