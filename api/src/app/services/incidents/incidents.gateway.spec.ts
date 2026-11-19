import { JwtService } from '@nestjs/jwt';
import {
  IncidentSeverity,
  IncidentStatus,
  UserPermission,
  UserStatus,
  type Incident,
} from '@prisma/client';
import type { Server, Socket } from 'socket.io';
import { UsersService } from '../users/users.service';
import { IncidentsGateway } from './incidents.gateway';

describe('IncidentsGateway', () => {
  let jwtService: jest.Mocked<Pick<JwtService, 'verifyAsync'>>;
  let usersService: jest.Mocked<Pick<UsersService, 'findById'>>;
  let gateway: IncidentsGateway;
  let client: {
    handshake: { auth: Record<string, unknown> };
    disconnect: jest.Mock;
  };
  let server: { emit: jest.Mock };

  beforeEach(() => {
    jwtService = {
      verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-id' }),
    };
    usersService = {
      findById: jest.fn().mockResolvedValue({
        id: 'user-id',
        username: 'rider',
        email: 'rider@example.com',
        passwordHash: 'hash',
        role: 'USER',
        status: UserStatus.ACTIVE,
        permissions: [UserPermission.INCIDENTS_READ],
      }),
    };
    gateway = new IncidentsGateway(
      jwtService as unknown as JwtService,
      usersService as unknown as UsersService,
    );
    client = {
      handshake: { auth: {} },
      disconnect: jest.fn(),
    };
    server = { emit: jest.fn() };
    (gateway as unknown as { server: Server }).server =
      server as unknown as Server;
  });

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['non-string', 123],
  ])('disconnects a client with a %s token', async (_description, token) => {
    client.handshake.auth['token'] = token;

    await gateway.handleConnection(client as unknown as Socket);

    expect(client.disconnect).toHaveBeenCalledWith(true);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('verifies the token and checks current read permissions', async () => {
    client.handshake.auth['token'] = 'valid-jwt';

    await gateway.handleConnection(client as unknown as Socket);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-jwt');
    expect(usersService.findById).toHaveBeenCalledWith('user-id');
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('disconnects a client when token verification fails', async () => {
    client.handshake.auth['token'] = 'invalid-jwt';
    jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

    await gateway.handleConnection(client as unknown as Socket);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('invalid-jwt');
    expect(client.disconnect).toHaveBeenCalledWith(true);
    expect(usersService.findById).not.toHaveBeenCalled();
  });

  it('disconnects suspended users and users without incident-read permission', async () => {
    client.handshake.auth['token'] = 'valid-jwt';
    usersService.findById.mockResolvedValueOnce({
      id: 'user-id',
      username: 'rider',
      email: 'rider@example.com',
      passwordHash: 'hash',
      role: 'ADMIN',
      status: UserStatus.SUSPENDED,
      permissions: [],
    });

    await gateway.handleConnection(client as unknown as Socket);

    expect(client.disconnect).toHaveBeenCalledWith(true);
    client.disconnect.mockClear();
    usersService.findById.mockResolvedValueOnce({
      id: 'user-id',
      username: 'rider',
      email: 'rider@example.com',
      passwordHash: 'hash',
      role: 'USER',
      status: UserStatus.ACTIVE,
      permissions: [],
    });

    await gateway.handleConnection(client as unknown as Socket);

    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('publishes incident updates to connected clients', () => {
    const incident = {
      id: '00000000-0000-4000-8000-000000000001',
      title: 'Road hazard near central station',
      description:
        'Large debris is blocking one lane near the central station.',
      location: 'Central station',
      latitude: 50.0614,
      longitude: 19.9366,
      status: IncidentStatus.OPEN,
      severity: IncidentSeverity.HIGH,
      reportedAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    } satisfies Incident;

    gateway.publishIncidentUpdate(incident);

    expect(server.emit).toHaveBeenCalledWith('incident.updated', incident);
  });

  it('publishes incident deletions to connected clients', () => {
    const id = '00000000-0000-4000-8000-000000000001';

    gateway.publishIncidentDeleted(id);

    expect(server.emit).toHaveBeenCalledWith('incident.deleted', { id });
  });
});
