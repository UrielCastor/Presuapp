const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const { errorHandler } = require('./interfaces/middlewares/error.middleware');
const authRoutes = require('./interfaces/routes/auth.routes');
const professionRoutes = require('./interfaces/routes/profession.routes');
const itemRoutes = require('./interfaces/routes/item.routes');
const clientRoutes = require('./interfaces/routes/client.routes');
const budgetRoutes = require('./interfaces/routes/budget.routes');
const professionalRoutes = require('./interfaces/routes/professional.routes');
const paymentRoutes = require('./interfaces/routes/payment.routes');
const adminRoutes = require('./interfaces/routes/admin.routes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Swagger setup
const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Healthcheck
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy', status: 'OK' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/professions', professionRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/professionals', professionalRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
