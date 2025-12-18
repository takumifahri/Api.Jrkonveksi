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
  material_id: z.number().int().optional().nullable()
});

const updateSchema = createSchema.partial();

const terimaSchema = z.object({
  status: z.literal("setuju")
});

const tolakSchema = z.object({
  status: z.literal("ditolak"),
  alasan_ditolak: z.string().min(1)
});

const dealNegosiasiSchema = z.object({
  status: z.literal("deal"),
  total_harga: z.union([
    z.string().transform((val) => BigInt(val)),
    z.number().transform((val) => BigInt(val)),
    z.bigint()
  ])
});

const batalPemesananSchema = z.object({
  status: z.literal("dibatalkan"),
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