import { type User, type InsertUser, type Scan, type InsertScan } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByKakaoId(kakaoId: string): Promise<User | undefined>;
  getUserByLineId(lineId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  createScan(scan: InsertScan): Promise<Scan>;
  getScansByUserId(userId: string): Promise<Scan[]>;
  getAllScans(): Promise<Scan[]>;
  getScanByShareToken(shareToken: string): Promise<Scan | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private scans: Map<string, Scan>;

  constructor() {
    this.users = new Map();
    this.scans = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.googleId === googleId);
  }

  async getUserByKakaoId(kakaoId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.kakaoId === kakaoId);
  }

  async getUserByLineId(lineId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.lineId === lineId);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      username: insertUser.username,
      password: insertUser.password ?? null,
      googleId: insertUser.googleId ?? null,
      kakaoId: insertUser.kakaoId ?? null,
      lineId: insertUser.lineId ?? null,
      email: insertUser.email ?? null,
      avatar: insertUser.avatar ?? null,
    };
    this.users.set(id, user);
    return user;
  }

  async createScan(insertScan: InsertScan): Promise<Scan> {
    const id = randomUUID();
    const scan: Scan = {
      id,
      userId: insertScan.userId,
      overallScore: insertScan.overallScore,
      scores: insertScan.scores,
      hotspots: insertScan.hotspots,
      aiComment: insertScan.aiComment || null,
      imageSrc: insertScan.imageSrc || null,
      baumannType: insertScan.baumannType || null,
      skinAge: insertScan.skinAge || null,
      shareToken: insertScan.shareToken || null,
      createdAt: new Date().toISOString(),
    };
    this.scans.set(id, scan);
    return scan;
  }

  async getScansByUserId(userId: string): Promise<Scan[]> {
    return Array.from(this.scans.values())
      .filter((scan) => scan.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getAllScans(): Promise<Scan[]> {
    return Array.from(this.scans.values());
  }

  async getScanByShareToken(shareToken: string): Promise<Scan | undefined> {
    return Array.from(this.scans.values()).find(s => s.shareToken === shareToken);
  }
}

export const storage = new MemStorage();
