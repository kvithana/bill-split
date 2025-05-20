import { redis } from "@/lib/upstash/client"
import { Receipt } from "@/lib/types"

/**
 * Utility class for cloud receipt storage operations
 */
export class CloudReceiptStorage {
  private static RECEIPT_KEY_PREFIX = "receipt:"
  private static TTL_DAYS = 30 // Default TTL for receipts - 30 days

  /**
   * Store a receipt in the cloud
   * @param receipt The receipt to store
   * @returns The stored receipt with updated cloud metadata
   */
  static async saveReceipt(receipt: Receipt): Promise<Receipt> {
    // Add or update cloud metadata
    const cloudReceipt = {
      ...receipt,
      isShared: true,
      lastSyncedAt: new Date().toISOString(),
    } as Receipt

    // Store in Redis with TTL (30 days)
    await redis.set(
      this.getReceiptKey(receipt.id),
      cloudReceipt,
      { ex: this.TTL_DAYS * 24 * 60 * 60 } // TTL in seconds
    )

    return cloudReceipt
  }

  /**
   * Get a receipt from the cloud
   * @param receiptId The receipt ID to fetch
   * @returns The receipt or null if not found
   */
  static async getReceipt(receiptId: string): Promise<Receipt | null> {
    try {
      const receipt = await redis.get<Receipt>(this.getReceiptKey(receiptId))
      return receipt
    } catch (error) {
      console.error("Error fetching receipt from cloud:", error)
      return null
    }
  }

  /**
   * Update specific fields of a receipt
   * @param receiptId The receipt ID to update
   * @param updates Partial receipt data to apply
   * @returns The updated receipt or null if not found/failed
   */
  static async updateReceipt(
    receiptId: string,
    updates: Partial<Receipt>
  ): Promise<Receipt | null> {
    try {
      // Get current receipt
      const currentReceipt = await this.getReceipt(receiptId)
      if (!currentReceipt) {
        return null
      }

      // Apply updates
      const updatedReceipt = {
        ...currentReceipt,
        ...updates,
        lastSyncedAt: new Date().toISOString(),
      } as Receipt

      // Save the updated receipt
      await this.saveReceipt(updatedReceipt)
      return updatedReceipt
    } catch (error) {
      console.error("Error updating receipt in cloud:", error)
      return null
    }
  }

  /**
   * Add a person to a receipt
   * @param receiptId The receipt ID
   * @param person The person to add
   * @returns The updated receipt or null if not found/failed
   */
  static async addPerson(
    receiptId: string,
    person: { id: string; name: string }
  ): Promise<Receipt | null> {
    try {
      const receipt = await this.getReceipt(receiptId)
      if (!receipt) {
        return null
      }

      // Don't add duplicate people
      if (receipt.people.some((p) => p.id === person.id)) {
        return receipt
      }

      // Update people array
      return await this.updateReceipt(receiptId, {
        people: [...receipt.people, person],
      })
    } catch (error) {
      console.error("Error adding person to receipt:", error)
      return null
    }
  }

  /**
   * Remove a person from a receipt
   * @param receiptId The receipt ID
   * @param personId The person ID to remove
   * @returns The updated receipt or null if not found/failed
   */
  static async removePerson(receiptId: string, personId: string): Promise<Receipt | null> {
    try {
      const receipt = await this.getReceipt(receiptId)
      if (!receipt) {
        return null
      }

      // Update people array
      return await this.updateReceipt(receiptId, {
        people: receipt.people.filter((p) => p.id !== personId),
      })
    } catch (error) {
      console.error("Error removing person from receipt:", error)
      return null
    }
  }

  /**
   * Generate a key for storing receipts in Redis
   * @param receiptId The receipt ID
   * @returns The Redis key
   */
  private static getReceiptKey(receiptId: string): string {
    return `${this.RECEIPT_KEY_PREFIX}${receiptId}`
  }
}
