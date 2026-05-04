'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('points_table', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tournament_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tournaments',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      team_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      matches_played: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      wins: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      losses: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      ties: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      no_results: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      points: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      net_run_rate: {
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: null,
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    await queryInterface.addConstraint('points_table', {
      fields: ['tournament_id', 'team_id'],
      type: 'unique',
      name: 'unique_tournament_team_points',
    });

    await queryInterface.addIndex('points_table', ['tournament_id']);
    await queryInterface.addIndex('points_table', ['team_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('points_table');
  },
};
