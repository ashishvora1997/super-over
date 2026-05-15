'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('players', 'date_of_birth', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });

    await queryInterface.addColumn('players', 'location', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn('players', 'gender', {
      type: Sequelize.ENUM('male', 'female'),
      allowNull: true,
    });

    await queryInterface.addColumn('players', 'profile_picture', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });

    await queryInterface.renameColumn('players', 'role', 'playing_role');

    await queryInterface.sequelize.query(`
    CREATE TYPE "enum_players_playing_role_new" AS ENUM (
      'top_order_batter',
      'middle_order_batter',
      'opening_batter',
      'wicket_keeper_batter',
      'wicket_keeper',
      'bowler',
      'all_rounder',
      'lower_order_batter',
      'none'
    );
  `);

    await queryInterface.sequelize.query(`
    ALTER TABLE "players"
    ALTER COLUMN "playing_role" TYPE TEXT;
  `);

    await queryInterface.sequelize.query(`
    ALTER TABLE "players"
    ALTER COLUMN "playing_role"
    TYPE "enum_players_playing_role_new"
    USING "playing_role"::text::"enum_players_playing_role_new";
  `);

    await queryInterface.sequelize.query(`
    DROP TYPE "enum_players_role";
  `);

    await queryInterface.sequelize.query(`
    ALTER TYPE "enum_players_playing_role_new"
    RENAME TO "enum_players_playing_role";
  `);

    await queryInterface.changeColumn('players', 'batting_style', {
      type: Sequelize.ENUM('right_hand', 'left_hand', 'none'),
      allowNull: true,
    });

    await queryInterface.changeColumn('players', 'bowling_style', {
      type: Sequelize.ENUM(
        'right_arm_fast',
        'right_arm_medium',
        'left_arm_fast',
        'left_arm_medium',
        'slow_left_arm_orthodox',
        'slow_left_arm_chinaman',
        'right_arm_off_break',
        'right_arm_leg_break',
        'none',
      ),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('players', 'playing_role', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.changeColumn('players', 'batting_style', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.changeColumn('players', 'bowling_style', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.renameColumn('players', 'playing_role', 'role');

    await queryInterface.removeColumn('players', 'date_of_birth');
    await queryInterface.removeColumn('players', 'location');
    await queryInterface.removeColumn('players', 'gender');
    await queryInterface.removeColumn('players', 'profile_picture');

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_players_gender";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_players_playing_role";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_players_batting_style";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_players_bowling_style";',
    );
  },
};
