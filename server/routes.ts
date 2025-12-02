import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { searchStocks, getStockDetail, getQuote } from "./finnhub";
import { insertWatchlistItemSchema } from "@shared/schema";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function parseXmlWatchlist(xml: string): string[] {
  const symbols: string[] = [];
  const seen = new Set<string>();
  const symbolRegex = /<symbol>([^<]+)<\/symbol>/g;
  let match;
  while ((match = symbolRegex.exec(xml)) !== null) {
    const symbol = match[1].trim().toUpperCase();
    if (symbol && /^[A-Z0-9.-]{1,10}$/.test(symbol) && !seen.has(symbol)) {
      seen.add(symbol);
      symbols.push(symbol);
    }
  }
  return symbols;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/stocks/search", async (req, res) => {
    try {
      const query = req.query.query as string || req.query.q as string || "";
      const results = await searchStocks(query);
      res.json(results);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Failed to search stocks" });
    }
  });

  app.get("/api/stocks/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const detail = await getStockDetail(symbol.toUpperCase());
      
      if (!detail) {
        return res.status(404).json({ error: "Stock not found" });
      }
      
      res.json(detail);
    } catch (error: any) {
      console.error("Stock detail error:", error);
      if (error.status === 429) {
        return res.status(429).json({ error: "Rate limit exceeded. Please try again later." });
      }
      if (error.status === 401 || error.status === 403) {
        return res.status(error.status).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to fetch stock details" });
    }
  });

  app.get("/api/stocks/:symbol/quote", async (req, res) => {
    try {
      const { symbol } = req.params;
      const quote = await getQuote(symbol.toUpperCase());
      
      if (!quote) {
        return res.status(404).json({ error: "Stock not found" });
      }
      
      res.json(quote);
    } catch (error) {
      console.error("Quote error:", error);
      res.status(500).json({ error: "Failed to fetch quote" });
    }
  });

  app.get("/api/watchlist/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const watchlist = await storage.getWatchlist(userId);
      res.json(watchlist);
    } catch (error) {
      console.error("Watchlist fetch error:", error);
      res.status(500).json({ error: "Failed to fetch watchlist" });
    }
  });

  app.post("/api/watchlist/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      const parseResult = insertWatchlistItemSchema.safeParse({
        userId,
        symbol: req.body.symbol,
      });
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: parseResult.error.errors 
        });
      }

      const item = await storage.addToWatchlist(parseResult.data);
      res.status(201).json(item);
    } catch (error) {
      console.error("Watchlist add error:", error);
      res.status(500).json({ error: "Failed to add to watchlist" });
    }
  });

  app.delete("/api/watchlist/:userId/:symbol", async (req, res) => {
    try {
      const { userId, symbol } = req.params;
      const removed = await storage.removeFromWatchlist(userId, symbol.toUpperCase());
      
      if (!removed) {
        return res.status(404).json({ error: "Item not found in watchlist" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Watchlist remove error:", error);
      res.status(500).json({ error: "Failed to remove from watchlist" });
    }
  });

  app.get("/api/watchlist/:userId/export", async (req, res) => {
    try {
      const { userId } = req.params;
      const watchlist = await storage.getWatchlist(userId);
      
      const xmlParts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<watchlist>',
        `  <exportDate>${new Date().toISOString()}</exportDate>`,
        '  <stocks>'
      ];
      
      for (const item of watchlist) {
        xmlParts.push(`    <stock>`);
        xmlParts.push(`      <symbol>${escapeXml(item.symbol)}</symbol>`);
        xmlParts.push(`      <addedAt>${new Date(item.addedAt).toISOString()}</addedAt>`);
        xmlParts.push(`    </stock>`);
      }
      
      xmlParts.push('  </stocks>');
      xmlParts.push('</watchlist>');
      
      const xml = xmlParts.join('\n');
      
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename="watchlist-${new Date().toISOString().split('T')[0]}.xml"`);
      res.send(xml);
    } catch (error) {
      console.error("Watchlist export error:", error);
      res.status(500).json({ error: "Failed to export watchlist" });
    }
  });

  app.post("/api/watchlist/:userId/import", async (req, res) => {
    try {
      const { userId } = req.params;
      const { xml } = req.body;
      
      if (!xml || typeof xml !== 'string') {
        return res.status(400).json({ error: "XML content is required" });
      }
      
      const symbols = parseXmlWatchlist(xml);
      
      if (symbols.length === 0) {
        return res.status(400).json({ error: "No valid stock symbols found in XML" });
      }
      
      const existingWatchlist = await storage.getWatchlist(userId);
      const existingSymbols = new Set(existingWatchlist.map(item => item.symbol));
      
      const imported: string[] = [];
      const skipped: string[] = [];
      
      for (const symbol of symbols) {
        if (existingSymbols.has(symbol)) {
          skipped.push(symbol);
        } else {
          await storage.addToWatchlist({ userId, symbol });
          imported.push(symbol);
        }
      }
      
      res.json({ 
        success: true, 
        imported, 
        skipped,
        message: `Imported ${imported.length} stocks${skipped.length > 0 ? `, ${skipped.length} already in watchlist` : ''}`
      });
    } catch (error) {
      console.error("Watchlist import error:", error);
      res.status(500).json({ error: "Failed to import watchlist" });
    }
  });

  return httpServer;
}
