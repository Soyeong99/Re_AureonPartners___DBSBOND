// websocket-init.js

window.addEventListener("DOMContentLoaded", () => {
  DBSWebSocket.connect((msg) => {
    console.log("✅ 실시간 메시지 도착:", msg);

    // 예시: 메시지 수신 후 알림 수 업데이트 (원하면 이 부분 수정 가능)
    if (msg.type === "UNREAD_COUNT_UPDATE" && typeof msg.count === "number") {
      localStorage.setItem("umsgCount", msg.count);

      const badgeEl = document.getElementById("message-badge");
      if (badgeEl) {
        badgeEl.textContent = msg.count;
        badgeEl.style.display = msg.count > 0 ? "inline-block" : "none";
      }
    }
  });

  // 페이지 이탈 시 연결 종료
  window.addEventListener("beforeunload", () => {
    DBSWebSocket.disconnect();
  });
});
