import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ScoringGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ScoringGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinMatch')
  handleJoinMatch(client: Socket, matchId: number) {
    const room = `match:${matchId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
  }

  @SubscribeMessage('leaveMatch')
  handleLeaveMatch(client: Socket, matchId: number) {
    const room = `match:${matchId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room ${room}`);
  }

  emitToMatch(matchId: number, event: string, data: unknown) {
    this.server.to(`match:${matchId}`).emit(event, data);
  }
}
