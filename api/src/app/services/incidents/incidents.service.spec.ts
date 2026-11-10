import { NotFoundException } from '@nestjs/common';
import { IncidentSeverity, IncidentStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateIncidentDto } from '../../controllers/incidents/create-incident.dto';
import { IncidentsQueryDto } from '../../controllers/incidents/incidents-query.dto';
import { UpdateIncidentDto } from '../../controllers/incidents/update-incident.dto';
import { IncidentsService } from './incidents.service';

describe('IncidentsService', () => {
  const incident = {
    id: '00000000-0000-4000-8000-000000000001',
    title: 'Road hazard near central station',
    description: 'Large debris is blocking one lane near the central station.',
    location: 'Central station',
    latitude: 50.0614,
    longitude: 19.9366,
    status: IncidentStatus.OPEN,
    severity: IncidentSeverity.HIGH,
    reportedAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  let prismaService: {
    $transaction: jest.Mock;
    incident: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let service: IncidentsService;

  beforeEach(() => {
    prismaService = {
      $transaction: jest.fn(),
      incident: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new IncidentsService(prismaService as unknown as PrismaService);
  });

  describe('findAll', () => {
    it('returns paginated incidents and total count', async () => {
      const query = {
        page: 2,
        pageSize: 5,
        sortBy: 'reportedAt',
        order: 'desc',
      } as IncidentsQueryDto;
      prismaService.incident.findMany.mockResolvedValue([incident]);
      prismaService.incident.count.mockResolvedValue(11);
      prismaService.$transaction.mockResolvedValue([[incident], 11]);

      await expect(service.findAll(query)).resolves.toEqual({
        data: [incident],
        total: 11,
        page: 2,
        pageSize: 5,
      });

      expect(prismaService.incident.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 5,
        take: 5,
        orderBy: { reportedAt: 'desc' },
      });
      expect(prismaService.incident.count).toHaveBeenCalledWith({ where: {} });
      expect(prismaService.$transaction).toHaveBeenCalledWith([
        prismaService.incident.findMany.mock.results[0].value,
        prismaService.incident.count.mock.results[0].value,
      ]);
    });

    it('filters by status, severity, and case-insensitive search', async () => {
      const query = {
        page: 1,
        pageSize: 10,
        sortBy: 'title',
        order: 'asc',
        status: IncidentStatus.OPEN,
        severity: IncidentSeverity.HIGH,
        search: 'station',
      } as IncidentsQueryDto;
      prismaService.incident.findMany.mockResolvedValue([incident]);
      prismaService.incident.count.mockResolvedValue(1);
      prismaService.$transaction.mockResolvedValue([[incident], 1]);

      await service.findAll(query);

      const where = {
        status: IncidentStatus.OPEN,
        severity: IncidentSeverity.HIGH,
        OR: [
          { title: { contains: 'station', mode: 'insensitive' } },
          { description: { contains: 'station', mode: 'insensitive' } },
          { location: { contains: 'station', mode: 'insensitive' } },
        ],
      };
      expect(prismaService.incident.findMany).toHaveBeenCalledWith({
        where,
        skip: 0,
        take: 10,
        orderBy: { title: 'asc' },
      });
      expect(prismaService.incident.count).toHaveBeenCalledWith({ where });
    });
  });

  describe('findOne', () => {
    it('returns the incident with the requested ID', async () => {
      prismaService.incident.findUnique.mockResolvedValue(incident);

      await expect(service.findOne(incident.id)).resolves.toBe(incident);
      expect(prismaService.incident.findUnique).toHaveBeenCalledWith({
        where: { id: incident.id },
      });
    });

    it('throws NotFoundException when the incident does not exist', async () => {
      prismaService.incident.findUnique.mockResolvedValue(null);

      await expect(service.findOne(incident.id)).rejects.toThrow(
        new NotFoundException('Incident not found'),
      );
    });
  });

  it('creates an incident with the provided data', async () => {
    const newIncident = {
      title: 'Road hazard by the station',
      description: 'Large debris is blocking a lane near the station entrance.',
      location: 'Central station',
      latitude: 50.0614,
      longitude: 19.9366,
      status: IncidentStatus.OPEN,
      severity: IncidentSeverity.HIGH,
    } satisfies CreateIncidentDto;
    prismaService.incident.create.mockResolvedValue(incident);

    await expect(service.create(newIncident)).resolves.toBe(incident);
    expect(prismaService.incident.create).toHaveBeenCalledWith({
      data: newIncident,
    });
  });

  describe('update', () => {
    it('checks that the incident exists before applying changes', async () => {
      const changes = {
        status: IncidentStatus.RESOLVED,
      } satisfies UpdateIncidentDto;
      prismaService.incident.findUnique.mockResolvedValue(incident);
      prismaService.incident.update.mockResolvedValue({
        ...incident,
        ...changes,
      });

      await expect(service.update(incident.id, changes)).resolves.toEqual({
        ...incident,
        ...changes,
      });

      expect(prismaService.incident.findUnique).toHaveBeenCalledWith({
        where: { id: incident.id },
      });
      expect(prismaService.incident.update).toHaveBeenCalledWith({
        where: { id: incident.id },
        data: changes,
      });
    });

    it('does not update an incident that does not exist', async () => {
      prismaService.incident.findUnique.mockResolvedValue(null);

      await expect(
        service.update(incident.id, { status: IncidentStatus.RESOLVED }),
      ).rejects.toThrow(NotFoundException);
      expect(prismaService.incident.update).not.toHaveBeenCalled();
    });
  });
});
