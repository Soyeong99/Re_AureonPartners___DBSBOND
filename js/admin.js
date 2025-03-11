$(function () {

// 2차메뉴 
// $(".depth2").hide()
$(".lnb_wrap li").click(function () {
// $(".lnb_wrap li .lnb").addClass('active').siblings().removeClass('active')
$(this).find(".depth2").slideToggle()
})

// 모달 - 검색창
$(".modal").hide();

$("div.search p").click(function () {
  $(".modal").stop().fadeIn('200');
})
$("span.close").click(function () {
  $(".modal").stop().fadeOut('200');
})

// 모달 - 검색창 선택한 태그 삭제
$(".search_tag_area ul li").click(function () {
  $(this).find(".search_tag").empty()
})


//  ---------------------------------
//            코드 확인 영역
//   --------------------------------

//  쪽지 탭 메뉴 - adimin_01_02_00 
// $(".tab_menu ul li").click(function () {
//   $(this).addClass('active').siblings().removeClass('active');

//   let idx = $(this).index();
//   $('.tab_item div').eq(idx).fadeIn(500).siblings().fadeOut(0);
// })


// car_state 상태값-승인&대기 
$(".car_state ul li:not(:first-child)").hide()

$(".car_state ul li:first-child").click(function () {
$(".car_state ul li").slideToggle()
})



});
