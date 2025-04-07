import { API_BASE_URL } from "../config.js";
import { formatDate } from "../helper.js";

var currentPage = 0;
var totalPages = 0;
var pageSize = 15;

$(document).ready(function () {
  const currentPath = window.location.pathname;

  if (currentPath.includes("/sub_05_02_in.html")) {
    displayClickedNotice();
  } else {
    fetchNotices();
  }
});

// Function to fetch all notices
async function fetchNotices() {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  $("#loading-screen").show();

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/common/notice?page=${currentPage}&size=${pageSize}`;

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
      // pageSize = data.data.pageSize;

      paginateAndDisplay(data.data.content);
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error fetching notices:", error);
  } finally {
    $("#loading-screen").fadeOut();
  }
}

// Function to populate the notice table
function populateNoticeTable(notices) {
  const tableBody = $("table tbody");
  tableBody.empty();

  if (notices.length === 0) {
    const emptyRow = `
            <tr>
                <td colspan="3" class="text-center">공지사항이 없습니다.</td>
            </tr>
        `;
    tableBody.append(emptyRow);
  } else {
    // 페이지가 0부터 시작한다고 가정할 경우:
    const offset = currentPage * pageSize;
    let counter = offset + 1;

    notices.forEach((notice) => {
      const row = `
                <tr class="clickable-row" data-href="./sub_05_02_in.html?id=${
                  notice.uuidBaseBoard
                }" style="cursor: pointer;">
                    <td class="list_num">${counter++}</td>
                    <td class="list_tit">${notice.title}</td>
                    <td>${formatDate(notice.uploadDate)}</td>
                </tr>
            `;
      tableBody.append(row);
    });

    document.querySelectorAll(".clickable-row").forEach((row) => {
      row.addEventListener("click", function () {
        window.location.href = this.dataset.href;
      });
    });
  }
}

// Generate pagination based on current page and total pages
function generatePagination(currentPage, totalPages) {
  const paginationContainer = $(".tabnav");
  paginationContainer.empty();

  if (!(currentPage === 0 && (totalPages === 1 || totalPages === 0))) {
    paginationContainer.append(
      `<li><a href="#" id="prevTab" class="prev-page" ${
        currentPage === 0 ? "disabled" : ""
      }>&lt;</a></li>`
    );
  }

  const maxPagesToShow = 5;
  let startPage = Math.max(0, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 1);

  if (endPage === totalPages - 1) {
    startPage = Math.max(0, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const isActive = i === currentPage;
    paginationContainer.append(`
            <li><a href="#tab${i + 1}" class="tab-link page-number ${
      isActive ? "active" : ""
    }" data-page="${i}">${i + 1}</a></li>
        `);
  }

  if (!(currentPage === 0 && (totalPages === 1 || totalPages === 0))) {
    paginationContainer.append(
      `<li><a href="#" id="nextTab" class="next-page" ${
        currentPage === totalPages - 1 ? "disabled" : ""
      }>&gt;</a></li>`
    );
  }
}

// Handle pagination clicks
$(document).on("click", ".tab-link", function (e) {
  e.preventDefault();
  const pageNum = $(this).data("page");
  if (pageNum !== undefined) {
    currentPage = parseInt(pageNum);
    fetchNotices();
  }
});

$(document).on("click", "#prevTab", function (e) {
  e.preventDefault();
  if (currentPage > 0) {
    currentPage--;
    fetchNotices();
  }
});

$(document).on("click", "#nextTab", function (e) {
  e.preventDefault();
  if (currentPage < totalPages - 1) {
    currentPage++;
    fetchNotices();
  }
});

function paginateAndDisplay(data) {
  populateNoticeTable(data);
  if (data.length > 0) {
    generatePagination(currentPage, totalPages);
  }
}

// Function to display a clicked notice
function displayClickedNotice() {
  const urlParams = new URLSearchParams(window.location.search);
  const noticeId = urlParams.get("id");

  if (noticeId) {
    fetchNoticeDetails(noticeId);
  } else {
    console.error("No notice ID provided in the URL");
  }
}

// Fetch details for a specific notice
async function fetchNoticeDetails(noticeId) {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  try {
    const apiUrl = `${API_BASE_URL}api/dbs-bond/common/notice/${noticeId}`;

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
      displayNoticeInUI(data.data);
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error fetching notice details:", error);
  }
}

// Display notice details in the UI
function displayNoticeInUI(notice) {
  $("#announcement-title").text(notice.title);
  $("#announcement-date").text(formatDate(notice.uploadDate));
  $("#announcement-content").html(notice.content);

  if (notice.files && notice.files.length > 0) {
    displayAttachments(notice.files);
  }
}

function displayAttachments(noticeFiles) {
  const container = document.getElementById("attachments");
  container.innerHTML = "";

  if (noticeFiles.length === 0) {
    return;
  }

  noticeFiles.forEach((file) => {
    const fileExtension = file.fileName.split(".").pop().toLowerCase();
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];

    if (imageExtensions.includes(fileExtension)) {
      const img = document.createElement("img");
      img.src = file.fileUrl;
      img.alt = file.fileName;
      img.classList.add("attachment-image");
      container.appendChild(img);
    } else {
      const link = document.createElement("a");
      link.href = file.fileUrl;
      link.textContent = file.fileName;
      link.classList.add("attachment-link");
      link.target = "_blank";
      container.appendChild(link);
    }
  });
}
