import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Put,
  Delete,
  Query,
  Patch,
} from '@nestjs/common';
import { BusinessPlansService } from './company.service';
import { Auth } from '../auth/common/decorators/auth.decorator';
import { User } from '../auth/common/decorators/user.decorator';
import { CreateBusinessPlanDto, UpdateBusinessPlanDto } from './dto/business-plan.dto';

@Controller('company')
@Auth()
export class BusinessPlansController {
  constructor(private readonly businessPlansService: BusinessPlansService) { }

  @Post()
  create(@User() user: any, @Body() planData: CreateBusinessPlanDto) {
    return this.businessPlansService.create(user.id, planData);
  }

  @Get()
  findAll(@User() user: any) {
    return this.businessPlansService.findAll(user.id);
  }

  @Get(':id')
  findOne(@User() user: any, @Param('id') id: string) {
    return this.businessPlansService.findOne(id, user.id);
  }

  @Put(':id')
  update(@User() user: any, @Param('id') id: string, @Body() updateData: UpdateBusinessPlanDto) {
    return this.businessPlansService.update(id, user.id, updateData);
  }

  @Delete(':id')
  remove(@User() user: any, @Param('id') id: string) {
    return this.businessPlansService.remove(id, user.id);
  }

  @Put(':id/activate')
  setActive(@User() user: any, @Param('id') id: string) {
    return this.businessPlansService.setActive(user.id, id);
  }

  @Get('active/current')
  getActive(@User() user: any) {
    return this.businessPlansService.getActive(user.id);
  }

  @Put(':id/financial-data')
  addFinancialData(
    @User() user: any,
    @Param('id') id: string,
    @Body() financialData: any,
  ) {
    return this.businessPlansService.addFinancialData(id, user.id, financialData);
  }

  @Get('search')
  search(@User() user: any, @Query('q') searchTerm: string) {
    return this.businessPlansService.search(user.id, searchTerm);
  }

  @Get('stats/overview')
  getStats(@User() user: any) {
    return this.businessPlansService.getStats(user.id);
  }

  @Get(':id/additional-data')
  getAdditionalData(@User() user: any, @Param('id') id: string) {
    return this.businessPlansService.getAdditionalData(id, user.id);
  }

  @Put(':id/additional-data')
  updateAdditionalData(
    @User() user: any,
    @Param('id') id: string,
    @Body() additionalData: any,
  ) {
    return this.businessPlansService.updateAdditionalData(id, user.id, additionalData);
  }

  @Patch(':id/additional-data')
  patchAdditionalData(
    @User() user: any,
    @Param('id') id: string,
    @Body() additionalData: any,
  ) {
    return this.businessPlansService.patchAdditionalData(id, user.id, additionalData);
  }

  @Delete(':id/additional-data/:key')
  removeAdditionalDataKey(
    @User() user: any,
    @Param('id') id: string,
    @Param('key') key: string,
  ) {
    return this.businessPlansService.removeAdditionalDataKey(id, user.id, key);
  }

  @Post(':id/additional-data/:key')
  addAdditionalDataKey(
    @User() user: any,
    @Param('id') id: string,
    @Param('key') key: string,
    @Body() data: any,
  ) {
    return this.businessPlansService.addAdditionalDataKey(id, user.id, key, data.value);
  }

  @Put(':id/additional-data/:key')
  updateAdditionalDataKey(
    @User() user: any,
    @Param('id') id: string,
    @Param('key') key: string,
    @Body() data: any,
  ) {
    return this.businessPlansService.updateAdditionalDataKey(id, user.id, key, data.value);
  }

  @Get(':id/additional-data/keys')
  getAdditionalDataKeys(@User() user: any, @Param('id') id: string) {
    return this.businessPlansService.getAdditionalDataKeys(id, user.id);
  }
}