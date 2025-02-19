import {
  Receipt as ReceiptType,
  Person,
  ReceiptLineItem,
  ReceiptAdjustment,
  PersonPortion,
} from "@/lib/types";
import { generateId } from "@/lib/id";

type CreateReceiptParams = {
  metadata: { businessName?: string; totalInCents: number };
  lineItems: Omit<ReceiptLineItem, "id">[];
  adjustments: Omit<ReceiptAdjustment, "id">[];
  imageUrl: string;
};

export class Receipt {
  private receipt: ReceiptType;

  constructor(receipt: ReceiptType) {
    this.receipt = receipt;
  }

  static create(params: CreateReceiptParams): Receipt {
    const receipt: ReceiptType = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      people: [],
      imageUrl: params.imageUrl,
      metadata: params.metadata,
      lineItems: params.lineItems.map((item) => ({
        ...item,
        id: generateId(),
      })),
      adjustments: params.adjustments.map((adj) => ({
        ...adj,
        id: generateId(),
      })),
    };

    return new Receipt(receipt);
  }

  // Person mutations
  addPerson(name: string): Receipt {
    const person: Person = {
      id: generateId(),
      name,
    };
    this.receipt.people.push(person);
    return this;
  }

  removePerson(personId: string) {
    this.receipt.people = this.receipt.people.filter((p) => p.id !== personId);
    // Clean up any splits that referenced this person
    this.receipt.lineItems.forEach((item) => {
      if (item.splitting) {
        item.splitting.portions = item.splitting.portions.filter((p) => p.personId !== personId);
      }
    });
    this.receipt.adjustments.forEach((adj) => {
      if (adj.splitting.portions) {
        adj.splitting.portions = adj.splitting.portions.filter((p) => p.personId !== personId);
      }
    });
    return this;
  }

  // Updated line item mutations
  updateLineItemSplit(lineItemId: string, portions: PersonPortion[]) {
    const lineItem = this.receipt.lineItems.find((item) => item.id === lineItemId);
    if (lineItem) {
      lineItem.splitting = { portions };
    }
    return this;
  }

  // Updated adjustment mutations
  updateAdjustmentSplit(
    adjustmentId: string,
    method: "equal" | "proportional" | "manual",
    portions?: PersonPortion[]
  ) {
    const adjustment = this.receipt.adjustments.find((adj) => adj.id === adjustmentId);
    if (adjustment) {
      adjustment.splitting = {
        method,
        portions,
      };
    }
    return this;
  }

  // Getters
  getData(): ReceiptType {
    return { ...this.receipt };
  }

  getPeople(): Person[] {
    return [...this.receipt.people];
  }

  getLineItem(id: string): ReceiptLineItem | null {
    return this.receipt.lineItems.find((item) => item.id === id) ?? null;
  }

  getAdjustment(id: string): ReceiptAdjustment | null {
    return this.receipt.adjustments.find((adj) => adj.id === id) ?? null;
  }

  getAllLineItems(): ReceiptLineItem[] {
    return [...this.receipt.lineItems];
  }

  getAllAdjustments(): ReceiptAdjustment[] {
    return [...this.receipt.adjustments];
  }
}
