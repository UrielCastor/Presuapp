require('dotenv').config();

const missingVars = [];
if (!process.env.MP_ACCESS_TOKEN) missingVars.push('MP_ACCESS_TOKEN');
if (!process.env.FRONTEND_URL) missingVars.push('FRONTEND_URL');
if (!process.env.BACKEND_URL) missingVars.push('BACKEND_URL');

if (missingVars.length > 0) {
  console.warn(`\x1b[33m%s\x1b[0m`, `[CONFIG WARN]: Faltan variables de entorno críticas: ${missingVars.join(', ')}. La integración de Mercado Pago no funcionará correctamente.`);
}

const app = require('./app');
require('./infrastructure/cron/membershipCron');

const PORT = process.env.PORT || 8080;

const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
