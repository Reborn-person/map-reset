import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URI || 'redis://localhost:6379'
});

redisClient.on('error', (err: Error) => console.log('Redis Client Error', err));

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Redis Connected');
  } catch (error) {
    console.error('Redis Connection Failed', error);
  }
};

export default redisClient;
