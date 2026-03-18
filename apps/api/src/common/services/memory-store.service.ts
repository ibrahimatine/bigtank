import { Injectable, Logger } from '@nestjs/common';

/**
 * Store cle-valeur en memoire avec TTL automatique.
 * Remplace Redis pour le rate limiting (faible trafic).
 * Nettoyage periodique toutes les 5 minutes.
 */
@Injectable()
export class MemoryStoreService {
  private readonly logger = new Logger(MemoryStoreService.name);
  private store = new Map<string, { value: string; expiresAt: number }>();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    // Nettoyage des cles expirees toutes les 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async incr(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.expiresAt) {
      // Pas de TTL par defaut — sera defini par expire()
      this.store.set(key, { value: '1', expiresAt: Date.now() + 3600 * 1000 });
      return 1;
    }
    const newVal = parseInt(entry.value, 10) + 1;
    entry.value = String(newVal);
    return newVal;
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    const entry = this.store.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + ttlSeconds * 1000;
    }
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.expiresAt) return -2;
    return Math.ceil((entry.expiresAt - Date.now()) / 1000);
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  private cleanup() {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      this.logger.debug(`Nettoyage memoire : ${cleaned} cles expirees supprimees`);
    }
  }

  onModuleDestroy() {
    clearInterval(this.cleanupInterval);
  }
}
