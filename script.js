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

// ---------- DASHBOARD INIT ----------
window.onload = () => {
  const username = document.getElementById("username");
  if(username){
    if(!localStorage.getItem("uid")){
      window.location.href = "index.html";
      return;
    }
    username.textContent = "สวัสดี " + localStorage.getItem("name");
  }

  // แสดงหน้า default
  show('expense');
  toggleSections('expense');

  // ปุ่มหน้า
  document.getElementById("btn-expense").onclick = () => { show('expense'); toggleSections('expense'); };
  document.getElementById("btn-tax").onclick = () => { show('tax'); toggleSections('tax'); };
  document.getElementById("btn-interest").onclick = () => { show('interest'); toggleSections('interest'); };

  document.getElementById("btn-add").onclick = addItemHandler;
}

// ---------- SHOW PAGES ----------
function show(type){
  const app = document.getElementById('app');
  if(type === 'expense'){
    app.innerHTML = `
      <h2>คำนวณรายรับ - รายจ่าย</h2>
      <label>รายรับ (บาท)<input id="income" type="number" placeholder="0" /></label>
      <label>รายจ่าย (บาท)<input id="expense" type="number" placeholder="0" /></label>
      <button onclick="calcExpense()">คำนวณ</button>
      <p class="result" id="res"></p>`;
  } else if(type === 'tax'){
    app.innerHTML = `
      <h2>คำนวณภาษี (ตัวอย่าง)</h2>
      <label>รายได้ทั้งปี (บาท)<input id="salary" type="number" placeholder="0" /></label>
      <button onclick="calcTax()">คำนวณภาษี</button>
      <p class="result" id="res"></p>`;
  } else if(type === 'interest'){
    app.innerHTML = `
      <h2>คำนวณดอกเบี้ย</h2>
      <label>จำนวนเงิน (P)<input id="p" type="number" placeholder="0" /></label>
      <label>อัตราดอกเบี้ยต่อปี (%)<input id="r" type="number" placeholder="0" /></label>
      <label>ระยะเวลา (ปี)<input id="t" type="number" placeholder="0" /></label>
      <button onclick="calcInterest()">คำนวณ</button>
      <p class="result" id="res"></p>`;
  }
}

// ---------- CALCULATION ----------
function calcExpense(){
  const income = Number(document.getElementById('income')?.value||0);
  const expense = Number(document.getElementById('expense')?.value||0);
  document.getElementById('res').textContent = `คงเหลือ: ${(income - expense).toFixed(2)} บาท`;
}

function calcTax(){
  const s = Number(document.getElementById('salary')?.value||0);
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
  const p = Number(document.getElementById('p')?.value||0);
  const r = Number(document.getElementById('r')?.value||0)/100;
  const t = Number(document.getElementById('t')?.value||0);
  const amount = p * (1 + r * t);
  document.getElementById('res').textContent = `ยอดรวม: ${amount.toFixed(2)} บาท`;
}

// ---------- RECORD HANDLER ----------
function addItemHandler(){
  const title = document.getElementById("title").value.trim();
  const amount = Number(document.getElementById("amount").value||0);
  const type = document.getElementById("type").value;
  if(!title || amount <=0) return alert("กรอกข้อมูลไม่ครบหรือไม่ถูกต้อง");
  addItem(title, amount, type);
  document.getElementById("title").value="";
  document.getElementById("amount").value="";
}

function addItem(title, amount, type){
  let records = JSON.parse(localStorage.getItem("records") || "[]");
  records.push({title, amount, type});
  localStorage.setItem("records", JSON.stringify(records));
  loadData();
}

function deleteItem(index){
  let records = JSON.parse(localStorage.getItem("records") || "[]");
  records.splice(index,1);
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

  records.forEach((data,i)=>{
    if(list){
      const li=document.createElement("li");
      li.innerHTML=`${data.title}: ${data.amount} บาท (${data.type}) 
        <button class="btn-del" onclick="deleteItem(${i})">ลบ</button>`;
      list.appendChild(li);
    }
    if(data.type==="income") income+=data.amount;
    else expense+=data.amount;
  });

  if(totalTxt) totalTxt.textContent=`คงเหลือสุทธิ: ${income - expense} บาท`;

  drawChart(income, expense);
}

// ---------- CHART ----------
let chart;
function drawChart(income, expense){
  const ctx = document.getElementById("chart");
  if(!ctx) return;

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

// ---------- TOGGLE SECTION ----------
function toggleSections(type){
  const sections = ['section-records','section-list','section-chart'];
  if(type==='expense'){
    sections.forEach(s=>document.getElementById(s).style.display='block');
  }else{
    sections.forEach(s=>document.getElementById(s).style.display='none');
  }
}
