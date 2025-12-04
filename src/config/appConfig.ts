interface AppConfig {
    port: number;
    env: string;
    frontendUrl: string;
    jwt: {
        secret: string;
        expiration: string;
    };
    db: {
        databaseUrl: string;
    };
}

const config: AppConfig = {
    // SERVER CONFIG
    port: parseInt(process.env.PORT || '3001', 10),
    env: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

    // JWT CONFIG
    jwt: {
        secret: process.env.JWT_SECRET || 'CHANGE_THIS_SECRET_IN_PRODUCTION',
        expiration: process.env.JWT_EXPIRATION_TIME || '1d',
    },

    // DATABASE CONFIG (Prisma uses this single URL)
    db: {
        databaseUrl: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/konveksi_db_default',
    },
};

export default config;