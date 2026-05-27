import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

function getWsUrl(): string {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";
  return apiUrl.replace(/\/api\/v1\/?$/, "");
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(getWsUrl(), {
      autoConnect: false,
      transports: ["websocket"],
    });
  }
  return socket;
}

export function joinMatch(matchId: number) {
  const s = getSocket();
  if (!s.connected) s.connect();
  s.emit("joinMatch", matchId);
}

export function leaveMatch(matchId: number) {
  const s = getSocket();
  s.emit("leaveMatch", matchId);
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
}
