import { API_BASE_URL } from "../config.js";

$(document).ready(function () {
  fetchAdminNotifications();
});

async function fetchAdminNotifications() {
  try {
    const accessToken = localStorage.getItem("accessToken");
    const endpoint = "api/dbs-bond/admin/notifications";
    const apiUrl = `${API_BASE_URL}${endpoint}`;

    const fetchOptions = {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      mode: "cors",
      credentials: "include",
    };

    const notificationsRes = await fetch(apiUrl, fetchOptions).then((res) =>
      res.json()
    );
    const data = notificationsRes.data;

    // Calculate the total counts for each category
    const memberTotal = data.memberTotalCount;
    const depositTotal = data.investmentCount + data.withdrawalCount;
    const withdrawalTotal = data.withdrawalTotalCount;
    const repaymentTotal = data.repaymentCount;
    const managementTotal = data.inquiryCount;

    // Update the UI based on the calculated totals
    updateAlarmDisplay("member-alarm", memberTotal);
    updateAlarmDisplay("deposit-alarm", depositTotal);
    updateAlarmDisplay("withdrawal-alarm", withdrawalTotal);
    updateAlarmDisplay("repayment-alarm", repaymentTotal);
    updateAlarmDisplay("management-alarm", managementTotal);

    updateAlertDisplay("nd-1", data.newUserCount);
    // updateAlertDisplay("nd-2", data.messageReadCount);
    updateAlertDisplay("nd-3", data.investmentCount);
    updateAlertDisplay("nd-4", data.approvedInvestmentCount);
    updateAlertDisplay("nd-5", data.withdrawalCount);
    updateAlertDisplay("nd-6", data.pendingPaymentCount);
    updateAlertDisplay("nd-7", data.repaymentCount);
    updateAlertDisplay("nd-8", data.inquiryCount);
  } catch (error) {
    hideAllBadges();
  }
}

function updateAlarmDisplay(elementId, count) {
  if (count > 0) {
    let styleId = `${elementId}-style`;

    $(`#${styleId}`).remove();

    const styleEl = $("<style>", {
      id: styleId,
      text: `#${elementId}::before { 
                content: "${count}"; 
                display: block; 
                width: 18px; 
                height: 18px; 
                background: var(--main-color); 
                position: absolute; 
                top: -6px; 
                left: 8px; 
                border-radius: 100px; 
                text-align: center; 
                line-height: 18px; 
                color: #fff; 
                font-size: 1rem; 
                font-weight: 400;
            }`,
    });

    $("head").append(styleEl);
  } else {
    let styleId = `${elementId}-style`;
    $(`#${styleId}`).remove();

    const styleEl = $("<style>", {
      id: styleId,
      text: `#${elementId}::before { display: none !important; }`,
    });

    $("head").append(styleEl);
  }
}

function updateAlertDisplay(elementId, count) {
  const noticeDot = document.getElementById(elementId);

  if (!noticeDot) {
    console.warn(`Element #${elementId} not found in the DOM`);
    return;
  }

  noticeDot.style.display = count > 0 ? "block" : "none";
}

function hideAllBadges() {
  const styleEl = $("<style>", {
    id: "hide-all-badges",
    text: `.alarm::before { display: none !important; }`,
  });

  $("#hide-all-badges").remove();
  $("head").append(styleEl);

  for (let i = 1; i <= 8; i++) {
    const element = document.getElementById(`nd-${i}`);
    if (element) {
      element.style.display = "none";
    }
  }
}
