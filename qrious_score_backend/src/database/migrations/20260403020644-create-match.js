'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('matches', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      tournament_id: {
        type: Sequelize.INTEGER,
        references: { model: 'tournaments', key: 'id' },
        onDelete: 'CASCADE',
      },

      team_a_id: {
        type: Sequelize.INTEGER,
        references: { model: 'teams', key: 'id' },
      },

      team_b_id: {
        type: Sequelize.INTEGER,
        references: { model: 'teams', key: 'id' },
      },

      match_date: Sequelize.DATE,

      venue: Sequelize.STRING,

      status: {
        type: Sequelize.STRING, // safer than ENUM
        defaultValue: 'scheduled',
      },

      winner_team_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     */
    await queryInterface.dropTable('matches');
  },
};
