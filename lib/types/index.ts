import { z } from "zod"

const PersonSchema = z.object({
  id: z.string(),
  name: z.string(),
})

const PersonPortionSchema = z.object({
  personId: z.string(),
  portions: z.number(), // whole numbers: 2 slices, 1 serving, etc.
})

const ReceiptMetadataSchema = z.object({
  businessName: z.string().optional(),
  totalInCents: z.number(),
  dateAsISOString: z.string().optional(),
})

const ReceiptLineItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number(),
  totalPriceInCents: z.number(),
  splitting: z
    .object({
      portions: z.array(PersonPortionSchema),
    })
    .optional(),
})

const SplitMethodSchema = z.enum([
  "equal", // Split equally between assigned people
  "proportional", // Split based on each person's total from line items
  "manual", // Custom portions like line items
])

const ReceiptAdjustmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  amountInCents: z.number(),
  splitting: z.object({
    method: SplitMethodSchema,
    portions: z.array(PersonPortionSchema).optional(),
  }),
})

export const ReceiptSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  billName: z.string().optional(),
  people: z.array(PersonSchema),
  imageUrl: z.string(),
  metadata: ReceiptMetadataSchema,
  lineItems: z.array(ReceiptLineItemSchema),
  adjustments: z.array(ReceiptAdjustmentSchema),
})

export const ReceiptScanSchema = z.object({
  metadata: ReceiptMetadataSchema,
  lineItems: z.array(ReceiptLineItemSchema),
  adjustments: z.array(ReceiptAdjustmentSchema),
})

export type Receipt = z.infer<typeof ReceiptSchema>
export type Person = z.infer<typeof PersonSchema>
export type PersonPortion = z.infer<typeof PersonPortionSchema>
export type ReceiptMetadata = z.infer<typeof ReceiptMetadataSchema>
export type ReceiptLineItem = z.infer<typeof ReceiptLineItemSchema>
export type ReceiptAdjustment = z.infer<typeof ReceiptAdjustmentSchema>
export type ReceiptScan = z.infer<typeof ReceiptScanSchema>
