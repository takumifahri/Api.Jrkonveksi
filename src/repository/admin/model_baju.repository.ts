import type {
    createModelBajuRequest,
    IModelBajuInterface,
    modelBajuResponse,
    updateModelBajuRequest
} from "../../interfaces/model_baju.interface.js";
import { prisma } from "../../config/prisma.config.js";
import type { Requester } from "../../interfaces/auth.interface.js";

export class ModelBajuRepository implements IModelBajuInterface {
    async findModelBaju(opts: { where?: any; skip?: number; take?: number; orderBy?: any; }): Promise<modelBajuResponse[]> {
        const args: any = {
            where: opts.where ?? undefined
        };
        if (opts.skip !== undefined) args.skip = opts.skip;
        if (opts.take !== undefined) args.take = opts.take;
        if (opts.orderBy !== undefined) args.orderBy = opts.orderBy;
        const results = await prisma.modelBaju.findMany(args);

        return results;
    }

    async getAllModelBaju(params?: {
        q?: string | null;
        limit?: number;
        offset?: number;
        sortBy?: string | null;
        sortOrder?: "asc" | "desc";
    }, requester?: Requester): Promise<modelBajuResponse[]> {
        const where: any = {};
        if (params?.q) {
            where.OR = [
                { nama: { contains: params.q, mode: 'insensitive' } }
            ];
        }

        const orderBy: any = params?.sortBy ? { [params.sortBy]: params.sortOrder || 'asc' } : undefined;

        const findArgs: { where: any; orderBy?: any; take?: number; skip?: number } = { where };
        if (orderBy !== undefined) findArgs.orderBy = orderBy;
        if (params?.limit !== undefined) findArgs.take = params.limit;
        if (params?.offset !== undefined) findArgs.skip = params.offset;

        return this.findModelBaju(findArgs);
    }

    async getModelBajuById(id: number): Promise<modelBajuResponse | null> {
        return prisma.modelBaju.findUnique({
            where: { id }
        });
    }

    async createModelBaju(data: createModelBajuRequest): Promise<modelBajuResponse> {
        return prisma.modelBaju.create({
            data
        });
    }

    async updateModelBaju(id: number, data: updateModelBajuRequest): Promise<modelBajuResponse | null> {
        // Hanya kirim field yang benar-benar ada (bukan undefined)
        const updateData: any = {};

        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {  // Hanya ambil field yang dikirim
                updateData[key] = value;
            }
        }

        return prisma.modelBaju.update({
            where: { id },
            data: updateData
        });
    }

    async deleteModelBaju(id: number): Promise<modelBajuResponse | null> {
        return prisma.modelBaju.delete({
            where: { id }
        });
    }

    async softDeleteModelBaju(id: number): Promise<modelBajuResponse | null> {
        return prisma.modelBaju.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }
}