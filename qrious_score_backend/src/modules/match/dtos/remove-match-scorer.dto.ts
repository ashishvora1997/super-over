import { IsInt, IsNotEmpty } from 'class-validator';

export class RemoveMatchScorerDto {
  @IsInt()
  @IsNotEmpty()
  match_id!: number;

  @IsInt()
  @IsNotEmpty()
  user_id!: number;
}
