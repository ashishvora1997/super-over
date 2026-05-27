import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateMatchRulesDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  wide_runs?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  no_ball_runs?: number;

  @IsOptional()
  @IsBoolean()
  count_wide_as_legal_delivery?: boolean;

  @IsOptional()
  @IsBoolean()
  count_no_ball_as_legal_delivery?: boolean;

  @IsOptional()
  @IsBoolean()
  ignore_wide_rule?: boolean;

  @IsOptional()
  @IsBoolean()
  ignore_no_ball_rule?: boolean;
}
