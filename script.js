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

// ---------- PROTECT DASHBOARD ----------
if (document.getElementById("username")) {
  if (!localStorage.getItem("uid")) {
    window.location.href = "index.html";
  } else {
    document.getElementById("username").textContent = "สวัสดี " + localStorage.getItem("name");
    loadData();
  }
}

let chart;

// ---------- ADD ITEM ----------
function addItem() {
  const title = document.getElementById("title").value;
  const amount = Number(document.getElementById("amount").value);
  const type = document.getElementById("type").value;

  if (!title || !amount) return alert("กรอกข้อมูลไม่ครบ");

  let records = JSON.parse(localStorage.getItem("records") || "[]");
  records.push({ title, amount, type });
  localStorage.setItem("records", JSON.stringify(records));

  document.getElementById("title").value = "";
  document.getElementById("amount").value = "";

  loadData();
}

// ---------- LOAD DATA ----------
function loadData() {
  const list = document.getElementById("list");
  const totalTxt = document.getElementById("total");

  let income = 0, expense = 0;
  const records = JSON.parse(localStorage.getItem("records") || "[]");

  list.innerHTML = "";

  records.forEach(data => {
    const li = document.createElement("li");
    li.textContent = `${data.title} : ${data.amount} บาท (${data.type})`;
    list.appendChild(li);

    if (data.type === "income") income += data.amount;
    else expense += data.amount;
  });

  const total = income - expense;
  totalTxt.textContent = `คงเหลือสุทธิ: ${total} บาท`;

  drawChart(income, expense);
}

// ---------- DRAW CHART ----------
function drawChart(income, expense) {
  const ctx = document.getElementById("chart");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ["รายรับ", "รายจ่าย"],
      datasets: [{
        data: [income, expense],
        backgroundColor: ["#22c55e", "#ef4444"]
      }]
    }
  });
}
