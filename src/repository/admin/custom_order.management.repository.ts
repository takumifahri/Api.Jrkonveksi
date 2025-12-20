import type {
    createCustomOrderRequest,
    customOrderResponse,
    updateCustomOrderRequest,
} from "../../interfaces/custom_order.interface.js";
import { prisma } from "../../config/prisma.config.js";
import { UkuranBaju } from "../../interfaces/custom_order.interface.js";
import { StatusPembayaran, StatusPemesanan } from "../../../generated/prisma/enums.js";

export interface IAdminCustomOrderManagementRepository {
    createCustomOrder(data: createCustomOrderRequest): Promise<customOrderResponse>;
    updateCustomOrder(id: number, data: updateCustomOrderRequest): Promise<customOrderResponse>;
    deleteCustomOrder(id: number): Promise<customOrderResponse>;
    softDeleteCustomOrder(id: number): Promise<customOrderResponse>;

    terimaCustomOrder(id: number, adminId: number): Promise<customOrderResponse>;
    tolakCustomOrder(id: number, adminId: number, alasanDitolak: string): Promise<customOrderResponse>;
    dealNegosiasi(id: number, adminId: number, totalHarga: bigint): Promise<customOrderResponse>;
    batalPemesanan(id: number, adminId: number, alasanDitolak?: string): Promise<customOrderResponse>;
}

export class CustomOrderManagementRepository implements IAdminCustomOrderManagementRepository {
     async findCustomOrder(opts: { where?: any; skip?: number; take?: number; orderBy?: any; }): Promise<customOrderResponse[]> {
        const args: any = {
            where: opts.where ?? undefined
        };
        if (opts.skip !== undefined) args.skip = opts.skip;
        if (opts.take !== undefined) args.take = opts.take;
        if (opts.orderBy !== undefined) args.orderBy = opts.orderBy;
        const results = await prisma.pemesananKonveksi.findMany(args);
        
        if (!results || results.length === 0) {
            return [];
        }
        return results.map(result => {
            const ukuranMapped = (UkuranBaju as any)[result.ukuran as keyof typeof UkuranBaju] ?? result.ukuran;
            return {
                ...result,
                ukuran: ukuranMapped
            } as unknown as customOrderResponse;
        });
    }

    

    async getAllCustomOrders(): Promise<customOrderResponse[]> {
        return this.findCustomOrder({});
    }

    async getCustomOrderById(id: number): Promise<customOrderResponse> {
        const result = await prisma.pemesananKonveksi.findUnique({
            where: { id }
        });

        if (!result) {
            throw new Error(`Custom order with id ${id} not found`);
        }

        const ukuranMapped = (UkuranBaju as any)[result.ukuran as keyof typeof UkuranBaju] ?? result.ukuran;

        return {
            ...result,
            ukuran: ukuranMapped
        } as unknown as customOrderResponse;
    }
    
    async createCustomOrder(data: createCustomOrderRequest): Promise<customOrderResponse> {
        const payload = {
            ...data,
            status: (data.status ?? StatusPemesanan.PENDING).toUpperCase(),
            ukuran: (data.ukuran as string).toUpperCase()
        };

        try {
            const result = await prisma.pemesananKonveksi.create({
                data: payload as any
            });

            const ukuranMapped = (UkuranBaju as any)[result.ukuran as keyof typeof UkuranBaju] ?? result.ukuran;
            const generateUniqueId = `CSO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const { unique_id: _existingUniqueId, ...resultRest } = result as any;

            return {
                unique_id: generateUniqueId,
                ...resultRest,
                ukuran: ukuranMapped
            } as unknown as customOrderResponse;
        } catch (err: any) {
            throw new Error(`Failed to create custom order: ${err.message}`);
        }
    }

    async updateCustomOrder(id: number, data: updateCustomOrderRequest): Promise<customOrderResponse> {
        const payload = {
            ...data,
            ukuran: data.ukuran ? (data.ukuran as unknown as string).toUpperCase() : undefined
        };
        const result = await prisma.pemesananKonveksi.update({
            where: { id },
            data: payload as any
        });
        const ukuranMapped = (UkuranBaju as any)[result.ukuran as keyof typeof UkuranBaju] ?? result.ukuran;

        return {
            ...result,
            ukuran: ukuranMapped
        } as unknown as customOrderResponse;
    }

    async deleteCustomOrder(id: number): Promise<customOrderResponse> {
        const result = await prisma.pemesananKonveksi.delete({
            where: { id }
        });
        const ukuranMapped = (UkuranBaju as any)[result.ukuran as keyof typeof UkuranBaju] ?? result.ukuran;

        if (!result) {
            throw new Error(`Custom order with id ${id} not found`);
        }
        return {
            ...result,
            ukuran: ukuranMapped
        } as unknown as customOrderResponse;
    }

    async softDeleteCustomOrder(id: number): Promise<customOrderResponse> {
        const result = await prisma.pemesananKonveksi.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
        const ukuranMapped = (UkuranBaju as any)[result.ukuran as keyof typeof UkuranBaju] ?? result.ukuran;

        if (!result) {
            throw new Error(`Custom order with id ${id} not found`);
        }

        return {
            ...result,
            ukuran: ukuranMapped
        } as unknown as customOrderResponse;
    }

    // Terima: status "setuju" -> NEGOSIASI + admin_id + waktu_terima
    async terimaCustomOrder(id: number, adminId: number): Promise<customOrderResponse> {
        const result = await prisma.pemesananKonveksi.update({
            where: { id },
            data: {
                status: StatusPemesanan.NEGOSIASI,
                admin_id: adminId,
                waktu_terima: new Date()
            }
        });

        const ukuranMapped = (UkuranBaju as any)[result.ukuran as keyof typeof UkuranBaju] ?? result.ukuran;

        return {
            ...result,
            ukuran: ukuranMapped
        } as unknown as customOrderResponse;
    }

    // Tolak: status "ditolak" -> DITOLAK + admin_id + waktu_tolak + alasan
    async tolakCustomOrder(id: number, adminId: number, alasanDitolak: string): Promise<customOrderResponse> {
        const result = await prisma.pemesananKonveksi.update({
            where: { id },
            data: {
                status: StatusPemesanan.DITOLAK,
                admin_id: adminId,
                waktu_tolak: new Date(),
                alasan_ditolak: alasanDitolak
            }
        });
        const ukuranMapped = (UkuranBaju as any)[result.ukuran as keyof typeof UkuranBaju] ?? result.ukuran;
        return {
            ...result,
            ukuran: ukuranMapped
        } as unknown as customOrderResponse;
    }

    // Deal: status "deal" -> PENGERJAAN + total_harga + create Transaction
    async dealNegosiasi(id: number, adminId: number, totalHarga: bigint): Promise<customOrderResponse> {
        // Update pemesanan ke PENGERJAAN
        const result = await prisma.pemesananKonveksi.update({
            where: { id },
            data: {
                status: StatusPemesanan.PENGERJAAN,
                total_harga: totalHarga,
                admin_id: adminId
            }
        });

        const generateUniqueId = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Create transaction
        await prisma.transaction.create({
            data: {
                unique_id: generateUniqueId,
                custom_order_id: id,
                status: StatusPembayaran.BELUM_BAYAR,
                user_id: result.user_id,
                total_harga: totalHarga,
                admin_id: adminId,
            }
        });

        const ukuranMapped = (UkuranBaju as any)[result.ukuran as keyof typeof UkuranBaju] ?? result.ukuran;
        return {
            ...result,
            ukuran: ukuranMapped
        } as unknown as customOrderResponse;
    }

    // Batal: status "dibatalkan" -> DIBATALKAN + admin_id + alasan (optional)
    async batalPemesanan(id: number, adminId: number, alasanDitolak?: string): Promise<customOrderResponse> {
        const result = await prisma.pemesananKonveksi.update({
            where: { id },
            data: {
                status: StatusPemesanan.DIBATALKAN,
                admin_id: adminId,
                alasan_ditolak: alasanDitolak ?? null
            }
        });
        const ukuranMapped = (UkuranBaju as any)[result.ukuran as keyof typeof UkuranBaju] ?? result.ukuran;
        return {
            ...result,
            ukuran: ukuranMapped
        } as unknown as customOrderResponse;
    }
}