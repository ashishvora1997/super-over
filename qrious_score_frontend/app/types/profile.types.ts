export type PlayingRole =
  | "top_order_batter"
  | "middle_order_batter"
  | "opening_batter"
  | "wicket_keeper_batter"
  | "wicket_keeper"
  | "bowler"
  | "all_rounder"
  | "lower_order_batter"
  | "none";

export type BattingStyle = "right_hand" | "left_hand" | "none";

export type BowlingStyle =
  | "right_arm_fast"
  | "right_arm_medium"
  | "left_arm_fast"
  | "left_arm_medium"
  | "slow_left_arm_orthodox"
  | "slow_left_arm_chinaman"
  | "right_arm_off_break"
  | "right_arm_leg_break"
  | "none";

export type Gender = "male" | "female";

export interface ProfileData {
  id: number;
  name: string;
  playing_role: PlayingRole | null;
  batting_style: BattingStyle | null;
  bowling_style: BowlingStyle | null;
  date_of_birth: string | null;
  location: string | null;
  gender: Gender | null;
  profile_picture: string | null;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    is_profile_complete: boolean;
  };
}

export interface UpsertProfilePayload {
  date_of_birth: string;
  location: string;
  gender: Gender;
  playing_role: PlayingRole;
  batting_style: BattingStyle;
  bowling_style: BowlingStyle;
}

export const PLAYING_ROLE_OPTIONS: { label: string; value: PlayingRole }[] = [
  { label: "Top-order Batter", value: "top_order_batter" },
  { label: "Middle-order Batter", value: "middle_order_batter" },
  { label: "Opening Batter", value: "opening_batter" },
  { label: "Wicket-keeper Batter", value: "wicket_keeper_batter" },
  { label: "Wicket-keeper", value: "wicket_keeper" },
  { label: "Bowler", value: "bowler" },
  { label: "All-rounder", value: "all_rounder" },
  { label: "Lower-order Batter", value: "lower_order_batter" },
  { label: "None", value: "none" },
];

export const BATTING_STYLE_OPTIONS: { label: string; value: BattingStyle }[] = [
  { label: "Right Hand", value: "right_hand" },
  { label: "Left Hand", value: "left_hand" },
  { label: "None", value: "none" },
];

export const BOWLING_STYLE_OPTIONS: { label: string; value: BowlingStyle }[] = [
  { label: "Right-arm Fast", value: "right_arm_fast" },
  { label: "Right-arm Medium", value: "right_arm_medium" },
  { label: "Left-arm Fast", value: "left_arm_fast" },
  { label: "Left-arm Medium", value: "left_arm_medium" },
  { label: "Slow Left-arm Orthodox", value: "slow_left_arm_orthodox" },
  { label: "Slow Left-arm Chinaman", value: "slow_left_arm_chinaman" },
  { label: "Right-arm Off Break", value: "right_arm_off_break" },
  { label: "Right-arm Leg Break", value: "right_arm_leg_break" },
  { label: "None", value: "none" },
];

export const GENDER_OPTIONS: { label: string; value: Gender }[] = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

const roleMap = new Map(PLAYING_ROLE_OPTIONS.map((o) => [o.value, o.label]));
const battingMap = new Map(
  BATTING_STYLE_OPTIONS.map((o) => [o.value, o.label]),
);
const bowlingMap = new Map(
  BOWLING_STYLE_OPTIONS.map((o) => [o.value, o.label]),
);
const genderMap = new Map(GENDER_OPTIONS.map((o) => [o.value, o.label]));

export const profileLabel = {
  playingRole: (v: string | null) => roleMap.get(v as PlayingRole) ?? v ?? "—",
  battingStyle: (v: string | null) =>
    battingMap.get(v as BattingStyle) ?? v ?? "—",
  bowlingStyle: (v: string | null) =>
    bowlingMap.get(v as BowlingStyle) ?? v ?? "—",
  gender: (v: string | null) => genderMap.get(v as Gender) ?? v ?? "—",
};
