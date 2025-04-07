// ../js/api/websocket.js
let stompClient = null;
let connectionPromise = null;

function connectWebSocket() {
  // 이미 연결 진행 중이거나 완료된 경우 동일한 Promise 반환
  if (connectionPromise) return connectionPromise;

  connectionPromise = new Promise((resolve, reject) => {
    const socket = new SockJS(`https://aureonkr.com/ws`);
    const StompLib = window.Stomp;
    if (!StompLib) {
      reject("❌ STOMP 라이브러리를 찾을 수 없습니다.");
      return;
    }

    stompClient = StompLib.over(socket);
    stompClient.debug = null;

    stompClient.connect(
      {},
      (frame) => {
        console.log("🟢 웹소켓 연결됨:", frame);
        resolve(stompClient);
      },
      (error) => {
        console.error("🔴 웹소켓 연결 실패:", error);
        reject(error);
      }
    );
  });

  return connectionPromise;
}

function disconnectWebSocket() {
  if (stompClient) {
    stompClient.disconnect(() => {
      console.log("❌ 웹소켓 연결 해제");
      stompClient = null;
      connectionPromise = null;
    });
  }
}

window.DBSWebSocket = {
  connect: connectWebSocket,
  disconnect: disconnectWebSocket,
};
