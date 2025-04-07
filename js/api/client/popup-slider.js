import { API_BASE_URL } from "../config.js";

let currentSlide = 0;
let slides = [];

async function fetchPopupImages() {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  try {
    const apiUrl = `${API_BASE_URL}api/dbs-bond/member/popup/list?page=0&size=30`;
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

    const result = await response.json();

    const container = document.getElementById("popupSlidesContainer");
    const content = result.data?.content || [];

    if (content.length === 0) {
      closePopup();
      return;
    }

    content.forEach((item, index) => {
      const originalUrl = item.baseImageUrlVo.originalUrl;
      const resizedUrl = item.baseImageUrlVo.resizedUrl || originalUrl; // fallback
      const linkUrl = item.popupUrl;

      const slide = document.createElement("div");
      slide.className = "slide" + (index === 0 ? " active" : "");

      const img = document.createElement("img");
      img.src = resizedUrl;
      img.alt = `popup-${index}`;
      img.loading = "lazy"; // 성능 개선
      img.style.maxWidth = "100%";
      img.style.maxHeight = "100%";
      img.style.objectFit = "contain";

      // ✅ 고화질 이미지 로드되면 교체
      const highResImg = new Image();
      highResImg.src = originalUrl;
      highResImg.onload = () => {
        img.src = originalUrl;
      };

      const isValidLink = linkUrl && /^https?:\/\//.test(linkUrl);
      if (isValidLink) {
        const anchor = document.createElement("a");
        anchor.href = linkUrl;
        anchor.target = "_blank";
        anchor.appendChild(img);
        slide.appendChild(anchor);
      } else {
        slide.appendChild(img);
      }

      container.appendChild(slide);
    });

    slides = document.querySelectorAll(".slide");

    // ✅ 팝업 열기 처리
    document.getElementById("eventPopup").style.display = "block";
    document.getElementById("popupOverlay").style.display = "block";
    document.body.classList.add("popup-open");
  } catch (error) {
    console.error("팝업 이미지 로딩 실패:", error);
    closePopup();
  }
}

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === index);
  });
}

function changeSlide(direction) {
  if (slides.length === 0) return;
  currentSlide = (currentSlide + direction + slides.length) % slides.length;
  showSlide(currentSlide);
}

function closePopup() {
  document.getElementById("eventPopup").style.display = "none";
  document.getElementById("popupOverlay").style.display = "none";
  document.body.classList.remove("popup-open");
}

function doNotShowToday() {
  const today = new Date();
  const expire = new Date(today);
  expire.setHours(23, 59, 59, 999);
  document.cookie = "hideEventPopup=true; expires=" + expire.toUTCString();
  closePopup();
}

function shouldShowPopup() {
  return !document.cookie.includes("hideEventPopup=true");
}

window.addEventListener("load", () => {
  if (!shouldShowPopup()) {
    closePopup();
  } else {
    fetchPopupImages();
  }

  document
    .getElementById("popupPrevBtn")
    ?.addEventListener("click", () => changeSlide(-1));
  document
    .getElementById("popupNextBtn")
    ?.addEventListener("click", () => changeSlide(1));
  document
    .getElementById("popupCloseBtn")
    ?.addEventListener("click", closePopup);
  document
    .getElementById("popupDoNotShowBtn")
    ?.addEventListener("click", doNotShowToday);
});
