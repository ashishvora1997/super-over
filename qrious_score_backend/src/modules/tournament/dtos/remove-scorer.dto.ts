import { IsInt } from 'class-validator';

export class RemoveScorerDto {
  @IsInt()
  tournament_id: number;

  @IsInt()
  user_id: number;
}
