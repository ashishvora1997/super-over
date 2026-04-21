import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';

import { MatchService } from './match.service';
import { CreateMatchDto } from './dtos/create-match.dto';
import { UpdateMatchDto } from './dtos/update-match.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('matches')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Roles('admin', 'scorer')
  @Post()
  create(@Body() dto: CreateMatchDto) {
    return this.matchService.create(dto);
  }

  @Get()
  findAll(@Query('tournament_id') tournament_id?: number) {
    return this.matchService.findAll(
      tournament_id ? Number(tournament_id) : undefined,
    );
  }

  @Get('list')
  findMatchesList() {
    return this.matchService.findAllMatchesList();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.matchService.findOne(Number(id));
  }

  @Patch(':id')
  @Roles('admin', 'scorer')
  update(@Param('id') id: number, @Body() dto: UpdateMatchDto) {
    return this.matchService.update(Number(id), dto);
  }

  @Roles('admin')
  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.matchService.delete(Number(id));
  }
}
