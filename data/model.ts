import { State } from "./types"
import { Person, ReceiptAdjustment, ReceiptLineItem, Receipt as ReceiptType } from "@/lib/types"
import { uniqBy } from "ramda"
import { generateId } from "@/lib/id"

export class ReceiptActions {
  constructor(
    private readonly id: string,
    private readonly set: (fn: (state: State) => Partial<State>) => void,
    private readonly get: () => State
  ) {}

  private updateReceipt(fn: (receipt: ReceiptType) => Partial<ReceiptType>) {
    this.set((state) => ({
      receipts: {
        ...state.receipts,
        [this.id]: { ...state.receipts[this.id], ...fn(state.receipts[this.id]) },
      },
    }))
  }

  private updateLineItem(id: string, fn: (lineItem: ReceiptLineItem) => Partial<ReceiptLineItem>) {
    this.updateReceipt((receipt) => ({
      ...receipt,
      lineItems: receipt.lineItems.map((x) => (x.id === id ? { ...x, ...fn(x) } : x)),
    }))
  }

  private updateAdjustment(
    id: string,
    fn: (adjustment: ReceiptAdjustment) => Partial<ReceiptAdjustment>
  ) {
    this.updateReceipt((receipt) => ({
      ...receipt,
      adjustments: receipt.adjustments.map((x) => (x.id === id ? { ...x, ...fn(x) } : x)),
    }))
  }

  addPerson(person: Omit<Person, "id">) {
    const id = generateId()
    this.updateReceipt((receipt) => ({
      ...receipt,
      people: uniqBy((x) => x.id, [...receipt.people, { ...person, id }]),
    }))
  }

  removePerson(id: string) {
    this.updateReceipt((receipt) => ({
      ...receipt,
      people: receipt.people.filter((x) => x.id !== id),
    }))
  }

  updatePerson(id: string, person: Omit<Person, "id">) {
    this.updateReceipt((receipt) => ({
      people: receipt.people.map((x) => (x.id === id ? { ...x, ...person } : x)),
    }))
  }

  addPersonToLineItem(lineItemId: string, personId: string) {
    const person = this.get().receipts[this.id].people.find((x) => x.id === personId)
    if (!person) {
      throw new Error("Person not found")
    }
    this.updateLineItem(lineItemId, (lineItem) => ({
      splitting: {
        portions: uniqBy(
          (x) => x.personId,
          [...(lineItem.splitting?.portions ?? []), { personId, portions: 1 }]
        ),
      },
    }))
  }

  removePersonFromLineItem(lineItemId: string, personId: string) {
    this.updateLineItem(lineItemId, (lineItem) => ({
      splitting: {
        portions: lineItem.splitting
          ? lineItem.splitting.portions.filter((x) => x.personId !== personId)
          : [],
      },
    }))
  }

  addLineItem(lineItem: Omit<ReceiptLineItem, "id">) {
    const id = generateId()
    this.updateReceipt((receipt) => ({
      lineItems: [...receipt.lineItems, { ...lineItem, id }],
    }))
  }

  removeLineItem(id: string) {
    this.updateReceipt((receipt) => ({
      lineItems: receipt.lineItems.filter((x) => x.id !== id),
    }))
  }

  updateLineItemDetails(id: string, lineItem: Omit<ReceiptLineItem, "id" | "splitting">) {
    this.updateLineItem(id, () => ({
      ...lineItem,
    }))
  }

  addAdjustment(adjustment: Omit<ReceiptAdjustment, "id" | "splitting">) {
    const id = generateId()
    this.updateReceipt((receipt) => ({
      adjustments: [...receipt.adjustments, { ...adjustment, id, splitting: { method: "equal" } }],
    }))
  }

  removeAdjustment(id: string) {
    this.updateReceipt((receipt) => ({
      adjustments: receipt.adjustments.filter((x) => x.id !== id),
    }))
  }

  updateAdjustmentDetails(id: string, adjustment: Omit<ReceiptAdjustment, "id" | "splitting">) {
    this.updateAdjustment(id, () => ({
      ...adjustment,
    }))
  }
}
