import { API_BASE_URL } from "../config.js";
import { formatAccountNumber, formatPhoneNumber } from "../helper.js";

let phoneVerify = false;
let authCodeVerify = false;

$(document).ready(function () {
  const currentPath = window.location.pathname;

  const idInput = document.getElementById("id");
  if (idInput) {
    idInput.addEventListener("input", function () {
      const prevValue = this.value;
      const newValue = prevValue.replace(/[^a-z0-9]/g, "");

      if (prevValue !== newValue) {
        alert("영문 소문자와 숫자만 입력 가능합니다.");
        this.value = newValue;
      }
    });
  }

  // 비밀번호 & 비밀번호 확인 (특수문자 포함)
  const pwInput = document.getElementById("pw");
  const pwCheckInput = document.getElementById("pw_check");
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

  // 이메일 (간단한 제한: 영문, 숫자, @, .)
  const emailInput = document.getElementById("email");
  if (emailInput) {
    emailInput.addEventListener("input", function () {
      const prevValue = this.value;
      const newValue = prevValue.replace(/[^A-Za-z0-9@.]/g, "");

      if (prevValue !== newValue) {
        alert("이메일은 영문, 숫자, @, .만 입력 가능합니다.");
        this.value = newValue;
      }
    });
  }

  // 휴대폰 번호 (숫자만)
  const phoneInput = document.getElementById("phone");
  if (phoneInput) {
    phoneInput.addEventListener("input", function () {
      this.value = formatPhoneNumber(this.value);
    });
  }

  // 인증번호 (숫자만)
  const codeInput = document.getElementById("ca_num");
  if (codeInput) {
    codeInput.addEventListener("input", function () {
      this.value = this.value.replace(/[^0-9]/g, "");
    });
  }

  // 생년월일 (6자리 숫자)
  const birthInput = document.getElementById("birth");
  if (birthInput) {
    birthInput.addEventListener("input", function () {
      this.value = this.value.replace(/[^0-9]/g, "").slice(0, 6);
    });
  }

  // 주민번호 첫자리 (1~4)
  const idFirstInput = document.getElementById("id-first");
  if (idFirstInput) {
    idFirstInput.addEventListener("input", function () {
      this.value = this.value.replace(/[^1-4]/g, "").slice(0, 1);
    });
  }

  // 계좌번호 (숫자와 하이픈만 허용한다면 아래와 같이)
  const accountInput = document.getElementById("ac_num");
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

  if (
    localStorage.getItem("autoLogin") === "true" &&
    localStorage.getItem("accessToken")
  ) {
    redirectUser();
  }
  // 비밀번호 재설정 버튼 클릭 이벤트 등록
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get("userId");

  if (!userId) {
    console.error("userId 파라미터가 없습니다.");
  }

  // 비밀번호 재설정 버튼 클릭 이벤트
  $("#reset-pwd-btn").click(function () {
    if (userId) {
      handlePasswordReset(userId);
    } else {
      alert("사용자 ID가 없습니다. 비밀번호 찾기를 다시 시도해주세요.");
    }
  });
  if (currentPath.includes("/login.html")) {
    $("#pw").on("keypress", function (e) {
      if (e.which === 13) {
        memberLogIn();
      }
    });

    $(".btn_login").on("click", function () {
      memberLogIn();
    });
  }

  if (currentPath.includes("/join_02.html")) {
    $(".join").on("click", function () {
      memberSignup();
    });

    $("#verify-phone").on("click", function () {
      const phoneNumber = document.getElementById("phone").value.trim();
      if (!phoneNumber) {
        alert("전화번호를 입력해주세요");
        return;
      }
      sendVerificationCode(phoneNumber);
    });

    $("#verify-code").on("click", function () {
      const phoneNumber = document.getElementById("phone").value.trim();
      const authCode = document.getElementById("ca_num").value.trim();
      if (!phoneNumber) {
        alert("전화번호를 입력해주세요");
        return;
      }

      if (!authCode) {
        alert("인증번호를 입력해주세요");
        return;
      }

      verifyCode(phoneNumber, authCode);
    });
  }

  if (currentPath.includes("/admin")) {
    $(".logout_icon").on("click", function () {
      logout();
    });
  }

  if (currentPath.includes("/a_login/find_pw.html")) {
    $(".gnb a").css({
      "pointer-events": "none",
      "cursor": "default",
      "opacity": "0.5"
    });
  }
});

// <------------------- Member Log In -------------------->

async function memberLogIn() {
  const id = document.getElementById("id").value.trim();
  const pw = document.getElementById("pw").value;
  const autoLogin = document.getElementById("auto_login").checked;

  if (!id || !pw) {
    setTimeout(() => {
      alert("아이디와 비밀번호를 입력해주세요!");
      document.getElementById("id").style.border = "1px solid red";
      document.getElementById("pw").style.border = "1px solid red";
    }, 500);
    return;
  }

  const payload = { identifier: id, password: pw };

  $("#btn-spinner").show();

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/auth/login`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      mode: "cors",
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      document.getElementById("id").style.border = "1px solid red";
      document.getElementById("pw").style.border = "1px solid red";

      if (response.status === 401 || response.status === 403) {
        alert("세션이 만료되었습니다. 로그인 페이지로 이동합니다.");
        localStorage.clear(); // 모든 localStorage 항목 삭제

        window.location.href = "/login.html";
        return;
      }

      const errorData = await response.json();
      let msg = errorData.data || "에러가 발생했습니다.";

      // ✅ 특정 에러 메시지 대응
      if (msg === "User is not exist") {
        msg = "존재하지 않는 아이디입니다.";
      }

      throw new Error(`${msg}`);
    }

    const data = await response.json();

    if (data.status === 201 || data.status === 200) {
      localStorage.setItem("accessToken", data.data.accessToken);
      localStorage.setItem("umsgCount", data.data.unreadMessageCount);

      const permission = data.data.permissions[0];

      if (autoLogin) {
        localStorage.setItem("autoLogin", "true");
      } else {
        localStorage.removeItem("autoLogin");
      }

      if (permission == "ADMIN") {
        localStorage.setItem("admin", "true");
        window.location.href = "/admin/admin_main.html";
      } else {
        if (data.data.unreadMessageCount > 0) {
          const modal = document.querySelector(".modal.mail_alarm");
          modal.style.display = "flex";

          const okayButton = modal.querySelector(".okay");
          okayButton.onclick = () => {
            modal.style.display = "none";
          };

          // window.location.href = "/a_login/mail.html";
        } else {
          window.location.href = "/kr/index.html";
        }
      }

      if (data.data.isPasswordResetRequired) {
        alert("계속하시려면 비밀번호를 재설정해주세요!");
        window.location.href = `/a_login/find_pw.html?userId=${encodeURIComponent(
          id
        )}`;
        return;
      }
    } else {
      alert(data.data);
    }
  } catch (error) {
    alert(error);
    console.error("Error creating the account: ", error);
  } finally {
    $("#btn-spinner").fadeOut();
  }
}

/**
 * 비밀번호 유효성 검사
 * @param {string} password - 비밀번호
 * @param {string} confirmPassword - 확인 비밀번호
 * @returns {boolean} 유효성 검사 통과 여부
 */
function validatePassword(password, confirmPassword) {
  // 비밀번호 입력 확인
  if (!password) {
    alert("비밀번호를 입력해주세요.");
    return false;
  }

  // 비밀번호 형식 검사 (8~16자의 영문, 숫자, 특수문자 조합)
  const passwordPattern =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,16}$/;
  if (!passwordPattern.test(password)) {
    alert("비밀번호는 8~16자의 영문, 숫자, 특수문자 조합이어야 합니다.");
    return false;
  }

  // 비밀번호 확인 일치 검사
  if (password !== confirmPassword) {
    alert("비밀번호가 일치하지 않습니다.");
    return false;
  }

  return true;
}

/**
 * 비밀번호 재설정 처리
 * @param {string} userId - 사용자 ID
 */
async function handlePasswordReset(userId) {
  const password = $("#pw").val();
  const passwordCheck = $("#pw_check").val();

  // 비밀번호 유효성 검사
  if (!validatePassword(password, passwordCheck)) {
    return;
  }

  // API 요청 데이터
  const payload = {
    userId: userId,
    newPassword: password,
    confirmPassword: passwordCheck,
  };

  try {
    const response = await sendPasswordResetRequest(payload);
    handlePasswordResetResponse(response);
  } catch (error) {
    console.error("비밀번호 재설정 중 오류:", error);
    alert("비밀번호 재설정 중 오류가 발생했습니다.");
  }
}

/**
 * 비밀번호 재설정 API 요청
 * @param {Object} payload - 요청 데이터
 * @returns {Promise<Response>} API 응답
 */
async function sendPasswordResetRequest(payload) {
  return fetch(`${API_BASE_URL}api/dbs-bond/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    mode: "cors",
    credentials: "include",
    body: JSON.stringify(payload),
  });
}

/**
 * 비밀번호 재설정 응답 처리
 * @param {Response} response - API 응답
 */
async function handlePasswordResetResponse(response) {
  if (!response.ok) {
    const errorData = await response.json();
    const msg = errorData.data || "비밀번호 재설정 중 오류가 발생했습니다.";
    alert(msg);
    return;
  }

  const data = await response.json();

  if (data.status === 200 || data.status === 201) {
    showSuccessModal();
  } else {
    alert(data.resultMsg || "비밀번호 재설정에 실패했습니다.");
  }
}

/**
 * 성공 모달 표시
 */
function showSuccessModal() {
  $(".popup2").fadeIn();

  // 모달 팝업 확인 버튼 이벤트
  $(".popup2-btn")
    .off("click")
    .on("click", function () {
      $(".popup2").fadeOut();
      setTimeout(function () {
        window.location.href = "../login.html"; // 로그인 페이지로 이동
      }, 300);
    });
}
// <------------------- Member Sign Up -------------------->
// Send verification code to the phone
async function sendVerificationCode(phoneNumber) {
  // 전화번호 유효성 검사: 010-xxxx-xxxx 형식 또는 숫자만 입력된 11자리
  const phoneRegex = /^010-\d{4}-\d{4}$/;
  const plainPhoneRegex = /^010\d{8}$/;

  if (!phoneRegex.test(phoneNumber) && !plainPhoneRegex.test(phoneNumber)) {
    alert("올바른 휴대폰 번호를 입력해 주세요.");
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}api/dbs-bond/auth/send?phoneNumber=${phoneNumber.replace(
        /-/g,
        ""
      )}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        mode: "cors",
      }
    );

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

    if (data.status == 201) {
      phoneVerify = true;
      $(".modal.ctf_num").show();
      document.activeElement.blur(); // 현재 포커스를 없애서 배경 요소 접근 방지
    }
  } catch (error) {
    console.error("Error sending verification code: ", error);
    alert("인증번호를 보내는 도중 오류가 발생했습니다");
  }
}

// Verify the authentication code
async function verifyCode(phoneNumber, authCode) {
  try {
    const response = await fetch(
      `${API_BASE_URL}api/dbs-bond/auth/verify?phoneNumber=${phoneNumber.replace(
        /-/g,
        ""
      )}&authCode=${authCode}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        mode: "cors",
      }
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        alert("세션이 만료되었습니다. 로그인 페이지로 이동합니다.");
        localStorage.clear();
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
        authCodeVerify = true;
        $(".modal.ctf_num dt").text("인증이 성공적으로 완료되었습니다.");
        $(".modal.ctf_num").fadeIn();
        document.activeElement.blur();
      } else {
        $(".modal.ctf_num dt").html("인증번호가 올바르지 않습니다.<br>다시 시도해주세요.");
        $(".modal.ctf_num").fadeIn();
        document.activeElement.blur();
      }
    } else {
      alert(data.resultMsg || "인증 코드가 올바르지 않습니다.");
    }
  } catch (error) {
    console.error("Error verifying code: ", error);
    alert(error.data);
  }
}

async function memberSignup() {
  const id = document.getElementById("id").value.trim();
  const pw = document.getElementById("pw").value;
  const pw_check = document.getElementById("pw_check").value;
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const ca_num = document.getElementById("ca_num").value.trim();
  const gender = document.getElementById("gender").value;
  const bank = document.getElementById("bank").value;
  const ac_num = document.getElementById("ac_num").value.trim();
  const birth = document.getElementById("birth").value.trim();
  const idFirst = document.getElementById("id-first").value;

  // Validate required fields
  if (
    !id ||
    !pw ||
    !pw_check ||
    !name ||
    !email ||
    !phone ||
    !ca_num ||
    !gender ||
    !bank ||
    !ac_num ||
    !birth ||
    !idFirst
  ) {
    setTimeout(() => {
      alert("모든 필수 항목을 입력해 주세요!");
      document.getElementById("id").style.border = id ? "" : "1px solid red";
      document.getElementById("pw").style.border = pw ? "" : "1px solid red";
      document.getElementById("pw_check").style.border = pw_check
        ? ""
        : "1px solid red";
      document.getElementById("email").style.border = email
        ? ""
        : "1px solid red";
      document.getElementById("name").style.border = name
        ? ""
        : "1px solid red";
      document.getElementById("phone").style.border = phone
        ? ""
        : "1px solid red";
      document.getElementById("ca_num").style.border = ca_num
        ? ""
        : "1px solid red";
      document.getElementById("gender").style.border = gender
        ? ""
        : "1px solid red";
      document.getElementById("bank").style.border = bank
        ? ""
        : "1px solid red";
      document.getElementById("ac_num").style.border = ac_num
        ? ""
        : "1px solid red";
      document.getElementById("birth").style.border = birth
        ? ""
        : "1px solid red";
      document.getElementById("id-first").style.border = idFirst
        ? ""
        : "1px solid red";
    }, 500);
    return;
  }

  if (
    !/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,16}$/.test(
      pw
    ) ||
    !/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,16}$/.test(
      pw_check
    )
  ) {
    document.getElementById("pw").style.border = "1px solid red";
    document.getElementById("pw_check").style.border = "1px solid red";
    alert("비밀번호는 8~16자이며, 영문, 숫자, 특수문자를 포함해야 합니다");

    return;
  }

  // Validate password match
  if (pw !== pw_check) {
    setTimeout(() => {
      alert("비밀번호가 일치하지 않습니다!");

      document.getElementById("pw").style.border = "1px solid red";
      document.getElementById("pw_check").style.border = "1px solid red";
    }, 500);
    return;
  }

  // User sign up
  if (!phoneVerify || !authCodeVerify) {
    document.getElementById("phone").style.border = "1px solid red";
    document.getElementById("ca_num").style.border = "1px solid red";
    alert("먼저 휴대폰 인증을 완료해주세요");

    return;
  }

  if (
    (gender === "여성" && !(idFirst === "2" || idFirst === "4")) ||
    (gender === "남성" && !(idFirst === "1" || idFirst === "3"))
  ) {
    alert("성별과 주민등록번호 성별코드가 일치하지 않습니다!");
    document.getElementById("id-first").style.border = "1px solid red";
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    alert("올바른 이메일 형식을 입력해주세요.");
    document.getElementById("email").style.border = "1px solid red";
    return;
  }

  const agreeA = document.querySelector("#agree_01");
  const agreeB = document.querySelector("#agree_02");
  // const optAgreeC = document.querySelector("#agree_03");

  if (!agreeA.checked || !agreeB.checked) {
    alert("회원가입을 진행하려면 필수 약관에 동의해야 합니다.");
    return;
  }

  const payload = {
    identifier: id,
    password: pw,
    email: email,
    phoneNumber: phone.replace(/-/g, ""), // 하이픈 제거
    name: name,
    gender: gender == "남성" ? "MALE" : "FEMALE",
    carrierCode: "KT",
    bank: bank,
    bankAccountNumber: ac_num.replace(/-/g, ""), // 하이픈 제거
    verificationCode: ca_num,
    residentRegistrationFront: birth,
    residentRegistrationGenderCode: idFirst,
  };

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/auth/user/signup`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
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

    if (data.status === 201 || data.status === 200) {
      alert("회원가입이 완료되었습니다. 로그인 후 이용해 주세요.");

      window.location.href = "/login.html";
    } else {
      alert(data.resultMsg);
    }
  } catch (error) {
    $(".modal.ctf_num dt").text(error.message || error);
    $(".modal.ctf_num").fadeIn();
    document.activeElement.blur();
  }
}

async function logout() {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token found. User might already be logged out.");
    alert("You are not logged in.");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}api/dbs-bond/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "*/*",
      },
      mode: "cors",
      credentials: "include",
    });

    const responseBody = await response.json();

    if (response.ok) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("admin");
      window.location.href = "/login.html";
    } else {
      console.error("Logout failed:", responseBody.resultMsg);
    }
  } catch (error) {
    console.error("Error during logout:", error);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const logoutButtons = document.querySelectorAll(".logout");

  logoutButtons.forEach((button) => {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      logout();
    });
  });
});
