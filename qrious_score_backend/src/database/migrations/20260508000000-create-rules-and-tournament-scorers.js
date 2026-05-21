'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create rules table
    await queryInterface.createTable('rules', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tournament_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'tournaments', key: 'id' },
        onDelete: 'CASCADE',
      },
      match_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'matches', key: 'id' },
        onDelete: 'CASCADE',
      },
      wide_runs: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      no_ball_runs: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      count_wide_as_legal_delivery: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      count_no_ball_as_legal_delivery: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      ignore_wide_rule: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      ignore_no_ball_rule: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    // 2. Create tournament_scorers table
    await queryInterface.createTable('tournament_scorers', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tournament_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tournaments', key: 'id' },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    // Add unique constraint to prevent duplicate scorers
    await queryInterface.addConstraint('tournament_scorers', {
      fields: ['tournament_id', 'user_id'],
      type: 'unique',
      name: 'unique_tournament_scorer',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('tournament_scorers');
    await queryInterface.dropTable('rules');
  },
};
