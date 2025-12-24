import z from "zod";

const createSchema = z.object({
  nama_pemesanan: z.string().min(1),
  ukuran: z.enum([
    "extra_small",
    "small",
    "medium",
    "reguler",
    "large",
    "extra_large",
    "double_extra_large",
    "custom"
  ]),
  jumlah_barang: z.number().int().nonnegative(),
  warna: z.string().optional().nullable(),
  user_id: z.number().int().positive(),
  status: z.enum([
    "pending",
    "ditolak",
    "negosiasi",
    "pembayaran",
    "pengerjaan",
    "dibatalkan",
    "selesai"
  ]).optional(),
  catatan: z.string().optional().nullable(),
  material_sendiri: z.boolean().optional(),
  material_id: z.number().int().optional().nullable(),
  model_baju_id: z.number().int().optional().nullable(),
  referensi_custom: z.boolean().optional(),
  file_referensi_custom: z.array(z.string().url()).optional().nullable()
});

const updateSchema = createSchema.partial();

const terimaSchema = z.object({
  admin_id: z.number().int().positive("admin_id must be a positive integer")
});

const tolakSchema = z.object({
  admin_id: z.number().int().positive("admin_id must be a positive integer"),
  alasan_ditolak: z.string().min(1, "alasan_ditolak is required")
});

const dealNegosiasiSchema = z.object({
  admin_id: z.number().int().positive("admin_id must be a positive integer"),
  total_harga: z.union([
    z.string().transform((val) => BigInt(val)),
    z.number().transform((val) => BigInt(val)),
    z.bigint()
  ]).refine((val) => val > 0n, { message: "total_harga must be positive" })
});

const batalPemesananSchema = z.object({
  admin_id: z.number().int().positive("admin_id must be a positive integer"),
  alasan_ditolak: z.string().optional().nullable()
});

const validatorCustomOrder = {
  createSchema,
  updateSchema,
  terimaSchema,
  tolakSchema,
  dealNegosiasiSchema,
  batalPemesananSchema
};

export default validatorCustomOrder;