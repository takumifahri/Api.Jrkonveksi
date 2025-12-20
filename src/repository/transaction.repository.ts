import { prisma } from "../config/prisma.config.js";
import { PaymentMethod, StatusPembayaran, StatusPemesanan } from "../../generated/prisma/enums.js";
import type {
    createTransactionRequest,
    updateTransactionRequest,
    terimaPembayaranRequest,
    bayarPesanananRequest,
    tolakPembayaranRequest,
    resendBayarPesanananRequest,
    transactionResponse,
    ITransactionService
} from "../interfaces/transactions.interface.js";
import type { Requester } from "../interfaces/auth.interface.js";

export interface ITransactionRepository {
    createTransaction(data: createTransactionRequest): Promise<transactionResponse>;
    getTransactionById(id: number): Promise<transactionResponse>;
    updateTransaction(id: number, data: updateTransactionRequest): Promise<transactionResponse>;
    getAllTransactions(
        params?: {
            search?: string;
            page?: number;
            limit?: number;
            sortBy?: string;
            sortOrder?: "asc" | "desc";
            filter?: {
                status?: StatusPembayaran;
                payment_method?: PaymentMethod;
                user_id?: number;
                admin_id?: number;
            };
        },
        requester?: Requester | null
    ): Promise<transactionResponse[]>;
    softDeleteTransaction(id: number): Promise<void>;
    deleteTransaction(id: number): Promise<void>;

    bayarPesananan(id: number, data: Partial<bayarPesanananRequest>): Promise<transactionResponse>;
    tolakPembayaran(id: number, data: Partial<tolakPembayaranRequest>): Promise<transactionResponse>;
    terimaPembayaran(id: number, data: Partial<terimaPembayaranRequest>): Promise<transactionResponse>;
    resendPembayaran(id: number, data: Partial<resendBayarPesanananRequest>): Promise<transactionResponse>;
}

export class TransactionRepository implements ITransactionRepository {
    // Helper method untuk transformasi response
    private transformTransactionResponse(result: any): transactionResponse {
        return {
            id: result.id,
            unique_id: result.unique_id,
            total_harga: result.total_harga,
            payment_method: result.payment_method || null,
            status: result.status,
            file_screenshot: result.file_screenshot || null,
            keterangan: result.keterangan || null,
            user: {
                id: result.customer.id,
                name: result.customer.name,
                email: result.customer.email
            },
            admin: result.admin ? {
                id: result.admin.id,
                name: result.admin.name,
                email: result.admin.email
            } : null,
            order: result.order ? {
                id: result.order.id,
                unique_id: result.order.unique_id
            } : null,
            custom_order: result.custom_order ? {
                id: result.custom_order.id,
                unique_id: result.custom_order.unique_id,
                nama_pesanan: result.custom_order.nama_pemesanan,
                total_harga: result.custom_order.total_harga || BigInt(0),
                keterangan: result.custom_order.catatan || null,
                jumlah_barang: result.custom_order.jumlah_barang,
                warna: result.custom_order.warna || null,
                status: result.custom_order.status,
                material_sendiri: result.custom_order.material_sendiri || false,
                material: result.custom_order.material ? {
                    id: result.custom_order.material.id,
                    nama_material: result.custom_order.material.name,
                    deskripsi: result.custom_order.material.description || null,
                    stok: result.custom_order.material.quantity || 0,
                    status: result.custom_order.material.status as any
                } : {
                    id: 0,
                    nama_material: "Material Sendiri",
                    deskripsi: null,
                    stok: 0,
                    status: result.custom_order.status
                },
                catatan: result.custom_order.catatan || null
            } : null
        };
    }

    async createTransaction(data: createTransactionRequest): Promise<transactionResponse> {
        const result = await prisma.transaction.create({
            data,
            include: {
                customer: true,
                admin: true,
                custom_order: {
                    include: {
                        material: true
                    }
                }
            }
        });

        return this.transformTransactionResponse(result);
    }

    async getTransactionById(id: number): Promise<transactionResponse> {
        const result = await prisma.transaction.findUnique({
            where: { id },
            include: {
                customer: true,
                admin: true,
                custom_order: {
                    include: {
                        material: true
                    }
                }
            }
        });

        if (!result) {
            return null as any;
        }

        return this.transformTransactionResponse(result);
    }

    async updateTransaction(id: number, data: updateTransactionRequest): Promise<transactionResponse> {
        await prisma.transaction.update({
            where: { id },
            data
        });

        return this.getTransactionById(id);
    }

    async getAllTransactions(
        params?: {
            search?: string;
            page?: number;
            limit?: number;
            sortBy?: string;
            sortOrder?: "asc" | "desc";
            filter?: {
                status?: StatusPembayaran;
                payment_method?: PaymentMethod;
                user_id?: number;
                admin_id?: number;
            };
        },
        requester?: Requester | null    
    ): Promise<transactionResponse[]> {
        const { search, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", filter } = params || {};
        const whereClause: any = {};

        // Apply search filter
        if (search) {
            whereClause.OR = [
                { keterangan: { contains: search, mode: "insensitive" } },
                { unique_id: { contains: search, mode: "insensitive" } },
                { customer: { name: { contains: search, mode: "insensitive" } } },
                { customer: { email: { contains: search, mode: "insensitive" } } }
            ];
        }

        // Apply filters
        if (filter) {
            if (filter.status) {
                whereClause.status = filter.status;
            }
            if (filter.payment_method) {
                whereClause.payment_method = filter.payment_method;
            }
            if (filter.user_id) {
                whereClause.customer_id = filter.user_id;
            }
            if (filter.admin_id) {
                whereClause.admin_id = filter.admin_id;
            }
        }

        // Access control filter for non-admin users
        if (requester && requester.role !== "Admin" && requester.role !== "Manager") {
            whereClause.customer_id = requester.id;
        }

        const results = await prisma.transaction.findMany({
            where: whereClause,
            include: {
                customer: true,
                admin: true,
                custom_order: {
                    include: {
                        material: true
                    }
                }
            },
            orderBy: {
                [sortBy]: sortOrder
            },
            skip: (page - 1) * limit,
            take: limit
        }); 

        return results.map(result => this.transformTransactionResponse(result));
    }

    async softDeleteTransaction(id: number): Promise<void> {
        await prisma.transaction.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }

    async deleteTransaction(id: number): Promise<void> {
        await prisma.transaction.delete({
            where: { id }
        });
    }

    async bayarPesananan(id: number, data: Partial<bayarPesanananRequest>): Promise<transactionResponse> {
        // Build update data object dengan type safety
        const updateData: any = {
            status: StatusPembayaran.BELUM_BAYAR, // Status menunggu konfirmasi admin
            updatedAt: new Date()
        };

        // Only add fields if they are defined (not undefined)
        if (data.file_screenshot !== undefined) {
            updateData.file_screenshot = data.file_screenshot;
        }
        if (data.payment_method !== undefined) {
            updateData.payment_method = data.payment_method;
        }
        if (data.keterangan !== undefined) {
            updateData.keterangan = data.keterangan;
        }

        await prisma.transaction.update({
            where: { id },
            data: updateData
        });

        return this.getTransactionById(id);
    }

    async tolakPembayaran(id: number, data: Partial<tolakPembayaranRequest>): Promise<transactionResponse> {
        // Build update data object dengan type safety
        const updateData: any = {
            status: StatusPembayaran.DITOLAK,
            updatedAt: new Date()
        };

        // Only add alasan_ditolak if it's defined
        if (data.alasan_ditolak !== undefined) {
            updateData.alasan_ditolak = data.alasan_ditolak;
        }

        await prisma.transaction.update({
            where: { id },
            data: updateData
        });

        return this.getTransactionById(id);
    }

    async terimaPembayaran(id: number, data: Partial<terimaPembayaranRequest>): Promise<transactionResponse> {
        await prisma.transaction.update({
            where: { id },
            data: {
                status: StatusPembayaran.LUNAS,
                updatedAt: new Date()
            }
        });

        // Update custom order status to SELESAI if payment is accepted
        const transaction = await this.getTransactionById(id);
        if (transaction.custom_order) {
            await prisma.pemesananKonveksi.update({
                where: { id: transaction.custom_order.id },
                data: {
                    status: StatusPemesanan.SELESAI,
                    updatedAt: new Date()
                }
            });
        }

        return this.getTransactionById(id);
    }

    async resendPembayaran(id: number, data: Partial<resendBayarPesanananRequest>): Promise<transactionResponse> {
        // Build update data object dengan type safety
        const updateData: any = {
            status: StatusPembayaran.BELUM_BAYAR, // Reset ke status menunggu konfirmasi
            alasan_ditolak: null, // Clear rejection reason
            updatedAt: new Date()
        };

        // Only add fields if they are defined
        if (data.file_screenshot !== undefined) {
            updateData.file_screenshot = data.file_screenshot;
        }
        if (data.payment_method !== undefined) {
            updateData.payment_method = data.payment_method;
        }
        if (data.keterangan !== undefined) {
            updateData.keterangan = data.keterangan;
        }

        await prisma.transaction.update({
            where: { id },
            data: updateData
        });

        return this.getTransactionById(id);
    }
}

export default new TransactionRepository();