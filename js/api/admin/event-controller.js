import { API_BASE_URL } from "../config.js";
import { formatDate, generatePagination } from "../helper.js";

var currentPage = 0;
var totalPages = 0;
var pageSize = 15;

let removedFileUuids = [];
let existingFiles = [];
let newFiles = [];

$(document).ready(function () {
  const currentPath = window.location.pathname;

  if (currentPath.includes("/admin/admin_05_04_01_02.html")) {
    displayClickedEvent();
  } else {
    fetchEvents();
  }

  $("#submit-create").on("click", function () {
    createEvent();
  });

  $("#submit-update").on("click", function () {
    const originalTitle = document.getElementById("utitle").value;
    const originalContent = document.getElementById("ucontent").value;
    const originalLinkUrl = document.getElementById("urlLink").value;
    updateEvent(originalTitle, originalContent, originalLinkUrl);
  });

  $("#delete-events").on("click", function () {
    removeEvents();
  });

  // Handle pagination clicks
  $(document).on("click", ".page-number", function (e) {
    e.preventDefault();
    currentPage = parseInt($(this).data("page"));
    fetchEvents();
  });

  $(document).on("click", ".prev", function (e) {
    e.preventDefault();
    if (currentPage > 0) {
      currentPage--;
      fetchEvents();
    }
  });

  $(document).on("click", ".next", function (e) {
    e.preventDefault();
    if (currentPage < totalPages - 1) {
      currentPage++;
      fetchEvents();
    }
  });
});

// Function to fetch all events
async function fetchEvents() {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  $("#loading-screen").show();

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/common/event?page=${currentPage}&size=${pageSize}`;

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
    console.error("Error fetching events:", error);
  } finally {
    $("#loading-screen").fadeOut();
  }
}

// Function to populate the events table
function populateEventsTable(events, currentPage, pageSize) {
  const tableBody = $("table tbody");
  tableBody.empty();

  const offset = currentPage * pageSize;
  let counter = offset + 1;

  events.forEach((event) => {
    const row = $(`
          <tr class="clickable-row" style="cursor: pointer;">
            <td>${counter++}</td>
            <td>${event.title}</td>
            <td>${formatDate(event.regDate)}</td>
          </tr>
      `);

    // ✅ 클릭 시 상세 페이지로 이동
    row.on("click", function () {
      window.location.href = `admin_05_04_01_02.html?id=${event.uuidBaseBoard}`;
    });

    tableBody.append(row);
  });
}

function paginateAndDisplay(data) {
  populateEventsTable(data, currentPage, pageSize); // ✅ 전역 변수 전달
  generatePagination(currentPage, totalPages);
}

// <----------------------- Retrieving Clicked event ----------------------->
async function displayClickedEvent() {
  const urlParams = new URLSearchParams(window.location.search);
  const uuidInquiry = urlParams.get("id");
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/common/event/${uuidInquiry}`;

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
      document.getElementById("utitle").value = data.data.title;
      document.getElementById("udate").value = data.data.uploadDate;
      document.getElementById("ucontent").value = data.data.content;
      document.getElementById("urlLink").value = data.data.linkUrl;

      existingFiles = data.data.files || [];

      updateFileListDisplay();
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error fetching admin messages:", error);
  }
}

// Updated function to display both existing and new files
function updateFileListDisplay() {
  const uploadNameInput = document.querySelector(".file_box .upload_name");

  let fileListContainer = document.getElementById("file-list-overlay");
  if (!fileListContainer) {
    fileListContainer = document.createElement("div");
    fileListContainer.id = "file-list-overlay";
    fileListContainer.className = "upload_name file-list-overlay";
    uploadNameInput.parentNode.insertBefore(
      fileListContainer,
      uploadNameInput.nextSibling
    );

    const inputStyles = window.getComputedStyle(uploadNameInput);
    fileListContainer.style.width = inputStyles.width;
    fileListContainer.style.height = inputStyles.height;
    fileListContainer.style.padding = inputStyles.padding;
  }

  fileListContainer.innerHTML = "";

  const hasFiles =
    (existingFiles.length > 0 &&
      existingFiles.some(
        (file) => !removedFileUuids.includes(file.uuidBaseDocument)
      )) ||
    newFiles.length > 0;

  uploadNameInput.style.display = hasFiles ? "none" : "";
  fileListContainer.style.display = hasFiles ? "" : "none";

  existingFiles.forEach((file, index) => {
    if (removedFileUuids.includes(file.uuidBaseDocument)) {
      return;
    }

    const fileItem = document.createElement("span");
    fileItem.className = "file-item";
    fileItem.innerHTML = `
            <span data-file-uuid="${file.uuidBaseDocument}">${file.fileName}</span>
            <button type="button" class="delete-existing-file" data-index="${index}">x</button>
        `;
    fileListContainer.appendChild(fileItem);
  });

  newFiles.forEach((file, index) => {
    const fileItem = document.createElement("span");
    fileItem.className = "file-item";
    fileItem.innerHTML = `
            <span>${file.name}</span>
            <button type="button" class="delete-new-file" data-index="${index}">x</button>
        `;
    fileListContainer.appendChild(fileItem);
  });

  document.querySelectorAll(".delete-existing-file").forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const index = parseInt(this.getAttribute("data-index"));

      const fileUuid = existingFiles[index].uuidBaseDocument;
      if (fileUuid && !removedFileUuids.includes(fileUuid)) {
        removedFileUuids.push(fileUuid);
        updateFileListDisplay();
      }
    });
  });

  document.querySelectorAll(".delete-new-file").forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const index = parseInt(this.getAttribute("data-index"));

      newFiles.splice(index, 1);
      updateFileListDisplay();
    });
  });
}

// <----------------------- Update Records ----------------------->
// Updated update function to handle both existing and new files
async function updateEvent(originalTitle, originalContent, originalLinkUrl) {
  const urlParams = new URLSearchParams(window.location.search);
  const eventUuid = urlParams.get("id");
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken || !eventUuid) {
    console.error("Missing access token or event ID");
    return;
  }

  try {
    const title = document.getElementById("utitle").value;
    const content = document.getElementById("ucontent").value;
    const linkUrl = document.getElementById("urlLink").value;
    const uploadDate = document.getElementById("udate").value || currentDate;

    const fileRemovalPromises = removedFileUuids.map((fileUuid) =>
      removeFile(fileUuid, accessToken)
    );

    if (fileRemovalPromises.length > 0) {
      await Promise.all(fileRemovalPromises);
    }

    const formData = new FormData();

    const boardData = {
      title: title,
      content: content,
      linkUrl: linkUrl,
      uploadDate: uploadDate,
    };

    formData.append(
      "boardData",
      new Blob([JSON.stringify(boardData)], { type: "application/json" })
    );

    newFiles.forEach((file) => {
      formData.append("files", file);
    });

    const updateResponse = await fetch(
      `${API_BASE_URL}api/dbs-bond/admin/event/${eventUuid}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
        mode: "cors",
        credentials: "include",
      }
    );

    if (!updateResponse.ok) {
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

    const updateResult = await updateResponse.json();

    if (updateResult.status === 200) {
      console.log(boardData);
      alert("이벤트가 성공적으로 업데이트되었습니다!");

      removedFileUuids = [];
      newFiles = [];

      window.location.href = "admin_05_04_01_00.html";
    } else {
      alert(`업데이트 실패: ${updateResult.resultMsg}`);
    }
  } catch (error) {
    console.error("Error updating event:", error);
    alert("공지사항 업데이트에 실패했습니다. 다시 시도해주세요.");
  }
}

// Helper function to remove a file
async function removeFile(fileUuid, accessToken) {
  try {
    const response = await fetch(
      `${API_BASE_URL}api/dbs-bond/admin/event/file/${fileUuid}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        mode: "cors",
        credentials: "include",
      }
    );

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

    return await response.json();
  } catch (error) {
    console.error(`Error removing file ${fileUuid}:`, error);
    throw error;
  }
}

// <----------------------- Deleting Events ----------------------->
async function removeEvents() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventUuid = urlParams.get("id");

  $("#btn-spinner-1").show();

  try {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      console.error("No access token retrieved. Cannot update status.");
      return false;
    }

    const apiUrl = `${API_BASE_URL}api/dbs-bond/admin/event/del/${eventUuid}`;

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
      window.location.href = "admin_05_04_01_00.html";
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error updating investment status:", error);
  } finally {
    $("#btn-spinner-1").fadeOut();
  }
}

// <----------------------- Creating Events ----------------------->
async function createEvent() {
  let currentDate = new Date().toISOString().split("T")[0];
  const title = document.getElementById("utitle").value.trim();
  const content = document.getElementById("ucontent").value.trim();
  const linkUrl = document.getElementById("urlLink").value.trim();
  const uploadDate = document.getElementById("udate").value || currentDate;
  const fileInput = document.getElementById("file");

  if (!title || !content || !uploadDate) {
    alert("제목과 내용을 입력해주세요.");
    return;
  }

  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  $("#btn-spinner").show();

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/admin/event/create`;

    const formData = new FormData();

    const dataObj = {
      title: title,
      content: content,
      linkUrl: linkUrl,
      uploadDate: uploadDate,
    };
    console.log("123121321", dataObj);

    formData.append("data", JSON.stringify(dataObj));

    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append("files", selectedFiles[i]);
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      mode: "cors",
      credentials: "include",
      body: formData,
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
      alert("이벤트를 성공적으로 등록했습니다.");
      document.getElementById("utitle").value = "";
      document.getElementById("ucontent").value = "";
      document.getElementById("udate").value = "";
      fileInput.value = "";
      window.location.href = "admin_05_04_01_00.html";
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error creating the event: ", error);
  } finally {
    $("#btn-spinner").fadeOut();
  }
}

let selectedFiles = [];

const currentPath = window.location.pathname;

if (
  currentPath.includes("/admin/admin_05_04_01_01.html") ||
  currentPath.includes("/admin/admin_05_04_01_02.html")
) {
  document.getElementById("file").addEventListener("change", function () {
    if (currentPath.includes("/admin/admin_05_04_01_01.html")) {
      for (let i = 0; i < this.files.length; i++) {
        selectedFiles.push(this.files[i]);
      }

      this.value = "";
      updateFileList();
    } else {
      if (this.files.length > 0) {
        for (let i = 0; i < this.files.length; i++) {
          newFiles.push(this.files[i]);
        }
      }

      updateFileListDisplay();
    }
  });
}

function updateFileList() {
  const uploadNameInput = document.querySelector(".file_box .upload_name");

  let fileListContainer = document.getElementById("file-list-overlay");
  if (!fileListContainer) {
    fileListContainer = document.createElement("div");
    fileListContainer.id = "file-list-overlay";
    fileListContainer.className = "upload_name file-list-overlay";
    uploadNameInput.parentNode.insertBefore(
      fileListContainer,
      uploadNameInput.nextSibling
    );

    const inputStyles = window.getComputedStyle(uploadNameInput);
    fileListContainer.style.width = inputStyles.width;
    fileListContainer.style.height = inputStyles.height;
    fileListContainer.style.padding = inputStyles.padding;
  }

  fileListContainer.innerHTML = "";

  uploadNameInput.style.display = selectedFiles.length > 0 ? "none" : "";
  fileListContainer.style.display = selectedFiles.length > 0 ? "" : "none";

  selectedFiles.forEach((file, index) => {
    const fileItem = document.createElement("span");
    fileItem.className = "file-item";
    fileItem.innerHTML = `
            ${file.name}
            <button type="button" class="delete-file" data-index="${index}">x</button>
        `;
    fileListContainer.appendChild(fileItem);
  });

  document.querySelectorAll(".delete-file").forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const index = parseInt(this.getAttribute("data-index"));
      selectedFiles.splice(index, 1);
      updateFileList();
    });
  });
}
