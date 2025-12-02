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

        <label>รายได้ต่อปี (บาท)</label>
        <input id="income" type="number" placeholder="เช่น 600000">
        
        <label>ค่าลดหย่อนรวมทั้งหมด (บาท)</label>
        <input id="deduction" type="number" placeholder="รวมค่าลดหย่อนทุกประเภท">
        
        <div style="background: #334155; padding: 12px; border-radius: 8px; margin: 10px 0; font-size: 13px;">
          <p style="margin: 0 0 8px 0; font-weight: bold; color: #fbbf24;">💡 ตัวอย่างค่าลดหย่อน:</p>
          <p style="margin: 3px 0;">• ตัวเอง 60,000 บาท</p>
          <p style="margin: 3px 0;">• คู่สมรส 60,000 บาท</p>
          <p style="margin: 3px 0;">• บิดา-มารดา 30,000 บาท/คน</p>
          <p style="margin: 3px 0;">• บุตร 30,000 บาท/คน</p>
          <p style="margin: 3px 0;">• ประกันชีวิต สูงสุด 100,000 บาท</p>
          <p style="margin: 3px 0;">• กองทุนสำรองเลี้ยงชีพ สูงสุด 500,000 บาท</p>
          <p style="margin: 3px 0;">• ประกันสังคม</p>
          <p style="margin: 3px 0;">• ดอกเบี้ยบ้าน สูงสุด 100,000 บาท</p>
        </div>

        <button id="btnTaxCalc">คำนวณภาษี</button>
        
        <div id="taxResult" class="result"></div>
      `;

      sectionRecords.style.display = "none";
      sectionList.style.display = "none";
      sectionChart.style.display = "none";

      document.getElementById("btnTaxCalc").onclick = () => {
        const income = +document.getElementById("income").value;
        const totalDeduction = +document.getElementById("deduction").value || 0;

        if (!income || income < 0) {
          alert("กรุณากรอกรายได้ที่ถูกต้อง");
          return;
        }
        
        // รายได้สุทธิหลังหักค่าลดหย่อน
        const netIncome = Math.max(0, income - totalDeduction);

        // คำนวณภาษีตามขั้นบันได
        let tax = 0;

        if (netIncome <= 150000) {
          tax = 0;
        } else if (netIncome <= 300000) {
          tax = (netIncome - 150000) * 0.05;
        } else if (netIncome <= 500000) {
          tax = (150000 * 0.05) + (netIncome - 300000) * 0.10;
        } else if (netIncome <= 750000) {
          tax = (150000 * 0.05) + (200000 * 0.10) + (netIncome - 500000) * 0.15;
        } else if (netIncome <= 1000000) {
          tax = (150000 * 0.05) + (200000 * 0.10) + (250000 * 0.15) + (netIncome - 750000) * 0.20;
        } else if (netIncome <= 2000000) {
          tax = (150000 * 0.05) + (200000 * 0.10) + (250000 * 0.15) + (250000 * 0.20) + (netIncome - 1000000) * 0.25;
        } else if (netIncome <= 5000000) {
          tax = (150000 * 0.05) + (200000 * 0.10) + (250000 * 0.15) + (250000 * 0.20) + (1000000 * 0.25) + (netIncome - 2000000) * 0.30;
        } else {
          tax = (150000 * 0.05) + (200000 * 0.10) + (250000 * 0.15) + (250000 * 0.20) + (1000000 * 0.25) + (3000000 * 0.30) + (netIncome - 5000000) * 0.35;
        }

        // แสดงผลลัพธ์
        document.getElementById("taxResult").innerHTML = `
          <div style="background: #1e293b; padding: 15px; border-radius: 8px; margin-top: 15px;">
            <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>📊 สรุปการคำนวณภาษี</strong></p>
            <hr style="border: none; border-top: 1px solid #334155; margin: 10px 0;">
            <p style="margin: 5px 0;">รายได้ต่อปี: <strong>${income.toLocaleString()}</strong> บาท</p>
            <p style="margin: 5px 0;">ค่าลดหย่อนรวม: <strong>${totalDeduction.toLocaleString()}</strong> บาท</p>
            <p style="margin: 5px 0;">รายได้สุทธิ: <strong>${netIncome.toLocaleString()}</strong> บาท</p>
            <hr style="border: none; border-top: 1px solid #334155; margin: 10px 0;">
            <p style="margin: 10px 0 5px 0; color: #ef4444; font-size: 20px;"><strong>💰 ภาษีที่ต้องจ่าย: ${tax.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</strong></p>
            <p style="margin: 5px 0; color: #22c55e; font-size: 16px;">รายได้หลังหักภาษี: ${(income - tax).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</p>
          </div>
        `;
      }
    };
  }

  if (btnInterest) {
    btnInterest.onclick = () => {
      app.innerHTML = `
        <h2>คำนวณดอกเบี้ย</h2>

        <label>จำนวนเงินต้น (บาท)</label>
        <input id="p" type="number" placeholder="เช่น 100000" step="0.01">
        
        <label>อัตราดอกเบี้ยต่อปี (%)</label>
        <input id="r" type="number" placeholder="เช่น 5.5" step="0.01">

        <div style="background: #334155; padding: 12px; border-radius: 8px; margin: 10px 0; font-size: 13px;">
          <p style="margin: 0 0 5px 0; font-weight: bold; color: #fbbf24;">💡 ระยะเวลา</p>
          <p style="margin: 3px 0;">กรอกเฉพาะส่วนที่ต้องการ (ไม่กรอก = 0)</p>
          <p style="margin: 3px 0;">• ถ้าอยากคำนวณ <strong>3 ปี</strong> → กรอกแค่ "ปี" เป็น 3</p>
          <p style="margin: 3px 0;">• ถ้าอยากคำนวณ <strong>2 ปี 6 เดือน</strong> → กรอก "ปี" = 2, "เดือน" = 6</p>
        </div>

        <div style="display:flex;gap:10px">
          <div style="flex:1">
            <label>ระยะเวลา (ปี)</label>
            <input id="y" type="number" placeholder="0" min="0">
          </div>
          <div style="flex:1">
            <label>ระยะเวลา (เดือน)</label>
            <input id="m" type="number" placeholder="0" min="0" max="11">
          </div>
        </div>

        <label>ประเภทดอกเบี้ย</label>
        <select id="mode">
          <option value="simple">ดอกเบี้ยธรรมดา (Simple Interest)</option>
          <option value="compound">ดอกเบี้ยทบต้นรายปี (Compound Interest - Yearly)</option>
        </select>

        <div style="background: #334155; padding: 12px; border-radius: 8px; margin: 10px 0; font-size: 12px;">
          <p style="margin: 0 0 5px 0; font-weight: bold;">ℹ️ ความแตกต่าง:</p>
          <p style="margin: 3px 0;"><strong>ดอกเบี้ยธรรมดา:</strong> คิดดอกเบี้ยจากเงินต้นเท่านั้น</p>
          <p style="margin: 3px 0;"><strong>ดอกเบี้ยทบต้น:</strong> ดอกเบี้ยแต่ละปีจะกลายเป็นเงินต้นในปีถัดไป</p>
        </div>

        <button id="calcInterest">คำนวณ</button>
        <div id="interestResult" class="result"></div>
      `;

      sectionRecords.style.display = "none";
      sectionList.style.display = "none";
      sectionChart.style.display = "none";

      document.getElementById("calcInterest").onclick = () => {
        const P = +document.getElementById("p").value;
        const r = +document.getElementById("r").value / 100;
        const y = +document.getElementById("y").value || 0;
        const m = +document.getElementById("m").value || 0;

        if (!P || P <= 0) {
          alert("กรุณากรอกจำนวนเงินต้นที่ถูกต้อง");
          return;
        }

        if (!r || r <= 0) {
          alert("กรุณากรอกอัตราดอกเบี้ยที่ถูกต้อง");
          return;
        }

        if (y === 0 && m === 0) {
          alert("กรุณากรอกระยะเวลาอย่างน้อย 1 ปี หรือ 1 เดือน");
          return;
        }

        const t = y + (m / 12);
        const mode = document.getElementById("mode").value;

        let result = 0;
        let interest = 0;

        if (mode === "simple") {
          // ดอกเบี้ยธรรมดา: A = P(1 + rt)
          result = P * (1 + r * t);
          interest = result - P;
        } else {
          // ดอกเบี้ยทบต้น: A = P(1 + r)^t
          result = P * Math.pow(1 + r, t);
          interest = result - P;
        }

        // แสดงระยะเวลาให้อ่านง่าย
        let timeText = "";
        if (y > 0 && m > 0) {
          timeText = `${y} ปี ${m} เดือน`;
        } else if (y > 0) {
          timeText = `${y} ปี`;
        } else {
          timeText = `${m} เดือน`;
        }

        document.getElementById("interestResult").innerHTML = `
          <div style="background: #1e293b; padding: 15px; border-radius: 8px; margin-top: 15px;">
            <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>📊 สรุปการคำนวณดอกเบี้ย</strong></p>
            <hr style="border: none; border-top: 1px solid #334155; margin: 10px 0;">
            <p style="margin: 5px 0;">เงินต้น: <strong>${P.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong> บาท</p>
            <p style="margin: 5px 0;">อัตราดอกเบี้ย: <strong>${(r * 100).toFixed(2)}% ต่อปี</strong></p>
            <p style="margin: 5px 0;">ระยะเวลา: <strong>${timeText}</strong> (${t.toFixed(4)} ปี)</p>
            <p style="margin: 5px 0;">ประเภท: <strong>${mode === "simple" ? "ดอกเบี้ยธรรมดา" : "ดอกเบี้ยทบต้นรายปี"}</strong></p>
            <hr style="border: none; border-top: 1px solid #334155; margin: 10px 0;">
            <p style="margin: 10px 0 5px 0; color: #22c55e; font-size: 18px;"><strong>💵 ดอกเบี้ยที่ได้รับ: ${interest.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</strong></p>
            <p style="margin: 5px 0; color: #2563eb; font-size: 20px;"><strong>💰 รวมเงินทั้งหมด: ${result.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</strong></p>
          </div>
        `;
      }
    };
  }

  if (listEl) {
    renderRecords();
    updateTotal();
    updateChart();
  }

});