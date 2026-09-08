// ===================== BASIC HELPERS =====================

const $ = (id) => document.getElementById(id);

let token = localStorage.getItem("gm_token");

let mandal = JSON.parse(
  localStorage.getItem("gm_mandal") || "null"
);


// ===================== API =====================

const api = async (path, opt = {}) => {

  const response = await fetch("/api" + path, {
    ...opt,

    headers: {
      "Content-Type": "application/json",

      ...(token
        ? {
            Authorization: "Bearer " + token
          }
        : {})
    }
  });

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || "Request failed"
    );
  }

  return data;
};


// ===================== FORMAT HELPERS =====================

const money = (n) => {
  return "₹" + Number(n || 0).toLocaleString("en-IN");
};


const date = (x) => {
  return x
    ? new Date(x).toLocaleDateString("en-IN")
    : "-";
};


const today = () => {
  return new Date()
    .toISOString()
    .slice(0, 10);
};


// ===================== TOAST =====================

function toast(message) {

  $("toast").textContent = message;

  $("toast").classList.add("show");

  setTimeout(() => {
    $("toast").classList.remove("show");
  }, 2500);
}


// ===================== SHOW APP =====================

function showApp() {

  if (!token || !mandal) {

    $("authView").classList.remove("hidden");

    $("appView").classList.add("hidden");

    return;
  }

  $("authView").classList.add("hidden");

  $("appView").classList.remove("hidden");

  $("mandalName").textContent =
    mandal.name;

  $("mandalAddress").textContent =
    mandal.address || "";

  loadAll();
}


// ===================== DASHBOARD =====================

async function loadDashboard() {

  const data = await api("/dashboard");

  const values = [
    data.totalVargani,
    data.totalCollection,
    data.cash,
    data.online,
    data.pending,
    data.totalExpense,
    data.balance
  ];

  const ids = [
    "statVargani",
    "statTotal",
    "statCash",
    "statOnline",
    "statPending",
    "statExpense",
    "statBalance"
  ];

  ids.forEach((id, index) => {

    $(id).textContent =
      money(values[index]);

  });
}


// ===================== VARGANI LIST =====================

async function loadContributions() {

  const list = await api(
    "/contributions"
  );

  const body = $("varganiBody");

  if (!list.length) {

    body.innerHTML = `
      <tr>
        <td colspan="9"
            style="text-align:center;padding:25px">
          अजून कोणतीही वर्गणी नाही
        </td>
      </tr>
    `;

    return;
  }

  body.innerHTML = list.map((item) => {

    return `
      <tr>

        <td>
          ${item.receiptNo || "-"}
        </td>

        <td>
          ${item.donorName}
        </td>

        <td>
          ${item.mobile || "-"}
        </td>

        <td>
          ${money(item.amount)}
        </td>

        <td>
          ${item.paymentMode}
        </td>

        <td>
          ${item.collectedBy}
        </td>

        <td>
          ${date(item.date)}
        </td>

        <td>

          <span class="status ${
            item.status === "Received"
              ? "received"
              : "pending"
          }">

            ${
              item.status === "Received"
                ? "मिळाली"
                : "प्रलंबित"
            }

          </span>

        </td>

        <td>

          ${
            item.status === "Pending"
              ? `
                <button
                  class="small receive"
                  data-id="${item._id}"
                  data-act="receive">
                  Received
                </button>
              `
              : ""
          }

          <button
            class="small receipt"
            data-receipt="${item.receiptNo}">
            पावती
          </button>

          <button
            class="small delete"
            data-id="${item._id}"
            data-act="del">
            Delete
          </button>

        </td>

      </tr>
    `;

  }).join("");
}


// ===================== EXPENSE LIST =====================

async function loadExpenses() {

  const list = await api(
    "/expenses"
  );

  const body = $("expenseBody");

  if (!list.length) {

    body.innerHTML = `
      <tr>
        <td colspan="6"
            style="text-align:center;padding:25px">
          अजून कोणताही खर्च नाही
        </td>
      </tr>
    `;

    return;
  }

  body.innerHTML = list.map((item) => {

    return `
      <tr>

        <td>
          ${item.spentBy}
        </td>

        <td>
          ${item.purpose}
        </td>

        <td>
          ${money(item.amount)}
        </td>

        <td>
          ${date(item.date)}
        </td>

        <td>
          ${item.description || "-"}
        </td>

        <td>

          <button
            class="small delete"
            data-id="${item._id}">
            Delete
          </button>

        </td>

      </tr>
    `;

  }).join("");
}


// ===================== LOAD EVERYTHING =====================

async function loadAll() {

  try {

    await Promise.all([
      loadDashboard(),
      loadContributions(),
      loadExpenses()
    ]);

  } catch (error) {

    toast(error.message);

  }
}


// ===================== AUTH TABS =====================

document
  .querySelectorAll(".auth-tab")
  .forEach((button) => {

    button.onclick = () => {

      document
        .querySelectorAll(".auth-tab")
        .forEach((item) => {

          item.classList.remove("active");

        });

      button.classList.add("active");

      $("loginForm").classList.toggle(
        "hidden",
        button.dataset.auth !== "login"
      );

      $("registerForm").classList.toggle(
        "hidden",
        button.dataset.auth !== "register"
      );

      $("authMsg").textContent = "";

    };

  });


// ===================== AUTH REQUEST (crash-proof + cold-start retry) =====================

async function authRequest(path, payload, attempt = 1) {

  let response;

  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (networkErr) {
    // Server unreachable (Render free tier waking up from sleep)
    if (attempt < 3) {
      $("authMsg").textContent =
        "Server start ho raha hai, thoda ruk...";
      await new Promise((r) => setTimeout(r, 4000));
      return authRequest(path, payload, attempt + 1);
    }
    throw new Error(
      "Server se connect nahi ho paaya. Internet check karke phir try karo."
    );
  }

  const text = await response.text();

  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      data = {};
    }
  }

  if (!response.ok) {
    throw new Error(
      data.message || `Request failed (${response.status})`
    );
  }

  if (!data.token) {
    // Empty/invalid body on a 2xx response — likely a cold-start hiccup
    if (attempt < 3) {
      $("authMsg").textContent =
        "Server start ho raha hai, thoda ruk...";
      await new Promise((r) => setTimeout(r, 4000));
      return authRequest(path, payload, attempt + 1);
    }
    throw new Error(
      "Server se valid response nahi mila. Thodi der me phir try karo."
    );
  }

  return data;
}


// ===================== LOGIN =====================

$("loginForm").onsubmit = async (event) => {

  event.preventDefault();

  $("authMsg").textContent = "";

  try {

    const data = await authRequest(
      "/api/auth/login",
      {
        username: $("loginUsername").value,
        password: $("loginPassword").value
      }
    );

    token = data.token;

    mandal = data.mandal;

    localStorage.setItem(
      "gm_token",
      token
    );

    localStorage.setItem(
      "gm_mandal",
      JSON.stringify(mandal)
    );

    showApp();

  } catch (error) {

    $("authMsg").textContent =
      error.message;

  }

};


// ===================== REGISTER =====================

$("registerForm").onsubmit = async (event) => {

  event.preventDefault();

  $("authMsg").textContent = "";

  try {

    const data = await authRequest(
      "/api/auth/register",
      {
        name: $("regName").value,
        address: $("regAddress").value,
        mobile: $("regMobile").value,
        username: $("regUsername").value,
        password: $("regPassword").value
      }
    );

    token = data.token;

    mandal = data.mandal;

    localStorage.setItem(
      "gm_token",
      token
    );

    localStorage.setItem(
      "gm_mandal",
      JSON.stringify(mandal)
    );

    showApp();

  } catch (error) {

    $("authMsg").textContent =
      error.message;

  }

};


// ===================== LOGOUT =====================

$("logoutBtn").onclick = () => {

  localStorage.removeItem(
    "gm_token"
  );

  localStorage.removeItem(
    "gm_mandal"
  );

  token = null;

  mandal = null;

  showApp();

};


// ===================== MAIN TABS =====================

document
  .querySelectorAll(".tab")
  .forEach((button) => {

    button.onclick = () => {

      document
        .querySelectorAll(".tab")
        .forEach((item) => {

          item.classList.remove(
            "active"
          );

        });

      button.classList.add("active");

      $("varganiTab").classList.toggle(
        "hidden",
        button.dataset.tab !== "vargani"
      );

      $("expenseTab").classList.toggle(
        "hidden",
        button.dataset.tab !== "expense"
      );

    };

  });


// ===================== NEW VARGANI =====================

$("newVargani").onclick = () => {

  $("varganiForm")
    .classList.remove("hidden");

  $("varganiDate").value =
    today();

};


// ===================== CANCEL VARGANI =====================

$("cancelVargani").onclick = () => {

  $("varganiForm").reset();

  $("varganiForm")
    .classList.add("hidden");

};


// ===================== SAVE VARGANI =====================

$("varganiForm").onsubmit = async (event) => {

  event.preventDefault();

  try {

    const data = await api(
      "/contributions",
      {
        method: "POST",

        body: JSON.stringify({

          donorName:
            $("donorName")
              .value
              .trim(),

          mobile:
            $("mobile")
              .value
              .trim(),

          address:
            $("address")
              .value
              .trim(),

          amount:
            Number(
              $("amount").value
            ),

          paymentMode:
            $("paymentMode").value,

          collectedBy:
            $("collectedBy")
              .value
              .trim(),

          date:
            $("varganiDate").value

        })
      }
    );

    $("varganiForm").reset();

    $("varganiForm")
      .classList.add("hidden");

    toast(
      "वर्गणी save झाली ✅"
    );

    if (data.receiptUrl) {

      window.open(
        data.receiptUrl,
        "_blank"
      );

    }

    loadAll();

  } catch (error) {

    toast(error.message);

  }

};


// ===================== VARGANI ACTIONS =====================

$("varganiBody").onclick = async (event) => {

  const button =
    event.target.closest("button");

  if (!button) return;


  // ---------- RECEIPT ----------

  if (button.dataset.receipt) {

    window.open(
      "/generated/receipts/receipt-" +
        button.dataset.receipt +
        ".pdf",
      "_blank"
    );

    return;
  }


  try {

    // ---------- RECEIVE PENDING ----------

    if (
      button.dataset.act ===
      "receive"
    ) {

      await api(
        "/contributions/" +
          button.dataset.id +
          "/receive",
        {
          method: "PUT",

          body: JSON.stringify({
            paymentMode: "Cash"
          })
        }
      );

      toast(
        "Status Received केला ✅"
      );

    }


    // ---------- DELETE ----------

    if (
      button.dataset.act ===
      "del"
    ) {

      if (
        !confirm(
          "ही एंट्री डिलीट करायची?"
        )
      ) {

        return;

      }

      await api(
        "/contributions/" +
          button.dataset.id,
        {
          method: "DELETE"
        }
      );

      toast(
        "एंट्री डिलीट झाली"
      );

    }

    await loadAll();

  } catch (error) {

    toast(error.message);

  }

};


// ===================== NEW EXPENSE =====================

$("newExpense").onclick = () => {

  $("expenseForm")
    .classList.remove("hidden");

  $("expenseDate").value =
    today();

};


// ===================== CANCEL EXPENSE =====================

$("cancelExpense").onclick = () => {

  $("expenseForm").reset();

  $("expenseForm")
    .classList.add("hidden");

};


// ===================== SAVE EXPENSE =====================

$("expenseForm").onsubmit = async (event) => {

  event.preventDefault();

  try {

    await api(
      "/expenses",
      {
        method: "POST",

        body: JSON.stringify({

          spentBy:
            $("spentBy")
              .value
              .trim(),

          purpose:
            $("purpose")
              .value
              .trim(),

          amount:
            Number(
              $("expenseAmount").value
            ),

          date:
            $("expenseDate").value,

          description:
            $("description")
              .value
              .trim()

        })
      }
    );

    $("expenseForm").reset();

    $("expenseForm")
      .classList.add("hidden");

    toast(
      "खर्च save झाला ✅"
    );

    loadAll();

  } catch (error) {

    toast(error.message);

  }

};


// ===================== EXPENSE ACTIONS =====================

$("expenseBody").onclick = async (event) => {

  const button =
    event.target.closest("button");

  if (!button) return;


  if (
    !confirm(
      "हा खर्च डिलीट करायचा?"
    )
  ) {

    return;

  }


  try {

    await api(
      "/expenses/" +
        button.dataset.id,
      {
        method: "DELETE"
      }
    );

    toast(
      "खर्च डिलीट झाला"
    );

    loadAll();

  } catch (error) {

    toast(error.message);

  }

};


// ===================== PDF REPORT =====================

$("reportBtn").onclick = () => {

  window.open(
    "/api/reports/pdf",
    "_blank"
  );

};


// ===================== START APP =====================

showApp();