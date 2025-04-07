// Helper function to format date to YYYY.MM.DD
function formatDate(dateString) {
  const date = new Date(dateString);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}.${String(date.getDate()).padStart(2, "0")}`;
}

// Helper function to format date for comparison (YYYY-MM-DD)
function formatNormalDate(dateString) {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatRegDateTime(regDate) {
  const date = new Date(regDate);
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// Helper function to generate pagination
function generatePagination(currentPage, totalPages) {
  const paginationContainer = $("#pagination");
  paginationContainer.empty();

  if (totalPages > 0) {
    paginationContainer.append(`
            <a href="#" class="prev ${
              currentPage === 0 || totalPages === 1 ? "disableds" : ""
            }">
                <i class="bi bi-chevron-left"></i>
            </a>
        `);

    for (let i = 0; i < totalPages; i++) {
      paginationContainer.append(`
                <a href="#" class="page-number ${
                  i === currentPage ? "active" : ""
                }" data-page="${i}">
                    ${i + 1}
                </a>
            `);
    }

    paginationContainer.append(`
            <a href="#" class="next ${
              currentPage === totalPages - 1 || totalPages === 1
                ? "disableds"
                : ""
            }">
                <i class="bi bi-chevron-right"></i>
            </a>
        `);
  } else {
    paginationContainer.append(`데이터가 없습니다.`);
  }
}

function initializeDropdownEvents() {
  $(".state_ch").hide();
  $(".state_con li button").off("click");
  $(".state_ch li").off("click");
  $(document).off("click.dropdown");

  $(".state_con li button").on("click", function (e) {
    e.stopPropagation();
    $(".state_ch").not($(this).siblings(".state_ch")).slideUp();
    $(this).siblings(".state_ch").slideToggle();
  });

  $(".state_ch li").on("click", function (e) {
    e.stopPropagation();

    const selectedText = $(this).find("button").text();
    $(this).closest("li").find("> button").text(selectedText);
    $(this).closest(".state_ch").slideUp();
  });

  $(document).on("click.dropdown", function (e) {
    if (
      !$(e.target).is(
        ".state_ch, .state_ch *, button.state.state_red, button.state.state_bk"
      )
    ) {
      $(".state_ch").slideUp();
    }
  });
}

function formatNumberWithCommas(number) {
  return number.toLocaleString();
}

function formatCurrency(amount) {
  const billion = 100000000;
  if (amount >= billion) {
    return `${amount / billion}억`;
  }
  return amount.toLocaleString();
}
function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) return "";

  // 숫자만 추출
  const cleaned = phoneNumber.replace(/\D/g, "");

  // 최대 11자리로 제한 (지역번호 02인 경우 10자리)
  const maxLength = cleaned.startsWith("02") ? 10 : 11;
  const limited = cleaned.slice(0, maxLength);

  // 부분적으로 입력된 번호도 포맷팅
  if (limited.startsWith("02")) {
    // 서울 지역번호
    if (limited.length <= 2) return limited;
    if (limited.length <= 5) return limited.replace(/^(\d{2})(\d{1,3})$/, "$1-$2");
    return limited.replace(/^(\d{2})(\d{3,4})(\d{0,4})$/, "$1-$2-$3").replace(/-$/, "");
  } else {
    // 그 외 번호
    if (limited.length <= 3) return limited;
    if (limited.length <= 7) return limited.replace(/^(\d{3})(\d{1,4})$/, "$1-$2");
    return limited.replace(/^(\d{3})(\d{3,4})(\d{0,4})$/, "$1-$2-$3").replace(/-$/, "");
  }
}

function formatAccountNumber(bankName, rawNumber) {
  let clean = rawNumber.replace(/[^0-9]/g, "").slice(0, 14); // 모든 은행 숫자 14자리 제한

  switch (bankName) {
    case "농협":
    case "수협":
    case "신협":
      return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
    case "우체국":
      return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6)}`;
    case "신한은행":
    case "광주은행":
    case "경남은행":
      return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
    case "국민은행":
      return `${clean.slice(0, 3)}-${clean.slice(3, 5)}-${clean.slice(
        5,
        10
      )}-${clean.slice(10)}`;
    case "우리은행":
      return `${clean.slice(0, 4)}-${clean.slice(4, 7)}-${clean.slice(7)}`;
    case "카카오뱅크":
      return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6)}`;
    default:
      // 기타 은행: 3-3-나머지 포맷
      return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
  }
}

export {
  formatDate,
  formatNormalDate,
  generatePagination,
  initializeDropdownEvents,
  formatNumberWithCommas,
  formatCurrency,
  formatRegDateTime,
  formatPhoneNumber,
  formatAccountNumber,
};
