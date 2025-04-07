import { API_BASE_URL } from "../config.js";
import {
  formatDate,
  formatNumberWithCommas,
  generatePagination,
} from "../helper.js";

let all_members = false;
let recipientMemberUuids = [];
let searchTimeout = null;
const DEBOUNCE_DELAY = 300;

var currentPage = 0;
var totalPages = 0;
var pageSize = 15;

let memberListCurrentPage = 0;
let memberListTotalPages = 1; // 초기값 1로 설정 (최초 로딩용)
let isLoadingMembers = false; // 중복 요청 방지

let memberMessagePage = 0;
let memberMessageTotalPages = 1;
let isLoadingMemberMessages = false;

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
    fetchMemberData();
  });
  const currentPath = window.location.pathname;

  if (currentPath.includes("/admin/adimin_01_02_01.html")) {
    displayClickedMessage();
  } else if (currentPath.includes("/admin/adimin_01_01_01.html")) {
    fetchMemberMessages();
  } else {
    fetchAdminMessages();
  }

  $("#search").on("click", function () {
    fetchMemberList();
  });

  $(".submit").on("click", function () {
    sendMessage();
  });

  $("#all_choice").on("click", function () {
    all_members = this.checked;
    if (all_members) {
      collateMemberUuids();
      $(".search_tag_area ul").empty();
      $(".search_tag_area ul").append(`
        <li>
          <div class="search_tag" style="padding: 0px 10px;">
            <p>전체회원</p>
            <button
              id="all-button-close"
              data-tag="all"
              style="all: unset; cursor: pointer; font-size: 25px; font-weight: 400; color: #888; line-height: 1;"
            >
              ×
            </button>
          </div>
        </li>
      `);
    } else {
      removeAllTag();
    }
  });

  $(document).on("click", "#all-button-close", function () {
    const tag = $(this).data("tag");
    if (tag === "all") {
      removeAllTag();
    }
  });
  $("#search-input").on("input", function () {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    searchTimeout = setTimeout(function () {
      const inputVal = $("#search-input").val().trim();

      // 리스트 초기화
      memberListCurrentPage = 0;
      memberListTotalPages = 1;
      $("#member-list-modal").empty();

      // 검색어 여부에 따라 전체 or 검색 호출
      fetchMemberList();
    }, DEBOUNCE_DELAY);
  });

  $("#modal-close").on("click", function () {
    $("#search-input").val("");
  });

  // Handle pagination clicks (서버 사이드 페이지네이션 적용)
  $(document).on("click", ".page-number", function (e) {
    e.preventDefault();
    currentPage = parseInt($(this).data("page"));
    fetchAdminMessages();
  });

  $(document).on("click", ".prev", function (e) {
    e.preventDefault();
    if (currentPage > 0) {
      currentPage--;

      fetchAdminMessages();
    }
  });

  $(document).on("click", ".next", function (e) {
    e.preventDefault();
    if (currentPage < totalPages - 1) {
      currentPage++;

      fetchAdminMessages();
    }
  });

  $("#table_modal").on("scroll", function () {
    const $this = $(this);
    const scrollTop = $this.scrollTop();
    const innerHeight = $this.innerHeight();
    const scrollHeight = this.scrollHeight;

    if (scrollTop + innerHeight >= scrollHeight - 10) {
      fetchMemberList(); // 다음 페이지 데이터 불러오기
    }
  });

  $("#table_messages").on("scroll", function () {
    const $this = $(this);
    const scrollTop = $this.scrollTop();
    const innerHeight = $this.innerHeight();
    const scrollHeight = this.scrollHeight;

    if (
      scrollTop + innerHeight >= scrollHeight - 10 &&
      !isLoadingMemberMessages &&
      memberMessagePage < memberMessageTotalPages
    ) {
      fetchMemberMessages(memberMessagePage); // 다음 페이지 불러오기
    }
  });
});

// <----------------------- Messages List (All Admin Messages) ----------------------->
async function fetchAdminMessages() {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  $("#loading-screen").show();

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/admin/message?page=${currentPage}&size=${pageSize}
`;

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
      updateTotalWithdrawalAmount(data.data.totalElements);
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error fetching admin messages:", error);
  } finally {
    $("#loading-screen").fadeOut();
  }
}

// Function to populate the admin messages table
function populateAdminMessagesTable(messages) {
  const tableBody = $("#admin-messages-tbody");
  tableBody.empty();

  // 페이지가 0부터 시작한다고 가정할 경우:
  const offset = currentPage * pageSize;
  let counter = offset + 1;

  messages.forEach((message) => {
    const row = $(`
        <tr style="cursor: pointer;">
          <td>${counter++}</td>
          <td>${message.title}</td>
          <td>${message.receiverName}</td>
          <td>${formatDate(message.regDate)}</td>
          <td style="color: ${message.read ? "#239B13" : "#FF3333"};">
            ${message.read ? "읽음" : "안읽음"}
          </td>
        </tr>
      `);

    row.on("click", function () {
      window.location.href = `adimin_01_02_01.html?id=${message.messageUuid}`;
    });

    tableBody.append(row);
  });
}

// <----------------------- Messages List (Member Messages) ----------------------->
async function fetchMemberMessages(page = 0) {
  const urlParams = new URLSearchParams(window.location.search);
  const memberUuid = urlParams.get("id");
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  isLoadingMemberMessages = true;

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/admin/message/${memberUuid}/messages?page=${page}&size=30`;

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
      memberMessageTotalPages = data.data.totalPages;

      if (page === 0) {
        // 첫 페이지일 때는 비우기
        $("#member-messages-tbody").empty();
      }

      populateMemberMessagesTable(data.data.content);
      memberMessagePage++;
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error fetching member messages:", error);
  } finally {
    isLoadingMemberMessages = false;
  }
}

// Function to populate the member messages table
// Function to populate the member messages table
function populateMemberMessagesTable(messages) {
  const tableBody = $("#member-messages-tbody");

  // 페이지가 0부터 시작한다고 가정할 경우:
  const offset = currentPage * pageSize;
  let counter = offset + 1;

  // ✅ 데이터가 비어있으면 안내 메시지 출력
  if (!messages || messages.length === 0) {
    tableBody.append(`
      <tr>
        <td colspan="4" style="text-align: center; padding: 20px; color: #888;">
         보내신 쪽지가 없습니다.
        </td>
      </tr>
    `);
    return;
  }

  messages.forEach((message) => {
    const row = `
      <tr>
        <td>${counter++}</td>
        <td>${message.title}</td>
        <td>${formatDate(message.regDate)}</td>
        <td style="color: ${message.read ? "#239B13" : "#FF3333"};">
          ${message.read ? "읽음" : "안읽음"}
        </td>
      </tr>
    `;
    tableBody.append(row);
  });
}

// <----------------------- Member List Modal ----------------------->
// Function to fetch all members
async function fetchMemberData(page = 0) {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return null;
  }

  const searchInput = $("#search-input").val().trim();
  const startDate = $("#startRegDateFilter").val();
  const endDate = $("#endRegDateFilter").val();

  // base URL 구성
  let apiUrl = `${API_BASE_URL}api/dbs-bond/admin/members?isDeleted=false&startDate=${startDate}&endDate=${endDate}&page=${page}&size=30`;

  // 검색 키워드가 있을 경우에만 추가
  if (searchInput.length > 0) {
    apiUrl += `&keyword=${encodeURIComponent(searchInput)}`;
  }

  try {
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
      memberListTotalPages = data.data.totalPages;
      return data.data.content;
    } else {
      console.error("API Error:", data.resultMsg);
      return null;
    }
  } catch (error) {
    console.error("Error fetching member accounts:", error);
    return null;
  }
}

async function fetchMemberList() {
  if (isLoadingMembers || memberListCurrentPage >= memberListTotalPages) return;

  isLoadingMembers = true;

  const memberData = await fetchMemberData(memberListCurrentPage);

  // ✅ 무조건 호출하고 내부에서 처리
  populateMemberList(memberData || []);

  if (memberData && memberData.length > 0) {
    memberListCurrentPage++;
  }

  isLoadingMembers = false;
}

function populateMemberList(members) {
  const tableBody = $("#member-list-modal");

  tableBody.find("#loading-screen-2").remove();

  // ✅ 데이터가 비어 있으면 안내 메시지 출력
  if (!members || members.length === 0) {
    console.log("뭐야??");
    tableBody.append(`
      <tr  class="clickable-row">
        <td colspan="3" style="text-align: center; padding: 20px; color: #888;">
          회원이 없습니다.
        </td>
      </tr>
    `);
    return;
  }

  members.forEach((member) => {
    const row = $(` 
      <tr class="clickable-row">
        <td>${member.name}</td>
        <td>${formatDate(member.birthDate)}</td>
        <td>${formatDate(member.regDate)}</td>
      </tr>
    `);

    row.on("click", function () {
      addToSearchTagArea(member.name, member.memberUuid);
      closeModal();
    });

    tableBody.append(row);
  });
}

async function collateMemberUuids() {
  const memberData = await fetchMemberData();

  if (memberData) {
    recipientMemberUuids = [];

    memberData.forEach((member) => {
      recipientMemberUuids.push(member.memberUuid);
    });
  }
}

function addToSearchTagArea(name, id) {
  if (all_members) {
    removeAllTag();
  }

  if (
    $(`.search_tag_area li[data-id='${id}']`).length > 0 ||
    recipientMemberUuids.includes(id)
  ) {
    return;
  }

  recipientMemberUuids.push(id);

  const tagItem = $(`
        <li data-id="${id}">
            <div class="search_tag">
                <p>${name}</p>
                <p class="bi bi-x del" style="cursor:pointer;"></p>
            </div>
        </li>
    `);

  tagItem.find(".del").on("click", function () {
    removeTag(this, id);
  });

  $(".search_tag_area ul").append(tagItem);
}

function removeTag(element, memberUuid) {
  $(element).closest("li").remove();
  recipientMemberUuids = recipientMemberUuids.filter((id) => id !== memberUuid);
}

function removeAllTag() {
  all_members = false;
  document.getElementById("all_choice").checked = false;
  $(".search_tag_area ul").empty();
  recipientMemberUuids = [];
}

function closeModal() {
  $(".modal").fadeOut();
}

// <----------------------- Sending Messages ----------------------->
function getMessageDetails() {
  const title = document.getElementById("utitle").value.trim();
  const content = document.getElementById("ucontent").value.trim();

  return { title, content };
}

// Function to send the message
async function sendMessage() {
  const { title, content } = getMessageDetails();

  if (!title || !content) {
    alert("제목과 내용을 입력해주세요.");
    return;
  }

  // ✅ 전체 회원이 아닐 경우 개별 선택 여부 확인
  if (!all_members && recipientMemberUuids.length === 0) {
    alert("받는 사람을 선택해주세요.");
    return;
  }

  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot send message.");
    return;
  }

  $("#btn-spinner").show();

  try {
    let apiUrl = "";
    let payload = {};

    if (all_members) {
      // ✅ 전체 회원 대상일 때 broadcast API 사용
      apiUrl = `${API_BASE_URL}api/dbs-bond/admin/message/broadcast`;
      payload = {
        title,
        content,
      };
    } else {
      // ✅ 선택된 회원 대상일 때 기존 API 사용
      apiUrl = `${API_BASE_URL}api/dbs-bond/admin/message`;
      payload = {
        title,
        content,
        recipientMemberUuids,
        isDeletedByMember: false,
      };
    }

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
    const tags = $(".search_tag_area ul");

    if (data.status === 201 || data.status === 200) {
      fetchAdminMessages();
      alert("메시지를 성공적으로 보냈습니다.");

      tags.empty();
      recipientMemberUuids = [];
      document.getElementById("utitle").value = "";
      document.getElementById("ucontent").value = "";
      location.reload();
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error sending the message: ", error);
  } finally {
    $("#btn-spinner").fadeOut();
  }
}

// <----------------------- Retrieving Clicked Message ----------------------->
async function displayClickedMessage() {
  const urlParams = new URLSearchParams(window.location.search);
  const messageId = urlParams.get("id");
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/admin/message/${messageId}`;

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
      document.getElementById("uname").value = data.data.receiverName;
      document.getElementById("utitle").value = data.data.title;
      document.getElementById("ucontent").value = data.data.content;
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error fetching admin messages:", error);
  } finally {
    //$('#loading-screen').fadeOut();
  }
}

// Function to update withdrawal count
function updateTotalWithdrawalAmount(count) {
  $(".num p span:nth-child(2)")
    .text(formatNumberWithCommas(count))
    .removeClass("skeleton-box");
}

function paginateAndDisplay(paginatedData) {
  populateAdminMessagesTable(paginatedData);
  generatePagination(currentPage, totalPages);
}
