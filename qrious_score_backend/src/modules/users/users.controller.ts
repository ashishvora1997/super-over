import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UpdateUserRoleDto } from './dtos/update-user-role.dto';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  @Get()
  getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Patch(':id/role')
  @Roles('admin')
  updateUserRole(@Param('id') id: string, @Body() body: UpdateUserRoleDto) {
    return this.userService.updateRole(+id, body.role);
  }
}
