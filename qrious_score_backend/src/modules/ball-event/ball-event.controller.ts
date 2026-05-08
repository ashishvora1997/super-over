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
  async recordBall(@Body() dto: CreateBallEventDto) {
    const result = await this.ballEventService.recordBall(dto);
    const { ballEvent, innings } = result.data;

    this.ballEventService
      .getScorecard(dto.innings_id)
      .then((scorecardRes) => {
        this.ballEventService.emitBallRecorded(
          innings.match_id,
          ballEvent,
          innings,
          scorecardRes.data,
        );
      })
      .catch(() => {
        this.ballEventService.emitBallRecorded(
          innings.match_id,
          ballEvent,
          innings,
          null,
        );
      });

    return result;
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
  async undoLast(@Param('inningsId') inningsId: number) {
    const result = await this.ballEventService.undoLast(Number(inningsId));
    const { innings } = result.data;

    this.ballEventService
      .getScorecard(Number(inningsId))
      .then((scorecardRes) => {
        this.ballEventService.emitBallUndone(
          innings.match_id,
          innings,
          0,
          scorecardRes.data,
        );
      })
      .catch(() => {
        this.ballEventService.emitBallUndone(
          innings.match_id,
          innings,
          0,
          null,
        );
      });

    return result;
  }
}
