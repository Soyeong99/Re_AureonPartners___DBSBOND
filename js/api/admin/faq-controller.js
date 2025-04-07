import { API_BASE_URL } from "../config.js";
import { generatePagination } from "../helper.js";

var currentPage = 0;
var totalPages = 0;
var pageSize = 15;

$(document).ready(function () {
  const currentPath = window.location.pathname;

  if (
    currentPath.includes("/admin/admin_05_06_00.html") ||
    currentPath.includes("/admin/admin_05_06_01.html")
  ) {
    fetchFAQs();
  }

  $("#submit-main").on("click", function () {
    createFAQ();
  });

  $("#submit-update").on("click", function () {
    updateFAQs();
  });

  // Handle pagination clicks
  $(document).on("click", ".page-number", function (e) {
    e.preventDefault();
    currentPage = parseInt($(this).data("page"));
    fetchFAQs();
  });

  $(document).on("click", ".prev", function (e) {
    e.preventDefault();
    if (currentPage > 0) {
      currentPage--;
      fetchFAQs();
    }
  });

  $(document).on("click", ".next", function (e) {
    e.preventDefault();
    if (currentPage < totalPages - 1) {
      currentPage++;
      fetchFAQs();
    }
  });
});

async function fetchFAQs() {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  $("#loading-screen").show();

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/common/faq?page=${currentPage}&size=${pageSize}`;

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
      const faqList = data.data.content;

      const allFaqs = await Promise.all(
        faqList.map(async (faq, index) => {
          const detailData = await fetchCertainFAQ(faq.uuidBaseBoard);
          return {
            id: index + 1,
            uuidBaseBoard: faq.uuidBaseBoard,
            title: faq.title,
            hit: faq.hit,
            regDate: faq.regDate,
            content: detailData
              ? detailData.content
              : "내용을 불러올 수 없습니다.",
          };
        })
      );

      // pageSize = data.data.pageSize;
      totalPages = data.data.totalPages;

      paginateAndDisplay(allFaqs);
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error fetching FAQs:", error);
  } finally {
    $("#loading-screen").fadeOut();
  }
}

async function fetchCertainFAQ(faqUuid) {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch FAQ details.");
    return null;
  }

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/common/faq/${faqUuid}`;

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
      return data.data;
    } else {
      console.error("API Error:", data.resultMsg);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching FAQ details for ${faqUuid}:`, error);
    return null;
  }
}

// Function to populate the FAQs table
function renderFaqTable(data) {
  const tableBody = document.getElementById("faqTableBody");
  const template = document.getElementById("faqItemTemplate");

  tableBody.innerHTML = "";

  const currentPath = window.location.pathname;
  const isEditPage = currentPath.includes("/admin/admin_05_06_01.html");

  if (isEditPage) {
    data.forEach((item) => {
      const faqItem = template.content.cloneNode(true);

      faqItem.querySelector(".dropdown_toggle").dataset.uid =
        item.uuidBaseBoard;
      faqItem.querySelector(".faq-id").textContent = item.id;
      faqItem.querySelector(".faq-title input").value = item.title;
      faqItem.querySelector(".faq-content").value = item.content;
      tableBody.appendChild(faqItem);
    });
  } else {
    data.forEach((item) => {
      const faqItem = template.content.cloneNode(true);
      faqItem.querySelector(".dropdown_toggle").dataset.uid =
        item.uuidBaseBoard;
      faqItem.querySelector(".faq-id").textContent = item.id;
      faqItem.querySelector(".faq-title").textContent = item.title;
      faqItem.querySelector(".faq-content").textContent = item.content;
      tableBody.appendChild(faqItem);
    });
  }
  setupDropdowns();
}

function setupDropdowns() {
  const toggleRows = document.querySelectorAll(".dropdown_toggle");

  toggleRows.forEach((row) => {
    row.addEventListener("click", function () {
      const contentRow = this.nextElementSibling;

      if (contentRow.style.display === "table-row") {
        contentRow.style.display = "none";
      } else {
        document.querySelectorAll(".dropdown_content").forEach((content) => {
          content.style.display = "none";
        });

        contentRow.style.display = "table-row";
      }
    });
  });
}

function paginateAndDisplay(data) {
  renderFaqTable(data);
  generatePagination(currentPage, totalPages);
}

// <------------- Creating FAQ ------------->
function getFAQDetails() {
  const title = document.getElementById("utitle").value.trim();
  const content = document.getElementById("ucontent").value.trim();

  return { title, content };
}

// Function to create an FAQ
async function createFAQ() {
  const { title, content } = getFAQDetails();

  if (!title || !content) {
    alert("제목과 내용을 입력해주세요.");
    return;
  }

  const payload = { title, content };

  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  $("#btn-spinner").show();

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/admin/faq/create`;

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
      alert("FAQ를 성공적으로 보냈습니다.");
      document.getElementById("utitle").value = "";
      document.getElementById("ucontent").value = "";
      window.location.href = "admin_05_06_00.html";
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error creating the FAQ: ", error);
  } finally {
    $("#btn-spinner").fadeOut();
  }
}

// <------------- Updating FAQ ------------->
function getUpdatedFAQDetails() {
  const updatedFaqs = [];

  const tableRows = document.querySelectorAll(".dropdown_toggle");

  console.log(tableRows);
  tableRows.forEach((row) => {
    const uiid = row.dataset.uid;
    const title = row.querySelector(".faq-title input").value.trim();
    const content = row.nextElementSibling
      .querySelector(".faq-content")
      .value.trim();

    updatedFaqs.push({ uiid, title, content });
  });

  return updatedFaqs;
}

async function updateFAQs() {
  const updatedFaqs = getUpdatedFAQDetails();

  if (updatedFaqs.length === 0) {
    alert("업데이트할 FAQ가 없습니다");
    return;
  }

  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  const requestData = {
    faqs: updatedFaqs.map((faq) => ({
      uuidBaseBoard: faq.uiid,
      title: faq.title,
      content: faq.content,
    })),
  };

  $("#btn-spinner").show();

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/admin/faq`;

    const response = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      mode: "cors",
      credentials: "include",
      body: JSON.stringify(requestData),
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
      alert("FAQ가 성공적으로 업데이트되었습니다");
      fetchFAQs();
      window.location.href = "admin_05_06_00.html";
    }
  } catch (error) {
    console.error("Error updating the FAQ: ", error);
  } finally {
    $("#btn-spinner").fadeOut();
  }
}
