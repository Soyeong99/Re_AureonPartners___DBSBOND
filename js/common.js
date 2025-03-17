$(function () {

  // --------- 
  //  Common
  // --------- 

  document.addEventListener("DOMContentLoaded", function () {
    const mgnb_wrap = document.querySelector(".mgnb_wrap");
    mobileMenu.style.display = "none"; // 강제로 숨김 처리
  });

  //depth2
  $(".depth2").hide();

  $(".gnb>li").mouseenter(function () {
    $(this).find(".depth2").stop().slideDown();
  });

  $(".gnb>li").mouseleave(function () {
    $(this).find(".depth2").stop().slideUp();
  });


  //m_depth2
  $(".mgnb_wrap, .mdepth2").hide();

  $(".ham").click(function () {
    $(".mgnb_wrap").fadeIn();
  });

  $(".mgnb_close").click(function () {
    $(".mgnb_wrap").fadeOut();
  });

  $(".mgnb > li").click(function () {
    $(this).find(".mdepth2").slideToggle();
    // $(this).find('.show').addClass("active")
  });

  // $(".m_gnb>li").click(function () {
  //   $(this).find(".m_depth2").slideDown();
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