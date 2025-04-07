import { API_BASE_URL } from "../config.js";
import { formatNumberWithCommas } from "../helper.js";

$(document).ready(function () {
  fetchDashboardData(); // withdrawal, signup, deposit 데이터 fetch
  initActiveUsersWebSocket(); // activeUsers 데이터는 웹소켓으로 수신
});

async function fetchDashboardData() {
  try {
    const accessToken = localStorage.getItem("accessToken");

    // activeUsers는 제거합니다.
    const endpoints = {
      withdrawal: "api/dbs-bond/admin/dashboard/withdrawal-stats",
      signup: "api/dbs-bond/admin/dashboard/signup-stats",
      deposit: "api/dbs-bond/admin/dashboard/deposit-stats",
      activeUsers: "api/dbs-bond/admin/dashboard/active-users",
    };

    const apiUrls = Object.keys(endpoints).reduce((acc, key) => {
      acc[key] = `${API_BASE_URL}${endpoints[key]}`;
      return acc;
    }, {});

    const fetchOptions = {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      mode: "cors",
      credentials: "include",
    };

    const [withdrawalRes, signupRes, depositRes, activeUsersRes] =
      await Promise.all([
        fetch(apiUrls.withdrawal, fetchOptions).then((res) => res.json()),
        fetch(apiUrls.signup, fetchOptions).then((res) => res.json()),
        fetch(apiUrls.deposit, fetchOptions).then((res) => res.json()),
        fetch(apiUrls.activeUsers, fetchOptions).then((res) => res.json()),
      ]);

    document.getElementById("sign-res-total").textContent =
      formatNumberWithCommas(signupRes.data.totalMembers);
    document.getElementById("sign-res-today").textContent =
      formatNumberWithCommas(signupRes.data.todaySignupCount);
    document.querySelector(".user_num").textContent = formatNumberWithCommas(
      activeUsersRes.data
    );

    document.getElementById("dep-total").textContent = formatNumberWithCommas(
      depositRes.data.totalDeposit
    );
    document.getElementById("dep-today").textContent = formatNumberWithCommas(
      depositRes.data.todayDeposit
    );

    document.getElementById("withdraw-total").textContent =
      formatNumberWithCommas(withdrawalRes.data.totalWithdrawal);
    document.getElementById("withdraw-today").textContent =
      formatNumberWithCommas(withdrawalRes.data.todayWithdrawal);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    // 필요 시 로딩 스크린을 종료하는 코드 추가
  }
}
