import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async (req, res) => {
    // Ambil semua trigger dari Redis (list)
    const triggersRaw = await redis.lrange('xss_triggers', 0, 99);
    const triggers = triggersRaw.map(item => {
        try {
            return JSON.parse(item);
        } catch(e) {
            return { raw: item };
        }
    });
    res.status(200).json({ triggers });
};
