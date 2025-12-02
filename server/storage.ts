import { randomUUID } from "crypto";
import type { WatchlistItem, InsertWatchlistItem } from "@shared/schema";

export interface IStorage {
  getWatchlist(userId: string): Promise<WatchlistItem[]>;
  addToWatchlist(item: InsertWatchlistItem): Promise<WatchlistItem>;
  removeFromWatchlist(userId: string, symbol: string): Promise<boolean>;
  isInWatchlist(userId: string, symbol: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private watchlist: Map<string, WatchlistItem>;

  constructor() {
    this.watchlist = new Map();
  }

  async getWatchlist(userId: string): Promise<WatchlistItem[]> {
    return Array.from(this.watchlist.values()).filter(
      (item) => item.userId === userId
    );
  }

  async addToWatchlist(item: InsertWatchlistItem): Promise<WatchlistItem> {
    const normalizedSymbol = item.symbol.toUpperCase().trim();
    
    const existing = Array.from(this.watchlist.values()).find(
      (w) => w.userId === item.userId && w.symbol === normalizedSymbol
    );
    
    if (existing) {
      return existing;
    }

    const id = randomUUID();
    const watchlistItem: WatchlistItem = {
      id,
      userId: item.userId,
      symbol: normalizedSymbol,
      addedAt: Date.now(),
    };
    this.watchlist.set(id, watchlistItem);
    return watchlistItem;
  }

  async removeFromWatchlist(userId: string, symbol: string): Promise<boolean> {
    const item = Array.from(this.watchlist.values()).find(
      (w) => w.userId === userId && w.symbol === symbol.toUpperCase()
    );
    
    if (item) {
      this.watchlist.delete(item.id);
      return true;
    }
    return false;
  }

  async isInWatchlist(userId: string, symbol: string): Promise<boolean> {
    return Array.from(this.watchlist.values()).some(
      (item) => item.userId === userId && item.symbol === symbol.toUpperCase()
    );
  }
}

export const storage = new MemStorage();
