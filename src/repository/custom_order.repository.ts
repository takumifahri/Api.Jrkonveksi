import { StatusPembayaran, StatusPemesanan } from "../../generated/prisma/enums.js";
import { prisma } from "../config/prisma.config.js";
import { UkuranBaju } from "../interfaces/custom_order.interface.js";
import type {
    createCustomOrderRequest,
    customOrderResponse,
    updateCustomOrderRequest,
} from "../interfaces/custom_order.interface.js";

export interface ICustomOrderRepository {
    getAllCustomOrders(): Promise<customOrderResponse[]>;
    getCustomOrderById(id: number): Promise<customOrderResponse>;
    findCustomOrder(opts: {
        where?: any;
        skip?: number;
        take?: number;
        orderBy?: any;
    }): Promise<customOrderResponse[]>;
    ajuanCustomOrder(data: createCustomOrderRequest): Promise<customOrderResponse>;

}

export class CustomOrderRepository implements ICustomOrderRepository {
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

    async ajuanCustomOrder(data: createCustomOrderRequest): Promise<customOrderResponse> {
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

}