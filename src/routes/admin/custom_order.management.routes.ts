import { Router } from "express";
import { authenticate, checkRole } from "../../middleware/auth.middleware.js";
import customOrderManagementController from "../../controller/admin/custom_order.managaement.controller.js";
const custom_order_management_router = Router();
const allowedRoles: ("Admin" | "Manager")[] = ["Admin", "Manager"];

/**
 * @openapi
 * components:
 *   schemas:
 *     TerimaCustomOrderRequest:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [setuju]
 *           example: "setuju"
 *           description: |
 *             Status harus "setuju" untuk menerima pesanan.
 *             Sistem akan otomatis:
 *             - Mengubah status menjadi NEGOSIASI
 *             - Mengisi admin_id dari JWT token
 *             - Mengisi waktu_terima dengan waktu sekarang
 *     TolakCustomOrderRequest:
 *       type: object
 *       required:
 *         - status
 *         - alasan_ditolak
 *       properties:
 *         status:
 *           type: string
 *           enum: [ditolak]
 *           example: "ditolak"
 *         alasan_ditolak:
 *           type: string
 *           minLength: 10
 *           example: "Stok material tidak mencukupi untuk pesanan ini"
 *           description: Alasan mengapa pesanan ditolak (minimal 10 karakter)
 *     DealNegosiasiRequest:
 *       type: object
 *       required:
 *         - status
 *         - total_harga
 *       properties:
 *         status:
 *           type: string
 *           enum: [deal]
 *           example: "deal"
 *         total_harga:
 *           type: string
 *           pattern: '^\d+$'
 *           example: "5000000"
 *           description: |
 *             Total harga hasil negosiasi (dalam string karena BigInt).
 *             Sistem akan otomatis:
 *             - Mengubah status menjadi PEMBAYARAN
 *             - Update total_harga di order
 *             - Membuat transaksi baru dengan status BELUM_BAYAR
 *     BatalPemesananRequest:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [dibatalkan]
 *           example: "dibatalkan"
 *         alasan_ditolak:
 *           type: string
 *           nullable: true
 *           example: "Customer membatalkan pesanan karena perubahan budget"
 *           description: Alasan pembatalan (opsional)
 */

// ✅ Apply authentication & role check to all routes
custom_order_management_router.use(authenticate, checkRole(allowedRoles));

/**
 * @openapi
 * /api/admin/orders/custom:
 *   get:
 *     tags:
 *       - Custom Orders (Admin)
 *     summary: Get all custom orders (Admin)
 *     description: |
 *       Mendapatkan semua custom order (tidak dibatasi per user).
 *       - Admin/Manager dapat melihat semua orders
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
 *         description: List of all custom orders
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
 *                     $ref: '#/components/schemas/CustomOrder'
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
custom_order_management_router.get("/", customOrderManagementController.getAllCustomOrders);

/**
 * @openapi
 * /api/admin/orders/custom/{id}:
 *   get:
 *     tags:
 *       - Custom Orders (Admin)
 *     summary: Get custom order by ID (Admin)
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
 *         description: Custom order details
 *       404:
 *         $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     tags:
 *       - Custom Orders (Admin)
 *     summary: Update custom order (Admin)
 *     description: Admin dapat update order apapun
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCustomOrderRequest'
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     tags:
 *       - Custom Orders (Admin)
 *     summary: Permanently delete custom order (Admin)
 *     description: |
 *       Menghapus custom order secara permanen dari database (hard delete).
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
 *         description: Order deleted permanently
 *       404:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
custom_order_management_router.get("/:id", customOrderManagementController.getCustomOrderById);
custom_order_management_router.patch("/:id", customOrderManagementController.updateCustomOrder);
custom_order_management_router.delete("/:id", customOrderManagementController.deleteCustomOrder);

/**
 * @openapi
 * /api/admin/orders/custom/{id}/accept:
 *   patch:
 *     tags:
 *       - Custom Orders (Admin)
 *     summary: Accept custom order (Admin)
 *     description: |
 *       Menerima custom order dan memulai proses negosiasi.
 *       
 *       **Proses Otomatis:**
 *       - Status → NEGOSIASI
 *       - admin_id → diisi dari JWT token
 *       - waktu_terima → timestamp sekarang
 *       - Email notification ke customer (opsional)
 *       
 *       **Payload:** `{"status": "setuju"}`
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Custom Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TerimaCustomOrderRequest'
 *     responses:
 *       200:
 *         description: Order berhasil diterima dan masuk tahap negosiasi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Order berhasil diterima dan masuk tahap negosiasi"
 *                 data:
 *                   $ref: '#/components/schemas/CustomOrder'
 *       400:
 *         description: Validation error atau order sudah diproses
 *       404:
 *         description: Order not found
 */
custom_order_management_router.patch("/:id/accept", customOrderManagementController.terimaCustomOrder);

/**
 * @openapi
 * /api/admin/orders/custom/{id}/reject:
 *   patch:
 *     tags:
 *       - Custom Orders (Admin)
 *     summary: Reject custom order (Admin)
 *     description: |
 *       Menolak custom order dengan alasan yang jelas.
 *       
 *       **Proses Otomatis:**
 *       - Status → DITOLAK
 *       - admin_id → diisi dari JWT token
 *       - waktu_tolak → timestamp sekarang
 *       - alasan_ditolak → wajib diisi (min 10 karakter)
 *       - Email notification ke customer (opsional)
 *       
 *       **Payload:** `{"status": "ditolak", "alasan_ditolak": "alasan..."}`
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
 *             $ref: '#/components/schemas/TolakCustomOrderRequest'
 *     responses:
 *       200:
 *         description: Order berhasil ditolak
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Order berhasil ditolak"
 *                 data:
 *                   $ref: '#/components/schemas/CustomOrder'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Order not found
 */
custom_order_management_router.patch("/:id/reject", customOrderManagementController.tolakCustomOrder);

/**
 * @openapi
 * /api/admin/orders/custom/{id}/deal-negosiasi:
 *   patch:
 *     tags:
 *       - Custom Orders (Admin)
 *     summary: Finalize negotiation and create transaction (Admin)
 *     description: |
 *       Menyelesaikan negosiasi dan membuat transaksi pembayaran.
 *       
 *       **Proses Otomatis:**
 *       - Status → PEMBAYARAN
 *       - total_harga → diupdate sesuai hasil negosiasi
 *       - admin_id → diisi dari JWT token
 *       - Buat transaksi baru:
 *         - status: BELUM_BAYAR
 *         - total_harga: sesuai input
 *         - custom_order_id: link ke order ini
 *         - user_id: dari order
 *       - Email notification ke customer dengan detail pembayaran
 *       
 *       **Payload:** `{"status": "deal", "total_harga": "5000000"}`
 *       
 *       **Note:** total_harga berupa string karena tipe BigInt
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
 *             $ref: '#/components/schemas/DealNegosiasiRequest'
 *     responses:
 *       200:
 *         description: Negosiasi berhasil, order masuk tahap pembayaran dan transaksi telah dibuat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Negosiasi berhasil, order masuk tahap pembayaran dan transaksi telah dibuat"
 *                 data:
 *                   $ref: '#/components/schemas/CustomOrder'
 *       400:
 *         description: Validation error atau status order tidak valid
 *       404:
 *         description: Order not found
 */
custom_order_management_router.patch("/:id/deal-negosiasi", customOrderManagementController.dealNegosiasiCustomOrder);

/**
 * @openapi
 * /api/admin/orders/custom/{id}/cancel:
 *   patch:
 *     tags:
 *       - Custom Orders (Admin)
 *     summary: Cancel custom order (Admin)
 *     description: |
 *       Membatalkan custom order dengan atau tanpa alasan.
 *       
 *       **Proses Otomatis:**
 *       - Status → DIBATALKAN
 *       - admin_id → diisi dari JWT token
 *       - alasan_ditolak → opsional
 *       - Email notification ke customer
 *       
 *       **Payload:** `{"status": "dibatalkan", "alasan_ditolak": "alasan (opsional)"}`
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
 *             $ref: '#/components/schemas/BatalPemesananRequest'
 *     responses:
 *       200:
 *         description: Order berhasil dibatalkan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Order berhasil dibatalkan"
 *                 data:
 *                   $ref: '#/components/schemas/CustomOrder'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Order not found
 */
custom_order_management_router.patch("/:id/cancel", customOrderManagementController.batalCustomOrder);

export default custom_order_management_router;