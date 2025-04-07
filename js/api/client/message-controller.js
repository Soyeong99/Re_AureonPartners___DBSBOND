import { API_BASE_URL } from "../config.js";
import { formatDate } from "../helper.js";

var currentPage = 0;
var totalPages = 0;
var pageSize = 15;

var allMessages = [];
var currentFilter = "all";

$(document).ready(function () {
  // 페이지 로드시 항상 데이터 새로 가져오기
  fetchMessages();

  const urlParams = new URLSearchParams(window.location.search);
  const messageId = urlParams.get("id");
  const status = urlParams.get("status");

  if (messageId && status) {
    displayClickedMessage(messageId, status);
  }

  // 뒤로가기 이벤트 감지 및 처리
  window.addEventListener("pageshow", function (event) {
    // bfcache에서 복원된 경우(뒤로가기) 강제 새로고침
    if (event.persisted) {
      fetchMessages();
    }
  });

  $("#unread-recs").click(function (e) {
    e.preventDefault();
    $("#all-recs").removeClass("active");
    $("#unread-recs").addClass("active");

    currentFilter = "unread";
    filterMessages();
  });

  $("#all-recs").click(function (e) {
    e.preventDefault();
    $("#unread-recs").removeClass("active");
    $("#all-recs").addClass("active");

    currentFilter = "all";
    filterMessages();
  });

  $("#delete-btn").click(function (e) {
    deleteSelectedMessages();
  });

  $("#checkall_01").change(function () {
    const isChecked = $(this).prop("checked");
    $('input[name="check_01"]').prop("checked", isChecked);
  });

  $(document).on("change", 'input[name="check_01"]', function () {
    updateSelectAllCheckbox();
  });
});

// Function to fetch all messages
async function fetchMessages() {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  $("#loading-screen").show();

  try {
    // 캐시를 무시하기 위해 고유한 쿼리 파라미터 추가
    const timestamp = new Date().getTime();
    let apiUrl = `${API_BASE_URL}api/dbs-bond/member/message?page=${currentPage}&size=${pageSize}&_=${timestamp}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        // 캐시 방지 헤더 추가
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
      mode: "cors",
      credentials: "include",
      // 캐시 사용 안함 설정
      cache: "no-store",
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
      //pageSize = data.data.pageSize;
      allMessages = data.data.content;
      paginateAndDisplay(data.data.content);
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error fetching messages:", error);
  } finally {
    $("#loading-screen").fadeOut();
  }

  filterMessages();
}

// Filter messages based on current filter (all/unread)
function filterMessages() {
  let filteredMessages = [];

  if (currentFilter === "all") {
    filteredMessages = [...allMessages];
  } else if (currentFilter === "unread") {
    filteredMessages = allMessages.filter((message) => !message.read);
  }

  totalPages = Math.ceil(filteredMessages.length / pageSize);
  currentPage = 0;

  paginateAndDisplay(filteredMessages);
}

function populateMessageTable(messages) {
  const tableBody = $("table tbody");
  tableBody.empty();

  if (messages.length === 0) {
    const emptyRow = `
      <tr>
        <td colspan="4" class="text-center">쪽지가 없습니다.</td>
      </tr>
    `;
    tableBody.append(emptyRow);
  } else {
    messages.forEach((message) => {
      const row = $(`
        <tr data-href="./mail_in.html?id=${message.messageUuid}&status=${
        message.read
      }">
          <td>
            <input type="checkbox" name="check_01" id="check_01" data-id="${
              message.messageUuid
            }">
            <label for="check_${message.messageUuid}"><b></b></label>
          </td>
          <td class="list_tit">${message.title}</td>
          <td>${formatDate(message.regDate)}</td>
          <td>
            <div class="${message.read ? "wait" : "end"}">
              ${message.read ? "읽음" : "안 읽음"}
            </div>
          </td>
        </tr>
      `);

      // ✅ tr 클릭 시 페이지 이동, 체크박스 클릭은 제외
      row.on("click", function (event) {
        const targetTag = event.target.tagName.toLowerCase();
        if (targetTag !== "input" && targetTag !== "label") {
          const href = $(this).data("href");
          window.location.href = href;
        }
      });

      tableBody.append(row);
    });
  }
}

// Generate pagination based on current page and total pages
function generatePagination() {
  const paginationContainer = $(".tabnav");
  paginationContainer.empty();
  if (!(currentPage === 0 && (totalPages === 1 || totalPages === 0))) {
    paginationContainer.append(
      `<li><a href="#" id="prevTab" class="prev-page" ${
        currentPage === 0 ? "disabled" : ""
      }>&lt;</a></li>`
    );
  }

  for (let i = 0; i < totalPages; i++) {
    const isActive = i === currentPage;
    paginationContainer.append(`
            <li><a href="#tab${i + 1}" class="tab-link ${
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
  setupPaginationEvents();
}

// Setup event handlers for pagination
function setupPaginationEvents() {
  $(".tab-link").click(function (e) {
    e.preventDefault();
    currentPage = parseInt($(this).data("page"));
    fetchMessages();
  });

  $("#prevTab").click(function (e) {
    e.preventDefault();
    if (currentPage > 0) {
      currentPage--;
      fetchMessages();
    }
  });

  $("#nextTab").click(function (e) {
    e.preventDefault();
    if (currentPage < totalPages - 1) {
      currentPage++;
      fetchMessages();
    }
  });
}

// Paginate and display messages
function paginateAndDisplay(data) {
  populateMessageTable(data);
  generatePagination();
  resetCheckboxes();
}

// Update "Select All" checkbox based on individual checkboxes
function updateSelectAllCheckbox() {
  const totalCheckboxes = $('input[name="check_01"]').length;
  const checkedCheckboxes = $('input[name="check_01"]:checked').length;

  if (totalCheckboxes > 0 && totalCheckboxes === checkedCheckboxes) {
    $("#checkall_01").prop("checked", true);
  } else {
    $("#checkall_01").prop("checked", false);
  }
}

// Reset checkboxes when page changes
function resetCheckboxes() {
  $("#checkall_01").prop("checked", false);
  $('input[name="check_01"]').prop("checked", false);
}

async function deleteSelectedMessages() {
  const selectedIds = [];

  $('input[name="check_01"]:checked').each(function () {
    selectedIds.push($(this).data("id"));
  });

  if (selectedIds.length === 0) {
    alert("삭제할 쪽지를 선택하세요.");
    return;
  }

  if (confirm("선택한 쪽지를 삭제하시겠습니까?")) {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      console.error("No access token retrieved. Cannot fetch data.");
      return;
    }

    try {
      let apiUrl = `${API_BASE_URL}api/dbs-bond/member/message`;

      const response = await fetch(apiUrl, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        mode: "cors",
        credentials: "include",
        body: JSON.stringify(selectedIds),
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
        allMessages = allMessages.filter(
          (message) => !selectedIds.includes(message.id)
        );
        filterMessages();
        location.reload();
      } else {
        console.error("API Error:", data.resultMsg);
      }
    } catch (error) {
      console.error("Error fetching notices:", error);
    }
  }
}

// Function to display a clicked message
async function displayClickedMessage(messageUuid, status) {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/member/message/${messageUuid}`;

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
      console.log("Status: ", status);
      if (status === "false") {
        const currentCount =
          parseInt(localStorage.getItem("umsgCount"), 10) || 0;
        console.log("Current Count: ", currentCount);
        const msgCount = currentCount > 0 ? currentCount - 1 : 0;
        console.log("Message Count UpdatE: ", msgCount);
        localStorage.setItem("umsgCount", msgCount.toString());
      }

      document.getElementById("title").textContent = data.data.title;
      document.getElementById("content").innerHTML = data.data.content;
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error fetching notices:", error);
  }
}
