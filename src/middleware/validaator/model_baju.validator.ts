import z from "zod";

const createSchema = z.object({
    uniqueId: z.string().optional().nullable(),
    nama: z.string().min(1, "nama tidak boleh kosong"),
    deskripsi: z.string().optional().nullable(),
    material: z.string().min(1, "material tidak boleh kosong"),
    harga_minimum: z.union([
        z.string().transform((val) => BigInt(val)),
        z.number().transform((val) => BigInt(val)),
        z.bigint()
    ]).optional().nullable().refine(
        (val) => val === null || val === undefined || val >= 0n, 
        { message: "harga_minimum harus bernilai positif atau nol" }
    ),
    harga_maximum: z.union([
        z.string().transform((val) => BigInt(val)),
        z.number().transform((val) => BigInt(val)),
        z.bigint()
    ]).optional().nullable().refine(
        (val) => val === null || val === undefined || val >= 0n, 
        { message: "harga_maximum harus bernilai positif atau nol" }
    ),
    gambar_ref: z.string().url("format URL tidak valid").optional().nullable(),
    size: z.any().optional().nullable()
}).refine(
    (data) => {
        if (data.harga_minimum !== null && data.harga_minimum !== undefined &&
            data.harga_maximum !== null && data.harga_maximum !== undefined) {
            return data.harga_minimum <= data.harga_maximum;
        }
        return true;
    },
    { message: "harga_minimum harus lebih kecil atau sama dengan harga_maximum", path: ["harga_minimum"] }
);

const updateSchema = z.object({
    nama: z.string().min(1, "nama tidak boleh kosong").optional().nullable(),
    deskripsi: z.string().optional().nullable(),
    material: z.string().min(1, "material tidak boleh kosong").optional().nullable(),
    harga_minimum: z.union([
        z.string().transform((val) => BigInt(val)),
        z.number().transform((val) => BigInt(val)),
        z.bigint()
    ]).optional().nullable().refine(
        (val) => val === null || val === undefined || val >= 0n, 
        { message: "harga_minimum harus bernilai positif atau nol" }
    ),
    harga_maximum: z.union([
        z.string().transform((val) => BigInt(val)),
        z.number().transform((val) => BigInt(val)),
        z.bigint()
    ]).optional().nullable().refine(
        (val) => val === null || val === undefined || val >= 0n, 
        { message: "harga_maximum harus bernilai positif atau nol" }
    ),
    gambar_ref: z.string().url("format URL tidak valid").optional().nullable(),
    size: z.any().optional().nullable()
}).refine(
    (data) => {
        if (data.harga_minimum !== null && data.harga_minimum !== undefined &&
            data.harga_maximum !== null && data.harga_maximum !== undefined) {
            return data.harga_minimum <= data.harga_maximum;
        }
        return true;
    },
    { message: "harga_minimum harus lebih kecil atau sama dengan harga_maximum", path: ["harga_minimum"] }
);

const validatorModelBaju = {
    createSchema,
    updateSchema
};

export default validatorModelBaju;