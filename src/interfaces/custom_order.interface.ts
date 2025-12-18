import type { Requester } from "./auth.interface.js";

export enum UkuranBaju {
  EXTRA_SMALL = 'extra_small',
  SMALL = 'small',
  MEDIUM = 'medium',
  REGULER = 'reguler',
  LARGE = 'large',
  EXTRA_LARGE = 'extra_large',
  DOUBLE_EXTRA_LARGE = 'double_extra_large',
  CUSTOM = 'custom',
}

export enum StatusPemesanan {
    PENDING = 'pending',
    DITOLAK = 'ditolak',
    NEGOSIASI = 'negosiasi',
    PEMBAYARAN = 'pembayaran',
    PENGERJAAN = 'pengerjaan',
    DIBATALKAN = 'dibatalkan',
    SELESAI = 'selesai'
}

export interface createCustomOrderRequest {
    nama_pemesanan: string;
    ukuran: UkuranBaju;
    jumlah_barang: number;
    warna: string;
    user_id: number;
    status?: StatusPemesanan | StatusPemesanan.PENDING;
    catatan?: string | null;
    material_sendiri?: boolean | false;
    material_id?: number | null;
}

export interface updateCustomOrderRequest {
    nama_pemesanan?: string;
    ukuran?: UkuranBaju;
    jumlah_barang?: number;
    warna?: string;
    catatan?: string | null;
    material_sendiri?: boolean | false;
    material_id?: number | null;
}

export interface customOrderResponse {
    id: number;
    unique_id: string;
    nama_pemesanan: string;
    ukuran: UkuranBaju;
    jumlah_barang: number;
    warna?: string;
    total_harga?: bigint;

    status?: StatusPemesanan | StatusPemesanan.PENDING;
    catatan?: string | null;
    material_sendiri?: boolean | null;
    material_id?: number | null;
    user_id: number;

    diterima_pada?: Date | null;
    ditolak_pada?: Date | null;
    alasan_ditolak?: string | null;

    admin_id?: number | null;
    info_admin?: {
        id: number;
        name: string;
        email: string;
        role: string;
    } | null;

    createdAt: Date | null;
    updatedAt: Date | null;
    deletedAt?: Date | null;
}

// Simplified request interfaces - hanya payload minimal dari user
export interface terimaCustomOrderRequest {
    status: "setuju";
}

export interface tolakCustomOrderRequest {
    status: "ditolak";
    alasan_ditolak: string;
}

export interface dealNegosiasiRequest {
    status: "deal";
    total_harga: bigint;
}

export interface batalPemesananRequest {
    status: "dibatalkan";
    alasan_ditolak?: string | null;
}

export interface ICustomOrderRepository {
    createCustomOrder(data: createCustomOrderRequest): Promise<customOrderResponse>;
    updateCustomOrder(id: number, data: updateCustomOrderRequest): Promise<customOrderResponse>;
    getAllCustomOrders(
        params?: {
            q?: string;
            page?: number;
            limit?: number;
            sortBy?: string;
            sortOrder?: "asc" | "desc";
        },
        requester?: Requester
    ): Promise<customOrderResponse[]>;
    getCustomOrderById(id: number): Promise<customOrderResponse>;
    deleteCustomOrder(id: number): Promise<customOrderResponse>;
    softDeleteCustomOrder(id: number): Promise<customOrderResponse>;

    // Update signature methods berikut agar sesuai dengan Service
    terimaCustomOrder(id: number, adminId: number, data: terimaCustomOrderRequest): Promise<customOrderResponse>;
    tolakCustomOrder(id: number, adminId: number, data: tolakCustomOrderRequest): Promise<customOrderResponse>;
    dealNegosiasi(id: number, adminId: number, data: dealNegosiasiRequest): Promise<customOrderResponse>;
    batalPemesanan(id: number, adminId: number, data: batalPemesananRequest): Promise<customOrderResponse>;
}