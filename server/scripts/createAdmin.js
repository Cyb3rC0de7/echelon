const Employee = require('../models/employee');
const sequelize = require('../config/database');

async function createAdmin() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    const adminExists = await Employee.findOne({ 
      where: { permissionLevel: 'admin' } 
    });
    
    if (!adminExists) {
      const admin = await Employee.create({
        employeeNumber: 'ADMIN001',
        name: 'System',
        surname: 'Administrator',
        email: 'admin@echelon.com',
        birthDate: '1990-01-01',
        salary: 100000,
        role: 'System Administrator',
        permissionLevel: 'admin',
        password: 'Admin123!', // This will be hashed automatically
        managerId: null
      });
      
      console.log('Admin employee created:', admin.email);
    } else {
      console.log('Admin employee already exists');
    }
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    process.exit();
  }
}

createAdmin();