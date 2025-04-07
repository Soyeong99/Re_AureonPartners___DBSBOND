$(function () {
  $(".qna_content").hide(); //  모든 아코디언을 처음부터 숨김

  $(".qna li").click(function () {
    let $content = $(this).find(".qna_content");

    $content.stop().slideToggle(300); // 현재 클릭한 요소만 열기/닫기
    $(this).siblings().find(".qna_content").slideUp(300); // 다른 요소는 닫기

    $(this).toggleClass("on").siblings().removeClass("on"); // on 클래스 관리
  });
});

//탭 메뉴

$(function () {
  $(".tabcontent > div").hide();
  $(".tabnav a")
    .click(function () {
      $(".tabcontent > div").hide().filter(this.hash).fadeIn();
      $(".tabnav a").removeClass("active");
      $(this).addClass("active");
      return false;
    })
    .filter(":eq(0)")
    .click();
});

$(function () {
  let tabs = $(".tab-link"); // 탭 버튼 리스트
  let contents = $(".tabcontent > div"); // 탭 콘텐츠
  let prevBtn = $("#prevTab");
  let nextBtn = $("#nextTab");
  let currentIndex = 0; // 현재 활성화된 탭 인덱스

  // 초기 설정
  contents.hide().eq(currentIndex).show();
  tabs.eq(currentIndex).addClass("active");
  updateNavButtons();

  // 숫자 탭 버튼 클릭 시 부드러운 전환
  $(".tabnav a.tab-link").click(function (e) {
    e.preventDefault();
    let targetIndex = tabs.index(this);
    if (targetIndex !== -1) {
      changeTab(targetIndex);
    }
  });

  // 이전 버튼 클릭 시
  prevBtn.click(function (e) {
    e.preventDefault();
    if (currentIndex > 0) {
      changeTab(currentIndex - 1);
    } else {
      window.location.href = "prev_page.html"; // 🔹 이전 페이지 이동
    }
  });

  // 다음 버튼 클릭 시
  nextBtn.click(function (e) {
    e.preventDefault();
    if (currentIndex < tabs.length - 1) {
      changeTab(currentIndex + 1);
    } else {
      window.location.href = "next_page.html"; // 🔹 다음 페이지 이동
    }
  });

  // 탭 변경 함수 (부드러운 전환 추가)
  function changeTab(index) {
    if (currentIndex === index) return; // 현재 탭이면 실행 안 함

    tabs.removeClass("active").eq(index).addClass("active");

    // 부드러운 전환 효과 적용
    contents
      .eq(currentIndex)
      .stop()
      .fadeOut(200, function () {
        contents.eq(index).stop().fadeIn(200);
      });

    currentIndex = index;
    updateNavButtons();
  }

  // 버튼 상태 업데이트 함수
  function updateNavButtons() {
    prevBtn.toggleClass("disabled", currentIndex === 0);
    nextBtn.toggleClass("disabled", currentIndex === tabs.length - 1);
  }
});

// 내정보수정 모달팝업
$(".popup2").hide();

$(document).ready(function () {
  // $(".join").on("click", function (e) {
  //   e.preventDefault(); // 기본 동작 막기
  //   $(".popup2").fadeIn(); // 팝업 나타나게 하기
  // });

  $(".popup2-btn").on("click", function (e) {
    e.preventDefault();
    $(".popup2").fadeOut();

    setTimeout(function () {
      window.location.href = "../login.html";
    }, 300);
  });

  $(".popop2-btn").on("click", function (e) {
    e.preventDefault(); // 기본 동작 막기
    $(".popup2").fadeOut(); // 팝업 닫기

    // index.html로 이동
    setTimeout(function () {
      window.location.href = "../kr/index.html";
    }, 300); // 0.3초 후 이동 (부드럽게 닫히도록)
  });
});

// 체크박스 전체체크
$(document).ready(function () {
  // 전체 선택 체크박스 클릭 시
  $("#checkall_01").click(function () {
    $("input[name='check_01']").prop("checked", $(this).prop("checked"));
  });

  // 탭메뉴 체크박스 개별 체크박스 클릭 시
  $("input[name='check_01']").click(function () {
    if (
      $("input[name='check_01']:checked").length ==
      $("input[name='check_01']").length
    ) {
      $("#checkall_01").prop("checked", true);
    } else {
      $("#checkall_01").prop("checked", false);
    }
  });
});

$(document).ready(function () {
  // 전체 선택 체크박스 클릭 시
  $("#checkall_02").click(function () {
    $("input[name='check_02']").prop("checked", $(this).prop("checked"));
  });

  // 탭메뉴 체크박스 개별 체크박스 클릭 시
  $("input[name='check_02']").click(function () {
    if (
      $("input[name='check_01']:checked").length ==
      $("input[name='check_02']").length
    ) {
      $("#checkall_02").prop("checked", true);
    } else {
      $("#checkall_02").prop("checked", false);
    }
  });
});
