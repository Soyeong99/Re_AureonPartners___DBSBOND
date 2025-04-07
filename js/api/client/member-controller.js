import { API_BASE_URL } from "../config.js";
import { formatAccountNumber, formatPhoneNumber } from "../helper.js";

let verifyCodeSent = false;
let confirmPhoneAuth = false;
let isPhoneNumberChanged = false;
let originalPhoneNumber = "";

$(document).ready(function () {
  const currentPath = window.location.pathname;

  // 비밀번호 & 비밀번호 확인 (특수문자 포함)
  const pwInput = document.getElementById("newPassword");
  const pwCheckInput = document.getElementById("confirmPassword");
  const passwordPattern = /[^A-Za-z0-9!@#$%^&*]/g;

  if (pwInput) {
    pwInput.addEventListener("input", function () {
      this.value = this.value.replace(passwordPattern, "");
    });
  }

  if (pwCheckInput) {
    pwCheckInput.addEventListener("input", function () {
      this.value = this.value.replace(passwordPattern, "");
    });
  }

  const phoneInput = document.getElementById("cellphoneNo");

  if (phoneInput) {
    phoneInput.addEventListener("input", function () {
      this.value = formatPhoneNumber(this.value);
    });
  }

  // 인증번호 (숫자만)
  const codeInput = document.getElementById("authNumber");
  if (codeInput) {
    codeInput.addEventListener("input", function () {
      this.value = this.value.replace(/[^0-9]/g, "");
    });
  }

  // 계좌번호 (숫자와 하이픈만 허용한다면 아래와 같이)
  const accountInput = document.getElementById("accountNumber");
  const bankSelect = document.getElementById("bank");

  if (accountInput && bankSelect) {
    accountInput.addEventListener("input", function () {
      const bankName = bankSelect.value;
      const rawValue = this.value;
      const formatted = formatAccountNumber(bankName, rawValue);
      this.value = formatted;
    });

    // 은행 변경 시에도 자동 포맷 재적용
    bankSelect.addEventListener("change", function () {
      const bankName = this.value;
      const rawValue = accountInput.value;
      const formatted = formatAccountNumber(bankName, rawValue);
      accountInput.value = formatted;
    });
  }

  if (currentPath.includes("/info_edit.html")) {
    memberInfo();
  }

  $("#update").click(function (event) {
    event.preventDefault();
    updateInfo();
  });

  $("#authenticateNumber").click(function () {
    sendConfirmationCode();
  });

  $("#sendCodeConfirm").click(function () {
    verifyPhoneNumber();
  });

  $("#logout").click(function (event) {
    event.preventDefault();
    logout();
  });

  $(".popping2-btn").click(function (e) {
    e.preventDefault();
    $(".popup2").fadeOut();
  });

  $("#cellphoneNo").on("input", function () {
    if (originalPhoneNumber !== document.getElementById("cellphoneNo").value) {
      isPhoneNumberChanged = true;
    }
  });
});

async function memberInfo() {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  try {
    let memberInfo = `${API_BASE_URL}api/dbs-bond/member/my-info`;

    const response = await fetch(memberInfo, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      mode: "cors",
      credentials: "include",
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

    if (data.status === 201 || data.status === 200) {
      document.getElementById("memberId").value = data.data.identifier;
      document.getElementById("cellphoneNo").value = formatPhoneNumber(
        data.data.phoneNumber
      );
      originalPhoneNumber = data.data.phoneNumber;
      const bankSelect = document.getElementById("bank");
      const bankData = data.data.bank;
      document.getElementById("accountNumber").value =
        data.data.bankAccountNumber;

      let optionsExist = false;
      for (let option of bankSelect.options) {
        if (option.value === bankData) {
          optionsExist = true;
          break;
        }
      }

      if (optionsExist) {
        bankSelect.value = bankData;
      }
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    const errorMessage =
      typeof error === "string"
        ? error
        : error.data
        ? JSON.stringify(error.data)
        : error.message
        ? error.message
        : "알 수 없는 오류가 발생했습니다.";
    alert(errorMessage);
  }
}

async function sendConfirmationCode() {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("Access token is missing");
    return;
  }

  const phoneNumber = document.getElementById("cellphoneNo").value.trim();

  // 전화번호 유효성 검사: 010-xxxx-xxxx 형식 또는 숫자만 입력된 11자리
  const phoneRegex = /^010-\d{4}-\d{4}$/;
  const plainPhoneRegex = /^010\d{8}$/;

  if (!phoneRegex.test(phoneNumber) && !plainPhoneRegex.test(phoneNumber)) {
    alert("올바른 휴대폰 번호를 입력해 주세요.");
    return;
  }

  const url = `${API_BASE_URL}api/dbs-bond/auth/send?phoneNumber=${encodeURIComponent(
    phoneNumber.replace(/-/g, "")
  )}`;

  try {
    const response = await fetch(url, {
      method: "POST",
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

    const data = await response.json();
    if (data.status === 201) {
      $(".modal.ctf_num").show();
      document.activeElement.blur(); // 현재 포커스를 없애서 배경 요소 접근 방지
      verifyCodeSent = true;
    } else {
      alert("인증번호 전송에 실패했습니다. 다시 시도해주세요.");
    }
  } catch (error) {
    alert("인증번호 전송에 실패했습니다. 다시 시도해주세요.");
  }
}

async function verifyPhoneNumber() {
  if (!verifyCodeSent) {
    document.getElementById("cellphoneNo").style.border = "1px solid red";
    alert("인증번호를 먼저 전송해주세요.");
    return;
  }

  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    console.error("Access token is missing");
    return;
  }

  const phoneNumber = document.getElementById("cellphoneNo").value.trim();
  const authCode = document.getElementById("authNumber").value.trim();

  if (!phoneNumber || !authCode) {
    if (!phoneNumber) {
      document.getElementById("cellphoneNo").style.border = "1px solid red";
    }

    if (!authCode) {
      document.getElementById("authNumber").style.border = "1px solid red";
    }
    alert("유효한 전화번호와 인증번호를 입력하세요.");
    return;
  }

  const url = `${API_BASE_URL}api/dbs-bond/auth/verify?phoneNumber=${encodeURIComponent(
    phoneNumber.replace(/-/g, "")
  )}&authCode=${encodeURIComponent(authCode)}`;

  try {
    const response = await fetch(url, {
      method: "POST",
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

    const data = await response.json();
    if (data.status === 200) {
      if (data.data === true) {
        confirmPhoneAuth = true;
        $(".modal.ctf_num dt").text("인증이 성공적으로 완료되었습니다.");
        $(".modal.ctf_num").fadeIn();
        document.activeElement.blur();
      } else {
        $(".modal.ctf_num dt").html("인증번호가 올바르지 않습니다.<br>다시 시도해주세요.");
        $(".modal.ctf_num").fadeIn();
        document.activeElement.blur();
      }
    } else {
      alert(data.resultMsg || "인증번호가 올바르지 않습니다");
    }
  } catch (error) {
    alert("인증번호 확인에 실패했습니다. 다시 시도해주세요.");
  }
}

async function updateInfo() {
  if (isPhoneNumberChanged && (!verifyCodeSent || !confirmPhoneAuth)) {
    alert("전화 인증에 실패했습니다. 올바른 인증 코드를 입력하세요.");
    return;
  }

  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot update data.");
    alert("Authentication error. Please log in again.");
    return;
  }

  // Get user inputs
  const bank = document.getElementById("bank").value.trim();
  const accountNumber = document.getElementById("accountNumber").value.trim();
  const phoneNumber = document.getElementById("cellphoneNo").value.trim();
  const authenticationNum = document.getElementById("authNumber").value.trim();
  const newPassword = document.getElementById("newPassword").value.trim();
  const confirmNewPassword = document
    .getElementById("confirmPassword")
    .value.trim();

  // Validate required fields
  if (
    !bank ||
    !accountNumber ||
    !phoneNumber ||
    !authenticationNum ||
    !newPassword ||
    !confirmNewPassword
  ) {
    document.getElementById("bank").style.border = "1px solid red";
    document.getElementById("accountNumber").style.border = "1px solid red";
    document.getElementById("cellphoneNo").style.border = "1px solid red";
    document.getElementById("authNumber").style.border = "1px solid red";
    document.getElementById("newPassword").style.border = "1px solid red";
    document.getElementById("confirmPassword").style.border = "1px solid red";
    alert("모든 필드를 입력해주세요.");
    return;
  }

  if (
    !/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,16}$/.test(
      newPassword
    ) ||
    !/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,16}$/.test(
      confirmNewPassword
    )
  ) {
    document.getElementById("newPassword").style.border = "1px solid red";
    document.getElementById("confirmPassword").style.border = "1px solid red";
    alert("비밀번호는 8자~16자의 영문, 숫자, 특수문자 조합으로 입력해주세요");
    return;
  }

  if (newPassword !== confirmNewPassword) {
    document.getElementById("newPassword").style.border = "1px solid red";
    document.getElementById("confirmPassword").style.border = "1px solid red";
    alert("비밀번호가 일치하지 않습니다.");
    return;
  }

  const updatedData = {
    carrierCode: "SKT",
    phoneNumber: phoneNumber.replace(/-/g, ""), // ✅ 하이픈 제거,
    bank: bank,
    bankAccountNumber: accountNumber.replace(/-/g, ""), // ✅ 하이픈 제거,
    newPassword: newPassword,
    confirmPassword: confirmNewPassword,
    verificationCode: authenticationNum,
  };

  try {
    const response = await fetch(
      `${API_BASE_URL}api/dbs-bond/member/my-info/update`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(updatedData),
        mode: "cors",
        credentials: "include",
      }
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        alert("세션이 만료되었습니다. 로그인 페이지로 이동합니다.");
        localStorage.clear(); // 모든 localStorage 항목 삭제
        window.location.href = "/login.html";
        return;
      }

      const msg = errorData.data.verificationCode
        ? errorData.data.verificationCode
        : errorData.data || "에러가 발생했습니다.";
      alert(msg);
      return;
    }

    const updateResult = await response.json();

    if (updateResult.status === 200 || updateResult.status === 201) {
      alert("성공적으로 내 정보를 업데이트 하였습니다.");
      location.reload();
    } else {
      console.error("Update API Error:", updateResult.resultMsg);
      alert("오류: " + updateResult.resultMsg);
    }
  } catch (error) {
    alert("오류가 발생했습니다. 다시 시도해주세요.");
  }
}
