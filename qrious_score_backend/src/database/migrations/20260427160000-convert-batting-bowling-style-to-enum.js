'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Step 1: Create ENUM types

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_players_batting_style" AS ENUM (
        'right_hand',
        'left_hand',
        'none'
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_players_bowling_style" AS ENUM (
        'right_arm_fast',
        'right_arm_medium',
        'left_arm_fast',
        'left_arm_medium',
        'slow_left_arm_orthodox',
        'slow_left_arm_chinaman',
        'right_arm_off_break',
        'right_arm_leg_break',
        'none'
      );
    `);

    // Step 2: Alter columns to use ENUM

    await queryInterface.sequelize.query(`
      ALTER TABLE players
        ALTER COLUMN batting_style TYPE "enum_players_batting_style"
        USING batting_style::text::"enum_players_batting_style";
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE players
        ALTER COLUMN bowling_style TYPE "enum_players_bowling_style"
        USING bowling_style::text::"enum_players_bowling_style";
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revert columns back to STRING

    await queryInterface.sequelize.query(`
      ALTER TABLE players
        ALTER COLUMN batting_style TYPE VARCHAR(255)
        USING batting_style::text;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE players
        ALTER COLUMN bowling_style TYPE VARCHAR(255)
        USING bowling_style::text;
    `);

    // Drop ENUM types

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_players_batting_style";
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_players_bowling_style";
    `);
  },
};
