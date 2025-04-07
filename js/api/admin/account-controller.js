import { API_BASE_URL } from "../config.js";
import { formatAccountNumber } from "../helper.js";

$(document).ready(function () {
  fetchAccountDetails();

  $("#acc-num").on("input", function () {
    const raw = $(this).val();
    const bank = $("#bank-select").val();
    const formatted = formatAccountNumber(bank, raw);
    $(this).val(formatted);
  });

  $(".submit").on("click", function () {
    createOrUpdateAccount();
  });
});

function getAccountDetails() {
  const accountHolder = document.getElementById("acc-holder").value.trim();
  const bankName = document.getElementById("bank-select").value;
  const accountNumber = document.getElementById("acc-num").value.trim();

  return { accountHolder, bankName, accountNumber };
}

async function fetchAccountDetails() {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("Access token missing.");
    return;
  }

  try {
    const apiUrl = `${API_BASE_URL}api/dbs-bond/admin/account`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        alert("세션이 만료되었습니다. 로그인 페이지로 이동합니다.");
        localStorage.clear(); // 모든 localStorage 항목 삭제
        window.location.href = "/login.html";
        return;
      }

      const errorData = await response.json();
      const msg = errorData.data || "에러가 발생했습니다.";
      throw new Error(`${msg}`);
    }
    const result = await response.json();
    const data = result.data;

    if (data?.accountNumber) {
      // 📌 input에 값 자동 입력
      document.getElementById("acc-holder").value = data.accountHolder;
      document.getElementById("bank-select").value = data.bankName;
      document.getElementById("acc-num").value = data.accountNumber;

      // 등록된 계좌 있음
      window.accountExists = true;
    } else {
      window.accountExists = false;
    }
  } catch (err) {
    console.error("계좌 정보 조회 실패:", err);
    window.accountExists = false;
  }
}

async function createOrUpdateAccount() {
  const { accountHolder, bankName, accountNumber } = getAccountDetails();

  if (!accountHolder || !bankName || !accountNumber) {
    alert("모든 필드를 작성해 주세요.");
    return;
  }

  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token.");
    return;
  }

  const payload = { accountNumber, accountHolder, bankName };

  const method = window.accountExists ? "PUT" : "POST";
  const successMessage = window.accountExists
    ? "계좌 정보를 수정했습니다."
    : "계좌를 성공적으로 등록했습니다.";

  $("#btn-spinner").show();

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/admin/account`;

    const response = await fetch(apiUrl, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      mode: "cors",
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        alert("세션이 만료되었습니다. 로그인 페이지로 이동합니다.");
        localStorage.clear(); // 모든 localStorage 항목 삭제
        window.location.href = "/login.html";
        return;
      }

      const errorData = await response.json();
      const msg = errorData.data || "에러가 발생했습니다.";
      throw new Error(`${msg}`);
    }
    const data = await response.json();

    if (data.status === 200 || data.status === 201) {
      alert(successMessage);
      location.reload();
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    $("#btn-spinner").fadeOut();
  }
}
