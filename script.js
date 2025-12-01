window.addEventListener("DOMContentLoaded", () => {

  /* ----------- LOGIN PAGE ----------- */

  const loginBtn = document.getElementById("loginBtn");

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      const provider = new firebase.auth.GoogleAuthProvider();

      auth.signInWithPopup(provider)
        .then(() => {
          window.location.href = "dashboard.html";
        })
        .catch(err => alert(err.message));
    });
  }

  /* ----------- DASHBOARD ----------- */

  const btnExpense   = document.getElementById("btn-expense");
  const btnTax        = document.getElementById("btn-tax");
  const btnInterest   = document.getElementById("btn-interest");
  const btnLogout     = document.getElementById("btn-logout");
  const username      = document.getElementById("username");

  const app            = document.getElementById("app");
  const sectionRecords = document.getElementById("section-records");
  const sectionList    = document.getElementById("section-list");
  const sectionChart   = document.getElementById("section-chart");

  const btnAdd   = document.getElementById("btn-add");
  const titleEl  = document.getElementById("title");
  const amountEl = document.getElementById("amount");
  const typeEl   = document.getElementById("type");
  const listEl   = document.getElementById("list");
  const totalEl  = document.getElementById("total");

  /* ----------- AUTH ----------- */

  if (username) {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        username.innerText = "สวัสดี, " + user.displayName;
      } else {
        window.location.href = "index.html";
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", () => auth.signOut());
  }

  /* ----------- RECORDS ----------- */

  let records = JSON.parse(localStorage.getItem("records")) || [];
  let chart = null;

  function renderRecords() {
    listEl.innerHTML = "";

    records.forEach(item => {
      const li = document.createElement("li");
      li.className = item.type;

      const span = document.createElement("span");
      span.innerText = `${item.title} : ${item.amount.toLocaleString()} บาท`;

      const btn = document.createElement("button");
      btn.className = "btn-del";
      btn.innerText = "ลบ";
      btn.onclick = () => deleteRecord(item.id);

      li.appendChild(span);
      li.appendChild(btn);

      listEl.appendChild(li);
    });
  }

  function deleteRecord(id) {
    records = records.filter(r => r.id !== id);
    localStorage.setItem("records", JSON.stringify(records));
    renderRecords();
    updateTotal();
    updateChart();
  }

  function updateTotal() {
    let total = 0;

    records.forEach(item => {
      total += item.type === "income" ? item.amount : -item.amount;
    });

    totalEl.innerText = "คงเหลือสุทธิ: " + total.toLocaleString() + " บาท";
  }

  function updateChart() {
    if (!document.getElementById("chart")) return;

    let income = 0;
    let expense = 0;

    records.forEach(item => {
      item.type === "income" ? income += item.amount : expense += item.amount;
    });

    if (chart) chart.destroy();

    const ctx = document.getElementById("chart").getContext("2d");
    chart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["รายรับ", "รายจ่าย"],
        datasets: [{
          data: [income, expense],
          backgroundColor: ["#22c55e", "#ef4444"]
        }]
      }
    });
  }

  if (btnAdd) {
    btnAdd.addEventListener("click", () => {
      const title = titleEl.value.trim();
      const amount = parseFloat(amountEl.value);
      const type = typeEl.value;

      if (!title || isNaN(amount)) return alert("กรอกข้อมูลให้ครบ");

      records.push({
        id: Date.now(),
        title,
        amount,
        type
      });

      localStorage.setItem("records", JSON.stringify(records));

      titleEl.value = "";
      amountEl.value = "";

      renderRecords();
      updateTotal();
      updateChart();
    });
  }

  /* ----------- NAVIGATION ----------- */

  if (btnExpense) {
    btnExpense.onclick = () => {
      app.innerHTML = "<h2>ระบบจัดการรายรับ - รายจ่าย</h2>";

      sectionRecords.style.display = "block";
      sectionList.style.display = "block";
      sectionChart.style.display = "block";

      renderRecords();
      updateTotal();
      updateChart();
    };
  }

  if (btnTax) {
    btnTax.onclick = () => {
      app.innerHTML = `
        <h2>คำนวณภาษี</h2>

        <input id="income" type="number" placeholder="รายได้ต่อปี">
        <input id="deduction" type="number" placeholder="ค่าลดหย่อน">

        <button id="btnTaxCalc">คำนวณ</button>
        <p class="result" id="taxResult">ผลลัพธ์: -</p>
      `;

      sectionRecords.style.display = "none";
      sectionList.style.display = "none";
      sectionChart.style.display = "none";

      document.getElementById("btnTaxCalc").onclick = () => {
        const income = +document.getElementById("income").value;
        const deduction = +document.getElementById("deduction").value || 0;

        const net = income - deduction;

        let tax = 0;

        if (net <= 150000) tax = 0;
        else if (net <= 300000) tax = (net - 150000) * 0.05;
        else if (net <= 500000) tax = 7500 + (net - 300000) * 0.1;
        else tax = 27500 + (net - 500000) * 0.15;

        document.getElementById("taxResult").innerText
          = "ภาษีที่ต้องจ่าย: " + tax.toFixed(2);
      }
    };
  }

  if (btnInterest) {
    btnInterest.onclick = () => {
      app.innerHTML = `
        <h2>คำนวณดอกเบี้ย</h2>

        <input id="p" type="number" placeholder="เงินต้น">
        <input id="r" type="number" placeholder="ดอกเบี้ย (%)">

        <div style="display:flex;gap:10px">
          <input id="y" type="number" placeholder="ปี">
          <input id="m" type="number" placeholder="เดือน">
        </div>

        <select id="mode">
          <option value="simple">ดอกเบี้ยธรรมดา</option>
          <option value="compound">ดอกเบี้ยทบต้น</option>
        </select>

        <button id="calcInterest">คำนวณ</button>
        <p class="result" id="interestResult">ผลลัพธ์: -</p>
      `;

      sectionRecords.style.display = "none";
      sectionList.style.display = "none";
      sectionChart.style.display = "none";

      document.getElementById("calcInterest").onclick = () => {
        const P = +document.getElementById("p").value;
        const r = +document.getElementById("r").value / 100;
        const y = +document.getElementById("y").value || 0;
        const m = +document.getElementById("m").value || 0;

        const t = y + (m / 12);
        const mode = document.getElementById("mode").value;

        let result = 0;

        if (mode === "simple") result = P * (1 + r * t);
        else result = P * Math.pow(1 + r, t);

        document.getElementById("interestResult").innerText =
          "รวม: " + result.toFixed(2) + " บาท";
      }
    };
  }

  if (listEl) {
    renderRecords();
    updateTotal();
    updateChart();
  }

});
