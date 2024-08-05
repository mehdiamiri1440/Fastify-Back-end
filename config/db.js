import dotenv from 'dotenv';
import { Client } from 'pg';

// Configure dotenv to load environment variables
dotenv.config();

const client = new Client({
  connectionString: process.env.DB_URL,
  ssl: process.env.DB_SSL === 'true', // Optional if you use SSL
});

const connectClient = async () => {
  try {
    await client.connect();
    console.log('Connected to the database');
  } catch (err) {
    console.error('Connection error', err.stack);
    console.log('Check the following environment variables:');
    console.log('DB_URL:', process.env.DB_URL);
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_PORT:', process.env.DB_PORT);
    console.log('DB_NAME:', process.env.DB_NAME);
  }
};

export { client, connectClient };
