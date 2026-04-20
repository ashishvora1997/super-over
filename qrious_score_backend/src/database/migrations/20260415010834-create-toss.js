'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tosses', {
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

      toss_winner_team_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'teams', key: 'id' },
      },

      elected_to: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tosses');
  },
};
