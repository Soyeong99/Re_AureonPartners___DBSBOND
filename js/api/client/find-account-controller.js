import { API_BASE_URL } from "../config.js";
import { formatPhoneNumber } from "../helper.js?v=1.1";

let phoneVerify = false;
let authCodeVerify = false;
let phoneVerify2 = false;
let authCodeVerify2 = false;

document.addEventListener("DOMContentLoaded", function () {
  const currentPath = window.location.pathname;

  if (currentPath.includes("/find_id01.html")) {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get("userId");

    console.log(userId);
    document.getElementById("id-disp").value = userId;

    // ESC 키로 모달 닫기 이벤트 추가
    $(document).on("keydown", function (e) {
      if (e.key === "Escape" && $(".modal.ctf_num").is(":visible")) {
        closeVerificationModal();
      }
    });
  }

  // 휴대폰 번호 입력 필드에 자동 포맷팅 적용
  const phoneInputs = document.querySelectorAll(
    "#verify-1-input, #verify-2-input"
  );
  phoneInputs.forEach((input) => {
    input.addEventListener("input", function () {
      this.value = formatPhoneNumber(this.value);
    });
  });

  // Phone verification button event (send verification code)
  $("#verify-1").on("click", function () {
    const phoneNumber = document.getElementById("verify-1-input").value;
    const name = document.getElementById("name").value;

    // 이름 필수 체크
    if (!name || name.trim() === "") {
      document.getElementById("name").style.border = "1px solid red";
      alert("이름을 입력해주세요");
      return;
    }

    // 휴대폰 번호 필수 체크
    if (!phoneNumber || phoneNumber.replace(/\D/g, "").length < 10) {
      document.getElementById("verify-1-input").style.border = "1px solid red";
      alert("올바른 휴대폰 번호를 입력해주세요");
      return;
    }

    // 정상 처리
    document.getElementById("name").style.border = "";
    document.getElementById("verify-1-input").style.border = "";
    sendVerificationCode(phoneNumber.replace(/\D/g, ""), 1);
  });

  $("#verify-2").on("click", function () {
    const phoneNumber = document.getElementById("verify-2-input").value;
    const name = document.getElementById("name-2").value;
    const identifier = document.getElementById("identifier-input").value;

    // 이름 필수 체크
    if (!name || name.trim() === "") {
      document.getElementById("name-2").style.border = "1px solid red";
      alert("이름을 입력해주세요");
      return;
    }

    // 아이디 필수 체크
    if (
      !identifier ||
      identifier.trim() === "" ||
      !/^[a-z0-9]{5,20}$/.test(identifier)
    ) {
      document.getElementById("identifier-input").style.border =
        "1px solid red";
      alert("아이디는 5~20자의 영문 소문자와 숫자로만 입력해주세요");
      return;
    }

    // 휴대폰 번호 필수 체크
    if (!phoneNumber || phoneNumber.replace(/\D/g, "").length < 10) {
      document.getElementById("verify-2-input").style.border = "1px solid red";
      alert("올바른 휴대폰 번호를 입력해주세요");
      return;
    }

    // 정상 처리
    document.getElementById("name-2").style.border = "";
    document.getElementById("identifier-input").style.border = "";
    document.getElementById("verify-2-input").style.border = "";
    sendVerificationCode(phoneNumber.replace(/\D/g, ""), 2);
  });

  // Verification code confirmation
  $("#confirm-1").on("click", function () {
    const phoneNumber = document.getElementById("verify-1-input").value;
    const verificationCode = document.getElementById("confirm-1-input").value;

    if (!verificationCode || verificationCode.trim() === "") {
      document.getElementById("confirm-1-input").style.border = "1px solid red";
      alert("인증번호를 입력해주세요");
      return;
    }

    if (!phoneVerify) {
      document.getElementById("verify-1-input").style.border = "1px solid red";
      alert("휴대폰 번호 인증을 먼저 완료해주세요");
      return;
    }

    document.getElementById("confirm-1-input").style.border = "";
    verifyCode(phoneNumber.replace(/\D/g, ""), verificationCode, 1);
  });

  $("#confirm-2").on("click", function () {
    const phoneNumber = document.getElementById("verify-2-input").value;
    const verificationCode = document.getElementById("confirm-2-input").value;

    if (!verificationCode || verificationCode.trim() === "") {
      document.getElementById("confirm-2-input").style.border = "1px solid red";
      alert("인증번호를 입력해주세요");
      return;
    }

    if (!phoneVerify2) {
      document.getElementById("verify-2-input").style.border = "1px solid red";
      alert("휴대폰 번호 인증을 먼저 완료해주세요");
      return;
    }

    document.getElementById("confirm-2-input").style.border = "";
    verifyCode(phoneNumber.replace(/\D/g, ""), verificationCode, 2);
  });

  // Find ID/PW button events
  $("#find-id-btn").on("click", function () {
    const nameInput = $("#name").val();
    const phoneInput = $("#verify-1-input").val();
    const verificationInput = $("#confirm-1-input").val();

    // 모든 필드 필수 체크
    if (!nameInput || !phoneInput || !verificationInput) {
      if (!nameInput)
        document.getElementById("name").style.border = "1px solid red";
      if (!phoneInput)
        document.getElementById("verify-1-input").style.border =
          "1px solid red";
      if (!verificationInput)
        document.getElementById("confirm-1-input").style.border =
          "1px solid red";

      alert("모든 필드를 입력해주세요");
      return;
    } else if (!phoneVerify) {
      document.getElementById("verify-1-input").style.border = "1px solid red";
      document.getElementById("confirm-1-input").style.border = "1px solid red";
      alert("휴대폰 번호 인증을 완료해주세요");
      return;
    } else if (!authCodeVerify) {
      document.getElementById("confirm-1-input").style.border = "1px solid red";
      alert("인증번호 확인을 완료해주세요");
      return;
    }

    // 정상 처리
    document.getElementById("name").style.border = "";
    document.getElementById("verify-1-input").style.border = "";
    document.getElementById("confirm-1-input").style.border = "";
    findId(nameInput, phoneInput.replace(/\D/g, ""), verificationInput);
  });

  $("#find-pw-btn").on("click", function () {
    const nameId = document.getElementById("name-2");
    const identifierId = document.getElementById("identifier-input");
    const phoneId = document.getElementById("verify-2-input");
    const verificationId = document.getElementById("confirm-2-input");

    const nameInput = nameId.value;
    const phoneInput = phoneId.value;
    const verificationInput = verificationId.value;
    const identifierInput = identifierId.value;

    // 모든 필드 필수 체크
    if (!nameInput || !identifierInput || !phoneInput || !verificationInput) {
      if (!nameInput) nameId.style.border = "1px solid red";
      if (!identifierInput) identifierId.style.border = "1px solid red";
      if (!phoneInput) phoneId.style.border = "1px solid red";
      if (!verificationInput) verificationId.style.border = "1px solid red";

      alert("모든 필드를 입력해주세요");
      return;
    } else if (!(identifierInput && /^[a-z0-9]{5,20}$/.test(identifierInput))) {
      identifierId.style.border = "1px solid red";
      alert("아이디는 5~20자의 영문 소문자와 숫자로만 입력해주세요");
      return;
    } else if (!phoneVerify2) {
      phoneId.style.border = "1px solid red";
      verificationId.style.border = "1px solid red";
      alert("휴대폰 번호 인증을 완료해주세요");
      return;
    } else if (!authCodeVerify2) {
      verificationId.style.border = "1px solid red";
      alert("인증번호 확인을 완료해주세요");
      return;
    }

    // 정상 처리
    nameId.style.border = "";
    identifierId.style.border = "";
    phoneId.style.border = "";
    verificationId.style.border = "";
    findPW(
      nameInput,
      identifierInput,
      phoneInput.replace(/\D/g, ""),
      verificationInput
    );
  });

  // Reset password button event
  $("#reset-pwd-btn").on("click", function () {
    resetPassword();
  });

  $(".okay").on("click", function () {
    closeVerificationModal();
    // $(".modal.ctf_num").hide();
  });
});

// Send verification code to the phone
async function sendVerificationCode(phoneNumber, type) {
  const phoneRegex = /^010-\d{4}-\d{4}$/;
  const plainPhoneRegex = /^010\d{8}$/;

  if (!phoneRegex.test(phoneNumber) && !plainPhoneRegex.test(phoneNumber)) {
    alert("올바른 휴대폰 번호를 입력해주세요.");
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
      if (type == 1) {
        phoneVerify = true;
      } else {
        phoneVerify2 = true;
      }
      showVerificationModal();
      // $(".modal.ctf_num").show();
    }
  } catch (error) {
    console.error("Error sending verification code: ", error);
    alert("인증번호 발송 중 오류가 발생했습니다");
  }
}

// Verify the authentication code
async function verifyCode(phoneNumber, authCode, type) {
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
        if (type == 1) {
          authCodeVerify = true;
        } else {
          authCodeVerify2 = true;
        }
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
    console.error("Error verifying code: ", error);
    alert("인증번호 확인 중 오류가 발생했습니다");
  }
}

// <---------------- Find user ID and password ---------------->
async function findId(name, phoneNumber, verificationCode) {
  try {
    if (authCodeVerify === false) {
      alert("인증번호 확인을 완료해주세요");
      return;
    }

    const response = await fetch(`${API_BASE_URL}api/dbs-bond/auth/find-id`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: name,
        phoneNumber: phoneNumber,
        verificationCode: verificationCode,
      }),
      mode: "cors",
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
      if (data.data && data.data.identifiers?.length > 0) {
        const userId = data.data.identifiers.join(",");
        window.location.href = `./find_id01.html?userId=${encodeURIComponent(
          userId
        )}`;
      } else {
        alert("일치하는 사용자 정보를 찾을 수 없습니다");
      }
    } else {
      alert(data.resultMsg || "아이디 찾기 과정에서 오류가 발생했습니다");
    }
  } catch (error) {
    console.error("Error finding ID: ", error);
    alert(error);
  }
}

async function findPW(
  nameInput,
  identifierInput,
  phoneInput,
  verificationInput
) {
  try {
    if (authCodeVerify2 === false) {
      alert("인증번호 확인을 완료해주세요");
      return;
    }

    const response = await fetch(
      `${API_BASE_URL}api/dbs-bond/auth/find-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: nameInput,
          userId: identifierInput,
          phoneNumber: phoneInput,
          verificationCode: verificationInput,
        }),
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
      // 서버에서 제공하는 상세 에러 메시지 사용
      const errorMessage =
        errorData.data ||
        errorData.data ||
        "비밀번호 찾기 중 오류가 발생했습니다";
      alert(errorMessage);
      return;
    }

    const data = await response.json();

    if (data.status === 200) {
      window.location.href = `./find_pw.html?userId=${encodeURIComponent(
        identifierInput
      )}`;
    } else {
      // 상태 코드가 200이 아닌 경우에도 서버 응답의 상세 메시지 사용
      const errorMessage =
        data.data ||
        data.resultMsg ||
        "비밀번호 찾기 과정에서 오류가 발생했습니다";
      alert(errorMessage);
    }
  } catch (error) {
    console.error("Error finding password:", error);
    alert("비밀번호 찾기 중 오류가 발생했습니다");
  }
}

// <---------------- Reset Password ---------------->
async function resetPassword() {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get("userId");
  const password = document.getElementById("pw").value;
  const passwordCheck = document.getElementById("pw_check").value;

  if (!password || !passwordCheck) {
    if (!password) {
      document.getElementById("pw").style.border = "1px solid red";
    }

    if (!passwordCheck) {
      document.getElementById("pw_check").style.border = "1px solid red";
    }
    alert("비밀번호를 입력해주세요");
    return;
  }

  if (
    !/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,16}$/.test(
      password
    ) ||
    !/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,16}$/.test(
      passwordCheck
    )
  ) {
    document.getElementById("pw").style.border = "1px solid red";
    document.getElementById("pw_check").style.border = "1px solid red";
    alert("비밀번호는 8자~16자의 영문, 숫자, 특수문자 조합으로 입력해주세요");
    return;
  }

  if (password !== passwordCheck) {
    document.getElementById("pw").style.border = "1px solid red";
    document.getElementById("pw_check").style.border = "1px solid red";
    alert("비밀번호가 일치하지 않습니다");
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}api/dbs-bond/auth/reset-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          newPassword: password,
          confirmPassword: passwordCheck,
        }),
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

    if (data.status === 200) {
      $(".popup2").fadeIn();
    } else {
      alert(data.resultMsg || "비밀번호 재설정 중 오류가 발생했습니다");
    }
  } catch (error) {
    console.error("Error resetting password: ", error);
    alert("비밀번호 재설정 중 오류가 발생했습니다");
  }
}

// 모달을 열고 배경 요소 탭 막기
function showVerificationModal() {
  $(".modal.ctf_num").show();
  document.activeElement.blur(); // 현재 포커스를 없애서 배경 요소 접근 방지

  // 모달 외부 요소들의 탭인덱스 저장 및 비활성화
  $("a, button, input, select, textarea")
    .not(".modal.ctf_num a, .modal.ctf_num button")
    .each(function () {
      $(this).attr("data-tabindex", $(this).attr("tabindex") || "0");
      $(this).attr("tabindex", "-1");
    });

  // 포커스를 모달 내 확인 버튼으로 이동
  $(".modal.ctf_num .okay").focus();
}

// 모달을 닫고 배경 요소 탭 복원
function closeVerificationModal() {
  $(".modal.ctf_num").hide();

  // 모달 외부 요소들의 탭인덱스 복원
  $("a, button, input, select, textarea").each(function () {
    const originalTabIndex = $(this).attr("data-tabindex");
    if (originalTabIndex) {
      $(this).attr("tabindex", originalTabIndex);
      $(this).removeAttr("data-tabindex");
    }
  });
}
