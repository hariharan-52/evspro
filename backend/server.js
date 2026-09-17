const app = require('./app');
const { testConnection } = require('./config/database');

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server is running on port ${PORT}`);
  await testConnection();
});

module.exports = app;


