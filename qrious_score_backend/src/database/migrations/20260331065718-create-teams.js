'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('teams', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      short_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      city: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      jersey_color: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      home_ground: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      founded_year: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      captain_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'players',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },

      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('teams');
  },
};
