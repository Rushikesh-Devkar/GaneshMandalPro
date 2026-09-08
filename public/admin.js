const $ = (id) => document.getElementById(id);

let adminToken = localStorage.getItem("gm_admin_token");

function money(n){ return "₹" + Number(n||0).toLocaleString("en-IN"); }
function dt(x){ return x ? new Date(x).toLocaleDateString("en-IN") : "-"; }

async function adminApi(path, opt = {}) {
  const response = await fetch("/api/admin" + path, {
    ...opt,
    headers: {
      "Content-Type": "application/json",
      ...(adminToken ? { Authorization: "Bearer " + adminToken } : {})
    }
  });
  const text = await response.text();
  let data = {};
  if (text) { try { data = JSON.parse(text); } catch (e) { data = {}; } }
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}

function showView() {
  if (!adminToken) {
    $("loginView").classList.remove("hidden");
    $("panelView").classList.add("hidden");
  } else {
    $("loginView").classList.add("hidden");
    $("panelView").classList.remove("hidden");
    loadMandals();
  }
}

$("adminLoginForm").onsubmit = async (e) => {
  e.preventDefault();
  $("errMsg").textContent = "";
  try {
    const data = await adminApi("/login", {
      method: "POST",
      body: JSON.stringify({
        username: $("adminUsername").value,
        password: $("adminPassword").value
      })
    });
    adminToken = data.token;
    localStorage.setItem("gm_admin_token", adminToken);
    showView();
  } catch (err) {
    $("errMsg").textContent = err.message;
  }
};

$("adminLogoutBtn").onclick = () => {
  adminToken = null;
  localStorage.removeItem("gm_admin_token");
  showView();
};

$("refreshBtn").onclick = loadMandals;

async function loadMandals() {
  try {
    const mandals = await adminApi("/mandals");
    const body = $("mandalRows");
    body.innerHTML = "";
    mandals.forEach((m) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${m.name}<br><small style="color:#888">${m.address || ""}</small></td>
        <td>${m.username}</td>
        <td>${m.mobile || "-"}</td>
        <td><span class="badge ${m.isApproved ? "approved" : "pending"}">${m.isApproved ? "Approved" : "Pending payment"}</span></td>
        <td>${dt(m.createdAt)}</td>
        <td class="row-actions"></td>
      `;
      const actionsCell = tr.querySelector(".row-actions");

      if (!m.isApproved) {
        const approveBtn = document.createElement("button");
        approveBtn.className = "primary";
        approveBtn.textContent = "✅ Approve";
        approveBtn.onclick = () => approve(m.id);
        actionsCell.appendChild(approveBtn);

        const rejectBtn = document.createElement("button");
        rejectBtn.className = "secondary";
        rejectBtn.textContent = "❌ Reject";
        rejectBtn.onclick = () => reject(m.id);
        actionsCell.appendChild(rejectBtn);
      } else {
        const revokeBtn = document.createElement("button");
        revokeBtn.className = "secondary";
        revokeBtn.textContent = "⛔ Revoke";
        revokeBtn.onclick = () => revoke(m.id);
        actionsCell.appendChild(revokeBtn);
      }

      body.appendChild(tr);
    });
  } catch (err) {
    if (err.message.includes("Invalid admin session") || err.message.includes("required")) {
      adminToken = null;
      localStorage.removeItem("gm_admin_token");
      showView();
    } else {
      alert(err.message);
    }
  }
}

async function approve(id) {
  try {
    await adminApi(`/mandals/${id}/approve`, { method: "PUT" });
    loadMandals();
  } catch (err) { alert(err.message); }
}

async function revoke(id) {
  if (!confirm("Ya mandal cha access revoke karायचا?")) return;
  try {
    await adminApi(`/mandals/${id}/revoke`, { method: "PUT" });
    loadMandals();
  } catch (err) { alert(err.message); }
}

async function reject(id) {
  if (!confirm("Ya pending registration delete karायची?")) return;
  try {
    await adminApi(`/mandals/${id}`, { method: "DELETE" });
    loadMandals();
  } catch (err) { alert(err.message); }
}

showView();