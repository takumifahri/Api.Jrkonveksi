import { Router } from "express";
import { authenticate, checkRole } from "../../middleware/auth.middleware.js";
import customOrderController from "../../controller/user/custom_order.controller.js";

const custom_order_router = Router();
const allowedRoles: ("Admin" | "Manager")[] = ["Admin", "Manager"];

/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     CustomOrder:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         unique_id:
 *           type: string
 *         nama_pemesanan:
 *           type: string
 *         ukuran:
 *           type: string
 *           enum: [extra_small, small, medium, reguler, large, extra_large, double_extra_large, custom]
 *         jumlah_barang:
 *           type: integer
 *         warna:
 *           type: string
 *         total_harga:
 *           type: string
 *           description: BigInt value as string
 *         status:
 *           type: string
 *           enum: [pending, ditolak, negosiasi, pembayaran, pengerjaan, dibatalkan, selesai]
 *         user_id:
 *           type: integer
 *         admin_id:
 *           type: integer
 *           nullable: true
 *         catatan:
 *           type: string
 *           nullable: true
 *         material_sendiri:
 *           type: boolean
 *         material_id:
 *           type: integer
 *           nullable: true
 *         diterima_pada:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         ditolak_pada:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         alasan_ditolak:
 *           type: string
 *           nullable: true
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
 *     CreateCustomOrderRequest:
 *       type: object
 *       required:
 *         - nama_pemesanan
 *         - ukuran
 *         - jumlah_barang
 *       properties:
 *         nama_pemesanan:
 *           type: string
 *           description: Nama pemesanan konveksi
 *           example: "Kaos Polo Custom"
 *         ukuran:
 *           type: string
 *           enum: [extra_small, small, medium, reguler, large, extra_large, double_extra_large, custom]
 *           example: "medium"
 *         jumlah_barang:
 *           type: integer
 *           minimum: 1
 *           example: 50
 *         warna:
 *           type: string
 *           example: "Merah"
 *         catatan:
 *           type: string
 *           nullable: true
 *           example: "Logo di dada kiri"
 *         material_sendiri:
 *           type: boolean
 *           default: false
 *         material_id:
 *           type: integer
 *           nullable: true
 *     UpdateCustomOrderRequest:
 *       type: object
 *       properties:
 *         nama_pemesanan:
 *           type: string
 *         ukuran:
 *           type: string
 *           enum: [extra_small, small, medium, reguler, large, extra_large, double_extra_large, custom]
 *         jumlah_barang:
 *           type: integer
 *         warna:
 *           type: string
 *         catatan:
 *           type: string
 *         material_sendiri:
 *           type: boolean
 *         material_id:
 *           type: integer
 *     TerimaCustomOrderRequest:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [setuju]
 *           example: "setuju"
 *           description: Status harus "setuju" untuk menerima pesanan. Sistem akan otomatis mengubah status menjadi NEGOSIASI dan mengisi admin_id serta waktu_terima.
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
 *           example: "Stok material tidak mencukupi"
 *           description: Alasan mengapa pesanan ditolak
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
 *           example: "5000000"
 *           description: Total harga hasil negosiasi (dalam string karena BigInt). Status akan berubah menjadi PENGERJAAN dan transaksi akan dibuat otomatis.
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
 *           example: "Customer membatalkan pesanan"
 *           description: Alasan pembatalan (opsional)
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
 * /api/orders/custom:
 *   get:
 *     tags:
 *       - Custom Orders
 *     summary: Get list of custom orders
 *     description: Mendapatkan daftar semua custom order dengan dukungan pencarian, pagination, dan sorting
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query (nama_pemesanan, unique_id, warna)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 25
 *         description: Items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of custom orders
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
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     tags:
 *       - Custom Orders
 *     summary: Create a new custom order
 *     description: Membuat custom order baru. user_id diambil otomatis dari token, status otomatis PENDING.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCustomOrderRequest'
 *     responses:
 *       201:
 *         description: Custom order berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/CustomOrder'
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
custom_order_router.get("/", customOrderController.getAllCustomOrders);
custom_order_router.post("/", authenticate, customOrderController.createCustomOrder);

/**
 * @openapi
 * /api/orders/custom/{id}:
 *   get:
 *     tags:
 *       - Custom Orders
 *     summary: Get custom order by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Custom Order ID
 *     responses:
 *       200:
 *         description: Custom order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/CustomOrder'
 *       404:
 *         $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     tags:
 *       - Custom Orders
 *     summary: Update custom order
 *     description: Update custom order (partial update). Hanya user pemilik atau admin yang dapat update.
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
 *         description: Custom order berhasil diupdate
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/CustomOrder'
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     tags:
 *       - Custom Orders (Admin)
 *     summary: Permanently delete custom order
 *     description: Menghapus custom order secara permanen dari database. Hanya Admin/Manager.
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
 *         description: Custom order berhasil dihapus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/CustomOrder'
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
custom_order_router.get("/:id", customOrderController.getCustomOrderById);
custom_order_router.patch("/:id", authenticate, customOrderController.updateCustomOrder);
custom_order_router.delete("/:id", authenticate, checkRole(allowedRoles), customOrderController.deleteCustomOrder);

/**
 * @openapi
 * /api/orders/custom/{id}/soft-delete:
 *   patch:
 *     tags:
 *       - Custom Orders
 *     summary: Soft delete custom order
 *     description: Menandai custom order sebagai terhapus (soft delete) dengan mengisi deletedAt
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
 *         description: Custom order berhasil di-soft delete
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/CustomOrder'
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
custom_order_router.patch("/:id/soft-delete", authenticate, customOrderController.softDeleteCustomOrder);

/**
 * @openapi
 * /api/orders/custom/{id}/accept:
 *   patch:
 *     tags:
 *       - Custom Orders (Admin)
 *     summary: Terima custom order (Admin)
 *     description: |
 *       Menerima custom order dan mengubah status menjadi NEGOSIASI.
 *       - Status otomatis berubah menjadi NEGOSIASI
 *       - admin_id otomatis diisi dari token
 *       - waktu_terima otomatis diisi dengan waktu sekarang
 *       - updatedAt otomatis diupdate
 *       
 *       Payload hanya perlu berisi: `{"status": "setuju"}`
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
 *         $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
custom_order_router.patch("/:id/accept", authenticate, checkRole(allowedRoles), customOrderController.terimaCustomOrder);

/**
 * @openapi
 * /api/orders/custom/{id}/reject:
 *   patch:
 *     tags:
 *       - Custom Orders (Admin)
 *     summary: Tolak custom order (Admin)
 *     description: |
 *       Menolak custom order dengan alasan tertentu.
 *       - Status otomatis berubah menjadi DITOLAK
 *       - admin_id otomatis diisi dari token
 *       - waktu_tolak otomatis diisi dengan waktu sekarang
 *       - alasan_ditolak wajib diisi
 *       - updatedAt otomatis diupdate
 *       
 *       Payload: `{"status": "ditolak", "alasan_ditolak": "alasan..."}`
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
 *         $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
custom_order_router.patch("/:id/reject", authenticate, checkRole(allowedRoles), customOrderController.tolakCustomOrder);

/**
 * @openapi
 * /api/orders/custom/{id}/deal-negosiasi:
 *   patch:
 *     tags:
 *       - Custom Orders (Admin)
 *     summary: Deal negosiasi dan buat transaksi (Admin)
 *     description: |
 *       Menyetujui hasil negosiasi dan memulai pengerjaan order.
 *       - Status otomatis berubah menjadi PENGERJAAN
 *       - total_harga diupdate sesuai hasil negosiasi
 *       - admin_id otomatis diisi dari token
 *       - Transaksi baru otomatis dibuat dengan status BELUM_BAYAR
 *       - updatedAt otomatis diupdate
 *       
 *       Payload: `{"status": "deal", "total_harga": "5000000"}`
 *       
 *       Note: total_harga berupa string karena tipe BigInt
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
 *         description: Negosiasi berhasil, order masuk tahap pengerjaan dan transaksi telah dibuat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Negosiasi berhasil, order masuk tahap pengerjaan dan transaksi telah dibuat"
 *                 data:
 *                   $ref: '#/components/schemas/CustomOrder'
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
custom_order_router.patch("/:id/deal-negosiasi", authenticate, checkRole(allowedRoles), customOrderController.dealNegosiasiCustomOrder);

/**
 * @openapi
 * /api/orders/custom/{id}/cancel:
 *   patch:
 *     tags:
 *       - Custom Orders (Admin)
 *     summary: Batalkan custom order (Admin)
 *     description: |
 *       Membatalkan custom order dengan atau tanpa alasan.
 *       - Status otomatis berubah menjadi DIBATALKAN
 *       - admin_id otomatis diisi dari token
 *       - alasan_ditolak opsional (dapat diisi jika ada alasan pembatalan)
 *       - updatedAt otomatis diupdate
 *       
 *       Payload: `{"status": "dibatalkan", "alasan_ditolak": "alasan... (opsional)"}`
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
 *         $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
custom_order_router.patch("/:id/cancel", authenticate, checkRole(allowedRoles), customOrderController.batalCustomOrder);

export default custom_order_router;