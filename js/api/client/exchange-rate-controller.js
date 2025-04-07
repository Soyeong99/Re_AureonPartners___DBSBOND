import { API_BASE_URL } from "../config.js";
import { formatRegDateTime } from "../helper.js";

$(document).ready(function () {
  fetchExchangeRates();
  drawAllGraphs();
  updateAllExchangeRateElements(); // ✅ 여기 추가
});

async function fetchExchangeRates() {
  try {
    //const accessToken = localStorage.getItem("accessToken");
    const currencies = ["USD", "EUR", "JPY", "CNY"];
    const today = new Date();
    const nonBusinessDay = isNonBusinessDay(today);

    let promises;

    if (nonBusinessDay) {
      promises = currencies.map((currency) => {
        const mostRecentDay = getMostRecentBusinessDay();
        const apiUrl = `${API_BASE_URL}api/exchange-rateV2/${currency}/history?date=${mostRecentDay}`;

        return fetch(apiUrl, {
          method: "GET",
          mode: "cors",
          credentials: "include",
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(
                `Error fetching ${currency} history! Status: ${response.status}`
              );
            }
            return response.json();
          })
          .then((historyResult) => {
            if (
              historyResult.data &&
              historyResult.data.content &&
              historyResult.data.content.length > 0
            ) {
              const latestEntry = historyResult.data.content[0];
              return {
                status: 200,
                data: {
                  displayRate: latestEntry.exchangeRate,
                  changePercentage: latestEntry.changePercentage || 0,
                  changeDirection: latestEntry.changeDirection || "none",
                  regDate: latestEntry.regDate,
                },
              };
            } else {
              throw new Error(`No history data available for ${currency}`);
            }
          });
      });
    } else {
      promises = currencies.map((currency) => {
        const apiUrl = `${API_BASE_URL}api/exchange-rateV2/${currency}`;

        return fetch(apiUrl, {
          method: "GET",
          mode: "cors",
          credentials: "include",
        }).then((response) => {
          if (!response.ok) {
            throw new Error(
              `Error fetching ${currency}! Status: ${response.status}`
            );
          }
          return response.json();
        });
      });
    }

    const results = await Promise.all(promises);

    results.forEach((result, index) => {
      if (result.status === 200 && result.data) {
        const currency = currencies[index].toLowerCase();
        const exchangeData = result.data;
        const currencyPrefix = currency === "cny" ? "cnh" : currency;

        const rateElement = document.getElementById(`${currencyPrefix}-rate`);
        if (rateElement)
          rateElement.textContent = exchangeData.displayRate.toFixed(1);

        const changeElement = document.getElementById(
          `${currencyPrefix}-change`
        );
        if (changeElement)
          changeElement.textContent = exchangeData.changePercentage.toFixed(4);

        const directionIcon = rateElement
          ?.closest(".top_con")
          ?.querySelector(".bi");
        if (directionIcon) {
          directionIcon.className =
            exchangeData.changeDirection === "up"
              ? "bi bi-caret-up-fill"
              : exchangeData.changeDirection === "down"
              ? "bi bi-caret-down-fill"
              : "";
        }

        const changePrefix = changeElement
          ?.closest(".ctn")
          ?.querySelector("span");
        if (changePrefix) {
          changePrefix.textContent =
            exchangeData.changeDirection === "up"
              ? "+"
              : exchangeData.changeDirection === "down"
              ? "-"
              : "";
        }

        const currentTime = document.getElementById(`${currencyPrefix}-time`);
        if (currentTime)
          currentTime.textContent = formatRegDateTime(exchangeData.regDate);
      }
    });
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
  }
}

const koreanHolidays = [
  "2025-01-01",
  "2025-02-10",
  "2025-02-11",
  "2025-02-12", // New Year & Seollal
  "2025-03-01",
  "2025-05-05",
  "2025-05-06", // Independence, Children's Day (substituted)
  "2025-06-06",
  "2025-08-15",
  "2025-09-07",
  "2025-09-08",
  "2025-09-09", // Memorial, Liberation, Chuseok
  "2025-10-03",
  "2025-10-09",
  "2025-12-25", // National Foundation, Hangeul, Christmas
];

// Function to get the most recent business day
function getMostRecentBusinessDay() {
  const today = new Date();
  const day = today.getDay();
  let daysToSubtract = 0;

  function isHoliday(date) {
    return koreanHolidays.includes(date.toISOString().split("T")[0]);
  }

  if (day === 0) {
    daysToSubtract = 2;
  } else if (day === 6) {
    daysToSubtract = 1;
  }

  let prevDate = new Date(today);
  prevDate.setDate(today.getDate() - daysToSubtract);

  while (isHoliday(prevDate)) {
    prevDate.setDate(prevDate.getDate() - 1);
  }

  return prevDate.toISOString().split("T")[0];
}

// Function to check if a date is a weekend or a Korean holiday
function isNonBusinessDay(date) {
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6;

  const dateString = date.toISOString().split("T")[0];
  const isHoliday = koreanHolidays.includes(dateString);

  return isWeekend || isHoliday;
}

async function fetchExchangeRateHistory(targetCurrency) {
  try {
    //const accessToken = localStorage.getItem("accessToken");
    const currentDate = new Date();
    const nonBusinessDay = isNonBusinessDay(currentDate);
    const dateToUse = nonBusinessDay
      ? getMostRecentBusinessDay()
      : currentDate.toISOString().split("T")[0];

    const apiUrl = `${API_BASE_URL}api/exchange-rateV2/${targetCurrency}/history?date=${dateToUse}`;

    const response = await fetch(apiUrl, {
      method: "GET",
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
    return result.data.content;
  } catch (error) {
    console.error(
      `Error fetching exchange rate history for ${targetCurrency}:`,
      error
    );
    return [];
  }
}

function drawAllGraphs() {
  const currencies = ["USD", "EUR", "JPY", "CNY"];
  currencies.forEach((currency) => drawGraph(currency));
}

async function drawGraph(currency) {
  const data = await fetchExchangeRateHistory(currency);

  console.log(`[${currency}] 원본 환율 히스토리`, data);
  if (!data || data.length === 0) {
    console.error(`No data available to render the graph for ${currency}.`);
    return;
  }

  const exchangeRates = data.map((item) => item.displayRate);
  const maxRate = Math.max(...exchangeRates);
  const minRate = Math.min(...exchangeRates);
  const rateRange = maxRate - minRate || 1;

  function normalize(rate) {
    return ((rate - minRate) / rateRange) * 150 + 20;
  }

  const points = data.map((item, index) => ({
    x: index * 60,
    y: 200 - normalize(item.displayRate),
  }));

  const canvas = document.getElementById(`lineChart${currency}`);
  if (!canvas) {
    console.error(`Canvas element for ${currency} not found!`);
    return;
  }

  canvas.width = canvas.parentElement.clientWidth || 500;
  canvas.height = 200;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, "#51d922");
  gradient.addColorStop(0.5, "#48aa7e");
  gradient.addColorStop(1, "#3f7bda");

  ctx.lineWidth = 4;
  ctx.strokeStyle = gradient;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  if (points.length > 1) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length - 2; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }

    const len = points.length;
    ctx.quadraticCurveTo(
      points[len - 2].x,
      points[len - 2].y,
      points[len - 1].x,
      points[len - 1].y
    );

    ctx.stroke();
  } else {
    console.warn(`Not enough data points for ${currency} to draw a curve.`);
  }
}

async function updateAllExchangeRateElements() {
  const currencies = ["USD", "EUR", "JPY", "CNY"];

  for (const currency of currencies) {
    try {
      const response = await fetch(
        `${API_BASE_URL}api/exchange-rateV2/yesterday/${currency}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          mode: "cors",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch yesterday's exchange rate for ${currency}`
        );
      }

      const result = await response.json();

      console.log(result);
      const exchangeRate = result.data?.changePercentage;

      if (!exchangeRate) {
        console.warn(`${currency} - No exchangeRate found in response`);
        continue;
      }

      // CNY has ID prefix "cnh"
      const idPrefix =
        currency.toLowerCase() === "cny" ? "cnh" : currency.toLowerCase();
      const targetElement = document.getElementById(`${idPrefix}-change`);

      if (targetElement) {
        targetElement.textContent = exchangeRate.toFixed(6);
      } else {
        console.warn(`Element with id '${idPrefix}-change' not found`);
      }
    } catch (error) {
      console.error(`Error updating exchange rate for ${currency}:`, error);
    }
  }
}
