import { API_BASE_URL } from "../config.js";
import {
  formatDate,
  generatePagination,
  initializeDropdownEvents,
  formatNumberWithCommas,
} from "../helper.js";

var currentPage = 0;
var totalPages = 0;
var pageSize = 15;
var isApproved = null;

function formatDateToLocalYYYYMMDD(date) {
  const offset = date.getTimezoneOffset(); // 분 단위
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
}

$(document).ready(function () {
  const today = new Date();
  const thisYearStart = new Date(today.getFullYear(), 0, 1);

  const formattedStartDate = formatDateToLocalYYYYMMDD(thisYearStart);
  const formattedEndDate = formatDateToLocalYYYYMMDD(today);

  $("#startRegDateFilter").val(formattedStartDate);
  $("#endRegDateFilter").val(formattedEndDate);

  $("#startRegDateFilter, #endRegDateFilter").on("change", function () {
    const startDate = new Date($("#startRegDateFilter").val());
    const endDate = new Date($("#endRegDateFilter").val());

    // 유효성 검사: 종료일이 시작일보다 빠른 경우
    if (endDate < startDate) {
      alert("종료일은 시작일보다 빠를 수 없습니다.");

      // 잘못된 값 되돌리기 (기존 값 유지 또는 기본값으로)
      const today = new Date();
      const formattedEndDate = formatDateToLocalYYYYMMDD(today);
      $("#endRegDateFilter").val(formattedEndDate);

      return; // fetch 호출 막기
    }

    fetchDepositRecords(isApproved);
  });
  const currentPath = window.location.pathname;

  if (currentPath.includes("/admin/adimin_01_01_01.html")) {
    fetchMemberDepositRecords();
    getInvestmentSummary();
  } else {
    fetchDepositRecords(isApproved);
  }

  // <------------------------------ Dropdown Menu and Pagination ------------------------------>
  $("ol.m_state_ch li").on("click", function (e) {
    e.stopPropagation();
    const selectedText = $(this).find("button").text().trim();

    currentPage = 0;

    // 메인 버튼 텍스트 업데이트 (HTML로 처리하면 span 포함)
    $("#main-choice").html(
      `${selectedText} <span class="bi bi-chevron-down"></span>`
    );

    // 선택값에 따라 fetchDepositRecords 호출
    if (selectedText === "승인") {
      isApproved = true;
      fetchDepositRecords(isApproved);
    } else if (selectedText === "대기") {
      isApproved = false;
      fetchDepositRecords(isApproved);
    } else {
      isApproved = "";
      // "전체"나 그 외의 경우는 필터 없이 호출
      fetchDepositRecords(isApproved);
    }
  });

  // Handle pagination clicks (서버 사이드 페이지네이션 적용)
  $(document).on("click", ".page-number", function (e) {
    e.preventDefault();
    currentPage = parseInt($(this).data("page"));
    if (window.location.pathname.includes("/admin/adimin_01_01_01.html")) {
      fetchMemberDepositRecords();
    } else {
      fetchDepositRecords(isApproved);
    }
  });

  $(document).on("click", ".prev", function (e) {
    e.preventDefault();
    if (currentPage > 0) {
      currentPage--;
      if (window.location.pathname.includes("/admin/adimin_01_01_01.html")) {
        fetchMemberDepositRecords();
      } else {
        fetchDepositRecords(isApproved);
      }
    }
  });

  $(document).on("click", ".next", function (e) {
    e.preventDefault();
    if (currentPage < totalPages - 1) {
      currentPage++;
      if (window.location.pathname.includes("/admin/adimin_01_01_01.html")) {
        fetchMemberDepositRecords();
      } else {
        fetchDepositRecords(isApproved);
      }
    }
  });
});

// <------------------------------ Fetch Deposits ------------------------------>
// Function to fetch all deposit records
async function fetchDepositRecords(isApproved = null) {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  $("#loading-screen").show();
  showSkeletonDepositCount();

  const startDate = $("#startRegDateFilter").val();
  const endDate = $("#endRegDateFilter").val();

  try {
    const currentPath = window.location.pathname;

    if (currentPath.includes("/admin/adimin_02_01_01.html")) {
      isApproved = true;
    }

    let apiUrl = `${API_BASE_URL}api/dbs-bond/admin/investment/pending?startDate=${startDate}&endDate=${endDate}&page=${currentPage}&size=${pageSize}`;

    if (isApproved !== null) {
      apiUrl += `&isApproved=${isApproved}`;
    }

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

    console.log(data);

    if (data.status === 200) {
      totalPages = data.data.pagination.totalPages;
      pageSize = data.data.pagination.pageSize;

      updateTotalDeposit(data.data.totalInvestmentAmount);
      paginateAndDisplay(data.data.pagination.content);
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error fetching deposit accounts:", error);
  } finally {
    $("#loading-screen").fadeOut();
    hideSkeleton();
  }
}

// Function to populate the deposit table
function populateDepositTable(deposits) {
  const tableBody = $("table tbody");
  tableBody.empty();

  deposits.forEach((deposit) => {
    const initialState = deposit.isDepositApproved ? "승인" : "대기";
    const initialClass = deposit.isDepositApproved
      ? "state_green"
      : "state_red";

    const row = `
            <tr data-investment-uuid="${deposit.uuidInvestment}">
                <td>${deposit.investorName}</td>
                <td>${formatDate(deposit.regDate)}</td>
                <td>${deposit.productName.substring(0, 3)}</td>
                <td>${deposit.investmentAmount.toLocaleString()}원</td>
                <td>
                    <ul class="state_con">
                        <li class="active">
                            <button type="button" class="state ${initialClass}">
                                ${initialState}
                                <span class="bi bi-chevron-down state_bk" style="cursor:pointer;"></span>
                            </button>

                            <ol class="state_ch">
                                <li class="state_green dropdown-inv" ${
                                  initialState === "승인"
                                    ? 'style="display: none;"'
                                    : ""
                                }>
                                    <button type="button" class="state state_green" style="cursor:pointer;">승인</button>
                                </li>
                                
                                <li class="state_red dropdown-inv" ${
                                  initialState === "대기"
                                    ? 'style="display: none;"'
                                    : ""
                                }>
                                    <button type="button" class="state state_red" style="cursor:pointer;">대기</button>
                                </li>

                                <li class="state_bk dropdown-inv">
                                    <button type="button" class="state state_bk" style="cursor:pointer;">취소</button>
                                </li>
                            </ol>
                        </li>
                    </ul>
                </td>
            </tr>
        `;
    tableBody.append(row);
  });

  initializeDropdownEvents();
  attachDropdownEvents();
}

// Function to populate the deposit history table
function populateDepositHistoryTable(deposits) {
  const tableBody = $("table tbody");
  tableBody.empty();

  deposits.forEach((deposit) => {
    const row = `
            <tr data-investment-uuid="${deposit.uuidInvestment}">
                <td>${deposit.investorName}</td>
                <td>${formatDate(deposit.regDate)}</td>
                <td>${deposit.productName.substring(0, 3)}</td>
                <td>${deposit.investmentAmount.toLocaleString()}원</td>
                <td class="state_green">승인</td>
            </tr>
        `;

    tableBody.append(row);
  });
}

// <------------------------------ Fetch Member Deposits ------------------------------>
// Function to fetch member deposit records
async function fetchMemberDepositRecords() {
  const urlParams = new URLSearchParams(window.location.search);
  const memberUuid = urlParams.get("id");
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  $("#loading-screen").show();

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/admin/investment/${memberUuid}/investments?page=${currentPage}&size=${pageSize}`;

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

    console.log(data);

    if (data.status === 200) {
      totalPages = data.data.totalPages;
      pageSize = data.data.pageSize;

      paginateAndDisplay(data.data.content);
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error fetching deposit accounts:", error);
  } finally {
    $("#loading-screen").fadeOut();
    hideSkeleton();
  }
}

// Function to populate the member deposit history table
function populateMemberDepositHistoryTable(deposits) {
  const tableBody = $("#investments-tbody");
  tableBody.empty();

  deposits.forEach((deposit) => {
    const row = `
            <tr>
                <td>${deposit.productName}</td>
                <td>${deposit.investmentPeriod}개월</td>
                <td>${formatNumberWithCommas(deposit.investmentAmount)}</td>
                <td>${formatDate(deposit.investmentDate)}</td>
                <td>${formatDate(deposit.expiryDate)}</td>
                <td class="${
                  deposit.status === "회수" ? "state_red" : "state_green"
                }">${deposit.status}</td>
            </tr>
        `;
    tableBody.append(row);
  });
}

// <------------------------------ Update Deposit Status ------------------------------>
function attachDropdownEvents() {
  $(".state_green.dropdown-inv button, .state_red.dropdown-inv button").on(
    "click",
    async function () {
      const isApprove =
        $(this).hasClass("state_green") || $(this).text().trim() === "승인";
      const row = $(this).closest("tr");
      const investmentUuid = row.data("investment-uuid");
      const success = await updateInvestmentStatus(
        investmentUuid,
        `${isApprove ? true : false}`
      );

      if (success) {
        const stateButton = row.find(".state_con li.active > button.state");
        if (isApprove) {
          stateButton.removeClass("state_red").addClass("state_green");
          stateButton.text("승인");
          stateButton.append(
            '<span class="bi bi-chevron-down state_bk" style="cursor:pointer;"></span>'
          );
          row.find(".state_green.dropdown-inv").hide();
          row.find(".state_red.dropdown-inv").show();
          row.find(".state_ch").hide();
        } else {
          stateButton.removeClass("state_green").addClass("state_red");
          stateButton.text("대기");
          stateButton.append(
            '<span class="bi bi-chevron-down state_bk" style="cursor:pointer;"></span>'
          );
          row.find(".state_red.dropdown-inv").hide();
          row.find(".state_green.dropdown-inv").show();
          row.find(".state_ch").hide();
        }
      }
    }
  );

  $(".state_bk.dropdown-inv button").on("click", async function () {
    const row = $(this).closest("tr");
    const investmentUuid = row.data("investment-uuid");
    await deleteInvestmentStatus(investmentUuid);
  });
}

async function updateInvestmentStatus(investmentUuid, isApproved) {
  try {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      console.error("No access token retrieved. Cannot update status.");
      return false;
    }

    const apiUrl = `${API_BASE_URL}api/dbs-bond/admin/investment/${investmentUuid}/status?isApproved=${isApproved}`;

    const response = await fetch(apiUrl, {
      method: "PUT",
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
      return true;
    } else {
      console.error("API Error:", data.resultMsg);
      return false;
    }
  } catch (error) {
    console.error("Error updating investment status:", error);
    return false;
  }
}

async function deleteInvestmentStatus(investmentUuid) {
  try {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      console.error("No access token retrieved. Cannot update status.");
      return false;
    }

    const apiUrl = `${API_BASE_URL}api/dbs-bond/admin/investment/${investmentUuid}`;

    const response = await fetch(apiUrl, {
      method: "DELETE",
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
      fetchDepositRecords();
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error updating investment status:", error);
  }
}

// Show Skeleton Loader for Deposit Count
function showSkeletonDepositCount() {
  $("#total-investment-amount").addClass("skeleton-box").text("");
}

// Hide Skeleton Loader
function hideSkeleton() {
  $("#total-investment-amount").removeClass("skeleton-box");
}

// Function to update deposit count
function updateTotalDeposit(count) {
  $(".num p span:nth-child(2)")
    .text(formatNumberWithCommas(count))
    .removeClass("skeleton-box");
}

function paginateAndDisplay(deposits) {
  const currentPath = window.location.pathname;
  if (currentPath.includes("/admin/adimin_02_01_01.html")) {
    populateDepositHistoryTable(deposits);
  } else if (currentPath.includes("/admin/adimin_01_01_01.html")) {
    populateMemberDepositHistoryTable(deposits);
  } else {
    populateDepositTable(deposits);
  }

  generatePagination(currentPage, totalPages);
}

// <------------------------------ Investment Summary ------------------------------>
async function getInvestmentSummary() {
  const urlParams = new URLSearchParams(window.location.search);
  const uuidMember = urlParams.get("id");

  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/admin/investment/${uuidMember}/financial-summary`;

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

    if (data.status === 201 || data.status === 200) {
      $("#total-investment").text(
        formatNumberWithCommas(data.data.totalInvestment) + " 원"
      );
      $("#total-withdrawal").text(
        formatNumberWithCommas(data.data.totalWithdrawal) + " 원"
      );
      $("#total-repayments").text(
        formatNumberWithCommas(data.data.totalRepayment) + " 원"
      );
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error retrieving investment summary: ", error);
  }
}
