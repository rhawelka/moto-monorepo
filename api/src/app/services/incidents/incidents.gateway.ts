import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Incident } from '@prisma/client';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/incidents',
  cors: { origin: ['http://localhost:4200', 'http://127.0.0.1:4200'] },
})
export class IncidentsGateway implements OnGatewayConnection {
  @WebSocketServer()
  private server!: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket): Promise<void> {
    const token = client.handshake.auth['token'];
    if (typeof token !== 'string' || token.length === 0) {
      client.disconnect(true);
      return;
    }

    try {
      await this.jwtService.verifyAsync(token);
    } catch {
      client.disconnect(true);
    }
  }

  publishIncidentUpdate(incident: Incident): void {
    this.server.emit('incident.updated', incident);
  }
}
