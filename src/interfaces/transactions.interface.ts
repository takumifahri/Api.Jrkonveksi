// Interface transaction buat semua (admin, manager dan user)
import { PaymentMethod, StatusPembayaran, StatusPemesanan } from "../../generated/prisma/enums.js";
import type { Requester } from "./auth.interface.js";

export interface createTransactionRequest {
    unique_id: string;
    total_harga: bigint;
    payment_method?: PaymentMethod | null;
    status: StatusPembayaran;
    file_screenshot?: string | null;
    keterangan?: string | null;

    user_id: number;
    admin_id?: number | null;
    order_id?: number | null;
    custom_order_id?: number | null;
}

export interface updateTransactionRequest {
    total_harga?: bigint;
    payment_method?: PaymentMethod | null;
    status?: StatusPembayaran;
    file_screenshot?: string | null;
    keterangan?: string | null;

    admin_id?: number | null;
    order_id?: number | null;
    custom_order_id?: number | null;
}

export interface bayarPesanananRequest {
    file_screenshot: string;
    payment_method?: PaymentMethod | null;
    keterangan?: string | null;
}

export interface resendBayarPesanananRequest {
    file_screenshot: string;
    payment_method?: PaymentMethod | null;
    keterangan?: string | null;
}

export interface tolakPembayaranRequest {
    status: StatusPembayaran;
    alasan_ditolak?: string | null;
    updatedAt: Date;
}

export interface terimaPembayaranRequest {
    status: StatusPembayaran;
}

export interface transactionResponse {
    id: number;
    unique_id: string;
    total_harga: bigint;
    payment_method?: PaymentMethod | null;
    status: StatusPembayaran;
    file_screenshot?: string | null;
    keterangan?: string | null;

    user: {
        id: number;
        name: string;
        email: string;
    };
    admin?: {
        id: number;
        name: string;
        email: string;
    } | null;

    order?: {
        id: number;
        unique_id: string;
    } | null;

    custom_order?: {
        id: number;
        unique_id: string;
        nama_pesanan: string;
        total_harga: bigint;
        keterangan?: string | null;
        jumlah_barang: number;
        warna?: string | null;
        status: StatusPemesanan;
        material_sendiri: boolean;
        material : {
            id: number;
            nama_material: string;
            deskripsi: string | null;
            stok: number;
            status: StatusPemesanan;
        };
        catatan?: string | null;
    } | null;
}

export interface ITransactionService {
    // Crud
    createTransaction(request: createTransactionRequest): Promise<transactionResponse>;
    getAllTransactions(
        params?:{
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
    getTransactionById(transactionId: number): Promise<transactionResponse>;
    updateTransaction(transactionId: number, request: updateTransactionRequest): Promise<transactionResponse>;
    deleteTransaction(transactionId: number): Promise<void>;
    softDeleteTransaction(transactionId: number): Promise<void>;

    // Other methods
    bayarPesananan(transactionId: number, request: bayarPesanananRequest, userId: number): Promise<transactionResponse>;
    tolakPembayaran(transactionId: number, request: tolakPembayaranRequest, adminId: number): Promise<transactionResponse>;
    terimaPembayaran(transactionId: number, request: terimaPembayaranRequest, adminId: number): Promise<transactionResponse>;
    resendPembayaran(transactionId: number, request: resendBayarPesanananRequest, userId: number): Promise<transactionResponse>;
}