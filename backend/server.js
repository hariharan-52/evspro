const app = require('./app');
const { testConnection } = require('./config/database');

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await testConnection();
});

