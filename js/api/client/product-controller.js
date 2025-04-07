import { API_BASE_URL } from "../config.js";
import { formatCurrency } from "../helper.js";

$(document).ready(function () {
  const currentPath = window.location.pathname;

  if (currentPath.includes("/index.html")) {
    fetchProductData();
  } else if (currentPath.includes("/sub_03_01_00.html")) {
    const prdname = new URLSearchParams(window.location.search).get("prdname");
    if (prdname === "usd") {
      document.getElementById("prd_name").value = "USD 채권";
    } else if (prdname === "eur") {
      document.getElementById("prd_name").value = "EUR 채권";
    } else if (prdname === "jpy") {
      document.getElementById("prd_name").value = "JPY 채권";
    } else if (prdname === "cny") {
      document.getElementById("prd_name").value = "CNY 채권";
    }

    $(".apply-btn").on("click", function () {
      inputInvestment(prdname);
    });
  } else {
    fetchProductData();
  }

  $(".pop_btn").on("click", function () {
    const inputElement = document.querySelector('.txt_box input[type="text"]');
    let investmentAmountManwon = inputElement.value.replace(/,/g, "").trim();
    investmentAmountManwon = parseFloat(investmentAmountManwon);

    if (isNaN(investmentAmountManwon) || investmentAmountManwon <= 0) {
      alert("금액을 입력해주세요.");
      return;
    }

    $(".modal_wrap").css({ display: "block", opacity: "0" });
    setTimeout(() => $(".modal_wrap").css("opacity", "1"), 10);
  });
});

async function fetchProductList() {
  try {
    const apiUrl = `${API_BASE_URL}api/dbs-bond/public/product?page=0&size=30`;
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
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

    const result = await response.json();
    if (result.status === 200 && result.data) {
      // 상품 리스트가 result.data 안에 들어있다고 가정
      return result.data;
    } else {
      throw new Error(result.resultMsg || "상품 리스트를 불러올 수 없습니다.");
    }
  } catch (error) {
    console.error("Error fetching product list:", error);
    return [];
  }
}

async function buildProductUuids() {
  const productList = await fetchProductList(); // 위에서 만든 함수

  // 비어있는 객체를 준비
  const productUuids = {
    usd: null,
    eur: null,
    jpy: null,
    cny: null,
  };

  // 응답 받은 productList 순회
  productList.content.forEach((product) => {
    const title = product.productTitle;

    // title에 어떤 문자열이 들어있는지에 따라 매핑
    if (title.includes("CNY")) {
      productUuids.cny = product.productUuid;
    } else if (title.includes("USD")) {
      productUuids.usd = product.productUuid;
    } else if (title.includes("EUR")) {
      productUuids.eur = product.productUuid;
    } else if (title.includes("JPY")) {
      productUuids.jpy = product.productUuid;
    }
  });

  return productUuids;
}

// <---------- Product Data Fetching ----------->
async function fetchProductData() {
  const currentPath = window.location.pathname;

  const productUuids = await buildProductUuids();

  if (
    currentPath !== "/" &&
    currentPath !== "/index.html" &&
    currentPath !== "index.html"
  ) {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      console.error("No access token retrieved. Cannot fetch data.");
      return;
    }
  }

  for (const [currency, productUuid] of Object.entries(productUuids)) {
    try {
      const apiUrl = `${API_BASE_URL}api/dbs-bond/public/product/${productUuid}`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
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

      if (data.status === 200 && data.data) {
        if (currentPath.includes("/kr/index.html")) {
          updateIndexUI(currency, data.data);
        } else if (currentPath === "/" || currentPath.includes("/index.html")) {
          console.log(currency, data.data);
          updateIndexEnUI(currency, data.data);
        } else if (currentPath.includes("/sub_03.html")) {
          updateProductUI(currency, data.data);
        } else if (
          currentPath.includes("/sub_03_01_usd.html") &&
          currency === "usd"
        ) {
          displayUSD(data.data);
        } else if (
          currentPath.includes("/sub_03_01_cny.html") &&
          currency === "cny"
        ) {
          displayCNY(data.data);
        } else if (
          currentPath.includes("/sub_03_01_eur.html") &&
          currency === "eur"
        ) {
          displayEUR(data.data);
        } else if (
          currentPath.includes("/sub_03_01_jpy.html") &&
          currency === "jpy"
        ) {
          displayJPY(data.data);
        }
      }
    } catch (error) {
      console.error(`Error fetching data for ${currency}:`, error);
    }
  }
}

// <---------- Create Investment ----------->
async function inputInvestment(chosenCurrency) {
  const accessToken = localStorage.getItem("accessToken");
  const productUuids = await buildProductUuids();

  // 이제 productUuids[chosenCurrency] 로 실제 상품 UUID를 얻을 수 있음
  const productUuid = productUuids[chosenCurrency];

  const name = document.getElementById("name").value;
  const birth = document.getElementById("birth").value;
  const idFirst = document.getElementById("id-first").value;
  const month = document.getElementById("month").value;
  const amount = document.getElementById("amount").value;

  // 필수 입력값 검증
  if (!name || !birth || !idFirst || !month || !amount) {
    document.getElementById("name").style.border = !name
      ? "1px solid red"
      : "1px solid #ccc";
    document.getElementById("birth").style.border = !birth
      ? "1px solid red"
      : "1px solid #ccc";
    document.getElementById("id-first").style.border = !idFirst
      ? "1px solid red"
      : "1px solid #ccc";
    document.getElementById("month").style.border = !month
      ? "1px solid red"
      : "1px solid #ccc";
    document.getElementById("amount").style.border = !amount
      ? "1px solid red"
      : "1px solid #ccc";
    // 생일 자리수 검증 추가

    alert("모든 필드를 작성해 주세요.");
    return;
  }

  if (birth.length !== 6 || isNaN(birth)) {
    document.getElementById("birth").style.border = "1px solid red";
    alert("생년월일은 6자리 숫자로 입력해주세요. (예: 900101)");
    return;
  }

  // id-first 값이 1에서 4 사이인지 추가 검증
  const idFirstNumber = parseInt(idFirst, 10);
  if (isNaN(idFirstNumber) || idFirstNumber < 1 || idFirstNumber > 4) {
    document.getElementById("id-first").style.border = "1px solid red";
    alert("주민번호 첫 자리는 1부터 4까지만 입력 가능합니다.");
    return;
  }

  const rawValue = document.getElementById("amount").value;
  const valueWithoutCommas = rawValue.replace(/,/g, "");
  const amountValue = valueWithoutCommas * 10000;
  console.log(amountValue);
  if (amountValue < 1000000) {
    document.getElementById("amount").style.border = "1px solid red";
    alert("최소 투자금액은 100만원입니다.");
    return;
  }

  // 필드가 모두 정상인 경우 모달 창 표시 및 금액 처리
  $(".modal_pop")[0].style.display = "block";
  setTimeout(() => ($(".modal_pop")[0].style.opacity = "1"), 10);

  const cleanAmount = parseFloat(amount.replace(/,/g, ""));
  document.getElementById("investor-name").textContent = name;
  document.getElementById("money-amt-1").textContent =
    (cleanAmount * 10000).toLocaleString() + "원";
  document.getElementById("money-amt-2").textContent =
    (cleanAmount * 10000).toLocaleString() + "원";

  const apiUrl = `${API_BASE_URL}api/dbs-bond/member/account`;

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
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

  const result = await response.json();

  if (result.status === 200) {
    document.getElementById("invest-bank").textContent =
      result.data.bankName + "은행";
    document.getElementById("account-number").textContent =
      result.data.accountNumber;
    document
      .querySelector(".copy-btn")
      .setAttribute("data-account", result.data.bankAccountNumber);
    document.getElementById("user-name").textContent =
      result.data.accountHolder;

    const copyBtn = document.querySelector(".copy-btn");

    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        const bankName = document
          .getElementById("invest-bank")
          ?.textContent?.trim();
        const accountNumber = document
          .getElementById("account-number")
          ?.textContent?.trim();

        if (!bankName || !accountNumber) {
          alert("복사할 계좌 정보가 없습니다.");
          return;
        }

        const combinedText = `${bankName} ${accountNumber}`;

        navigator.clipboard
          .writeText(combinedText)
          .then(() => {})
          .catch((err) => {
            console.error("복사 실패:", err);
            alert("복사 중 오류가 발생했습니다.");
          });
      });
    }
    document
      .querySelector(".complete")
      .addEventListener("click", function (event) {
        const termsOfUse = document.querySelector("#agree_01");
        const personalInfo = document.querySelector("#agree_02");
        const fundProtection = document.querySelector("#agree_03");

        if (
          !termsOfUse.checked ||
          !personalInfo.checked ||
          !fundProtection.checked
        ) {
          alert("필수 약관에 동의해야 결제가 가능합니다.");
          event.preventDefault();
          return;
        }

        const payload = {
          productUuid: productUuid,
          investorName: name,
          residentNumberPrefix: birth,
          residentNumberFirstDigit: idFirstNumber,
          investmentPeriod: parseInt(month.replace("month_", ""), 10),
          investmentAmount: cleanAmount * 10000,
        };

        saveInvestment(payload);
      });
  }
}

async function saveInvestment(payload) {
  const accessToken = localStorage.getItem("accessToken");

  try {
    const apiUrl = `${API_BASE_URL}api/dbs-bond/member/investment`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
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
    const result = await response.json();

    if (result.status === 201) {
      $(".success_pop")[0].style.display = "block";
      setTimeout(() => ($(".success_pop")[0].style.opacity = "1"), 10);
      $(".okay").click(() => {
        $(".success_pop, .modal_pop").stop().fadeOut();
        window.location.href = "/sub/sub_03.html";
      });
    }
  } catch (error) {
    // alert(error.respons.data);
    alert(error.message);
    console.error("Error fetching exchange rates:", error);
  }
}

// <---------- UI Display ----------->
function updateIndexUI(currency, data) {
  document.getElementById(`${currency}-title`).textContent = data.productTitle;
  document.getElementById(
    `${currency}-us-yield`
  ).innerHTML = `<span>(USD)</span> 월 ${data.dailyInterestRateUsdMin.toFixed(
    1
  )}% ~ ${data.dailyInterestRateUsdMax.toFixed(1)}%`;
  document.getElementById(
    `${currency}-kr-yield`
  ).innerHTML = `<span>(KRW)</span> 월 ${data.dailyInterestRateKrwMin.toFixed(
    1
  )}% ~ ${data.dailyInterestRateKrwMax.toFixed(1)}%`;
  document.getElementById(
    `${currency}-progress`
  ).textContent = `${data.progressRate.toFixed(2)}%`;
  document.getElementById(
    `${currency}-bar`
  ).style.width = `${data.progressRate}%`;
}

function updateIndexEnUI(currency, data) {
  document.getElementById(
    `${currency}-us-yield`
  ).innerHTML = `<span>(USD)</span> M ${data.dailyInterestRateUsdMin.toFixed(
    1
  )}% ~ ${data.dailyInterestRateUsdMax.toFixed(1)}%`;
  document.getElementById(
    `${currency}-kr-yield`
  ).innerHTML = `<span>(KRW)</span> M ${data.dailyInterestRateKrwMin.toFixed(
    1
  )}% ~ ${data.dailyInterestRateKrwMax.toFixed(1)}%`;
  document.getElementById(
    `${currency}-progress`
  ).textContent = `${data.progressRate.toFixed(2)}%`;
  document.getElementById(
    `${currency}-bar`
  ).style.width = `${data.progressRate}%`;
}

function updateProductUI(currency, data) {
  document.getElementById(`${currency}-title`).textContent = data.productTitle;
  document.getElementById(`${currency}-amount`).textContent = formatCurrency(
    data.investmentAmount
  );
  document.getElementById(
    `${currency}-yield`
  ).textContent = `${data.expectedYieldMin} ~ ${data.expectedYieldMax}%`;
  document.getElementById(
    `${currency}-progress`
  ).textContent = `${data.progressRate.toFixed(2)}%`;
  document.getElementById(`${currency}-periods`).textContent =
    data.investmentPeriods.join("/") + "개월";
  document.getElementById(
    `${currency}-bar`
  ).style.width = `${data.progressRate}%`;
}

function displayUSD(data) {
  document.getElementById(
    `usd-us-yield`
  ).innerHTML = `<span><i>(USD)</i></span>  일 ${data.dailyInterestRateUsdMin}% ~ 일 ${data.dailyInterestRateUsdMax}%`;
  document.getElementById(
    `usd-kr-yield`
  ).innerHTML = `<span><i>(KRW)</i></span>  일 ${data.dailyInterestRateKrwMin}% ~ 일 ${data.dailyInterestRateKrwMax}%`;
  document.getElementById(`usd-periods`).textContent =
    data.investmentPeriods.join("개월 / ") + "개월";
  document.getElementById(`usd-amount`).textContent = formatCurrency(
    data.investmentAmount
  );
  document.getElementById(
    `usd-progress`
  ).textContent = `${data.progressRate.toFixed(2)}%`;
  document.getElementById(`usd-bar`).style.width = `${data.progressRate}%`;
}

function displayCNY(data) {
  document.getElementById(
    `cny-us-yield`
  ).innerHTML = `<span><i>(USD)</i></span>  일 ${data.dailyInterestRateUsdMin}% ~ 일 ${data.dailyInterestRateUsdMax}%`;
  document.getElementById(
    `cny-kr-yield`
  ).innerHTML = `<span><i>(KRW)</i></span>  일 ${data.dailyInterestRateKrwMin}% ~ 일 ${data.dailyInterestRateKrwMax}%`;
  document.getElementById(`cny-periods`).textContent =
    data.investmentPeriods.join("개월 / ") + "개월";
  document.getElementById(`cny-amount`).textContent = formatCurrency(
    data.investmentAmount
  );
  document.getElementById(
    `cny-progress`
  ).textContent = `${data.progressRate.toFixed(2)}%`;
  document.getElementById(`cny-bar`).style.width = `${data.progressRate}%`;
}

function displayEUR(data) {
  document.getElementById(
    `eur-us-yield`
  ).innerHTML = `<span><i>(USD)</i></span>  일 ${data.dailyInterestRateUsdMin}% ~ 일 ${data.dailyInterestRateUsdMax}%`;
  document.getElementById(
    `eur-kr-yield`
  ).innerHTML = `<span><i>(KRW)</i></span>  일 ${data.dailyInterestRateKrwMin}% ~ 일 ${data.dailyInterestRateKrwMax}%`;
  document.getElementById(`eur-periods`).textContent =
    data.investmentPeriods.join("개월 / ") + "개월";
  document.getElementById(`eur-amount`).textContent = formatCurrency(
    data.investmentAmount
  );
  document.getElementById(
    `eur-progress`
  ).textContent = `${data.progressRate.toFixed(2)}%`;
  document.getElementById(`eur-bar`).style.width = `${data.progressRate}%`;
}

function displayJPY(data) {
  document.getElementById(
    `jpy-us-yield`
  ).innerHTML = `<span><i>(USD)</i></span>  일 ${data.dailyInterestRateUsdMin}% ~ 일 ${data.dailyInterestRateUsdMax}%`;
  document.getElementById(
    `jpy-kr-yield`
  ).innerHTML = `<span><i>(KRW)</i></span>  일 ${data.dailyInterestRateKrwMin}% ~ 일 ${data.dailyInterestRateKrwMax}%`;
  document.getElementById(`jpy-periods`).textContent =
    data.investmentPeriods.join("개월 / ") + "개월";
  document.getElementById(`jpy-amount`).textContent = formatCurrency(
    data.investmentAmount
  );
  document.getElementById(
    `jpy-progress`
  ).textContent = `${data.progressRate.toFixed(2)}%`;
  document.getElementById(`jpy-bar`).style.width = `${data.progressRate}%`;
}

// <---------- Interest Calculator ----------->
// Function to calculate and display interest earnings
function calculateInterest() {
  const inputElement = document.querySelector('.txt_box input[type="text"]');
  let investmentAmountManwon = inputElement.value.replace(/,/g, "");
  investmentAmountManwon = parseFloat(investmentAmountManwon);

  if (isNaN(investmentAmountManwon) || investmentAmountManwon <= 0) {
    alert("금액을 입력해주세요.");
    return;
  }

  // Convert from 만원 to KRW (1 만원 = 10,000 KRW)
  const investmentAmountKRW = investmentAmountManwon * 10000;

  // Annual interest rate range (1.6% to 2.4%)
  // const minAnnualRate = 0.016; // 1.6%
  const maxAnnualRate = 0.024; // 2.4%

  // Calculate daily interest rate
  // const minDailyRate = minAnnualRate / 365;
  const maxDailyRate = maxAnnualRate / 365;

  // Calculate daily interest in KRW
  // const minDailyInterestKRW = investmentAmountKRW * minDailyRate;
  const maxDailyInterestKRW = investmentAmountKRW * maxDailyRate;

  // Calculate monthly interest (30 days) in KRW
  // const minMonthlyInterestKRW = minDailyInterestKRW * 30;
  const maxMonthlyInterestKRW = maxDailyInterestKRW * 30;

  let minDailyDisplay, maxDailyDisplay, minMonthlyDisplay, maxMonthlyDisplay;

  // For daily interest
  // if (minDailyInterestKRW < 10000) {
  //     minDailyDisplay = minDailyInterestKRW.toFixed(2) + '원';
  // } else {
  //     minDailyDisplay = (minDailyInterestKRW / 10000).toFixed(2) + '만원';
  // }

  if (maxDailyInterestKRW < 10000) {
    maxDailyDisplay = maxDailyInterestKRW.toFixed(2).replace('.', ',') + "원";
  } else {
    maxDailyDisplay = (maxDailyInterestKRW / 10000).toFixed(2).replace('.', ',') + "만원";
  }

  // For monthly interest
  // if (minMonthlyInterestKRW < 10000) {
  //     minMonthlyDisplay = minMonthlyInterestKRW.toFixed(2) + '원';
  // } else {
  //     minMonthlyDisplay = (minMonthlyInterestKRW / 10000).toFixed(2)  + '만원';
  // }

  if (maxMonthlyInterestKRW < 10000) {
    maxMonthlyDisplay = maxMonthlyInterestKRW.toFixed(2).replace('.', ',') + "원";
  } else {
    maxMonthlyDisplay = (maxMonthlyInterestKRW / 10000).toFixed(2).replace('.', ',') + "만원";
  }

  // document.getElementById('monthly-min').textContent = minMonthlyDisplay;
  document.getElementById("monthly-max").textContent = maxMonthlyDisplay;
  // document.getElementById('daily-min').textContent = minDailyDisplay;
  document.getElementById("daily-max").textContent = maxDailyDisplay;
}

const currentPath = window.location.pathname;
if (
  currentPath !== "/" &&
  currentPath !== "/index.html" &&
  currentPath !== "index.html"
) {
  document
    .querySelector('.txt_box input[type="text"]')
    .addEventListener("input", function (e) {
      const value = e.target.value.replace(/,/g, "");
      if (!isNaN(value) && value.trim() !== "") {
        e.target.value = Number(value).toLocaleString();
      }

      calculateInterest();
    });

  document.addEventListener("DOMContentLoaded", function () {
    calculateInterest();
  });
}
