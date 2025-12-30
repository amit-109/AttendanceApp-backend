const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Initialize Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false
  }
);

// Import models
const User = require('./models/User')(sequelize);
const Attendance = require('./models/Attendance')(sequelize);
const Leave = require('./models/Leave')(sequelize);

const seedDatabase = async () => {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('Connected to MySQL');

    // Sync database (this will create tables if they don't exist)
    await sequelize.sync({ force: true }); // force: true will drop existing tables
    console.log('Database synced');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@company.com',
      password: adminPassword,
      role: 'admin',
      isActive: true
    });
    console.log('Admin user created:', admin.email);

    // Create sample employees
    const employees = [
      {
        name: 'John Doe',
        email: 'john.doe@company.com',
        password: await bcrypt.hash('emp123', 10),
        role: 'employee',
        isActive: true
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@company.com',
        password: await bcrypt.hash('emp456', 10),
        role: 'employee',
        isActive: true
      },
      {
        name: 'Bob Johnson',
        email: 'bob.johnson@company.com',
        password: await bcrypt.hash('emp789', 10),
        role: 'employee',
        isActive: true
      },
      {
        name: 'Alice Brown',
        email: 'alice.brown@company.com',
        password: await bcrypt.hash('emp101', 10),
        role: 'employee',
        isActive: false // Inactive employee for testing
      }
    ];

    const createdEmployees = [];
    for (const emp of employees) {
      const employee = await User.create(emp);
      createdEmployees.push(employee);
      console.log('Employee created:', employee.email);
    }

    // Create sample attendance records
    const attendanceRecords = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Yesterday's attendance
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Last week's attendance
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Sample attendance data
    const attendanceData = [
      // Today's attendance
      {
        employeeId: createdEmployees[0].id, // John Doe
        date: today,
        checkIn: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9 AM
        checkOut: new Date(today.getTime() + 17 * 60 * 60 * 1000), // 5 PM
        latitude: 12.9716,
        longitude: 77.5946,
        status: 'present'
      },
      {
        employeeId: createdEmployees[1].id, // Jane Smith
        date: today,
        checkIn: new Date(today.getTime() + 8.5 * 60 * 60 * 1000), // 8:30 AM
        latitude: 12.9716,
        longitude: 77.5946,
        status: 'present'
        // No checkOut - still working
      },
      // Yesterday's attendance
      {
        employeeId: createdEmployees[0].id,
        date: yesterday,
        checkIn: new Date(yesterday.getTime() + 9 * 60 * 60 * 1000),
        checkOut: new Date(yesterday.getTime() + 17.5 * 60 * 60 * 1000),
        latitude: 12.9716,
        longitude: 77.5946,
        status: 'present'
      },
      {
        employeeId: createdEmployees[1].id,
        date: yesterday,
        checkIn: new Date(yesterday.getTime() + 9.5 * 60 * 60 * 1000),
        checkOut: new Date(yesterday.getTime() + 16.5 * 60 * 60 * 1000),
        latitude: 12.9716,
        longitude: 77.5946,
        status: 'present'
      },
      {
        employeeId: createdEmployees[2].id,
        date: yesterday,
        checkIn: new Date(yesterday.getTime() + 10 * 60 * 60 * 1000), // Late
        checkOut: new Date(yesterday.getTime() + 18 * 60 * 60 * 1000),
        latitude: 12.9716,
        longitude: 77.5946,
        status: 'late'
      },
      // Last week's attendance
      {
        employeeId: createdEmployees[0].id,
        date: lastWeek,
        checkIn: new Date(lastWeek.getTime() + 9 * 60 * 60 * 1000),
        checkOut: new Date(lastWeek.getTime() + 17 * 60 * 60 * 1000),
        latitude: 12.9716,
        longitude: 77.5946,
        status: 'present'
      },
      {
        employeeId: createdEmployees[1].id,
        date: lastWeek,
        checkIn: new Date(lastWeek.getTime() + 8 * 60 * 60 * 1000),
        checkOut: new Date(lastWeek.getTime() + 16 * 60 * 60 * 1000),
        latitude: 12.9716,
        longitude: 77.5946,
        status: 'present'
      }
    ];

    for (const record of attendanceData) {
      const attendance = await Attendance.create(record);
      attendanceRecords.push(attendance);
    }

    console.log(`Created ${attendanceRecords.length} attendance records`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📊 Sample Data Summary:');
    console.log('------------------------');
    console.log('Admin User:');
    console.log('  Email: admin@company.com');
    console.log('  Password: admin123');
    console.log('\nEmployee Users:');
    createdEmployees.forEach((emp, index) => {
      if (emp.role === 'employee') {
        console.log(`  ${index + 1}. ${emp.name}`);
        console.log(`     Email: ${emp.email}`);
        console.log(`     Password: emp${123 + index * 333}`);
        console.log(`     Active: ${emp.isActive}`);
      }
    });

    console.log(`\n📋 Total Records:`);
    console.log(`  Users: ${createdEmployees.length + 1} (1 admin + ${createdEmployees.length} employees)`);
    console.log(`  Attendance Records: ${attendanceRecords.length}`);

    console.log('\n🚀 You can now test the APIs using the Postman collection!');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await sequelize.close();
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
