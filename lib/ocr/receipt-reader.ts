import { OpenAI } from "openai";
import { ReceiptScanSchema } from "@/lib/types";
import fs from "fs";
import path from "path";
import { zodResponseFormat } from "openai/helpers/zod";
import { config } from "@/config";
import { Receipt } from "../receipt";

type ReceiptReaderResponse = {
  receipt: Receipt | null;
  success: boolean;
  error: string | null;
};

export class ReceiptReader {
  constructor(
    private readonly openai: OpenAI,
    private readonly prompt: string = PROMPT
  ) {}

  static create(init?: { openai?: OpenAI }): ReceiptReader {
    const openai = init?.openai ?? new OpenAI({ apiKey: config.openaiApiKey() });

    return new ReceiptReader(openai);
  }

  async readReceipt(imageUrl: string): Promise<ReceiptReaderResponse> {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: this.prompt,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      response_format: zodResponseFormat(ReceiptScanSchema, "receipt"),
    });

    const result = completion.choices[0].message;

    if (result.refusal) {
      return {
        receipt: null,
        success: false,
        error: result.refusal,
      };
    } else {
      const scanned = ReceiptScanSchema.parse(JSON.parse(result.content!));
      const receipt = Receipt.create({
        ...scanned,
        imageUrl,
      });
      return {
        receipt,
        success: true,
        error: null,
      };
    }
  }
}

const PROMPT = `
You are a smart OCR system that can read the text of a receipt and extract the data into a structured format for the purpose of splitting a bill.
You may need to transform and infer the data to fit this format. Be as accurate as possible.
Note that adjustments are things such as credit card surcharges, tips, holiday surcharges, percentage discounts, etc. but not things like GST which is already included in the line item cost.
You can rename these to a more descriptive name if necessary. 
Wait and validate the entries to ensure they are correct.
Leave \`splitting\` fields on line items undefined.
`;
