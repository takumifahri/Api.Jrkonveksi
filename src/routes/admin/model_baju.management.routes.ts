import modelBajuManagementController from "../../controller/admin/model_baju.management.controller.js";
import { Router } from "express";
import { authenticate, checkRole } from "../../middleware/auth.middleware.js";
const model_baju_management_router = Router();
const allowedRoles: ("Admin" | "Manager")[] = ["Admin", "Manager"];

/**
 * @openapi
 * components:
 *   schemas:
 *     ModelBaju:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nama:
 *           type: string
 *           example: "Kemeja Formal"
 *         deskripsi:
 *           type: string
 *           nullable: true
 *           example: "Kemeja formal untuk acara resmi"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateModelBajuRequest:
 *       type: object
 *       required:
 *         - nama
 *       properties:
 *         nama:
 *           type: string
 *           minLength: 1
 *           example: "Kemeja Formal"
 *         deskripsi:
 *           type: string
 *           nullable: true
 *           example: "Kemeja formal untuk acara resmi"
 *     UpdateModelBajuRequest:
 *       type: object
 *       properties:
 *         nama:
 *           type: string
 *           minLength: 1
 *           example: "Kemeja Formal Updated"
 *         deskripsi:
 *           type: string
 *           nullable: true
 *           example: "Deskripsi updated"
 */

// ✅ Apply authentication & role check to all routes
model_baju_management_router.use(authenticate, checkRole(allowedRoles));

/**
 * @openapi
 * /api/admin/model-baju:
 *   get:
 *     tags:
 *       - Model Baju (Admin)
 *     summary: Get all model baju (Admin)
 *     description: |
 *       Mendapatkan semua model baju.
 *       - Admin/Manager dapat melihat semua model baju
 *       - Support search, pagination, dan sorting
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: List of all model baju
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ModelBaju'
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     tags:
 *       - Model Baju (Admin)
 *     summary: Create new model baju (Admin)
 *     description: Admin dapat membuat model baju baru
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateModelBajuRequest'
 *     responses:
 *       201:
 *         description: Model baju created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ModelBaju'
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
model_baju_management_router.get("/", modelBajuManagementController.getAllModelBaju);
model_baju_management_router.post("/", modelBajuManagementController.createModelBaju);

/**
 * @openapi
 * /api/admin/model-baju/{id}:
 *   get:
 *     tags:
 *       - Model Baju (Admin)
 *     summary: Get model baju by ID (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Model baju details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ModelBaju'
 *       404:
 *         $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     tags:
 *       - Model Baju (Admin)
 *     summary: Update model baju (Admin)
 *     description: Admin dapat update model baju
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateModelBajuRequest'
 *     responses:
 *       200:
 *         description: Model baju updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ModelBaju'
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     tags:
 *       - Model Baju (Admin)
 *     summary: Permanently delete model baju (Admin)
 *     description: |
 *       Menghapus model baju secara permanen dari database (hard delete).
 *       ⚠️ **WARNING**: Data tidak dapat dikembalikan setelah dihapus!
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Model baju deleted permanently
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ModelBaju'
 *       404:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
model_baju_management_router.get("/:id", modelBajuManagementController.getModelBajuById);
model_baju_management_router.patch("/:id", modelBajuManagementController.updateModelBaju);
model_baju_management_router.delete("/:id", modelBajuManagementController.deleteModelBaju);

/**
 * @openapi
 * /api/admin/model-baju/{id}/soft-delete:
 *   patch:
 *     tags:
 *       - Model Baju (Admin)
 *     summary: Soft delete model baju (Admin)
 *     description: |
 *       Menandai model baju sebagai dihapus tanpa menghapus data dari database (soft delete).
 *       Data tetap tersimpan dan dapat dikembalikan jika diperlukan.
 *       
 *       **Proses:**
 *       - Menandai model baju sebagai deleted (misalnya set deletedAt timestamp)
 *       - Data tidak hilang dari database
 *       - Audit log tercatat
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Model Baju ID
 *     responses:
 *       200:
 *         description: Model baju berhasil di-soft delete
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Model baju soft deleted successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ModelBaju'
 *       404:
 *         description: Model baju not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
model_baju_management_router.patch("/:id/soft-delete", modelBajuManagementController.softDeleteModelBaju);

export default model_baju_management_router;