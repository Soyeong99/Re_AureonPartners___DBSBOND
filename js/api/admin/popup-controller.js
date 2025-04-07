import { API_BASE_URL } from "../config.js";

$(document).ready(function () {
  const tabItems = document.querySelectorAll(".tab_menu ul li");

  tabItems.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabItems.forEach(function (item) {
        item.classList.remove("active");
      });

      this.classList.add("active");

      const tabName = this.textContent.trim();
      if (tabName == "팝업 관리") {
        fetchPopupData();
      }
    });
  });

  const tabMenuItems = document.querySelectorAll(".tab_menu li");
  const manageButton = document.querySelector(".btn_manage .manage");
  const saveButton = document.querySelector(".btn_manage .save");

  tabMenuItems.forEach((tab) => {
    tab.addEventListener("click", function () {
      if (this.textContent.trim() === "목록") {
        manageButton.style.display = "block";
        saveButton.style.display = "none";
      }
    });
  });

  manageButton.addEventListener("click", function () {
    manageButton.style.display = "none";
    saveButton.style.display = "block";
  });

  saveButton.addEventListener("click", function () {
    saveButton.style.display = "none";
    manageButton.style.display = "block";
  });
});

// Main function to handle popup data
async function fetchPopupData() {
  try {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      console.error("No access token retrieved. Cannot fetch data.");
      return;
    }

    let apiUrl = `${API_BASE_URL}api/dbs-bond/admin/popup/list?page=0&size=30`;

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
    populatePopupContainer(data);
  } catch (error) {
    console.error("Error fetching popup data:", error);
  } finally {
    //hideLoading();
  }
}

// Function to populate the popup container
function populatePopupContainer(data) {
  const popupContainer = document.getElementById("popup-container");
  popupContainer.innerHTML = "";

  const sortedData =
    data?.data?.content?.sort(
      (a, b) => new Date(a.regDate) - new Date(b.regDate)
    ) || [];

  const totalPopups = 8;

  for (let i = 0; i < totalPopups; i++) {
    const popupData = sortedData[i] || null;
    const popupElement = createPopupElement(i, popupData);
    popupContainer.appendChild(popupElement);
  }

  const saveButton = document.querySelector(".btn_manage .save");
  saveButton.addEventListener("click", function () {
    const popupData = collectPopupData();
    savePopupData(popupData);
  });
}

// Update the template cloning function
function createPopupElement(index, data) {
  const template = document.getElementById("popup-template");
  const popupClone = document
    .importNode(template.content, true)
    .querySelector(".pop_list_area");

  popupClone.setAttribute("data-popup-index", index);
  popupClone.querySelector(".idx span").textContent = index + 1;

  const useCheckbox = popupClone.querySelector(".use-checkbox");
  const notUseCheckbox = popupClone.querySelector(".not-use-checkbox");
  useCheckbox.id = `use-${index}`;
  notUseCheckbox.id = `not_use-${index}`;

  popupClone
    .querySelector('label[for="use"]')
    .setAttribute("for", `use-${index}`);
  popupClone
    .querySelector('label[for="not_use"]')
    .setAttribute("for", `not_use-${index}`);

  const fileInput = popupClone.querySelector('input[type="file"]');
  const fileLabel = popupClone.querySelector(".file_area label");
  fileInput.id = `file-${index}`;
  fileLabel.setAttribute("for", `file-${index}`);

  const urlInput = popupClone.querySelector(".url_area input");
  urlInput.id = `url-${index}`;
  popupClone
    .querySelector(".url_area label")
    .setAttribute("for", `url-${index}`);

  const fileDisplay = popupClone.querySelector(".file_area .upload_name");

  const imgArea = popupClone.querySelector(".img_area");

  if (data && data.baseImageUrlVo) {
    if (data.isActive) {
      useCheckbox.checked = true;
    } else {
      notUseCheckbox.checked = true;
    }

    const img = document.createElement("img");
    img.src = data.baseImageUrlVo.originalUrl;
    img.alt = "Popup image";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    imgArea.appendChild(img);

    createFileContainer(fileDisplay, data.baseImageUrlVo.originalUrl, imgArea);

    if (data.popupUrl) {
      popupClone.querySelector(".url_area .upload_name").value = data.popupUrl;
    }

    if (data.popupUuid) {
      popupClone.setAttribute("data-popup-uuid", data.popupUuid);
    }

    if (data.popupImageUuid) {
      popupClone.setAttribute("data-popup-image-uuid", data.popupImageUuid);
    }
  } else {
    notUseCheckbox.checked = true;
    createFileContainer(fileDisplay, "", imgArea, true);
  }

  setupEventListeners(popupClone, index);
  return popupClone;
}

// Helper function to create the file container
function createFileContainer(fileDisplay, imageUrl, imgArea, isEmpty = false) {
  const fileContainer = document.createElement("div");
  fileContainer.className = "file-wrapper";

  let fileName = isEmpty ? "" : "이미지 링크.png";

  fileContainer.innerHTML = `
        <div class="file-container">
            <div class="link-container">
                <span class="link-text">${fileName}</span>
                <span class="remove-button">×</span>
            </div>
        </div>
    `;

  const linkText = fileContainer.querySelector(".link-text");
  const removeButton = fileContainer.querySelector(".remove-button");

  if (!isEmpty) {
    linkText.addEventListener("click", () => {
      window.open(imageUrl, "_blank");
    });

    fileDisplay.style.display = "none";
  } else {
    fileContainer.style.display = "none";
    fileDisplay.style.display = "block";
  }

  removeButton.addEventListener("click", (e) => {
    e.stopPropagation();
    imgArea.innerHTML = "";
    fileDisplay.value = "";
    fileContainer.style.display = "none";
    fileDisplay.style.display = "block";
  });

  fileDisplay.parentNode.appendChild(fileContainer);
}

// Set up event listeners for a popup element
function setupEventListeners(popupElement, index) {
  const fileInput = popupElement.querySelector(`#file-${index}`);
  const fileDisplay = popupElement.querySelector(".file_area .upload_name");
  const fileContainer = popupElement.querySelector(".file-wrapper");

  fileInput.addEventListener("change", function () {
    if (this.files && this.files[0]) {
      const fileName = this.files[0].name;
      fileDisplay.value = fileName;

      const reader = new FileReader();
      reader.onload = function (e) {
        const imgArea = popupElement.querySelector(".img_area");
        imgArea.innerHTML = "";
        const img = document.createElement("img");
        img.src = e.target.result;
        img.alt = "Popup preview";
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        imgArea.appendChild(img);

        const linkText = fileContainer.querySelector(".link-text");
        linkText.textContent = fileName;
        fileContainer.style.display = "block";
        fileDisplay.style.display = "none";
      };
      reader.readAsDataURL(this.files[0]);
    }
  });

  const deleteBtn = popupElement.querySelector(".del_pop");
  deleteBtn.addEventListener("click", function () {
    resetPopup(popupElement);
  });

  const useCheckbox = popupElement.querySelector(`#use-${index}`);
  const notUseCheckbox = popupElement.querySelector(`#not_use-${index}`);

  useCheckbox.addEventListener("change", function () {
    if (this.checked) {
      notUseCheckbox.checked = false;
    }
  });

  notUseCheckbox.addEventListener("change", function () {
    if (this.checked) {
      useCheckbox.checked = false;
    }
  });
}

let removeUuids = [];

function resetPopup(popupElement) {
  const popupUuid = popupElement.getAttribute("data-popup-uuid");
  const popupImageUuid = popupElement.getAttribute("data-popup-image-uuid");

  if (popupUuid) {
    const pair = {
      popupId: popupUuid,
      imageId: popupImageUuid,
    };
    removeUuids.push(pair);
  }

  const imgArea = popupElement.querySelector(".img_area");
  imgArea.innerHTML = "";

  const fileDisplay = popupElement.querySelector(".file_area .upload_name");
  fileDisplay.value = "";
  fileDisplay.style.display = "block";

  const fileContainer = popupElement.querySelector(".file-wrapper");
  if (fileContainer) {
    fileContainer.style.display = "none";
  }

  popupElement.querySelector(".url_area .upload_name").value = "";

  popupElement.removeAttribute("data-popup-uuid");
  popupElement.removeAttribute("data-popup-image-uuid");
  popupElement.querySelector('input[id^="use-"]').checked = false;
  popupElement.querySelector('input[id^="not_use-"]').checked = true;

  const fileInput = popupElement.querySelector(".file-input");
  if (fileInput) {
    fileInput.value = "";
  }
}

// Function to collect data from all popup areas
function collectPopupData() {
  const popups = document.querySelectorAll(".pop_list_area");
  const popupData = [];

  popups.forEach((popup) => {
    console.log("POPUP", popup);
    const popupUuid = popup.getAttribute("data-popup-uuid");
    const popupImageUuid = popup.getAttribute("data-popup-image-uuid");
    const isActive = popup.querySelector('input[id^="use"]').checked;
    const popupUrl =
      popup.querySelector(".url_area .upload_name").value || null;
    const index = popup.getAttribute("data-popup-index");
    const fileInput = popup.querySelector(`#file-${index}`);
    const hasNewFile =
      fileInput && fileInput.files && fileInput.files.length > 0;
    const hasImage = popup.querySelector(".img_area img") !== null;

    if (popupUuid || popupImageUuid || popupUrl || hasNewFile || hasImage) {
      const popupItem = {
        popupUuid,
        popupImageUuid,
        isActive,
        popupUrl,
      };

      if (hasNewFile) {
        popupItem.newFile = fileInput.files[0];
      }

      popupData.push(popupItem);
    }
  });

  return popupData;
}

async function removePopupData(popupData) {
  try {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      console.error("No access token retrieved. Cannot remove data.");
      return;
    }

    const popupUuid = popupData.popupId;
    const popupImageUuid = popupData.imageId;

    if (!popupUuid) {
      console.error("Popup UUID is missing. Cannot proceed with deletion.");
      return;
    }

    const popupDeleteResponse = await fetch(
      `${API_BASE_URL}api/dbs-bond/admin/popup/${popupUuid}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!popupDeleteResponse.ok) {
      console.error(
        "Failed to delete popup:",
        await popupDeleteResponse.text()
      );
      return;
    }

    if (popupImageUuid) {
      const imageDeleteResponse = await fetch(
        `${API_BASE_URL}api/dbs-bond/admin/popup/images`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify([popupImageUuid]),
        }
      );

      if (!imageDeleteResponse.ok) {
        console.error(
          "Failed to delete popup image:",
          await imageDeleteResponse.text()
        );
        return;
      }
    }
    location.reload();
  } catch (error) {
    console.error("Error removing popup data:", error);
  }
}

// Function to save popup data
async function savePopupData(popupData) {
  removeUuids.forEach(async (popupData) => {
    await removePopupData(popupData);
  });

  try {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      console.error("No access token retrieved. Cannot save data.");
      return;
    }

    const newPopups = [];
    const existingPopups = [];

    popupData.forEach((popup) => {
      if (popup.popupUuid) {
        existingPopups.push(popup);
      } else {
        newPopups.push(popup);
      }
    });

    if (existingPopups.length > 0) {
      await fetch(`${API_BASE_URL}api/dbs-bond/admin/popup/batch-update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ popups: existingPopups }),
      });
    }

    for (const popup of newPopups) {
      let popupImageUuid = null;

      if (!popup.newFile) {
        setTimeout(() => {
          alert("이미지가 누락된 항목이 있습니다. 건너뜁니다..");
        }, 500);
        continue;
      }

      if (popup.newFile) {
        const formData = new FormData();
        formData.append("image", popup.newFile);

        const uploadResponse = await fetch(
          `${API_BASE_URL}api/dbs-bond/admin/popup/upload-image`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            body: formData,
            mode: "cors",
          }
        );

        if (uploadResponse.status === 201) {
          const uploadResult = await uploadResponse.json();
          popupImageUuid = uploadResult.data.uuidBaseImage;
        } else {
          console.error("Image upload failed:", await uploadResponse.text());
          continue;
        }
      }

      const formData = new FormData();

      const requestDto = {
        popupImageUuid: popupImageUuid || null,
        isActive: popup.isActive,
        popupUrl: popup.popupUrl || "",
      };

      formData.append("requestDto", JSON.stringify(requestDto));

      await fetch(`${API_BASE_URL}api/dbs-bond/admin/popup`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
        mode: "cors",
      });
    }
    location.reload();
  } catch (error) {
    console.error("Error saving popup data:", error);
  }
}
