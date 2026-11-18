import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminSettingsDto } from './admin-settings.dto';
import { AdminSettingsService } from '../../services/admin-settings/admin-settings.service';
import { AdminGuard } from '../../services/admin.guard';

@Controller('admin/settings')
@UseGuards(AuthGuard('jwt'))
export class AdminSettingsController {
  constructor(private readonly adminSettingsService: AdminSettingsService) {}

  @Get()
  getSettings() {
    return this.adminSettingsService.getSettings();
  }

  @Patch()
  @UseGuards(AdminGuard)
  updateSettings(@Body() settings: AdminSettingsDto) {
    return this.adminSettingsService.updateSettings(settings);
  }
}
