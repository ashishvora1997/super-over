'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('team_players', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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

      player_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'players',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addConstraint('team_players', {
      fields: ['team_id', 'player_id'],
      type: 'unique',
      name: 'unique_team_player',
    });

    // ✅ INDEXES
    await queryInterface.addIndex('team_players', ['team_id']);
    await queryInterface.addIndex('team_players', ['player_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('team_players');
  },
};
