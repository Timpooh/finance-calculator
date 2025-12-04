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
  const btnHome       = document.getElementById("btn-home");
  const btnLogout     = document.getElementById("btn-logout");
  const username      = document.getElementById("username");

  const app            = document.getElementById("app");
  const navMenu        = document.querySelector("nav");
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
        username.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
              👤
            </div>
            <div>
              <div style="font-size: 14px; opacity: 0.8;">ยินดีต้อนรับสู่</div>
              <div style="font-size: 18px; font-weight: 700;">Finance Calculator</div>
            </div>
          </div>
        `;
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

    if (records.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; opacity: 0.7;">
          <div style="font-size: 48px; margin-bottom: 15px;">📝</div>
          <p style="margin: 0; font-size: 16px;">ยังไม่มีรายการ</p>
          <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">เริ่มต้นเพิ่มรายรับรายจ่ายของคุณได้เลย</p>
        </div>
      `;
      return;
    }

    records.forEach(item => {
      const li = document.createElement("li");
      li.className = item.type;

      const icon = item.type === "income" ? "💰" : "💸";
      
      const span = document.createElement("span");
      span.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 20px;">${icon}</span>
          <div>
            <div style="font-weight: 600; font-size: 15px;">${item.title}</div>
            <div style="font-size: 13px; opacity: 0.8; margin-top: 2px;">${item.amount.toLocaleString()} บาท</div>
          </div>
        </div>
      `;

      const btn = document.createElement("button");
      btn.className = "btn-del";
      btn.innerHTML = "🗑️";
      btn.onclick = () => deleteRecord(item.id);

      li.appendChild(span);
      li.appendChild(btn);

      listEl.appendChild(li);
    });
  }

  function deleteRecord(id) {
    if (!confirm("ต้องการลบรายการนี้ใช่หรือไม่?")) return;
    
    records = records.filter(r => r.id !== id);
    localStorage.setItem("records", JSON.stringify(records));
    renderRecords();
    updateTotal();
    updateChart();
  }

  function updateTotal() {
    let totalIncome = 0;
    let totalExpense = 0;
    let netTotal = 0;

    records.forEach(item => {
      if (item.type === "income") {
        totalIncome += item.amount;
      } else {
        totalExpense += item.amount;
      }
    });

    netTotal = totalIncome - totalExpense;

    const netColor = netTotal >= 0 ? "#22c55e" : "#ef4444";
    const netIcon = netTotal >= 0 ? "✅" : "⚠️";

    totalEl.innerHTML = `
      <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); padding: 20px; border-radius: 16px; margin-top: 20px; border: 1px solid rgba(255, 255, 255, 0.2);">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
          <div style="text-align: center;">
            <div style="font-size: 12px; opacity: 0.8; margin-bottom: 5px;">รายรับทั้งหมด</div>
            <div style="font-size: 20px; font-weight: 700; color: #22c55e;">💰 ${totalIncome.toLocaleString()}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 12px; opacity: 0.8; margin-bottom: 5px;">รายจ่ายทั้งหมด</div>
            <div style="font-size: 20px; font-weight: 700; color: #ef4444;">💸 ${totalExpense.toLocaleString()}</div>
          </div>
        </div>
        <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.2); margin: 15px 0;">
        <div style="text-align: center;">
          <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">คงเหลือสุทธิ</div>
          <div style="font-size: 28px; font-weight: 700; color: ${netColor};">
            ${netIcon} ${netTotal.toLocaleString()} บาท
          </div>
        </div>
      </div>
    `;
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
      type: "doughnut",
      data: {
        labels: ["รายรับ", "รายจ่าย"],
        datasets: [{
          data: [income, expense],
          backgroundColor: ["#22c55e", "#ef4444"],
          borderWidth: 0,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: 'white',
              padding: 20,
              font: {
                size: 14,
                weight: '600'
              }
            }
          }
        }
      }
    });
  }

  if (btnAdd) {
    btnAdd.addEventListener("click", () => {
      const title = titleEl.value.trim();
      const amount = parseFloat(amountEl.value);
      const type = typeEl.value;

      if (!title || isNaN(amount)) return alert("กรอกข้อมูลให้ครบ");
      if (amount <= 0) return alert("จำนวนเงินต้องมากกว่า 0");

      records.push({
        id: Date.now(),
        title,
        amount,
        type,
        date: new Date().toLocaleDateString('th-TH')
      });

      localStorage.setItem("records", JSON.stringify(records));

      titleEl.value = "";
      amountEl.value = "";

      renderRecords();
      updateTotal();
      updateChart();

      showNotification("เพิ่มรายการสำเร็จ! ✅");
    });
  }

  // ฟังก์ชันแสดง Notification
  function showNotification(message) {
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(34, 197, 94, 0.95);
      color: white;
      padding: 15px 25px;
      border-radius: 12px;
      font-weight: 600;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      z-index: 9999;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease";
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  /* ----------- NAVIGATION ----------- */

  function showDashboard() {
    if (navMenu) {
      navMenu.style.display = "none";
    }

    let totalIncome = 0;
    let totalExpense = 0;
    let netTotal = 0;

    records.forEach(item => {
      if (item.type === "income") {
        totalIncome += item.amount;
      } else {
        totalExpense += item.amount;
      }
    });

    netTotal = totalIncome - totalExpense;

    app.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="font-size: 32px; margin: 0 0 10px 0; background: linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          🏦 Finance Calculator
        </h2>
        <p style="opacity: 0.9; margin: 0; font-size: 15px;">จัดการการเงินของคุณอย่างมีประสิทธิภาพ</p>
      </div>

      <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%); backdrop-filter: blur(10px); padding: 25px; border-radius: 20px; margin-bottom: 30px; border: 1px solid rgba(255, 255, 255, 0.3); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 15px;">
          <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">ยอดเงินคงเหลือ</div>
          <div style="font-size: 36px; font-weight: 700;">${netTotal.toLocaleString()} <span style="font-size: 20px; opacity: 0.8;">บาท</span></div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
          <div style="background: rgba(34, 197, 94, 0.2); padding: 15px; border-radius: 12px; border: 1px solid rgba(34, 197, 94, 0.3);">
            <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px;">💰 รายรับ</div>
            <div style="font-size: 18px; font-weight: 700; color: #22c55e;">+${totalIncome.toLocaleString()}</div>
          </div>
          <div style="background: rgba(239, 68, 68, 0.2); padding: 15px; border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.3);">
            <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px;">💸 รายจ่าย</div>
            <div style="font-size: 18px; font-weight: 700; color: #ef4444;">-${totalExpense.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="dashboard-card" id="card-expense">
          <div class="icon">💰</div>
          <h3>รายรับ - รายจ่าย</h3>
          <p>จัดการและบันทึกรายรับรายจ่ายของคุณ</p>
        </div>
        
        <div class="dashboard-card" id="card-tax">
          <div class="icon">📊</div>
          <h3>คำนวณภาษี</h3>
          <p>คำนวณภาษีเงินได้บุคคลธรรมดา</p>
        </div>
        
        <div class="dashboard-card" id="card-interest">
          <div class="icon">📈</div>
          <h3>คำนวณดอกเบี้ย</h3>
          <p>คำนวณดอกเบี้ยธรรมดาและทบต้น</p>
        </div>

        <div class="dashboard-card" id="card-savings">
          <div class="icon">🎯</div>
          <h3>เป้าหมายออม</h3>
          <p>วางแผนและติดตามเป้าหมายการออมเงิน</p>
        </div>
      </div>
    `;

    sectionRecords.style.display = "none";
    sectionList.style.display = "none";
    sectionChart.style.display = "none";

    document.getElementById("card-expense").onclick = () => {
      if (navMenu) navMenu.style.display = "flex";
      showExpensePage();
    };
    document.getElementById("card-tax").onclick = () => {
      if (navMenu) navMenu.style.display = "flex";
      showTaxPage();
    };
    document.getElementById("card-interest").onclick = () => {
      if (navMenu) navMenu.style.display = "flex";
      showInterestPage();
    };
    document.getElementById("card-savings").onclick = () => {
      if (navMenu) navMenu.style.display = "flex";
      showSavingsPage();
    };
  }

  function showExpensePage() {
    app.innerHTML = `
      <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
        <div style="font-size: 36px;">💰</div>
        <div>
          <h2 style="margin: 0; font-size: 24px;">ระบบจัดการรายรับ - รายจ่าย</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 14px;">บันทึกและติดตามรายรับรายจ่ายของคุณ</p>
        </div>
      </div>
    `;

    sectionRecords.style.display = "block";
    sectionList.style.display = "block";
    sectionChart.style.display = "block";

    renderRecords();
    updateTotal();
    updateChart();
  }

  function showTaxPage() {
    app.innerHTML = `
      <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
        <div style="font-size: 36px;">📊</div>
        <div>
          <h2 style="margin: 0; font-size: 24px;">คำนวณภาษี</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 14px;">คำนวณภาษีเงินได้บุคคลธรรมดา</p>
        </div>
      </div>

      <label>รายได้ต่อปี (บาท)</label>
      <input id="income" type="number" placeholder="เช่น 600000">
      
      <label>ค่าลดหย่อนรวมทั้งหมด (บาท)</label>
      <input id="deduction" type="number" placeholder="รวมค่าลดหย่อนทุกประเภท">
      
      <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); padding: 15px; border-radius: 12px; margin: 15px 0; font-size: 13px; border: 1px solid rgba(255, 255, 255, 0.2);">
        <p style="margin: 0 0 10px 0; font-weight: bold;">💡 ตัวอย่างค่าลดหย่อน:</p>
        <p style="margin: 4px 0;">• ตัวเอง 60,000 บาท</p>
        <p style="margin: 4px 0;">• คู่สมรส 60,000 บาท</p>
        <p style="margin: 4px 0;">• บิดา-มารดา 30,000 บาท/คน</p>
        <p style="margin: 4px 0;">• บุตร 30,000 บาท/คน</p>
        <p style="margin: 4px 0;">• ประกันชีวิต สูงสุด 100,000 บาท</p>
        <p style="margin: 4px 0;">• กองทุนสำรองเลี้ยงชีพ สูงสุด 500,000 บาท</p>
        <p style="margin: 4px 0;">• ประกันสังคม</p>
        <p style="margin: 4px 0;">• ดอกเบี้ยบ้าน สูงสุด 100,000 บาท</p>
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
      
      const netIncome = Math.max(0, income - totalDeduction);

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

      document.getElementById("taxResult").innerHTML = `
        <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); padding: 20px; border-radius: 16px; margin-top: 20px; border: 1px solid rgba(255, 255, 255, 0.2);">
          <p style="margin: 0 0 15px 0; font-size: 18px;"><strong>📊 สรุปการคำนวณภาษี</strong></p>
          <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.2); margin: 15px 0;">
          <p style="margin: 8px 0;">รายได้ต่อปี: <strong>${income.toLocaleString()}</strong> บาท</p>
          <p style="margin: 8px 0;">ค่าลดหย่อนรวม: <strong>${totalDeduction.toLocaleString()}</strong> บาท</p>
          <p style="margin: 8px 0;">รายได้สุทธิ: <strong>${netIncome.toLocaleString()}</strong> บาท</p>
          <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.2); margin: 15px 0;">
          <p style="margin: 12px 0 8px 0; font-size: 22px;"><strong>💰 ภาษีที่ต้องจ่าย: ${tax.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</strong></p>
          <p style="margin: 8px 0; font-size: 18px; opacity: 0.9;">รายได้หลังหักภาษี: ${(income - tax).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</p>
        </div>
      `;

      showNotification("คำนวณภาษีสำเร็จ! ✅");
    }
  }

  function showInterestPage() {
    app.innerHTML = `
      <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
        <div style="font-size: 36px;">📈</div>
        <div>
          <h2 style="margin: 0; font-size: 24px;">คำนวณดอกเบี้ย</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 14px;">คำนวณดอกเบี้ยธรรมดาและทบต้น</p>
        </div>
      </div>

      <label>จำนวนเงินต้น (บาท)</label>
      <input id="p" type="number" placeholder="เช่น 100000" step="0.01">
      
      <label>อัตราดอกเบี้ยต่อปี (%)</label>
      <input id="r" type="number" placeholder="เช่น 5.5" step="0.01">

      <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); padding: 15px; border-radius: 12px; margin: 15px 0; font-size: 13px; border: 1px solid rgba(255, 255, 255, 0.2);">
        <p style="margin: 0 0 8px 0; font-weight: bold;">💡 ระยะเวลา</p>
        <p style="margin: 4px 0;">กรอกเฉพาะส่วนที่ต้องการ (ไม่กรอก = 0)</p>
        <p style="margin: 4px 0;">• ถ้าอยากคำนวณ <strong>3 ปี</strong> → กรอกแค่ "ปี" เป็น 3</p>
        <p style="margin: 4px 0;">• ถ้าอยากคำนวณ <strong>2 ปี 6 เดือน</strong> → กรอก "ปี" = 2, "เดือน" = 6</p>
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

      <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); padding: 15px; border-radius: 12px; margin: 15px 0; font-size: 13px; border: 1px solid rgba(255, 255, 255, 0.2);">
        <p style="margin: 0 0 8px 0; font-weight: bold;">ℹ️ ความแตกต่าง:</p>
        <p style="margin: 4px 0;"><strong>ดอกเบี้ยธรรมดา:</strong> คิดดอกเบี้ยจากเงินต้นเท่านั้น</p>
        <p style="margin: 4px 0;"><strong>ดอกเบี้ยทบต้น:</strong> ดอกเบี้ยแต่ละปีจะกลายเป็นเงินต้นในปีถัดไป</p>
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
        result = P * (1 + r * t);
        interest = result - P;
      } else {
        result = P * Math.pow(1 + r, t);
        interest = result - P;
      }

      let timeText = "";
      if (y > 0 && m > 0) {
        timeText = `${y} ปี ${m} เดือน`;
      } else if (y > 0) {
        timeText = `${y} ปี`;
      } else {
        timeText = `${m} เดือน`;
      }

      document.getElementById("interestResult").innerHTML = `
        <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); padding: 20px; border-radius: 16px; margin-top: 20px; border: 1px solid rgba(255, 255, 255, 0.2);">
          <p style="margin: 0 0 15px 0; font-size: 18px;"><strong>📊 สรุปการคำนวณดอกเบี้ย</strong></p>
          <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.2); margin: 15px 0;">
          <p style="margin: 8px 0;">เงินต้น: <strong>${P.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong> บาท</p>
          <p style="margin: 8px 0;">อัตราดอกเบี้ย: <strong>${(r * 100).toFixed(2)}% ต่อปี</strong></p>
          <p style="margin: 8px 0;">ระยะเวลา: <strong>${timeText}</strong> (${t.toFixed(4)} ปี)</p>
          <p style="margin: 8px 0;">ประเภท: <strong>${mode === "simple" ? "ดอกเบี้ยธรรมดา" : "ดอกเบี้ยทบต้นรายปี"}</strong></p>
          <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.2); margin: 15px 0;">
          <p style="margin: 12px 0 8px 0; font-size: 20px;"><strong>💵 ดอกเบี้ยที่ได้รับ: ${interest.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</strong></p>
          <p style="margin: 8px 0; font-size: 22px;"><strong>💰 รวมเงินทั้งหมด: ${result.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</strong></p>
        </div>
      `;

      showNotification("คำนวณดอกเบี้ยสำเร็จ! ✅");
    }
  }

  function showSavingsPage() {
    let savingsGoals = JSON.parse(localStorage.getItem("savingsGoals")) || [];

    function renderSavingsGoals() {
      let goalsHTML = "";

      if (savingsGoals.length === 0) {
        goalsHTML = `
          <div style="text-align: center; padding: 40px 20px; opacity: 0.7;">
            <div style="font-size: 48px; margin-bottom: 15px;">🎯</div>
            <p style="margin: 0; font-size: 16px;">ยังไม่มีเป้าหมายการออม</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">เริ่มต้นวางแผนการออมเงินของคุณได้เลย</p>
          </div>
        `;
      } else {
        savingsGoals.forEach(goal => {
          const progress = (goal.current / goal.target) * 100;
          const progressColor = progress >= 100 ? "#22c55e" : progress >= 50 ? "#f59e0b" : "#667eea";
          
          goalsHTML += `
            <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); padding: 20px; border-radius: 16px; margin-bottom: 15px; border: 1px solid rgba(255, 255, 255, 0.2);">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                <div>
                  <h4 style="margin: 0 0 5px 0; font-size: 18px;">${goal.name}</h4>
                  <p style="margin: 0; opacity: 0.8; font-size: 13px;">${goal.current.toLocaleString()} / ${goal.target.toLocaleString()} บาท</p>
                </div>
                <button onclick="deleteSavingsGoal(${goal.id})" style="background: rgba(239, 68, 68, 0.8); padding: 8px 15px; font-size: 13px; width: auto; margin: 0; border-radius: 8px; border: none; cursor: pointer; color: white;">🗑️</button>
              </div>
              
              <div style="background: rgba(0, 0, 0, 0.2); height: 12px; border-radius: 20px; overflow: hidden; margin-bottom: 10px;">
                <div style="background: ${progressColor}; height: 100%; width: ${Math.min(progress, 100)}%; transition: width 0.3s ease;"></div>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 14px; font-weight: 600;">${progress.toFixed(1)}% สำเร็จ</span>
                <button onclick="addToSavingsGoal(${goal.id})" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 8px 15px; font-size: 13px; width: auto; margin: 0; border-radius: 8px; border: none; cursor: pointer; color: white; font-weight: 600;">➕ เพิ่มเงิน</button>
              </div>
            </div>
          `;
        });
      }

      app.innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
          <div style="font-size: 36px;">🎯</div>
          <div>
            <h2 style="margin: 0; font-size: 24px;">เป้าหมายออม</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 14px;">วางแผนและติดตามเป้าหมายการออมเงิน</p>
          </div>
        </div>

        <div style="background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); padding: 25px; border-radius: 20px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.2);">
          <h3 style="margin: 0 0 15px 0; font-size: 18px;">เพิ่มเป้าหมายใหม่</h3>
          
          <label>ชื่อเป้าหมาย</label>
          <input id="goalName" type="text" placeholder="เช่น ซื้อรถยนต์">
          
          <label>จำนวนเงินเป้าหมาย (บาท)</label>
          <input id="goalTarget" type="number" placeholder="เช่น 500000">
          
          <button id="addGoalBtn">เพิ่มเป้าหมาย</button>
        </div>

        <div style="background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); padding: 25px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.2);">
          <h3 style="margin: 0 0 20px 0; font-size: 18px;">เป้าหมายของคุณ</h3>
          ${goalsHTML}
        </div>
      `;

      sectionRecords.style.display = "none";
      sectionList.style.display = "none";
      sectionChart.style.display = "none";

      const addGoalBtn = document.getElementById("addGoalBtn");
      if (addGoalBtn) {
        addGoalBtn.onclick = () => {
          const name = document.getElementById("goalName").value.trim();
          const target = +document.getElementById("goalTarget").value;

          if (!name || !target || target <= 0) {
            alert("กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
          }

          savingsGoals.push({
            id: Date.now(),
            name,
            target,
            current: 0
          });

          localStorage.setItem("savingsGoals", JSON.stringify(savingsGoals));
          showNotification("เพิ่มเป้าหมายสำเร็จ! 🎯");
          renderSavingsGoals();
        };
      }
    }

    window.deleteSavingsGoal = (id) => {
      if (!confirm("ต้องการลบเป้าหมายนี้ใช่หรือไม่?")) return;
      
      savingsGoals = savingsGoals.filter(g => g.id !== id);
      localStorage.setItem("savingsGoals", JSON.stringify(savingsGoals));
      showNotification("ลบเป้าหมายสำเร็จ! ✅");
      renderSavingsGoals();
    };

    window.addToSavingsGoal = (id) => {
      const amount = prompt("ระบุจำนวนเงินที่ต้องการเพิ่ม (บาท):");
      if (!amount || isNaN(amount) || +amount <= 0) return;

      const goal = savingsGoals.find(g => g.id === id);
      if (goal) {
        goal.current += +amount;
        localStorage.setItem("savingsGoals", JSON.stringify(savingsGoals));
        showNotification("เพิ่มเงินสำเร็จ! 💰");
        renderSavingsGoals();
      }
    };

    renderSavingsGoals();
  }

  // Event Listeners สำหรับปุ่มเมนู
  if (btnExpense) {
    btnExpense.onclick = () => showExpensePage();
  }

  if (btnTax) {
    btnTax.onclick = () => showTaxPage();
  }

  if (btnInterest) {
    btnInterest.onclick = () => showInterestPage();
  }

  if (btnHome) {
    btnHome.onclick = () => showDashboard();
  }

  // เริ่มต้นที่หน้า Dashboard
  if (listEl) {
    showDashboard();
    renderRecords();
    updateTotal();
    updateChart();
  }

  // เพิ่ม CSS สำหรับ Animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

});