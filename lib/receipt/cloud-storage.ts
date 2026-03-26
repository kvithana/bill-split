import { supabase } from "@/lib/supabase/client"
import { Receipt } from "@/lib/types"
import { computeReceiptHash } from "./hash"
import { toRow, fromRow } from "./row-mapper"

/**
 * Utility class for cloud receipt storage operations using Supabase.
 */
export class CloudReceiptStorage {
  /**
   * Store a receipt in the cloud (insert or replace).
   */
  static async saveReceipt(receipt: Receipt): Promise<Receipt> {
    const hash = await computeReceiptHash(receipt)
    const cloudReceipt: Receipt = {
      ...receipt,
      isShared: true,
      lastSyncedAt: new Date().toISOString(),
      hash,
    }

    const { error } = await supabase.from("receipts").upsert(toRow(cloudReceipt))
    if (error) throw new Error(`Failed to save receipt: ${error.message}`)

    return cloudReceipt
  }

  /**
   * Get a receipt from the cloud by ID. Returns null if not found.
   */
  static async getReceipt(receiptId: string): Promise<Receipt | null> {
    const { data, error } = await supabase
      .from("receipts")
      .select("*")
      .eq("id", receiptId)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null // not found
      throw new Error(`Failed to fetch receipt: ${error.message}`)
    }

    return data ? fromRow(data) : null
  }

  /**
   * Update specific fields of a receipt with optional hash-based conflict detection.
   * Throws "Receipt has been modified by another user" if hash mismatch.
   * Returns null if the receipt does not exist.
   */
  static async updateReceipt(
    receiptId: string,
    updates: Partial<Receipt>,
    hash?: string
  ): Promise<Receipt | null> {
    const currentReceipt = await this.getReceipt(receiptId)
    if (!currentReceipt) return null

    if (hash && currentReceipt.hash !== hash) {
      throw new Error("Receipt has been modified by another user")
    }

    const updatedReceipt: Receipt = {
      ...currentReceipt,
      ...updates,
      lastSyncedAt: new Date().toISOString(),
    }

    return await this.saveReceipt(updatedReceipt)
  }

  /**
   * Add a person to a receipt. No-ops if the person already exists.
   * Throws "Receipt has been modified by another user" on hash mismatch.
   */
  static async addPerson(
    receiptId: string,
    person: { id: string; name: string },
    hash?: string
  ): Promise<Receipt | null> {
    const receipt = await this.getReceipt(receiptId)
    if (!receipt) return null

    if (receipt.people.some((p) => p.id === person.id)) return receipt

    return await this.updateReceipt(receiptId, { people: [...receipt.people, person] }, hash)
  }

  /**
   * Remove a person from a receipt.
   * Throws "Receipt has been modified by another user" on hash mismatch.
   */
  static async removePerson(
    receiptId: string,
    personId: string,
    hash?: string
  ): Promise<Receipt | null> {
    const receipt = await this.getReceipt(receiptId)
    if (!receipt) return null

    return await this.updateReceipt(
      receiptId,
      { people: receipt.people.filter((p) => p.id !== personId) },
      hash
    )
  }

  /**
   * List all receipts for a given device (owner or contributor).
   */
  static async listReceiptsByDevice(deviceId: string): Promise<Receipt[]> {
    const { data, error } = await supabase
      .from("receipts")
      .select("*")
      .or(`owner_id.eq.${deviceId},device_id.eq.${deviceId}`)

    if (error) throw new Error(`Failed to list receipts: ${error.message}`)

    return (data ?? []).map(fromRow)
  }

  /**
   * Delete a receipt. Only the owner (matching deviceId) can delete.
   * Returns true if deleted, false if not found or not authorized.
   */
  static async deleteReceipt(receiptId: string, deviceId: string): Promise<boolean> {
    const { error, count } = await supabase
      .from("receipts")
      .delete({ count: "exact" })
      .eq("id", receiptId)
      .eq("owner_id", deviceId)

    if (error) throw new Error(`Failed to delete receipt: ${error.message}`)

    return (count ?? 0) > 0
  }
}
