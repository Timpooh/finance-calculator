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
      alert("Login ไม่สำเร็จ: " + error.message);
    });
}

// ---------- LOGOUT ----------
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// ---------- INIT DASHBOARD ----------
window.onload = () => {
  if(document.getElementById("username")){
    if(!localStorage.getItem("uid")){
      window.location.href = "index.html";
      return;
    }
    document.getElementById("username").textContent = "สวัสดี " + localStorage.getItem("name");
    bindButtons();
    showPage('expense'); // default
  }
}

// ---------- NAVIGATION ----------
function bindButtons(){
  document.getElementById("btn-logout").onclick = logout;
  document.getElementById("btn-expense").onclick = ()=>showPage('expense');
  document.getElementById("btn-tax").onclick = ()=>showPage('tax');
  document.getElementById("btn-interest").onclick = ()=>showPage('interest');
}

// ---------- SHOW PAGES ----------
function showPage(type){
  const app = document.getElementById('app');
  app.innerHTML = ''; // clear previous
  if(type==='expense'){
    app.innerHTML = `
      <h2>รายรับ - รายจ่าย</h2>
      <div class="calc-add">
        <label>รายรับ (บาท)<input id="income" type="number" /></label>
        <label>รายจ่าย (บาท)<input id="expense" type="number" /></label>
        <button onclick="calcExpense()">คำนวณ</button>
        <p class="result" id="res"></p>
      </div>
      <div class="calc-add">
        <label>ชื่อรายการ<input id="title" type="text" /></label>
        <label>จำนวนเงิน<input id="amount" type="number" /></label>
        <select id="type">
          <option value="income">รายรับ</option>
          <option value="expense">รายจ่าย</option>
        </select>
        <button onclick="addRecord()">เพิ่มรายการ</button>
      </div>
      <h3>รายการทั้งหมด</h3>
      <ul id="list"></ul>
      <p class="result" id="total">คงเหลือสุทธิ: 0 บาท</p>
      <canvas id="chart"></canvas>`;
    loadData();
  } else if(type==='tax'){
    app.innerHTML = `
      <h2>คำนวณภาษี</h2>
      <label>รายได้ทั้งปี (บาท)<input id="salary" type="number" /></label>
      <button onclick="calcTax()">คำนวณ</button>
      <p class="result" id="res"></p>`;
  } else if(type==='interest'){
    app.innerHTML = `
      <h2>คำนวณดอกเบี้ย</h2>
      <label>จำนวนเงิน (P)<input id="p" type="number" /></label>
      <label>อัตราดอกเบี้ยต่อปี (%)<input id="r" type="number" /></label>
      <label>ระยะเวลา (ปี)<input id="t" type="number" /></label>
      <button onclick="calcInterest()">คำนวณ</button>
      <p class="result" id="res"></p>`;
  }
}

// ---------- CALCULATION ----------
function calcExpense(){
  const income = Number(document.getElementById('income').value||0);
  const expense = Number(document.getElementById('expense').value||0);
  document.getElementById('res').textContent = `คงเหลือ: ${(income-expense).toFixed(2)} บาท`;
}

function calcTax(){
  const s = Number(document.getElementById('salary').value||0);
  let tax=0;
  if(s<=150000) tax=0;
  else if(s<=300000) tax=(s-150000)*0.05;
  else if(s<=500000) tax=(150000*0.05)+(s-300000)*0.1;
  else if(s<=750000) tax=(150000*0.05)+(200000*0.1)+(s-500000)*0.15;
  else if(s<=1000000) tax=(150000*0.05)+(200000*0.1)+(250000*0.15)+(s-750000)*0.2;
  else tax=(150000*0.05)+(200000*0.1)+(250000*0.15)+(250000*0.2)+(s-1000000)*0.25;
  document.getElementById('res').textContent=`ภาษีที่ต้องจ่าย: ${tax.toFixed(2)} บาท`;
}

function calcInterest(){
  const p = Number(document.getElementById('p').value||0);
  const r = Number(document.getElementById('r').value||0)/100;
  const t = Number(document.getElementById('t').value||0);
  const amount = p*(1+r*t);
  document.getElementById('res').textContent=`ยอดรวม: ${amount.toFixed(2)} บาท`;
}

// ---------- RECORDS ----------
function addRecord(){
  const title = document.getElementById('title').value.trim();
  const amount = Number(document.getElementById('amount').value||0);
  const type = document.getElementById('type').value;
  if(!title || !amount) return alert("กรอกข้อมูลไม่ครบ");
  let records = JSON.parse(localStorage.getItem("records")||"[]");
  records.push({title,amount,type});
  localStorage.setItem("records",JSON.stringify(records));
  document.getElementById('title').value='';
  document.getElementById('amount').value='';
  loadData();
}

function loadData(){
  const list = document.getElementById('list');
  const totalTxt = document.getElementById('total');
  const records = JSON.parse(localStorage.getItem("records")||"[]");
  if(!list) return;
  list.innerHTML='';
  let income=0, expense=0;
  records.forEach(r=>{
    const li=document.createElement('li');
    li.textContent=`${r.title}: ${r.amount} บาท (${r.type})`;
    list.appendChild(li);
    if(r.type==='income') income+=r.amount;
    else expense+=r.amount;
  });
  if(totalTxt) totalTxt.textContent=`คงเหลือสุทธิ: ${income-expense} บาท`;
  drawChart(income,expense);
}

// ---------- CHART ----------
let chart;
function drawChart(income,expense){
  const ctx=document.getElementById('chart');
  if(!ctx) return;
  if(chart) chart.destroy();
  chart=new Chart(ctx,{
    type:'doughnut',
    data:{
      labels:['รายรับ','รายจ่าย'],
      datasets:[{data:[income,expense],backgroundColor:['#22c55e','#ef4444']}]
    }
  });
}
