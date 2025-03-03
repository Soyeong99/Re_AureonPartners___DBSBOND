$(function () {

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


  //회사 이미지 슬라이드 영역
  const slide_box = new Swiper(".slide_box", {

    loop: true,
    centeredSlides: true,

    autoplay: {
      delay: 1000,
      disableOnIneraction: false,
    },

    speed: 1000,
    slidesPerView: 1, //모바일 기준
    spaceBetween: 20, //모바일 기준

  });

});