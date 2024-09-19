import { Redis } from "ioredis";
require('dotenv').config()


const ConnectRedis = () => {

    if(process.env.REDIS_URI){
        return process.env.REDIS_URI
    }

    throw new Error('Redis is not connected')
}

// export const redis = new Redis(process.env.REDIS_URI || '')
export const redis = new Redis(ConnectRedis())