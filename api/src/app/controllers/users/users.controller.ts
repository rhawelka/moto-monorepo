import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from '../../services/users/users.service';
import { RequirePermissions } from '../../services/permissions';
import { PermissionsGuard } from '../../services/permissions.guard';
import { UserPermission } from '@prisma/client';
import {
  CreateManagedUserDto,
  UpdateManagedUserDto,
} from './manage-user.dto';
import type { Request } from 'express';

type AuthenticatedRequest = Request & {
  user: { id: string; role: 'USER' | 'ADMIN' };
};

@Controller('users')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions(UserPermission.USERS_MANAGE)
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  @RequirePermissions(UserPermission.USERS_MANAGE)
  create(
    @Body() user: CreateManagedUserDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.usersService.createManaged(user, request.user);
  }

  @Patch(':id')
  @RequirePermissions(UserPermission.USERS_MANAGE)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changes: UpdateManagedUserDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.usersService.updateManaged(id, changes, request.user);
  }

  @Delete(':id')
  @RequirePermissions(UserPermission.USERS_MANAGE)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.usersService.removeManaged(id, request.user);
  }
}
