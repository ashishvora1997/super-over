'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('tournaments');

    if (tableInfo.location) {
      await queryInterface.renameColumn('tournaments', 'location', 'city');
    } else if (!tableInfo.city) {
      await queryInterface.addColumn('tournaments', 'city', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableInfo.organiser_name) {
      await queryInterface.addColumn('tournaments', 'organiser_name', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Unknown',
      });
    }

    if (!tableInfo.organiser_email) {
      await queryInterface.addColumn('tournaments', 'organiser_email', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'unknown@example.com',
      });
    }

    if (!tableInfo.created_by) {
      await queryInterface.addColumn('tournaments', 'created_by', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('tournaments');

    if (tableInfo.created_by) {
      await queryInterface.removeColumn('tournaments', 'created_by');
    }

    if (tableInfo.organiser_email) {
      await queryInterface.removeColumn('tournaments', 'organiser_email');
    }

    if (tableInfo.organiser_name) {
      await queryInterface.removeColumn('tournaments', 'organiser_name');
    }

    if (tableInfo.city) {
      await queryInterface.renameColumn('tournaments', 'city', 'location');
    }
  },
};
