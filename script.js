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
  const btnStudentLoan = document.getElementById("btn-student-loan");
  const btnDividend   = document.getElementById("btn-dividend");
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

        <div class="dashboard-card" id="card-student-loan">
          <div class="icon">🎓</div>
          <h3>คำนวณ กยศ.</h3>
          <p>คำนวณการผ่อนชำระเงินกู้ กยศ.</p>
        </div>

        <div class="dashboard-card" id="card-dividend">
          <div class="icon">💵</div>
          <h3>เงินปันผลกองทุน</h3>
          <p>คำนวณผลตอบแทนจากกองทุนรวม</p>
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
    document.getElementById("card-student-loan").onclick = () => {
      if (navMenu) navMenu.style.display = "flex";
      showStudentLoanPage();
    };
    document.getElementById("card-dividend").onclick = () => {
      if (navMenu) navMenu.style.display = "flex";
      showDividendPage();
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

  // ฟังก์ชันคำนวณ กยศ.
// แทนที่ฟังก์ชัน showStudentLoanPage() เดิมในไฟล์ script.js

// แทนที่ฟังก์ชัน showStudentLoanPage() เดิมในไฟล์ script.js

function showStudentLoanPage() {
  // โหลดข้อมูล กยศ. จาก localStorage
  let loanData = JSON.parse(localStorage.getItem("studentLoan")) || null;

  // ถ้ายังไม่มีข้อมูล แสดงฟอร์มสร้างเงินกู้ใหม่
  if (!loanData) {
    app.innerHTML = `
      <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
        <div style="font-size: 36px;">🎓</div>
        <div>
          <h2 style="margin: 0; font-size: 24px;">สร้างแผนชำระเงินกู้ กยศ.</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 14px;">ตั้งค่าข้อมูลเงินกู้และเริ่มติดตามการชำระ</p>
        </div>
      </div>

      <label>จำนวนเงินกู้ทั้งหมด (บาท)</label>
      <input id="loan-amount" type="number" placeholder="เช่น 200000" step="0.01">
      
      <label>อัตราดอกเบี้ยต่อปี (%)</label>
      <input id="loan-rate" type="number" placeholder="กยศ. ประมาณ 1%" step="0.01" value="1">

      <label>ระยะเวลาผ่อนชำระ (ปี)</label>
      <input id="loan-years" type="number" placeholder="เช่น 15" min="1" max="30">

      <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); padding: 15px; border-radius: 12px; margin: 15px 0; font-size: 13px; border: 1px solid rgba(255, 255, 255, 0.2);">
        <p style="margin: 0 0 8px 0; font-weight: bold;">💡 ข้อมูล กยศ.</p>
        <p style="margin: 4px 0;">• อัตราดอกเบี้ย กยศ. ปัจจุบันอยู่ที่ประมาณ <strong>1% ต่อปี</strong></p>
        <p style="margin: 4px 0;">• เริ่มชำระหลังจบการศึกษา 2 ปี</p>
        <p style="margin: 4px 0;">• ระยะเวลาผ่อนชำระสูงสุด 15 ปี</p>
      </div>

      <button id="create-loan">สร้างแผนชำระเงินกู้</button>
    `;

    sectionRecords.style.display = "none";
    sectionList.style.display = "none";
    sectionChart.style.display = "none";

    document.getElementById("create-loan").onclick = () => {
      const principal = +document.getElementById("loan-amount").value;
      const annualRate = +document.getElementById("loan-rate").value / 100;
      const years = +document.getElementById("loan-years").value;

      if (!principal || principal <= 0) {
        alert("กรุณากรอกจำนวนเงินกู้ที่ถูกต้อง");
        return;
      }

      if (annualRate < 0) {
        alert("กรุณากรอกอัตราดอกเบี้ยที่ถูกต้อง");
        return;
      }

      if (!years || years <= 0 || years > 30) {
        alert("กรุณากรอกระยะเวลาผ่อนชำระ 1-30 ปี");
        return;
      }

      // คำนวณค่าผ่อนต่อเดือน
      const monthlyRate = annualRate / 12;
      const totalMonths = years * 12;
      
      let monthlyPayment;
      if (monthlyRate === 0) {
        monthlyPayment = principal / totalMonths;
      } else {
        monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                        (Math.pow(1 + monthlyRate, totalMonths) - 1);
      }

      // สร้างข้อมูลเงินกู้
      loanData = {
        principal: principal,
        annualRate: annualRate,
        monthlyRate: monthlyRate,
        years: years,
        totalMonths: totalMonths,
        monthlyPayment: monthlyPayment,
        remainingBalance: principal,
        currentMonth: 0,
        payments: [], // เก็บประวัติการชำระ
        createdDate: new Date().toISOString()
      };

      localStorage.setItem("studentLoan", JSON.stringify(loanData));
      showNotification("สร้างแผนชำระเงินกู้สำเร็จ! 🎉");
      showStudentLoanPage(); // รีเฟรชหน้า
    };

  } else {
    // มีข้อมูลแล้ว แสดงหน้าจัดการและชำระเงิน
    displayLoanManagement(loanData);
  }
}

function displayLoanManagement(loanData) {
  const percentPaid = ((loanData.principal - loanData.remainingBalance) / loanData.principal) * 100;
  const totalPaid = loanData.principal - loanData.remainingBalance;
  const monthsRemaining = loanData.totalMonths - loanData.currentMonth;

  app.innerHTML = `
    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
      <div style="font-size: 36px;">🎓</div>
      <div style="flex: 1;">
        <h2 style="margin: 0; font-size: 24px;">จัดการเงินกู้ กยศ.</h2>
        <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 14px;">ติดตามและบันทึกการชำระเงินกู้</p>
      </div>
      <button id="reset-loan" style="background: rgba(239, 68, 68, 0.8); padding: 10px 20px; width: auto; margin: 0; font-size: 14px;">
        🗑️ ลบข้อมูล
      </button>
    </div>

    <!-- สรุปภาพรวม -->
    <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%); backdrop-filter: blur(10px); padding: 25px; border-radius: 20px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.3);">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">ยอดคงเหลือ</div>
        <div style="font-size: 36px; font-weight: 700; color: ${loanData.remainingBalance > 0 ? '#f59e0b' : '#22c55e'};">
          ${loanData.remainingBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} 
          <span style="font-size: 20px; opacity: 0.8;">บาท</span>
        </div>
      </div>

      <div style="background: rgba(0, 0, 0, 0.2); height: 16px; border-radius: 20px; overflow: hidden; margin-bottom: 15px;">
        <div style="background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%); height: 100%; width: ${percentPaid}%; transition: width 0.5s ease;"></div>
      </div>

      <div style="text-align: center; margin-bottom: 20px;">
        <span style="font-size: 18px; font-weight: 600;">${percentPaid.toFixed(2)}% ชำระแล้ว</span>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div style="background: rgba(34, 197, 94, 0.2); padding: 15px; border-radius: 12px; border: 1px solid rgba(34, 197, 94, 0.3); text-align: center;">
          <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px;">💰 ชำระไปแล้ว</div>
          <div style="font-size: 18px; font-weight: 700; color: #22c55e;">${totalPaid.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
        </div>
        <div style="background: rgba(245, 158, 11, 0.2); padding: 15px; border-radius: 12px; border: 1px solid rgba(245, 158, 11, 0.3); text-align: center;">
          <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px;">📅 เหลืออีก</div>
          <div style="font-size: 18px; font-weight: 700; color: #f59e0b;">${monthsRemaining} เดือน</div>
        </div>
      </div>
    </div>

    <!-- ข้อมูลเงินกู้ -->
    <div style="background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); padding: 20px; border-radius: 16px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.2);">
      <h3 style="margin: 0 0 15px 0; font-size: 18px;">📋 ข้อมูลเงินกู้</h3>
      <div style="font-size: 14px; line-height: 1.8;">
        <p style="margin: 5px 0;">เงินกู้เริ่มต้น: <strong>${loanData.principal.toLocaleString()} บาท</strong></p>
        <p style="margin: 5px 0;">อัตราดอกเบี้ย: <strong>${(loanData.annualRate * 100).toFixed(2)}% ต่อปี</strong></p>
        <p style="margin: 5px 0;">ระยะเวลา: <strong>${loanData.years} ปี (${loanData.totalMonths} เดือน)</strong></p>
        <p style="margin: 5px 0;">ค่าผ่อนต่อเดือน: <strong>${loanData.monthlyPayment.toLocaleString(undefined, {maximumFractionDigits: 2})} บาท</strong></p>
      </div>
    </div>

    <!-- ฟอร์มชำระเงิน -->
    <div style="background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); padding: 20px; border-radius: 16px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.2);">
      <h3 style="margin: 0 0 15px 0; font-size: 18px;">💳 บันทึกการชำระเงิน</h3>
      
      <label>จำนวนเงินที่ชำระ (บาท)</label>
      <input id="payment-amount" type="number" placeholder="แนะนำ: ${loanData.monthlyPayment.toFixed(2)}" step="0.01" value="${loanData.monthlyPayment.toFixed(2)}">
      
      <div style="display: flex; gap: 10px; margin-top: 10px;">
        <button id="pay-loan" style="flex: 1; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);">
          ชำระเงิน
        </button>
        <button id="pay-full" style="flex: 1; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);">
          ชำระเต็มจำนวน
        </button>
      </div>
    </div>

    <!-- ประวัติการชำระ -->
    <div style="background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); padding: 20px; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.2);">
      <h3 style="margin: 0 0 15px 0; font-size: 18px;">📜 ประวัติการชำระ (${loanData.payments.length} รายการ)</h3>
      <div id="payment-history" style="max-height: 400px; overflow-y: auto;"></div>
    </div>
  `;

  sectionRecords.style.display = "none";
  sectionList.style.display = "none";
  sectionChart.style.display = "none";

  // แสดงประวัติการชำระ
  displayPaymentHistory(loanData);

  // ปุ่มชำระเงิน
  document.getElementById("pay-loan").onclick = () => {
    const paymentAmount = +document.getElementById("payment-amount").value;
    
    if (!paymentAmount || paymentAmount <= 0) {
      alert("กรุณากรอกจำนวนเงินที่ต้องการชำระ");
      return;
    }

    if (paymentAmount > loanData.remainingBalance) {
      if (!confirm(`จำนวนเงินมากกว่ายอดคงเหลือ (${loanData.remainingBalance.toFixed(2)} บาท)\nต้องการชำระเต็มจำนวนใช่หรือไม่?`)) {
        return;
      }
    }

    makePayment(loanData, paymentAmount);
  };

  // ปุ่มชำระเต็มจำนวน
  document.getElementById("pay-full").onclick = () => {
    if (!confirm(`ต้องการชำระเงินคงเหลือทั้งหมด ${loanData.remainingBalance.toFixed(2)} บาท ใช่หรือไม่?`)) {
      return;
    }
    makePayment(loanData, loanData.remainingBalance);
  };

  // ปุ่มลบข้อมูล
  document.getElementById("reset-loan").onclick = () => {
    if (!confirm("ต้องการลบข้อมูลเงินกู้ทั้งหมดใช่หรือไม่?\n(การกระทำนี้ไม่สามารถย้อนกลับได้)")) {
      return;
    }
    localStorage.removeItem("studentLoan");
    showNotification("ลบข้อมูลเงินกู้สำเร็จ! ✅");
    showStudentLoanPage();
  };
}

function makePayment(loanData, paymentAmount) {
  if (loanData.remainingBalance <= 0) {
    alert("ชำระเงินครบแล้ว! 🎉");
    return;
  }

  // คำนวณดอกเบี้ยของเดือนนี้
  const interestThisMonth = loanData.remainingBalance * loanData.monthlyRate;
  
  // คำนวณจำนวนที่ควรจ่าย (ค่าผ่อนมาตรฐาน)
  const shouldPay = loanData.monthlyPayment;
  
  // คำนวณเงินที่ค้างชำระ (ถ้าจ่ายไม่ครบตามที่กำหนด)
  const unpaid = Math.max(0, shouldPay - paymentAmount);
  
  // จำนวนที่ไปลดเงินต้น (หลังหักดอกเบี้ย)
  let principalPayment = 0;
  if (paymentAmount > interestThisMonth) {
    principalPayment = Math.min(paymentAmount - interestThisMonth, loanData.remainingBalance);
  }
  
  // ยอดคงเหลือใหม่ (เงินต้นที่เหลือ + เงินค้างชำระ)
  let newBalance = Math.max(0, loanData.remainingBalance - principalPayment + unpaid);
  
  // ถ้าชำระมากกว่ายอดคงเหลือ ให้ชำระหมดเลย
  if (paymentAmount >= loanData.remainingBalance + interestThisMonth) {
    principalPayment = loanData.remainingBalance;
    newBalance = 0;
  }

  // บันทึกการชำระ
  loanData.payments.push({
    month: loanData.currentMonth + 1,
    date: new Date().toISOString(),
    paymentAmount: paymentAmount,
    shouldPay: shouldPay,
    unpaid: unpaid,
    interestPaid: interestThisMonth,
    principalPaid: principalPayment,
    remainingBalance: newBalance
  });

  loanData.currentMonth++;
  loanData.remainingBalance = newBalance;

  // บันทึกลง localStorage
  localStorage.setItem("studentLoan", JSON.stringify(loanData));

  if (newBalance <= 0) {
    showNotification("🎉 ยินดีด้วย! ชำระเงินกู้ครบถ้วนแล้ว!");
  } else if (unpaid > 0) {
    showNotification(`⚠️ ชำระไม่ครบ! เงินค้าง ${unpaid.toFixed(2)} บาท จะถูกบวกเข้ายอดเดือนหน้า`);
  } else {
    showNotification("บันทึกการชำระเงินสำเร็จ! ✅");
  }

  // รีเฟรชหน้า
  showStudentLoanPage();
}

function displayPaymentHistory(loanData) {
  const historyDiv = document.getElementById("payment-history");
  
  if (loanData.payments.length === 0) {
    historyDiv.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; opacity: 0.7;">
        <div style="font-size: 48px; margin-bottom: 15px;">📝</div>
        <p style="margin: 0; font-size: 16px;">ยังไม่มีประวัติการชำระ</p>
      </div>
    `;
    return;
  }

  // เรียงจากล่าสุดไปเก่าสุด
  const sortedPayments = [...loanData.payments].reverse();
  
  let html = "";
  sortedPayments.forEach((payment, index) => {
    const date = new Date(payment.date);
    const dateStr = date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const borderColor = payment.unpaid > 0 ? '#ef4444' : '#22c55e';
    const statusIcon = payment.unpaid > 0 ? '⚠️' : '✅';

    html += `
      <div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 12px; margin-bottom: 10px; border-left: 4px solid ${borderColor};">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
          <div>
            <div style="font-weight: 600; font-size: 15px;">${statusIcon} งวดที่ ${payment.month}</div>
            <div style="font-size: 12px; opacity: 0.8; margin-top: 2px;">${dateStr}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 18px; font-weight: 700; color: #22c55e;">-${payment.paymentAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
            <div style="font-size: 12px; opacity: 0.8;">บาท</div>
          </div>
        </div>
        <div style="font-size: 13px; opacity: 0.9; line-height: 1.6;">
          <div style="display: flex; justify-content: space-between;">
            <span>ควรจ่าย:</span>
            <span><strong>${payment.shouldPay.toLocaleString(undefined, {maximumFractionDigits: 2})}</strong> บาท</span>
          </div>
          ${payment.unpaid > 0 ? `
          <div style="display: flex; justify-content: space-between; color: #ef4444;">
            <span>ค้างชำระ:</span>
            <span><strong>+${payment.unpaid.toLocaleString(undefined, {maximumFractionDigits: 2})}</strong> บาท</span>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between;">
            <span>ดอกเบี้ย:</span>
            <span><strong>${payment.interestPaid.toLocaleString(undefined, {maximumFractionDigits: 2})}</strong> บาท</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>เงินต้น:</span>
            <span><strong>${payment.principalPaid.toLocaleString(undefined, {maximumFractionDigits: 2})}</strong> บาท</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 5px; padding-top: 5px; border-top: 1px solid rgba(255, 255, 255, 0.2);">
            <span>คงเหลือ:</span>
            <span style="color: ${payment.remainingBalance > 0 ? '#f59e0b' : '#22c55e'};"><strong>${payment.remainingBalance.toLocaleString(undefined, {maximumFractionDigits: 2})}</strong> บาท</span>
          </div>
        </div>
      </div>
    `;
  });

  historyDiv.innerHTML = html;
}
  // ฟังก์ชันคำนวณเงินปันผลกองทุน
  // ฟังก์ชันคำนวณเงินปันผลกองทุน (ฉบับสมบูรณ์)
function showDividendPage() {
  app.innerHTML = `
    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
      <div style="font-size: 36px;">💵</div>
      <div>
        <h2 style="margin: 0; font-size: 24px;">คำนวณเงินปันผลกองทุน</h2>
        <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 14px;">คำนวณผลตอบแทนจากการลงทุนกองทุนรวม</p>
      </div>
    </div>

    <label>จำนวนเงินลงทุนเริ่มต้น (บาท)</label>
    <input id="invest-amount" type="number" placeholder="เช่น 100000" step="0.01">
    
    <label>ผลตอบแทนเฉลี่ยต่อปี (%)</label>
    <input id="return-rate" type="number" placeholder="เช่น 5-8%" step="0.01">

    <label>ระยะเวลาลงทุน (ปี)</label>
    <input id="invest-years" type="number" placeholder="เช่น 10" min="1">

    <label>ลงทุนเพิ่มสม่ำเสมอทุกเดือน (บาท)</label>
    <input id="monthly-invest" type="number" placeholder="0 หากไม่มี (ไม่บังคับ)" step="0.01" value="0">

    <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); padding: 15px; border-radius: 12px; margin: 15px 0; font-size: 13px; border: 1px solid rgba(255, 255, 255, 0.2);">
      <p style="margin: 0 0 8px 0; font-weight: bold;">💡 ข้อมูลเพิ่มเติม</p>
      <p style="margin: 4px 0;">• กองทุนหุ้น: ผลตอบแทนเฉลี่ย 8-12% ต่อปี (ความเสี่ยงสูง)</p>
      <p style="margin: 4px 0;">• กองทุนผสม: ผลตอบแทนเฉลี่ย 5-8% ต่อปี (ความเสี่ยงปานกลาง)</p>
      <p style="margin: 4px 0;">• กองทุนตราสารหนี้: ผลตอบแทนเฉลี่ย 2-4% ต่อปี (ความเสี่ยงต่ำ)</p>
      <p style="margin: 4px 0;">• ค่าใช้จ่ายและภาษีอาจลดผลตอบแทนจริง</p>
      <p style="margin: 4px 0; color: #fbbf24; font-weight: 600;">⚠️ ระบบจะหักภาษี 10% จากกำไรอัตโนมัติ</p>
    </div>

    <button id="calc-dividend">คำนวณ</button>
    <div id="dividend-result" class="result"></div>
  `;

  sectionRecords.style.display = "none";
  sectionList.style.display = "none";
  sectionChart.style.display = "none";

  document.getElementById("calc-dividend").onclick = () => {
    const initialInvest = +document.getElementById("invest-amount").value;
    const annualReturn = +document.getElementById("return-rate").value / 100;
    const years = +document.getElementById("invest-years").value;
    const monthlyInvest = +document.getElementById("monthly-invest").value || 0;

    // ตรวจสอบข้อมูลที่กรอก
    if (!initialInvest || initialInvest < 0) {
      alert("กรุณากรอกจำนวนเงินลงทุนที่ถูกต้อง");
      return;
    }

    if (!annualReturn || annualReturn <= 0) {
      alert("กรุณากรอกผลตอบแทนที่ถูกต้อง");
      return;
    }

    if (!years || years <= 0) {
      alert("กรุณากรอกระยะเวลาลงทุนที่ถูกต้อง");
      return;
    }

    // คำนวณมูลค่าสุดท้าย (Future Value with Monthly Contributions)
    const monthlyRate = annualReturn / 12;
    const totalMonths = years * 12;

    // มูลค่าจากเงินลงทุนเริ่มต้น (ทบต้น)
    const futureValueInitial = initialInvest * Math.pow(1 + annualReturn, years);

    // มูลค่าจากการลงทุนรายเดือน
    let futureValueMonthly = 0;
    if (monthlyInvest > 0 && monthlyRate > 0) {
      futureValueMonthly = monthlyInvest * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
    } else if (monthlyInvest > 0) {
      futureValueMonthly = monthlyInvest * totalMonths;
    }

    const totalFutureValue = futureValueInitial + futureValueMonthly;
    const totalInvested = initialInvest + (monthlyInvest * totalMonths);
    const totalReturn = totalFutureValue - totalInvested;

    // คำนวณภาษี 10% จากกำไร
    const taxAmount = totalReturn * 0.10;
    const netReturn = totalReturn - taxAmount;
    const finalAmount = totalInvested + netReturn;

    document.getElementById("dividend-result").innerHTML = `
      <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); padding: 20px; border-radius: 16px; margin-top: 20px; border: 1px solid rgba(255, 255, 255, 0.2);">
        <p style="margin: 0 0 15px 0; font-size: 18px;"><strong>📊 สรุปการคำนวณผลตอบแทน</strong></p>
        <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.2); margin: 15px 0;">
        <p style="margin: 8px 0;">เงินลงทุนเริ่มต้น: <strong>${initialInvest.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong> บาท</p>
        <p style="margin: 8px 0;">ลงทุนเพิ่มรายเดือน: <strong>${monthlyInvest.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong> บาท</p>
        <p style="margin: 8px 0;">ผลตอบแทนเฉลี่ย: <strong>${(annualReturn * 100).toFixed(2)}% ต่อปี</strong></p>
        <p style="margin: 8px 0;">ระยะเวลา: <strong>${years} ปี</strong></p>
        <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.2); margin: 15px 0;">
        <p style="margin: 8px 0; font-size: 16px;">เงินลงทุนรวมทั้งหมด: ${totalInvested.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</p>
        <p style="margin: 8px 0; font-size: 16px;">มูลค่าทั้งหมด (ก่อนหักภาษี): ${totalFutureValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</p>
        <p style="margin: 8px 0; font-size: 16px; color: #22c55e;">กำไรจากการลงทุน (ก่อนหักภาษี): +${totalReturn.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</p>
        <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.2); margin: 15px 0;">
        <div style="background: rgba(239, 68, 68, 0.2); padding: 12px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.3); margin: 10px 0;">
          <p style="margin: 0 0 5px 0; font-size: 14px; opacity: 0.9;">⚠️ หักภาษี 10% จากกำไร</p>
          <p style="margin: 0; font-size: 18px; font-weight: 700; color: #ef4444;">-${taxAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</p>
        </div>
        <p style="margin: 12px 0 8px 0; font-size: 20px; color: #22c55e;"><strong>💰 กำไรสุทธิ (หลังหักภาษี): +${netReturn.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</strong></p>
        <p style="margin: 8px 0; font-size: 22px;"><strong>💵 มูลค่าสุทธิที่ได้รับ: ${finalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</strong></p>
      </div>
    `;

    showNotification("คำนวณเงินปันผลสำเร็จ! ✅");
  };
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