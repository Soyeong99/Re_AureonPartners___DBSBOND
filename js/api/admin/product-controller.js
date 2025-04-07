import { API_BASE_URL } from "../config.js";

// <--------------- Fetch Each Product --------------->
document.addEventListener("DOMContentLoaded", function () {
  const currentPath = window.location.pathname;

  if (currentPath.includes("admin_05_01_00.html")) {
    fetchProducts();
  } else if (currentPath.includes("admin_05_01_01.html")) {
    const urlParams = new URLSearchParams(window.location.search);
    const productUuid = urlParams.get("uuid");

    if (!productUuid) {
      alert("상품 UUID가 존재하지 않습니다.");
      return;
    }

    fetchProductByUuid(productUuid);
  }
});

// fetchProductByUuid 정의 필요
async function fetchProductByUuid(uuid) {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) return alert("로그인이 필요합니다.");

  try {
    const response = await fetch(
      `${API_BASE_URL}api/dbs-bond/public/product/${uuid}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();
    if (response.ok && data.status === 200) {
      updateProductPreview(data.data);
      populateEditForm(data.data);
    } else {
      throw new Error(data.resultMsg || "상품 정보를 불러올 수 없습니다.");
    }
  } catch (error) {
    console.error(error);
    alert("상품 정보를 가져오는 중 오류가 발생했습니다.");
  }
}

// Populate edit form with product data
const populateEditForm = (product) => {
  const titleElement = document.querySelector(".card_tit.tit_transparent");
  if (titleElement) {
    titleElement.textContent = `${product.productTitle} 상품 수정`;
  }

  const priceInput = document.getElementById("price");
  if (priceInput) {
    priceInput.value = formatCurrency(product.investmentAmount);
    priceInput.placeholder = 0;
  }

  const revenueInput = document.getElementById("revenue");
  if (revenueInput) {
    revenueInput.value = `${product.expectedYieldMin} ~ ${product.expectedYieldMax}%`;
    revenueInput.placeholder = `0 ~ 0%`;
  }

  const periodInput = document.getElementById("period");
  if (periodInput) {
    periodInput.value = product.investmentPeriods.join("/") + "개월";
    periodInput.placeholder = "0/0/0/0" + "개월";
  }

  const usdRateInput = document.querySelector(".rate li:nth-child(1) input");
  const krwRateInput = document.querySelector(".rate li:nth-child(2) input");

  if (usdRateInput) {
    usdRateInput.value = `${product.dailyInterestRateUsdMin} ~ ${product.dailyInterestRateUsdMax}`;
    usdRateInput.placeholder = `0 ~ 0`;
  }

  if (krwRateInput) {
    krwRateInput.value = `${product.dailyInterestRateKrwMin} ~ ${product.dailyInterestRateKrwMax}`;
    krwRateInput.placeholder = `0 ~ 0`;
  }

  const progressRateElements = document.querySelectorAll(".percent span");
  progressRateElements.forEach((element) => {
    element.textContent = `${product.progressRate.toFixed(2)}%`;
  });

  const progressBarElements = document.querySelectorAll(".bar");
  progressBarElements.forEach((element) => {
    element.style.width = `${product.progressRate}%`;
  });

  const rateInput = document.getElementById("rate");
  if (rateInput) {
    rateInput.value = `${product.progressRate.toFixed(2)}%`;
    rateInput.placeholder = `0.00%`;
  }

  setupSubmitButtons(product);
};

const setupSubmitButtons = (product) => {
  const submitButtons = document.querySelectorAll("button.rcor");

  submitButtons.forEach((button, index) => {
    button.addEventListener("click", async function (e) {
      e.preventDefault();

      const listItem = button.closest(".list_num");
      if (!listItem) return;

      const input = listItem.querySelector("input");
      if (!input) return;

      let updateData = {
        investmentAmount: product.investmentAmount,
        expectedYieldMin: product.expectedYieldMin,
        expectedYieldMax: product.expectedYieldMax,
        investmentPeriods: product.investmentPeriods,
        progressRate: product.progressRate,
      };

      switch (index) {
        case 0: // 투자금액
          const amount = parseAmount(input.value);
          if (isNaN(amount)) {
            showFieldError(input, "숫자 형식의 금액을 입력해주세요.");
            return;
          }
          updateData.investmentAmount = amount;
          break;

        case 1: // 수익률
          const yieldValues = parseYieldRange(input.value);
          if (isNaN(yieldValues.min) || isNaN(yieldValues.max)) {
            showFieldError(
              input,
              "수익률 범위를 숫자로 입력해주세요. 예: 1.5 ~ 2.4"
            );
            return;
          }
          updateData.expectedYieldMin = yieldValues.min;
          updateData.expectedYieldMax = yieldValues.max;
          break;

        case 2: // 투자 기간
          const periods = parsePeriods(input.value);
          if (!periods.length) {
            showFieldError(
              input,
              "정확한 형식으로 입력해주세요. 예: 6/12/18/24개월"
            );
            return;
          }
          updateData.investmentPeriods = periods;
          break;

        case 3: // 일일 금리
          const usdInput = listItem.querySelector(
            ".rate li:nth-child(1) input"
          );
          const krwInput = listItem.querySelector(
            ".rate li:nth-child(2) input"
          );

          const rangePattern = /^\d+(\.\d+)?\s*~\s*\d+(\.\d+)?$/; // 형식: 0.01 ~ 0.03

          // USD 검사
          if (usdInput) {
            const usdValue = usdInput.value.trim();
            if (!rangePattern.test(usdValue)) {
              showFieldError(
                usdInput,
                "USD 금리는 숫자 범위로 입력해주세요. 예: 0.01 ~ 0.03"
              );
              return;
            }

            const usdValues = parseYieldRange(usdValue);
            if (
              isNaN(usdValues.min) ||
              isNaN(usdValues.max) ||
              usdValues.min >= usdValues.max
            ) {
              showFieldError(
                usdInput,
                "USD 금리를 정확히 입력해주세요. 최소값 < 최대값"
              );
              return;
            }

            updateData.dailyInterestRateUsdMin = usdValues.min;
            updateData.dailyInterestRateUsdMax = usdValues.max;
          }

          // KRW 검사
          if (krwInput) {
            const krwValue = krwInput.value.trim();
            if (!rangePattern.test(krwValue)) {
              showFieldError(
                krwInput,
                "KRW 금리는 숫자 범위로 입력해주세요. 예: 0.01 ~ 0.03"
              );
              return;
            }

            const krwValues = parseYieldRange(krwValue);
            if (
              isNaN(krwValues.min) ||
              isNaN(krwValues.max) ||
              krwValues.min >= krwValues.max
            ) {
              showFieldError(
                krwInput,
                "KRW 금리를 정확히 입력해주세요. 최소값 < 최대값"
              );
              return;
            }

            updateData.dailyInterestRateKrwMin = krwValues.min;
            updateData.dailyInterestRateKrwMax = krwValues.max;
          }
          break;

        case 4: // 진행률
          const rateValue = parseFloat(input.value);
          if (isNaN(rateValue)) {
            showFieldError(input, "진행률은 숫자로 입력해주세요. 예: 78.3");
            return;
          }
          updateData.progressRate = rateValue;
          break;
      }

      const accessToken = localStorage.getItem("accessToken");
      let initialInvestmentPeriod = [];

      if (!accessToken) {
        console.error("No access token retrieved. Cannot fetch data.");
        return;
      }

      if (Array.isArray(updateData.investmentPeriods)) {
        initialInvestmentPeriod = updateData.investmentPeriods;
        updateData.investmentPeriods = updateData.investmentPeriods.join("/");
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}api/dbs-bond/admin/product/${product.productUuid}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(updateData),
          }
        );

        const data = await response.json();
        if (data.status === 200) {
          alert("상품 정보가 성공적으로 수정되었습니다.");
          product.investmentAmount = updateData.investmentAmount;
          product.expectedYieldMin = updateData.expectedYieldMin;
          product.expectedYieldMax = updateData.expectedYieldMax;
          product.investmentPeriods = initialInvestmentPeriod;
          product.progressRate = updateData.progressRate;
          product.dailyInterestRateUsdMin = updateData.dailyInterestRateUsdMin;
          product.dailyInterestRateUsdMax = updateData.dailyInterestRateUsdMax;
          product.dailyInterestRateKrwMin = updateData.dailyInterestRateKrwMin;
          product.dailyInterestRateKrwMax = updateData.dailyInterestRateKrwMax;
          localStorage.setItem("currentProduct", JSON.stringify(product));
          location.reload();
        } else {
          alert("상품 정보 수정에 실패했습니다: " + data.resultMsg);
        }
      } catch (error) {
        console.error("Update error:", error);
        alert("상품 정보 수정에 실패했습니다.");
      }
    });
  });

  // ⛑ 에러 메시지 표시 함수
  function showFieldError(inputElement, message) {
    alert(message);
    inputElement.style.border = "1px solid red";
    inputElement.focus();
  }

  // 기존 저장확인 로직은 그대로 유지
  const confirmButton = document.querySelector(".save_prd");
  if (confirmButton) {
    confirmButton.addEventListener("click", function () {
      let modifiedInputs = [];

      const priceInput = document.getElementById("price");
      if (
        priceInput &&
        parseAmount(priceInput.value) !== product.investmentAmount
      ) {
        modifiedInputs.push("투자금액(Investment Amount)");
      }

      const revenueInput = document.getElementById("revenue");
      if (revenueInput) {
        const expectedValue = `${product.expectedYieldMin} ~ ${product.expectedYieldMax}%`;
        if (revenueInput.value !== expectedValue) {
          modifiedInputs.push("예상수익률(Expected Yield)");
        }
      }

      const periodInput = document.getElementById("period");
      if (periodInput) {
        const expectedValue = product.investmentPeriods.join("/") + "개월";
        if (periodInput.value !== expectedValue) {
          modifiedInputs.push("투자기간(Investment Period)");
        }
      }

      const usdRateInput = document.querySelector(
        ".rate li:nth-child(1) input"
      );
      if (usdRateInput) {
        const expectedValue = `${product.dailyInterestRateUsdMin} ~ ${product.dailyInterestRateUsdMax}`;
        if (usdRateInput.value !== expectedValue) {
          modifiedInputs.push("USD 일일금리(USD Daily Rate)");
        }
      }

      const krwRateInput = document.querySelector(
        ".rate li:nth-child(2) input"
      );
      if (krwRateInput) {
        const expectedValue = `${product.dailyInterestRateKrwMin} ~ ${product.dailyInterestRateKrwMax}`;
        if (krwRateInput.value !== expectedValue) {
          modifiedInputs.push("KRW 일일금리(KRW Daily Rate)");
        }
      }

      const rateInput = document.getElementById("rate");
      if (rateInput) {
        const expectedValue = `${product.progressRate.toFixed(2)}%`;
        if (rateInput.value !== expectedValue) {
          modifiedInputs.push("진행률(Progress Rate)");
        }
      }

      if (modifiedInputs.length > 0) {
        const confirmContinue = confirm(
          `다음 필드에 저장되지 않은 변경사항이 있습니다:\n- ${modifiedInputs.join(
            "\n- "
          )}\n\n계속 진행하시겠습니까? 저장되지 않은 변경사항은 손실됩니다.`
        );

        if (!confirmContinue) {
          return;
        }
      }

      window.location.href = "admin_05_01_00.html";
      localStorage.removeItem("currentProduct");
    });
  }
};

// Helper function to parse amount (e.g., "100억" -> 10000000000)
const parseAmount = (value) => {
  const clean = value.replace(/[^0-9.]/g, "");
  if (!clean) return NaN;

  const numValue = parseFloat(clean);
  if (isNaN(numValue)) return NaN;

  if (value.includes("억")) {
    return numValue * 100000000;
  }
  return numValue;
};

// Helper function to parse yield range (e.g., "1.6 ~ 2.4%" -> {min: 1.6, max: 2.4})
const parseYieldRange = (value) => {
  const matches = value.match(/(\d+\.?\d*)\s*~\s*(\d+\.?\d*)/);
  if (matches && matches.length >= 3) {
    const min = parseFloat(matches[1]);
    const max = parseFloat(matches[2]);

    if (isNaN(min) || isNaN(max)) return { min: NaN, max: NaN };
    return { min, max };
  }
  return { min: NaN, max: NaN };
};

// Helper function to parse periods (e.g., "6/12/18/24개월" -> [6, 12, 18, 24])
const parsePeriods = (value) => {
  const trimmed = value.trim();

  // ❶ 정확한 형식인지 정규식으로 확인 (숫자/숫자/.../숫자 + '개월')
  const validFormat = /^\d+(\/\d+)*개월$/.test(trimmed);
  if (!validFormat) return [];

  // ❷ '개월' 제거 후 숫자만 추출
  const withoutText = trimmed.replace("개월", "");
  const parts = withoutText.split("/");

  // ❸ 숫자로 변환 및 유효성 체크
  const periods = parts.map((part) => parseInt(part, 10));
  if (periods.some(isNaN)) return [];

  return periods;
};

// Format currency for display
const formatCurrency = (amount) => {
  const billion = 100000000;
  if (amount >= billion) {
    return `${amount / billion}억`;
  }
  return amount.toLocaleString();
};

async function fetchProducts() {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  $("#loading-screen").show();

  try {
    const apiUrl = `${API_BASE_URL}api/dbs-bond/public/product?page=0&size=30`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
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

    if (data.status === 200) {
      renderProducts(data.data.content);
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Fetch error:", error);
  } finally {
    //$('#loading-screen').hide();
  }
}

function renderProducts(products) {
  const productGrid = document.getElementById("productGrid");
  const template = document.getElementById("productCardTemplate");

  productGrid.innerHTML = "";

  const currencyImages = {
    USD: "../img/main/dollar.jpg",
    EUR: "../img/main/euro.jpg",
    JPY: "../img/main/yen.jpg",
    CNY: "../img/main/solace.jpg",
  };

  products.forEach((product) => {
    const clone = document.importNode(template.content, true);

    const currencyMatch = product.productTitle.match(/^(\w+)/);
    const currency = currencyMatch ? currencyMatch[1] : "USD";

    const imageElement = clone.querySelector(".currency-image");
    imageElement.src = currencyImages[currency] || "../img/main/dollar.jpg";
    imageElement.alt = `${currency} 이미지`;

    clone.querySelector(".product-title").textContent = product.productTitle;
    clone.querySelector(".investment-amount").textContent = formatCurrency(
      product.investmentAmount
    );
    clone.querySelector(
      ".expected-yield"
    ).textContent = `월 ${product.expectedYieldMin}% ~ ${product.expectedYieldMax}%`;
    clone.querySelector(".investment-periods").textContent =
      product.investmentPeriods.join("/") + "개월";

    const progressRate = product.progressRate;
    clone.querySelector(".progress-rate").textContent = `${progressRate.toFixed(
      2
    )}%`;
    clone.querySelector(".bar").style.width = `${progressRate}%`;

    const editButton = clone.querySelector(".edit-button");

    editButton.addEventListener("click", function (e) {
      e.preventDefault();
      const productUuid = product.productUuid; // ← 해당 상품의 UUID
      window.location.href = `admin_05_01_01.html?uuid=${encodeURIComponent(
        productUuid
      )}`;
    });

    productGrid.appendChild(clone);
  });
}

// Function to update the preview card with current product data
function updateProductPreview(product) {
  const productContainer = document.querySelector(".prd_con");

  if (!productContainer) return;

  // Update product title
  const titleElement = productContainer.querySelector(".prd_card_tit p");
  if (titleElement) {
    titleElement.textContent = product.productTitle;
  }

  // Update product image based on currency
  const imageElement = productContainer.querySelector(".img img");
  if (imageElement) {
    const currencyMatch = product.productTitle.match(/^(\w+)/);
    const currency = currencyMatch ? currencyMatch[1] : "USD";

    const currencyImages = {
      USD: "../img/main/dollar.jpg",
      EUR: "../img/main/euro.jpg",
      JPY: "../img/main/yen.jpg",
      CNY: "../img/main/solace.jpg",
    };

    imageElement.src = currencyImages[currency] || "../img/main/dollar.jpg";
    imageElement.alt = `${currency} 이미지`;
  }

  // Update price information
  const priceElements = productContainer.querySelectorAll(".price_con p");
  if (priceElements.length >= 3) {
    // Update amount
    const amountTextElement = priceElements[0].childNodes[2];
    if (amountTextElement) {
      amountTextElement.textContent = formatCurrency(product.investmentAmount);
    }

    // Update yield
    const yieldElement = priceElements[1].querySelector("em");
    if (yieldElement) {
      yieldElement.textContent = `월 ${product.expectedYieldMin}% ~ ${product.expectedYieldMax}%`;
    }

    // Update period
    const periodTextElement = priceElements[2].childNodes[2];
    if (periodTextElement) {
      periodTextElement.textContent =
        product.investmentPeriods.join("/") + "개월";
    }
  }
}
