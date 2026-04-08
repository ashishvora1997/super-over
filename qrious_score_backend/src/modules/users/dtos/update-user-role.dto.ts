import { IsIn, IsString } from 'class-validator';

export class UpdateUserRoleDto {
  @IsString()
  @IsIn(['viewer', 'scorer'])
  declare role: string;
}
