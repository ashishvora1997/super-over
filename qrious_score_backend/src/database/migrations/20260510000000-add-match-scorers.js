'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('match_scorers').catch(() => {});
    await queryInterface.removeConstraint('match_scorers', 'unique_match_scorer').catch(() => {});

    await queryInterface.createTable('match_scorers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      match_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'matches',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addConstraint('match_scorers', {
      fields: ['match_id', 'user_id'],
      type: 'unique',
      name: 'unique_match_scorer_custom',
    });

    try {
      await queryInterface.addColumn('matches', 'active_scorer_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    } catch(e) {}

  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('matches', 'active_scorer_id');
    await queryInterface.dropTable('match_scorers');
  },
};
