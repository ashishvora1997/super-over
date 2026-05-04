'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Step 1: Create the ENUM types
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_players_batting_style" AS ENUM ('RHB', 'LHB');
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_players_bowling_style" AS ENUM ('RAF', 'LAF', 'OFF', 'LAO', 'LEG');
    `);

    // Step 2: Map existing free-text data to enum values
    // Batting style mapping
    await queryInterface.sequelize.query(`
      UPDATE players SET batting_style = CASE
        WHEN LOWER(batting_style) LIKE '%left%' THEN 'LHB'
        WHEN batting_style IS NOT NULL AND batting_style != '' THEN 'RHB'
        ELSE NULL
      END;
    `);

    // Bowling style mapping
    await queryInterface.sequelize.query(`
      UPDATE players SET bowling_style = CASE
        WHEN LOWER(bowling_style) LIKE '%left%orthodox%' THEN 'LAO'
        WHEN LOWER(bowling_style) LIKE '%left%spin%' THEN 'LAO'
        WHEN LOWER(bowling_style) LIKE '%left%fast%' THEN 'LAF'
        WHEN LOWER(bowling_style) LIKE '%left%pace%' THEN 'LAF'
        WHEN LOWER(bowling_style) LIKE '%left%medium%' THEN 'LAF'
        WHEN LOWER(bowling_style) LIKE '%left%arm%' THEN 'LAO'
        WHEN LOWER(bowling_style) LIKE '%off%spin%' THEN 'OFF'
        WHEN LOWER(bowling_style) LIKE '%off%break%' THEN 'OFF'
        WHEN LOWER(bowling_style) LIKE '%leg%spin%' THEN 'LEG'
        WHEN LOWER(bowling_style) LIKE '%leg%break%' THEN 'LEG'
        WHEN LOWER(bowling_style) LIKE '%right%fast%' THEN 'RAF'
        WHEN LOWER(bowling_style) LIKE '%right%pace%' THEN 'RAF'
        WHEN LOWER(bowling_style) LIKE '%right%medium%' THEN 'RAF'
        WHEN bowling_style IS NOT NULL AND bowling_style != '' THEN 'RAF'
        ELSE NULL
      END;
    `);

    // Step 3: Change column types to ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE players
        ALTER COLUMN batting_style TYPE "enum_players_batting_style"
        USING batting_style::"enum_players_batting_style";
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE players
        ALTER COLUMN bowling_style TYPE "enum_players_bowling_style"
        USING bowling_style::"enum_players_bowling_style";
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revert columns back to STRING
    await queryInterface.sequelize.query(`
      ALTER TABLE players
        ALTER COLUMN batting_style TYPE VARCHAR(255)
        USING batting_style::VARCHAR;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE players
        ALTER COLUMN bowling_style TYPE VARCHAR(255)
        USING bowling_style::VARCHAR;
    `);

    // Drop the ENUM types
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_players_batting_style";`);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_players_bowling_style";`);
  },
};
