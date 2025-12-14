
export enum statusMaterials {
    AVAILABLE = 'AVAILABLE',
    HABIS = 'HABIS',
}
export interface createMaterialRequest {
    uniqueId?: string | null;
    name: string;
    description?: string | null;
    quantity?: number | null;
    status?: statusMaterials;
}

export interface updateMaterialRequest {
    name?: string | null;
    description?: string | null;
    quantity?: number | null;
    status?: statusMaterials;
}

export interface MaterialResponse {
    id: number;
    unique_id: string;
    name: string;
    description: string;
    quantity: number;
    status: statusMaterials;

    createdAt: Date;
    updatedAt?: Date | null;
}


export interface IMaterialManagementService {
    //  CRUD 
    createMaterial(request: createMaterialRequest): Promise<MaterialResponse>;
    getMaterialById(id: number): Promise<MaterialResponse>;
    updateMaterial(id: number, request: updateMaterialRequest): Promise<MaterialResponse>;
    softDeleteMaterial(id: number): Promise<{ success: boolean; message: string }>;
    deleteMaterial(id: number): Promise<{ success: boolean; message: string }>;
}