import {
  Controller,
  Get,
  Body,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IncidentsQueryDto } from './incidents-query.dto';
import { UpdateIncidentDto } from './update-incident.dto';
import { IncidentsService } from '../../services/incidents/incidents.service';
import { IncidentsGateway } from '../../services/incidents/incidents.gateway';
import { AdminGuard } from '../../services/admin.guard';
import { CreateIncidentDto } from './create-incident.dto';
import { RequirePermissions } from '../../services/permissions';
import { PermissionsGuard } from '../../services/permissions.guard';
import { UserPermission } from '@prisma/client';

@Controller('incidents')
@UseGuards(AuthGuard('jwt'))
export class IncidentsController {
  constructor(
    private readonly incidentsService: IncidentsService,
    private readonly incidentsGateway: IncidentsGateway,
  ) {}

  @Get()
  @RequirePermissions(UserPermission.INCIDENTS_READ)
  @UseGuards(PermissionsGuard)
  findAll(@Query() query: IncidentsQueryDto) {
    return this.incidentsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(UserPermission.INCIDENTS_READ)
  @UseGuards(PermissionsGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.incidentsService.findOne(id);
  }

  @Post()
  @RequirePermissions(UserPermission.INCIDENTS_CREATE)
  @UseGuards(PermissionsGuard)
  async create(@Body() incident: CreateIncidentDto) {
    const createdIncident = await this.incidentsService.create(incident);
    this.incidentsGateway.publishIncidentUpdate(createdIncident);
    return createdIncident;
  }

  @Patch(':id')
  @RequirePermissions(UserPermission.INCIDENTS_UPDATE)
  @UseGuards(PermissionsGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changes: UpdateIncidentDto,
  ) {
    const incident = await this.incidentsService.update(id, changes);
    this.incidentsGateway.publishIncidentUpdate(incident);
    return incident;
  }

  @Delete(':id')
  @RequirePermissions(UserPermission.INCIDENTS_DELETE)
  @UseGuards(PermissionsGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.incidentsService.remove(id);
    this.incidentsGateway.publishIncidentDeleted(id);
  }
}
