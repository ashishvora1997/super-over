import 'multer';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
  Put,
} from '@nestjs/common';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dtos/create-player.dto';
import { UpdatePlayerDto } from './dtos/update-player.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

import { FindPlayersQuery } from './interfaces/find-players-query.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/database/config/multer.config';
import { UpsertProfileDto } from './dtos/upsert-profile.dto';

@UseGuards(JwtAuthGuard)
@Controller('players')
export class PlayersController {
  constructor(private playersService: PlayersService) {}

  @Post()
  create(@Body() body: CreatePlayerDto) {
    return this.playersService.create(body);
  }

  @Post('bulk-upload')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async bulkUpload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.playersService.handleBulkUpload(file);
  }

  @Get('list')
  async findAllPlayersList() {
    return this.playersService.findAllPlayersList();
  }

  @Get()
  findAll(@Query() query: FindPlayersQuery) {
    return this.playersService.findAll(query);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@Req() req: Request & { user: { id: number } }) {
    return this.playersService.getMyProfile(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.playersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdatePlayerDto) {
    return this.playersService.update(+id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.playersService.delete(+id);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async upsertProfile(
    @Req() req: Request & { user: { id: number } },
    @Body() dto: UpsertProfileDto,
  ) {
    return this.playersService.upsertProfile(req.user.id, dto);
  }
}
