require('dotenv').config();
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
