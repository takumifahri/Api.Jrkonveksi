/**
 * Helper function to convert BigInt values to string in an object
 */
export function serializeBigInt<T>(obj: T): T {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (typeof obj === 'bigint') {
        return String(obj) as unknown as T;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => serializeBigInt(item)) as unknown as T;
    }

    if (typeof obj === 'object') {
        const serialized: any = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                serialized[key] = serializeBigInt(obj[key]);
            }
        }
        return serialized;
    }

    return obj;
}

/**
 * JSON.stringify replacer function for BigInt
 */
export const bigIntReplacer = (_key: string, value: any) => {
    return typeof value === 'bigint' ? value.toString() : value;
};