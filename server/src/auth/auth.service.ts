import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';


@Injectable()
export class AuthService {
   constructor(
      private prisma: PrismaService,
      private jwtService: JwtService,
   ) { }

   async register(userData: { email: string; name: string; password: string }) {
      const existingUser = await this.prisma.user.findUnique({
         where: { email: userData.email }
      });

      if (existingUser) {
         throw new ConflictException('Email already exists');
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const user = await this.prisma.user.create({
         data: {
            email: userData.email,
            name: userData.name,
            password: hashedPassword,
         },
         select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
         }
      });

      return {
         user,
         token: this.generateToken(user),
      };
   }

   async login(email: string, password: string) {
      const user = await this.prisma.user.findUnique({
         where: { email }
      });

      if (!user) {
         throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
         throw new UnauthorizedException('Invalid credentials');
      }

      const { password: _, ...userWithoutPassword } = user;

      return {
         user: userWithoutPassword,
         token: this.generateToken(user),
      };
   }

   async validateUserById(userId: string) {
      return this.prisma.user.findUnique({
         where: { id: userId },
         select: {
            id: true,
            email: true,
            name: true,
         }
      });
   }

   private generateToken(user: any) {
      const payload = {
         userId: user.id,
         email: user.email
      };

      console.log(this.jwtService.sign(payload, {
         secret: process.env.JWT_SECRET,
         expiresIn: '7d',
      }))

      return this.jwtService.sign(payload, {
         secret: process.env.JWT_SECRET,
         expiresIn: '7d',
      });
   }
}