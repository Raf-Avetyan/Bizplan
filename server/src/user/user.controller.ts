import { Controller, Get, Patch, Body, Put, Param } from '@nestjs/common';
import { Auth } from '../auth/common/decorators/auth.decorator';
import { User } from '../auth/common/decorators/user.decorator';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get('profile')
  @Auth()
  async getProfile(@User() user: any) {
    return this.userService.getProfile(user.id);
  }

  @Patch('profile')
  @Auth()
  async updateProfile(
    @User() user: any,
    @Body() updateData: { name?: string }
  ) {
    return this.userService.updateProfile(user.id, updateData);
  }

  @Get('with-plans')
  @Auth()
  async getUserWithPlans(@User() user: any) {
    return this.userService.getUserWithPlans(user.id);
  }

  @Put('active-plan/:planId')
  @Auth()
  async setActivePlan(
    @User() user: any,
    @Param('planId') planId: string
  ) {
    return this.userService.setActivePlan(user.id, planId);
  }

  @Get('active-plan/id')
  @Auth()
  async getActivePlanId(@User() user: any) {
    return this.userService.getActivePlanId(user.id);
  }
}