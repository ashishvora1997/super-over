import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { BallEventService } from './ball-event.service';
import { CreateBallEventDto } from './dtos/create-ball-event.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ball-events')
export class BallEventController {
  constructor(private readonly ballEventService: BallEventService) {}

  @Roles('admin', 'scorer')
  @Post()
  recordBall(@Body() dto: CreateBallEventDto) {
    return this.ballEventService.recordBall(dto);
  }

  @Get('innings/:inningsId')
  findByInnings(@Param('inningsId') inningsId: number) {
    return this.ballEventService.findByInnings(Number(inningsId));
  }

  @Get('innings/:inningsId/scorecard')
  getScorecard(@Param('inningsId') inningsId: number) {
    return this.ballEventService.getScorecard(Number(inningsId));
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.ballEventService.findOne(Number(id));
  }

  @Roles('admin', 'scorer')
  @Delete('innings/:inningsId/undo')
  undoLast(@Param('inningsId') inningsId: number) {
    return this.ballEventService.undoLast(Number(inningsId));
  }
}
