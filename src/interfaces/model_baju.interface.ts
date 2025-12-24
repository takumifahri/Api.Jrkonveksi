import type { Requester } from "./auth.interface.js";

export interface createModelBajuRequest {
    uniqueId?: string | null;
    nama: string;
    deskripsi?: string | null;
    material: string;
    harga_minimum?: bigint | null;
    harga_maximum?: bigint | null;
    gambar_ref?: string | null;
    size?: any | null;
}

export interface updateModelBajuRequest {
    nama?: string | null;
    deskripsi?: string | null;
    material?: string | null;
    harga_minimum?: bigint | null;
    harga_maximum?: bigint | null;
    gambar_ref?: string | null;
    size?: any | null;
}

export interface modelBajuResponse {
    id: number;
    unique_id: string;
    nama: string;
    deskripsi: string | null;
    material: string;
    harga_minimum?: bigint | null;
    harga_maximum?: bigint | null;
    gambar_ref: string | null;
    size: any | null;
 
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

export interface IModelBajuInterface {
    getAllModelBaju(
        params?: {
            q?: string | null;
            limit?: number | undefined;
            offset?: number | undefined;
            sortBy?: string | null;
            sortOrder?: 'asc' | 'desc';
        },
        requester?: Requester
    ): Promise<modelBajuResponse[]>;
    getModelBajuById(id: number): Promise<modelBajuResponse | null>;
    createModelBaju(data: createModelBajuRequest): Promise<modelBajuResponse>;
    updateModelBaju(id: number, data: updateModelBajuRequest): Promise<modelBajuResponse | null>;
    deleteModelBaju(id: number): Promise<modelBajuResponse | null>;
    softDeleteModelBaju(id: number): Promise<modelBajuResponse | null>;
}