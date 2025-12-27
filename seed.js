const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Attendance = require('./models/Attendance');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Attendance.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      name: 'System Administrator',
      email: 'admin@company.com',
      password: adminPassword,
      role: 'admin',
      isActive: true
    });
    await admin.save();
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
      const employee = new User(emp);
      await employee.save();
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
        employee: createdEmployees[0]._id, // John Doe
        date: today,
        checkIn: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9 AM
        checkOut: new Date(today.getTime() + 17 * 60 * 60 * 1000), // 5 PM
        location: { latitude: 12.9716, longitude: 77.5946 },
        status: 'present'
      },
      {
        employee: createdEmployees[1]._id, // Jane Smith
        date: today,
        checkIn: new Date(today.getTime() + 8.5 * 60 * 60 * 1000), // 8:30 AM
        location: { latitude: 12.9716, longitude: 77.5946 },
        status: 'present'
        // No checkOut - still working
      },
      // Yesterday's attendance
      {
        employee: createdEmployees[0]._id,
        date: yesterday,
        checkIn: new Date(yesterday.getTime() + 9 * 60 * 60 * 1000),
        checkOut: new Date(yesterday.getTime() + 17.5 * 60 * 60 * 1000),
        location: { latitude: 12.9716, longitude: 77.5946 },
        status: 'present'
      },
      {
        employee: createdEmployees[1]._id,
        date: yesterday,
        checkIn: new Date(yesterday.getTime() + 9.5 * 60 * 60 * 1000),
        checkOut: new Date(yesterday.getTime() + 16.5 * 60 * 60 * 1000),
        location: { latitude: 12.9716, longitude: 77.5946 },
        status: 'present'
      },
      {
        employee: createdEmployees[2]._id,
        date: yesterday,
        checkIn: new Date(yesterday.getTime() + 10 * 60 * 60 * 1000), // Late
        checkOut: new Date(yesterday.getTime() + 18 * 60 * 60 * 1000),
        location: { latitude: 12.9716, longitude: 77.5946 },
        status: 'late'
      },
      // Last week's attendance
      {
        employee: createdEmployees[0]._id,
        date: lastWeek,
        checkIn: new Date(lastWeek.getTime() + 9 * 60 * 60 * 1000),
        checkOut: new Date(lastWeek.getTime() + 17 * 60 * 60 * 1000),
        location: { latitude: 12.9716, longitude: 77.5946 },
        status: 'present'
      },
      {
        employee: createdEmployees[1]._id,
        date: lastWeek,
        checkIn: new Date(lastWeek.getTime() + 8 * 60 * 60 * 1000),
        checkOut: new Date(lastWeek.getTime() + 16 * 60 * 60 * 1000),
        location: { latitude: 12.9716, longitude: 77.5946 },
        status: 'present'
      }
    ];

    for (const record of attendanceData) {
      const attendance = new Attendance(record);
      await attendance.save();
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
    mongoose.connection.close();
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
