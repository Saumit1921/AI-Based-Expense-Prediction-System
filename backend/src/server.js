import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`API endpoints accessible at http://localhost:${PORT}/api`);
  console.log(`=================================================`);
});
