import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Incident, UserPermission, UserStatus } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { UsersService } from '../users/users.service';

@WebSocketGateway({
  namespace: '/incidents',
  cors: { origin: ['http://localhost:4200', 'http://127.0.0.1:4200'] },
})
export class IncidentsGateway implements OnGatewayConnection {
  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const token = client.handshake.auth['token'];
    if (typeof token !== 'string' || token.length === 0) {
      client.disconnect(true);
      return;
    }

    let payload: { sub?: unknown };
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      client.disconnect(true);
      return;
    }

    if (typeof payload.sub !== 'string') {
      client.disconnect(true);
      return;
    }

    const user = await this.usersService.findById(payload.sub);
    if (
      !user ||
      user.status !== UserStatus.ACTIVE ||
      (user.role !== 'ADMIN' &&
        !user.permissions.includes(UserPermission.INCIDENTS_READ))
    ) {
      client.disconnect(true);
    }
  }

  publishIncidentUpdate(incident: Incident): void {
    this.server.emit('incident.updated', incident);
  }

  publishIncidentDeleted(id: string): void {
    this.server.emit('incident.deleted', { id });
  }
}
