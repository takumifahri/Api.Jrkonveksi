import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import customOrderController from "../../controller/user/custom_order.controller.js";

const custom_order_router = Router();

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
 *           enum: [EXTRA_SMALL, SMALL, MEDIUM, REGULER, LARGE, EXTRA_LARGE, DOUBLE_EXTRA_LARGE, CUSTOM]
 *         jumlah_barang:
 *           type: integer
 *         warna:
 *           type: string
 *         total_harga:
 *           type: string
 *           description: BigInt value as string
 *         status:
 *           type: string
 *           enum: [PENDING, DITOLAK, NEGOSIASI, PEMBAYARAN, PENGERJAAN, DIBATALKAN, SELESAI]
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
 *         model_baju_id:
 *           type: integer
 *           nullable: true
 *         referensi_custom:
 *           type: boolean
 *         file_referensi_custom:
 *           type: string
 *           nullable: true
 *         waktu_terima:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         waktu_tolak:
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
 *         - material_sendiri
 *         - referensi_custom
 *       properties:
 *         nama_pemesanan:
 *           type: string
 *           description: Nama pemesanan konveksi
 *           example: "Kaos Polo Custom"
 *         ukuran:
 *           type: string
 *           enum: [EXTRA_SMALL, SMALL, MEDIUM, REGULER, LARGE, EXTRA_LARGE, DOUBLE_EXTRA_LARGE, CUSTOM]
 *           example: "MEDIUM"
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
 *           description: Apakah customer membawa material sendiri?
 *           example: false
 *         material_id:
 *           type: integer
 *           nullable: true
 *           description: Required jika material_sendiri = false
 *           example: 1
 *         referensi_custom:
 *           type: boolean
 *           description: Apakah menggunakan desain custom?
 *           example: false
 *         file_referensi_custom:
 *           type: string
 *           nullable: true
 *           description: Required jika referensi_custom = true (URL file)
 *           example: "https://example.com/design.png"
 *         model_baju_id:
 *           type: integer
 *           nullable: true
 *           description: Required jika referensi_custom = false
 *           example: 2
 *     UpdateCustomOrderRequest:
 *       type: object
 *       properties:
 *         nama_pemesanan:
 *           type: string
 *         ukuran:
 *           type: string
 *           enum: [EXTRA_SMALL, SMALL, MEDIUM, REGULER, LARGE, EXTRA_LARGE, DOUBLE_EXTRA_LARGE, CUSTOM]
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
 *         referensi_custom:
 *           type: boolean
 *         file_referensi_custom:
 *           type: string
 *         model_baju_id:
 *           type: integer
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *           example: 400
 *         message:
 *           type: string
 *           example: "Error message"
 */

/**
 * @openapi
 * /api/orders/custom:
 *   get:
 *     tags:
 *       - Custom Orders (User)
 *     summary: Get my custom orders
 *     description: |
 *       Mendapatkan daftar custom order milik user yang sedang login.
 *       - Tanpa auth: return semua orders (untuk public view)
 *       - Dengan auth: hanya return orders milik user tersebut
 *       - Support search, pagination, dan sorting
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query (nama_pemesanan, unique_id, warna)
 *         example: "Kaos Polo"
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
 *           maximum: 100
 *           default: 25
 *         description: Items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by (createdAt, nama_pemesanan, status, etc.)
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
 *                   example: "Custom orders retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CustomOrder'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     tags:
 *       - Custom Orders (User)
 *     summary: Create a new custom order
 *     description: |
 *       Membuat custom order baru.
 *       - user_id diambil otomatis dari JWT token
 *       - status otomatis set ke PENDING
 *       - Email notification akan dikirim ke admin
 *       
 *       **Business Rules:**
 *       - Jika `material_sendiri = false`, maka `material_id` wajib diisi
 *       - Jika `referensi_custom = true`, maka `file_referensi_custom` wajib diisi
 *       - Jika `referensi_custom = false`, maka `model_baju_id` wajib diisi
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
 *                   example: "Custom order created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/CustomOrder'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Token tidak valid atau tidak ada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
custom_order_router.get("/", customOrderController.getAllCustomOrders);
custom_order_router.post("/", authenticate, customOrderController.createCustomOrder);

/**
 * @openapi
 * /api/orders/custom/{id}:
 *   get:
 *     tags:
 *       - Custom Orders (User)
 *     summary: Get custom order by ID
 *     description: Mendapatkan detail custom order berdasarkan ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Custom Order ID
 *         example: 1
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
 *                   example: "Custom order retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/CustomOrder'
 *       404:
 *         description: Custom order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
custom_order_router.get("/:id", customOrderController.getCustomOrderById);

export default custom_order_router;