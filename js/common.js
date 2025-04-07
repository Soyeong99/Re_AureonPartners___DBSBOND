$(function () {
  const authConfig = {
    protectedRoutes: [
      "/kr/index.html",
      "/a_login/info_edit.html",
      "/a_login/mail_in.html",
      "/a_login/mail.html",
      "/a_login/mycash.html",
      "/sub/sub_01.html",
      "/sub/sub_02.html",
      "/sub/sub_03",
      "/sub/sub_04",
      "/sub/sub_05",
    ],
    englishBaseUrl: "/en",

    hasValidAccessToken() {
      const token = localStorage.getItem("accessToken");
      return token && token.trim() !== "";
    },

    isProtectedRoute(path) {
      return this.protectedRoutes.some((route) => path.startsWith(route));
    },

    checkAuthAndRedirect() {
      const currentPath = window.location.pathname;
      const countMsg = parseInt(localStorage.getItem("umsgCount"), 10);

      console.log("Common Check: ", countMsg);

      if (
        currentPath.startsWith(this.englishBaseUrl) ||
        currentPath.startsWith("/index.html")
      ) {
        document.documentElement.style.display = "";
        return;
      }

      if (this.isProtectedRoute(currentPath)) {
        if (!this.hasValidAccessToken()) {
          window.location.href = `/login.html`;
          return;
        }
      }

      if (
        !isNaN(countMsg) &&
        countMsg > 0 &&
        !(
          currentPath.startsWith("/a_login/mail") ||
          currentPath.startsWith("/login")
        )
      ) {
        const modal = document.querySelector(".modal.mail_alarm");
        if (modal) {
          modal.style.display = "flex";
          const okayButton = modal.querySelector(".okay");
          if (okayButton) {
            okayButton.onclick = () => {
              modal.style.display = "none";
            };
          }
        }
      }

      document.documentElement.style.display = "";
    },

    init() {
      this.checkAuthAndRedirect();
      window.addEventListener("popstate", () => {
        this.checkAuthAndRedirect();
      });
    },
  };

  // ---------
  //  Common
  // ---------

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
  });

  $(".m_util>li").click(function () {
    $(this).find(".u_depth2").stop().slideToggle();
  });

  //  Login Modal

  $(".modal").hide();
  $(".nation:not(:nth-child(1))").click(function () {
    $(".modal").stop().fadeIn();
  });
  $(".modal dd>a.okay").click(function () {
    $(".modal").stop().fadeOut();
  });

  // 화면 깜빡임 방지용
  document.documentElement.style.display = "none";
  authConfig.init();
});
