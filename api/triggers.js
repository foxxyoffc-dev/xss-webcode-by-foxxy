import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    try {
        const triggersRaw = await redis.lrange('xss_triggers', 0, 99);
        const triggers = triggersRaw.map(item => {
            try {
                return JSON.parse(item);
            } catch(e) {
                return { raw: item };
            }
        });
        res.status(200).json({ triggers });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
