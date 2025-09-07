// server/config/database.js
const { Sequelize } = require('sequelize');

let sequelize;

if (process.env.NODE_ENV === 'production') {
  // Heroku production configuration
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
} else {
  // Local development configuration
  sequelize = new Sequelize(
    process.env.DATABASE_URL,
    {
      dialect: 'postgres',
      logging: false, // Show SQL queries in development
      dialectOptions: {
        // No SSL for local development
      }
    }
  );
}

module.exports = sequelize;