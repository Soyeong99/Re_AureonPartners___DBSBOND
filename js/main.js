$(function () {

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

  // --------- 
  //  SUB
  // ---------   

  //회사 소개 -연혁 슬라이드

  // 스와이퍼 찾기

  const history_con = new Swiper(".history_con", {

    // initialSlide: 2,
    // centeredSlides: false,
    autoHeight: true,
    loop: true,
    clickable: true,
    loopAdditionalSlides: 1,

    autoplay: {
      delay: 1000,
      disableOnIneraction: false,
    },

    speed: 1500,
    slidesPerView: 4, //모바일 기준
  });

  // --------- 
  //  Sub Page
  // ---------   

  // 투자전략 페이지 - 상단 텍스트 애니메이션 글자 / 한글자씩 떨어지게 - 특정 굵게
  var typingIdx = 0;
  var typingSpeed = 100; // 타이핑 속도 (ms)
  var delayBeforeFade = 1000; // 타이핑이 끝난 후 유지 시간 (1초)
  var fadeSpeed = 500; // fade 효과 속도 (0.5초)
  var delayBeforeRestart = 500; // 삭제 후 다시 시작하기 전 대기 시간 (0.5초)

  // 텍스트를 한 글자씩 나누면서 특정 글자는 <span class="bold">로 감싸기
  var typingTxt = "당신의 성공을 꿈꾸세요 Dream Your Success";
  var formattedTxt = typingTxt.split("").map(char => {
    return (char === "D" || char === "Y" || char === "S") ? `<span class="bold">${char}</span>` : char;
  });

  function typing() {
    if (typingIdx < formattedTxt.length) {
      $(".typing").html(formattedTxt.slice(0, typingIdx + 1).join("")); // HTML 유지
      typingIdx++;
      setTimeout(typing, typingSpeed);
    } else {
      setTimeout(() => {
        $(".typing").fadeOut(fadeSpeed, function () {
          $(this).empty().fadeIn(0); // 텍스트 삭제 후 다시 표시 준비
          typingIdx = 0; // 인덱스 초기화
          setTimeout(typing, delayBeforeRestart);
        });
      }, delayBeforeFade);
    }
  }

  $(".typing").empty(); // 기존 텍스트 초기화
  typing(); // 애니메이션 실행

  //  상품 구매 시 모달창
  $(".modal_pop").hide();
  $(".apply-btn").click(function () {
    $(".modal_pop").stop().fadeIn();
  })
  $(".btn > .del_pop").click(function () {
    $(".modal_pop").stop().fadeOut();
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

  //  계좌 번호 복사시  모달창

});