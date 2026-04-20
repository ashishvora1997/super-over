'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('innings', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      match_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'matches', key: 'id' },
        onDelete: 'CASCADE',
      },

      innings_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      batting_team_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'teams', key: 'id' },
      },

      bowling_team_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'teams', key: 'id' },
      },

      total_runs: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },

      wickets: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },

      overs: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },

      balls: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },

      status: {
        type: Sequelize.STRING,
        defaultValue: 'not_started',
      },

      striker_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'players', key: 'id' },
      },

      non_striker_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'players', key: 'id' },
      },

      bowler_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'players', key: 'id' },
      },

      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('innings');
  },
};
