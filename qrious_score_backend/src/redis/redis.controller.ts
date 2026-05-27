import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RedisService } from './redis.service';

interface SetKeyDto {
  key: string;
  value: string;
  ttl?: number;
}

interface TestResult {
  success: boolean;
  message: string;
  value?: string | null;
  oldValue?: number;
  newValue?: number;
  verified?: boolean;
}

interface TestResults {
  set: TestResult | null;
  get: TestResult | null;
  increment: TestResult | null;
  expire: TestResult | null;
  delete: TestResult | null;
}

@Controller('redis-test')
export class RedisTestController {
  constructor(private readonly redisService: RedisService) {}

  @Get('health')
  async healthCheck() {
    try {
      const testKey = 'health_check';
      const testValue = 'ok';

      await this.redisService.set(testKey, testValue, 10);
      const result = await this.redisService.get(testKey);

      if (result === testValue) {
        return {
          status: 'ok',
          message: 'Redis is working properly',
          timestamp: new Date().toISOString(),
        };
      } else {
        throw new Error('Redis health check failed');
      }
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Redis connection failed',
          error: error.message,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Post('set')
  async setKey(@Body() body: SetKeyDto) {
    try {
      const { key, value, ttl } = body;

      if (!key || !value) {
        throw new HttpException(
          'Both key and value are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (ttl) {
        await this.redisService.set(key, value, ttl);
      } else {
        await this.redisService.set(key, value, ttl);
      }

      return {
        success: true,
        message: `Key "${key}" set successfully`,
        ttl: ttl || 'no expiration',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to set key',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('get/:key')
  async getKey(@Param('key') key: string) {
    try {
      if (!key) {
        throw new HttpException('Key is required', HttpStatus.BAD_REQUEST);
      }

      const value = await this.redisService.get(key);

      if (value === null) {
        return {
          success: true,
          key,
          value: null,
          message: 'Key not found or expired',
        };
      }

      return {
        success: true,
        key,
        value,
        message: 'Key retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get key',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('del/:key')
  async deleteKey(@Param('key') key: string) {
    try {
      if (!key) {
        throw new HttpException('Key is required', HttpStatus.BAD_REQUEST);
      }

      await this.redisService.del(key);

      return {
        success: true,
        message: `Key "${key}" deleted successfully`,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete key',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('increment/:key')
  async incrementKey(@Param('key') key: string) {
    try {
      if (!key) {
        throw new HttpException('Key is required', HttpStatus.BAD_REQUEST);
      }

      const newValue = await this.redisService.increment(key);

      return {
        success: true,
        key,
        newValue,
        message: 'Key incremented successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to increment key',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('expire/:key')
  async setExpiration(
    @Param('key') key: string,
    @Body('seconds') seconds: number,
  ) {
    try {
      if (!key) {
        throw new HttpException('Key is required', HttpStatus.BAD_REQUEST);
      }

      if (!seconds || seconds <= 0) {
        throw new HttpException(
          'Valid seconds value is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.redisService.expire(key, seconds);

      return {
        success: true,
        message: `Expiration set for key "${key}" (${seconds} seconds)`,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to set expiration',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('test-all')
  async testAllOperations() {
    const results: TestResults = {
      set: null,
      get: null,
      increment: null,
      expire: null,
      delete: null,
    };

    try {
      const testKey = `test_${Date.now()}`;

      await this.redisService.set(testKey, 'test_value', 60);
      results.set = { success: true, message: 'SET operation successful' };

      const getValue = await this.redisService.get(testKey);
      results.get = {
        success: true,
        message: 'GET operation successful',
        value: getValue,
      };

      const incKey = `${testKey}_counter`;
      await this.redisService.set(incKey, '5', 60);
      const incValue = await this.redisService.increment(incKey);
      results.increment = {
        success: true,
        message: 'INCREMENT operation successful',
        oldValue: 5,
        newValue: incValue,
      };

      await this.redisService.expire(incKey, 30);
      results.expire = {
        success: true,
        message: 'EXPIRE operation successful',
      };

      await this.redisService.del(testKey);
      const deletedCheck = await this.redisService.get(testKey);
      results.delete = {
        success: true,
        message: 'DELETE operation successful',
        verified: deletedCheck === null,
      };

      return {
        success: true,
        message: 'All Redis operations tested successfully',
        results,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Test suite failed',
          error: error.message,
          results,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
