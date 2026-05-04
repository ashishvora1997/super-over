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
} from '@nestjs/common';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dtos/create-player.dto';
import { UpdatePlayerDto } from './dtos/update-player.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { FindPlayersQuery } from './interfaces/find-players-query.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/database/config/multer.config';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('players')
export class PlayersController {
  constructor(private playersService: PlayersService) {}

  @Post()
  @Roles('scorer')
  create(@Body() body: CreatePlayerDto) {
    return this.playersService.create(body);
  }

  @Post('bulk-upload')
  @Roles('scorer')
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.playersService.findOne(+id);
  }

  @Patch(':id')
  @Roles('scorer')
  update(@Param('id') id: string, @Body() body: UpdatePlayerDto) {
    return this.playersService.update(+id, body);
  }

  @Delete(':id')
  @Roles('admin')
  delete(@Param('id') id: string) {
    return this.playersService.delete(+id);
  }
}
