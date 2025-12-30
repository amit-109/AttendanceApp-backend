const express = require('express');
const { Sequelize } = require('sequelize');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Connect to MySQL
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

// Test the connection
sequelize.authenticate()
  .then(() => console.log('MySQL connected'))
  .catch(err => console.error('MySQL connection error:', err));

// Import models
const User = require('./models/User')(sequelize);
const Attendance = require('./models/Attendance')(sequelize);
const Leave = require('./models/Leave')(sequelize);

// Define associations
User.hasMany(Attendance, { foreignKey: 'employeeId', as: 'attendances' });
Attendance.belongsTo(User, { foreignKey: 'employeeId', as: 'employee' });

User.hasMany(Leave, { foreignKey: 'employeeId', as: 'leaves' });
Leave.belongsTo(User, { foreignKey: 'employeeId', as: 'employee' });

Leave.belongsTo(User, { foreignKey: 'approvedById', as: 'approver' });
User.hasMany(Leave, { foreignKey: 'approvedById', as: 'approvedLeaves' });

// Sync database
sequelize.sync({ alter: true })
  .then(() => console.log('Database synced'))
  .catch(err => console.error('Database sync error:', err));

// Make sequelize available in routes
app.set('sequelize', sequelize);
app.set('models', { User, Attendance, Leave });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/employee', require('./routes/employee'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
