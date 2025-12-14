import { prisma } from "../../config/prisma.config.js";

export interface IMaterialManagementRepository {
    createMaterial(data: any): Promise<any>;
    getAllMaterials(): Promise<any[]>;
    getMaterialById(id: number): Promise<any>;
    updateMaterial(id: number, data: any): Promise<any>;
    softDeleteMaterial(id: number): Promise<any>;
    deleteMaterial(id: number): Promise<any>;
}

export class MaterialManagementRepository implements IMaterialManagementRepository {
    async createMaterial(data: any): Promise<any> {
        return await prisma.materials.create({
            data
        });
    }

    async getAllMaterials(): Promise<any[]> {
        return await prisma.materials.findMany();
    }

    async getMaterialById(id: number): Promise<any> {
        return await prisma.materials.findUnique({
            where: { id }
        });
    }

    async updateMaterial(id: number, data: any): Promise<any> {
        return await prisma.materials.update({
            where: { id },
            data
        });
    }

    async softDeleteMaterial(id: number): Promise<any> {
        return await prisma.materials.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }
    async deleteMaterial(id: number): Promise<any> {
        return await prisma.materials.delete({
            where: { id }
        });
    }
}