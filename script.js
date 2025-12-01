/* ============================
   ELEMENTS
============================ */
const btnExpense  = document.getElementById("btn-expense");
const btnTax       = document.getElementById("btn-tax");
const btnInterest  = document.getElementById("btn-interest");
const app          = document.getElementById("app");

const btnLogout = document.getElementById("btn-logout");
const username  = document.getElementById("username");

const sectionRecords = document.getElementById("section-records");
const sectionList    = document.getElementById("section-list");
const sectionChart   = document.getElementById("section-chart");

const titleEl  = document.getElementById("title");
const amountEl = document.getElementById("amount");
const typeEl   = document.getElementById("type");
const btnAdd   = document.getElementById("btn-add");
const listEl   = document.getElementById("list");
const totalEl  = document.getElementById("total");


/* ============================
   AUTH + USER
============================ */
if (typeof firebase !== "undefined") {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      username.innerText = "สวัสดี, " + (user.displayName || user.email);
    } else {
      window.location.href = "index.html";
    }
  });

  btnLogout?.addEventListener("click", () => {
    firebase.auth().signOut();
  });
}


/* ============================
   DATA STORAGE
============================ */
let records = JSON.parse(localStorage.getItem("records")) || [];
let chart;


/* ============================
   NAVIGATION
============================ */

// รายรับ - รายจ่าย
btnExpense.addEventListener("click", () => {
  app.innerHTML = `<h2>ระบบจัดการรายรับ - รายจ่าย</h2>`;

  sectionRecords.style.display = "block";
  sectionList.style.display    = "block";
  sectionChart.style.display   = "block";

  renderRecords();
  updateTotal();
  updateChart();
});

// ภาษี
btnTax.addEventListener("click", () => {
  app.innerHTML = `
    <h2>คำนวณภาษี</h2>

    <input type="number" id="income" placeholder="รายได้ต่อปี (บาท)">
    <input type="number" id="deduction" placeholder="ค่าลดหย่อน (บาท)">

    <button id="btn-calc-tax">คำนวณภาษี</button>
    <p class="result" id="tax-result">ผลลัพธ์: -</p>
  `;

  sectionRecords.style.display = "none";
  sectionList.style.display    = "none";
  sectionChart.style.display   = "none";

  document.getElementById("btn-calc-tax").addEventListener("click", () => {
    const income = parseFloat(document.getElementById("income").value);
    const deduction = parseFloat(document.getElementById("deduction").value) || 0;

    const net = income - deduction;
    let tax = 0;

    if (net <= 150000) tax = 0;
    else if (net <= 300000) tax = (net - 150000) * 0.05;
    else if (net <= 500000) tax = 7500 + (net - 300000) * 0.10;
    else if (net <= 750000) tax = 27500 + (net - 500000) * 0.15;
    else if (net <= 1000000) tax = 65000 + (net - 750000) * 0.20;
    else tax = 115000 + (net - 1000000) * 0.25;

    document.getElementById("tax-result").innerText =
      "ภาษีที่ต้องจ่าย: " + tax.toFixed(2) + " บาท";
  });
});

// ดอกเบี้ย
btnInterest.addEventListener("click", () => {
  app.innerHTML = `
    <h2>คำนวณดอกเบี้ย</h2>

    <input type="number" id="principal" placeholder="เงินต้น (บาท)">
    <input type="number" id="rate" placeholder="อัตราดอกเบี้ยต่อปี (%)">

    <div style="display:flex; gap:10px;">
      <input type="number" id="years" placeholder="ปี" style="flex:1">
      <input type="number" id="months" placeholder="เดือน" style="flex:1">
    </div>

    <select id="mode">
      <option value="simple">ดอกเบี้ยปกติ</option>
      <option value="compound">ดอกเบี้ยทบต้น</option>
    </select>

    <button id="btn-calc-interest">คำนวณ</button>
    <p class="result" id="interestResult">ผลลัพธ์: -</p>
  `;

  sectionRecords.style.display = "none";
  sectionList.style.display    = "none";
  sectionChart.style.display   = "none";

  document.getElementById("btn-calc-interest").addEventListener("click", () => {
    const P = parseFloat(document.getElementById("principal").value);
    const r = parseFloat(document.getElementById("rate").value) / 100;

    const years  = parseFloat(document.getElementById("years").value) || 0;
    const months = parseFloat(document.getElementById("months").value) || 0;

    const t = years + (months / 12);
    const mode = document.getElementById("mode").value;

    if (isNaN(P) || isNaN(r) || t === 0) {
      document.getElementById("interestResult").innerText =
        "กรุณากรอกข้อมูลให้ครบ";
      return;
    }

    let result = 0;

    if (mode === "simple") {
      result = P * (1 + r * t);
    } else {
      result = P * Math.pow(1 + r, t);
    }

    document.getElementById("interestResult").innerText =
      "จำนวนเงินรวม: " + result.toFixed(2) + " บาท";
  });
});


/* ============================
   ADD / DELETE RECORD
============================ */

btnAdd.addEventListener("click", () => {
  const title  = titleEl.value.trim();
  const amount = parseFloat(amountEl.value);
  const type   = typeEl.value;

  if (title === "" || isNaN(amount) || amount <= 0) {
    alert("กรุณากรอกข้อมูลให้ถูกต้อง");
    return;
  }

  const newItem = {
    id: Date.now(),
    title,
    amount,
    type
  };

  records.push(newItem);
  localStorage.setItem("records", JSON.stringify(records));

  titleEl.value = "";
  amountEl.value = "";

  renderRecords();
  updateTotal();
  updateChart();
});

function deleteRecord(id) {
  records = records.filter(item => item.id !== id);
  localStorage.setItem("records", JSON.stringify(records));

  renderRecords();
  updateTotal();
  updateChart();
}


/* ============================
   RENDER LIST
============================ */

function renderRecords() {
  listEl.innerHTML = "";

  records.forEach(item => {
    const li = document.createElement("li");
    li.className = item.type === "income" ? "income" : "expense";

    li.innerHTML = `
      <span>${item.title} : ${item.amount.toLocaleString()} บาท</span>
      <button onclick="deleteRecord(${item.id})">ลบ</button>
    `;

    listEl.appendChild(li);
  });
}


/* ============================
   TOTAL BALANCE
============================ */

function updateTotal() {
  let total = 0;

  records.forEach(item => {
    if (item.type === "income") total += item.amount;
    else total -= item.amount;
  });

  totalEl.innerText = "คงเหลือสุทธิ: " + total.toLocaleString() + " บาท";
}


/* ============================
   CHART
============================ */

function updateChart() {
  let income = 0;
  let expense = 0;

  records.forEach(item => {
    if (item.type === "income") income += item.amount;
    else expense += item.amount;
  });

  const ctx = document.getElementById("chart").getContext("2d");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["รายรับ", "รายจ่าย"],
      datasets: [{
        data: [income, expense],
        backgroundColor: ["#4caf50", "#f44336"]
      }]
    }
  });
}


/* ============================
   DEFAULT LOAD
============================ */

sectionRecords.style.display = "block";
sectionList.style.display    = "block";
sectionChart.style.display   = "block";

renderRecords();
updateTotal();
updateChart();
