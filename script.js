const auth = firebase.auth();

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

// ---------- DASHBOARD INIT ----------
window.onload = () => {

  const username = document.getElementById("username");

  if(username){
    if(!localStorage.getItem("uid")){
      window.location.href = "index.html";
      return;
    }

    username.textContent = "สวัสดี " + localStorage.getItem("name");

    show("expense");
    toggleSections("expense");
    loadData();

    document.getElementById("btn-expense").onclick = () => {
      show("expense");
      toggleSections("expense");
    };

    document.getElementById("btn-tax").onclick = () => {
      show("tax");
      toggleSections("tax");
    };

    document.getElementById("btn-interest").onclick = () => {
      show("interest");
      toggleSections("interest");
    };

    document.getElementById("btn-add").onclick = addItemHandler;
  }
};

// ---------- PAGES ----------
function show(type) {
  const app = document.getElementById("app");

  if(type === "expense") {
    app.innerHTML = `
      <h2>คำนวณรายรับ - รายจ่าย</h2>
      <input id="income" type="number" placeholder="รายรับ (บาท)" />
      <input id="expense" type="number" placeholder="รายจ่าย (บาท)" />
      <button onclick="calcExpense()">คำนวณ</button>
      <p class="result" id="res"></p>
    `;
  }

  if(type === "tax") {
    app.innerHTML = `
      <h2>คำนวณภาษี</h2>
      <input id="salary" type="number" placeholder="รายได้ต่อปี" />
      <button onclick="calcTax()">คำนวณภาษี</button>
      <p class="result" id="res"></p>
    `;
  }

  if(type === "interest") {
    app.innerHTML = `
      <h2>คำนวณดอกเบี้ย</h2>
      <input id="p" type="number" placeholder="เงินต้น" />
      <input id="r" type="number" placeholder="อัตราดอกเบี้ย (%)" />
      <input id="t" type="number" placeholder="จำนวนปี" />
      <button onclick="calcInterest()">คำนวณ</button>
      <p class="result" id="res"></p>
    `;
  }
}

// ---------- CALCULATE ----------
function calcExpense(){
  const i = Number(document.getElementById("income").value||0);
  const e = Number(document.getElementById("expense").value||0);
  document.getElementById("res").textContent = `คงเหลือ: ${i-e} บาท`;
}

function calcTax(){
  const s = Number(document.getElementById("salary").value||0);
  let tax = 0;

  if(s <= 150000) tax = 0;
  else if(s <= 300000) tax = (s-150000)*0.05;
  else if(s <= 500000) tax = (150000*0.05)+(s-300000)*0.1;
  else if(s <= 750000) tax = (150000*0.05)+(200000*0.1)+(s-500000)*0.15;
  else if(s <= 1000000) tax = (150000*0.05)+(200000*0.1)+(250000*0.15)+(s-750000)*0.2;
  else tax = (150000*0.05)+(200000*0.1)+(250000*0.15)+(250000*0.2)+(s-1000000)*0.25;

  document.getElementById("res").textContent = `ภาษีที่ต้องจ่าย: ${tax.toFixed(2)} บาท`;
}

function calcInterest(){
  const p = Number(document.getElementById("p").value||0);
  const r = Number(document.getElementById("r").value||0)/100;
  const t = Number(document.getElementById("t").value||0);

  const total = p * (1 + r * t);
  document.getElementById("res").textContent = `ยอดรวม: ${total.toFixed(2)} บาท`;
}

// ---------- RECORDS ----------
function addItemHandler(){
  const title = document.getElementById("title").value.trim();
  const amount = Number(document.getElementById("amount").value||0);
  const type = document.getElementById("type").value;

  if(!title || amount <= 0){
    alert("กรอกข้อมูลให้ครบ");
    return;
  }

  const records = JSON.parse(localStorage.getItem("records")||"[]");
  records.push({title, amount, type});

  localStorage.setItem("records", JSON.stringify(records));
  document.getElementById("title").value = "";
  document.getElementById("amount").value = "";
  loadData();
}

function deleteItem(index){
  const records = JSON.parse(localStorage.getItem("records")||"[]");
  records.splice(index,1);
  localStorage.setItem("records", JSON.stringify(records));
  loadData();
}

// ---------- LOAD ----------
let chart;

function loadData(){
  const list = document.getElementById("list");
  const totalTxt = document.getElementById("total");

  let income = 0;
  let expense = 0;

  const records = JSON.parse(localStorage.getItem("records")||"[]");
  list.innerHTML = "";

  records.forEach((item,i)=>{
    const li = document.createElement("li");
    li.innerHTML = `
      ${item.title} : ${item.amount} บาท (${item.type})
      <button class="btn-del" onclick="deleteItem(${i})">ลบ</button>
    `;
    list.appendChild(li);

    if(item.type === "income") income += item.amount;
    else expense += item.amount;
  });

  totalTxt.textContent = `คงเหลือสุทธิ: ${income-expense} บาท`;

  drawChart(income,expense);
}

// ---------- CHART ----------
function drawChart(income, expense){
  const ctx = document.getElementById("chart");

  if(chart) chart.destroy();

  chart = new Chart(ctx,{
    type: 'doughnut',
    data:{
      labels:["รายรับ","รายจ่าย"],
      datasets:[{
        data:[income,expense],
        backgroundColor:["#22c55e","#ef4444"]
      }]
    }
  });
}

// ---------- TOGGLE ----------
function toggleSections(type){
  const s1 = document.getElementById("section-records");
  const s2 = document.getElementById("section-list");
  const s3 = document.getElementById("section-chart");

  if(type === "expense"){
    s1.style.display = "block";
    s2.style.display = "block";
    s3.style.display = "block";
  } else {
    s1.style.display = "none";
    s2.style.display = "none";
    s3.style.display = "none";
  }
}
