import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { IncidentsQueryDto } from '../../controllers/incidents/incidents-query.dto';
import { UpdateIncidentDto } from '../../controllers/incidents/update-incident.dto';

@Injectable()
export class IncidentsService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(query: IncidentsQueryDto) {
    const where: Prisma.IncidentWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.severity ? { severity: query.severity } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
              { location: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prismaService.$transaction([
      this.prismaService.incident.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { [query.sortBy]: query.order },
      }),
      this.prismaService.incident.count({ where }),
    ]);

    return { data, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const incident = await this.prismaService.incident.findUnique({
      where: { id },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    return incident;
  }

  async update(id: string, changes: UpdateIncidentDto) {
    await this.findOne(id);
    return this.prismaService.incident.update({
      where: { id },
      data: changes,
    });
  }
}
