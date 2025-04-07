function initActiveUsersWebSocket() {
  console.log("👥 현재 접속자 수: 초기화");

  DBSWebSocket.connect()
    .then((client) => {
      console.log("✅ WebSocket 연결 완료");

      client.subscribe("/topic/user-count", (message) => {
        console.log("📩 메시지 수신:", message);

        try {
          const payload = JSON.parse(message.body);
          console.log("👥 현재 접속자 수:", payload);

          const el = document.querySelector(".user_num");
          if (el) el.textContent = payload.count;
        } catch (err) {
          console.error("❌ 메시지 파싱 오류:", err);
        }
      });

      client.send("/app/get-user-count", {}, JSON.stringify({}));
    })
    .catch((err) => {
      console.error("❌ WebSocket 연결 실패:", err);
    });

  window.addEventListener("beforeunload", () => {
    DBSWebSocket.disconnect();
  });
}

initActiveUsersWebSocket();
