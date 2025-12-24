import logger, { logInfo, logAudit, logError, logWarn, logPayment, logTransaction } from "../utils/logger.js";
import HttpException from "../utils/HttpExecption.js";

import type { 
    createTransactionRequest,
    updateTransactionRequest,
    transactionResponse,
    bayarPesanananRequest,
    tolakPembayaranRequest,
    terimaPembayaranRequest,
    resendBayarPesanananRequest,
    ITransactionService
} from "../interfaces/transactions.interface.js";

import transactionRepository from "../repository/transaction.repository.js";
import type { Requester } from "../interfaces/auth.interface.js";
import CacheService, { CACHE_TTL } from "./cache.service.js";

export class TransactionService implements ITransactionService {
    
    async createTransaction(request: createTransactionRequest): Promise<transactionResponse> {
        logInfo("Starting create transaction", {
            user_id: request.user_id,
            total_harga: request.total_harga.toString(),
            custom_order_id: request.custom_order_id,
            payment_method: request.payment_method
        });

        if (!request.user_id) {
            logWarn("Create transaction failed: missing user_id", { request });
            throw new HttpException(400, "User ID is required");
        }

        try {
            const transaction = await transactionRepository.createTransaction(request);

            // ✅ Invalidate user's transaction caches
            CacheService.deletePattern(`transactions:user:${request.user_id}`);
            CacheService.deletePattern('transactions:all');

            logAudit("TRANSACTION_CREATED", {
                transaction_id: transaction.id,
                unique_id: transaction.unique_id,
                user_id: request.user_id,
                total_harga: transaction.total_harga.toString(),
                status: transaction.status,
                custom_order_id: request.custom_order_id,
                payment_method: request.payment_method
            });

            logInfo("Transaction created successfully", {
                transaction_id: transaction.id,
                unique_id: transaction.unique_id,
                user_id: request.user_id,
                total_harga: transaction.total_harga.toString()
            });

            return transaction;
        } catch (error) {
            logError("Failed to create transaction", error, {
                user_id: request.user_id,
                custom_order_id: request.custom_order_id,
                error_name: (error as any)?.name,
                error_code: (error as any)?.code
            });
            throw new HttpException(500, "Failed to create transaction");
        }
    }

    async getAllTransactions(
        params?: {
            search?: string;
            page?: number;
            limit?: number;
            sortBy?: string;
            sortOrder?: "asc" | "desc";
            filter?: {
                status?: any;
                payment_method?: any;
                user_id?: number;
                admin_id?: number;
            };
        },
        requester?: Requester | null
    ): Promise<transactionResponse[]> {
        logInfo("Fetching transactions", {
            requester_id: requester?.id,
            requester_role: requester?.role,
            search_query: params?.search,
            page: params?.page,
            limit: params?.limit,
            filters: params?.filter
        });

        try {
            // ✅ Generate cache key
            const role = requester?.role ?? "User";
            const cacheKey = `transactions:${role === "Admin" || role === "Manager" ? 'all' : `user:${requester?.id}`}:${JSON.stringify(params)}`;
            
            const cached = CacheService.get<transactionResponse[]>(cacheKey);
            
            if (cached) {
                logInfo("Transactions retrieved from cache", { 
                    count: cached.length,
                    requester_id: requester?.id 
                });
                return cached;
            }

            // Access control logging
            if (requester && role !== "Admin" && role !== "Manager") {
                logInfo("Applied user access control filter", { 
                    user_id: requester.id, 
                    role 
                });
            } else {
                logInfo("Admin/Manager access - no user filter applied", { 
                    requester_role: role 
                });
            }

            const transactions = await transactionRepository.getAllTransactions(params, requester);

            // ✅ Cache for 2 minutes (transactions update frequently)
            CacheService.set(cacheKey, transactions, CACHE_TTL.FREQUENT.TRANSACTION_DETAIL);

            logInfo("Transactions fetched from database and cached", {
                requester_id: requester?.id,
                total_results: transactions.length,
                page: params?.page || 1,
                limit: params?.limit || 10,
                has_more: transactions.length === (params?.limit || 10)
            });

            return transactions;
        } catch (error) {
            logError("Failed to fetch transactions", error, {
                requester_id: requester?.id,
                params
            });
            throw new HttpException(500, "Failed to fetch transactions");
        }
    }

    async getTransactionById(transactionId: number): Promise<transactionResponse> {
        logInfo("Fetching transaction by ID", { transaction_id: transactionId });

        try {
            // ✅ Try cache first
            const cacheKey = `transaction:${transactionId}`;
            const cached = CacheService.get<transactionResponse>(cacheKey);
            
            if (cached) {
                logInfo("Transaction retrieved from cache", { transaction_id: transactionId });
                return cached;
            }

            const transaction = await transactionRepository.getTransactionById(transactionId);

            if (!transaction) {
                logWarn("Transaction not found", { transaction_id: transactionId });
                throw new HttpException(404, "Transaction not found");
            }

            // ✅ Cache for 2 minutes
            CacheService.set(cacheKey, transaction, CACHE_TTL.FREQUENT.TRANSACTION_DETAIL);

            logInfo("Transaction fetched from database and cached", {
                transaction_id: transactionId,
                unique_id: transaction.unique_id,
                status: transaction.status,
                user_id: transaction.user.id,
                total_harga: transaction.total_harga.toString()
            });

            return transaction;
        } catch (error) {
            if (error instanceof HttpException) throw error;
            logError("Failed to fetch transaction by ID", error, { transaction_id: transactionId });
            throw new HttpException(500, "Failed to fetch transaction");
        }
    }

    async updateTransaction(transactionId: number, request: updateTransactionRequest): Promise<transactionResponse> {
        logInfo("Starting update transaction", {
            transaction_id: transactionId,
            update_fields: Object.keys(request)
        });

        try {
            // Get old data untuk audit
            const oldTransaction = await transactionRepository.getTransactionById(transactionId);
            
            const updatedTransaction = await transactionRepository.updateTransaction(transactionId, request);

            // ✅ Invalidate caches
            CacheService.delete(`transaction:${transactionId}`);
            CacheService.deletePattern(`transactions:user:${updatedTransaction.user.id}`);
            CacheService.deletePattern('transactions:all');

            logAudit("TRANSACTION_UPDATED", {
                transaction_id: transactionId,
                unique_id: updatedTransaction.unique_id,
                old_data: {
                    status: oldTransaction.status,
                    total_harga: oldTransaction.total_harga.toString(),
                    payment_method: oldTransaction.payment_method,
                    admin_id: oldTransaction.admin?.id
                },
                new_data: {
                    status: updatedTransaction.status,
                    total_harga: updatedTransaction.total_harga.toString(),
                    payment_method: updatedTransaction.payment_method,
                    admin_id: updatedTransaction.admin?.id
                },
                updated_fields: Object.keys(request)
            });

            logInfo("Transaction updated and cache invalidated", {
                transaction_id: transactionId,
                unique_id: updatedTransaction.unique_id
            });

            return updatedTransaction;
        } catch (error) {
            logError("Failed to update transaction", error, { transaction_id: transactionId });
            throw new HttpException(500, "Failed to update transaction");
        }
    }

    async deleteTransaction(transactionId: number): Promise<void> {
        logInfo("Starting permanent delete transaction", { transaction_id: transactionId });

        try {
            // Get transaction info untuk audit sebelum delete
            const transactionToDelete = await transactionRepository.getTransactionById(transactionId);
            
            await transactionRepository.deleteTransaction(transactionId);

            // ✅ Invalidate caches
            CacheService.delete(`transaction:${transactionId}`);
            CacheService.deletePattern(`transactions:user:${transactionToDelete.user.id}`);
            CacheService.deletePattern('transactions:all');

            logAudit("TRANSACTION_DELETED", {
                transaction_id: transactionId,
                unique_id: transactionToDelete.unique_id,
                user_id: transactionToDelete.user.id,
                status: transactionToDelete.status,
                total_harga: transactionToDelete.total_harga.toString(),
                deletion_type: "PERMANENT"
            });

            logInfo("Transaction permanently deleted and cache invalidated", {
                transaction_id: transactionId,
                unique_id: transactionToDelete.unique_id
            });
        } catch (error) {
            logError("Failed to delete transaction", error, { transaction_id: transactionId });
            throw new HttpException(500, "Failed to delete transaction");
        }
    }

    async softDeleteTransaction(transactionId: number): Promise<void> {
        logInfo("Starting soft delete transaction", { transaction_id: transactionId });

        try {
            const transaction = await transactionRepository.getTransactionById(transactionId);
            await transactionRepository.softDeleteTransaction(transactionId);

            // ✅ Invalidate caches
            CacheService.delete(`transaction:${transactionId}`);
            CacheService.deletePattern(`transactions:user:${transaction.user.id}`);
            CacheService.deletePattern('transactions:all');

            logAudit("TRANSACTION_SOFT_DELETED", {
                transaction_id: transactionId,
                unique_id: transaction.unique_id,
                user_id: transaction.user.id,
                status: transaction.status,
                total_harga: transaction.total_harga.toString(),
                deletion_type: "SOFT"
            });

            logInfo("Transaction soft deleted and cache invalidated", {
                transaction_id: transactionId,
                unique_id: transaction.unique_id
            });
        } catch (error) {
            logError("Failed to soft delete transaction", error, { transaction_id: transactionId });
            throw new HttpException(500, "Failed to soft delete transaction");
        }
    }

    async bayarPesananan(transactionId: number, request: bayarPesanananRequest, userId: number): Promise<transactionResponse> {
        const numericTransactionId = transactionId;

        logInfo("Starting payment submission", {
            transaction_id: numericTransactionId,
            user_id: userId,
            payment_method: request.payment_method,
            has_screenshot: !!request.file_screenshot
        });

        logPayment("PAYMENT_ATTEMPT", {
            transaction_id: numericTransactionId,
            user_id: userId,
            payment_method: request.payment_method
        });

        try {
            // Validate payment data
            if (!request.file_screenshot) {
                logWarn("Payment submission failed: missing screenshot", {
                    transaction_id: numericTransactionId,
                    user_id: userId
                });
                throw new HttpException(400, "Screenshot bukti pembayaran wajib diupload");
            }

            if (!request.payment_method) {
                logWarn("Payment submission failed: missing payment method", {
                    transaction_id: numericTransactionId,
                    user_id: userId
                });
                throw new HttpException(400, "Metode pembayaran wajib dipilih");
            }

            // Get old transaction data
            const oldTransaction = await transactionRepository.getTransactionById(numericTransactionId);
            
            // Verify user authorization
            if (oldTransaction.user.id !== userId) {
                logWarn("Payment submission unauthorized: user mismatch", {
                    transaction_id: numericTransactionId,
                    request_user_id: userId,
                    transaction_user_id: oldTransaction.user.id
                });
                throw new HttpException(403, "Unauthorized to modify this transaction");
            }

            const updatedTransaction = await transactionRepository.bayarPesananan(numericTransactionId, request);

            // ✅ Invalidate caches (status changed)
            CacheService.delete(`transaction:${numericTransactionId}`);
            CacheService.deletePattern(`transactions:user:${userId}`);
            CacheService.deletePattern('transactions:all');

            logAudit("PAYMENT_SUBMITTED", {
                transaction_id: numericTransactionId,
                unique_id: updatedTransaction.unique_id,
                user_id: userId,
                payment_method: request.payment_method,
                old_status: oldTransaction.status,
                new_status: updatedTransaction.status,
                file_screenshot: request.file_screenshot,
                keterangan: request.keterangan
            });

            logPayment("PAYMENT_SUBMITTED", {
                transaction_id: numericTransactionId,
                unique_id: updatedTransaction.unique_id,
                user_id: userId,
                payment_method: request.payment_method,
                status: updatedTransaction.status
            });

            logInfo("Payment submitted and cache invalidated", {
                transaction_id: numericTransactionId,
                unique_id: updatedTransaction.unique_id,
                user_id: userId,
                payment_method: request.payment_method
            });

            return updatedTransaction;
        } catch (error) {
            if (error instanceof HttpException) throw error;
            
            logError("Failed to submit payment", error, {
                transaction_id: numericTransactionId,
                user_id: userId,
                payment_method: request.payment_method
            });
            throw new HttpException(500, "Failed to submit payment");
        }
    }

    async tolakPembayaran(transactionId: number, request: tolakPembayaranRequest, adminId: number): Promise<transactionResponse> {
        const numericTransactionId = transactionId;

        logInfo("Starting payment rejection", {
            transaction_id: numericTransactionId,
            admin_id: adminId,
            rejection_reason: request.alasan_ditolak
        });

        try {
            // Get old transaction data
            const oldTransaction = await transactionRepository.getTransactionById(numericTransactionId);
            
            const updatedTransaction = await transactionRepository.tolakPembayaran(numericTransactionId, request);

            // ✅ Invalidate caches (status changed)
            CacheService.delete(`transaction:${numericTransactionId}`);
            CacheService.deletePattern(`transactions:user:${updatedTransaction.user.id}`);
            CacheService.deletePattern('transactions:all');

            logAudit("PAYMENT_REJECTED", {
                transaction_id: numericTransactionId,
                unique_id: updatedTransaction.unique_id,
                admin_id: adminId,
                user_id: updatedTransaction.user.id,
                old_status: oldTransaction.status,
                new_status: updatedTransaction.status,
                rejection_reason: request.alasan_ditolak
            });

            logPayment("PAYMENT_REJECTED", {
                transaction_id: numericTransactionId,
                unique_id: updatedTransaction.unique_id,
                admin_id: adminId,
                user_id: updatedTransaction.user.id,
                rejection_reason: request.alasan_ditolak
            });

            logInfo("Payment rejected and cache invalidated", {
                transaction_id: numericTransactionId,
                unique_id: updatedTransaction.unique_id,
                admin_id: adminId,
                reason: request.alasan_ditolak
            });

            return updatedTransaction;
        } catch (error) {
            logError("Failed to reject payment", error, {
                transaction_id: numericTransactionId,
                admin_id: adminId,
                rejection_reason: request.alasan_ditolak
            });
            throw new HttpException(500, "Failed to reject payment");
        }
    }

    async terimaPembayaran(transactionId: number, request: terimaPembayaranRequest, adminId: number): Promise<transactionResponse> {
        const numericTransactionId = transactionId;

        logInfo("Starting payment acceptance", {
            transaction_id: numericTransactionId,
            admin_id: adminId
        });

        try {
            // Get old transaction data
            const oldTransaction = await transactionRepository.getTransactionById(numericTransactionId);
            
            const updatedTransaction = await transactionRepository.terimaPembayaran(numericTransactionId, request);

            // ✅ Invalidate caches (status changed + order status changed)
            CacheService.delete(`transaction:${numericTransactionId}`);
            CacheService.deletePattern(`transactions:user:${updatedTransaction.user.id}`);
            CacheService.deletePattern('transactions:all');
            
            // ✅ Invalidate related custom order cache
            if (updatedTransaction.custom_order) {
                CacheService.delete(`custom_order:${updatedTransaction.custom_order.id}`);
                CacheService.deletePattern(`custom_orders:user:${updatedTransaction.user.id}`);
            }

            logAudit("PAYMENT_ACCEPTED", {
                transaction_id: numericTransactionId,
                unique_id: updatedTransaction.unique_id,
                admin_id: adminId,
                user_id: updatedTransaction.user.id,
                old_status: oldTransaction.status,
                new_status: updatedTransaction.status,
                total_harga: updatedTransaction.total_harga.toString()
            });

            logPayment("PAYMENT_ACCEPTED", {
                transaction_id: numericTransactionId,
                unique_id: updatedTransaction.unique_id,
                admin_id: adminId,
                user_id: updatedTransaction.user.id,
                total_harga: updatedTransaction.total_harga.toString(),
                custom_order_status_updated: !!updatedTransaction.custom_order
            });

            logInfo("Payment accepted and cache invalidated", {
                transaction_id: numericTransactionId,
                unique_id: updatedTransaction.unique_id,
                admin_id: adminId,
                order_updated: !!updatedTransaction.custom_order
            });

            return updatedTransaction;
        } catch (error) {
            logError("Failed to accept payment", error, {
                transaction_id: numericTransactionId,
                admin_id: adminId
            });
            throw new HttpException(500, "Failed to accept payment");
        }
    }

    async resendPembayaran(transactionId: number, request: resendBayarPesanananRequest, userId: number): Promise<transactionResponse> {
        const numericTransactionId = transactionId;

        logInfo("Starting payment resend", {
            transaction_id: numericTransactionId,
            user_id: userId,
            payment_method: request.payment_method,
            has_screenshot: !!request.file_screenshot
        });

        logPayment("PAYMENT_RESEND_ATTEMPT", {
            transaction_id: numericTransactionId,
            user_id: userId,
            payment_method: request.payment_method
        });

        try {
            // Validate resend payment data
            if (!request.file_screenshot) {
                logWarn("Payment resend failed: missing screenshot", {
                    transaction_id: numericTransactionId,
                    user_id: userId
                });
                throw new HttpException(400, "Screenshot bukti pembayaran wajib diupload");
            }

            // Get old transaction data
            const oldTransaction = await transactionRepository.getTransactionById(numericTransactionId);
            
            // Verify user authorization
            if (oldTransaction.user.id !== userId) {
                logWarn("Payment resend unauthorized: user mismatch", {
                    transaction_id: numericTransactionId,
                    request_user_id: userId,
                    transaction_user_id: oldTransaction.user.id
                });
                throw new HttpException(403, "Unauthorized to modify this transaction");
            }

            // Verify transaction can be resent (harus status DITOLAK)
            if (oldTransaction.status !== 'DITOLAK') {
                logWarn("Payment resend failed: invalid status", {
                    transaction_id: numericTransactionId,
                    current_status: oldTransaction.status,
                    user_id: userId
                });
                throw new HttpException(400, "Payment can only be resent for rejected transactions");
            }

            const updatedTransaction = await transactionRepository.resendPembayaran(numericTransactionId, request);

            // ✅ Invalidate caches (status changed)
            CacheService.delete(`transaction:${numericTransactionId}`);
            CacheService.deletePattern(`transactions:user:${userId}`);
            CacheService.deletePattern('transactions:all');

            logAudit("PAYMENT_RESENT", {
                transaction_id: numericTransactionId,
                unique_id: updatedTransaction.unique_id,
                user_id: userId,
                old_status: oldTransaction.status,
                new_status: updatedTransaction.status,
                payment_method: request.payment_method,
                file_screenshot: request.file_screenshot,
                keterangan: request.keterangan
            });

            logPayment("PAYMENT_RESENT", {
                transaction_id: numericTransactionId,
                unique_id: updatedTransaction.unique_id,
                user_id: userId,
                payment_method: request.payment_method,
                status: updatedTransaction.status
            });

            logInfo("Payment resent and cache invalidated", {
                transaction_id: numericTransactionId,
                unique_id: updatedTransaction.unique_id,
                user_id: userId,
                payment_method: request.payment_method
            });

            return updatedTransaction;
        } catch (error) {
            if (error instanceof HttpException) throw error;
            
            logError("Failed to resend payment", error, {
                transaction_id: numericTransactionId,
                user_id: userId,
                payment_method: request.payment_method
            });
            throw new HttpException(500, "Failed to resend payment");
        }
    }
}

export default new TransactionService();