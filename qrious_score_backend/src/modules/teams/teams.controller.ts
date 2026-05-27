import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dtos/create-team.dto';
import { UpdateTeamDto } from './dtos/update-team.dto';
import { AddPlayerByEmailDto } from './dtos/add-player-by-email.dto';
import { FindTeamsQuery } from './interfaces/find-teams-query.interface';
import { SetCaptainDto } from './dtos/set-captain.dto';
import { SetWicketKeeperDto } from './dtos/set-wicket-keeper.dto';

import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

interface RequestWithUser extends Request {
  user: { id: number; email: string };
}

@UseGuards(JwtAuthGuard)
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  create(@Body() data: CreateTeamDto, @Req() req: RequestWithUser) {
    data.created_by = req.user.id;
    return this.teamsService.create(data);
  }

  @Get()
  findAll(@Query() query: FindTeamsQuery, @Req() req: RequestWithUser) {
    return this.teamsService.findAll(query, req.user.id);
  }

  @Get('list')
  async findAllTeamsList() {
    return this.teamsService.findAllTeamsList();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.teamsService.findOne(Number(id));
  }

  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body() data: UpdateTeamDto,
    @Req() req: RequestWithUser,
  ) {
    return this.teamsService.update(Number(id), data, req.user.id);
  }

  @Delete(':id')
  delete(@Param('id') id: number, @Req() req: RequestWithUser) {
    return this.teamsService.delete(Number(id), req.user.id);
  }

  @Delete(':id/players/:playerId')
  removePlayer(
    @Param('id') id: number,
    @Param('playerId') playerId: number,
    @Req() req: RequestWithUser,
  ) {
    return this.teamsService.removePlayer(
      Number(id),
      Number(playerId),
      req.user.id,
    );
  }

  @Post('set-captain')
  setCap(@Body() data: SetCaptainDto, @Req() req: RequestWithUser) {
    return this.teamsService.setCaptain(data, req.user.id);
  }

  @Post('set-wicket-keeper')
  setWicketKeeper(
    @Body() data: SetWicketKeeperDto,
    @Req() req: RequestWithUser,
  ) {
    return this.teamsService.setWicketKeeper(data, req.user.id);
  }

  @Post('add-player-by-email')
  addPlayerByEmail(
    @Body() data: AddPlayerByEmailDto,
    @Req() req: RequestWithUser,
  ) {
    return this.teamsService.addPlayerByEmail(data, req.user.id);
  }
}
