import {
  GUARDS_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { IncidentsController } from './incidents.controller';
import { IncidentsGateway } from '../../services/incidents/incidents.gateway';
import { IncidentsService } from '../../services/incidents/incidents.service';
import { UserPermission } from '@prisma/client';
import { REQUIRED_PERMISSIONS } from '../../services/permissions';
import { PermissionsGuard } from '../../services/permissions.guard';

describe('IncidentsController', () => {
  const incident = {
    id: '00000000-0000-4000-8000-000000000001',
    title: 'Road hazard near central station',
    description: 'Large debris is blocking one lane near the central station.',
    location: 'Central station',
    latitude: 50.0614,
    longitude: 19.9366,
    status: 'OPEN',
    severity: 'HIGH',
    reportedAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  let incidentsService: jest.Mocked<
    Pick<
      IncidentsService,
      'findAll' | 'findOne' | 'create' | 'update' | 'remove'
    >
  >;
  let incidentsGateway: jest.Mocked<
    Pick<IncidentsGateway, 'publishIncidentUpdate' | 'publishIncidentDeleted'>
  >;
  let controller: IncidentsController;

  beforeEach(() => {
    incidentsService = {
      findAll: jest.fn().mockResolvedValue({
        data: [incident],
        total: 1,
        page: 1,
        pageSize: 10,
      }),
      findOne: jest.fn().mockResolvedValue(incident),
      create: jest.fn().mockResolvedValue(incident),
      update: jest.fn().mockResolvedValue(incident),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    incidentsGateway = {
      publishIncidentUpdate: jest.fn(),
      publishIncidentDeleted: jest.fn(),
    };
    controller = new IncidentsController(
      incidentsService as unknown as IncidentsService,
      incidentsGateway as unknown as IncidentsGateway,
    );
  });

  it('protects the incident routes with JWT authentication', () => {
    expect(Reflect.getMetadata(PATH_METADATA, IncidentsController)).toBe(
      'incidents',
    );
    expect(Reflect.getMetadata(GUARDS_METADATA, IncidentsController)).toEqual([
      expect.any(Function),
    ]);
  });

  it('returns paginated incidents', async () => {
    const query = { page: 1, pageSize: 10 };

    await expect(controller.findAll(query as never)).resolves.toEqual({
      data: [incident],
      total: 1,
      page: 1,
      pageSize: 10,
    });
    expect(incidentsService.findAll).toHaveBeenCalledWith(query);
  });

  it('broadcasts successful updates to connected clients', async () => {
    const changes = { status: 'RESOLVED' as const };

    await expect(controller.update(incident.id, changes)).resolves.toEqual(
      incident,
    );
    expect(incidentsService.update).toHaveBeenCalledWith(incident.id, changes);
    expect(incidentsGateway.publishIncidentUpdate).toHaveBeenCalledWith(
      incident,
    );
  });

  it('creates an incident for users with create permission and broadcasts it', async () => {
    const newIncident = {
      title: incident.title,
      description: incident.description,
      location: incident.location,
      latitude: incident.latitude,
      longitude: incident.longitude,
      status: 'OPEN' as const,
      severity: 'HIGH' as const,
    };

    await expect(controller.create(newIncident)).resolves.toEqual(incident);
    expect(incidentsService.create).toHaveBeenCalledWith(newIncident);
    expect(incidentsGateway.publishIncidentUpdate).toHaveBeenCalledWith(
      incident,
    );
    expect(
      Reflect.getMetadata(
        GUARDS_METADATA,
        IncidentsController.prototype.create,
      ),
    ).toContain(PermissionsGuard);
    expect(
      Reflect.getMetadata(
        REQUIRED_PERMISSIONS,
        IncidentsController.prototype.create,
      ),
    ).toEqual([UserPermission.INCIDENTS_CREATE]);
    expect(
      Reflect.getMetadata(
        METHOD_METADATA,
        IncidentsController.prototype.create,
      ),
    ).toBe(1);
  });

  it('does not broadcast when an update fails', async () => {
    incidentsService.update.mockRejectedValueOnce(new Error('database error'));

    await expect(controller.update(incident.id, {})).rejects.toThrow(
      'database error',
    );
    expect(incidentsGateway.publishIncidentUpdate).not.toHaveBeenCalled();
  });

  it('exposes the PATCH update endpoint', () => {
    expect(
      Reflect.getMetadata(PATH_METADATA, IncidentsController.prototype.update),
    ).toBe(':id');
    expect(
      Reflect.getMetadata(
        METHOD_METADATA,
        IncidentsController.prototype.update,
      ),
    ).toBe(4);
  });

  it('deletes incidents for users with delete permission and broadcasts successful deletion', async () => {
    await expect(controller.remove(incident.id)).resolves.toBeUndefined();

    expect(incidentsService.remove).toHaveBeenCalledWith(incident.id);
    expect(incidentsGateway.publishIncidentDeleted).toHaveBeenCalledWith(
      incident.id,
    );
    expect(
      Reflect.getMetadata(
        GUARDS_METADATA,
        IncidentsController.prototype.remove,
      ),
    ).toContain(PermissionsGuard);
    expect(
      Reflect.getMetadata(
        REQUIRED_PERMISSIONS,
        IncidentsController.prototype.remove,
      ),
    ).toEqual([UserPermission.INCIDENTS_DELETE]);
    expect(
      Reflect.getMetadata(
        METHOD_METADATA,
        IncidentsController.prototype.remove,
      ),
    ).toBe(3);
  });

  it('does not broadcast a deletion if removing the incident fails', async () => {
    incidentsService.remove.mockRejectedValueOnce(new Error('database error'));

    await expect(controller.remove(incident.id)).rejects.toThrow(
      'database error',
    );
    expect(incidentsGateway.publishIncidentDeleted).not.toHaveBeenCalled();
  });
});
