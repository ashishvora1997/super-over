'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ball_events', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      innings_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'innings', key: 'id' },
        onDelete: 'CASCADE',
      },

      over_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      ball_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      striker_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'players', key: 'id' },
      },

      non_striker_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'players', key: 'id' },
      },

      bowler_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'players', key: 'id' },
      },

      runs_bat: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      runs_extra: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      extra_type: {
        type: Sequelize.ENUM('wide', 'no_ball', 'bye', 'leg_bye'),
        allowNull: true,
      },

      is_wicket: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      wicket_type: {
        type: Sequelize.ENUM(
          'bowled',
          'caught',
          'lbw',
          'run_out',
          'stumped',
          'hit_wicket',
          'retired_hurt',
        ),
        allowNull: true,
      },

      dismissed_player_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'players', key: 'id' },
      },

      fielder_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'players', key: 'id' },
      },

      is_legal: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },

      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    await queryInterface.addIndex('ball_events', [
      'innings_id',
      'over_number',
      'ball_number',
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ball_events');
  },
};
