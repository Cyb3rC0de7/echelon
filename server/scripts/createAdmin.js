const User = require('../models/User');
const sequelize = require('../config/database');

async function createAdmin() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const adminExists = await User.findOne({ where: { role: 'admin' } });
    
    if (!adminExists) {
      const admin = await User.create({
        username: 'admin',
        email: 'admin@echelon.com',
        password: 'Admin123!', // Change this in production!
        role: 'admin'
      });
      
      console.log('Admin user created:', admin.username);
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    process.exit();
  }
}

createAdmin();