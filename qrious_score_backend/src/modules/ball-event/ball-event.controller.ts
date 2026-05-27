import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';

import { BallEventService } from './ball-event.service';
import { CreateBallEventDto } from './dtos/create-ball-event.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../users/models/user.model';

@UseGuards(JwtAuthGuard)
@Controller('ball-events')
export class BallEventController {
  constructor(private readonly ballEventService: BallEventService) {}

  @Post()
  async recordBall(
    @Body() dto: CreateBallEventDto,
    @Req() req: Request & { user: User },
  ) {
    const userId = req.user.id;
    const result = await this.ballEventService.recordBall(dto, userId);
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

  @Delete('innings/:inningsId/undo')
  async undoLast(
    @Param('inningsId') inningsId: number,
    @Req() req: Request & { user: User },
  ) {
    const userId = req.user.id;
    const result = await this.ballEventService.undoLast(
      Number(inningsId),
      userId,
    );
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
