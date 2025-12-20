import { Router } from "express";
import { authenticate, checkRole } from "../../middleware/auth.middleware.js";
import TransactionController from "../../controller/transaction.controller.js";
const transaction_router = Router();
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
 *     Transaction:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         unique_id:
 *           type: string
 *         total_harga:
 *           type: string
 *           description: BigInt value as string
 *         payment_method:
 *           type: string
 *           enum: [BCA, BNI, BRI, MANDIRI, QRIS, CASH]
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [BELUM_BAYAR, SUDAH_BAYAR, LUNAS, DITOLAK]
 *         file_screenshot:
 *           type: string
 *           nullable: true
 *           description: URL or path to payment screenshot
 *         keterangan:
 *           type: string
 *           nullable: true
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             email:
 *               type: string
 *         admin:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             email:
 *               type: string
 *         custom_order:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: integer
 *             unique_id:
 *               type: string
 *             nama_pesanan:
 *               type: string
 *             total_harga:
 *               type: string
 *             jumlah_barang:
 *               type: integer
 *             warna:
 *               type: string
 *               nullable: true
 *             status:
 *               type: string
 *             material_sendiri:
 *               type: boolean
 *             material:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 nama_material:
 *                   type: string
 *                 deskripsi:
 *                   type: string
 *                   nullable: true
 *                 stok:
 *                   type: integer
 *                 status:
 *                   type: string
 *             catatan:
 *               type: string
 *               nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateTransactionRequest:
 *       type: object
 *       required:
 *         - total_harga
 *         - custom_order_id
 *       properties:
 *         total_harga:
 *           type: string
 *           description: Total harga dalam BigInt string
 *           example: "5000000"
 *         custom_order_id:
 *           type: integer
 *           description: ID dari custom order yang akan dibayar
 *           example: 123
 *         payment_method:
 *           type: string
 *           enum: [BCA, BNI, BRI, MANDIRI, QRIS, CASH]
 *           nullable: true
 *           example: "BCA"
 *         keterangan:
 *           type: string
 *           nullable: true
 *           example: "Pembayaran untuk pesanan kaos polo"
 *     UpdateTransactionRequest:
 *       type: object
 *       properties:
 *         total_harga:
 *           type: string
 *         payment_method:
 *           type: string
 *           enum: [BCA, BNI, BRI, MANDIRI, QRIS, CASH]
 *         status:
 *           type: string
 *           enum: [BELUM_BAYAR, SUDAH_BAYAR, LUNAS, DITOLAK]
 *         keterangan:
 *           type: string
 *     BayarPesanananRequest:
 *       type: object
 *       required:
 *         - file_screenshot
 *         - payment_method
 *       properties:
 *         file_screenshot:
 *           type: string
 *           description: URL/path screenshot bukti pembayaran
 *           example: "/uploads/payments/payment_123_20241219.jpg"
 *         payment_method:
 *           type: string
 *           enum: [BCA, BNI, BRI, MANDIRI, QRIS, CASH]
 *           example: "BCA"
 *         keterangan:
 *           type: string
 *           nullable: true
 *           example: "Transfer via mobile banking"
 *     TolakPembayaranRequest:
 *       type: object
 *       required:
 *         - alasan_ditolak
 *       properties:
 *         alasan_ditolak:
 *           type: string
 *           example: "Screenshot tidak jelas, mohon upload ulang"
 *           description: Alasan penolakan pembayaran
 *     TerimaPembayaranRequest:
 *       type: object
 *       properties:
 *         keterangan:
 *           type: string
 *           nullable: true
 *           example: "Pembayaran sudah diterima dan dikonfirmasi"
 *     ResendBayarPesanananRequest:
 *       type: object
 *       required:
 *         - file_screenshot
 *       properties:
 *         file_screenshot:
 *           type: string
 *           description: URL/path screenshot bukti pembayaran yang baru
 *           example: "/uploads/payments/payment_123_resend_20241219.jpg"
 *         payment_method:
 *           type: string
 *           enum: [BCA, BNI, BRI, MANDIRI, QRIS, CASH]
 *           example: "BNI"
 *         keterangan:
 *           type: string
 *           nullable: true
 *           example: "Upload ulang dengan screenshot yang lebih jelas"
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
 * /api/transactions:
 *   get:
 *     tags:
 *       - Transactions
 *     summary: Get list of transactions
 *     description: |
 *       Mendapatkan daftar transaksi dengan dukungan pencarian, filtering, dan pagination.
 *       - Admin/Manager: Dapat melihat semua transaksi
 *       - User: Hanya dapat melihat transaksi miliknya
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query (keterangan, unique_id, user name/email)
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
 *           default: 10
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [BELUM_BAYAR, SUDAH_BAYAR, LUNAS, DITOLAK]
 *         description: Filter by payment status
 *       - in: query
 *         name: payment_method
 *         schema:
 *           type: string
 *           enum: [BCA, BNI, BRI, MANDIRI, QRIS, CASH]
 *         description: Filter by payment method
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Filter by user ID (Admin/Manager only)
 *       - in: query
 *         name: admin_id
 *         schema:
 *           type: integer
 *         description: Filter by admin ID (Admin/Manager only)
 *     responses:
 *       200:
 *         description: List of transactions
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
 *                     $ref: '#/components/schemas/Transaction'
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     tags:
 *       - Transactions (Admin)
 *     summary: Create a new transaction
 *     description: |
 *       Membuat transaksi baru secara manual oleh Admin/Manager.
 *       Biasanya transaksi dibuat otomatis saat deal negosiasi custom order.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTransactionRequest'
 *     responses:
 *       201:
 *         description: Transaction berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
transaction_router.get("/", authenticate, TransactionController.getAllTransactions);
transaction_router.post("/", authenticate, checkRole(allowedRoles), TransactionController.createTransaction);

/**
 * @openapi
 * /api/transactions/{id}:
 *   get:
 *     tags:
 *       - Transactions
 *     summary: Get transaction by ID
 *     description: |
 *       Mendapatkan detail transaksi berdasarkan ID.
 *       - Admin/Manager: Dapat melihat semua transaksi
 *       - User: Hanya dapat melihat transaksi miliknya
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     tags:
 *       - Transactions (Admin)
 *     summary: Update transaction
 *     description: Update transaksi secara manual oleh Admin/Manager
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
 *             $ref: '#/components/schemas/UpdateTransactionRequest'
 *     responses:
 *       200:
 *         description: Transaction berhasil diupdate
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     tags:
 *       - Transactions (Admin)
 *     summary: Permanently delete transaction
 *     description: Menghapus transaksi secara permanen dari database
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
 *         description: Transaction berhasil dihapus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
transaction_router.get("/:id", authenticate, TransactionController.getTransactionById);
transaction_router.patch("/:id", authenticate, checkRole(allowedRoles), TransactionController.updateTransaction);
transaction_router.delete("/:id", authenticate, checkRole(allowedRoles), TransactionController.deleteTransaction);

/**
 * @openapi
 * /api/transactions/{id}/soft-delete:
 *   patch:
 *     tags:
 *       - Transactions (Admin)
 *     summary: Soft delete transaction
 *     description: Menandai transaksi sebagai terhapus (soft delete) dengan mengisi deletedAt
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
 *         description: Transaction berhasil di-soft delete
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
transaction_router.patch("/:id/soft-delete", authenticate, checkRole(allowedRoles), TransactionController.softDeleteTransaction);

/**
 * @openapi
 * /api/transactions/{id}/bayar:
 *   patch:
 *     tags:
 *       - Transactions (Payment)
 *     summary: Submit payment for transaction
 *     description: |
 *       User mengirim bukti pembayaran untuk transaksi.
 *       - Status berubah menjadi SUDAH_BAYAR (menunggu konfirmasi admin)
 *       - Wajib upload screenshot bukti pembayaran
 *       - Hanya user pemilik transaksi yang dapat melakukan pembayaran
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BayarPesanananRequest'
 *     responses:
 *       200:
 *         description: Bukti pembayaran berhasil diupload, menunggu konfirmasi admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Bukti pembayaran berhasil diupload, menunggu konfirmasi admin"
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
transaction_router.patch("/:id/bayar", authenticate, TransactionController.bayarPesananan);

/**
 * @openapi
 * /api/transactions/{id}/terima-pembayaran:
 *   patch:
 *     tags:
 *       - Transactions (Admin)
 *     summary: Accept payment (Admin)
 *     description: |
 *       Admin menerima/mengkonfirmasi pembayaran dari user.
 *       - Status berubah menjadi LUNAS
 *       - Custom order status berubah menjadi SELESAI
 *       - admin_id otomatis diisi dari token
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
 *             $ref: '#/components/schemas/TerimaPembayaranRequest'
 *     responses:
 *       200:
 *         description: Pembayaran berhasil dikonfirmasi, pesanan selesai
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Pembayaran berhasil dikonfirmasi, pesanan selesai"
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
transaction_router.patch("/:id/terima-pembayaran", authenticate, checkRole(allowedRoles), TransactionController.terimaPembayaran);

/**
 * @openapi
 * /api/transactions/{id}/tolak-pembayaran:
 *   patch:
 *     tags:
 *       - Transactions (Admin)
 *     summary: Reject payment (Admin)
 *     description: |
 *       Admin menolak pembayaran dengan alasan tertentu.
 *       - Status berubah menjadi DITOLAK
 *       - alasan_ditolak wajib diisi
 *       - User dapat melakukan upload ulang dengan endpoint resend
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
 *             $ref: '#/components/schemas/TolakPembayaranRequest'
 *     responses:
 *       200:
 *         description: Pembayaran ditolak, user dapat upload ulang bukti pembayaran
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Pembayaran ditolak, user dapat upload ulang bukti pembayaran"
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
transaction_router.patch("/:id/tolak-pembayaran", authenticate, checkRole(allowedRoles), TransactionController.tolakPembayaran);

/**
 * @openapi
 * /api/transactions/{id}/resend-pembayaran:
 *   patch:
 *     tags:
 *       - Transactions (Payment)
 *     summary: Resend payment after rejection
 *     description: |
 *       User upload ulang bukti pembayaran setelah ditolak admin.
 *       - Hanya bisa dilakukan jika status transaksi DITOLAK
 *       - Status berubah kembali menjadi SUDAH_BAYAR
 *       - alasan_ditolak direset menjadi null
 *       - Wajib upload screenshot bukti pembayaran yang baru
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
 *             $ref: '#/components/schemas/ResendBayarPesanananRequest'
 *     responses:
 *       200:
 *         description: Bukti pembayaran berhasil diupload ulang, menunggu konfirmasi admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Bukti pembayaran berhasil diupload ulang, menunggu konfirmasi admin"
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
transaction_router.patch("/:id/resend-pembayaran", authenticate, TransactionController.resendPembayaran);

export default transaction_router;