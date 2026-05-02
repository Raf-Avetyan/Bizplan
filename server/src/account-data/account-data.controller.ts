import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { Auth } from '../auth/common/decorators/auth.decorator';
import { User } from '../auth/common/decorators/user.decorator';
import { AccountDataService } from './account-data.service';

@Controller('account-data')
@Auth()
export class AccountDataController {
  constructor(private readonly accountDataService: AccountDataService) {}

  @Get()
  getAll(@User() user: any) {
    return this.accountDataService.getAll(user.id);
  }

  @Get('settings')
  getSettings(@User() user: any) {
    return this.accountDataService.getValue(user.id, 'settings');
  }

  @Put('settings')
  updateSettings(@User() user: any, @Body() settings: any) {
    return this.accountDataService.updateValue(user.id, 'settings', settings);
  }

  @Get('ai-chats')
  getAiChats(@User() user: any) {
    return this.accountDataService.getValue(user.id, 'aiChats');
  }

  @Put('ai-chats')
  updateAiChats(@User() user: any, @Body() aiChats: any) {
    return this.accountDataService.updateValue(user.id, 'aiChats', aiChats);
  }

  @Get('tool-documents')
  getToolDocuments(@User() user: any) {
    return this.accountDataService.getValue(user.id, 'toolDocuments');
  }

  @Put('tool-documents')
  updateToolDocuments(@User() user: any, @Body() toolDocuments: any[]) {
    return this.accountDataService.updateValue(user.id, 'toolDocuments', toolDocuments);
  }

  @Get('news-cache/:companyId')
  getCompanyNewsCache(@User() user: any, @Param('companyId') companyId: string) {
    return this.accountDataService.getCompanyNewsCache(user.id, companyId);
  }

  @Put('news-cache/:companyId')
  updateCompanyNewsCache(
    @User() user: any,
    @Param('companyId') companyId: string,
    @Body() newsCache: any,
  ) {
    return this.accountDataService.updateCompanyNewsCache(user.id, companyId, newsCache);
  }
}
