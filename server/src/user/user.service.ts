import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) { }

  async findById(id: string): Promise<Partial<User> | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        activeBusinessPlanId: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async getProfile(id: string): Promise<Partial<User>> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(id: string, updateData: { name?: string }): Promise<Partial<User>> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        activeBusinessPlanId: true,
        createdAt: true,
        updatedAt: true,
      }
    });
  }

  async getUserWithPlans(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        businessPlans: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            businessName: true,
            place: true,
            idea: true,
            createdAt: true,
            updatedAt: true,
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async setActivePlan(userId: string, planId: string): Promise<Partial<User>> {
    const plan = await this.prisma.businessPlan.findFirst({
      where: {
        id: planId,
        userId: userId,
      },
    });

    if (!plan) {
      throw new NotFoundException('Business plan not found or does not belong to this user');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { activeBusinessPlanId: planId },
      select: {
        id: true,
        email: true,
        name: true,
        activeBusinessPlanId: true,
        createdAt: true,
        updatedAt: true,
      }
    });
  }

  async getActivePlanId(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        activeBusinessPlanId: true,
      }
    });

    return user?.activeBusinessPlanId || null;
  }

  async userExists(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    return !!user;
  }
}