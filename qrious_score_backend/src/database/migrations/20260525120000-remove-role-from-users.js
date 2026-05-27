'use strict';


module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn('users', 'role');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'role', {
      type: Sequelize.STRING,
      defaultValue: 'viewer',
    });
  },
};
