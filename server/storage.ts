import { randomUUID } from "crypto";
import type { WatchlistItem, InsertWatchlistItem, ShareToken, InsertShareToken, SavedWatchlist, InsertSavedWatchlist } from "@shared/schema";

function generateShareId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export interface IStorage {
  getWatchlist(userId: string): Promise<WatchlistItem[]>;
  addToWatchlist(item: InsertWatchlistItem): Promise<WatchlistItem>;
  removeFromWatchlist(userId: string, symbol: string): Promise<boolean>;
  isInWatchlist(userId: string, symbol: string): Promise<boolean>;
  getTopWatchlistStocks(limit: number): Promise<{ symbol: string; count: number }[]>;
  
  createShareToken(ownerId: string, label?: string | null): Promise<ShareToken>;
  getShareToken(shareId: string): Promise<ShareToken | null>;
  getSharesByOwner(ownerId: string): Promise<ShareToken[]>;
  revokeShareToken(shareId: string, ownerId: string): Promise<boolean>;
  
  saveWatchlist(userId: string, shareId: string, alias?: string | null): Promise<SavedWatchlist>;
  getSavedWatchlists(userId: string): Promise<SavedWatchlist[]>;
  removeSavedWatchlist(userId: string, shareId: string): Promise<boolean>;
  updateSavedWatchlistAlias(userId: string, shareId: string, alias: string | null): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private watchlist: Map<string, WatchlistItem>;
  private shareTokens: Map<string, ShareToken>;
  private savedWatchlists: Map<string, SavedWatchlist>;

  constructor() {
    this.watchlist = new Map();
    this.shareTokens = new Map();
    this.savedWatchlists = new Map();
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

  async getTopWatchlistStocks(limit: number): Promise<{ symbol: string; count: number }[]> {
    const symbolCounts = new Map<string, number>();
    
    for (const item of this.watchlist.values()) {
      const normalizedSymbol = item.symbol.toUpperCase().trim();
      const current = symbolCounts.get(normalizedSymbol) || 0;
      symbolCounts.set(normalizedSymbol, current + 1);
    }
    
    const sorted = Array.from(symbolCounts.entries())
      .map(([symbol, count]) => ({ symbol, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    return sorted;
  }

  async createShareToken(ownerId: string, label?: string | null): Promise<ShareToken> {
    const existing = Array.from(this.shareTokens.values()).find(
      (t) => t.ownerId === ownerId && t.isActive
    );
    
    if (existing) {
      return existing;
    }

    const shareToken: ShareToken = {
      id: generateShareId(),
      ownerId,
      label: label || null,
      createdAt: Date.now(),
      isActive: true,
    };
    
    this.shareTokens.set(shareToken.id, shareToken);
    return shareToken;
  }

  async getShareToken(shareId: string): Promise<ShareToken | null> {
    const token = this.shareTokens.get(shareId);
    if (!token || !token.isActive) {
      return null;
    }
    return token;
  }

  async getSharesByOwner(ownerId: string): Promise<ShareToken[]> {
    return Array.from(this.shareTokens.values()).filter(
      (token) => token.ownerId === ownerId && token.isActive
    );
  }

  async revokeShareToken(shareId: string, ownerId: string): Promise<boolean> {
    const token = this.shareTokens.get(shareId);
    if (token && token.ownerId === ownerId && token.isActive) {
      token.isActive = false;
      this.shareTokens.set(shareId, token);
      return true;
    }
    return false;
  }

  async saveWatchlist(userId: string, shareId: string, alias?: string | null): Promise<SavedWatchlist> {
    const existingKey = `${userId}:${shareId}`;
    const existing = Array.from(this.savedWatchlists.values()).find(
      (s) => s.userId === userId && s.shareId === shareId
    );
    
    if (existing) {
      return existing;
    }

    const saved: SavedWatchlist = {
      id: randomUUID(),
      userId,
      shareId,
      alias: alias || null,
      addedAt: Date.now(),
    };
    
    this.savedWatchlists.set(saved.id, saved);
    return saved;
  }

  async getSavedWatchlists(userId: string): Promise<SavedWatchlist[]> {
    return Array.from(this.savedWatchlists.values()).filter(
      (s) => s.userId === userId
    );
  }

  async removeSavedWatchlist(userId: string, shareId: string): Promise<boolean> {
    const saved = Array.from(this.savedWatchlists.values()).find(
      (s) => s.userId === userId && s.shareId === shareId
    );
    
    if (saved) {
      this.savedWatchlists.delete(saved.id);
      return true;
    }
    return false;
  }

  async updateSavedWatchlistAlias(userId: string, shareId: string, alias: string | null): Promise<boolean> {
    const saved = Array.from(this.savedWatchlists.values()).find(
      (s) => s.userId === userId && s.shareId === shareId
    );
    
    if (saved) {
      saved.alias = alias;
      this.savedWatchlists.set(saved.id, saved);
      return true;
    }
    return false;
  }
}

export const storage = new MemStorage();
