$(function () {

  // --------- 
  //  Common
  // --------- 

  // document.addEventListener("DOMContentLoaded", function () {
  //   const mgnb_wrap = document.querySelector(".mgnb_wrap");
  //   mobileMenu.style.display = "none"; // 강제로 숨김 처리
  // });

  //depth2
  $(".depth2").hide();

  $(".gnb>li, .util>li").mouseenter(function () {
    $(this).find(".depth2, .u_depth2").stop().slideDown();
  });

  $(".gnb>li, .util>li").mouseleave(function () {
    $(this).find(".depth2, .u_depth2").stop().slideUp();
  });

  //m_depth2
  $(".mgnb_wrap").hide();

  $(".ham").click(function () {
    $(".mgnb_wrap").fadeIn();
  });

  $(".mgnb_close").click(function () {
    $(".mgnb_wrap").fadeOut();
  });

  $(".mgnb_wrap .mgnb>li a").click(function () {
    $("ol.mdepth2").slideToggle();
    // $(this).find('.show').addClass("active")
  });

  // $(".m_gnb>li").click(function () {
  //   $(this).find(".m_depth2").slideDown();
  // });

  // u_depth2
  // $(".u_depth2").hide();

  $(".m_util>li").click(function () {
    $(this).find(".u_depth2").stop().slideToggle();
  });

  // $(".m_util>li").click(function () {
  //   $(this).find(".u_depth2").stop().slideUp();
  // });

  // --------- 
  //  Login
  // ---------  
  $(".modal").hide();
  $(".nation:not(:nth-child(1))").click(function () {
    $(".modal").stop().fadeIn();
  })
  $(".modal dd>a.okay").click(function () {
    $(".modal").stop().fadeOut();
  })


});