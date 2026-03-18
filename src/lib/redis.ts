import { Redis } from '@upstash/redis'

/**
 * Flow Weaver Redis Client
 * Used for high-speed caching and future job queuing.
 * 
 * NOTE: Requires VITE_UPSTASH_REDIS_REST_URL and VITE_UPSTASH_REDIS_REST_TOKEN in .env
 */

const url = import.meta.env.VITE_UPSTASH_REDIS_REST_URL;
const token = import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN;

// Initialize the Redis client only if credentials exist
export const redis = (url && token)
    ? new Redis({ url, token })
    : null;

/**
 * Utility to cache data with a specific key and TTL (in seconds)
 */
export async function cacheData(key: string, data: any, ttl = 300) {
    if (!redis) return null;
    try {
        console.log(`[Redis] Saving key: ${key}`, data);
        const result = await redis.set(key, data, { ex: ttl });
        console.log(`[Redis] Save result:`, result);
        return result;
    } catch (error) {
        console.error("Redis Cache Error:", error);
        return "ERROR";
    }
}

/**
 * Utility to retrieve cached data
 */
export async function getCachedData<T>(key: string): Promise<T | null | "ERROR"> {
    if (!redis) return null;
    try {
        console.log(`[Redis] Fetching key: ${key}`);
        const data = await redis.get(key);
        console.log(`[Redis] Fetch result:`, data);
        if (data === null || data === undefined) return null;
        return data as T;
    } catch (error) {
        console.error("Redis Fetch Error:", error);
        return "ERROR";
    }
}

/**
 * Utility to invalidate a cache key
 */
export async function invalidateCache(key: string) {
    if (!redis) return null;
    try {
        return await redis.del(key);
    } catch (error) {
        console.warn("Redis Invalidation Error:", error);
        return null;
    }
}
