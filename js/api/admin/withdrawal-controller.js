import { API_BASE_URL } from "../config.js";
import {
  formatDate,
  formatNumberWithCommas,
  generatePagination,
  initializeDropdownEvents,
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
    fetchWithdrawals(isApproved);
  });

  fetchWithdrawals(isApproved);

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
      fetchWithdrawals(isApproved);
    } else if (selectedText === "대기") {
      isApproved = false;
      fetchWithdrawals(isApproved);
    } else {
      isApproved = null;
      // "전체"나 그 외의 경우는 필터 없이 호출
      fetchWithdrawals(isApproved);
    }
  });

  // Handle filter change
  $(document).on("change", "#regDateFilter", function () {
    fetchWithdrawals();
  });

  // Handle pagination clicks (서버 사이드 페이지네이션 적용)
  $(document).on("click", ".page-number", function (e) {
    e.preventDefault();
    currentPage = parseInt($(this).data("page"));
    fetchWithdrawals(isApproved);
  });

  $(document).on("click", ".prev", function (e) {
    e.preventDefault();
    if (currentPage > 0) {
      currentPage--;

      fetchWithdrawals(isApproved);
    }
  });

  $(document).on("click", ".next", function (e) {
    e.preventDefault();
    if (currentPage < totalPages - 1) {
      currentPage++;

      fetchWithdrawals(isApproved);
    }
  });
});

// Function to fetch all withdrawal records
async function fetchWithdrawals(isApproved = null) {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  $("#loading-screen").show();
  showSkeletonWithdrawalAmount();

  const startDate = $("#startRegDateFilter").val();
  const endDate = $("#endRegDateFilter").val();

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/admin/withdrawal/withdrawals?startDate=${startDate}&endDate=${endDate}&page=${currentPage}&size=${pageSize}`;

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

    if (data.status === 200) {
      totalPages = data.data.pagination.totalPages;
      // pageSize = data.data.pagination.pageSize;

      updateTotalWithdrawalAmount(data.data.totalWithdrawAmount);
      paginateAndDisplay(data.data.pagination.content);
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error fetching withdrawal records:", error);
  } finally {
    $("#loading-screen").fadeOut();
    hideSkeleton();
  }
}

// Function to populate the withdrawals table
function populateWithdrawalsTable(withdrawals) {
  const tableBody = $("table tbody");
  tableBody.empty();

  withdrawals.forEach((withdrawal) => {
    const initialState = withdrawal.isApproved ? "승인" : "대기";
    const initialClass = withdrawal.isApproved ? "state_green" : "state_red";

    const row = `
            <tr data-withdrawal-uuid="${withdrawal.withdrawalUuid}">
                <td>${withdrawal.investorName}</td>
                <td>${formatDate(withdrawal.withdrawDate)}</td>
                <td>${withdrawal.productName.substring(0, 3)}</td>
                <td>${withdrawal.interestRate}%</td>
                <td>${withdrawal.withdrawAmount.toLocaleString()}원</td>
                <td>${withdrawal.accountNumber}</td>
                <td>${withdrawal.bank}</td>
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

function attachDropdownEvents() {
  $(".state_green.dropdown-inv button, .state_red.dropdown-inv button").on(
    "click",
    async function () {
      const isApprove =
        $(this).hasClass("state_green") || $(this).text().trim() === "승인";
      const row = $(this).closest("tr");
      const withdrawalUuid = row.data("withdrawal-uuid");
      const success = await updateWithdrawalStatus(
        withdrawalUuid,
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
}

async function updateWithdrawalStatus(withdrawalUuid, isApproved) {
  try {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      console.error("No access token retrieved. Cannot update status.");
      return false;
    }

    const apiUrl = `${API_BASE_URL}api/dbs-bond/admin/withdrawal/${withdrawalUuid}/status?isApproved=${isApproved}`;

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

// Show Skeleton Loader for withdrawal Count
function showSkeletonWithdrawalAmount() {
  $("#total-withdrawal-amount").addClass("skeleton-box").text("");
}

// Hide Skeleton Loader
function hideSkeleton() {
  $("#total-withdrawal-amount").removeClass("skeleton-box");
}

// Function to update withdrawal count
function updateTotalWithdrawalAmount(count) {
  $(".num p span:nth-child(2)")
    .text(formatNumberWithCommas(count))
    .removeClass("skeleton-box");
}

function paginateAndDisplay(paginatedData) {
  populateWithdrawalsTable(paginatedData);
  generatePagination(currentPage, totalPages);
}
