/**
 * Cache TTL Configuration (in seconds)
 * Adjust based on your application's data update frequency
 */
export const CACHE_TTL = {
    // Real-time data (30-60 seconds)
    REALTIME: {
        DASHBOARD_STATS: 30,
        ORDER_STATUS_CHECK: 45,
        NOTIFICATION_COUNT: 30,
        ACTIVE_TRANSACTIONS: 60,
    },

    // Frequently updated (2-5 minutes)
    FREQUENT: {
        USER_PROFILE: 300,              // 5 min
        CUSTOM_ORDER_DETAIL: 120,       // 2 min
        CUSTOM_ORDERS_LIST: 180,        // 3 min
        MY_ORDERS: 120,                 // 2 min
        TRANSACTION_DETAIL: 180,        // 3 min
        USER_NOTIFICATIONS: 240,        // 4 min
    },

    // Moderately updated (10-30 minutes)
    MODERATE: {
        PRODUCT_LIST: 600,              // 10 min
        MATERIAL_LIST: 900,             // 15 min
        MODEL_BAJU_LIST: 900,           // 15 min
        SEARCH_RESULTS: 600,            // 10 min
        CATEGORY_LIST: 1800,            // 30 min
    },

    // Rarely updated (1-24 hours)
    STATIC: {
        APP_SETTINGS: 3600,             // 1 hour
        PAYMENT_METHODS: 7200,          // 2 hours
        SHIPPING_OPTIONS: 7200,         // 2 hours
        STATIC_CONTENT: 86400,          // 24 hours
    }
} as const;

/**
 * Cache key prefix untuk organization
 */
export const CACHE_KEY = {
    USER: (id: number) => `user:${id}`,
    CUSTOM_ORDER: (id: number) => `custom_order:${id}`,
    CUSTOM_ORDERS_USER: (userId: number, filters: string) => 
        `custom_orders:user:${userId}:${filters}`,
    PRODUCT: (id: number) => `product:${id}`,
    PRODUCTS: (filters: string) => `products:${filters}`,
    MATERIALS: 'materials:all',
    MODEL_BAJU: 'model_baju:all',
    DASHBOARD: (userId: number) => `dashboard:user:${userId}`,
} as const;