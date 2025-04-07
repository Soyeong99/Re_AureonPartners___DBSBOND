import { API_BASE_URL } from "./config.js";

$(document).ready(function () {
  const excludedPaths = [
    "/",
    "/index.html",
    "/login.html",
    "/join_01.html",
    "/join_02.html",
  ];

  const currentPath = window.location.pathname;

  if (!excludedPaths.includes(currentPath)) {
    checkMessageCount();
  }
});

async function checkMessageCount() {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token retrieved. Cannot fetch data.");
    return;
  }

  try {
    let apiUrl = `${API_BASE_URL}api/dbs-bond/common/message/unread-count`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
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

    if (data.status === 200) {
      localStorage.setItem("umsgCount", data.data.count);
    } else {
      console.error("API Error:", data.resultMsg);
    }
  } catch (error) {
    console.error("Error fetching notices:", error);
  }
}
