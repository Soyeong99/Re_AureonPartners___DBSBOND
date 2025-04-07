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

  if (currentPath.includes("/admin/admin_05_05_02.html")) {
    displayClickedNotice();
  } else {
    fetchNotices();
  }

  $("#submit-create").on("click", function () {
    sendNotice();
  });

  $("#submit-update").on("click", function () {
    const originalTitle = document.getElementById("utitle").value;
    const originalContent = document.getElementById("ucontent").value;
    const originalLinkUrl = document.getElementById("urlLink").value;
    updateNotice(originalTitle, originalContent, originalLinkUrl);
  });

  $("#delete-notice").on("click", function () {
    removeNotice();
  });

  // Handle pagination clicks
  $(document).on("click", ".page-number", function (e) {
    e.preventDefault();
    currentPage = parseInt($(this).data("page"));
    fetchNotices();
  });

  $(document).on("click", ".prev", function (e) {
    e.preventDefault();
    if (currentPage > 0) {
      currentPage--;
      fetchNotices();
    }
  });

  $(document).on("click", ".next", function (e) {
    e.preventDefault();
    if (currentPage < totalPages - 1) {
      currentPage++;
      fetchNotices();
    }
  });
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
    console.error("Error fetching inquiry accounts:", error);
  } finally {
    $("#loading-screen").fadeOut();
  }
}

// Function to populate the notice table
function populateNoticeTable(notices) {
  const tableBody = $("table tbody");
  tableBody.empty();

  const offset = currentPage * pageSize;
  let counter = offset + 1;

  notices.forEach((notice) => {
    const row = `
              <tr class="clickable-row" style="cursor: pointer;" data-href="admin_05_05_02.html?id=${
                notice.uuidBaseBoard
              }">
                  <td>${counter++}</td>
                  <td class="data-content">${notice.title}</td>
                  <td>${formatDate(notice.uploadDate)}</td>
              </tr>
          `;
    tableBody.append(row);
  });

  // 전체 tr 클릭 이벤트 연결
  document.querySelectorAll(".clickable-row").forEach((row) => {
    row.addEventListener("click", function () {
      window.location.href = this.dataset.href;
    });
  });
}

function paginateAndDisplay(data) {
  populateNoticeTable(data);
  generatePagination(currentPage, totalPages);
}

// <----------------------- Retrieving Clicked Notice ----------------------->
async function displayClickedNotice() {
  const urlParams = new URLSearchParams(window.location.search);
  const uuidInquiry = urlParams.get("id");
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/common/notice/${uuidInquiry}`;

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
async function updateNotice(originalTitle, originalContent, originalLinkUrl) {
  const urlParams = new URLSearchParams(window.location.search);
  const noticeUuid = urlParams.get("id");
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken || !noticeUuid) {
    console.error("Missing access token or notice ID");
    return;
  }

  try {
    const title = document.getElementById("utitle").value.trim();
    const content = document.getElementById("ucontent").value.trim();
    const linkUrl = document.getElementById("urlLink").value.trim();
    const uploadDate = document.getElementById("udate").value;

    const fileRemovalPromises = removedFileUuids.map((fileUuid) =>
      removeFile(fileUuid, accessToken)
    );

    if (fileRemovalPromises.length > 0) {
      await Promise.all(fileRemovalPromises);
    }

    console.log("Original title:", originalTitle);
    console.log("New title:", title);
    console.log("Equal?", title === originalTitle);

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
      `${API_BASE_URL}api/dbs-bond/admin/notice/${noticeUuid}`,
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
      alert("공지사항이 성공적으로 업데이트되었습니다!");

      removedFileUuids = [];
      newFiles = [];

      window.location.href = "admin_05_05_00.html";
    } else {
      alert(`업데이트 실패: ${updateResult.resultMsg}`);
    }
  } catch (error) {
    console.error("Error updating notice:", error);
    alert("공지사항 업데이트에 실패했습니다. 다시 시도해주세요.");
  }
}

// Helper function to remove a file
async function removeFile(fileUuid, accessToken) {
  try {
    const response = await fetch(
      `${API_BASE_URL}api/dbs-bond/admin/notice/file/${fileUuid}`,
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

// <----------------------- Deleting Notice ----------------------->
async function removeNotice() {
  const urlParams = new URLSearchParams(window.location.search);
  const noticeUuid = urlParams.get("id");

  $("#btn-spinner-1").show();

  try {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      console.error("No access token retrieved. Cannot update status.");
      return false;
    }

    const apiUrl = `${API_BASE_URL}api/dbs-bond/admin/notice/del/${noticeUuid}`;

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
      window.location.href = "admin_05_05_00.html";
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error updating investment status:", error);
  } finally {
    $("#btn-spinner-1").fadeOut();
  }
}

// <----------------------- Creating Notice ----------------------->
async function sendNotice() {
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
    let apiUrl = `${API_BASE_URL}api/dbs-bond/admin/notice/create`;

    const formData = new FormData();

    const dataObj = {
      title: title,
      content: content,
      linkUrl: linkUrl,
      uploadDate: uploadDate,
    };

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
      alert("공지사항을 성공적으로 생성했습니다.");
      document.getElementById("utitle").value = "";
      document.getElementById("ucontent").value = "";
      document.getElementById("udate").value = "";
      fileInput.value = "";
      window.location.href = "admin_05_05_00.html";
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error creating the notice: ", error);
  } finally {
    $("#btn-spinner").fadeOut();
  }
}

let selectedFiles = [];

const currentPath = window.location.pathname;

if (
  currentPath.includes("/admin/admin_05_05_01.html") ||
  currentPath.includes("/admin/admin_05_05_02.html")
) {
  document.getElementById("file").addEventListener("change", function () {
    if (currentPath.includes("/admin/admin_05_05_01.html")) {
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
