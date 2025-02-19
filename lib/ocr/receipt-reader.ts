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
    private readonly prompt: string
  ) {}

  static create(init?: { openai?: OpenAI }): ReceiptReader {
    const prompt = fs.readFileSync(path.join(__dirname, "prompt.txt"), "utf8");

    const openai = init?.openai ?? new OpenAI({ apiKey: config.openaiApiKey() });

    return new ReceiptReader(openai, prompt);
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
