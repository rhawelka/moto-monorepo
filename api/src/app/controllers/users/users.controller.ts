import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from '../../services/users/users.service';
import { AdminGuard } from '../../services/admin.guard';

@Controller('users')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findNonAdminUsers() {
    return this.usersService.findNonAdminUsers();
  }
}
