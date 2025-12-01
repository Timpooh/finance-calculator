// ---------- LOGIN ----------
function login() {
  const provider = new firebase.auth.GoogleAuthProvider();

  auth.signInWithPopup(provider)
    .then((result) => {
      localStorage.setItem("uid", result.user.uid);
      localStorage.setItem("name", result.user.displayName);
      window.location.href = "dashboard.html";
    })
    .catch((error) => {
      console.error("Login failed", error);
      alert("Login ไม่สำเร็จ: " + error.message);
    });
}

// ---------- LOGOUT ----------
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// ---------- SHOW CALCULATION PAGES ----------
function show(type){
  const app = document.getElementById('app');
  if(type === 'expense'){
    app.innerHTML = `
      <h2>คำนวณรายรับ - รายจ่าย</h2>
      <label>รายรับ (บาท)<input id="income" type="number" /></label>
      <label>รายจ่าย (บาท)<input id="expense" type="number" /></label>
      <button onclick="calcExpense()">คำนวณ</button>
      <p class="result" id="res"></p>`;
  } else if(type === 'tax'){
    app.innerHTML = `
      <h2>คำนวณภาษี (ตัวอย่าง)</h2>
      <label>รายได้ทั้งปี (บาท)<input id="salary" type="number" /></label>
      <button onclick="calcTax()">คำนวณภาษี</button>
      <p class="result" id="res"></p>`;
  } else if(type === 'interest'){
    app.innerHTML = `
      <h2>คำนวณดอกเบี้ย</h2>
      <label>จำนวนเงิน (P)<input id="p" type="number" /></label>
      <label>อัตราดอกเบี้ยต่อปี (%)<input id="r" type="number" /></label>
      <label>ระยะเวลา (ปี)<input id="t" type="number" /></label>
      <button onclick="calcInterest()">คำนวณ</button>
      <p class="result" id="res"></p>`;
  }
}

// ---------- CALCULATION FUNCTIONS ----------
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
  else if(s <= 750000) tax = (150000 * 0.05) + (200000 * 0.1) + (s - 500000) * 0.15;
  else if(s <= 1000000) tax = (150000 * 0.05) + (200000 * 0.1) + (250000 * 0.15) + (s - 750000) * 0.2;
  else tax = (150000 * 0.05) + (200000 * 0.1) + (250000 * 0.15) + (250000 * 0.2) + (s - 1000000) * 0.25;
  document.getElementById('res').textContent = `ภาษีที่ต้องจ่าย: ${tax.toFixed(2)} บาท`;
}

function calcInterest(){
  const p = Number(document.getElementById('p').value||0);
  const r = Number(document.getElementById('r').value||0) / 100;
  const t = Number(document.getElementById('t').value||0);
  const amount = p * (1 + r * t);
  document.getElementById('res').textContent = `ยอดรวม: ${amount.toFixed(2)} บาท`;
}

// ---------- LOCALSTORAGE RECORDS ----------
function addItem(title, amount, type){
  let records = JSON.parse(localStorage.getItem("records") || "[]");
  records.push({title, amount, type});
  localStorage.setItem("records", JSON.stringify(records));
  loadData();
}

// ---------- LOAD DATA ----------
function loadData(){
  const list = document.getElementById("list");
  const totalTxt = document.getElementById("total");
  let income=0, expense=0;
  const records = JSON.parse(localStorage.getItem("records") || "[]");

  if(list) list.innerHTML = "";

  records.forEach(data=>{
    if(list){
      const li=document.createElement("li");
      li.textContent=`${data.title}: ${data.amount} บาท (${data.type})`;
      list.appendChild(li);
    }
    if(data.type==="income") income+=data.amount;
    else expense+=data.amount;
  });

  if(totalTxt) totalTxt.textContent=`คงเหลือสุทธิ: ${income - expense} บาท`;

  drawChart(income, expense);
}

let chart;
function drawChart(income, expense){
  const ctx = document.getElementById("chart");
  if(!ctx) return; // ป้องกัน error ถ้า canvas ยังไม่โหลด

  if(chart) chart.destroy();

  chart = new Chart(ctx,{
    type:'doughnut',
    data:{
      labels:["รายรับ","รายจ่าย"],
      datasets:[{
        data:[income, expense],
        backgroundColor:["#22c55e","#ef4444"]
      }]
    }
  });
}

// ---------- INIT DASHBOARD ----------
window.onload = () => {
  if(document.getElementById("username")){
    if(!localStorage.getItem("uid")){
      window.location.href = "index.html";
      return;
    }
    document.getElementById("username").textContent = "สวัสดี " + localStorage.getItem("name");
    loadData();
  }

  // แสดงหน้า default
  show('expense');
}
