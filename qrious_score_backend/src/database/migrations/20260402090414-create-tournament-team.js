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
    await queryInterface.createTable('tournament_teams', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tournament_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'tournaments',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      team_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'teams',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    await queryInterface.addConstraint('tournament_teams', {
      fields: ['tournament_id', 'team_id'],
      type: 'unique',
      name: 'unique_tournament_team',
    });

    // ✅ INDEXES (performance)
    await queryInterface.addIndex('tournament_teams', ['tournament_id']);
    await queryInterface.addIndex('tournament_teams', ['team_id']);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     */
    await queryInterface.dropTable('tournament_teams');
  },
};
