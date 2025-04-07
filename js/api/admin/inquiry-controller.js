import { API_BASE_URL } from "../config.js";
import { formatDate, generatePagination } from "../helper.js";

var currentPage = 0;
var totalPages = 0;
var pageSize = 15;

$(document).ready(function () {
  const currentPath = window.location.pathname;

  if (currentPath.includes("/admin/admin_05_03_01.html")) {
    displayClickedInquiry();
  } else {
    fetchInquiries();
  }

  $(".submit").on("click", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const inquiryId = urlParams.get("id");

    if (inquiryId) {
      sendReply(inquiryId);
    }
  });

  // Handle pagination clicks
  $(document).on("click", ".page-number", function (e) {
    e.preventDefault();
    currentPage = parseInt($(this).data("page"));
    fetchInquiries();
  });

  $(document).on("click", ".prev", function (e) {
    e.preventDefault();
    if (currentPage > 0) {
      currentPage--;
      fetchInquiries();
    }
  });

  $(document).on("click", ".next", function (e) {
    e.preventDefault();
    if (currentPage < totalPages - 1) {
      currentPage++;
      fetchInquiries();
    }
  });
});

// Function to fetch all inquiries
async function fetchInquiries() {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  $("#loading-screen").show();

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/admin/inquiry/all?page=${currentPage}&size=${pageSize}`;

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
    console.error("Error fetching inquiry accounts:", error);
  } finally {
    $("#loading-screen").fadeOut();
  }
}

// Function to populate the inquiry table
function populateInquiryTable(inquiries) {
  const tableBody = $("table tbody");
  tableBody.empty();

  // 페이지가 0부터 시작한다고 가정할 경우:
  const offset = currentPage * pageSize;
  let counter = offset + 1;

  inquiries.forEach((inquiry) => {
    const row = `
              <tr class="clickable-row" style="cursor: pointer;" data-href="admin_05_03_01.html?id=${
                inquiry.uuidInquiry
              }">
                  <td>${counter++}</td>
                  <td>${inquiry.name}</td>
                  <td>${inquiry.inquiryTitle}</td>
                  <td class="data-content">${inquiry.inquiryContent}</td>
                  <td>${formatDate(inquiry.regDate)}</td>
                  <td style="color: ${
                    inquiry.inquiryStatus ? "#239B13" : "#FF3333"
                  };">${inquiry.inquiryStatus ? "완료" : "대기"}</td>
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

function paginateAndDisplay(data) {
  populateInquiryTable(data);
  generatePagination(currentPage, totalPages);
}

// <----------------------- Retrieving Clicked Inquiry ----------------------->
async function displayClickedInquiry() {
  const urlParams = new URLSearchParams(window.location.search);
  const uuidInquiry = urlParams.get("id");
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/admin/inquiry/${uuidInquiry}`;

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
      document.getElementById("user_name").innerHTML = data.data.name;
      document.getElementById("inq-title").innerHTML = data.data.inquiryTitle;
      document.getElementById("ucontent").value = data.data.inquiryContent;
      if (data.data.inquiryAnswer && data.data.inquiryStatus) {
        document.getElementById("ureply").value = data.data.inquiryAnswer;
      }
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error fetching admin messages:", error);
  }
}

// <----------------------- Sending Reply to Inquiry ----------------------->
// Function to send the reply to a certain inquiry
async function sendReply(inquiryId) {
  const reply = document.getElementById("ureply").value.trim();

  if (!reply) {
    alert("제목과 내용을 입력해주세요.");
    return;
  }

  const payload = { answerContent: reply };

  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  $("#btn-spinner").show();

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/admin/inquiry/${inquiryId}/answer`;

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

    if (data.status === 200) {
      alert("답변이 전송되었습니다");
      document.getElementById("ureply").value = "";
      window.location.href = "admin_05_03_00.html";
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error sending the reply: ", error);
  } finally {
    $("#btn-spinner").fadeOut();
  }
}
