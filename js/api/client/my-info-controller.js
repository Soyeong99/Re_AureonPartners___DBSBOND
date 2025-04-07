import { API_BASE_URL } from "../config.js";

document.addEventListener("DOMContentLoaded", function () {
  async function fetchInvestmentSummary() {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      console.error("No access token retrieved. Cannot fetch data.");
      return;
    }

    try {
      let apiUrl = `${API_BASE_URL}api/dbs-bond/member/my-info/investment-summary`;

      const response = await fetch(apiUrl, {
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

      if ([200, 201].includes(data.status) && data.data) {
        updateInvestmentSummary(data.data);
        updateInvestmentRatios(data.data);
        updateChartBar(data.data);
        updateProfitSummary(data.data);
      } else {
        console.error("Invalid API response:", data);
        alert(data.resultMsg || "Unexpected error occurred.");
      }
    } catch (error) {
      console.error("Error fetching investment summary:", error);
    } finally {
      $("#btn-spinner").fadeOut();
    }
  }

  function updateInvestmentSummary(data) {
    const investmentEl = document.getElementById("total-investment-amount");
    const profitEl = document.getElementById("total-profit-amount");

    if (investmentEl)
      investmentEl.textContent = `${data.totalInvestment.toLocaleString()} 원`;
    if (profitEl)
      profitEl.textContent = `${data.totalProfit.toLocaleString()} 원`;
  }

  function updateInvestmentRatios(data) {
    const currencyData = {
      USD: { total: 0, ratio: 0 },
      EUR: { total: 0, ratio: 0 },
      JPY: { total: 0, ratio: 0 },
      CNY: { total: 0, ratio: 0 },
    };

    data.investments.forEach((investment) => {
      const currency = investment.productName.split(" ")[0];
      if (currencyData[currency]) {
        currencyData[currency].total += investment.investmentAmount;
        currencyData[currency].ratio += investment.investmentRatio;
      }
    });

    for (const [currency, data] of Object.entries(currencyData)) {
      const ratioElement = document.querySelector(
        `.${currency.toLowerCase()}-investment-ratio`
      );
      if (ratioElement) {
        ratioElement.textContent = `${Math.round(data.ratio)}%`;
      }
    }
  }

  function updateChartBar(data) {
    const chartBar = document.querySelector(".chart-bar");
    if (!chartBar) return;

    const currencyData = {
      USD: { total: 0, ratio: 0 },
      EUR: { total: 0, ratio: 0 },
      JPY: { total: 0, ratio: 0 },
      CNY: { total: 0, ratio: 0 },
    };

    data.investments.forEach((investment) => {
      const currency = investment.productName.split(" ")[0];
      if (currencyData[currency]) {
        currencyData[currency].total += investment.investmentAmount;
        currencyData[currency].ratio += investment.investmentRatio;
      }
    });

    const totalRatio = Object.values(currencyData).reduce(
      (sum, c) => sum + c.ratio,
      0
    );

    if (totalRatio === 0) {
      chartBar.style.background = "#e0e0e0"; // 비율 없을 때 회색 처리
      return;
    }

    const usdDeg = Math.round(currencyData.USD.ratio * 3.6);
    const eurDeg = Math.round(currencyData.EUR.ratio * 3.6);
    const jpyDeg = Math.round(currencyData.JPY.ratio * 3.6);
    const cnyDeg = 360 - (usdDeg + eurDeg + jpyDeg);

    const conicGradient = `conic-gradient(
      #FC7E05 0deg ${usdDeg}deg,
      #FFD900 ${usdDeg}deg ${usdDeg + eurDeg}deg,
      #6732B0 ${usdDeg + eurDeg}deg ${usdDeg + eurDeg + jpyDeg}deg,
      #22E025 ${usdDeg + eurDeg + jpyDeg}deg 360deg
    )`;

    chartBar.style.background = conicGradient;
  }

  function updateProfitSummary(data) {
    const currencyGroups = {};

    data.investments.forEach((inv) => {
      const currency = inv.productName.split(" ")[0];
      if (!currencyGroups[currency]) {
        currencyGroups[currency] = {
          totalProfit: 0,
          totalInvestment: 0,
        };
      }
      currencyGroups[currency].totalProfit += inv.profitAmount;
      currencyGroups[currency].totalInvestment += inv.investmentAmount;
    });

    const currencies = ["USD", "EUR", "JPY", "CNY"];

    currencies.forEach((currency) => {
      const lowerCurrency = currency.toLowerCase();
      const profitAmountEl = document.getElementById(
        `${lowerCurrency}-profit-amount`
      );
      const profitPercentEl = document.getElementById(
        `${lowerCurrency}-profit-percent`
      );

      if (currencyGroups[currency]) {
        const profit = currencyGroups[currency].totalProfit;
        const investment = currencyGroups[currency].totalInvestment;

        const profitPercent = investment > 0 ? (profit / investment) * 100 : 0;

        if (profitAmountEl) {
          profitAmountEl.textContent = `${profit.toLocaleString()} 원`;
        }

        if (profitPercentEl) {
          profitPercentEl.textContent = `${profitPercent.toFixed(2)}%`;
        }
      } else {
        if (profitAmountEl) profitAmountEl.textContent = "0 원";
        if (profitPercentEl) profitPercentEl.textContent = "0.00%";
      }
    });
  }

  fetchInvestmentSummary();
});
