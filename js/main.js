document.addEventListener("DOMContentLoaded", function () {
  
  // ✅ Swiper 초기화 (라이브러리 확인 후 실행)
  if (typeof Swiper !== "undefined") {
    new Swiper(".slide_box", {
      centeredSlides: true,
      autoHeight: true,
      loop: true,
      clickable: true,
      autoplay: { delay: 1500, disableOnInteraction: false },
      speed: 1500,
      slidesPerView: 1,
      spaceBetween: 20,
    });

    new Swiper(".history_con", {
      autoHeight: true,
      loop: true,
      clickable: true,
      autoplay: { delay: 1000, disableOnInteraction: false },
      speed: 1500,
      slidesPerView: 1,
      breakpoints: {
        450: { slidesPerView: 2, spaceBetween: 10 },
        650: { slidesPerView: 3, spaceBetween: 10 },
        1200: { slidesPerView: 4, spaceBetween: 10 },
      },
    });
  }

  // ✅ 모달 show/hide 함수
  function showModal(element) {
    if (element) {
      element.style.display = "block";
      setTimeout(() => (element.style.opacity = "1"), 10);
    }
  }

  function hideModal(element) {
    if (element) {
      element.style.opacity = "0";
      setTimeout(() => (element.style.display = "none"), 500);
    }
  }

// ✅ 인증하기 모달
const btnSubmits = document.querySelectorAll(".btn_submit");
const modal = document.querySelector(".ctf_num");
const modalContent = modal?.querySelector("dl");

if (btnSubmits.length > 0 && modal && modalContent) {
  btnSubmits.forEach((btnSubmit) => {
    btnSubmit.addEventListener("click", function () {
      // const rect = btnSubmit.getBoundingClientRect();
      // modalContent.style.top = `${rect.bottom + window.scrollY + 10}px`;
      // modalContent.style.left = "50%";
      // modalContent.style.transform = "translateX(-50%)";
      modal.style.display = "block";
    });
  });
}

  // ✅ 이벤트 모달 팝업
  document.querySelectorAll(".popup-btn").forEach(btn => {
    btn.addEventListener("click", function () {
      const popup = document.querySelector(".popup");
      if (popup) hideModal(popup);
    });
  });

  // ✅ jQuery가 있는 경우만 실행 (계좌번호 복사 모달 등)
  if (window.jQuery) {
    $(".copy_pop").hide();
    $("ul.box_area").on("click", "button.copy_btn", function () {
      $(".copy_pop").stop().fadeIn();
      setTimeout(() => $(".copy_pop").fadeOut(), 1000);
    });

    $(".modal_pop").hide();
    $(".apply-btn").click(() => showModal($(".modal_pop")[0]));
    $(".btn > .del_pop").click(() => hideModal($(".modal_pop")[0]));

    $(".pop_btn").click(() => showModal($(".modal_wrap")[0]));
    $(".btn_area button").click(() => hideModal($(".modal_wrap")[0]));

    $(".success_pop").hide();
    $(".btn > .complete").click(() => showModal($(".success_pop")[0]));
    $(".okay").click(() => $(".success_pop, .modal_pop").stop().fadeOut());
  }

  // ✅ 전체동의 체크박스
  const agreeAllCheckbox = document.querySelector("#agree_all");
  const agreeItems = document.querySelectorAll(".agree_item");

  if (agreeAllCheckbox && agreeItems.length > 0) {
    agreeAllCheckbox.addEventListener("change", function () {
      agreeItems.forEach(checkbox => (checkbox.checked = agreeAllCheckbox.checked));
    });

    agreeItems.forEach(checkbox => {
      checkbox.addEventListener("change", function () {
        agreeAllCheckbox.checked = [...agreeItems].every(item => item.checked);
      });
    });
  }

  // ✅ 타이핑 애니메이션
  let typingIdx = 0;
  const typingSpeed = 130;
  const delayBeforeFade = 1000;
  const fadeSpeed = 500;
  const delayBeforeRestart = 500;
  let typingTimer;
  let isTyping = false;

  function getTypingText() {
    return window.innerWidth <= 768
      ? "당신의 성공을 꿈꾸세요<br>Dream Your Success"
      : "당신의 성공을 꿈꾸세요 Dream Your Success";
  }

  function formatText(text) {
    return text.replace(/<br>/g, "¶").split("").map(char => {
      if (char === "¶") return "<br>";
      return (char === "D" || char === "Y" || char === "S") ? `<span class="bold">${char}</span>` : char;
    });
  }

  function startTypingAnimation() {
    const typingElement = document.querySelector(".typing");
    if (!typingElement || isTyping) return; // 요소 없으면 실행 X

    isTyping = true;
    let typingTxt = getTypingText();
    let formattedTxt = formatText(typingTxt);
    typingIdx = 0;

    function typing() {
      if (typingIdx < formattedTxt.length) {
        typingElement.innerHTML = formattedTxt.slice(0, typingIdx + 1).join("");
        typingIdx++;
        typingTimer = setTimeout(typing, typingSpeed);
      } else {
        setTimeout(() => {
          typingElement.style.opacity = "0";
          setTimeout(() => {
            typingElement.innerHTML = "";
            typingElement.style.opacity = "1";
            isTyping = false;
            startTypingAnimation();
          }, delayBeforeRestart);
        }, delayBeforeFade);
      }
    }

    typingElement.innerHTML = "";
    typing();
  }

  const typingElement = document.querySelector(".typing");
  if (typingElement) {
    startTypingAnimation();
    window.addEventListener("resize", function () {
      clearTimeout(typingTimer);
      isTyping = false;
      startTypingAnimation();
    });
  }
});
