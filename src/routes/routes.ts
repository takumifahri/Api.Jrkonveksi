import type { Application } from 'express';
import auth_router from "./auth/auth.routes.js";
import contact_router from './user/contact.routes.js';
// import router lain di sini
// import user_router from "./user/user.routes.js";
// import material_router from "./material/material.routes.js";
// import contact_router from "./contact/contact.routes.js";

interface Route {
    path: string;
    router: any;
}

const routes: Record<string, Route> = {
    auth: {
        path: '/auth',
        router: auth_router,
    },
    contact: {
        path: '/contacts',
        router: contact_router
    },
    // Tambahkan route lain di sini
    // user: {
    //     path: '/users',
    //     router: user_router,
    // },
    // material: {
    //     path: '/materials',
    //     router: material_router,
    // },
    // contact: {
    //     path: '/contacts',
    //     router: contact_router,
    // },
};

/**
 * Register all routes to Express app
 * @param app - Express application instance
 * @param prefix - API prefix (default: '/api')
 */
export const registerRoutes = (app: Application, prefix: string = '/api'): void => {
    Object.entries(routes).forEach(([name, route]) => {
        const fullPath = `${prefix}${route.path}`;
        app.use(fullPath, route.router);
        console.log(`✅ Route registered: ${fullPath}`);
    });
};


/**
 * Get all registered routes
 * @param prefix - API prefix
 * @returns Array of route paths
 */
export const getRegisteredRoutes = (prefix: string = '/api'): string[] => {
    return Object.entries(routes).map(([name, route]) => {
        return `${prefix}${route.path}`;
    });
};

/**
 * Display all registered routes in console
 * @param prefix - API prefix
 */
export const displayRoutes = (prefix: string = '/api'): void => {
    console.log('\n📋 Registered Routes:');
    console.log('─'.repeat(50));
    
    Object.entries(routes).forEach(([name, route]) => {
        const fullPath = `${prefix}${route.path}`;
        console.log(`  ${name.padEnd(15)} → ${fullPath}`);
    });
    
    console.log('─'.repeat(50));
    console.log(`Total: ${Object.keys(routes).length} route group(s)\n`);
};
export default routes;