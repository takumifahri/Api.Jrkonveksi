import MaterialsManagementController from '../../controller/admin/material.controller.js';
import { Router } from 'express';
import { checkRole, authenticate } from '../../middleware/auth.middleware.js';
const material_router = Router();

// use the correct role type so the array is Role[] instead of string[]
const allowedRoles: ('Admin' | 'Manager')[] = ['Admin', 'Manager'];

/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Material:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         unique_id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         quantity:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [AVAILABLE, UNAVAILABLE, PENDING]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateMaterialRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         quantity:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [AVAILABLE, UNAVAILABLE, PENDING]
 *     UpdateMaterialRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         quantity:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [AVAILABLE, UNAVAILABLE, PENDING]
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *         message:
 *           type: string
 */

/**
 * @openapi
 * /api/admin/materials:
 *   get:
 *     tags:
 *       - Materials (Admin)
 *     summary: Get all materials
 *     responses:
 *       200:
 *         description: List of materials
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Material'
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     tags:
 *       - Materials (Admin)
 *     summary: Create a new material
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMaterialRequest'
 *     responses:
 *       201:
 *         description: Material created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Material'
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /api/admin/materials/{id}:
 *   get:
 *     tags:
 *       - Materials (Admin)
 *     summary: Get material by id
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Material id
 *     responses:
 *       200:
 *         description: Material data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Material'
 *       404:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     tags:
 *       - Materials (Admin)
 *     summary: Update material (partial)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Material id
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMaterialRequest'
 *     responses:
 *       200:
 *         description: Updated material
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Material'
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     tags:
 *       - Materials (Admin)
 *     summary: Permanently delete a material (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Material id
 *     responses:
 *       200:
 *         description: Deletion result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /api/admin/materials/{id}/soft-delete:
 *   patch:
 *     tags:
 *       - Materials (Admin)
 *     summary: Soft delete a material (mark as deleted)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Material id
 *     responses:
 *       200:
 *         description: Soft delete result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */

material_router.get("/", MaterialsManagementController.getAllMaterials);
material_router.get("/:id", MaterialsManagementController.getMaterialById);

// Protected routes for Admin and Manager
material_router.post("/", authenticate, checkRole(allowedRoles), MaterialsManagementController.createMaterial);
material_router.patch("/:id", authenticate, checkRole(allowedRoles), MaterialsManagementController.updateMaterial);

// Soft delete accessible to Admin and Manager (use patch to soft delete)
material_router.patch("/:id/soft-delete", authenticate, checkRole(allowedRoles), MaterialsManagementController.softDeleteMaterial);

// Permanent delete restricted to Admin only
material_router.delete("/:id", authenticate, checkRole(['Admin', 'Manager']), MaterialsManagementController.deleteMaterial);

export default material_router;