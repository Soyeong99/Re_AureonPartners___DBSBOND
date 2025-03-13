$(function () {

  // 2차메뉴 
  // $(".depth2").hide()
  // $(".lnb_wrap li").click(function () {
  //   // $(".lnb_wrap li .lnb").addClass('active').siblings().removeClass('active')
  //   $(this).find(".depth2").slideToggle()
  // })

  // $(".lnb_wrap li").click(function () {
  //   $(this).find(".depth2").slideDown()
  // })

  // $(".lnb .right_box").click(function () {
  //   $(this).find(".depth2").slideUp()
  // })

  
  // ----------
  // 팝업 영역입니다 
  // ----------
  $(".modal").hide();

  //  - 비번 초기화
  $("button.reset_btn").click(function () {
    $(".modal_reset").stop().fadeIn('200');
  })
  $("button.reset").click(function () {
    $(".modal_reset").stop().fadeOut('200');
  })

  // - 회원탈퇴 / 진행 알림
  $("button.secess").click(function () {
    $(".modal_secess").stop().fadeIn('200');
  })
  $("button.close, button.submit").click(function () {
    $(".modal_secess").stop().fadeOut('200');
  })

  // - 회원탈퇴 / 완료 알림
  $("button.close").click(function () {
    $(".modal_secess_02").stop().fadeIn('200');
  })
  $("button.okay").click(function () {
    $(".modal_secess_02").stop().fadeOut('200');
  })

  // - 검색창
  $("div.search p").click(function () {
    $(".modal").stop().fadeIn('200');
  })
  $("span.close").click(function () {
    $(".modal").stop().fadeOut('200');
  })

  // - 검색창 선택한 태그 삭제
  $(".search_tag_area ul li").click(function () {
    $(this).find(".search_tag").empty()
  })

  // 팝업 관리 js

  $(".manage_area").hide()

  // $("#btn").click(function (){

  //   $(".manage_area").show()

  // 버튼 클릭 하면 수정이 보여지지만, 한 번 더 클릭해야 완료로 변경됨 / 나중에 코드 보장
  //   count++;
  //   if (count % 2) {
  //       real.innerHTML = '관리';
  //   } else {
  //       real.innerHTML = '완료';
  //   }
  // })
  
  $(".manage_area, .save").hide()

  $(".manage").click(function () {
    $(".manage_area").stop().slideDown()
    $(".save").show().siblings().hide()
  })

  $(".save").click(function () {
    $(".manage_area").stop().slideUp()
    $(".manage").show().siblings().hide()
  })

  //  ---------------------------------
  //            코드 확인 영역
  //   --------------------------------

  //  쪽지 탭 메뉴 - adimin_01_02_00 
$(".card_tit:not(:first-child), .tab_item:not(:first-child)").hide();

$(".tab_menu ul li").click(function () {
  $(this).addClass('active').siblings().removeClass('active');

  let idx = $(this).index();
  $('.tab_item').eq(idx).fadeIn(500).siblings().fadeOut(0);

  let num = $(this).index();
  $('.card_tit').eq(num).fadeIn(500).siblings().fadeOut(0);
})

// car_state 상태값-승인&대기&취소 
$("ol.m_state_ch").hide()

$(".m_state_con>li>button").click(function () {
  $("ol.m_state_ch").slideDown()
})

$("ol.m_state_ch li").click(function () {
  $("ol.m_state_ch").slideUp()
})

// 구분 상태값 수정 js
$(".state_ch").hide()

$(".state_con li").click(function () {
  $(".state_ch").slideToggle()
})

});
