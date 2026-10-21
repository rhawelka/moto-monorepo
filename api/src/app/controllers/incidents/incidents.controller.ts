import {
  Controller,
  Get,
  Body,
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

@Controller('incidents')
@UseGuards(AuthGuard('jwt'))
export class IncidentsController {
  constructor(
    private readonly incidentsService: IncidentsService,
    private readonly incidentsGateway: IncidentsGateway,
  ) {}

  @Get()
  findAll(@Query() query: IncidentsQueryDto) {
    return this.incidentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.incidentsService.findOne(id);
  }

  @Post()
  @UseGuards(AdminGuard)
  async create(@Body() incident: CreateIncidentDto) {
    const createdIncident = await this.incidentsService.create(incident);
    this.incidentsGateway.publishIncidentUpdate(createdIncident);
    return createdIncident;
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changes: UpdateIncidentDto,
  ) {
    const incident = await this.incidentsService.update(id, changes);
    this.incidentsGateway.publishIncidentUpdate(incident);
    return incident;
  }
}
