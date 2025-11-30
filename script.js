function show(type){
  const app = document.getElementById('app');
  if(type === 'expense'){
    app.innerHTML = `
      <div class="section">
        <h2>คำนวณรายรับ - รายจ่าย</h2>
        <label>รายรับ (บาท)<input id="income" type="number" /></label>
        <label>รายจ่าย (บาท)<input id="expense" type="number" /></label>
        <button onclick="calcExpense()">คำนวณ</button>
        <p class="result" id="res"></p>
      </div>`;
  } else if(type === 'tax'){
    app.innerHTML = `
      <div class="section">
        <h2>คำนวณภาษี (ตัวอย่าง)</h2>
        <label>รายได้ทั้งปี (บาท)<input id="salary" type="number" /></label>
        <button onclick="calcTax()">คำนวณภาษี</button>
        <p class="result" id="res"></p>
      </div>`;
  } else if(type === 'interest'){
    app.innerHTML = `
      <div class="section">
        <h2>คำนวณดอกเบี้ย</h2>
        <label>จำนวนเงิน (P)<input id="p" type="number" /></label>
        <label>อัตราดอกเบี้ยต่อปี (%)<input id="r" type="number" /></label>
        <label>ระยะเวลา (ปี)<input id="t" type="number" /></label>
        <button onclick="calcInterest()">คำนวณ</button>
        <p class="result" id="res"></p>
      </div>`;
  }
}

function calcExpense(){
  const income = Number(document.getElementById('income').value||0);
  const expense = Number(document.getElementById('expense').value||0);
  document.getElementById('res').textContent = `คงเหลือ: ${(income - expense).toFixed(2)} บาท`;
}

function calcTax(){
  const s = Number(document.getElementById('salary').value||0);
  let tax = 0;
  if(s <= 150000) tax = 0;
  else if(s <= 300000) tax = (s - 150000) * 0.05;
  else if(s <= 500000) tax = (150000 * 0.05) + (s - 300000) * 0.1;
  // เติมขั้นถ้าต้องการ
  document.getElementById('res').textContent = `ภาษีที่ต้องจ่าย: ${tax.toFixed(2)} บาท`;
}

function calcInterest(){
  const p = Number(document.getElementById('p').value||0);
  const r = Number(document.getElementById('r').value||0) / 100;
  const t = Number(document.getElementById('t').value||0);
  const amount = p * (1 + r * t); // simple interest
  document.getElementById('res').textContent = `ยอดรวม: ${amount.toFixed(2)} บาท`;
}

// แสดงหน้า default
show('expense');
