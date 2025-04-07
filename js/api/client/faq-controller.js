import { API_BASE_URL } from "../config.js";

$(document).ready(function () {
  retrieveFAQs();
});

async function retrieveFAQs() {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/common/faq`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      mode: "cors",
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        alert("세션이 만료되었습니다. 로그인 페이지로 이동합니다.");
        localStorage.clear(); // 모든 localStorage 항목 삭제
        window.location.href = "/login.html";
        return;
      }

      const errorData = await response.json();
      const msg = errorData.data || "에러가 발생했습니다.";
      throw new Error(`${msg}`);
    }

    const data = await response.json();

    if (data.status === 201 || data.status === 200) {
      const faqs = data.data.content;
      console.log(faqs);

      // ✅ 바로 FAQ 리스트에 내용 담기
      renderFAQList(faqs);
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error fetching FAQs: ", error);
  } finally {
    $("#loading-screen").fadeOut();
  }
}

function renderFAQList(faqs) {
  const faqListContainer = $(".qna_in");
  faqListContainer.empty();

  if (faqs.length === 0) {
    // 리스트가 비어있으면 "리스트가 없습니다" 메시지를 표시
    faqListContainer.append("<p>리스트가 없습니다.</p>");
    return;
  }

  // FAQ 항목 생성
  faqs.forEach((faq, index) => {
    const faqItem = `
      <li>
        <a href="javascript:void(0);" class="faq-toggle">
          <h5>${index + 1}</h5>
          <h3>${faq.title}</h3>
          <!-- plus/minus 아이콘 2개 -->
          <img class="plus-icon" src="../img/sub02/plus.png" alt="plus" style="display: block;" />
          <img class="minus-icon" src="../img/sub02/minus.png" alt="minus" style="display: none;" />
        </a>
        <div class="qna_content" style="display: none;">
          <h5>${index + 1}</h5>
          <p>${faq.content}</p>
        </div>
      </li>
    `;
    faqListContainer.append(faqItem);
  });

  // 클릭 이벤트: 하나만 열기 (아코디언)
  // 이미 바인딩된 이벤트가 있으면 중복되지 않도록 off() 처리
  $(".qna_in li a.faq-toggle")
    .off("click")
    .on("click", function () {
      const $this = $(this);
      const $li = $this.closest("li");
      const $content = $li.find(".qna_content");
      const isActive = $li.hasClass("active");

      // 1) 먼저 모든 항목 닫기
      $(".qna_in li.active")
        .removeClass("active")
        .find(".qna_content")
        .slideUp();

      // plus/minus 아이콘 초기화
      $(".qna_in li .minus-icon").hide();
      $(".qna_in li .plus-icon").show();

      // 2) 현재 항목이 열려있지 않았다면, 이 항목만 열기
      if (!isActive) {
        $li.addClass("active");
        $content.slideDown();
        // plus/minus 아이콘 토글
        $li.find(".plus-icon").hide();
        $li.find(".minus-icon").show();
      }
    });
}
