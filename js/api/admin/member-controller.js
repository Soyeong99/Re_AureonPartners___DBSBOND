import { API_BASE_URL } from "../config.js";
import {
  formatDate,
  formatNumberWithCommas,
  formatPhoneNumber,
  generatePagination,
} from "../helper.js";

var currentPage = 0;
var totalPages = 0;
var pageSize = 15;

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
    fetchMemberAccounts();
  });
  const currentPath = window.location.pathname;

  if (currentPath.includes("/admin/adimin_01_01_00.html")) {
    fetchMemberAccounts();
  } else {
    fetchMemberDetails();
  }

  $(".reset_btn").on("click", function () {
    resetMemberPassword();
  });

  $(".close").on("click", function () {
    softDeleteMember();
  });

  // Handle pagination clicks
  $(document).on("click", ".page-number", function (e) {
    e.preventDefault();
    currentPage = parseInt($(this).data("page"));
    fetchMemberAccounts();
  });

  $(document).on("click", ".prev", function (e) {
    e.preventDefault();
    if (currentPage > 0) {
      currentPage--;
      fetchMemberAccounts();
    }
  });

  $(document).on("click", ".next", function (e) {
    e.preventDefault();
    if (currentPage < totalPages - 1) {
      currentPage++;
      fetchMemberAccounts();
    }
  });
});

// Function to fetch all members
async function fetchMemberAccounts() {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  $("#loading-screen").show();
  showSkeletonMemberCount();

  const startDate = $("#startRegDateFilter").val();
  const endDate = $("#endRegDateFilter").val();

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/admin/members?page=${currentPage}&size=${pageSize}&startDate=${startDate}&endDate=${endDate}`;

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
      totalPages = data.data.totalPages;
      pageSize = data.data.pageSize;

      updateMemberCount(data.data.totalElements);
      paginateAndDisplay(data.data.content);
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error fetching member accounts:", error);
  } finally {
    $("#loading-screen").fadeOut();
    hideSkeleton();
  }
}

// Function to fetch member details
async function fetchMemberDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const memberUuid = urlParams.get("id");
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/admin/members/${memberUuid}`;

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
      document.querySelector(".content_area h2").childNodes[0].nodeValue =
        data.data.name + " ";
      document.querySelector(
        ".info .txt:nth-of-type(1) p:nth-of-type(2)"
      ).textContent = data.data.identifier;
      document.querySelector(
        ".info .txt:nth-of-type(3) p:nth-of-type(2)"
      ).textContent = data.data.phoneNumber;

      document.getElementById("bank").textContent = data.data.bank + "은행";
      document.getElementById("acc-num").textContent =
        data.data.bankAccountNumber;
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error fetching member accounts:", error);
  } finally {
  }
}

// Function to populate the member table
function populateMemberTable(members) {
  const tableBody = $("table tbody");
  tableBody.empty();

  members.forEach((member) => {
    const row = $(`
        <tr style="cursor: pointer;">
          <td>${member.name}</td>
          <td>${member.identifier}</td>
         <td>${formatPhoneNumber(member.phoneNumber)}</td>
          <td>${member.bank}</td>
          <td>${member.bankAccountNumber}</td>
          <td>${formatDate(member.regDate)}</td>
        </tr>
      `);

    row.on("click", () => {
      window.location.href = `adimin_01_01_01.html?id=${member.memberUuid}`;
    });

    tableBody.append(row);
  });
}

// Show Skeleton Loader for Member Count
function showSkeletonMemberCount() {
  $("#member-count-skeleton").addClass("skeleton-box").text("");
}

// Hide Skeleton Loader
function hideSkeleton() {
  $("#member-count-skeleton").removeClass("skeleton-box");
}

// Function to update member count
function updateMemberCount(count) {
  $(".num p span:nth-child(2)")
    .text(formatNumberWithCommas(count))
    .removeClass("skeleton-box");
}

function paginateAndDisplay(paginatedData) {
  populateMemberTable(paginatedData);
  generatePagination(currentPage, totalPages);
}

async function resetMemberPassword() {
  const urlParams = new URLSearchParams(window.location.search);
  const memberUuid = urlParams.get("id");
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/admin/members/${memberUuid}/reset-password`;

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
      $(".modal_reset").stop().fadeIn("200");
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error fetching member accounts:", error);
  }
}

async function softDeleteMember() {
  const urlParams = new URLSearchParams(window.location.search);
  const memberUuid = urlParams.get("id");
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/admin/members/${memberUuid}/del`;

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
      $(".modal_secess_02").stop().fadeIn("200");
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error fetching member accounts:", error);
  }
}
