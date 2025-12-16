import { Router } from 'express';
import adminUsersController from '../../controller/admin/users.controller.js';

import { checkRole, authenticate } from '../../middleware/auth.middleware.js';
const admin_user_router = Router();

// use the correct role type so the array is Role[] instead of string[]
/**
 * @openapi
 * tags:
 *   - name: "Users management"
 *     description: User management operations for admins/managers
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         role:
 *           type: object
 *           description: Role relation (id and name)
 *         phone:
 *           type: string
 *           nullable: true
 *         address:
 *           type: string
 *           nullable: true
 *         is_blocked:
 *           type: boolean
 *         is_verified:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *
 *     CreateUserRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - confirmPassword
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *         confirmPassword:
 *           type: string
 *         role:
 *           oneOf:
 *             - type: integer
 *             - type: string
 *           description: role id or role name (optional)
 *         phone:
 *           type: string
 *         address:
 *           type: string
 *         is_blocked:
 *           type: boolean
 *         is_verified:
 *           type: boolean
 *
 *     UpdateUserRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         role:
 *           oneOf:
 *             - type: integer
 *             - type: string
 *         phone:
 *           type: string
 *         address:
 *           type: string
 *         is_blocked:
 *           type: boolean
 *         is_verified:
 *           type: boolean
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *         message:
 *           type: string
 *
 * paths:
 *   /api/admin/users:
 *     get:
 *       tags: ["Users management"]
 *       summary: List users
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: query
 *           name: q
 *           schema:
 *             type: string
 *           description: Full text search across name, email, phone
 *         - in: query
 *           name: role
 *           schema:
 *             oneOf:
 *               - type: integer
 *               - type: string
 *           description: Role id or name
 *         - in: query
 *           name: page
 *           schema:
 *             type: integer
 *         - in: query
 *           name: limit
 *           schema:
 *             type: integer
 *         - in: query
 *           name: sortBy
 *           schema:
 *             type: string
 *         - in: query
 *           name: order
 *           schema:
 *             type: string
 *             enum: [asc, desc]
 *       responses:
 *         '200':
 *           description: Array of users
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/User'
 *         '401':
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *     post:
 *       tags: ["Users management"]
 *       summary: Create user
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateUserRequest'
 *       responses:
 *         '201':
 *           description: Created user
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/User'
 *         '400':
 *           description: Validation error
 *
 *   /api/admin/users/{id}:
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     get:
 *       tags: ["Users management"]
 *       summary: Get user by id
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         '200':
 *           description: User found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/User'
 *         '404':
 *           description: Not found
 *
 *     patch:
 *       tags: ["Users management"]
 *       summary: Update user
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateUserRequest'
 *       responses:
 *         '200':
 *           description: Updated user
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/User'
 *
 *     delete:
 *       tags: ["Users management"]
 *       summary: Delete user
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         '200':
 *           description: Deleted user
 *         '404':
 *           description: Not found
 *
 *   /api/admin/users/{id}/soft-delete:
 *     patch:
 *       tags: ["Users management"]
 *       summary: Soft delete user (mark as deleted)
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         '200':
 *           description: Soft deleted
 *
 *   /api/admin/users/{id}/block:
 *     patch:
 *       tags: ["Users management"]
 *       summary: Block a user
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         '200':
 *           description: User blocked
 *
 *   /api/admin/users/{id}/unblock:
 *     patch:
 *       tags: ["Users management"]
 *       summary: Unblock a user
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         '200':
 *           description: User unblocked
 */

/**
 * Allowed roles for admin user management routes.
 *
 * Update this array to add/remove roles that are allowed to access these routes.
 */
const allowedRoles: ('Admin' | 'Manager')[] = ['Admin', 'Manager'];

admin_user_router.get('/', authenticate, checkRole(allowedRoles), adminUsersController.getAllUsers);
admin_user_router.get('/:id', authenticate, checkRole(allowedRoles), adminUsersController.getUserById);
admin_user_router.post('/', authenticate, checkRole(allowedRoles), adminUsersController.createUser);
admin_user_router.patch('/:id', authenticate, checkRole(allowedRoles), adminUsersController.updateUser);
admin_user_router.delete('/:id', authenticate, checkRole(allowedRoles), adminUsersController.deleteUser);
admin_user_router.patch('/:id/soft-delete', authenticate, checkRole(allowedRoles), adminUsersController.softDeleteUser);
admin_user_router.patch('/:id/block', authenticate, checkRole(allowedRoles), adminUsersController.blockUser);
admin_user_router.patch('/:id/unblock', authenticate, checkRole(allowedRoles), adminUsersController.unblockUser);

export default admin_user_router;