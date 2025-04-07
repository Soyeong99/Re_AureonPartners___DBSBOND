import { API_BASE_URL } from "../config.js";

document.addEventListener("DOMContentLoaded", () => {
  const uuid = getUuidFromUrl();
  if (uuid) {
    // ✅ 상세 조회 모드
    loadEventDetail(uuid);
  } else {
    // ✅ 목록 조회 모드
    loadEventList();
  }
});

function getUuidFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("uuid");
}

async function loadEventList() {
  const eventList = document.querySelector(".evt_line");
  const eventNotice = document.getElementById("event_notice");

  try {
    const events = await fetchEventList();
    if (!events || events.length === 0) {
      showEventNotice(eventNotice);
      return;
    }

    renderEventItems(events, eventList);
  } catch (err) {
    console.error("이벤트 목록 불러오기 실패:", err);
    showEventNotice(eventNotice);
  }
}

async function fetchEventList() {
  const accessToken = localStorage.getItem("accessToken");

  const response = await fetch(
    `${API_BASE_URL}api/dbs-bond/common/event?page=0&size=30`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
      },
    }
  );

  const result = await response.json();
  return result?.data?.content || [];
}

function renderEventItems(events, container) {
  events.forEach((event) => {
    const div = document.createElement("div");
    div.className = "evt_container";
    const imageUrl = event?.files[0]?.fileUrl;
    const title = event?.title || "이벤트";
    const startDate = event?.uploadDate || "";
    const uuid = event?.uuidBaseBoard || "";
    const url = `sub_04_01.html?uuid=${encodeURIComponent(uuid)}`;

    div.innerHTML = `
      ${imageUrl ? `
        <div class="evt_img">
          <img src="${imageUrl}" alt="${title}" />
        </div>
      ` : `
        <div class="evt_img">
          <div class="evt_img_default">
          </div>
        </div>
      `}
      <p>${title}</p>
      <p>${startDate}</p>
    `;

    div.style.cursor = "pointer";
    div.addEventListener("click", () => {
      window.location.href = url;
    });

    container.appendChild(div);
  });
}

function showEventNotice(noticeElement) {
  if (noticeElement) {
    noticeElement.style.display = "block";
  }
}

async function loadEventDetail(uuid) {
  const detailBox = document.querySelector(".out_notion_txt");

  try {
    const data = await fetchEventDetail(uuid);
    renderEventDetail(data, detailBox);
  } catch (err) {
    console.error("이벤트 상세 조회 실패:", err);
    if (detailBox) {
      detailBox.innerHTML = "<p>이벤트 상세 정보를 불러오지 못했습니다.</p>";
    }
  }
}

async function fetchEventDetail(uuid) {
  const accessToken = localStorage.getItem("accessToken");

  const response = await fetch(
    `${API_BASE_URL}api/dbs-bond/common/event/${uuid}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
      },
    }
  );

  const result = await response.json();
  return result?.data;
}

function renderEventDetail(data, container) {
  const title = data?.title || "이벤트";
  const content = data?.content || "";
  const uploadDate = data?.uploadDate || "";
  const files = data?.files || [];

  // ✅ 배너 이미지 교체 (첫 번째 이미지 기준)
  const bannerImg = document.querySelector(".evnet_banner img");
  if (bannerImg && files.length > 0) {
    bannerImg.src = files[0].fileUrl;
    bannerImg.alt = title;
  }

  // ✅ 본문 내용 + 이미지들 렌더링
  let imagesHtml = "";
  files.forEach((file) => {
    if (file?.fileUrl) {
      imagesHtml += `<img src="${file.fileUrl}" alt="${title}" style="max-width: 100%; margin-top: 1rem;" />`;
    }
  });

  container.innerHTML = `  
      <div>${content}</div>
    `;
}
