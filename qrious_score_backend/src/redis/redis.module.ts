import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisTestController } from './redis.controller';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [RedisTestController],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
