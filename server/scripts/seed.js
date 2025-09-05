// server/scripts/seed.js
const sequelize = require('../config/database');
const Employee = require('../models/Employee');

async function seedDatabase() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connected');
    
    // Sync database
    await sequelize.sync({ force: true }); // WARNING: This will drop existing tables
    console.log('Database synced');
    
    // Create sample employees
    const ceo = await Employee.create({
      employeeNumber: 'EMP001',
      name: 'John',
      surname: 'Smith',
      email: 'john.smith@echelon.com',
      birthDate: '1975-03-15',
      salary: 150000.00,
      role: 'CEO',
      managerId: null
    });
    
    const cto = await Employee.create({
      employeeNumber: 'EMP002',
      name: 'Sarah',
      surname: 'Johnson',
      email: 'sarah.johnson@echelon.com',
      birthDate: '1980-07-22',
      salary: 130000.00,
      role: 'CTO',
      managerId: ceo.id
    });
    
    const cfo = await Employee.create({
      employeeNumber: 'EMP003',
      name: 'Michael',
      surname: 'Brown',
      email: 'michael.brown@echelon.com',
      birthDate: '1978-11-10',
      salary: 120000.00,
      role: 'CFO',
      managerId: ceo.id
    });
    
    const devLead = await Employee.create({
      employeeNumber: 'EMP004',
      name: 'Emma',
      surname: 'Davis',
      email: 'emma.davis@echelon.com',
      birthDate: '1985-05-18',
      salary: 95000.00,
      role: 'Development Lead',
      managerId: cto.id
    });
    
    const dev1 = await Employee.create({
      employeeNumber: 'EMP005',
      name: 'James',
      surname: 'Wilson',
      email: 'james.wilson@echelon.com',
      birthDate: '1990-09-03',
      salary: 75000.00,
      role: 'Software Developer',
      managerId: devLead.id
    });
    
    const dev2 = await Employee.create({
      employeeNumber: 'EMP006',
      name: 'Lisa',
      surname: 'Taylor',
      email: 'lisa.taylor@echelon.com',
      birthDate: '1992-02-14',
      salary: 72000.00,
      role: 'Software Developer',
      managerId: devLead.id
    });
    
    const accountant = await Employee.create({
      employeeNumber: 'EMP007',
      name: 'Robert',
      surname: 'Anderson',
      email: 'robert.anderson@echelon.com',
      birthDate: '1983-12-07',
      salary: 65000.00,
      role: 'Accountant',
      managerId: cfo.id
    });
    
    console.log('Sample data created successfully!');
    console.log(`Created ${await Employee.count()} employees`);
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;