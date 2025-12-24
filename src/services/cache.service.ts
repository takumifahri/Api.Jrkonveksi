import NodeCache from 'node-cache';
import { logInfo, logError, logWarn } from '../utils/logger.js';
import { CACHE_TTL, CACHE_KEY } from '../utils/cache.js';
interface CacheOptions {
    ttl?: number;
    checkperiod?: number;
}

class CacheService {
    private cache: NodeCache;
    private defaultTTL: number = CACHE_TTL.FREQUENT.USER_PROFILE; // 5 min default

    constructor(options?: CacheOptions) {
        this.cache = new NodeCache({
            stdTTL: options?.ttl || this.defaultTTL,
            checkperiod: options?.checkperiod || 600,
            useClones: false
        });

        logInfo('CacheService initialized', {
            defaultTTL: this.defaultTTL,
            checkperiod: options?.checkperiod || 600
        });
    }

    /**
     * Get value from cache
     */
    get<T>(key: string): T | undefined {
        try {
            const value = this.cache.get<T>(key);
            if (value !== undefined) {
                logInfo('Cache hit', { key });
            } else {
                logInfo('Cache miss', { key });
            }
            return value;
        } catch (error: any) {
            logError('Error getting from cache', { key, error: error?.message });
            return undefined;
        }
    }

    /**
     * Set value to cache
     */
    set<T>(key: string, value: T, ttl?: number): boolean {
        try {
            const actualTTL = ttl || this.defaultTTL;
            const success = this.cache.set(key, value, actualTTL);
            if (success) {
                logInfo('Cache set', { 
                    key, 
                    ttl: actualTTL,
                    expiresAt: new Date(Date.now() + actualTTL * 1000).toISOString()
                });
            } else {
                logWarn('Failed to set cache', { key });
            }
            return success;
        } catch (error: any) {
            logError('Error setting cache', { key, error: error?.message });
            return false;
        }
    }

    /**
     * Delete specific key from cache
     */
    delete(key: string): number {
        try {
            const deletedCount = this.cache.del(key);
            logInfo('Cache deleted', { key, deletedCount });
            return deletedCount;
        } catch (error: any) {
            logError('Error deleting cache', { key, error: error?.message });
            return 0;
        }
    }

    /**
     * Delete multiple keys
     */
    deleteMany(keys: string[]): number {
        try {
            const deletedCount = this.cache.del(keys);
            logInfo('Multiple cache keys deleted', { keys, deletedCount });
            return deletedCount;
        } catch (error: any) {
            logError('Error deleting multiple cache keys', { keys, error: error?.message });
            return 0;
        }
    }

    /**
     * Delete keys matching a pattern
     */
    deletePattern(pattern: string): number {
        try {
            const keys = this.cache.keys();
            const matchingKeys = keys.filter(key => key.includes(pattern));
            const deletedCount = this.cache.del(matchingKeys);
            logInfo('Cache pattern deleted', { pattern, matchingKeys, deletedCount });
            return deletedCount;
        } catch (error: any) {
            logError('Error deleting cache pattern', { pattern, error: error?.message });
            return 0;
        }
    }

    /**
     * Flush all cache
     */
    flushAll(): void {
        try {
            this.cache.flushAll();
            logInfo('All cache flushed');
        } catch (error: any) {
            logError('Error flushing cache', { error: error?.message });
        }
    }

    /**
     * Get all cache keys
     */
    keys(): string[] {
        return this.cache.keys();
    }

    /**
     * Get cache statistics
     */
    stats() {
        return this.cache.getStats();
    }

    /**
     * Check if key exists
     */
    has(key: string): boolean {
        return this.cache.has(key);
    }

    /**
     * Get TTL for a key (returns timestamp)
     */
    getTTL(key: string): number | undefined {
        return this.cache.getTtl(key);
    }

    /**
     * Update TTL for a key
     */
    setTTL(key: string, ttl: number): boolean {
        return this.cache.ttl(key, ttl);
    }
}

// ✅ Export singleton with optimized default
export default new CacheService({
    ttl: CACHE_TTL.FREQUENT.USER_PROFILE,  // 5 min default
    checkperiod: 600                        // Check every 10 min
});

// ✅ Export CACHE_TTL and CACHE_KEY for easy access
export { CACHE_TTL, CACHE_KEY };