'use strict';


module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'email_otp');

    await queryInterface.removeColumn('users', 'email_otp_expires_at');

    await queryInterface.removeColumn('users', 'email_otp_resend_count');

    await queryInterface.removeColumn('users', 'email_otp_resend_reset_at');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'email_otp', {
      type: Sequelize.STRING(64),
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'email_otp_expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'email_otp_resend_count', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false,
    });

    await queryInterface.addColumn('users', 'email_otp_resend_reset_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
};
