document.addEventListener("DOMContentLoaded", function () {
  
  $('button.btn_submit').click(function () {
    $('.ctf_num').stop().fadeIn();
  });

  // --------- 
  //  Main (Home)
  // ---------   

  //회사 슬라이드
  const slide_box = new Swiper(".slide_box", {

    centeredSlides: true,
    autoHeight: true,
    loop: true,
    clickable: true,

    autoplay: {
      delay: 1500,
      disableOnIneraction: false,
    },

    speed: 1500,
    slidesPerView: 1, //모바일 기준
    spaceBetween: 20, //모바일 기준

  });

  // event 모달팝업 생성
  $(function () {
    $('.popup').fadeIn();

    $('.popup-btn').click(function () {
      $('.popup').fadeOut();
    });
  });

  var swiper = new Swiper(".mySwiper", {
    loop: true,
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
  });

  // --------- 
  //  SUB
  // ---------   

  //회사 소개 -연혁 슬라이드
  const history_con = new Swiper(".history_con", {

    autoHeight: true,
    loop: true,
    clickable: true,
    loopAdditionalSlides: 1,

    autoplay: {
      delay: 1000,
      disableOnIneraction: false,
    },

    speed: 1500,
    slidesPerView: 1, //모바일 기준

    breakpoints: {
      450: { //min-width 기준
        slidesPerView: 2,
        spaceBetween: 10,
      },
      650: { //min-width 기준
        slidesPerView: 3,
        spaceBetween: 10,
      },
      1200: { //min-width 기준
        slidesPerView: 4,
        spaceBetween: 10,
      },
    },

  });

  //  계좌 번호 복사시  모달창
  $(".copy_pop").hide();
  $("ul.box_area li > .flex > button.copy_btn").click(function () {
    $(".copy_pop").stop().fadeIn(

      setTimeout(function () {
        testEle = $('.copy_pop');
        testEle.fadeOut();
      }, 1000))
  })

  //  상품 구매 시 모달창
  $(".modal_pop").hide();

  $(".apply-btn").click(function () {
    $(".modal_pop").stop().fadeIn();
  })
  $(".btn > .del_pop").click(function () {
    $(".modal_pop").stop().fadeOut();
  })

  // 이자율 계산 모달창
  $(".pop_btn").click(function () {
    $(".modal_wrap").stop().fadeIn()
  })
  $(".btn_area button").click(function () {
    $(".modal_wrap").stop().fadeOut()
  })

  //  결제 완료시 모달창
  $(".success_pop").hide();

  $(".btn > .complete").click(function () {
    $(".success_pop").stop().fadeIn();
  })
  $(".okay").click(function () {
    $(".success_pop, .modal_pop").stop().fadeOut();
  })

  //  계좌 번호 복사시  모달창
  $(".copy_pop").hide();
  $("ul.box_area li > .flex > button.copy_btn").click(function () {
    $(".copy_pop").stop().fadeIn(

      setTimeout(function () {
        testEle = $('.copy_pop');
        testEle.fadeOut();
      }, 1000))
  })

  // 전체동의
  const agreeAllCheckbox = document.querySelector(".agree_all");
  const agreeItemCheckboxes = document.querySelectorAll(".agree_item");
  const selectAllMktCheckbox = document.querySelector(".select_all_mkt");
  const mktItemCheckboxes = document.querySelectorAll(".mkt_item");

  // 전체 동의 체크박스 클릭 시
  agreeAllCheckbox.addEventListener("change", function () {
    agreeItemCheckboxes.forEach(checkbox => {
      checkbox.checked = agreeAllCheckbox.checked;
    });
    selectAllMktCheckbox.checked = agreeAllCheckbox.checked;
    mktItemCheckboxes.forEach(checkbox => {
      checkbox.checked = agreeAllCheckbox.checked;
    });
  });

  // 개별 체크박스 클릭 시
  agreeItemCheckboxes.forEach(checkbox => {
    checkbox.addEventListener("change", function () {
      agreeAllCheckbox.checked = Array.from(agreeItemCheckboxes).every(item => item.checked) &&
        Array.from(mktItemCheckboxes).every(item => item.checked);
    });
  });

  // 선택적 마케팅 동의 전체 체크박스 클릭 시
  selectAllMktCheckbox.addEventListener("change", function () {
    mktItemCheckboxes.forEach(checkbox => {
      checkbox.checked = selectAllMktCheckbox.checked;
    });
    agreeAllCheckbox.checked = Array.from(agreeItemCheckboxes).every(item => item.checked) &&
      Array.from(mktItemCheckboxes).every(item => item.checked);
  });

  // 개별 마케팅 체크박스 클릭 시
  mktItemCheckboxes.forEach(checkbox => {
    checkbox.addEventListener("change", function () {
      selectAllMktCheckbox.checked = Array.from(mktItemCheckboxes).some(item => item.checked);
      agreeAllCheckbox.checked = Array.from(agreeItemCheckboxes).every(item => item.checked) &&
        Array.from(mktItemCheckboxes).every(item => item.checked);
    });
  });

  // 투자전략 페이지 
  // - 상단 텍스트 애니메이션 글자 / 한글자씩 떨어지게 - 특정 굵게
  var typingIdx = 0;
  var typingSpeed = 130; // 타이핑 속도 (ms)
  var delayBeforeFade = 1000; // 타이핑이 끝난 후 유지 시간 (1초)
  var fadeSpeed = 500; // fade 효과 속도 (0.5초)
  var delayBeforeRestart = 500; // 삭제 후 다시 시작하기 전 대기 시간 (0.5초)
  var typingTimer;

  function getTypingText() {
    return window.innerWidth <= 768
      ? "당신의 성공을 꿈꾸세요<br>Dream Your Success"
      : "당신의 성공을 꿈꾸세요 Dream Your Success";
  }

  function formatText(text) {
    return text.replace(/<br>/g, "¶") // 줄바꿈을 특수문자로 변경
      .split("") // 한 글자씩 나누기_ 
      // split("/?=<br>/")로 처리하면 한글자씩 나타나는 효과가 나타나지 않게 됨 
      // - <br>의 기능 삭제 == 하나의 텍스트로 인식 
      .map(char => {
        if (char === "¶") return "<br>"; // 다시 <br> 기능 살리기
        return (char === "D" || char === "Y" || char === "S")
          ? `<span class="bold">${char}</span>`
          : char;
      });
  }

  var typingTxt = getTypingText();
  var formattedTxt = formatText(typingTxt);

  function typing() {
    if (typingIdx < formattedTxt.length) {
      $(".typing").html(formattedTxt.slice(0, typingIdx + 1).join(""));
      typingIdx++;
      typingTimer = setTimeout(typing, typingSpeed);
    } else {
      setTimeout(() => {
        $(".typing").fadeOut(fadeSpeed, function () {
          $(this).empty().fadeIn(0);
          typingIdx = 0;
          setTimeout(typing, delayBeforeRestart);
        });
      }, delayBeforeFade);
    }
  }

  // 초기 실행
  $(".typing").empty();
  typing();

  // 화면 크기 변경 시 타이핑 효과 초기화
  $(window).resize(function () {
    clearTimeout(typingTimer); // 기존 타이머 초기화
    typingIdx = 0;
    typingTxt = getTypingText();
    formattedTxt = formatText(typingTxt);
    $(".typing").empty();
    typing();
  });


});