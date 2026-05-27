import { Global, Module } from '@nestjs/common';
import { ScoringGateway } from './scoring.gateway';

@Global()
@Module({
  providers: [ScoringGateway],
  exports: [ScoringGateway],
})
export class ScoringGatewayModule {}
