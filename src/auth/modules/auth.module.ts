// base
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

// modules
import { UsersModule } from 'src/users/modules/users.module';

// controllers
import { AuthController } from '../controllers/auth.controller';

// services
import { AuthService } from '../services/auth.service';

@Module({
  imports: [JwtModule.register({}), UsersModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService]
})
export class AuthModule {}
