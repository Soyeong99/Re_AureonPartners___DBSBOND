import { API_BASE_URL } from "../config.js";
import { formatDate } from "../helper.js";

var currentPage = 0;
var totalPages = 0;
var pageSize = 15;

$(document).ready(function () {
  const currentPath = window.location.pathname;

  if (currentPath.includes("/sub_05_03.html")) {
    fetchMyInquiries();
  } else if (currentPath.includes("/sub_05_03_in2.html")) {
    getFAQAuthor();
  } else {
    displayClickedInquiry();
  }

  $("#submit-btn").click(function (e) {
    createInquiry();
  });
});

// Function to fetch all the member's inquiries
async function fetchMyInquiries() {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  $("#loading-screen").show();

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/member/inquiry/my-inquiries?page=${currentPage}&size=${pageSize}`;

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
      paginateAndDisplay(data.data.content);
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error fetching inquiries:", error);
  } finally {
    $("#loading-screen").fadeOut();
  }
}

// Function to populate the inquiries table
function populateInquiriesTable(inquiries) {
  const tableBody = $("table tbody");
  tableBody.empty();

  if (inquiries.length === 0) {
    const emptyRow = `
            <tr>
                <td colspan="4" class="text-center">문의사항이 없습니다.</td>
            </tr>
        `;
    tableBody.append(emptyRow);
  } else {
    // 페이지가 0부터 시작한다고 가정할 경우:
    const offset = currentPage * pageSize;
    let counter = offset + 1;

    inquiries.forEach((inquiry) => {
      const row = `
                <tr>
                    <td class="list_num">${counter++}</td>
                    <td class="list_tit clickable-td" data-href="./sub_05_03_in.html?id=${
                      inquiry.uuidInquiry
                    }">${inquiry.inquiryTitle}</td>
                    <td class="list_day">${formatDate(inquiry.regDate)}</td>
                    <td>
                      <div class="${inquiry.inquiryStatus ? "end" : "wait"}" >${
        inquiry.inquiryStatus ? "답변완료" : "답변대기"
      }</div>
                    </td>
                </tr>
            `;
      tableBody.append(row);
    });

    document.querySelectorAll(".clickable-td").forEach((row) => {
      row.addEventListener("click", function (event) {
        window.location.href = this.dataset.href;
        event.stopPropagation();
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
    fetchMyInquiries();
  }
});

$(document).on("click", "#prevTab", function (e) {
  e.preventDefault();
  if (currentPage > 0) {
    currentPage--;
    fetchMyInquiries();
  }
});

$(document).on("click", "#nextTab", function (e) {
  e.preventDefault();
  if (currentPage < totalPages - 1) {
    currentPage++;
    fetchMyInquiries();
  }
});

function paginateAndDisplay(data) {
  populateInquiriesTable(data);
  if (data.length > 0) {
    generatePagination(currentPage, totalPages);
  }
}

// Function to display a clicked inquiry
function displayClickedInquiry() {
  const urlParams = new URLSearchParams(window.location.search);
  const inquiryId = urlParams.get("id");
  const currentPath = window.location.pathname;

  if (!inquiryId) {
    console.error("No inquiry ID found in the URL.");
    return;
  }

  fetchInquiryDetails(inquiryId);
}

// Fetch details for a specific inquiry
async function fetchInquiryDetails(uuidInquiry) {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  try {
    const apiUrl = `${API_BASE_URL}api/dbs-bond/member/inquiry/${uuidInquiry}`;

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
      displayInquiryInUI(data.data);
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error fetching notice details:", error);
  }
}

// Display inquiry details in the UI
function displayInquiryInUI(inquiry) {
  $("#inquiry-title").text(inquiry.inquiryTitle);
  $("#inquiry-date").text(formatDate(inquiry.regDate));
  $("#inquiry-content").html(inquiry.inquiryContent);

  if (inquiry.inquiryAnswer) {
    $("#inquiry-response").html(inquiry.inquiryAnswer);
  } else {
    $("#inquiry-response").html("답변 대기 중입니다.");
  }
}

// <------------- Creating Inquiry ------------->
async function getFAQAuthor() {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/member/my-info`;

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
      document.getElementById("username").value = data.data.name;
      document.getElementById("identifier").value = data.data.identifier;
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error creating the FAQ: ", error);
  }
}

function getFAQInquiry() {
  const title = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();

  return { title, content };
}

// Function to create an Inquiry
async function createInquiry() {
  const { title, content } = getFAQInquiry();

  if (!title || !content) {
    document.getElementById("title").style.border = "1px solid red";
    document.getElementById("content").style.border = "1px solid red";

    setTimeout(() => {
      alert("제목과 내용을 입력해주세요.");
    }, 500);
    return;
  }

  const payload = { inquiryTitle: title, inquiryContent: content };

  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  $("#btn-spinner").show();

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/member/inquiry`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
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

    const data = await response.json();

    if (data.status === 201 || data.status === 200) {
      // setTimeout(() => {
      //     showSuccessNotification("문의가 성공적으로 등록되었습니다.");
      // }, 500);
      document.getElementById("title").value = "";
      document.getElementById("content").value = "";
      window.location.href = "sub_05_03.html";
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error creating the FAQ: ", error);
  } finally {
    $("#btn-spinner").fadeOut();
  }
}
