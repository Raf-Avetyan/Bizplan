import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
   constructor(
      private jwtService: JwtService,
      private authService: AuthService,
   ) { }

   async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const token = this.extractToken(request);

      if (!token) {
         throw new UnauthorizedException('No token provided');
      }

      try {
         const payload = this.jwtService.verify(token, {
            secret: process.env.JWT_SECRET,
         });

         const user = await this.authService.validateUserById(payload.userId);

         if (!user) {
            throw new UnauthorizedException('User not found');
         }

         request.user = user;
         return true;
      } catch {
         throw new UnauthorizedException('Invalid or expired token');
      }
   }

   private extractToken(request: any): string | null {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
         return authHeader.substring(7);
      }
      return null;
   }
}