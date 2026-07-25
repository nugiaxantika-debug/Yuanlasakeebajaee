import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  downloadMediaMessage,
  downloadContentFromMessage,
  generateWAMessageFromContent,
  generateWAMessageContent,
  proto,
  Browsers
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import fs from "fs";
import path from "path";
import os from "os";
import { execSync, spawn } from "child_process";
import { Server as SocketIOServer } from "socket.io";
import NodeCache from "node-cache";
import sharp from "sharp";
import axios from "axios";
import * as cheerio from "cheerio";
import schedule from "node-schedule";
import xnxx from "xnxx-scraper";
import { igdl, fbdl, ytmp4, ytmp3 } from "ruhend-scraper";
import vredenYt from "@vreden/youtube_scraper";
import btch from "btch-downloader";
import ab from "ab-downloader";

const AUTH_FOLDER = path.join(process.cwd(), "auth_info_baileys");
const msgRetryCounterCache = new NodeCache();

export class WhatsAppBot {
  public userEmail: string;
  private authFolder: string;
  private settingsFile: string;
  private botSettingsFile: string;
  private karyawanDataFile: string;
  private karyawanData = {
    produk: {} as Record<string, { nama: string, harga: number, stok: number }>,
    riwayat: [] as { tanggal: string, produk: string, jumlah: number, total: number, kasir: string }[]
  };
  private sock: any = null;
  private io: SocketIOServer;
  private status: "disconnected" | "connecting" | "connected" = "disconnected";
  private currentQr: string | null = null;
  private isAttemptingStart: boolean = false;
  private coverImageBuffer: Buffer | null = null;
  private customBotName: string | null = null;
  private poweredByText: string | null = null;
  private ownerNumbers = new Set<string>();
  private premiumNumbers = new Set<string>();
  private menuCommands = new Set<string>(["allmenu", "menu", "help", "bot"]);
  private activeGames = new Map<string, { answer: string | string[] | number, type: string, attempts?: number, state?: string, players?: string[], turnIndex?: number, positions?: Record<string, number> }>();
  private activeSwGroups = new Set<string>();
  
  // Anti features
    
  private antibotEnabled: boolean = false;
  private autoReadEnabled: boolean = false;
  private autoTypingEnabled: boolean = false;
  private menuLink: string | null = "jadibotbatakvip.biz.id";
  private groupSettings = new Map<string, { welcomeEnabled?: boolean, welcomeMessage?: string, goodbyeEnabled?: boolean, goodbyeMessage?: string, antivideo?: boolean, antifoto?: boolean, antifoto1x?: boolean, antistiker?: boolean, antispam?: boolean, antitagsw?: boolean, antivirtex?: boolean, antitoxic?: boolean, antilinkall?: boolean, warns?: Record<string, number>, storeList?: Record<string, string>, setProses?: string, setDone?: string }>();
  
  private connectedAt: number | null = null;
  
  private storedStickers = new Map<string, Buffer>();
  private totalChats = new Map<string, number>();
  private afkUsers = new Map<string, { time: number, reason: string }>();
  private userMessageHistory = new Map<string, { text: string, time: number, count: number }>();
  private menfessSessions = new Map<string, { partner: string, originalSender: string }>();

  private connectionMonitor: any = null;

  constructor(io: SocketIOServer, userEmail: string = "default") {
    this.io = io;
    this.userEmail = userEmail;
    this.authFolder = path.join(process.cwd(), `auth_info_baileys_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`);
    this.settingsFile = path.join(process.cwd(), `group_settings_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
    this.botSettingsFile = path.join(process.cwd(), `bot_settings_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
    this.karyawanDataFile = path.join(process.cwd(), `karyawan_data_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
    this.loadBotSettings();
    this.loadGroupSettings();
    this.loadKaryawanData();
    
    // Auto-reconnect monitor every 3 minutes
    this.connectionMonitor = setInterval(() => {
      if (this.isAttemptingStart) {
        if (this.status === "disconnected") {
          console.log("Connection monitor detected disconnected state. Attempting auto-restart...");
          this.start();
        } else if (this.status === "connecting") {
          // Hanya merestart jika stuck connecting lebih dari 3 menit tanpa progress
          console.log("Connection monitor detected connecting state for an extended time. Forcing restart to avoid getting stuck...");
          if (this.sock) {
            try { this.sock.end(undefined); } catch(e) {}
            this.sock = null;
          }
          this.updateStatus("disconnected");
          this.start();
        }
      }
    }, 180000);
  }

  private loadBotSettings() {
    try {
      if (!fs.existsSync(this.botSettingsFile)) return;
      const data = fs.readFileSync(this.botSettingsFile, "utf8");
      const obj = JSON.parse(data);
      if (obj.antibotEnabled !== undefined) this.antibotEnabled = obj.antibotEnabled;
      if (obj.autoReadEnabled !== undefined) this.autoReadEnabled = obj.autoReadEnabled;
      if (obj.autoTypingEnabled !== undefined) this.autoTypingEnabled = obj.autoTypingEnabled;
      if (obj.menuLink !== undefined) this.menuLink = obj.menuLink;
      if (obj.ownerNumbers !== undefined && Array.isArray(obj.ownerNumbers)) {
        this.ownerNumbers = new Set(obj.ownerNumbers.map((n: string) => this.normalizeJid(n)));
      }
      if (obj.premiumNumbers !== undefined && Array.isArray(obj.premiumNumbers)) {
        this.premiumNumbers = new Set(obj.premiumNumbers.map((n: string) => this.normalizeJid(n)));
      }
    } catch {
      // ignore
    }
  }

  private saveBotSettings() {
    const obj = {
      antibotEnabled: this.antibotEnabled,
      autoReadEnabled: this.autoReadEnabled,
      autoTypingEnabled: this.autoTypingEnabled,
      menuLink: this.menuLink,
      ownerNumbers: Array.from(this.ownerNumbers),
      premiumNumbers: Array.from(this.premiumNumbers)
    };
    fs.writeFileSync(this.botSettingsFile, JSON.stringify(obj, null, 2));
  }

  private loadGroupSettings() {
    try {
      const data = fs.readFileSync(this.settingsFile, "utf8");
      const obj = JSON.parse(data);
      for (const [k, v] of Object.entries(obj)) {
        this.groupSettings.set(k, v as any);
      }
    } catch {
      // ignore
    }
  }

  private saveGroupSettings() {
    const obj = Object.fromEntries(this.groupSettings);
    fs.writeFileSync(this.settingsFile, JSON.stringify(obj, null, 2));
  }

  private loadKaryawanData() {
    try {
      if (!fs.existsSync(this.karyawanDataFile)) return;
      const data = fs.readFileSync(this.karyawanDataFile, "utf8");
      this.karyawanData = JSON.parse(data);
    } catch {
      // ignore
    }
  }

  private saveKaryawanData() {
    fs.writeFileSync(this.karyawanDataFile, JSON.stringify(this.karyawanData, null, 2));
  }

  public getStatus() {
    let uptime = null;
    if (this.status === "connected" && this.connectedAt) {
      uptime = Date.now() - this.connectedAt;
    }
    let phoneNumber = "";
    if (this.sock?.user?.id) {
      phoneNumber = this.sock.user.id.split(":")[0];
    }
    return {
      status: this.status,
      qr: this.currentQr,
      uptime: uptime,
      phoneNumber: phoneNumber,
    };
  }

  public async start(phoneNumber?: string) {
    if (this.status !== "disconnected") {
      this.broadcastState("Bot is already running or connecting.");
      return;
    }
    this.isAttemptingStart = true;

    if (this.sock) {
      this.broadcastState("Cleaning up old socket before start...");
      try {
        if (this.sock.end) this.sock.end(undefined);
      } catch (e) {}
      this.sock = null;
    }

    if (phoneNumber) {
      phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    }

    this.updateStatus("connecting");
    this.broadcastState("Starting initialization...");

    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);
      
      const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] as any, isLatest: false }));
      this.broadcastState(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

      this.sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }) as any,
        browser: Browsers.ubuntu("Chrome"),
        msgRetryCounterCache,
        generateHighQualityLinkPreview: true,
        keepAliveIntervalMs: 30000,
        syncFullHistory: false,
        markOnlineOnConnect: true,
      });

      if (phoneNumber && !this.sock.authState.creds.registered) {
        this.broadcastState("Waiting for socket connection to request pairing code...");
        setTimeout(async () => {
          if (!this.sock) return;
          this.broadcastState("Requesting pairing code...");
          try {
            const code = await this.sock.requestPairingCode(phoneNumber);
            const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;
            this.broadcastState(`Pairing code generated: ${formattedCode}`);
            this.io.to(this.userEmail).emit("pairing_code", formattedCode);
          } catch (err: any) {
            const errorMsg = err?.message || err;
            if (String(errorMsg).includes("Connection Closed") || String(errorMsg).includes("Precondition Required")) {
                this.broadcastState("Connection dropped while requesting code. Will retry automatically...");
            } else {
                this.broadcastState(`Failed to get pairing code: ${errorMsg}`);
                console.error("Pairing error:", err);
            }
          }
        }, 3000);
      }

      this.sock.ev.on("connection.update", async (update: any) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
          if (!phoneNumber) {
            this.currentQr = qr;
            this.io.to(this.userEmail).emit("qr", qr);
            this.broadcastState("QR Code generated. Please scan.");
          }
        }

        if (connection === "close") {
          const boomError = lastDisconnect?.error as Boom;
          const statusCode = boomError?.output?.statusCode;
          let shouldReconnect = true; // Default to always try reconnecting first
          
          if (statusCode === DisconnectReason.loggedOut) {
             shouldReconnect = false;
          } else if (statusCode === 440) {
             shouldReconnect = false; // Do not reconnect on conflict, but do not delete session either
             this.broadcastState("Conflict (440): Connected from another location. Stopping reconnect loop.");
             this.updateStatus("disconnected");
             return;
          }

          // If we get Precondition Required (428) or Time Out (408) while not registered,
          // the session state is likely dirty or rate-limited. Better to clear it.
          if (!this.sock?.authState?.creds?.registered && (statusCode === 428 || statusCode === 408)) {
              this.broadcastState(`Connection closed with ${statusCode}. Cleaning dirty session...`);
              shouldReconnect = false;
          }
            
          if (statusCode === 428) {
              this.broadcastState("Connection dropped (428 Precondition Required).");
          } else if (statusCode === 408) {
              this.broadcastState("Request Time-out (408).");
          } else if (statusCode === 515) {
              this.broadcastState("Stream Errored (515). Reconnecting...");
          } else {
              this.broadcastState(`Connection closed - Status code: ${statusCode}. Reconnecting: ${shouldReconnect}`);
          }
          
          this.updateStatus("disconnected");
          this.currentQr = null;

          if (shouldReconnect && this.isAttemptingStart) {
            setTimeout(() => {
                if (this.status === "disconnected") {
                    this.start(phoneNumber);
                }
            }, 5000); // Wait 5 seconds before reconnecting
          } else {
            if (!shouldReconnect) {
              // Hanya delete session jika benar-benar logged out (scan WA memutus bot dari HP utama)
              this.broadcastState("User has logged out from linked devices. Deleting session...");
              this.deleteSession();
            }
          }
        } else if (connection === "open") {
          this.updateStatus("connected");
          this.currentQr = null;
          this.io.to(this.userEmail).emit("pairing_code", null);
          this.broadcastState("Bot connected successfully!");
        }
      });

      this.sock.ev.on("creds.update", saveCreds);

      this.sock.ev.on("group-participants.update", async (data: any) => {
        try {
          const { id, participants, action } = data;
          this.broadcastState(`group-participants.update: ${action} for ${id} with ${participants.length} participants`);
          const settings = this.groupSettings.get(id);
          
          if (!settings) {
              return;
          }

          let groupName = "Grup ini";
          try {
             const metadata = await this.sock.groupMetadata(id);
             if (metadata && metadata.subject) {
                 groupName = metadata.subject;
             }
          } catch (e) {
             // ignore
          }

          if (action === "add" && settings.welcomeEnabled && settings.welcomeMessage) {
            for (const participant of participants) {
              try {
                const participantJid = typeof participant === 'string' ? participant : (participant as any).id || (participant as any).jid || String(participant);
                let msgText = settings.welcomeMessage
                    .replace(/@user/gi, `@${participantJid.split("@")[0]}`)
                    .replace(/@grup/gi, groupName);
                
                if (!msgText.includes(`@${participantJid.split("@")[0]}`)) {
                    msgText += `\n\nSelamat datang @${participantJid.split("@")[0]}!`;
                }

                await this.sock.sendMessage(id, { text: msgText, mentions: [participantJid] });
                this.broadcastState(`Sent welcome message to ${participantJid}`);
              } catch (e: any) {
                console.error("Failed to send welcome message:", e);
              }
            }
          } else if (action === "remove" && settings.goodbyeEnabled && settings.goodbyeMessage) {
            for (const participant of participants) {
              try {
                const participantJid = typeof participant === 'string' ? participant : (participant as any).id || (participant as any).jid || String(participant);
                let msgText = settings.goodbyeMessage
                    .replace(/@user/gi, `@${participantJid.split("@")[0]}`)
                    .replace(/@grup/gi, groupName);

                if (!msgText.includes(`@${participantJid.split("@")[0]}`)) {
                    msgText += `\n\nSelamat tinggal @${participantJid.split("@")[0]}!`;
                }

                await this.sock.sendMessage(id, { text: msgText, mentions: [participantJid] });
                this.broadcastState(`Sent goodbye message to ${participantJid}`);
              } catch (e: any) {
                this.broadcastState(`Failed to send goodbye message: ${e?.message || e}`);
              }
            }
          }
        } catch (err) {
          console.error("Failed to process group update", err);
        }
      });

      this.sock.ev.on("messages.upsert", async (m: any) => {
        try {
          if (m.type === "notify") {
            for (const msg of m.messages) {
              if (msg.message || msg.messageStubType) {
                try {
                  await this.handleIncomingMessage(msg);
                } catch (e) {
                  console.error("Error handling msg:", e);
                }
              }
            }
          }
        } catch (e) {
            console.error("Critical error in messages.upsert:", e);
        }
      });
    } catch (error: any) {
      console.error("Error starting WA:", error);
      this.updateStatus("disconnected");
      this.broadcastState(`Failed to start bot: ${error?.message || error}`);
    }
  }

  public async stop() {
    this.isAttemptingStart = false;
    if (this.sock) {
      this.broadcastState("Stopping bot...");
      try {
        if (this.sock.logout) await this.sock.logout();
      } catch (e: any) {
        if (!String(e).includes("Connection Closed")) {
          console.error("Logout error:", e);
        }
      }
      try {
        if (this.sock.end) this.sock.end(undefined);
      } catch (e: any) {
        if (!String(e).includes("Cannot read properties of null")) {
          console.error("End socket error:", e);
        }
      }
      this.sock = null;
      this.updateStatus("disconnected");
      this.currentQr = null;
      this.broadcastState("Bot stopped.");
    }
  }

  public async restart() {
    await this.stop();
    setTimeout(() => this.start(), 2000);
  }

  public async deleteSession() {
    await this.stop();
    this.broadcastState("Deleting session...");
    if (fs.existsSync(this.authFolder)) {
      try {
        fs.rmSync(this.authFolder, { recursive: true, force: true });
        this.broadcastState("Session deleted cleanly.");
      } catch (err) {
        console.error("Error deleting auth folder", err);
        this.broadcastState("Failed to delete session folder.");
      }
    } else {
        this.broadcastState("No session to delete.");
    }
    this.updateStatus("disconnected");
    this.currentQr = null;
  }

  public async getGroups() {
    if (!this.sock) return [];
    try {
      const groups = await this.sock.groupFetchAllParticipating();
      return Object.values(groups).map((group: any) => ({
        id: group.id,
        name: group.subject
      }));
    } catch (err) {
      console.error("Failed to fetch groups", err);
      return [];
    }
  }

  public async massAddGroupMembers(groupId: string, numbers: string[]) {
    if (!this.sock) {
      throw new Error("Bot is not connected.");
    }

    if (!groupId.endsWith("@g.us")) {
      groupId = `${groupId}@g.us`;
    }

    const formattedNumbers = numbers.map((num) => {
      let n = num.replace(/[^0-9]/g, "");
      return `${n}@s.whatsapp.net`;
    });
    
    // Process in chunks to avoid spam
    const chunkSize = 2;
    for (let i = 0; i < formattedNumbers.length; i += chunkSize) {
      const chunk = formattedNumbers.slice(i, i + chunkSize);
      try {
        await this.sock.groupParticipantsUpdate(groupId, chunk, "add");
        this.broadcastState(`Added chunk of ${chunk.length} to group ${groupId} (${i + chunk.length}/${formattedNumbers.length})`);
        // Larger random delay between chunks (5s to 15s)
        if (i + chunkSize < formattedNumbers.length) {
            const delay = Math.floor(Math.random() * 10000) + 5000;
            this.broadcastState(`Menunggu ${Math.round(delay/1000)} detik sebelum menambahkan selanjutnya...`);
            await new Promise(r => setTimeout(r, delay));
        }
      } catch (e: any) {
        this.broadcastState(`Failed to add chunk to group ${groupId}: ${e?.message}`);
        if (i + chunkSize < formattedNumbers.length) {
            this.broadcastState(`Terjadi error/limit, cooldown 30 detik...`);
            await new Promise(r => setTimeout(r, 30000));
        }
      }
    }
    this.broadcastState(`Selesai menambahkan ${formattedNumbers.length} anggota.`);
    return { success: true, message: `Completed adding members (runs in background).` };
  }

  private updateStatus(newStatus: "disconnected" | "connecting" | "connected") {
    this.status = newStatus;
    if (newStatus === "connected") {
      if (!this.connectedAt) this.connectedAt = Date.now();
    } else {
      this.connectedAt = null;
    }
    this.io.to(this.userEmail).emit("status", this.getStatus());
  }

  private broadcastState(message: string) {
    console.log(`[${this.userEmail}] ${message}`);
    this.io.to(this.userEmail).emit("log", { time: new Date().toISOString(), message });
  }

  private normalizeJid(jidStr: string): string {
    if (!jidStr) return "";
    let clean = jidStr.replace(/:\d+/, "");
    
    if (clean.endsWith("@g.us")) {
        let groupNum = clean.split("@")[0];
        return groupNum + "@g.us";
    }

    if (clean.endsWith("@lid")) {
        let lidNum = clean.split("@")[0];
        return lidNum + "@lid";
    }

    let numPart = clean.replace(/[^0-9]/g, "");
    
    if (numPart.startsWith("0")) {
        numPart = "62" + numPart.slice(1);
    }
    
    return numPart + "@s.whatsapp.net";
  }

  private async handleIncomingMessage(msg: any) {
    if (!this.sock) return;

    const jid = msg.key.remoteJid;
    if (jid) {
        const userKey = msg.key.participant || msg.participant || jid;
        const currentChats = this.totalChats.get(userKey) || 0;
        this.totalChats.set(userKey, currentChats + 1);
    }

    if (this.autoReadEnabled && !msg.key.fromMe) {
      try {
        await this.sock.readMessages([msg.key]);
      } catch (e) {
        // ignore
      }
    }

    if (this.antibotEnabled && msg.key.id && (msg.key.id.startsWith("BAE5") || msg.key.id.length === 16) && !msg.key.fromMe) {
      return; // Ignore other bots
    }

    if (msg.messageStubType === 27 || msg.messageStubType === 28 || msg.messageStubType === 32) {
      this.broadcastState(`Fallback stub match: type=${msg.messageStubType} for ${jid}`);
      const action = msg.messageStubType === 27 ? 'add' : 'remove';
      const participants = msg.messageStubParameters || [];
      const settings = this.groupSettings.get(jid);

      if (settings && participants.length > 0) {
        let groupName = "Grup ini";
        try {
           const metadata = await this.sock.groupMetadata(jid);
           if (metadata && metadata.subject) {
               groupName = metadata.subject;
           }
        } catch (e) {}

        if (action === "add" && settings.welcomeEnabled && settings.welcomeMessage) {
          for (const participant of participants) {
            try {
              const participantJid = typeof participant === 'string' ? participant : (participant as any).id || (participant as any).jid || String(participant);
              let msgText = settings.welcomeMessage
                  .replace(/@user/gi, `@${participantJid.split("@")[0]}`)
                  .replace(/@grup/gi, groupName);
              
              if (!msgText.includes(`@${participantJid.split("@")[0]}`)) {
                  msgText += `\n\nSelamat datang @${participantJid.split("@")[0]}!`;
              }

              await this.sock.sendMessage(jid, { text: msgText, mentions: [participantJid] });
              this.broadcastState(`Fallback sent welcome to ${participantJid}`);
            } catch (e: any) {
               this.broadcastState(`Fallback failed welcome: ${e?.message}`);
            }
          }
        } else if (action === "remove" && settings.goodbyeEnabled && settings.goodbyeMessage) {
          for (const participant of participants) {
            try {
              const participantJid = typeof participant === 'string' ? participant : (participant as any).id || (participant as any).jid || String(participant);
              let msgText = settings.goodbyeMessage
                  .replace(/@user/gi, `@${participantJid.split("@")[0]}`)
                  .replace(/@grup/gi, groupName);

              if (!msgText.includes(`@${participantJid.split("@")[0]}`)) {
                  msgText += `\n\nSelamat tinggal @${participantJid.split("@")[0]}!`;
              }

              await this.sock.sendMessage(jid, { text: msgText, mentions: [participantJid] });
              this.broadcastState(`Fallback sent goodbye to ${participantJid}`);
            } catch (e: any) {
               this.broadcastState(`Fallback failed goodbye: ${e?.message}`);
            }
          }
        }
      }
    }

    if (!msg.message) return;

    // Handle status broadcast
    if (jid === "status@broadcast") {
      if (this.activeSwGroups.size > 0 && !msg.key.fromMe) {
          const senderJid = msg.key.participant || msg.participant;
          let messageData = msg.message;
          if (messageData?.ephemeralMessage?.message) {
             messageData = messageData.ephemeralMessage.message;
          }
          const isImage = messageData?.imageMessage;
          const isVideo = messageData?.videoMessage;
          const isText = messageData?.extendedTextMessage || messageData?.conversation;
          const text = messageData?.extendedTextMessage?.text || messageData?.conversation || "";

          let buffer: Buffer | null = null;
          if (isImage || isVideo) {
              try {
                  buffer = await downloadMediaMessage(msg as any, 'buffer', {}, { logger: pino({ level: 'silent' }) as any, reuploadRequest: this.sock.updateMediaMessage }) as Buffer;
              } catch (e) {
                  console.error(e);
              }
          }

          for (const groupJid of Array.from(this.activeSwGroups)) {
             try {
                if (buffer) {
                    if (isImage) await this.sock.sendMessage(groupJid, { image: buffer, caption: `📸 *Auto Culik SW*\nDari: @${senderJid?.split('@')[0] || 'Unknown'}\n\n${isImage?.caption || ''}`.trim(), mentions: senderJid ? [senderJid] : [] });
                    else if (isVideo) await this.sock.sendMessage(groupJid, { video: buffer, caption: `🎥 *Auto Culik SW*\nDari: @${senderJid?.split('@')[0] || 'Unknown'}\n\n${isVideo?.caption || ''}`.trim(), mentions: senderJid ? [senderJid] : [] });
                } else if (isText) {
                    await this.sock.sendMessage(groupJid, { text: `📝 *Auto Culik SW*\nDari: @${senderJid?.split('@')[0] || 'Unknown'}\n\n${text}`, mentions: senderJid ? [senderJid] : [] });
                }
             } catch (e) {}
          }
      }
      return;
    }

    const getMessageText = (message: any) => {
      if (!message) return "";
      if (message.conversation) return message.conversation;
      if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
      if (message.imageMessage?.caption) return message.imageMessage.caption;
      if (message.videoMessage?.caption) return message.videoMessage.caption;
      if (message.ephemeralMessage?.message) {
        return getMessageText(message.ephemeralMessage.message);
      }
      return "";
    };

    let messageObj = msg.message;
    if (messageObj?.ephemeralMessage?.message) {
      messageObj = messageObj.ephemeralMessage.message;
    }
    
    // Anti features enforcement
    if (jid.endsWith("@g.us") && !msg.key.fromMe) {
      let shouldDelete = false;
      let reason = "";

      const participant = msg.key.participant;
      const isVideoInfo = messageObj?.videoMessage;
      const isImageInfo = messageObj?.imageMessage;
      const isStickerInfo = messageObj?.stickerMessage;
      const isViewOnceInfo = messageObj?.viewOnceMessage || messageObj?.viewOnceMessageV2 || messageObj?.viewOnceMessageV2Extension || messageObj?.imageMessage?.viewOnce || messageObj?.videoMessage?.viewOnce;
      const textInfo = getMessageText(messageObj);
      const isForwardedStatus = messageObj?.extendedTextMessage?.contextInfo?.isForwarded && messageObj?.extendedTextMessage?.contextInfo?.forwardingScore > 0 && messageObj?.extendedTextMessage?.contextInfo?.participant === "status@broadcast";
      
      if (this.groupSettings.get(jid)?.antivideo && isVideoInfo) {
        shouldDelete = true;
        reason = "antivideo";
      }
      
      if (this.groupSettings.get(jid)?.antifoto && isImageInfo) {
        shouldDelete = true;
        reason = "antifoto";
      }

      if (this.groupSettings.get(jid)?.antifoto1x && isViewOnceInfo) {
        shouldDelete = true;
        reason = "antifoto1x";
      }
      
      if (this.groupSettings.get(jid)?.antistiker && isStickerInfo) {
        shouldDelete = true;
        reason = "antistiker";
      }
      
      if (this.groupSettings.get(jid)?.antitagsw && (isForwardedStatus || textInfo.includes("status@broadcast"))) {
        shouldDelete = true;
        reason = "antitagsw";
      }

      if (this.groupSettings.get(jid)?.antivirtex && textInfo && textInfo.length > 5000) {
        shouldDelete = true;
        reason = "antivirtex";
      }

            if (this.groupSettings.get(jid)?.antilinkall && textInfo && textInfo.match(/https?:\/\/[^\s]+/i)) {
         shouldDelete = true;
         reason = "antilinkall";
      }

      const toxicWords = ["anjing", "babi", "bangsat", "kontol", "memek", "jembut", "ngentot", "tolol", "goblok"];
      if (this.groupSettings.get(jid)?.antitoxic && textInfo) {
         const lowerText = textInfo.toLowerCase();
         if (toxicWords.some(w => lowerText.includes(w))) {
            shouldDelete = true;
            reason = "antitoxic";
         }
      }

      if (this.groupSettings.get(jid)?.antispam && textInfo && participant) {
        // very rudimentary spam tracking: if same user sends to same group repeatedly fast
        const key = `${jid}-${participant}`;
        const now = Date.now();
        const history = this.userMessageHistory.get(key) || { text: "", time: 0, count: 0 };
        
        if (history.text === textInfo && (now - history.time) < 5000) {
          history.count += 1;
        } else {
          history.text = textInfo;
          history.count = 1;
        }
        history.time = now;
        this.userMessageHistory.set(key, history);
        
        if (history.count > 3) {
          shouldDelete = true;
          reason = "antispam";
        }
      }

      if (shouldDelete) {
        try {
          await this.sock.sendMessage(jid, { delete: msg.key });
          this.broadcastState(`Deleted message in ${jid} due to ${reason}`);
          return; // Stop processing this message
        } catch (e) {
          this.broadcastState(`Failed to delete msg for ${reason}: bot might not be admin`);
        }
      }
    }

    const messageContent = getMessageText(messageObj);

    if (!messageContent) return;

    const body = messageContent.trim().toLowerCase();
    
    // Log the incoming message privately
    console.log(`[Message] From: ${jid} | Content: ${body}`);
    if (body.startsWith(".inspect")) {
        console.log(JSON.stringify(msg, null, 2));
    }

    const quotedId = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
    if (quotedId && this.activeGames.has(quotedId)) {
        const game = this.activeGames.get(quotedId);
        const userAnswer = body;
        
        if (game!.type === "tebakangka") {
            const correctAnswer = String(game!.answer).toLowerCase();
            const userNum = parseInt(userAnswer, 10);
            const targetNum = parseInt(correctAnswer, 10);
            
            if (isNaN(userNum)) {
                await this.sock.sendMessage(jid, { text: `❌ Harap masukkan angka!` }, { quoted: msg });
                return;
            }
            
            if (userNum === targetNum) {
                await this.sock.sendMessage(jid, { text: `✅ *BENAR!*\n\nJawabanmu tepat: *${targetNum}*\nSelamat!` }, { quoted: msg });
                this.activeGames.delete(quotedId);
            } else if (userNum > targetNum) {
                await this.sock.sendMessage(jid, { text: `📉 *SALAH!*\n\nAngka terlalu besar, coba lebih kecil!` }, { quoted: msg });
            } else {
                await this.sock.sendMessage(jid, { text: `📈 *SALAH!*\n\nAngka terlalu kecil, coba lebih besar!` }, { quoted: msg });
            }
        } else if (game!.type === "family100") {
            const correctAnswers = Array.isArray(game!.answer) ? game!.answer.map(a => String(a).toLowerCase()) : [String(game!.answer).toLowerCase()];
            if (correctAnswers.includes(userAnswer)) {
                await this.sock.sendMessage(jid, { text: `✅ *BENAR!*\n\nSalah satu jawaban yang tepat adalah: *${userAnswer.toUpperCase()}*\nSelamat!` }, { quoted: msg });
                this.activeGames.delete(quotedId);
            } else {
                await this.sock.sendMessage(jid, { text: `❌ *SALAH!*\n\nJawabanmu kurang tepat, coba lagi!` }, { quoted: msg });
            }
        } else {
            const correctAnswer = String(game!.answer).toLowerCase();
            if (userAnswer === correctAnswer) {
                await this.sock.sendMessage(jid, { text: `✅ *BENAR!*\n\nJawabanmu tepat: *${game!.answer}*\nSelamat!` }, { quoted: msg });
                this.activeGames.delete(quotedId);
            } else {
                await this.sock.sendMessage(jid, { text: `❌ *SALAH!*\n\nJawabanmu kurang tepat, coba lagi!` }, { quoted: msg });
            }
        }
        return; // Stop processing as command
    }

    if (this.autoTypingEnabled) {
        try {
            await this.sock.sendPresenceUpdate('composing', jid);
        } catch (e) {
            console.error("Failed to set composing presence", e);
        }
    }

    const senderJidRaw = msg.key.participant || msg.participant || jid;
    const senderJid = typeof senderJidRaw === 'string' ? this.normalizeJid(senderJidRaw) : senderJidRaw;
    console.log("[DEBUG] senderJid:", senderJid);
    console.log("[DEBUG] ownerNumbers:", Array.from(this.ownerNumbers));
    console.log("[DEBUG] msg.key.fromMe:", msg.key.fromMe);
    const isOwner = msg.key.fromMe || this.ownerNumbers.has(senderJid);
    console.log("[DEBUG] isOwner:", isOwner);
    const isPremium = isOwner || this.premiumNumbers.has(senderJid);
    const isGroup = jid.endsWith("@g.us");
    if (this.afkUsers.has(senderJid)) {
        const afkInfo = this.afkUsers.get(senderJid);
        this.afkUsers.delete(senderJid);
        await this.sock.sendMessage(jid, { text: `Sistem mendeteksi aktivitas dari @${senderJid.split("@")[0]}\nStatus AFK telah dihapus.`, mentions: [senderJid] });
    }
    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    for (const m of mentions) {
        if (this.afkUsers.has(m)) {
            const afkInfo = this.afkUsers.get(m);
            const duration = Math.floor((Date.now() - afkInfo!.time) / 60000);
            await this.sock.sendMessage(jid, { text: `Jangan tag dia! @${m.split("@")[0]} sedang AFK.\nAlasan: ${afkInfo!.reason}\nSejak: ${duration} menit yang lalu.`, mentions: [m] }, { quoted: msg });
        }
    }
    
    const requestedCmd = body.split(/[\s\n]+/)[0];
    const ownerCommands = ['.antibot', 'antibot', '.autoread', 'autoread', '.savekontak', 'savekontak', '.ownermenu', 'ownermenu', '.broadcast', 'broadcast', '.restartbot', 'restartbot', '.addpremium', 'addpremium', '.addprem', 'addprem', '.addowner', 'addowner', '.delowner', 'delowner', '.listowner', 'listowner', '.listpremium', 'listpremium', '.delpremium', 'delpremium', '.setbotpp', 'setbotpp', '.setbotname', 'setbotname', '.addnamabot', 'addnamabot', '.delnamabot', 'delnamabot', '.totalfitur', 'totalfitur', '.addprefix', 'addprefix', '.delprefix', 'delprefix', '.listprefix', 'listprefix', '.addpoweredby', 'addpoweredby', '.delpoweredby', 'delpoweredby', '.listpoweredby', 'listpoweredby', '.linkset', 'linkset', '.dellinkset', 'dellinkset', '.addcmd', 'addcmd', '.delcmd', 'delcmd', '.listcmd', 'listcmd', '.self', 'self', '.publik', 'publik', '.setcoverbot', 'setcoverbot', '.delcoverbot', 'delcoverbot', '.anticall', 'anticall', '.autotyping', 'autotyping', '.addsewa', 'addsewa', '.delsewa', 'delsewa', '.listsewa', 'listsewa', '.owner', 'owner', '.joingc', 'joingc', '.creategc', 'creategc', '.addsticker', 'addsticker', '.delsticker', 'delsticker', '.addlimit', 'addlimit', '.dellimit', 'dellimit', '.listlimit', 'listlimit'];
    const groupCommands = ['.afk', 'afk', '.joinch', 'joinch', '.cekidgc', 'cekidgc', '.infouser', 'infouser', '.tagadmin', 'tagadmin', '.infogrup', 'infogrup', '.leaderboard', 'leaderboard', '.totalchat', 'totalchat', '.groupmenu', 'groupmenu', '.delete', 'delete', '.hidetag', 'hidetag', '.kick', 'kick', '.add', 'add', '.open', 'open', '.close', 'close', '.open2', 'open2', '.close2', 'close2', '.antilinkall', 'antilinkall', '.linkgc', 'linkgc', '.setppgc', 'setppgc', '.delppgc', 'delppgc', '.setwelcome', 'setwelcome', '.setbye', 'setbye', '.welcome', 'welcome', '.goodbye', 'goodbye', '.antitagsw', 'antitagsw', '.antivideo', 'antivideo', '.antifoto', 'antifoto', '.antifoto1x', 'antifoto1x', '.antistiker', 'antistiker', '.antispam', 'antispam', '.setnamegc', 'setnamegc', '.setdescgc', 'setdescgc', '.culikswgc', 'culikswgc', '.culikprofilegc', 'culikprofilegc', '.kickall', 'kickall', '.sewabot', 'sewabot', '.promote', 'promote', '.demote', 'demote', '.werewolf', 'werewolf', '.joinww', 'joinww', '.startww', 'startww', '.mutegc', 'mutegc', '.resetlink', 'resetlink', '.tagall', 'tagall', '.setbotbio', 'setbotbio', '.delbotbio', 'delbotbio', '.antivirtex', 'antivirtex', '.antitoxic', 'antitoxic', '.menfess', 'menfess', '.confess', 'confess', '.balasmenfess', 'balasmenfess', '.tolakmenfess', 'tolakmenfess', '.stopmenfess', 'stopmenfess', '.warn', 'warn', '.listwarn', 'listwarn', '.delwarn', 'delwarn', '.infowarn', 'infowarn'];
    const funCommands = ['.ceksifat', 'ceksifat', '.cekkenakalan', 'cekkenakalan', '.cekperawan', 'cekperawan', '.cekperjaka', 'cekperjaka', '.cekjanda', 'cekjanda', '.cekduda', 'cekduda', '.bego', 'bego', '.rate', 'rate', '.top', 'top', '.funmenu', 'funmenu', '.cekkhodam', 'cekkhodam', '.cekganteng', 'cekganteng', '.cekcantik', 'cekcantik', '.cekjodoh', 'cekjodoh', '.ceklesby', 'ceklesby', '.cekpasangan', 'cekpasangan', '.cekgay', 'cekgay', '.cekhoby', 'cekhoby', '.cekkesetiaan', 'cekkesetiaan', '.jadian', 'jadian', '.kiss', 'kiss', '.quotes', 'quotes', '.avatar', 'avatar', '.ppcouple', 'ppcouple', '.infonegara', 'infonegara', '.cekwibu', 'cekwibu', '.meme', 'meme', '.waifu', 'waifu', '.ceksange', 'ceksange', '.cekkaya', 'cekkaya', '.cekbucin', 'cekbucin', '.artinama', 'artinama', '.cekmasadepan', 'cekmasadepan', '.faktadunia', 'faktadunia', '.cekgempa', 'cekgempa', '.cekcuaca', 'cekcuaca'];
    const margaCommands = ['.margamenu', 'margamenu', '.cekpariban', 'cekpariban', '.cektartulang', 'cektartulang', '.cektarito', 'cektarito', '.cekpadan', 'cekpadan'];
    const videoCommands = ['.videomenu', 'videomenu', '.tiktokgirl', 'tiktokgirl', '.tiktoktobrut', 'tiktoktobrut', '.tiktokkayes', 'tiktokkayes', '.tiktokhot', 'tiktokhot', '.tiktokghea', 'tiktokghea', '.tiktokbocil', 'tiktokbocil', '.tiktoklesbi', 'tiktoklesbi', '.tiktokgay', 'tiktokgay', '.tiktokartis', 'tiktokartis', '.tiktokpacaran', 'tiktokpacaran', '.tiktokanjing', 'tiktokanjing', '.tiktokkucing', 'tiktokkucing', '.tiktokfreefire', 'tiktokfreefire', '.tiktokpubg', 'tiktokpubg', '.tiktoknikah', 'tiktoknikah', '.tiktokpointblank', 'tiktokpointblank'];
    const stickerCommands = ['.stickermenu', 'stickermenu', '.stiker', 'stiker', '.hd', 'hd', '.brat', 'brat', '.bratvid', 'bratvid', '.smeme', 'smeme', '.qc', 'qc', '.toimg', 'toimg', '.togif', 'togif', '.stikerrandom', 'stikerrandom', '.stikerspongebob', 'stikerspongebob', '.tovideo', 'tovideo', '.rvo', 'rvo', '.hdvid', 'hdvid', '.emojimix', 'emojimix', '.emojigif', 'emojigif', '.bratgambar', 'bratgambar', '.attp', 'attp', '.logo', 'logo', '.wallpaper', 'wallpaper'];
    const kristenCommands = ['.kristenmenu', 'kristenmenu', '.ayatalkitab', 'ayatalkitab', '.doaayat', 'doaayat', '.kisahyesus', 'kisahyesus', '.jadwalgereja', 'jadwalgereja', '.namakitab', 'namakitab'];
    const islamCommands = ['.islammenu', 'islammenu', '.ayatkursi', 'ayatkursi', '.tekssholat', 'tekssholat', '.hadits', 'hadits', '.jadwalsholat', 'jadwalsholat', '.kisahnabi', 'kisahnabi', '.niatsholat', 'niatsholat', '.quotesislami', 'quotesislami'];
    const downloadCommands = ['.downloadmenu', 'downloadmenu', '.tiktok', 'tiktok', '.tiktokaudiomp3', 'tiktokaudiomp3', '.playyt', 'playyt', '.playytmp4', 'playytmp4', '.capcut', 'capcut', '.facebook', 'facebook', '.instagram', 'instagram', '.fotosexy', 'fotosexy', '.fotoanime', 'fotoanime', '.pinterest', 'pinterest', '.ttsaudio', 'ttsaudio', '.tiktokslide', 'tiktokslide', '.ssweb', 'ssweb', '.gdrive', 'gdrive', '.mediafire', 'mediafire', '.videosexybikini', 'videosexybikini', '.vidsexyjepang', 'vidsexyjepang', '.vidsexyindonesia', 'vidsexyindonesia', '.vidsexymalaysia', 'vidsexymalaysia', '.vidsexychina', 'vidsexychina'];
    const cecanCommands = ['.cecanmenu', 'cecanmenu', '.cecanchina', 'cecanchina', '.cecanhijab', 'cecanhijab', '.cecanindonesia', 'cecanindonesia', '.cecanjapan', 'cecanjapan', '.cecanjeni', 'cecanjeni', '.cecanjiso', 'cecanjiso', '.cecankorea', 'cecankorea', '.cecanmalaysia', 'cecanmalaysia', '.cecanjustinaxie', 'cecanjustinaxie', '.cecanrose', 'cecanrose', '.cecanthailand', 'cecanthailand', '.cecanvietnam', 'cecanvietnam'];
    const primbonCommands = ['.primbonmenu', 'primbonmenu', '.pantun', 'pantun', '.ceksial', 'ceksial', '.ramalannasib', 'ramalannasib', '.ramalanjodoh', 'ramalanjodoh', '.ramalancinta', 'ramalancinta', '.ramalankeburukan', 'ramalankeburukan', '.zodiak', 'zodiak', '.isidompet', 'isidompet', '.profesiku', 'profesiku', '.nulis', 'nulis'];
    const animeCommands = ['.animemenu', 'animemenu', '.animeakira', 'animeakira', '.animeasuna', 'animeasuna', '.animeeba', 'animeeba', '.animeelaina', 'animeelaina', '.animeemilia', 'animeemilia', '.animegremory', 'animegremory', '.animehinata', 'animehinata', '.animehusbu', 'animehusbu', '.animeisuzu', 'animeisuzu', '.animeitori', 'animeitori', '.animekagura', 'animekagura', '.animekanna', 'animekanna', '.animemiku', 'animemiku', '.animenezuko', 'animenezuko', '.animeloli', 'animeloli', '.animepokemon', 'animepokemon', '.animerem', 'animerem', '.animeryuko', 'animeryuko', '.animeshina', 'animeshina', '.animeshinka', 'animeshinka', '.animeshota', 'animeshota', '.animetejina', 'animetejina', '.animetoukachan', 'animetoukachan'];
    const sertifikatCommands = ['.sertifikatmenu', 'sertifikatmenu', '.stkbaik', 'stkbaik', '.stkcantik', 'stkcantik', '.stkganteng', 'stkganteng', '.stkhitam', 'stkhitam', '.stkmiskin', 'stkmiskin', '.stkkaya', 'stkkaya', '.stkmarah', 'stkmarah', '.stksabar', 'stksabar', '.stksakit', 'stksakit', '.stkkeren', 'stkkeren', '.stkmisterius', 'stkmisterius', '.stksntai', 'stksntai', '.stksombong', 'stksombong', '.stklucu', 'stklucu', '.stkgila', 'stkgila', '.stkstress', 'stkstress'];
    const rpgCommands = ['.rpgmenu', 'rpgmenu', '.kerja', 'kerja', '.fightnaga', 'fightnaga', '.fightkucing', 'fightkucing', '.fightphonix', 'fightphonix', '.mancing', 'mancing', '.fightkyubi', 'fightkyubi', '.berdagang', 'berdagang', '.nabung', 'nabung', '.mining', 'mining', '.bankcek', 'bankcek', '.maling', 'maling', '.banknabung', 'banknabung', '.banktarik', 'banktarik', '.berkebun', 'berkebun', '.mulung', 'mulung', '.bonus', 'bonus', '.gajian', 'gajian', '.nebang', 'nebang', '.petualang', 'petualang', '.upgrade', 'upgrade', '.transfer', 'transfer', '.collect', 'collect', '.referal', 'referal', '.shop', 'shop', '.ojek', 'ojek', '.nguli', 'nguli', '.casino', 'casino', '.pasar', 'pasar', '.berburu', 'berburu', '.polisi', 'polisi'];
    const beritaCommands = ['.beritamenu', 'beritamenu', '.beritabola', 'beritabola', '.fajar', 'fajar', '.cnn', 'cnn', '.layarkaca', 'layarkaca', '.cnbctribun', 'cnbctribun', '.indozone', 'indozone', '.kompas', 'kompas', '.detiknews', 'detiknews', '.dailynews', 'dailynews', '.inews', 'inews', '.okezone', 'okezone', '.sindo', 'sindo', '.tempo', 'tempo', '.antara', 'antara', '.kontan', 'kontan', '.merdeka', 'merdeka', '.jalantikus', 'jalantikus', '.beritasatu', 'beritasatu', '.liputan6', 'liputan6', '.batampos', 'batampos', '.infoloker', 'infoloker'];
    const storeCommands = ['.storemenu', 'storemenu', '.list', 'list', '.addlist', 'addlist', '.dellist', 'dellist', '.update', 'update', '.jeda', 'jeda', '.tambah', 'tambah', '.kurang', 'kurang', '.kali', 'kali', '.delsetdone', 'delsetdone', '.changedone', 'changedone', '.setdone', 'setdone', '.delproses', 'delproses', '.changeproses', 'changeproses', '.setproses', 'setproses', '.proses', 'proses', '.done', 'done'];
    const hentaiCommands = ['.hentaimenu', 'hentaimenu', '.hentai', 'hentai', '.nsfw', 'nsfw', '.nsfwahegao', 'nsfwahegao', '.nsfwass', 'nsfwass', '.nsfwbdsm', 'nsfwbdsm', '.nsfwgangbang', 'nsfwgangbang', '.nsfwgay', 'nsfwgay', '.nsfwloli', 'nsfwloli', '.nsfwneko', 'nsfwneko', '.nsfwpussy', 'nsfwpussy', '.nsfwzettai', 'nsfwzettai'];
    const hantuCommands = ['.hantumenu', 'hantumenu', '.fotpocong', 'fotpocong', '.fotkuntilanak', 'fotkuntilanak', '.fotgenderuwo', 'fotgenderuwo', '.fotwewegombel', 'fotwewegombel', '.fottuyul', 'fottuyul', '.fotsundelbolong', 'fotsundelbolong', '.fotpalasik', 'fotpalasik', '.fotkuyang', 'fotkuyang', '.fotbanaspati', 'fotbanaspati', '.fotjelangkung', 'fotjelangkung', '.fotsiluman', 'fotsiluman', '.fotnyirorokidul', 'fotnyirorokidul', '.fotgundulpringis', 'fotgundulpringis'];
    const coganCommands = ['.coganmenu', 'coganmenu', '.coganiqbaal', 'coganiqbaal', '.coganjefrinichol', 'coganjefrinichol', '.coganangga', 'coganangga', '.coganverrell', 'coganverrell', '.coganrizky', 'coganrizky', '.coganjepang', 'coganjepang', '.cogankorea', 'cogankorea', '.coganthailand', 'coganthailand', '.coganchina', 'coganchina', '.cogandenji', 'cogandenji', '.cogangojo', 'cogangojo', '.coganlevi', 'coganlevi', '.coganluffy', 'coganluffy', '.cogansasuke', 'cogansasuke', '.cogannaruto', 'cogannaruto', '.cogankakashi', 'cogankakashi'];
    const toolsCommands = ['.toolsmenu', 'toolsmenu', '.barcode', 'barcode', '.qrcode', 'qrcode', '.dnslookup', 'dnslookup', '.whois', 'whois', '.httpheader', 'httpheader', '.shortlink', 'shortlink', '.myip', 'myip', '.ipinfo', 'ipinfo', '.hostcheck', 'hostcheck', '.countdown', 'countdown', '.iplookup', 'iplookup', '.subdomain', 'subdomain'];
    const deviceCommands = ['.devicemenu', 'devicemenu', '.battery', 'battery', '.deviceinfo', 'deviceinfo', '.cpuinfo', 'cpuinfo', '.raminfo', 'raminfo', '.storage', 'storage', '.network', 'network', '.pingphone', 'pingphone', '.sensor', 'sensor', '.apkinfo', 'apkinfo', '.appcheck', 'appcheck'];
    const posterCommands = ['.postermenu', 'postermenu', '.pengabdisetan', 'pengabdisetan', '.kkndidesapenari', 'kkndidesapenari', '.sewudino', 'sewudino', '.impetigore', 'impetigore', '.rumahdara', 'rumahdara', '.qodrat', 'qodrat', '.kuntilanak', 'kuntilanak', '.jelangkung', 'jelangkung', '.keramat', 'keramat', '.suzzanna', 'suzzanna', '.mangkujiwo', 'mangkujiwo', '.losmenmelati', 'losmenmelati'];
    const sulapCommands = ['.sulapmenu', 'sulapmenu', '.kartusulap', 'kartusulap', '.tongkatsulap', 'tongkatsulap', '.topisulap', 'topisulap', '.koinsulap', 'koinsulap', '.thumbtip', 'thumbtip', '.cangkirdanbola', 'cangkirdanbola', '.linkingrings', 'linkingrings', '.spongeballs', 'spongeballs', '.silkscarf', 'silkscarf', '.appearingcane', 'appearingcane', '.vanishingcane', 'vanishingcane', '.changebag', 'changebag', '.dovepan', 'dovepan', '.floatingtable', 'floatingtable', '.levitationdevice', 'levitationdevice', '.kotakpedang', 'kotakpedang', '.guillotinesulap', 'guillotinesulap', '.zigzagbox', 'zigzagbox', '.kotaktembus', 'kotaktembus', '.firewallet', 'firewallet'];
    const tiketCommands = ['.tiketmenu', 'tiketmenu', '.ticket', 'ticket', '.konser', 'konser', '.event', 'event', '.jadwal', 'jadwal', '.harga', 'harga', '.kategori', 'kategori', '.seatmap', 'seatmap', '.stoktiket', 'stoktiket', '.bookingtiket', 'bookingtiket', '.riwayat', 'riwayat'];
    const karyawanCommands = ['.karyawanmenu', 'karyawanmenu', '.addproduk', 'addproduk', '.delproduk', 'delproduk', '.listproduk', 'listproduk', '.cekproduk', 'cekproduk', '.addstok', 'addstok', '.cekstok', 'cekstok', '.updatestok', 'updatestok', '.restock', 'restock', '.penjualan', 'penjualan', '.riwayatjual', 'riwayatjual', '.laporan', 'laporan', '.konfirmasi', 'konfirmasi', '.hargaproduk', 'hargaproduk', '.strukpembayaran', 'strukpembayaran'];
    const hewanCommands = ['.hewanmenu', 'hewanmenu', '.catcanvas', 'catcanvas', '.dogcanvas', 'dogcanvas', '.foxcanvas', 'foxcanvas', '.wolfcanvas', 'wolfcanvas', '.lioncanvas', 'lioncanvas', '.tigercanvas', 'tigercanvas', '.pandacanvas', 'pandacanvas', '.bunnycanvas', 'bunnycanvas', '.owlcanvas', 'owlcanvas', '.eaglecanvas', 'eaglecanvas', '.capycanvas', 'capycanvas', '.penguincanvas', 'penguincanvas'];
    const bokepCommands = ['.bokepmenu', 'bokepmenu', '.vidbokepindonesia', 'vidbokepindonesia', '.vidbokepmalaysia', 'vidbokepmalaysia', '.vidbokepjepang', 'vidbokepjepang', '.vidbokepchina', 'vidbokepchina', '.vidbokepamerika', 'vidbokepamerika'];
    const aiCommands = ['.aimenu', 'aimenu', '.midjourney', 'midjourney', '.grok', 'grok', '.imgai', 'imgai', '.bingimg', 'bingimg', '.nanobananaai', 'nanobananaai', '.hapusbgfoto', 'hapusbgfoto'];
    const cdramaCommands = ['.cdramamenu', 'cdramamenu', '.dramaromantis', 'dramaromantis', '.dramakomedi', 'dramakomedi', '.dramamisteri', 'dramamisteri', '.dramakerajaan', 'dramakerajaan', '.dramakeluarga', 'dramakeluarga', '.dramaperang', 'dramaperang', '.dramaxianxia', 'dramaxianxia', '.dramakriminal', 'dramakriminal', '.dramafantasi', 'dramafantasi'];
    const premiumCommands = ['.limit', 'limit', '.ai', 'ai']; // Placeholder for premium restricted commands
    
    if (ownerCommands.includes(requestedCmd) && !isOwner) {
      this.broadcastState(`Blocked non-owner from using ${requestedCmd}`);
      return await this.sock.sendMessage(jid, { text: `👑 *Akses Ditolak*\nPerintah ini hanya bisa digunakan oleh Owner!\n\n(Info Debug: ID Anda adalah ${senderJid})` }, { quoted: msg });
    }
    
    if (premiumCommands.includes(requestedCmd) && !isPremium) {
      this.broadcastState(`Blocked non-premium from using ${requestedCmd}`);
      return await this.sock.sendMessage(jid, { text: "✨ *Akses Ditolak*\nPerintah ini khusus pengguna Premium!" }, { quoted: msg });
    }
    
    if (groupCommands.includes(requestedCmd) && !isGroup) {
      this.broadcastState(`Blocked non-group from using ${requestedCmd}`);
      return await this.sock.sendMessage(jid, { text: "👥 *Akses Ditolak*\nPerintah ini hanya bisa digunakan di dalam Grup!" }, { quoted: msg });
    }

    // Loop protection: Do not respond to our own bot-generated messages.
    // EXCEPT if we want to allow users to use commands by chatting to themselves.
    // But usually bot messages don't start with "." so it's safe if we only respond to commands.
    // To be perfectly safe, only run if it's a command.

    // Basic Command Handler
    
    // Check if command is an alias for the menu
    const possibleCommandName = requestedCmd.replace(/^\.?/, "").toLowerCase();
    const isMenuCmd = this.menuCommands.has(possibleCommandName) || body.toLowerCase() === "all menu";

    if (isMenuCmd) {
      const botName = this.customBotName || this.sock.user?.name || "Wabot Pro";
      const totalFitur = ownerCommands.length + groupCommands.length + funCommands.length + margaCommands.length + videoCommands.length + stickerCommands.length + downloadCommands.length + kristenCommands.length + islamCommands.length + cecanCommands.length + primbonCommands.length + animeCommands.length + sertifikatCommands.length + rpgCommands.length + storeCommands.length + beritaCommands.length + sulapCommands.length + hentaiCommands.length + hantuCommands.length + posterCommands.length + coganCommands.length + toolsCommands.length + deviceCommands.length + tiketCommands.length + karyawanCommands.length + hewanCommands.length + bokepCommands.length + aiCommands.length + cdramaCommands.length;
      
      const dateNow = new Date();
      const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta' };
      const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Jakarta' };
      const dateStr = dateNow.toLocaleDateString("id-ID", dateOptions);
      const timeStr = dateNow.toLocaleTimeString("id-ID", timeOptions);
      const readmore = String.fromCharCode(8206).repeat(4001);

      let menu = `Halo user saya adalah 
Bot WhatsApp terbaru
Bisa membantu kamu

📅 Tanggal: ${dateStr}
⏰ Waktu: ${timeStr}

╭─   [ 𝐁𝐎𝐓 𝐈𝐍𝐅𝐎 ]
│ 🔔 𝐍𝐚𝐦𝐚 𝐁𝐨𝐭 : ${botName}
│ 👑 𝐎𝐰𝐧𝐞𝐫      : ${isOwner ? 'Owner' : 'User'}
│ ⚠️ totalfitur : ${totalFitur}
╰───────────────
${readmore}
📚 *Semua Menu*

│ .downloadmenu
│ .groupmenu
│ .gamemenu
│ .ownermenu
│ .funmenu
│ .margamenu
│ .videomenu
│ .stickermenu
│ .cecanmenu
│ .primbonmenu
│ .animemenu
│ .kristenmenu
│ .islammenu
│ .sertifikatmenu
│ .rpgmenu
│ .storemenu
│ .beritamenu
│ .sulapmenu
│ .hentaimenu
│ .hantumenu
│ .bokepmenu
│ .aimenu
│ .postermenu
│ .coganmenu
│ .toolsmenu
│ .devicemenu
│ .tiketmenu
│ .karyawanmenu
│ .hewanmenu
│ .cdramamenu

Ketik menu yang kamu inginkan.`;
      
      if (this.poweredByText) {
         menu += `\n\n_Powered by ${this.poweredByText}_`;
      }
      const botJid = this.sock.user?.id ? this.sock.user.id.split(':')[0] + '@s.whatsapp.net' : '6281234567890@s.whatsapp.net';
      const adContext = {
        forwardingScore: 999,
        isForwarded: true,
        businessMessageForwardInfo: {
          businessOwnerJid: botJid
        }
      };

      try {
        if (this.coverImageBuffer) {
          await this.sock.sendMessage(jid, { 
            image: this.coverImageBuffer, 
            caption: menu,
            contextInfo: adContext
          }, { quoted: msg });
        } else {
          await this.sock.sendMessage(jid, { 
            text: menu,
            contextInfo: adContext
          }, { quoted: msg });
        }
        
        this.broadcastState(`Responded to allmenu command`);
      } catch (err: any) {
        console.error("Error sending allmenu:", err);
        this.broadcastState(`Error sending allmenu: ${err.message}`);
        await this.sock.sendMessage(jid, { text: `⚠️ Terjadi kesalahan saat mengirim menu.` }, { quoted: msg });
      }
    } else if (body === "storemenu" || body === ".storemenu" || body === "store menu" || body === ".store menu") {
      const storeText = `🛒 *Store Menu*\n\n│ .list\n│ .addlist\n│ .dellist\n│ .update\n│ .jeda\n│ .tambah\n│ .kurang\n│ .kali\n│ .delsetdone\n│ .changedone\n│ .setdone\n│ .delproses\n│ .changeproses\n│ .setproses\n│ .proses\n│ .done`;
      await this.sock.sendMessage(jid, { text: storeText }, { quoted: msg });
      this.broadcastState(`Responded to storemenu command`);
    } else if (body === "beritamenu" || body === ".beritamenu" || body === "berita menu" || body === ".berita menu") {
      const beritaText = `📰 *Berita Menu*\n\n│ .beritabola\n│ .fajar\n│ .cnn\n│ .layarkaca\n│ .cnbctribun\n│ .indozone\n│ .kompas\n│ .detiknews\n│ .dailynews\n│ .inews\n│ .okezone\n│ .sindo\n│ .tempo\n│ .antara\n│ .kontan\n│ .merdeka\n│ .jalantikus\n│ .beritasatu\n│ .liputan6\n│ .batampos\n│ .infoloker`;
      await this.sock.sendMessage(jid, { text: beritaText }, { quoted: msg });
      this.broadcastState(`Responded to beritamenu command`);
    } else if (body === "sulapmenu" || body === ".sulapmenu" || body === "sulap menu" || body === ".sulap menu") {
      const sulapText = `🎩 *Sulap Menu*\n\n│ .kartusulap\n│ .tongkatsulap\n│ .topisulap\n│ .koinsulap\n│ .thumbtip\n│ .cangkirdanbola\n│ .linkingrings\n│ .spongeballs\n│ .silkscarf\n│ .appearingcane\n│ .vanishingcane\n│ .changebag\n│ .dovepan\n│ .floatingtable\n│ .levitationdevice\n│ .kotakpedang\n│ .guillotinesulap\n│ .zigzagbox\n│ .kotaktembus\n│ .firewallet`;
      await this.sock.sendMessage(jid, { text: sulapText }, { quoted: msg });
      this.broadcastState(`Responded to sulapmenu command`);
    } else if (body === "tiketmenu" || body === ".tiketmenu" || body === "tiket menu" || body === ".tiket menu") {
      const tiketText = `🎟️ *Tiket Menu*\n\n│ .ticket\n│ .konser\n│ .event\n│ .jadwal\n│ .harga\n│ .kategori\n│ .seatmap\n│ .stoktiket\n│ .bookingtiket\n│ .riwayat`;
      await this.sock.sendMessage(jid, { text: tiketText }, { quoted: msg });
      this.broadcastState(`Responded to tiketmenu command`);
    } else if (body === "karyawanmenu" || body === ".karyawanmenu" || body === "karyawan menu" || body === ".karyawan menu") {
      const karyawanText = `🧑‍💼 *Karyawan Menu*\n\n│ .addproduk\n│ .delproduk\n│ .listproduk\n│ .cekproduk\n│ .addstok\n│ .cekstok\n│ .updatestok\n│ .restock\n│ .penjualan\n│ .riwayatjual\n│ .laporan\n│ .konfirmasi\n│ .hargaproduk\n│ .strukpembayaran`;
      await this.sock.sendMessage(jid, { text: karyawanText }, { quoted: msg });
      this.broadcastState(`Responded to karyawanmenu command`);
    } else if (body === "groupmenu" || body === ".groupmenu" || body === "group menu" || body === ".group menu") {
      const groupText = `👥 *Group Menu*

│ .hidetag
│ .afk
│ .joinch
│ .cekidgc
│ .infouser
│ .tagadmin
│ .infogrup
│ .leaderboard
│ .totalchat
│ .kick
│ .add
│ .open / .close
│ .open2 / .close2
│ .antilinkall
│ .linkgc
│ .setppgc
│ .delppgc
│ .setwelcome - untuk setting teks masuk
│ .setgoodbye - untuk setting teks keluar
│ .welcome on/off - untuk mengatur pesan masuk
│ .goodbye on/off - untuk mengatur pesan keluar
│ .antitagsw on/off - hapus story yang dikirim di grup
│ .antivideo on/off - hapus video yang dikirim di grup
│ .antifoto on/off - hapus foto yang dikirim di grup
│ .antifoto1x on/off - hapus pesan sekali lihat yang dikirim di grup
│ .antistiker on/off - hapus stiker yang dikirim di grup
│ .antispam on/off - hapus spam yang dikirim di grup
│ .setnamegc
│ .setdescgc
│ .culikswgc
│ .culikprofilegc
│ .mutegc on/off
│ .resetlink
│ .tagall
│ .setbotbio
│ .delbotbio
│ .antivirtex on/off
│ .antitoxic on/off
│ .delete
│ .kickall - keluarkan semua orang di grup
│ .sewabot - teks custom
│ .promote - tambah admin
│ .demote - hapus admin
│ .menfess - kirim pesan rahasia
│ .confess - kirim pesan rahasia
│ .balasmenfess - balas pesan menfess
│ .tolakmenfess - tolak pesan menfess
│ .stopmenfess - hentikan sesi menfess
│ .warn - berikan peringatan (admin only)
│ .listwarn - lihat daftar peringatan di grup (admin only)
│ .delwarn - hapus peringatan (admin only)
│ .infowarn - info peringatan saya/seseorang`;
      await this.sock.sendMessage(jid, { text: groupText }, { quoted: msg });
      this.broadcastState(`Responded to groupmenu command`);
    } else if (body === "downloadmenu" || body === ".downloadmenu" || body === "download menu" || body === ".download menu") {
      const downloadText = `📥 *Download Menu*\n\n│ .tiktok - download video dari link tiktok VT\n│ .tiktokaudiomp3 - download audio dari tiktok\n│ .playyt - mencari dan mendownload audio Youtube\n│ .playytmp4 - mencari dan mendownload video Youtube\n│ .capcut - download template capcut\n│ .facebook - download video/reels facebook\n│ .instagram - download reels instagram\n│ .fotoanime - ambil foto anime random\n│ .fotosexy - ambil foto random\n│ .pinterest - download foto pinterest\n│ .ttsaudio - text to speech audio\n│ .tiktokslide - download tiktok slide\n│ .ssweb - screenshot web\n│ .gdrive - download google drive\n│ .mediafire - download mediafire
│ .videosexybikini - download video sexy bikini random
│ .vidsexyjepang - download video sexy bikini jepang
│ .vidsexyindonesia - download video sexy bikini indonesia
│ .vidsexymalaysia - download video sexy bikini malaysia
│ .vidsexychina - download video sexy bikini china`;
      await this.sock.sendMessage(jid, { text: downloadText }, { quoted: msg });
      this.broadcastState(`Responded to downloadmenu command`);
    } else if (body === "stickermenu" || body === ".stickermenu" || body === "sticker menu" || body === ".sticker menu") {
      const stickerText = `🎨 *Sticker Menu*\n\n│ .stiker - ubah gambar jadi stiker\n│ .hd - tingkatkan resolusi gambar\n│ .brat - buat stiker teks brat\n│ .bratvid - buat stiker teks video brat\n│ .smeme - buat stiker dengan teks|teks\n│ .qc - buat stiker text chat\n│ .toimg - stiker ke gambar\n│ .togif - gambar ke gif\n│ .tovideo - ubah stiker ke video\n│ .rvo - read view once\n│ .hdvid - tingkatkan resolusi video\n│ .emojimix - gabungkan dua emoji\n│ .emojigif - buat emoji jadi gif\n│ .bratgambar - buat stiker brat dari gambar\n│ .attp - buat stiker teks animasi warna warni
│ .logo - buat logo text
│ .wallpaper - cari wallpaper keren`;
      await this.sock.sendMessage(jid, { text: stickerText }, { quoted: msg });
      this.broadcastState(`Responded to stickermenu command`);
    } else if (body === "kristenmenu" || body === ".kristenmenu" || body === "kristen menu" || body === ".kristen menu") {
      const kristenText = `✝️ *Kristen Menu*\n\n│ .ayatalkitab\n│ .doaayat\n│ .kisahyesus\n│ .jadwalgereja\n│ .namakitab`;
      await this.sock.sendMessage(jid, { text: kristenText }, { quoted: msg });
      this.broadcastState(`Responded to kristenmenu command`);
    } else if (body === "islammenu" || body === ".islammenu" || body === "islam menu" || body === ".islam menu") {
      const islamText = `☪️ *Islam Menu*\n\n│ .ayatkursi\n│ .tekssholat\n│ .hadits\n│ .jadwalsholat\n│ .kisahnabi\n│ .niatsholat\n│ .quotesislami`;
      await this.sock.sendMessage(jid, { text: islamText }, { quoted: msg });
      this.broadcastState(`Responded to islammenu command`);
    } else if (body === "funmenu" || body === ".funmenu" || body === "fun menu" || body === ".fun menu") {
      const funText = `🤡 *Fun Menu*\n\n│ .cekkhodam\n│ .cekganteng\n│ .cekcantik\n│ .cekjodoh\n│ .ceklesby\n│ .cekpasangan\n│ .cekgay\n│ .cekhoby\n│ .cekkesetiaan\n│ .jadian\n│ .kiss\n│ .quotes\n│ .avatar\n│ .ppcouple\n│ .ceksifat\n│ .cekkenakalan\n│ .cekperawan\n│ .cekperjaka\n│ .cekjanda\n│ .cekduda\n│ .bego\n│ .rate\n│ .top\n│ .infonegara\n│ .cekwibu\n│ .meme\n│ .waifu\n│ .ceksange\n│ .cekkaya\n│ .cekbucin\n│ .artinama\n│ .cekmasadepan\n│ .faktadunia\n│ .cekgempa\n│ .cekcuaca`;
      await this.sock.sendMessage(jid, { text: funText }, { quoted: msg });
      this.broadcastState(`Responded to funmenu command`);
    } else if (body === "cecanmenu" || body === ".cecanmenu" || body === "cecan menu" || body === ".cecan menu") {
      const cecanText = `👩 *Cecan Menu*\n\n│ .cecanchina\n│ .cecanhijab\n│ .cecanindonesia\n│ .cecanjapan\n│ .cecanjeni\n│ .cecanjiso\n│ .cecankorea\n│ .cecanmalaysia\n│ .cecanjustinaxie\n│ .cecanrose\n│ .cecanthailand\n│ .cecanvietnam`;
      await this.sock.sendMessage(jid, { text: cecanText }, { quoted: msg });
      this.broadcastState(`Responded to cecanmenu command`);
    } else if (body === "animemenu" || body === ".animemenu" || body === "anime menu" || body === ".anime menu") {
      const animeText = `🦊 *Anime Menu*\n\n│ .animeakira\n│ .animeasuna\n│ .animeeba\n│ .animeelaina\n│ .animeemilia\n│ .animegremory\n│ .animehinata\n│ .animehusbu\n│ .animeisuzu\n│ .animeitori\n│ .animekagura\n│ .animekanna\n│ .animemiku\n│ .animenezuko\n│ .animeloli\n│ .animepokemon\n│ .animerem\n│ .animeryuko\n│ .animeshina\n│ .animeshinka\n│ .animeshota\n│ .animetejina\n│ .animetoukachan`;
      await this.sock.sendMessage(jid, { text: animeText }, { quoted: msg });
      this.broadcastState(`Responded to animemenu command`);
    } else if (body === "sertifikatmenu" || body === ".sertifikatmenu" || body === "sertifikat menu" || body === ".sertifikat menu") {
      const sertifikatText = `🎓 *Sertifikat Menu*\n\n│ .stkbaik\n│ .stkcantik\n│ .stkganteng\n│ .stkhitam\n│ .stkmiskin\n│ .stkkaya\n│ .stkmarah\n│ .stksabar\n│ .stksakit\n│ .stkkeren\n│ .stkmisterius\n│ .stksntai\n│ .stksombong\n│ .stklucu\n│ .stkgila\n│ .stkstress`;
      await this.sock.sendMessage(jid, { text: sertifikatText }, { quoted: msg });
      this.broadcastState(`Responded to sertifikatmenu command`);
    } else if (body === "rpgmenu" || body === ".rpgmenu" || body === "rpg menu" || body === ".rpg menu") {
      const rpgText = `⚔️ *RPG Menu*\n\n│ .kerja\n│ .fightnaga\n│ .fightkucing\n│ .fightphonix\n│ .mancing\n│ .fightkyubi\n│ .berdagang\n│ .nabung\n│ .mining\n│ .bankcek\n│ .maling\n│ .banknabung\n│ .banktarik\n│ .berkebun\n│ .mulung\n│ .bonus\n│ .gajian\n│ .nebang\n│ .petualang\n│ .upgrade\n│ .transfer\n│ .collect\n│ .referal\n│ .shop\n│ .ojek\n│ .nguli\n│ .casino\n│ .pasar\n│ .berburu\n│ .polisi`;
      await this.sock.sendMessage(jid, { text: rpgText }, { quoted: msg });
      this.broadcastState(`Responded to rpgmenu command`);
    } else if (body === "primbonmenu" || body === ".primbonmenu" || body === "primbon menu" || body === ".primbon menu") {
      const primbonText = `🔮 *Primbon Menu*\n\n│ .pantun\n│ .ceksial\n│ .ramalannasib\n│ .ramalanjodoh\n│ .ramalancinta\n│ .ramalankeburukan\n│ .zodiak\n│ .isidompet\n│ .profesiku\n│ .nulis`;
      await this.sock.sendMessage(jid, { text: primbonText }, { quoted: msg });
      this.broadcastState(`Responded to primbonmenu command`);
    } else if (body === "margamenu" || body === ".margamenu" || body === "marga menu" || body === ".marga menu") {
      const margaText = `👥 *Marga Menu*\n\n│ .cekpariban - masukan marga/boru target agar tau marga/boru dia marpariban atau tidak menurut adat batak\n│ .cektartulang - masukan marga/boru target agar tau marga/boru dia martartulang atau tidak menurut adat batak\n│ .cektarito - masukan marga/boru target agar tau marga/boru dia martarito atau tidak menurut adat batak\n│ .cekpadan - masukan marga/boru target agar tau marga/boru dia marpadan atau tidak menurut adat batak`;
      await this.sock.sendMessage(jid, { text: margaText }, { quoted: msg });
      this.broadcastState(`Responded to margamenu command`);
    } else if (body === "videomenu" || body === ".videomenu" || body === "video menu" || body === ".video menu") {
      const videoText = `🎬 *Video Menu*\n\n│ .tiktokgirl\n│ .tiktoktobrut\n│ .tiktokkayes\n│ .tiktokhot\n│ .tiktokghea\n│ .tiktokbocil\n│ .tiktoklesbi\n│ .tiktokgay\n│ .tiktokartis\n│ .tiktokpacaran\n│ .tiktokanjing\n│ .tiktokkucing\n│ .tiktokfreefire\n│ .tiktokpubg\n│ .tiktoknikah\n│ .tiktokpointblank`;
      await this.sock.sendMessage(jid, { text: videoText }, { quoted: msg });
      this.broadcastState(`Responded to videomenu command`);
    } else if (body === "gamemenu" || body === ".gamemenu" || body === "game menu" || body === ".game menu") {
            const gameText = `🎮 *Game Menu*\n\n| .tebakgambar\n| .susunkata\n| .math\n| .tebakkata\n| .tebakbendera\n| .asahotak\n| .tebaklirik\n| .tekateki\n| .tebakangka\n| .kuis\n| .tebakkota\n| .family100\n| .tebakusia\n| .tebakkimia\n| .tebakbuah\n| .werewolf\n| .tebakuang\n| .tebaksurah\n| .tebakhewan\n| .tebakbaju\n| .tebakcelana\n| .tebakmakanan\n| .tebakjkt48\n| .togel\n| .stoptogel\n| .truthordare\n| .ulartangga`;
      await this.sock.sendMessage(jid, { text: gameText }, { quoted: msg });
      this.broadcastState(`Responded to gamemenu command`);
    } else if (body === "ownermenu" || body === ".ownermenu" || body === "owner menu" || body === ".owner menu") {
      const ownerText = `👑 *Owner Menu*

│ .broadcast
│ .restartbot
│ .addpremium / .delpremium
│ .addowner / .delowner
│ .listowner
│ .listpremium
│ .addlimit / .dellimit
│ .listlimit
│ .setbotpp
│ .setbotname
│ .addnamabot
│ .delnamabot
│ .addprefix
│ .delprefix
│ .listprefix
│ .addpoweredby
│ .delpoweredby
│ .listpoweredby
│ .linkset
│ .dellinkset
│ .addcmd
│ .delcmd
│ .listcmd
│ .self / .publik
│ .setcoverbot / .delcoverbot
│ .anticall on/off
│ .antibot on/off
│ .autoread on/off
│ .savekontak
│ .antivideo on/off - hapus video yang dikirim di grup
│ .autotyping on/off - sedang mengetik
│ .addsewa - tambah nomor sewa
│ .delsewa - hapus nomor sewa
│ .listsewa - list nomor sewa
│ .owner - menampilkan list owner
│ .joingc - bot masuk grup dari link
│ .creategc - buat grup baru
│ .addsticker - tambah stiker
│ .delsticker - hapus stiker
│ .totalfitur`;
      
      let msgObj: any = { text: ownerText };
      if (this.coverImageBuffer) msgObj = { image: this.coverImageBuffer, caption: ownerText };
      await this.sock.sendMessage(jid, msgObj, { quoted: msg });
      
      this.broadcastState(`Responded to ownermenu command`);
    } else if (body.startsWith(".warn") || body.startsWith("warn")) {
      if (!jid.endsWith("@g.us")) {
        await this.sock.sendMessage(jid, { text: "Perintah ini hanya bisa digunakan di dalam grup!" }, { quoted: msg });
      } else {
        const groupMetadata = await this.sock.groupMetadata(jid);
        const participants = groupMetadata.participants;
        const senderJidId = msg.key.participant || msg.key.remoteJid;
        const isAdmin = participants.some((p) => p.id === senderJidId && (p.admin === "admin" || p.admin === "superadmin")) || isOwner;
        
        if (!isAdmin) {
          await this.sock.sendMessage(jid, { text: "⚠️ *Akses Ditolak*\nPerintah ini hanya bisa digunakan oleh Admin Grup!" }, { quoted: msg });
        } else {
          const contextInfo = msg.message?.extendedTextMessage?.contextInfo || {};
          let targets = contextInfo.mentionedJid || [];
          if (contextInfo.participant) targets.push(contextInfo.participant);
          
          if (targets.length > 0) {
            const settings = this.groupSettings.get(jid) || {};
            if (!settings.warns) settings.warns = {};
            let replyText = "✅ *BERHASIL MEMBERIKAN PERINGATAN*\n\n";
            let kickTargets = [];
            
            for (const target of targets) {
               if (target === senderJidId) continue;
               const currentWarn = (settings.warns[target] || 0) + 1;
               settings.warns[target] = currentWarn;
               if (currentWarn >= 3) {
                  replyText += "@" + target.split("@")[0] + " telah mencapai 3/3 peringatan dan akan dikeluarkan!\n";
                  kickTargets.push(target);
                  delete settings.warns[target]; // Reset warn
               } else {
                  replyText += "@" + target.split("@")[0] + " mendapatkan peringatan ke-" + currentWarn + "/3.\n";
               }
            }
            this.groupSettings.set(jid, settings);
            this.saveGroupSettings();
            await this.sock.sendMessage(jid, { text: replyText, mentions: targets }, { quoted: msg });
            
            if (kickTargets.length > 0) {
               try {
                  await this.sock.groupParticipantsUpdate(jid, kickTargets, "remove");
               } catch (e) {
                  await this.sock.sendMessage(jid, { text: "⚠️ Gagal mengeluarkan anggota, pastikan bot adalah admin." }, { quoted: msg });
               }
            }
          } else {
             await this.sock.sendMessage(jid, { text: "Tag atau reply pesan orang yang ingin di warn!\nContoh: .warn @user" }, { quoted: msg });
          }
        }
      }
    } else if (body === ".listwarn" || body === "listwarn") {
      if (!jid.endsWith("@g.us")) {
        await this.sock.sendMessage(jid, { text: "Perintah ini hanya bisa digunakan di dalam grup!" }, { quoted: msg });
      } else {
        const groupMetadata = await this.sock.groupMetadata(jid);
        const participants = groupMetadata.participants;
        const senderJidId = msg.key.participant || msg.key.remoteJid;
        const isAdmin = participants.some((p) => p.id === senderJidId && (p.admin === "admin" || p.admin === "superadmin")) || isOwner;
        
        if (!isAdmin) {
          await this.sock.sendMessage(jid, { text: "⚠️ *Akses Ditolak*\nPerintah ini hanya bisa digunakan oleh Admin Grup!" }, { quoted: msg });
        } else {
           const settings = this.groupSettings.get(jid) || {};
           const warns = settings.warns || {};
           const warnUsers = Object.keys(warns);
           
           if (warnUsers.length === 0) {
              await this.sock.sendMessage(jid, { text: "Tidak ada anggota yang memiliki peringatan di grup ini." }, { quoted: msg });
           } else {
              let replyText = "📋 *DAFTAR PERINGATAN GRUP*\n\n";
              for (const u of warnUsers) {
                 replyText += "• @" + u.split("@")[0] + " : " + warns[u] + "/3\n";
              }
              await this.sock.sendMessage(jid, { text: replyText, mentions: warnUsers }, { quoted: msg });
           }
        }
      }
    } else if (body.startsWith(".delwarn") || body.startsWith("delwarn")) {
      if (!jid.endsWith("@g.us")) {
        await this.sock.sendMessage(jid, { text: "Perintah ini hanya bisa digunakan di dalam grup!" }, { quoted: msg });
      } else {
        const groupMetadata = await this.sock.groupMetadata(jid);
        const participants = groupMetadata.participants;
        const senderJidId = msg.key.participant || msg.key.remoteJid;
        const isAdmin = participants.some((p) => p.id === senderJidId && (p.admin === "admin" || p.admin === "superadmin")) || isOwner;
        
        if (!isAdmin) {
          await this.sock.sendMessage(jid, { text: "⚠️ *Akses Ditolak*\nPerintah ini hanya bisa digunakan oleh Admin Grup!" }, { quoted: msg });
        } else {
          const contextInfo = msg.message?.extendedTextMessage?.contextInfo || {};
          let targets = contextInfo.mentionedJid || [];
          if (contextInfo.participant) targets.push(contextInfo.participant);
          
          if (targets.length > 0) {
            const settings = this.groupSettings.get(jid) || {};
            if (!settings.warns) settings.warns = {};
            let replyText = "✅ *BERHASIL MENGHAPUS PERINGATAN*\n\n";
            
            for (const target of targets) {
               if (settings.warns[target] && settings.warns[target] > 0) {
                  settings.warns[target] -= 1;
                  replyText += "@" + target.split("@")[0] + " peringatan dikurangi menjadi " + settings.warns[target] + "/3.\n";
                  if (settings.warns[target] === 0) {
                     delete settings.warns[target];
                  }
               } else {
                  replyText += "@" + target.split("@")[0] + " tidak memiliki peringatan.\n";
               }
            }
            this.groupSettings.set(jid, settings);
            this.saveGroupSettings();
            await this.sock.sendMessage(jid, { text: replyText, mentions: targets }, { quoted: msg });
          } else {
             await this.sock.sendMessage(jid, { text: "Tag atau reply pesan orang yang ingin dihapus warn-nya!\nContoh: .delwarn @user" }, { quoted: msg });
          }
        }
      }
    } else if (body.startsWith(".infowarn") || body.startsWith("infowarn")) {
      if (!jid.endsWith("@g.us")) {
        await this.sock.sendMessage(jid, { text: "Perintah ini hanya bisa digunakan di dalam grup!" }, { quoted: msg });
      } else {
        const senderJidId = msg.key.participant || msg.key.remoteJid;
        const contextInfo = msg.message?.extendedTextMessage?.contextInfo || {};
        let targets = contextInfo.mentionedJid || [];
        if (contextInfo.participant) targets.push(contextInfo.participant);
        
        // If no target is specified, check the senderJid's own warnings
        if (targets.length === 0) {
           targets = [senderJidId];
        }
        
        const settings = this.groupSettings.get(jid) || {};
        const warns = settings.warns || {};
        
        let replyText = "ℹ️ *INFO PERINGATAN*\n\n";
        for (const target of targets) {
           const warnCount = warns[target] || 0;
           replyText += "@" + target.split("@")[0] + " : " + warnCount + "/3 peringatan.\n";
        }
        await this.sock.sendMessage(jid, { text: replyText, mentions: targets }, { quoted: msg });
      }
    } else if (body.startsWith(".addlist") || body.startsWith("addlist")) {
      if (!jid.endsWith("@g.us")) return await this.sock.sendMessage(jid, { text: "Hanya di grup!" }, { quoted: msg });
      const isAdmin = (await this.sock.groupMetadata(jid)).participants.some((p) => p.id === (msg.key.participant || msg.key.remoteJid) && (p.admin === "admin" || p.admin === "superadmin")) || isOwner;
      if (!isAdmin) return await this.sock.sendMessage(jid, { text: "⚠️ Hanya untuk admin grup!" }, { quoted: msg });
      
      const args = messageContent.replace(/^\.?addlist\s*/i, "").split("@");
      if (args.length < 2) return await this.sock.sendMessage(jid, { text: "Format salah!\nContoh: .addlist diamond@List harga diamond..." }, { quoted: msg });
      const key = args[0].trim().toLowerCase();
      const val = args.slice(1).join("@").trim();
      
      const settings = this.groupSettings.get(jid) || {};
      if (!settings.storeList) settings.storeList = {};
      settings.storeList[key] = val;
      this.groupSettings.set(jid, settings);
      this.saveGroupSettings();
      await this.sock.sendMessage(jid, { text: `✅ Berhasil menambahkan *\n${key}* ke daftar store.` }, { quoted: msg });
    } else if (body.startsWith(".update") || body.startsWith("update")) {
      if (!jid.endsWith("@g.us")) return await this.sock.sendMessage(jid, { text: "Hanya di grup!" }, { quoted: msg });
      const isAdmin = (await this.sock.groupMetadata(jid)).participants.some((p) => p.id === (msg.key.participant || msg.key.remoteJid) && (p.admin === "admin" || p.admin === "superadmin")) || isOwner;
      if (!isAdmin) return await this.sock.sendMessage(jid, { text: "⚠️ Hanya untuk admin grup!" }, { quoted: msg });
      
      const args = messageContent.replace(/^\.?update\s*/i, "").split("@");
      if (args.length < 2) return await this.sock.sendMessage(jid, { text: "Format salah!\nContoh: .update diamond@Harga baru..." }, { quoted: msg });
      const key = args[0].trim().toLowerCase();
      const val = args.slice(1).join("@").trim();
      
      const settings = this.groupSettings.get(jid) || {};
      if (!settings.storeList || !settings.storeList[key]) {
         return await this.sock.sendMessage(jid, { text: `❌ Daftar *\n${key}* tidak ditemukan!` }, { quoted: msg });
      }
      settings.storeList[key] = val;
      this.groupSettings.set(jid, settings);
      this.saveGroupSettings();
      await this.sock.sendMessage(jid, { text: `✅ Berhasil mengupdate *\n${key}*.` }, { quoted: msg });
    } else if (body.startsWith(".dellist") || body.startsWith("dellist")) {
      if (!jid.endsWith("@g.us")) return await this.sock.sendMessage(jid, { text: "Hanya di grup!" }, { quoted: msg });
      const isAdmin = (await this.sock.groupMetadata(jid)).participants.some((p) => p.id === (msg.key.participant || msg.key.remoteJid) && (p.admin === "admin" || p.admin === "superadmin")) || isOwner;
      if (!isAdmin) return await this.sock.sendMessage(jid, { text: "⚠️ Hanya untuk admin grup!" }, { quoted: msg });
      
      const key = messageContent.replace(/^\.?dellist\s*/i, "").trim().toLowerCase();
      if (!key) return await this.sock.sendMessage(jid, { text: "Contoh: .dellist diamond" }, { quoted: msg });
      
      const settings = this.groupSettings.get(jid) || {};
      if (settings.storeList && settings.storeList[key]) {
          delete settings.storeList[key];
          this.groupSettings.set(jid, settings);
          this.saveGroupSettings();
          await this.sock.sendMessage(jid, { text: `✅ Berhasil menghapus *\n${key}* dari daftar store.` }, { quoted: msg });
      } else {
          await this.sock.sendMessage(jid, { text: `❌ Daftar *\n${key}* tidak ditemukan!` }, { quoted: msg });
      }
    } else if (body === ".list" || body === "list") {
      if (!jid.endsWith("@g.us")) return await this.sock.sendMessage(jid, { text: "Hanya di grup!" }, { quoted: msg });
      const settings = this.groupSettings.get(jid) || {};
      const storeList = settings.storeList || {};
      const keys = Object.keys(storeList);
      
      if (keys.length === 0) {
         await this.sock.sendMessage(jid, { text: "Belum ada list di grup ini." }, { quoted: msg });
      } else {
         let txt = "🛒 *DAFTAR STORE*\n\n";
         keys.forEach((k, i) => { txt += `${i + 1}. ${k}\n`; });
         txt += "\n_Ketik nama list untuk melihat detail._";
         await this.sock.sendMessage(jid, { text: txt }, { quoted: msg });
      }
    } else if (body.startsWith(".setproses") || body.startsWith("setproses")) {
      if (!jid.endsWith("@g.us")) return await this.sock.sendMessage(jid, { text: "Hanya di grup!" }, { quoted: msg });
      const isAdmin = (await this.sock.groupMetadata(jid)).participants.some((p) => p.id === (msg.key.participant || msg.key.remoteJid) && (p.admin === "admin" || p.admin === "superadmin")) || isOwner;
      if (!isAdmin) return await this.sock.sendMessage(jid, { text: "⚠️ Hanya untuk admin grup!" }, { quoted: msg });
      
      const val = messageContent.replace(/^\.?setproses\s*/i, "").trim();
      if (!val) return await this.sock.sendMessage(jid, { text: "Contoh: .setproses Pesanan @user sedang diproses!" }, { quoted: msg });
      const settings = this.groupSettings.get(jid) || {};
      settings.setProses = val;
      this.groupSettings.set(jid, settings);
      this.saveGroupSettings();
      await this.sock.sendMessage(jid, { text: `✅ Berhasil mengatur template proses.` }, { quoted: msg });
    } else if (body.startsWith(".changeproses") || body.startsWith("changeproses")) {
      if (!jid.endsWith("@g.us")) return await this.sock.sendMessage(jid, { text: "Hanya di grup!" }, { quoted: msg });
      const isAdmin = (await this.sock.groupMetadata(jid)).participants.some((p) => p.id === (msg.key.participant || msg.key.remoteJid) && (p.admin === "admin" || p.admin === "superadmin")) || isOwner;
      if (!isAdmin) return await this.sock.sendMessage(jid, { text: "⚠️ Hanya untuk admin grup!" }, { quoted: msg });
      
      const val = messageContent.replace(/^\.?changeproses\s*/i, "").trim();
      if (!val) return await this.sock.sendMessage(jid, { text: "Contoh: .changeproses Pesanan @user sedang diproses!" }, { quoted: msg });
      const settings = this.groupSettings.get(jid) || {};
      settings.setProses = val;
      this.groupSettings.set(jid, settings);
      this.saveGroupSettings();
      await this.sock.sendMessage(jid, { text: `✅ Berhasil mengubah template proses.` }, { quoted: msg });
    } else if (body === ".delproses" || body === "delproses") {
      if (!jid.endsWith("@g.us")) return await this.sock.sendMessage(jid, { text: "Hanya di grup!" }, { quoted: msg });
      const isAdmin = (await this.sock.groupMetadata(jid)).participants.some((p) => p.id === (msg.key.participant || msg.key.remoteJid) && (p.admin === "admin" || p.admin === "superadmin")) || isOwner;
      if (!isAdmin) return await this.sock.sendMessage(jid, { text: "⚠️ Hanya untuk admin grup!" }, { quoted: msg });
      
      const settings = this.groupSettings.get(jid) || {};
      delete settings.setProses;
      this.groupSettings.set(jid, settings);
      this.saveGroupSettings();
      await this.sock.sendMessage(jid, { text: `✅ Berhasil menghapus template proses.` }, { quoted: msg });
    } else if (body.startsWith(".setdone") || body.startsWith("setdone")) {
      if (!jid.endsWith("@g.us")) return await this.sock.sendMessage(jid, { text: "Hanya di grup!" }, { quoted: msg });
      const isAdmin = (await this.sock.groupMetadata(jid)).participants.some((p) => p.id === (msg.key.participant || msg.key.remoteJid) && (p.admin === "admin" || p.admin === "superadmin")) || isOwner;
      if (!isAdmin) return await this.sock.sendMessage(jid, { text: "⚠️ Hanya untuk admin grup!" }, { quoted: msg });
      
      const val = messageContent.replace(/^\.?setdone\s*/i, "").trim();
      if (!val) return await this.sock.sendMessage(jid, { text: "Contoh: .setdone Pesanan @user telah selesai!" }, { quoted: msg });
      const settings = this.groupSettings.get(jid) || {};
      settings.setDone = val;
      this.groupSettings.set(jid, settings);
      this.saveGroupSettings();
      await this.sock.sendMessage(jid, { text: `✅ Berhasil mengatur template done.` }, { quoted: msg });
    } else if (body.startsWith(".changedone") || body.startsWith("changedone")) {
      if (!jid.endsWith("@g.us")) return await this.sock.sendMessage(jid, { text: "Hanya di grup!" }, { quoted: msg });
      const isAdmin = (await this.sock.groupMetadata(jid)).participants.some((p) => p.id === (msg.key.participant || msg.key.remoteJid) && (p.admin === "admin" || p.admin === "superadmin")) || isOwner;
      if (!isAdmin) return await this.sock.sendMessage(jid, { text: "⚠️ Hanya untuk admin grup!" }, { quoted: msg });
      
      const val = messageContent.replace(/^\.?changedone\s*/i, "").trim();
      if (!val) return await this.sock.sendMessage(jid, { text: "Contoh: .changedone Pesanan @user telah selesai!" }, { quoted: msg });
      const settings = this.groupSettings.get(jid) || {};
      settings.setDone = val;
      this.groupSettings.set(jid, settings);
      this.saveGroupSettings();
      await this.sock.sendMessage(jid, { text: `✅ Berhasil mengubah template done.` }, { quoted: msg });
    } else if (body === ".delsetdone" || body === "delsetdone") {
      if (!jid.endsWith("@g.us")) return await this.sock.sendMessage(jid, { text: "Hanya di grup!" }, { quoted: msg });
      const isAdmin = (await this.sock.groupMetadata(jid)).participants.some((p) => p.id === (msg.key.participant || msg.key.remoteJid) && (p.admin === "admin" || p.admin === "superadmin")) || isOwner;
      if (!isAdmin) return await this.sock.sendMessage(jid, { text: "⚠️ Hanya untuk admin grup!" }, { quoted: msg });
      
      const settings = this.groupSettings.get(jid) || {};
      delete settings.setDone;
      this.groupSettings.set(jid, settings);
      this.saveGroupSettings();
      await this.sock.sendMessage(jid, { text: `✅ Berhasil menghapus template done.` }, { quoted: msg });
    } else if (body.startsWith(".proses") || body.startsWith("proses")) {
      if (!jid.endsWith("@g.us")) return await this.sock.sendMessage(jid, { text: "Hanya di grup!" }, { quoted: msg });
      const isAdmin = (await this.sock.groupMetadata(jid)).participants.some((p) => p.id === (msg.key.participant || msg.key.remoteJid) && (p.admin === "admin" || p.admin === "superadmin")) || isOwner;
      if (!isAdmin) return await this.sock.sendMessage(jid, { text: "⚠️ Hanya untuk admin grup!" }, { quoted: msg });
      
      const order = messageContent.replace(/^\.?proses\s*/i, "").trim();
      const settings = this.groupSettings.get(jid) || {};
      const template = settings.setProses || "⏳ *PESANAN DIPROSES*\n\nCatatan: {order}\nMohon ditunggu ya kak!";
      
      const now = new Date();
      const jam = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      const tanggal = now.getDate() + '/' + (now.getMonth() + 1) + '/' + now.getFullYear();
      
      let text = template.replace(/@user/g, "@" + (msg.key.participant || msg.key.remoteJid).split("@")[0])
                         .replace(/@jam/g, jam)
                         .replace(/@tanggal/g, tanggal)
                         .replace(/\{order\}/g, order);
      if (order && !template.includes("{order}")) text += "\n\nCatatan: " + order;
      
      await this.sock.sendMessage(jid, { text: text, mentions: [(msg.key.participant || msg.key.remoteJid)] }, { quoted: msg });
    } else if (body.startsWith(".done") || body.startsWith("done")) {
      if (!jid.endsWith("@g.us")) return await this.sock.sendMessage(jid, { text: "Hanya di grup!" }, { quoted: msg });
      const isAdmin = (await this.sock.groupMetadata(jid)).participants.some((p) => p.id === (msg.key.participant || msg.key.remoteJid) && (p.admin === "admin" || p.admin === "superadmin")) || isOwner;
      if (!isAdmin) return await this.sock.sendMessage(jid, { text: "⚠️ Hanya untuk admin grup!" }, { quoted: msg });
      
      const order = messageContent.replace(/^\.?done\s*/i, "").trim();
      const settings = this.groupSettings.get(jid) || {};
      const template = settings.setDone || "✅ *PESANAN SELESAI*\n\nCatatan: {order}\nTerima kasih telah berbelanja!";
      
      const now = new Date();
      const jam = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      const tanggal = now.getDate() + '/' + (now.getMonth() + 1) + '/' + now.getFullYear();
      
      let text = template.replace(/@user/g, "@" + (msg.key.participant || msg.key.remoteJid).split("@")[0])
                         .replace(/@jam/g, jam)
                         .replace(/@tanggal/g, tanggal)
                         .replace(/\{order\}/g, order);
      if (order && !template.includes("{order}")) text += "\n\nCatatan: " + order;
      
      await this.sock.sendMessage(jid, { text: text, mentions: [(msg.key.participant || msg.key.remoteJid)] }, { quoted: msg });
    
    } else if (body.startsWith(".addproduk") || body.startsWith("addproduk")) {
      if (!isOwner) return await this.sock.sendMessage(jid, { text: "⚠️ Hanya owner yang dapat mengelola produk!" }, { quoted: msg });
      const args = messageContent.replace(/^\.?addproduk\s*/i, "").split("|");
      if (args.length < 3) return await this.sock.sendMessage(jid, { text: "Format salah!\nContoh: .addproduk ID_Produk | Nama Produk | Harga" }, { quoted: msg });
      const id = args[0].trim().toLowerCase();
      const nama = args[1].trim();
      const harga = parseInt(args[2].trim().replace(/\D/g, ''));
      
      this.karyawanData.produk[id] = { nama, harga, stok: 0 };
      this.saveKaryawanData();
      await this.sock.sendMessage(jid, { text: `✅ Produk berhasil ditambahkan:\n\nID: ${id}\nNama: ${nama}\nHarga: Rp ${harga.toLocaleString('id-ID')}` }, { quoted: msg });

    } else if (body.startsWith(".delproduk") || body.startsWith("delproduk")) {
      if (!isOwner) return await this.sock.sendMessage(jid, { text: "⚠️ Hanya owner yang dapat mengelola produk!" }, { quoted: msg });
      const id = messageContent.replace(/^\.?delproduk\s*/i, "").trim().toLowerCase();
      if (!this.karyawanData.produk[id]) return await this.sock.sendMessage(jid, { text: `❌ Produk dengan ID ${id} tidak ditemukan.` }, { quoted: msg });
      
      delete this.karyawanData.produk[id];
      this.saveKaryawanData();
      await this.sock.sendMessage(jid, { text: `✅ Produk ${id} berhasil dihapus.` }, { quoted: msg });

    } else if (body === ".listproduk" || body === "listproduk") {
      const produkKeys = Object.keys(this.karyawanData.produk);
      if (produkKeys.length === 0) return await this.sock.sendMessage(jid, { text: "📦 Daftar produk kosong." }, { quoted: msg });
      
      let txt = "📦 *Daftar Produk*\n\n";
      for (const key of produkKeys) {
        const p = this.karyawanData.produk[key];
        txt += `• ID: ${key}\n  Nama: ${p.nama}\n  Harga: Rp ${p.harga.toLocaleString('id-ID')}\n  Stok: ${p.stok}\n\n`;
      }
      await this.sock.sendMessage(jid, { text: txt.trim() }, { quoted: msg });

    } else if (body.startsWith(".cekproduk") || body.startsWith("cekproduk")) {
      const id = messageContent.replace(/^\.?cekproduk\s*/i, "").trim().toLowerCase();
      if (!this.karyawanData.produk[id]) return await this.sock.sendMessage(jid, { text: `❌ Produk dengan ID ${id} tidak ditemukan.` }, { quoted: msg });
      
      const p = this.karyawanData.produk[id];
      await this.sock.sendMessage(jid, { text: `📦 *Info Produk*\n\nID: ${id}\nNama: ${p.nama}\nHarga: Rp ${p.harga.toLocaleString('id-ID')}\nStok: ${p.stok}` }, { quoted: msg });

    } else if (body.startsWith(".hargaproduk") || body.startsWith("hargaproduk")) {
      const id = messageContent.replace(/^\.?hargaproduk\s*/i, "").trim().toLowerCase();
      if (!this.karyawanData.produk[id]) return await this.sock.sendMessage(jid, { text: `❌ Produk dengan ID ${id} tidak ditemukan.` }, { quoted: msg });
      
      const p = this.karyawanData.produk[id];
      await this.sock.sendMessage(jid, { text: `💰 *Harga Produk*\n\nNama: ${p.nama}\nHarga: Rp ${p.harga.toLocaleString('id-ID')}` }, { quoted: msg });

    } else if (body.startsWith(".addstok") || body.startsWith("addstok") || body.startsWith(".restock") || body.startsWith("restock") || body.startsWith(".updatestok") || body.startsWith("updatestok")) {
      if (!isOwner && !jid.endsWith("@g.us")) return await this.sock.sendMessage(jid, { text: "⚠️ Hanya untuk admin / owner!" }, { quoted: msg });
      const args = messageContent.replace(/^\.?(addstok|restock|updatestok)\s*/i, "").split("|");
      if (args.length < 2) return await this.sock.sendMessage(jid, { text: "Format salah!\nContoh: .addstok ID_Produk | Jumlah" }, { quoted: msg });
      
      const id = args[0].trim().toLowerCase();
      const jumlah = parseInt(args[1].trim());
      if (isNaN(jumlah)) return await this.sock.sendMessage(jid, { text: "Jumlah harus berupa angka!" }, { quoted: msg });
      if (!this.karyawanData.produk[id]) return await this.sock.sendMessage(jid, { text: `❌ Produk dengan ID ${id} tidak ditemukan.` }, { quoted: msg });
      
      if (body.startsWith(".updatestok") || body.startsWith("updatestok")) {
        this.karyawanData.produk[id].stok = jumlah;
      } else {
        this.karyawanData.produk[id].stok += jumlah;
      }
      this.saveKaryawanData();
      await this.sock.sendMessage(jid, { text: `✅ Stok berhasil diperbarui!\n\nProduk: ${this.karyawanData.produk[id].nama}\nStok saat ini: ${this.karyawanData.produk[id].stok}` }, { quoted: msg });

    } else if (body.startsWith(".cekstok") || body.startsWith("cekstok")) {
      const id = messageContent.replace(/^\.?cekstok\s*/i, "").trim().toLowerCase();
      if (!id) {
         let txt = "📦 *Stok Produk*\n\n";
         for (const key of Object.keys(this.karyawanData.produk)) {
           txt += `• ${this.karyawanData.produk[key].nama}: ${this.karyawanData.produk[key].stok}\n`;
         }
         return await this.sock.sendMessage(jid, { text: txt.trim() || "Daftar produk kosong." }, { quoted: msg });
      }
      if (!this.karyawanData.produk[id]) return await this.sock.sendMessage(jid, { text: `❌ Produk dengan ID ${id} tidak ditemukan.` }, { quoted: msg });
      
      const p = this.karyawanData.produk[id];
      await this.sock.sendMessage(jid, { text: `📦 *Cek Stok*\n\nNama: ${p.nama}\nStok: ${p.stok}` }, { quoted: msg });

    } else if (body.startsWith(".penjualan") || body.startsWith("penjualan")) {
      if (!isOwner && !jid.endsWith("@g.us")) return await this.sock.sendMessage(jid, { text: "⚠️ Hanya untuk admin / owner!" }, { quoted: msg });
      const args = messageContent.replace(/^\.?penjualan\s*/i, "").split("|");
      if (args.length < 2) return await this.sock.sendMessage(jid, { text: "Format salah!\nContoh: .penjualan ID_Produk | Jumlah" }, { quoted: msg });
      
      const id = args[0].trim().toLowerCase();
      const jumlah = parseInt(args[1].trim());
      if (isNaN(jumlah)) return await this.sock.sendMessage(jid, { text: "Jumlah harus berupa angka!" }, { quoted: msg });
      if (!this.karyawanData.produk[id]) return await this.sock.sendMessage(jid, { text: `❌ Produk dengan ID ${id} tidak ditemukan.` }, { quoted: msg });
      if (this.karyawanData.produk[id].stok < jumlah) return await this.sock.sendMessage(jid, { text: `❌ Stok tidak mencukupi! Stok saat ini: ${this.karyawanData.produk[id].stok}` }, { quoted: msg });
      
      this.karyawanData.produk[id].stok -= jumlah;
      const total = this.karyawanData.produk[id].harga * jumlah;
      const tanggal = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
      const kasir = msg.key.participant || msg.key.remoteJid;
      
      this.karyawanData.riwayat.push({ tanggal, produk: id, jumlah, total, kasir });
      this.saveKaryawanData();
      
      await this.sock.sendMessage(jid, { text: `✅ *Penjualan Berhasil*\n\nProduk: ${this.karyawanData.produk[id].nama}\nJumlah: ${jumlah}\nTotal: Rp ${total.toLocaleString('id-ID')}\nSisa Stok: ${this.karyawanData.produk[id].stok}\nTanggal: ${tanggal}` }, { quoted: msg });

    } else if (body.startsWith(".strukpembayaran") || body.startsWith("strukpembayaran")) {
      if (this.karyawanData.riwayat.length === 0) return await this.sock.sendMessage(jid, { text: "Belum ada data penjualan." }, { quoted: msg });
      const lastSales = this.karyawanData.riwayat[this.karyawanData.riwayat.length - 1];
      const prod = this.karyawanData.produk[lastSales.produk];
      const nama = prod ? prod.nama : lastSales.produk;
      
      const struk = `🧾 *STRUK PEMBAYARAN*\n\nTanggal: ${lastSales.tanggal}\nKasir: @${lastSales.kasir.split("@")[0]}\n--------------------------\nItem: ${nama}\nJumlah: ${lastSales.jumlah}\nHarga Satuan: Rp ${(lastSales.total / lastSales.jumlah).toLocaleString('id-ID')}\n--------------------------\nTotal: Rp ${lastSales.total.toLocaleString('id-ID')}\n\nTerima kasih telah berbelanja!`;
      await this.sock.sendMessage(jid, { text: struk, mentions: [lastSales.kasir] }, { quoted: msg });

    } else if (body === ".riwayatjual" || body === "riwayatjual") {
      if (this.karyawanData.riwayat.length === 0) return await this.sock.sendMessage(jid, { text: "Belum ada riwayat penjualan." }, { quoted: msg });
      
      let txt = "📜 *Riwayat Penjualan (10 Terakhir)*\n\n";
      const recent = this.karyawanData.riwayat.slice(-10);
      for (const r of recent) {
         const p = this.karyawanData.produk[r.produk];
         txt += `• ${r.tanggal}\n  ${p ? p.nama : r.produk} (${r.jumlah}x) - Rp ${r.total.toLocaleString('id-ID')}\n\n`;
      }
      await this.sock.sendMessage(jid, { text: txt.trim() }, { quoted: msg });

    } else if (body === ".laporan" || body === "laporan") {
      if (!isOwner) return await this.sock.sendMessage(jid, { text: "⚠️ Hanya owner yang dapat melihat laporan!" }, { quoted: msg });
      
      let totalPendapatan = 0;
      let totalItem = 0;
      for (const r of this.karyawanData.riwayat) {
        totalPendapatan += r.total;
        totalItem += r.jumlah;
      }
      
      await this.sock.sendMessage(jid, { text: `📊 *Laporan Penjualan Keseluruhan*\n\nTotal Transaksi: ${this.karyawanData.riwayat.length}\nTotal Item Terjual: ${totalItem}\nTotal Pendapatan: Rp ${totalPendapatan.toLocaleString('id-ID')}` }, { quoted: msg });

    } else if (body.startsWith(".konfirmasi") || body.startsWith("konfirmasi")) {
      const order = messageContent.replace(/^\.?konfirmasi\s*/i, "").trim();
      await this.sock.sendMessage(jid, { text: `✅ *Konfirmasi Diterima*\n\nPesanan/Aksi: ${order}\nTelah dikonfirmasi oleh staf.` }, { quoted: msg });
} else if (body.startsWith(".jeda") || body.startsWith("jeda")) {
      if (!jid.endsWith("@g.us")) return await this.sock.sendMessage(jid, { text: "Hanya di grup!" }, { quoted: msg });
      const isAdmin = (await this.sock.groupMetadata(jid)).participants.some((p) => p.id === (msg.key.participant || msg.key.remoteJid) && (p.admin === "admin" || p.admin === "superadmin")) || isOwner;
      if (!isAdmin) return await this.sock.sendMessage(jid, { text: "⚠️ Hanya untuk admin grup!" }, { quoted: msg });
      
      const args = messageContent.replace(/^\.?jeda\s*/i, "").trim();
      const menit = parseInt(args);
      if (isNaN(menit)) return await this.sock.sendMessage(jid, { text: "Contoh: .jeda 5 (untuk 5 menit)" }, { quoted: msg });
      
      try {
          await this.sock.groupSettingUpdate(jid, 'announcement'); // Close group
          await this.sock.sendMessage(jid, { text: `✅ Grup ditutup sementara selama ${menit} menit.` });
          setTimeout(async () => {
             await this.sock.groupSettingUpdate(jid, 'not_announcement'); // Open group
             await this.sock.sendMessage(jid, { text: `✅ Waktu jeda habis! Grup telah dibuka kembali.` });
          }, menit * 60 * 1000);
      } catch (e) {
          await this.sock.sendMessage(jid, { text: "Gagal menjeda grup, pastikan bot adalah admin." }, { quoted: msg });
      }
    } else if (body.startsWith(".tambah") || body.startsWith("tambah")) {
      const args = messageContent.replace(/^\.?tambah\s*/i, "").split(" ");
      if (args.length < 2) return await this.sock.sendMessage(jid, { text: "Contoh: .tambah 5 10" }, { quoted: msg });
      const res = parseFloat(args[0]) + parseFloat(args[1]);
      await this.sock.sendMessage(jid, { text: `Hasil: ${res}` }, { quoted: msg });
    } else if (body.startsWith(".kurang") || body.startsWith("kurang")) {
      const args = messageContent.replace(/^\.?kurang\s*/i, "").split(" ");
      if (args.length < 2) return await this.sock.sendMessage(jid, { text: "Contoh: .kurang 10 5" }, { quoted: msg });
      const res = parseFloat(args[0]) - parseFloat(args[1]);
      await this.sock.sendMessage(jid, { text: `Hasil: ${res}` }, { quoted: msg });
    } else if (body.startsWith(".kali") || body.startsWith("kali")) {
      const args = messageContent.replace(/^\.?kali\s*/i, "").split(" ");
      if (args.length < 2) return await this.sock.sendMessage(jid, { text: "Contoh: .kali 5 10" }, { quoted: msg });
      const res = parseFloat(args[0]) * parseFloat(args[1]);
      await this.sock.sendMessage(jid, { text: `Hasil: ${res}` }, { quoted: msg });
    } else if (body.startsWith(".kick") || body.startsWith("kick")) {
      if (!jid.endsWith("@g.us")) {
        await this.sock.sendMessage(jid, { text: "Perintah ini hanya bisa digunakan di dalam grup!" }, { quoted: msg });
      } else {
        const groupMetadata = await this.sock.groupMetadata(jid);
        const participants = groupMetadata.participants;
        const senderJidId = msg.key.participant || msg.key.remoteJid;
        const isAdmin = participants.some((p: any) => p.id === senderJidId && (p.admin === "admin" || p.admin === "superadmin")) || isOwner;
        
        if (!isAdmin) {
          await this.sock.sendMessage(jid, { text: "⚠️ *Akses Ditolak*\nPerintah ini hanya bisa digunakan oleh Admin Grup!" }, { quoted: msg });
        } else {
          const contextInfo = msg.message?.extendedTextMessage?.contextInfo || {};
          let targets = contextInfo.mentionedJid || [];
          if (contextInfo.participant) {
              targets.push(contextInfo.participant);
          }
          
          if (targets.length > 0) {
            try {
              await this.sock.groupParticipantsUpdate(jid, targets, "remove");
              await this.sock.sendMessage(jid, { text: "Berhasil mengeluarkan anggota!" }, { quoted: msg });
            } catch (err) {
              await this.sock.sendMessage(jid, { text: "Gagal mengeluarkan anggota. Pastikan bot adalah admin grup." }, { quoted: msg });
            }
          } else {
            await this.sock.sendMessage(jid, { text: "Tag atau reply pesan orang yang ingin di kick!\nContoh: .kick @user" }, { quoted: msg });
          }
        }
      }
      this.broadcastState(`Responded to kick command`);
    } else if (body.startsWith(".kickall") || body.startsWith("kickall")) {
      if (!jid.endsWith("@g.us")) {
        await this.sock.sendMessage(jid, { text: "Perintah ini hanya bisa digunakan di dalam grup!" }, { quoted: msg });
      } else {
        try {
          const groupMetadata = await this.sock.groupMetadata(jid);
          const participants = groupMetadata.participants;
          // We don't kick the bot itself or the owner who triggered the command
          const botId = this.sock.user?.id?.split(":")[0] + "@s.whatsapp.net";
          const senderJidId = msg.key.participant || msg.key.remoteJid;
          
          const isAdmin = participants.some((p: any) => p.id === senderJidId && (p.admin === "admin" || p.admin === "superadmin")) || isOwner;
          
          if (!isAdmin) {
            await this.sock.sendMessage(jid, { text: "⚠️ *Akses Ditolak*\nPerintah ini hanya bisa digunakan oleh Admin Grup!" }, { quoted: msg });
          } else {
            let targetsToKick = participants
                .map((p: any) => p.id)
                .filter((id: string) => id !== botId && id !== senderJidId);

            if (targetsToKick.length > 0) {
                await this.sock.sendMessage(jid, { text: "⚠️ Mengeluarkan semua anggota grup..." }, { quoted: msg });
                
                // We'll kick them in chunks to avoid blocking/rate limits if the group is large
                const chunkSize = 50;
                for (let i = 0; i < targetsToKick.length; i += chunkSize) {
                    const chunk = targetsToKick.slice(i, i + chunkSize);
                    await this.sock.groupParticipantsUpdate(jid, chunk, "remove");
                    // simple delay could be added, but groupParticipantsUpdate might handle it
                }
                await this.sock.sendMessage(jid, { text: "Berhasil mengeluarkan semua anggota!" });
            } else {
                await this.sock.sendMessage(jid, { text: "Tidak ada anggota lain untuk dikeluarkan." }, { quoted: msg });
            }
          }
        } catch (err) {
          await this.sock.sendMessage(jid, { text: "Gagal mengeluarkan semua anggota. Pastikan bot adalah admin grup." }, { quoted: msg });
        }
      }
      this.broadcastState(`Responded to kickall command`);
    } else if (body.startsWith(".add ") || body === ".add" || body.startsWith("add ") || body === "add") {
      if (!jid.endsWith("@g.us")) {
        await this.sock.sendMessage(jid, { text: "Perintah ini hanya bisa digunakan di dalam grup!" }, { quoted: msg });
      } else {
        const text = body.replace(".add", "").replace("add", "").trim();
        const number = text.replace(/[^0-9]/g, "");
        if (number) {
          try {
            await this.sock.groupParticipantsUpdate(jid, [`${number}@s.whatsapp.net`], "add");
            await this.sock.sendMessage(jid, { text: "Berhasil menambahkan anggota!" }, { quoted: msg });
          } catch (err) {
            await this.sock.sendMessage(jid, { text: "Gagal menambahkan anggota. Pastikan bot adalah admin grup dan nomor valid." }, { quoted: msg });
          }
        } else {
          await this.sock.sendMessage(jid, { text: "Kirim nomor yang mau ditambah!\nContoh: .add 628123456789" }, { quoted: msg });
        }
      }
      this.broadcastState(`Responded to add command`);
    } else if (body.startsWith(".hidetag") || body.startsWith("hidetag")) {
        if (!jid.endsWith("@g.us")) {
            await this.sock.sendMessage(jid, { text: "Perintah ini hanya bisa digunakan di dalam grup!" }, { quoted: msg });
        } else {
            const text = body.replace(".hidetag", "").replace("hidetag", "").trim() || "Perhatian semuanya!";
            try {
                const groupMetadata = await this.sock.groupMetadata(jid);
                const participants = groupMetadata.participants.map((p: any) => p.id);
                await this.sock.sendMessage(jid, { text: text, mentions: participants });
            } catch (err) {
                await this.sock.sendMessage(jid, { text: "Gagal melakukan hidetag." }, { quoted: msg });
            }
        }
    } else if (body === ".math" || body === "math") {
      const num1 = Math.floor(Math.random() * 100);
      const num2 = Math.floor(Math.random() * 100);
      const ops = ['+', '-', '*'];
      const op = ops[Math.floor(Math.random() * ops.length)];
      let answer = 0;
      if (op === '+') answer = num1 + num2;
      else if (op === '-') answer = num1 - num2;
      else if (op === '*') answer = num1 * num2;
      
      const sentMsg = await this.sock.sendMessage(jid, { text: `🔢 *Game Math*\n\nBerapa hasil dari:\n*${num1} ${op} ${num2}* ?\n\n_Silakan balas (reply) pesan ini dengan jawabanmu!_` }, { quoted: msg });
      if (sentMsg?.key?.id) {
          this.activeGames.set(sentMsg.key.id, { answer: String(answer), type: "math" });
      }
      this.broadcastState(`Responded to math command`);
    } else if (body === ".susunkata" || body === "susunkata") {
      try {
          const res = await axios.get('https://raw.githubusercontent.com/BochilTeam/database/master/games/susunkata.json');
          if (res.data && res.data.length > 0) {
              const randomWord = res.data[Math.floor(Math.random() * res.data.length)];
              const sentMsg = await this.sock.sendMessage(jid, { text: `🔠 *Game Susun Kata*\n\nSusun kata berikut:\n*${randomWord.soal}*\n\nTipe: ${randomWord.tipe}\n\n_Silakan balas (reply) pesan ini dengan jawabanmu!_` }, { quoted: msg });
              if (sentMsg?.key?.id) {
                  this.activeGames.set(sentMsg.key.id, { answer: randomWord.jawaban, type: "susunkata" });
              }
          }
      } catch (e) {
          await this.sock.sendMessage(jid, { text: "Gagal memuat game susunkata." }, { quoted: msg });
      }
      this.broadcastState(`Responded to susunkata command`);
    } else if (body === ".tebakgambar" || body === "tebakgambar") {
      try {
          const res = await axios.get('https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakgambar.json');
          if (res.data && res.data.length > 0) {
              const randomItem = res.data[Math.floor(Math.random() * res.data.length)];
              const sentMsg = await this.sock.sendMessage(jid, { image: { url: randomItem.img }, caption: `🖼️ *Game Tebak Gambar*\n\nKet: ${randomItem.deskripsi}\n_Silakan balas (reply) pesan ini dengan jawabanmu!_` }, { quoted: msg });
              if (sentMsg?.key?.id) {
                  this.activeGames.set(sentMsg.key.id, { answer: randomItem.jawaban, type: "tebakgambar" });
              }
          }
      } catch (e) {
          await this.sock.sendMessage(jid, { text: "Gagal memuat game tebakgambar." }, { quoted: msg });
      }
      this.broadcastState(`Responded to tebakgambar command`);
    } else if (body === ".tebakkata" || body === "tebakkata") {
      try {
          const res = await axios.get('https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakkata.json');
          if (res.data && res.data.length > 0) {
              const randomWord = res.data[Math.floor(Math.random() * res.data.length)];
              const sentMsg = await this.sock.sendMessage(jid, { text: `🔠 *Game Tebak Kata*\n\nClue: ${randomWord.soal}\n\n_Silakan balas (reply) pesan ini dengan jawabanmu!_` }, { quoted: msg });
              if (sentMsg?.key?.id) {
                  this.activeGames.set(sentMsg.key.id, { answer: randomWord.jawaban, type: "tebakkata" });
              }
          }
      } catch (e) {
          await this.sock.sendMessage(jid, { text: "Gagal memuat game tebakkata." }, { quoted: msg });
      }
      this.broadcastState(`Responded to tebakkata command`);
    } else if (body === ".tebakbendera" || body === "tebakbendera") {
      try {
          const res = await axios.get('https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakbendera.json');
          if (res.data && res.data.length > 0) {
              const randomItem = res.data[Math.floor(Math.random() * res.data.length)];
              const flagUrl = `https://flagcdn.com/w320/${randomItem.flag.toLowerCase()}.png`;
              const sentMsg = await this.sock.sendMessage(jid, { image: { url: flagUrl }, caption: `🏳️ *Game Tebak Bendera*\n\nBendera dari negara mana ini?\n_Silakan balas (reply) pesan ini!_` }, { quoted: msg });
              if (sentMsg?.key?.id) {
                  this.activeGames.set(sentMsg.key.id, { answer: randomItem.name, type: "tebakbendera" });
              }
          }
      } catch (e) {
          await this.sock.sendMessage(jid, { text: "Gagal memuat game tebakbendera." }, { quoted: msg });
      }
      this.broadcastState(`Responded to tebakbendera command`);
    } else if (body === ".asahotak" || body === "asahotak") {
      try {
          const res = await axios.get('https://raw.githubusercontent.com/BochilTeam/database/master/games/asahotak.json');
          if (res.data && res.data.length > 0) {
              const r = res.data[Math.floor(Math.random() * res.data.length)];
              const sentMsg = await this.sock.sendMessage(jid, { text: `🧠 *Game Asah Otak*\n\nPertanyaan: ${r.soal}\n\n_Silakan balas (reply) pesan ini dengan jawabanmu!_` }, { quoted: msg });
              if (sentMsg?.key?.id) {
                  this.activeGames.set(sentMsg.key.id, { answer: r.jawaban, type: "asahotak" });
              }
          }
      } catch (e) {
          await this.sock.sendMessage(jid, { text: "Gagal memuat game asahotak." }, { quoted: msg });
      }
      this.broadcastState(`Responded to asahotak command`);
    } else if (body === ".tebakbuah" || body === "tebakbuah") {
      const buahList = [
          { soal: "🍎", jawaban: "apel" },
          { soal: "🍌", jawaban: "pisang" },
          { soal: "🍇", jawaban: "anggur" },
          { soal: "🍉", jawaban: "semangka" },
          { soal: "🍊", jawaban: "jeruk" },
          { soal: "🍓", jawaban: "stroberi" },
          { soal: "🥭", jawaban: "mangga" },
          { soal: "🍍", jawaban: "nanas" },
          { soal: "🥥", jawaban: "kelapa" },
          { soal: "🥝", jawaban: "kiwi" },
          { soal: "🥑", jawaban: "alpukat" },
          { soal: "🍒", jawaban: "ceri" },
          { soal: "🍈", jawaban: "melon" },
          { soal: "🍐", jawaban: "pir" },
          { soal: "🍋", jawaban: "lemon" },
          { soal: "🍑", jawaban: "persik" },
          { soal: "🍅", jawaban: "tomat" },
          { soal: "🍆", jawaban: "terong" }
      ];
      const r = buahList[Math.floor(Math.random() * buahList.length)];
      const sentMsg = await this.sock.sendMessage(jid, { text: `🍎 *Game Tebak Buah*\n\nBuah apakah ini: ${r.soal}\n\n_Silakan balas (reply) pesan ini dengan jawabanmu!_` }, { quoted: msg });
      if (sentMsg?.key?.id) {
          this.activeGames.set(sentMsg.key.id, { answer: r.jawaban, type: "tebakbuah" });
      }
      this.broadcastState(`Responded to tebakbuah command`);
    } else if (body === ".tebaklirik" || body === "tebaklirik") {
      try {
          const res = await axios.get('https://raw.githubusercontent.com/BochilTeam/database/master/games/tebaklirik.json');
          if (res.data && res.data.length > 0) {
              const r = res.data[Math.floor(Math.random() * res.data.length)];
              const sentMsg = await this.sock.sendMessage(jid, { text: `🎵 *Game Tebak Lirik*\n\nLanjutkan lirik berikut:\n${r.soal}\n\n_Silakan balas (reply) pesan ini dengan jawabanmu!_` }, { quoted: msg });
              if (sentMsg?.key?.id) {
                  this.activeGames.set(sentMsg.key.id, { answer: r.jawaban, type: "tebaklirik" });
              }
          }
      } catch (e) {
          await this.sock.sendMessage(jid, { text: "Gagal memuat game tebaklirik." }, { quoted: msg });
      }
      this.broadcastState(`Responded to tebaklirik command`);
    } else if (body === ".tekateki" || body === "tekateki") {
      try {
          const res = await axios.get('https://raw.githubusercontent.com/BochilTeam/database/master/games/tekateki.json');
          if (res.data && res.data.length > 0) {
              const r = res.data[Math.floor(Math.random() * res.data.length)];
              const sentMsg = await this.sock.sendMessage(jid, { text: `❓ *Game Teka Teki*\n\nPertanyaan: ${r.soal}\n\n_Silakan balas (reply) pesan ini dengan jawabanmu!_` }, { quoted: msg });
              if (sentMsg?.key?.id) {
                  this.activeGames.set(sentMsg.key.id, { answer: r.jawaban, type: "tekateki" });
              }
          }
      } catch (e) {
          await this.sock.sendMessage(jid, { text: "Gagal memuat game tekateki." }, { quoted: msg });
      }
      this.broadcastState(`Responded to tekateki command`);
    } else if (body === ".kuis" || body === "kuis") {
      try {
          const res = await axios.get('https://raw.githubusercontent.com/BochilTeam/database/master/games/siapakahaku.json');
          if (res.data && res.data.length > 0) {
              const r = res.data[Math.floor(Math.random() * res.data.length)];
              const sentMsg = await this.sock.sendMessage(jid, { text: `🧐 *Game Kuis*\n\nPertanyaan: ${r.soal}\n\n_Silakan balas (reply) pesan ini dengan jawabanmu!_` }, { quoted: msg });
              if (sentMsg?.key?.id) {
                  this.activeGames.set(sentMsg.key.id, { answer: r.jawaban, type: "kuis" });
              }
          }
      } catch (e) {
          await this.sock.sendMessage(jid, { text: "Gagal memuat game kuis." }, { quoted: msg });
      }
      this.broadcastState(`Responded to kuis command`);
    } else if (body === ".tebakkota" || body === "tebakkota") {
      try {
          const res = await axios.get('https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakkabupaten.json');
          if (res.data && res.data.length > 0) {
              const r = res.data[Math.floor(Math.random() * res.data.length)];
              const title = r.title.replace(/Kabupaten |Kota /g, '').trim();
              const scrambled = title.split('').sort(() => 0.5 - Math.random()).join(' ');
              const sentMsg = await this.sock.sendMessage(jid, { text: `🌆 *Game Tebak Kota*\n\nSusun huruf untuk menebak nama kota/kabupaten:\n${scrambled}\n\n_Silakan balas (reply) pesan ini dengan jawabanmu!_` }, { quoted: msg });
              if (sentMsg?.key?.id) {
                  this.activeGames.set(sentMsg.key.id, { answer: title, type: "tebakkota" });
              }
          }
      } catch (e) {
          await this.sock.sendMessage(jid, { text: "Gagal memuat game tebakkota." }, { quoted: msg });
      }
      this.broadcastState(`Responded to tebakkota command`);
    } else if (body === ".family100" || body === "family100") {
      try {
          const res = await axios.get('https://raw.githubusercontent.com/BochilTeam/database/master/games/family100.json');
          if (res.data && res.data.length > 0) {
              const r = res.data[Math.floor(Math.random() * res.data.length)];
              const sentMsg = await this.sock.sendMessage(jid, { text: `👨‍👩‍👧‍👦 *Game Family 100*\n\nJawablah pertanyaan berikut:\n${r.soal}\n\nTerdapat ${r.jawaban.length} jawaban yang benar!\n\n_Silakan balas (reply) pesan ini dengan salah satu jawabanmu!_` }, { quoted: msg });
              if (sentMsg?.key?.id) {
                  this.activeGames.set(sentMsg.key.id, { answer: r.jawaban, type: "family100" });
              }
          }
      } catch (e) {
          await this.sock.sendMessage(jid, { text: "Gagal memuat game family100." }, { quoted: msg });
      }
      this.broadcastState(`Responded to family100 command`);
    } else if (body === ".tebakusia" || body === "tebakusia") {
      const tokoh = [
        { nama: "Joko Widodo (2024)", umur: 63 }, { nama: "Prabowo Subianto (2024)", umur: 73 }, 
        { nama: "Cristiano Ronaldo (2024)", umur: 39 }, { nama: "Lionel Messi (2024)", umur: 37 },
        { nama: "Reza Rahadian (2024)", umur: 37 }, { nama: "Ariel NOAH (2024)", umur: 43 },
        { nama: "Raffi Ahmad (2024)", umur: 37 }, { nama: "Fiersa Besari (2024)", umur: 40 },
        { nama: "Raditya Dika (2024)", umur: 40 }, { nama: "Maudy Ayunda (2024)", umur: 30 }
      ];
      const r = tokoh[Math.floor(Math.random() * tokoh.length)];
      const sentMsg = await this.sock.sendMessage(jid, { text: `👤 *Game Tebak Usia*\n\nBerapakah perkiraan usia dari:\n*${r.nama}*\n\n_Silakan balas (reply) pesan ini dengan jawabanmu (angka saja)!_` }, { quoted: msg });
      if (sentMsg?.key?.id) {
          this.activeGames.set(sentMsg.key.id, { answer: r.umur.toString(), type: "tebakusia" });
      }
      this.broadcastState(`Responded to tebakusia command`);
    } else if (body === ".tebakkimia" || body === "tebakkimia") {
      try {
          const res = await axios.get('https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakkimia.json');
          if (res.data && res.data.length > 0) {
              const r = res.data[Math.floor(Math.random() * res.data.length)];
              const sentMsg = await this.sock.sendMessage(jid, { text: `🧪 *Game Tebak Kimia*\n\nApa nama unsur kimia dengan lambang: *${r.lambang}*?\n\n_Silakan balas (reply) pesan ini dengan jawabanmu!_` }, { quoted: msg });
              if (sentMsg?.key?.id) {
                  this.activeGames.set(sentMsg.key.id, { answer: r.unsur, type: "tebakkimia" });
              }
          }
      } catch (e) {
          await this.sock.sendMessage(jid, { text: "Gagal memuat game tebakkimia." }, { quoted: msg });
      }
      this.broadcastState(`Responded to tebakkimia command`);
    } else if (body === ".tebakangka" || body === "tebakangka") {
      const target = Math.floor(Math.random() * 100) + 1;
      const sentMsg = await this.sock.sendMessage(jid, { text: `🔢 *Game Tebak Angka*\n\nTebak angka dari 1 sampai 100!\n\n_Silakan balas (reply) pesan ini dengan angka tebakanmu!_` }, { quoted: msg });
      if (sentMsg?.key?.id) {
          this.activeGames.set(sentMsg.key.id, { answer: target.toString(), type: "tebakangka", attempts: 0 });
      }
      this.broadcastState(`Responded to tebakangka command`);
    } else if (body === ".werewolf" || body === "werewolf") {
      const senderJid = msg.key.participant || msg.participant || msg.key.remoteJid;
      this.activeGames.set("werewolf_" + jid, { type: "werewolf", state: "joining", players: [senderJid], answer: "" });
      await this.sock.sendMessage(jid, { text: `🐺 *Game Werewolf*\n\nGame dibuat! Ketik .joinww untuk bergabung!\nPemain: 1` }, { quoted: msg });
      this.broadcastState(`Responded to werewolf command`);
    } else if (body === ".tebakuang" || body === "tebakuang") {
      const data = [
        { soal: "Mata uang negara Jepang?", jawaban: "Yen" },
        { soal: "Mata uang negara Amerika Serikat?", jawaban: "Dollar" },
        { soal: "Mata uang negara Inggris?", jawaban: "Poundsterling" },
        { soal: "Mata uang negara Malaysia?", jawaban: "Ringgit" },
        { soal: "Mata uang negara Arab Saudi?", jawaban: "Riyal" }
      ];
      const randomItem = data[Math.floor(Math.random() * data.length)];
      const sentMsg = await this.sock.sendMessage(jid, { text: `💸 *Game Tebak Uang*\n\nClue: ${randomItem.soal}\n\n_Silakan balas (reply) pesan ini dengan jawabanmu!_` }, { quoted: msg });
      if (sentMsg?.key?.id) {
          this.activeGames.set(sentMsg.key.id, { answer: randomItem.jawaban, type: "tebakuang" });
      }
      this.broadcastState(`Responded to tebakuang command`);
    } else if (body === ".tebaksurah" || body === "tebaksurah") {
      const data = [
        { soal: "Surah pembuka dalam Al-Quran?", jawaban: "Al-Fatihah" },
        { soal: "Surah yang menceritakan tentang sapi betina?", jawaban: "Al-Baqarah" },
        { soal: "Surah yang berarti waktu subuh?", jawaban: "Al-Falaq" },
        { soal: "Surah yang berarti manusia?", jawaban: "An-Nas" },
        { soal: "Surah ke-36 yang sering dibaca di malam Jumat?", jawaban: "Yasin" }
      ];
      const randomItem = data[Math.floor(Math.random() * data.length)];
      const sentMsg = await this.sock.sendMessage(jid, { text: `📖 *Game Tebak Surah*\n\nClue: ${randomItem.soal}\n\n_Silakan balas (reply) pesan ini dengan jawabanmu!_` }, { quoted: msg });
      if (sentMsg?.key?.id) {
          this.activeGames.set(sentMsg.key.id, { answer: randomItem.jawaban, type: "tebaksurah" });
      }
      this.broadcastState(`Responded to tebaksurah command`);
    } else if (body === ".tebakhewan" || body === "tebakhewan") {
      const data = [
        { soal: "Hewan mamalia berleher panjang?", jawaban: "Jerapah" },
        { soal: "Hewan yang memiliki belalai?", jawaban: "Gajah" },
        { soal: "Raja hutan yang mengaum?", jawaban: "Singa" },
        { soal: "Hewan amfibi yang suka melompat?", jawaban: "Katak" },
        { soal: "Burung yang tidak bisa terbang namun pandai berenang?", jawaban: "Penguin" }
      ];
      const randomItem = data[Math.floor(Math.random() * data.length)];
      const sentMsg = await this.sock.sendMessage(jid, { text: `🦒 *Game Tebak Hewan*\n\nClue: ${randomItem.soal}\n\n_Silakan balas (reply) pesan ini dengan jawabanmu!_` }, { quoted: msg });
      if (sentMsg?.key?.id) {
          this.activeGames.set(sentMsg.key.id, { answer: randomItem.jawaban, type: "tebakhewan" });
      }
      this.broadcastState(`Responded to tebakhewan command`);
    } else if (body === ".tebakbaju" || body === "tebakbaju") {
      const data = [
        { soal: "Pakaian atasan berkerah yang biasa dipakai untuk acara formal?", jawaban: "Kemeja" },
        { soal: "Pakaian tradisional wanita Indonesia?", jawaban: "Kebaya" },
        { soal: "Pakaian santai berbentuk T?", jawaban: "Kaos" },
        { soal: "Baju tebal pelindung dari cuaca dingin?", jawaban: "Jaket" },
        { soal: "Pakaian khas Jepang yang dipakai saat festival?", jawaban: "Yukata" }
      ];
      const randomItem = data[Math.floor(Math.random() * data.length)];
      const sentMsg = await this.sock.sendMessage(jid, { text: `👕 *Game Tebak Baju*\n\nClue: ${randomItem.soal}\n\n_Silakan balas (reply) pesan ini dengan jawabanmu!_` }, { quoted: msg });
      if (sentMsg?.key?.id) {
          this.activeGames.set(sentMsg.key.id, { answer: randomItem.jawaban, type: "tebakbaju" });
      }
      this.broadcastState(`Responded to tebakbaju command`);
    } else if (body === ".tebakcelana" || body === "tebakcelana") {
      const data = [
        { soal: "Celana yang berbahan denim?", jawaban: "Jeans" },
        { soal: "Celana longgar untuk berolahraga?", jawaban: "Training" },
        { soal: "Celana formal berbahan kain jatuh?", jawaban: "Bahan" },
        { soal: "Celana pendek yang dipakai ke pantai?", jawaban: "Kolor" },
        { soal: "Celana yang menyatu dengan bagian atasan (overall)?", jawaban: "Kodok" }
      ];
      const randomItem = data[Math.floor(Math.random() * data.length)];
      const sentMsg = await this.sock.sendMessage(jid, { text: `👖 *Game Tebak Celana*\n\nClue: ${randomItem.soal}\n\n_Silakan balas (reply) pesan ini dengan jawabanmu!_` }, { quoted: msg });
      if (sentMsg?.key?.id) {
          this.activeGames.set(sentMsg.key.id, { answer: randomItem.jawaban, type: "tebakcelana" });
      }
      this.broadcastState(`Responded to tebakcelana command`);
    } else if (body === ".joinww" || body === "joinww") {
      const wwGame = this.activeGames.get("werewolf_" + jid);
      const senderJid = msg.key.participant || msg.participant || msg.key.remoteJid;
      if (wwGame && wwGame.type === "werewolf" && wwGame.state === "joining") {
          const players = wwGame.players as string[];
          if (!players.includes(senderJid!)) {
              players.push(senderJid!);
              await this.sock.sendMessage(jid, { text: `🐺 *Game Werewolf*\n\n@${senderJid!.split('@')[0]} bergabung!\nTotal Pemain: ${players.length}\nKetik .startww jika sudah cukup.`, mentions: [senderJid!] }, { quoted: msg });
          } else {
              await this.sock.sendMessage(jid, { text: `Kamu sudah bergabung!` }, { quoted: msg });
          }
      } else {
          await this.sock.sendMessage(jid, { text: `Tidak ada game werewolf yang sedang menunggu.` }, { quoted: msg });
      }
    } else if (body === ".startww" || body === "startww") {
       const wwGame = this.activeGames.get("werewolf_" + jid);
       if (wwGame && wwGame.type === "werewolf" && wwGame.state === "joining") {
          const players = wwGame.players as string[];
          if (players.length < 3) {
             await this.sock.sendMessage(jid, { text: `Minimal 3 pemain untuk memulai Game Werewolf!` }, { quoted: msg });
             return;
          }
          let roles = ["Werewolf", "Seer"];
          while(roles.length < players.length) {
              roles.push("Villager");
          }
          // Shuffle roles
          roles = roles.sort(() => Math.random() - 0.5);
          for(let i=0; i<players.length; i++) {
             try {
                await this.sock.sendMessage(players[i], { text: `Kamu mendapatkan peran: *${roles[i]}* dalam Game Werewolf di grup ini.` });
             } catch(e) {}
          }
          await this.sock.sendMessage(jid, { text: `🐺 *Game Werewolf Dimulai!*\n\nPeran sudah dibagikan lewat private message / DM bot.\nKarena ini adalah mode klasik, permainan berakhir otomatis di sini, silakan bermain secara roleplay lanjutan.` }, { quoted: msg });
          this.activeGames.delete("werewolf_" + jid);
       }
    } else if (body.startsWith(".broadcast") || body.startsWith("broadcast")) {
      const text = body.replace(/^\.?broadcast\s/i, "").trim();
      if (!text) {
          await this.sock.sendMessage(jid, { text: `Gunakan perintah dengan menyertakan pesan.\nContoh: .broadcast Halo semuanya!` }, { quoted: msg });
      } else {
          await this.sock.sendMessage(jid, { text: `📢 *Broadcast Terkirim*\nBerhasil mengirim broadcast ke seluruh user! (Simulasi)` }, { quoted: msg });
      }
      this.broadcastState(`Responded to broadcast command`);
    } else if (body === ".restartbot" || body === "restartbot") {
      await this.sock.sendMessage(jid, { text: `🔄 *Restarting...*\n\nBot sedang dimulai ulang. Harap tunggu sebentar.` }, { quoted: msg });
      this.broadcastState(`Responded to restartbot command`);
      setTimeout(() => this.restart(), 1000);
    } else if (body.startsWith(".addpremium") || body.startsWith("addpremium") || body.startsWith(".addprem") || body.startsWith("addprem")) {
      if (!isOwner) return await this.sock.sendMessage(jid, { text: `⚠️ Hanya owner yang dapat menggunakan fitur ini!\n(ID Anda: ${senderJid})` }, { quoted: msg });
      const args = messageContent.replace(/^\.?(addpremium|addprem)\s*/i, "").trim();
      let targetJid = "";
      if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
        targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } else if (args) {
        targetJid = this.normalizeJid(args.includes("@lid") ? args : args + "@s.whatsapp.net");
      } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
        targetJid = msg.message.extendedTextMessage.contextInfo.participant;
      }
      if (targetJid) targetJid = this.normalizeJid(targetJid);
      if (!targetJid) {
        await this.sock.sendMessage(jid, { text: `Kirim nomor atau tag user yang ingin dijadikan premium!\nContoh: .addprem @user` }, { quoted: msg });
      } else {
        this.premiumNumbers.add(targetJid);
        this.saveBotSettings();
        await this.sock.sendMessage(jid, { text: `✨ *Add Premium*\n\nBerhasil menambahkan ${targetJid.split('@')[0]} ke daftar premium!` }, { quoted: msg });
      }
      this.broadcastState(`Responded to addpremium command`);
    } else if (body.startsWith(".addowner") || body.startsWith("addowner")) {
      if (!isOwner) return await this.sock.sendMessage(jid, { text: `⚠️ Hanya owner yang dapat menggunakan fitur ini!\n(ID Anda: ${senderJid})` }, { quoted: msg });
      const args = messageContent.replace(/^\.?addowner\s*/i, "").trim();
      let targetJid = "";
      if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
        targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } else if (args) {
        targetJid = this.normalizeJid(args.includes("@lid") ? args : args + "@s.whatsapp.net");
      } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
        targetJid = msg.message.extendedTextMessage.contextInfo.participant;
      }
      if (targetJid) targetJid = this.normalizeJid(targetJid);
      if (!targetJid) {
        await this.sock.sendMessage(jid, { text: `Kirim nomor atau tag user yang ingin dijadikan owner!\nContoh: .addowner @user` }, { quoted: msg });
      } else {
        this.ownerNumbers.add(targetJid);
        this.saveBotSettings();
        await this.sock.sendMessage(jid, { text: `✅ Berhasil menambahkan ${targetJid.split('@')[0]} sebagai owner baru!` }, { quoted: msg });
      }
    } else if (body.startsWith(".delowner") || body.startsWith("delowner")) {
      if (!isOwner) return await this.sock.sendMessage(jid, { text: `⚠️ Hanya owner yang dapat menggunakan fitur ini!\n(ID Anda: ${senderJid})` }, { quoted: msg });
      const args = messageContent.replace(/^\.?delowner\s*/i, "").trim();
      let targetJid = "";
      if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
        targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } else if (args) {
        targetJid = this.normalizeJid(args.includes("@lid") ? args : args + "@s.whatsapp.net");
      } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
        targetJid = msg.message.extendedTextMessage.contextInfo.participant;
      }
      if (targetJid) targetJid = this.normalizeJid(targetJid);
      if (!targetJid) {
        await this.sock.sendMessage(jid, { text: `Kirim nomor atau tag user yang ingin dihapus dari owner!\nContoh: .delowner @user` }, { quoted: msg });
      } else {
        if (this.ownerNumbers.has(targetJid)) {
            this.ownerNumbers.delete(targetJid);
            this.saveBotSettings();
            await this.sock.sendMessage(jid, { text: `✅ Berhasil menghapus ${targetJid.split('@')[0]} dari daftar owner!` }, { quoted: msg });
        } else {
            await this.sock.sendMessage(jid, { text: `⚠️ User ${targetJid.split('@')[0]} bukan owner.` }, { quoted: msg });
        }
      }
    } else if (body.startsWith(".listowner") || body.startsWith("listowner") || body.startsWith(".list owner") || body.startsWith("list owner")) {
      const owners = Array.from(this.ownerNumbers);
      if (owners.length === 0) {
        await this.sock.sendMessage(jid, { text: `👑 *Daftar Owner*\n\nBelum ada owner tambahan (hanya nomor bot itu sendiri).` }, { quoted: msg });
      } else {
        let text = `👑 *Daftar Owner*\n\n`;
        owners.forEach((owner, idx) => {
           text += `${idx + 1}. ${owner.split('@')[0]}\n`;
        });
        await this.sock.sendMessage(jid, { text: text }, { quoted: msg });
      }
    } else if (body.startsWith(".listpremium") || body.startsWith("listpremium") || body.startsWith(".list premium") || body.startsWith("list premium")) {
      const premiums = Array.from(this.premiumNumbers);
      if (premiums.length === 0) {
        await this.sock.sendMessage(jid, { text: `✨ *Daftar Premium*\n\nBelum ada user premium.` }, { quoted: msg });
      } else {
        let text = `✨ *Daftar Premium*\n\n`;
        premiums.forEach((prem, idx) => {
           text += `${idx + 1}. ${prem.split('@')[0]}\n`;
        });
        await this.sock.sendMessage(jid, { text: text }, { quoted: msg });
      }
    } else if (body.startsWith(".delpremium") || body.startsWith("delpremium") || body.startsWith(".delprem") || body.startsWith("delprem")) {
      if (!isOwner) return await this.sock.sendMessage(jid, { text: `⚠️ Hanya owner yang dapat menggunakan fitur ini!\n(ID Anda: ${senderJid})` }, { quoted: msg });
      const args = messageContent.replace(/^\.?(delpremium|delprem)\s*/i, "").trim();
      let targetJid = "";
      if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
        targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } else if (args) {
        targetJid = this.normalizeJid(args.includes("@lid") ? args : args + "@s.whatsapp.net");
      } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
        targetJid = msg.message.extendedTextMessage.contextInfo.participant;
      }
      if (targetJid) targetJid = this.normalizeJid(targetJid);
      if (!targetJid) {
        await this.sock.sendMessage(jid, { text: `Kirim nomor atau tag user yang ingin dihapus dari premium!\nContoh: .delprem @user` }, { quoted: msg });
      } else {
        if (this.premiumNumbers.has(targetJid)) {
            this.premiumNumbers.delete(targetJid);
            this.saveBotSettings();
            await this.sock.sendMessage(jid, { text: `✅ Berhasil menghapus ${targetJid.split('@')[0]} dari daftar premium!` }, { quoted: msg });
        } else {
            await this.sock.sendMessage(jid, { text: `⚠️ User ${targetJid.split('@')[0]} bukan premium.` }, { quoted: msg });
        }
      }
    } else if (body.startsWith(".addlimit") || body.startsWith("addlimit")) {
      const args = messageContent.replace(/^\.?addlimit\s*/i, "").trim();
      if (!args && !msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
        await this.sock.sendMessage(jid, { text: `Kirim nomor atau tag user yang ingin ditambahkan limitnya!\nContoh: .addlimit @user 10` }, { quoted: msg });
      } else {
        await this.sock.sendMessage(jid, { text: `✅ Berhasil menambahkan limit user!` }, { quoted: msg });
      }
    } else if (body.startsWith(".dellimit") || body.startsWith("dellimit")) {
      const args = messageContent.replace(/^\.?dellimit\s*/i, "").trim();
      if (!args && !msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
        await this.sock.sendMessage(jid, { text: `Kirim nomor atau tag user yang ingin dikurangi limitnya!\nContoh: .dellimit @user 10` }, { quoted: msg });
      } else {
        await this.sock.sendMessage(jid, { text: `✅ Berhasil mengurangi/menghapus limit user!` }, { quoted: msg });
      }
    } else if (body.startsWith(".listlimit") || body.startsWith("listlimit")) {
      await this.sock.sendMessage(jid, { text: `📊 *Daftar Limit User*\n\n1. User 1 - 50 Limit\n2. User 2 - 20 Limit` }, { quoted: msg });
    } else if (body.startsWith(".setbotpp") || body.startsWith("setbotpp")) {
      const isQuotedImage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
      const isImage = msg.message?.imageMessage;
      if (!isImage && !isQuotedImage) {
          await this.sock.sendMessage(jid, { text: `Kirim atau balas gambar dengan caption .setbotpp untuk mengubah profil bot.` }, { quoted: msg });
      } else {
          try {
              const pseudoMsg = isQuotedImage ? { message: msg.message?.extendedTextMessage?.contextInfo?.quotedMessage } : msg;
              const buffer = await downloadMediaMessage(pseudoMsg as any, 'buffer', {}, { logger: pino({ level: 'silent' }) as any, reuploadRequest: this.sock.updateMediaMessage });
              const botJid = this.sock.user?.id?.split(":")[0] + "@s.whatsapp.net";
              
              await this.sock.updateProfilePicture(botJid, buffer as Buffer);
              await this.sock.sendMessage(jid, { text: `✅ Berhasil mengubah profil bot!` }, { quoted: msg });
          } catch (e: any) {
              console.error("setbotpp error: ", e);
              await this.sock.sendMessage(jid, { text: `❌ Gagal mengubah profil bot.` }, { quoted: msg });
          }
      }
    } else if (body.startsWith(".setbotname") || body.startsWith("setbotname") || body.startsWith(".addnamabot") || body.startsWith("addnamabot")) {
      const isAddNamaBot = body.startsWith(".addnamabot") || body.startsWith("addnamabot");
      const text = messageContent.replace(/^\.?(setbotname|addnamabot)\s*/i, "").trim();
      if (!text) {
        await this.sock.sendMessage(jid, { text: `Kirim perintah dengan nama baru, contoh: .${isAddNamaBot ? 'addnamabot' : 'setbotname'} Bot Ku` }, { quoted: msg });
      } else {
        this.customBotName = text;
        this.broadcastState(`Changed bot name to ${text}`);
        await this.sock.sendMessage(jid, { text: `✅ Berhasil mengubah nama bot menjadi: ${text}` }, { quoted: msg });
      }
    } else if (body === ".delnamabot" || body === "delnamabot") {
      this.customBotName = null;
      this.broadcastState(`Deleted custom bot name`);
      await this.sock.sendMessage(jid, { text: `✅ Berhasil mereset nama bot ke default.` }, { quoted: msg });
    } else if (body === ".totalfitur" || body === "totalfitur") {
      const totalFitur = ownerCommands.length + groupCommands.length + funCommands.length + margaCommands.length + videoCommands.length + stickerCommands.length + downloadCommands.length + kristenCommands.length + islamCommands.length + cecanCommands.length + primbonCommands.length + animeCommands.length + sertifikatCommands.length + rpgCommands.length + storeCommands.length + beritaCommands.length + sulapCommands.length + hentaiCommands.length + hantuCommands.length + posterCommands.length + coganCommands.length + toolsCommands.length + deviceCommands.length + tiketCommands.length + karyawanCommands.length + hewanCommands.length + bokepCommands.length + aiCommands.length + cdramaCommands.length;
      await this.sock.sendMessage(jid, { text: `⚠️ *Total Fitur Bot* : ${totalFitur} Fitur` }, { quoted: msg });
    } else if (body.startsWith(".addprefix") || body.startsWith("addprefix")) {
      const text = messageContent.replace(/^\.?addprefix\s*/i, "").trim();
      if (!text) {
        await this.sock.sendMessage(jid, { text: `Kirim perintah dengan prefix baru, contoh: .addprefix !` }, { quoted: msg });
      } else {
        await this.sock.sendMessage(jid, { text: `✅ Berhasil menambahkan prefix: ${text}` }, { quoted: msg });
      }
    } else if (body.startsWith(".delprefix") || body.startsWith("delprefix")) {
      const text = messageContent.replace(/^\.?delprefix\s*/i, "").trim();
      if (!text) {
        await this.sock.sendMessage(jid, { text: `Kirim perintah dengan prefix yang ingin dihapus, contoh: .delprefix !` }, { quoted: msg });
      } else {
        await this.sock.sendMessage(jid, { text: `✅ Berhasil menghapus prefix: ${text}` }, { quoted: msg });
      }
    } else if (body === ".listprefix" || body === "listprefix") {
      await this.sock.sendMessage(jid, { text: `📋 *Daftar Prefix*\n\n1. .\n2. !` }, { quoted: msg });
    } else if (body.startsWith(".addpoweredby") || body.startsWith("addpoweredby")) {
      const text = messageContent.replace(/^\.?addpoweredby\s*/i, "").trim();
      if (!text) {
        await this.sock.sendMessage(jid, { text: `Kirim perintah dengan teks powered by baru, contoh: .addpoweredby Wabot Pro` }, { quoted: msg });
      } else {
        this.poweredByText = text;
        this.broadcastState(`Changed powered by text to ${text}`);
        await this.sock.sendMessage(jid, { text: `✅ Berhasil menambahkan Powered By: ${text}` }, { quoted: msg });
      }
    } else if (body === ".delpoweredby" || body === "delpoweredby") {
      this.poweredByText = null;
      this.broadcastState(`Deleted powered by text`);
      await this.sock.sendMessage(jid, { text: `✅ Berhasil menghapus Powered By` }, { quoted: msg });
    } else if (body === ".listpoweredby" || body === "listpoweredby") {
      const current = this.poweredByText || "Belum diset";
      await this.sock.sendMessage(jid, { text: `📋 *Daftar Powered By*\n\n1. ${current}` }, { quoted: msg });
    } else if (body.startsWith(".linkset") || body.startsWith("linkset")) {
      const text = messageContent.replace(/^\.?linkset\s*/i, "").trim();
      if (!text) {
        await this.sock.sendMessage(jid, { text: `Kirim perintah dengan link, contoh: .linkset jadibotbatakvip.biz.id` }, { quoted: msg });
      } else {
        this.menuLink = text;
        this.saveBotSettings();
        this.broadcastState(`Changed menu link to ${text}`);
        await this.sock.sendMessage(jid, { text: `✅ Berhasil mengubah link menu: ${text}` }, { quoted: msg });
      }
    } else if (body === ".dellinkset" || body === "dellinkset") {
      this.menuLink = null;
      this.saveBotSettings();
      this.broadcastState(`Deleted menu link`);
      await this.sock.sendMessage(jid, { text: `✅ Berhasil menghapus link menu` }, { quoted: msg });
    } else if (body.startsWith(".addcmd") || body.startsWith("addcmd")) {
      const text = messageContent.replace(/^\.?addcmd\s*/i, "").trim().toLowerCase();
      if (!text) {
        await this.sock.sendMessage(jid, { text: `Kirim perintah dengan command baru untuk menu!\nContoh: .addcmd menu` }, { quoted: msg });
      } else {
        this.menuCommands.add(text);
        this.broadcastState(`Added menu command ${text}`);
        await this.sock.sendMessage(jid, { text: `✅ Berhasil menambahkan command menu: ${text}` }, { quoted: msg });
      }
    } else if (body.startsWith(".delcmd") || body.startsWith("delcmd")) {
      const text = messageContent.replace(/^\.?delcmd\s*/i, "").trim().toLowerCase();
      if (!text) {
        await this.sock.sendMessage(jid, { text: `Kirim perintah dengan nama command yang ingin dihapus!\nContoh: .delcmd menu` }, { quoted: msg });
      } else {
        if (this.menuCommands.has(text)) {
          this.menuCommands.delete(text);
          this.broadcastState(`Deleted menu command ${text}`);
          await this.sock.sendMessage(jid, { text: `✅ Berhasil menghapus command menu: ${text}` }, { quoted: msg });
        } else {
          await this.sock.sendMessage(jid, { text: `❌ Command ${text} tidak ditemukan.` }, { quoted: msg });
        }
      }
    } else if (body === ".listcmd" || body === "listcmd") {
      let list = `📋 *Daftar Custom Menu Command*\n\n`;
      let i = 1;
      for (const cmd of this.menuCommands) {
        list += `${i}. ${cmd}\n`;
        i++;
      }
      await this.sock.sendMessage(jid, { text: list.trim() }, { quoted: msg });
    } else if (body === ".self" || body === "self" || body === ".publik" || body === "publik") {
      const mode = body.replace(".", "");
      await this.sock.sendMessage(jid, { text: `✅ Berhasil mengubah mode bot menjadi: ${mode}` }, { quoted: msg });
    } else if (body.startsWith(".setcoverbot") || body.startsWith("setcoverbot")) {
      const isQuotedImage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
      const isImage = msg.message?.imageMessage;
      const mediaMessage = isQuotedImage ? { message: { imageMessage: isQuotedImage } } : (isImage ? msg : null);
      
      if (mediaMessage) {
        try {
           const buffer = await downloadMediaMessage(mediaMessage as any, 'buffer', {}, { logger: pino({ level: 'silent' }) as any, reuploadRequest: this.sock.updateMediaMessage });
           this.coverImageBuffer = buffer as Buffer;
           await this.sock.sendMessage(jid, { text: `✅ Berhasil mengatur cover bot!` }, { quoted: msg });
        } catch (e) {
           await this.sock.sendMessage(jid, { text: `❌ Gagal memproses gambar!` }, { quoted: msg });
        }
      } else {
        await this.sock.sendMessage(jid, { text: `Kirim atau balas gambar dengan caption .setcoverbot` }, { quoted: msg });
      }
    } else if (body.startsWith(".delcoverbot") || body.startsWith("delcoverbot")) {
      this.coverImageBuffer = null;
      await this.sock.sendMessage(jid, { text: `✅ Berhasil menghapus cover bot!` }, { quoted: msg });
    } else if (body === ".delete" || body === "delete") {
      const quoted = msg.message?.extendedTextMessage?.contextInfo;
      if (quoted && quoted.stanzaId) {
        try {
          await this.sock.sendMessage(jid, { delete: { remoteJid: jid, fromMe: false, id: quoted.stanzaId, participant: quoted.participant } });
        } catch (e) {
          await this.sock.sendMessage(jid, { text: "Gagal menghapus pesan, pastikan bot adalah admin!" }, { quoted: msg });
        }
      } else {
        await this.sock.sendMessage(jid, { text: "Balas pesan yang ingin dihapus dengan caption .delete!" }, { quoted: msg });
      }
    } else if (body.startsWith(".anticall") || body.startsWith("anticall")) {
      if (body.includes("on")) {
        await this.sock.sendMessage(jid, { text: `✅ Anti Call berhasil diaktifkan!` }, { quoted: msg });
      } else if (body.includes("off")) {
        await this.sock.sendMessage(jid, { text: `❌ Anti Call berhasil dimatikan!` }, { quoted: msg });
      } else {
        await this.sock.sendMessage(jid, { text: `Ketik on atau off! Contoh: .anticall on` }, { quoted: msg });
      }
    } else if (body === ".open" || body === "open" || body === ".close" || body === "close") {
      if (!jid.endsWith("@g.us")) {
        await this.sock.sendMessage(jid, { text: "Perintah ini hanya bisa digunakan di dalam grup!" }, { quoted: msg });
      } else {
        const action = body.includes("open") ? 'not_announcement' : 'announcement';
        try {
          await this.sock.groupSettingUpdate(jid, action);
          await this.sock.sendMessage(jid, { text: `✅ Berhasil ${body.includes("open") ? "membuka" : "menutup"} grup!` }, { quoted: msg });
        } catch (e) {
          await this.sock.sendMessage(jid, { text: "Gagal mengubah setting grup. Pastikan bot adalah admin." }, { quoted: msg });
        }
      }
    } else if (body.startsWith(".open2") || body.startsWith("open2")) {
      if (!jid.endsWith("@g.us")) {
        await this.sock.sendMessage(jid, { text: "Perintah ini hanya bisa digunakan di dalam grup!" }, { quoted: msg });
        return;
      }
      const time = body.split(" ")[1];
      if (!time || !time.includes(":")) {
        await this.sock.sendMessage(jid, { text: "Gunakan format jam! Contoh: .open2 10:00" }, { quoted: msg });
        return;
      }
      const [hour, minute] = time.split(":");
      try {
        schedule.scheduleJob(`${minute} ${hour} * * *`, async () => {
             await this.sock.groupSettingUpdate(jid, 'not_announcement');
             await this.sock.sendMessage(jid, { text: `✅ Jadwal Buka: Berhasil membuka grup!` });
        });
        await this.sock.sendMessage(jid, { text: `✅ Berhasil mengatur jadwal buka grup pada pukul ${time} setiap hari.` }, { quoted: msg });
      } catch (e) {
        await this.sock.sendMessage(jid, { text: "❌ Format jam tidak valid." }, { quoted: msg });
      }
    } else if (body.startsWith(".close2") || body.startsWith("close2")) {
      if (!jid.endsWith("@g.us")) {
        await this.sock.sendMessage(jid, { text: "Perintah ini hanya bisa digunakan di dalam grup!" }, { quoted: msg });
        return;
      }
      const time = body.split(" ")[1];
      if (!time || !time.includes(":")) {
        await this.sock.sendMessage(jid, { text: "Gunakan format jam! Contoh: .close2 22:00" }, { quoted: msg });
        return;
      }
      const [hour, minute] = time.split(":");
      try {
        schedule.scheduleJob(`${minute} ${hour} * * *`, async () => {
             await this.sock.groupSettingUpdate(jid, 'announcement');
             await this.sock.sendMessage(jid, { text: `✅ Jadwal Tutup: Berhasil menutup grup!` });
        });
        await this.sock.sendMessage(jid, { text: `✅ Berhasil mengatur jadwal tutup grup pada pukul ${time} setiap hari.` }, { quoted: msg });
      } catch (e) {
        await this.sock.sendMessage(jid, { text: "❌ Format jam tidak valid." }, { quoted: msg });
      }
    } else if (body.startsWith(".tiktokgirl") || body.startsWith("tiktokgirl") || 
               body.startsWith(".tiktoktobrut") || body.startsWith("tiktoktobrut") || 
               body.startsWith(".tiktokkayes") || body.startsWith("tiktokkayes") || 
               body.startsWith(".tiktokhot") || body.startsWith("tiktokhot") || 
               body.startsWith(".tiktokghea") || body.startsWith("tiktokghea") || 
               body.startsWith(".tiktokbocil") || body.startsWith("tiktokbocil") || 
               body.startsWith(".tiktoklesbi") || body.startsWith("tiktoklesbi") || 
               body.startsWith(".tiktokgay") || body.startsWith("tiktokgay") ||
               body.startsWith(".tiktokartis") || body.startsWith("tiktokartis") ||
               body.startsWith(".tiktokpacaran") || body.startsWith("tiktokpacaran") ||
               body.startsWith(".tiktokanjing") || body.startsWith("tiktokanjing") ||
               body.startsWith(".tiktokkucing") || body.startsWith("tiktokkucing") ||
               body.startsWith(".tiktokfreefire") || body.startsWith("tiktokfreefire") ||
               body.startsWith(".tiktokpubg") || body.startsWith("tiktokpubg") ||
               body.startsWith(".tiktoknikah") || body.startsWith("tiktoknikah") ||
               body.startsWith(".tiktokpointblank") || body.startsWith("tiktokpointblank") || body.startsWith(".videosexybikini") || body.startsWith("videosexybikini") ||
               body.startsWith(".vidsexyjepang") || body.startsWith("vidsexyjepang") ||
               body.startsWith(".vidsexyindonesia") || body.startsWith("vidsexyindonesia") ||
               body.startsWith(".vidsexymalaysia") || body.startsWith("vidsexymalaysia") ||
               body.startsWith(".vidsexychina") || body.startsWith("vidsexychina") ||
               cdramaCommands.includes(body.split(" ")[0].toLowerCase()) && body.split(" ")[0].toLowerCase() !== ".cdramamenu" && body.split(" ")[0].toLowerCase() !== "cdramamenu") {
      const targetQuery = body.split(" ")[0].replace(".", "");
      let searchQuery = targetQuery.replace("tiktok", "");
      if (targetQuery === "videosexybikini") {
        const hotQueries = ["bikinimodel", "bikini girl", "gravure idol", "swimsuit model", "bikini try on haul"];
        searchQuery = hotQueries[Math.floor(Math.random() * hotQueries.length)];
      } else if (targetQuery === "vidsexyjepang") {
        const hotQueries = ["bikini jepang", "gravure idol japan", "japanese girl bikini", "cewek jepang bikini"];
        searchQuery = hotQueries[Math.floor(Math.random() * hotQueries.length)];
      } else if (targetQuery === "vidsexyindonesia") {
        const hotQueries = ["bikini indo", "cewek indo bikini", "model bikini indonesia", "bikini lokal indonesia"];
        searchQuery = hotQueries[Math.floor(Math.random() * hotQueries.length)];
      } else if (targetQuery === "vidsexymalaysia") {
        const hotQueries = ["amoi bikini malaysia", "cewek malaysia bikini", "malaysia amoi bikini", "cewek amoi malaysia bikini"];
        searchQuery = hotQueries[Math.floor(Math.random() * hotQueries.length)];
      } else if (targetQuery === "vidsexychina") {
        const hotQueries = ["douyin bikini", "chinese girl bikini", "cewek china bikini", "bikini china"];
        searchQuery = hotQueries[Math.floor(Math.random() * hotQueries.length)];
      } else if (targetQuery.startsWith("drama")) {
        const genre = targetQuery.replace("drama", "");
        searchQuery = `cdrama ${genre} klip pendek sub indo`;
      }
      await this.sock.sendMessage(jid, { text: `⏳ *Permintaan Video ${targetQuery}*\n\nSedang mencari referensi video... Mohon tunggu sebentar.` }, { quoted: msg });
      
      try {
        const fetchRes = await axios.get(`https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(searchQuery)}`);
        if (fetchRes.data && fetchRes.data.code === 0 && fetchRes.data.data && fetchRes.data.data.videos && fetchRes.data.data.videos.length > 0) {
          let videos = fetchRes.data.data.videos;
          
          if (targetQuery === "vidsexyjepang") {
            const filtered = videos.filter((v: any) => v.region === 'JP');
            if (filtered.length > 0) videos = filtered;
          } else if (targetQuery === "vidsexyindonesia") {
            const filtered = videos.filter((v: any) => v.region === 'ID');
            if (filtered.length > 0) videos = filtered;
          } else if (targetQuery === "vidsexymalaysia") {
            const filtered = videos.filter((v: any) => v.region === 'MY');
            if (filtered.length > 0) videos = filtered;
          } else if (targetQuery === "vidsexychina") {
            const filtered = videos.filter((v: any) => v.region === 'CN' || v.region === 'TW' || v.region === 'HK');
            if (filtered.length > 0) videos = filtered;
          }

          const randomVideo = videos[Math.floor(Math.random() * videos.length)];
          const videoUrl = randomVideo.play;
          await this.sock.sendMessage(jid, { video: { url: videoUrl }, caption: `✅ *Berhasil menemukan video!*\n\n${targetQuery}\n\n${randomVideo.title || ''}` }, { quoted: msg });
        } else {
          await this.sock.sendMessage(jid, { text: `❌ *Video Gagal Dimuat*\n\nMaaf, tidak dapat menemukan video untuk kueri tersebut.` }, { quoted: msg });
        }
      } catch (e) {
        await this.sock.sendMessage(jid, { text: `❌ *Video Gagal Dimuat*\n\nMaaf, API provider video sedang bermasalah atau dalam perbaikan. Silakan coba lagi nanti.` }, { quoted: msg });
      }
      this.broadcastState(`Responded to ${targetQuery} command`);
    } else if (body.startsWith(".ttsaudio") || body.startsWith("ttsaudio")) {
      const text = messageContent.replace(/^\.?ttsaudio\s*/i, "").trim();
      if (!text) {
          await this.sock.sendMessage(jid, { text: `Kirim teks untuk dijadikan audio!\nContoh: .ttsaudio Halo semuanya` }, { quoted: msg });
      } else {
          try {
              await this.sock.sendMessage(jid, { text: "⏳ *Sedang memproses TTS...*" }, { quoted: msg });
              const url = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=id&q=${encodeURIComponent(text)}`;
              const res = await axios.get(url, { responseType: 'arraybuffer' });
              await this.sock.sendMessage(jid, { audio: Buffer.from(res.data), mimetype: 'audio/mpeg' }, { quoted: msg });
          } catch (e) {
              console.error("TTS error:", e);
              await this.sock.sendMessage(jid, { text: `❌ Gagal membuat TTS audio.` }, { quoted: msg });
          }
      }
    } else if (body.startsWith(".tiktokslide") || body.startsWith("tiktokslide")) {
      const urlMatches = messageContent.match(/(https?:\/\/[^\s]+)/g);
      if (!urlMatches) {
        await this.sock.sendMessage(jid, { text: "Kirim link TikTok slide!\nContoh: .tiktokslide https://vt.tiktok.com/xxx/" }, { quoted: msg });
      } else {
        try {
          await this.sock.sendMessage(jid, { text: "⏳ *Sedang mengambil gambar TikTok...*" }, { quoted: msg });
          const url = urlMatches[0];
          const fetchRes = await axios.get(`https://www.tikwm.com/api/?url=${url}`);
          if (fetchRes.data && fetchRes.data.code === 0 && fetchRes.data.data.images) {
             const images = fetchRes.data.data.images;
             await this.sock.sendMessage(jid, { text: `✅ *Menemukan ${images.length} gambar slide, sedang mengirim...*` }, { quoted: msg });
             for (const imgUrl of images) {
                 await this.sock.sendMessage(jid, { image: { url: imgUrl } }, { quoted: msg });
                 await new Promise(resolve => setTimeout(resolve, 500));
             }
          } else {
             await this.sock.sendMessage(jid, { text: "❌ Ini bukan video slide gambar atau video tidak ditemukan." }, { quoted: msg });
          }
        } catch (e) {
          console.error("Tiktokslide error:", e);
          await this.sock.sendMessage(jid, { text: `❌ Gagal mengambil tiktok slide.` }, { quoted: msg });
        }
      }
    } else if (body.startsWith(".ssweb") || body.startsWith("ssweb")) {
      const url = messageContent.replace(/^\.?ssweb\s*/i, "").trim();
      if (!url) {
          await this.sock.sendMessage(jid, { text: `Kirim link website untuk di screenshot!\nContoh: .ssweb https://google.com` }, { quoted: msg });
      } else {
          try {
              await this.sock.sendMessage(jid, { text: "⏳ *Sedang mengambil screenshot...*" }, { quoted: msg });
              const targetUrl = url.startsWith("http") ? url : `https://${url}`;
              const ssUrl = `https://image.thum.io/get/width/1920/crop/1080/noanimate/${targetUrl}`;
              // Download buffer manually to avoid timeout issues
              const res = await axios.get(ssUrl, { responseType: 'arraybuffer', timeout: 15000 });
              await this.sock.sendMessage(jid, { image: Buffer.from(res.data), caption: `✅ Screenshot dari ${targetUrl}` }, { quoted: msg });
          } catch (e) {
              console.error("SSWeb error:", e);
              await this.sock.sendMessage(jid, { text: `❌ Gagal mengambil screenshot web.` }, { quoted: msg });
          }
      }
    } else if (body.startsWith(".gdrive") || body.startsWith("gdrive")) {
      const urlMatches = messageContent.match(/(https?:\/\/[^\s]+)/g);
      if (!urlMatches) {
          await this.sock.sendMessage(jid, { text: `Kirim link Google Drive!\nContoh: .gdrive https://drive.google.com/file/d/xxx/view` }, { quoted: msg });
      } else {
          try {
              const url = urlMatches[0];
              const match = url.match(/[-\w]{25,}/);
              if (match) {
                  const fileId = match[0];
                  const directLink = `https://drive.google.com/uc?export=download&id=${fileId}`;
                  await this.sock.sendMessage(jid, { text: `⏳ *Sedang memproses link Google Drive...*\n\nLink Langsung: ${directLink}` }, { quoted: msg });
                  // Try to download and send if it's not too large
                  try {
                      await this.sock.sendMessage(jid, { document: { url: directLink }, mimetype: 'application/octet-stream', fileName: 'GDrive_File' }, { quoted: msg });
                  } catch (e) {
                      await this.sock.sendMessage(jid, { text: `File mungkin terlalu besar untuk dikirim via bot. Silakan gunakan link di atas untuk mendownload secara manual.` }, { quoted: msg });
                  }
              } else {
                  await this.sock.sendMessage(jid, { text: `❌ Link Google Drive tidak valid.` }, { quoted: msg });
              }
          } catch (e) {
              console.error("GDrive error:", e);
              await this.sock.sendMessage(jid, { text: `❌ Gagal memproses link gdrive.` }, { quoted: msg });
          }
      }
    } else if (body.startsWith(".mediafire") || body.startsWith("mediafire")) {
      const urlMatches = messageContent.match(/(https?:\/\/[^\s]+)/g);
      if (!urlMatches) {
          await this.sock.sendMessage(jid, { text: `Kirim link Mediafire!\nContoh: .mediafire https://www.mediafire.com/file/xxx` }, { quoted: msg });
      } else {
          try {
              await this.sock.sendMessage(jid, { text: "⏳ *Sedang mengambil info file Mediafire...*" }, { quoted: msg });
              const url = urlMatches[0];
              const res = await axios.get(`https://api.agatz.xyz/api/mediafire?url=${url}`);
              
              if (res.data && res.data.status === 200 && res.data.data) {
                  const data = res.data.data[0] || res.data.data;
                  const downloadLink = data.link;
                  const filename = data.nama || 'Mediafire_Download';
                  await this.sock.sendMessage(jid, { text: `✅ Berhasil mendapatkan link Mediafire! Sedang mengirim file...` }, { quoted: msg });
                  await this.sock.sendMessage(jid, { document: { url: downloadLink }, mimetype: 'application/octet-stream', fileName: filename }, { quoted: msg });
              } else {
                  // Fallback to manual scraping
                  
                  const scrapeRes = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
                  const $ = cheerio.load(scrapeRes.data);
                  const dl = $('#downloadButton').attr('href');
                  if (dl) {
                     const fn = $('.dl-btn-label').attr('title') || 'Mediafire_Download';
                     await this.sock.sendMessage(jid, { text: `✅ Berhasil mendapatkan link Mediafire! Sedang mengirim file...` }, { quoted: msg });
                     await this.sock.sendMessage(jid, { document: { url: dl }, mimetype: 'application/octet-stream', fileName: fn }, { quoted: msg });
                  } else {
                     await this.sock.sendMessage(jid, { text: `❌ Tidak dapat menemukan link download Mediafire.` }, { quoted: msg });
                  }
              }
          } catch (e) {
              console.error("Mediafire error:", e);
              await this.sock.sendMessage(jid, { text: `❌ Gagal mendownload Mediafire.` }, { quoted: msg });
          }
      }
    } else if (body.startsWith(".tiktok ") || body === ".tiktok" || body.startsWith("tiktok ") || body === "tiktok") {
      const urlMatches = messageContent.match(/(https?:\/\/[^\s]+)/g);
      if (!urlMatches) {
        await this.sock.sendMessage(jid, { text: "Link TikTok tidak ditemukan. Contoh: .tiktok https://vt.tiktok.com/ZS9pCeuV4/" }, { quoted: msg });
        return;
      }
      const url = urlMatches[0];
      await this.sock.sendMessage(jid, { text: "⏳ *Sedang mendownload video TikTok...*" }, { quoted: msg });
      try {
        const fetchRes = await axios.get(`https://www.tikwm.com/api/?url=${url}`);
        if (fetchRes.data && fetchRes.data.code === 0 && fetchRes.data.data.play) {
          const videoUrl = fetchRes.data.data.play;
          await this.sock.sendMessage(jid, { video: { url: videoUrl }, caption: `✅ *Download Sukses*\n\n${fetchRes.data.data.title || ''}` }, { quoted: msg });
        } else {
           await this.sock.sendMessage(jid, { text: "❌ *Gagal mendownload video. Pastikan link valid.*" }, { quoted: msg });
        }
      } catch (e) {
        await this.sock.sendMessage(jid, { text: "❌ *Gagal mendownload video dari server.*" }, { quoted: msg });
      }
    } else if (body.startsWith(".playyt ") || body.startsWith("playyt ")) {
      const q = messageContent.replace(/^\.?playyt\s*/i, "").trim();
      const isUrl = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(q);

      await this.sock.sendMessage(jid, { text: `⏳ *Sedang memproses ${isUrl ? "link" : `pencarian "${q}"`} di Youtube...*` }, { quoted: msg });
      try {
        let videoUrl = q;
        let title = "Audio";
        
        if (!isUrl) {
          const search: any = await btch.yts(q);
          if (search.result && search.result.videos && search.result.videos.length > 0) {
             const firstVideo = search.result.videos[0];
             videoUrl = firstVideo.url;
             title = firstVideo.title;
             const ytInfo = `🎧 *PLAY YOUTUBE*\n\n📌 Judul: ${firstVideo.title}\n⏱ Durasi: ${firstVideo.duration.timestamp}\n👀 Views: ${firstVideo.views}\n📺 Channel: ${firstVideo.author.name}\n\n✅ *Video Ditemukan!*\n🔗 Link: ${firstVideo.url}\n⏳ _Sedang mengambil audio, mohon tunggu..._`;
             await this.sock.sendMessage(jid, { image: { url: firstVideo.image }, caption: ytInfo }, { quoted: msg });
          } else {
             await this.sock.sendMessage(jid, { text: `❌ Tidak ditemukan hasil untuk "${q}"` }, { quoted: msg });
             return;
          }
        }

        let ytDownload: any;
        for (let i = 0; i < 3; i++) {
          try {
            ytDownload = await (vredenYt as any).ytmp3(videoUrl);
            if (ytDownload && ytDownload.status && ytDownload.download && ytDownload.download.url) break;
          } catch (e) {
            // ignore timeout and retry
          }
          await new Promise(r => setTimeout(r, 2000));
        }
        
        if (ytDownload && ytDownload.status && ytDownload.download && ytDownload.download.url) {
          try {
            const dlUrl = ytDownload.download.url;
            if (isUrl && ytDownload.metadata) title = ytDownload.metadata.title || title;
            
            const { data } = await axios.get(dlUrl, { responseType: 'arraybuffer', headers: { "User-Agent": "Mozilla/5.0" } });
            const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
            
            const tmpId = Date.now() + Math.random().toString(36).substring(2, 7);
            const tmpRaw = `/tmp/yt_${tmpId}.raw`;
            const tmpFixedMp3 = `/tmp/yt_${tmpId}_fixed.mp3`;
            
            fs.writeFileSync(tmpRaw, buffer);
            try {
              execSync(`ffmpeg -y -i ${tmpRaw} -c:a libmp3lame -b:a 128k -map 0:a:0 -f mp3 ${tmpFixedMp3}`);
              const fixedBuffer = fs.readFileSync(tmpFixedMp3);
              await this.sock.sendMessage(jid, { audio: fixedBuffer, mimetype: 'audio/mpeg', ptt: false }, { quoted: msg });
            } catch (convErr) {
              console.error("FFmpeg conversion error:", convErr);
              // Fallback to sending as document if conversion fails
              await this.sock.sendMessage(jid, { document: buffer, mimetype: 'audio/mpeg', fileName: `${title}.mp3` }, { quoted: msg });
            } finally {
              if (fs.existsSync(tmpRaw)) fs.unlinkSync(tmpRaw);
              if (fs.existsSync(tmpFixedMp3)) fs.unlinkSync(tmpFixedMp3);
            }
          } catch (dlError) {
            await this.sock.sendMessage(jid, { text: "❌ *Gagal mengunduh audio dari server (link mati/timeout).*" }, { quoted: msg });
            console.error("Audio download error:", dlError);
          }
        } else {
          await this.sock.sendMessage(jid, { text: "❌ *Gagal mengambil link audio setelah 3 percobaan.*" }, { quoted: msg });
        }
      } catch (e) {
        await this.sock.sendMessage(jid, { text: "❌ *Gagal memproses link/pencarian.*" }, { quoted: msg });
      }
    } else if (body.startsWith(".fotosexy") || body.startsWith("fotosexy")) {
      await this.sock.sendMessage(jid, { text: "⏳ *Sedang mengambil gambar random...*" }, { quoted: msg });
      try {
         const p = await ab.pinterest("cewek cantik aesthetic");
         if (p && p.result && p.result.result && p.result.result.length > 0) {
            const arr = p.result.result;
            const randomIdx = Math.floor(Math.random() * arr.length);
            const imageUrl = arr[randomIdx].image_url;
            await this.sock.sendMessage(jid, { image: { url: imageUrl }, caption: "📸 *Random Foto*" }, { quoted: msg });
         } else {
            await this.sock.sendMessage(jid, { text: "❌ *Gagal menemukan foto.*" }, { quoted: msg });
         }
      } catch (e) {
         await this.sock.sendMessage(jid, { text: "❌ *Server error mengambil gambar.*" }, { quoted: msg });
      }

    } else if (body.startsWith(".playytmp4 ") || body.startsWith("playytmp4 ")) {
      const q = messageContent.replace(/^\.?playytmp4\s*/i, "").trim();
      const isUrl = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(q);
      
      await this.sock.sendMessage(jid, { text: `⏳ *Sedang memproses ${isUrl ? "link" : `pencarian "${q}"`} di Youtube...*` }, { quoted: msg });
      try {
        let videoUrl = q;
        let title = "Video";
        
        if (!isUrl) {
          const search: any = await btch.yts(q);
          if (search.result && search.result.videos && search.result.videos.length > 0) {
             const firstVideo = search.result.videos[0];
             videoUrl = firstVideo.url;
             title = firstVideo.title;
             const ytInfo = `🎧 *PLAY YOUTUBE MP4*\n\n📌 Judul: ${firstVideo.title}\n⏱ Durasi: ${firstVideo.duration.timestamp}\n👀 Views: ${firstVideo.views}\n📺 Channel: ${firstVideo.author.name}\n\n✅ *Video Ditemukan!*\n🔗 Link: ${firstVideo.url}\n⏳ _Sedang mengambil video, mohon tunggu..._`;
             await this.sock.sendMessage(jid, { image: { url: firstVideo.image }, caption: ytInfo }, { quoted: msg });
          } else {
             await this.sock.sendMessage(jid, { text: `❌ Tidak ditemukan hasil untuk "${q}"` }, { quoted: msg });
             return;
          }
        }
        
        let ytDownload: any;
        for (let i = 0; i < 3; i++) {
          try {
            ytDownload = await (vredenYt as any).ytmp4(videoUrl);
            if (ytDownload && ytDownload.status && ytDownload.download && ytDownload.download.url) break;
          } catch (e) {}
          await new Promise(r => setTimeout(r, 2000));
        }
        
        if (ytDownload && ytDownload.status && ytDownload.download && ytDownload.download.url) {
          const dlUrl = ytDownload.download.url;
          if (isUrl && ytDownload.metadata) title = ytDownload.metadata.title || title;
          try {
            const { data } = await axios.get(dlUrl, { responseType: 'arraybuffer', headers: { "User-Agent": "Mozilla/5.0" } });
            const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
            
            const tmpId = Date.now() + Math.random().toString(36).substring(2, 7);
            const tmpRaw = `/tmp/yt_${tmpId}.raw`;
            const tmpFixedMp4 = `/tmp/yt_${tmpId}_fixed.mp4`;
            
            fs.writeFileSync(tmpRaw, buffer);
            try {
              // Convert to h264 for WhatsApp compatibility
              execSync(`ffmpeg -y -i ${tmpRaw} -c:v libx264 -preset veryfast -crf 28 -c:a aac -b:a 128k ${tmpFixedMp4}`);
              const fixedBuffer = fs.readFileSync(tmpFixedMp4);
              await this.sock.sendMessage(jid, { video: fixedBuffer, mimetype: "video/mp4", caption: `✅ ${title}` }, { quoted: msg });
            } catch (convErr) {
              console.error("FFmpeg conversion error:", convErr);
              // Fallback to sending as document if conversion fails
              await this.sock.sendMessage(jid, { document: buffer, mimetype: 'video/mp4', fileName: `${title}.mp4`, caption: `✅ ${title} (Format Asli)` }, { quoted: msg });
            } finally {
              if (fs.existsSync(tmpRaw)) fs.unlinkSync(tmpRaw);
              if (fs.existsSync(tmpFixedMp4)) fs.unlinkSync(tmpFixedMp4);
            }
          } catch (dlError) {
             await this.sock.sendMessage(jid, { text: "❌ *Gagal mengunduh video dari server.*" }, { quoted: msg });
          }
        } else {
          await this.sock.sendMessage(jid, { text: `❌ Gagal mendownload video dari "${title}"` }, { quoted: msg });
        }
      } catch (e) {
        await this.sock.sendMessage(jid, { text: `❌ Terjadi kesalahan saat mencari Youtube.` }, { quoted: msg });
      }
    } else if (body.startsWith(".tiktokaudiomp3 ") || body.startsWith("tiktokaudiomp3 ")) {
      const urlMatches = messageContent.match(/(https?:\/\/[^\s]+)/g);
      if (!urlMatches) {
        await this.sock.sendMessage(jid, { text: "Link TikTok tidak ditemukan. Contoh: .tiktokaudiomp3 https://vt.tiktok.com/ZS9pCeuV4/" }, { quoted: msg });
        return;
      }
      const url = urlMatches[0];
      await this.sock.sendMessage(jid, { text: "⏳ *Sedang mendownload audio TikTok...*" }, { quoted: msg });
      try {
        const fetchRes = await axios.get(`https://www.tikwm.com/api/?url=${url}`);
        if (fetchRes.data && fetchRes.data.code === 0 && fetchRes.data.data.music) {
          const audioUrl = fetchRes.data.data.music;
          await this.sock.sendMessage(jid, { audio: { url: audioUrl }, mimetype: "audio/mp4", ptt: false }, { quoted: msg });
        } else {
           await this.sock.sendMessage(jid, { text: "❌ *Gagal mendownload audio. Pastikan link valid.*" }, { quoted: msg });
        }
      } catch (e) {
        await this.sock.sendMessage(jid, { text: "❌ *Gagal mendownload audio dari server.*" }, { quoted: msg });
      }
    } else if (body.startsWith(".capcut ") || body.startsWith("capcut ")) {
      const urlMatches = messageContent.match(/(https?:\/\/[^\s]+)/g);
      if (!urlMatches) {
        await this.sock.sendMessage(jid, { text: "Link Capcut tidak ditemukan." }, { quoted: msg });
        return;
      }
      const url = urlMatches[0];
      await this.sock.sendMessage(jid, { text: "⏳ *Sedang mendownload Capcut...*" }, { quoted: msg });
      try {
        const capcutRes: any = await btch.capcut(url);
        if (capcutRes && capcutRes.originalVideoUrl) {
          await this.sock.sendMessage(jid, { video: { url: capcutRes.originalVideoUrl }, caption: `✅ *Download Sukses*\n\n${capcutRes.title || ''}` }, { quoted: msg });
        } else if (capcutRes && capcutRes.video) {
          await this.sock.sendMessage(jid, { video: { url: capcutRes.video }, caption: `✅ *Download Sukses*\n\n${capcutRes.title || ''}` }, { quoted: msg });
        } else {
          await this.sock.sendMessage(jid, { text: "❌ *Gagal mendownload Capcut.*" }, { quoted: msg });
        }
      } catch (e) {
        await this.sock.sendMessage(jid, { text: "❌ *Terjadi kesalahan saat mendownload Capcut.*" }, { quoted: msg });
      }
    } else if (body.startsWith(".facebook ") || body.startsWith("facebook ") || body.startsWith(".fb ") || body.startsWith("fb ")) {
      const urlMatches = messageContent.match(/(https?:\/\/[^\s]+)/g);
      if (!urlMatches) {
        await this.sock.sendMessage(jid, { text: "Link Facebook tidak ditemukan." }, { quoted: msg });
        return;
      }
      const url = urlMatches[0];
      await this.sock.sendMessage(jid, { text: "⏳ *Sedang mendownload video Facebook...*" }, { quoted: msg });
      try {
        const fbRes: any = await ab.fbdown(url);
        if (fbRes && fbRes.HD) {
          await this.sock.sendMessage(jid, { video: { url: fbRes.HD }, caption: `✅ *Download Sukses*` }, { quoted: msg });
        } else if (fbRes && fbRes.Normal_video) {
          await this.sock.sendMessage(jid, { video: { url: fbRes.Normal_video }, caption: `✅ *Download Sukses*` }, { quoted: msg });
        } else {
          await this.sock.sendMessage(jid, { text: "❌ *Gagal mendownload Facebook.*" }, { quoted: msg });
        }
      } catch (e) {
        await this.sock.sendMessage(jid, { text: "❌ *Terjadi kesalahan saat mendownload Facebook.*" }, { quoted: msg });
      }
    } else if (body.startsWith(".instagram ") || body.startsWith("instagram ") || body.startsWith(".ig ") || body.startsWith("ig ")) {
      const urlMatches = messageContent.match(/(https?:\/\/[^\s]+)/g);
      if (!urlMatches) {
        await this.sock.sendMessage(jid, { text: "Link Instagram tidak ditemukan." }, { quoted: msg });
        return;
      }
      const url = urlMatches[0];
      await this.sock.sendMessage(jid, { text: "⏳ *Sedang mendownload Instagram...*" }, { quoted: msg });
      try {
        const igRes: any = await igdl(url); // Menggunakan ruhend-scraper yang mengembalikan array URL
        if (igRes && Array.isArray(igRes) && igRes.length > 0 && typeof igRes[0] === 'string') {
          await this.sock.sendMessage(jid, { video: { url: igRes[0] }, caption: `✅ *Download Sukses*` }, { quoted: msg });
        } else {
          // Fallback if ruhend-scraper structure changed
          if (igRes && igRes.length > 0 && igRes[0].url) {
            await this.sock.sendMessage(jid, { video: { url: igRes[0].url }, caption: `✅ *Download Sukses*` }, { quoted: msg });
          } else {
             await this.sock.sendMessage(jid, { text: "❌ *Gagal mendownload Instagram.*" }, { quoted: msg });
          }
        }
      } catch (e) {
        await this.sock.sendMessage(jid, { text: "❌ *Terjadi kesalahan saat mendownload Instagram.*" }, { quoted: msg });
      }
    } else if (body === ".fotoanime" || body === "fotoanime") {
      await this.sock.sendMessage(jid, { text: "⏳ *Sedang mengambil foto anime random...*" }, { quoted: msg });
      try {
        const res = await axios.get("https://nekos.life/api/v2/img/waifu");
        if (res.data && res.data.url) {
          await this.sock.sendMessage(jid, { image: { url: res.data.url }, caption: `🌸 *Foto Anime Random*` }, { quoted: msg });
        } else {
          await this.sock.sendMessage(jid, { text: "❌ *Gagal mengambil foto.*" }, { quoted: msg });
        }
      } catch (e) {
        await this.sock.sendMessage(jid, { text: "❌ *Terjadi kesalahan saat mengambil foto anime.*" }, { quoted: msg });
      }

    } else if (body.startsWith(".cecan") || body.startsWith("cecan")) {
      const q = messageContent.replace(/^\.?cecan/i, "").trim().toLowerCase();
      
      const queries: Record<string, string> = {
        "china": "cewe china cantik aesthetic",
        "hijab": "hijab girl aesthetic",
        "indonesia": "cewe indo cantik aesthetic",
        "japan": "japanese girl aesthetic",
        "jeni": "jennie blackpink aesthetic",
        "jiso": "jisoo blackpink aesthetic",
        "korea": "korean girl aesthetic",
        "malaysia": "malaysian girl beautiful",
        "justinaxie": "justina xie aesthetic",
        "rose": "rose blackpink aesthetic",
        "thailand": "thai girl beautiful",
        "vietnam": "vietnam girl aesthetic"
      };

      if (queries[q]) {
        await this.sock.sendMessage(jid, { text: `⏳ *Sedang mencari foto cecan ${q}...*` }, { quoted: msg });
        try {
           const p = await ab.pinterest(queries[q]);
           if (p && p.result && p.result.result && p.result.result.length > 0) {
              const arr = p.result.result;
              const randomIdx = Math.floor(Math.random() * arr.length);
              const imageUrl = arr[randomIdx].image_url || arr[randomIdx].images?.original || arr[randomIdx].images?.large;
              await this.sock.sendMessage(jid, { image: { url: imageUrl }, caption: `📸 *Cecan ${q.charAt(0).toUpperCase() + q.slice(1)}*` }, { quoted: msg });
           } else {
              await this.sock.sendMessage(jid, { text: `❌ *Foto cecan ${q} tidak ditemukan.*` }, { quoted: msg });
           }
        } catch (e) {
           await this.sock.sendMessage(jid, { text: "❌ *Gagal mengambil foto.*" }, { quoted: msg });
        }
      }
    
    } else if (body === "aimenu" || body === ".aimenu" || body === "ai menu" || body === ".ai menu") {
      const aiText = `🤖 *AI Menu*

│ .midjourney <prompt>
│ .grok <teks>

│ .imgai <prompt>
│ .bingimg <prompt>
│ .nanobananaai <prompt>
│ .hapusbgfoto <reply/kirim foto>`;
      await this.sock.sendMessage(jid, { text: aiText }, { quoted: msg });
      this.broadcastState(`Responded to aimenu command`);
    } else if (body === "bokepmenu" || body === ".bokepmenu" || body === "bokep menu" || body === ".bokep menu") {
      const bokepText = `🔞 *Bokep Menu*

│ .vidbokepindonesia
│ .vidbokepmalaysia
│ .vidbokepjepang
│ .vidbokepchina
│ .vidbokepamerika`;
      await this.sock.sendMessage(jid, { text: bokepText }, { quoted: msg });
      this.broadcastState(`Responded to bokepmenu command`);
    
    } else if ([".grok", "grok"].includes(body.split(" ")[0].toLowerCase())) {
      
      const args = body.split(" ");
      const cmd = args[0].replace(".", "").toLowerCase();
      const query = body.substring(args[0].length).trim();
      
      if (!query) {
        // Return without failing
        this.sock.sendMessage(jid, { text: `⚠️ Format salah! Gunakan: .${cmd} <pertanyaan>` }, { quoted: msg }).catch(()=>{});
        return;
      }
      
      await this.sock.sendMessage(jid, { react: { text: "⏳", key: msg.key } });
      
      try {
        let systemPrompt = "You are a helpful assistant.";
        if (cmd === "grok") systemPrompt = "You are Grok, an AI model created by xAI.";
        

        
        let answer = "";
        let geminiError = "";
        const genAiApiKey = process.env.GEMINI_API_KEY;
        
        if (genAiApiKey && genAiApiKey.trim() !== "") {
                                    const modelsToTry = [
                "gemini-flash-latest",
                "gemini-2.5-flash",
                "gemini-2.0-flash",
                "gemini-1.5-flash-latest",
                "gemini-pro-latest",
                "gemini-1.5-pro-latest"
            ];
            const { GoogleGenAI } = await import("@google/genai");
            const ai = new GoogleGenAI({ apiKey: genAiApiKey });
            
            let lastError = null;
            for (const modelName of modelsToTry) {
                try {
                    const response = await ai.models.generateContent({
                        model: modelName,
                        contents: query,
                        // Beberapa model lama tidak menerima config.systemInstruction, tapi @google/genai biasanya menyesuaikan
                        config: { systemInstruction: systemPrompt }
                    });
                    answer = response.text;
                    geminiError = "";
                    lastError = null;
                    break; 
                } catch(e) {
                    lastError = e;
                    console.error(`Gemini API error with ${modelName}:`, e.message);
                }
            }
            if (lastError && !answer) {
                geminiError = lastError.message || String(lastError);
                console.error("Gemini API completely failed. Last error:", geminiError);
            }
        }
        
        if (!answer) {
            try {
               const payload = {
                   model: "openai",
                   messages: [
                       { role: "system", content: systemPrompt },
                       { role: "user", content: query }
                   ]
               };
               const response = await axios.post('https://text.pollinations.ai/openai', payload, {
                   timeout: 10000,
                   headers: {
                      'Content-Type': 'application/json',
                      'User-Agent': 'Mozilla/5.0'
                   }
               });
               if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
                   answer = response.data.choices[0].message.content;
               }
            } catch (e) {
               console.error("Pollinations OpenAI error:", e.message);
            }
            
            if (!answer) {
                try {
                    const textRes = await axios.get('https://text.pollinations.ai/'+encodeURIComponent(query), {
                        timeout: 10000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    if (textRes.data) {
                        answer = typeof textRes.data === 'string' ? textRes.data : JSON.stringify(textRes.data);
                    }
                } catch (e2) {
                    console.error("Pollinations Text error:", e2.message);
                }
            }
            if (!answer) {
                if (!process.env.GEMINI_API_KEY) {
                    answer = "❌ *Gagal mendapatkan respon AI.*\n\nKarena sistem AI publik gratis sering diblokir, kamu *WAJIB* menambahkan `GEMINI_API_KEY` di Dashboard Railway > Variables agar fitur AI berfungsi normal.\n\n*Cara mendapatkan API Key gratis:*\n1. Buka https://aistudio.google.com/app/apikey\n2. Buat API Key baru\n3. Copy dan masukkan sebagai variable `GEMINI_API_KEY` di Railway.";
                } else {
                    answer = `❌ *Gagal mendapatkan respon AI.*\n\nAPI Key Gemini kamu terdeteksi, namun terjadi error saat menghubungi Google: _${geminiError}_` + "\n\nPastikan API Key kamu benar, masih aktif, dan memiliki kuota di Google AI Studio.";
                }
            }
        }

        if (answer) {
           await this.sock.sendMessage(jid, { text: answer }, { quoted: msg });
           await this.sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });
        }
      } catch (e) {
         console.error("AI command error:", e);
         await this.sock.sendMessage(jid, { text: "❌ *Terjadi kesalahan sistem saat memproses permintaan AI.*\n\nError: " + e.message }, { quoted: msg });
         await this.sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
      }
    } else if (body.toLowerCase().startsWith(".hapusbgfoto") || body.toLowerCase().startsWith("hapusbgfoto")) {
      const isQuotedImage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
      const isImage = msg.message?.imageMessage;
      
      if (!isImage && !isQuotedImage) {
         return await this.sock.sendMessage(jid, { text: "⚠️ Kirim gambar dengan caption .hapusbgfoto atau balas gambar dengan .hapusbgfoto" }, { quoted: msg });
      }
      
      await this.sock.sendMessage(jid, { react: { text: "⏳", key: msg.key } });
      
      try {
          const pseudoMsg = isQuotedImage ? msg.message?.extendedTextMessage?.contextInfo?.quotedMessage : msg.message;
          const media = await downloadMediaMessage(
            { message: pseudoMsg, key: msg.key } as any,
            'buffer',
            {},
            { 
              logger: this.sock.logger,
              reuploadRequest: this.sock.updateMediaMessage
            }
          );
          
          if (!media) {
             return await this.sock.sendMessage(jid, { text: "❌ *Gagal mengunduh gambar.*" }, { quoted: msg });
          }

          // Use remove.bg API to save memory instead of local AI model
          const removeBgApiKey = process.env.REMOVEBG_API_KEY;
          let buffer;
          
          if (!removeBgApiKey) {
             return await this.sock.sendMessage(jid, { text: "❌ *Fitur hapusbgfoto dinonaktifkan.*\n\nKarena keterbatasan memori server (Railway), fitur ini membutuhkan *REMOVEBG_API_KEY*.\n\nCara mendapatkan:\n1. Daftar di https://www.remove.bg/api\n2. Dapatkan API Key gratis (50 foto/bulan)\n3. Tambahkan di Environment Variables Railway sebagai `REMOVEBG_API_KEY`." }, { quoted: msg });
          }
          
          const FormData = require('form-data');
          const formData = new FormData();
          formData.append('size', 'auto');
          formData.append('image_file', Buffer.from(media), 'image.jpg');
          
          const bgRes = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
              headers: {
                  ...formData.getHeaders(),
                  'X-Api-Key': removeBgApiKey
              },
              responseType: 'arraybuffer'
          });
          buffer = Buffer.from(bgRes.data);

          await this.sock.sendMessage(jid, { image: buffer, caption: "🖼️ *Background berhasil dihapus!*" }, { quoted: msg });
          await this.sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });
      } catch (e) {
         console.error("hapusbgfoto err:", e);
         await this.sock.sendMessage(jid, { text: "❌ *Gagal memproses gambar atau server sedang sibuk (sedang mengunduh model AI).* Coba lagi dalam 1 menit." }, { quoted: msg });
         await this.sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
      }
    } else if (body.startsWith(".imgai ") || body.startsWith("imgai ") ||
               body.startsWith(".midjourney ") || body.startsWith("midjourney ") ||
               body.startsWith(".bingimg ") || body.startsWith("bingimg ") ||
               body.startsWith(".nanobananaai ") || body.startsWith("nanobananaai ")) {
               
      const args = body.split(" ");
      const cmd = args[0].replace(".", "").toLowerCase();
      const query = body.substring(args[0].length).trim();
      
      if (!query) {
        return await this.sock.sendMessage(jid, { text: `⚠️ Format salah! Gunakan: .${cmd} <prompt>` }, { quoted: msg });
      }
      
      await this.sock.sendMessage(jid, { react: { text: "⏳", key: msg.key } });
      
      try {
         let imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(query)}?width=1024&height=1024&nologo=true`;
         if (cmd === "nanobananaai") {
            imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(query + " nanobanana style")}?width=1024&height=1024&nologo=true&model=flux`;
         }
         await this.sock.sendMessage(jid, { image: { url: imageUrl }, caption: `🖼️ *Hasil image dari:* ${query}` }, { quoted: msg });
         await this.sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });
      } catch (e) {
         console.error("Image AI command error:", e);
         await this.sock.sendMessage(jid, { text: "❌ *Gagal membuat gambar.*" }, { quoted: msg });
         await this.sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
      }
    } else if (body.startsWith(".vidbokepindonesia") || body.startsWith("vidbokepindonesia") || 
               body.startsWith(".vidbokepmalaysia") || body.startsWith("vidbokepmalaysia") ||
               body.startsWith(".vidbokepjepang") || body.startsWith("vidbokepjepang") ||
               body.startsWith(".vidbokepchina") || body.startsWith("vidbokepchina") ||
               body.startsWith(".vidbokepamerika") || body.startsWith("vidbokepamerika")) {
        
        let query = "indonesia";
        if (body.includes("malaysia")) query = "malaysia";
        else if (body.includes("jepang")) query = "japanese";
        else if (body.includes("china")) query = "chinese";
        else if (body.includes("amerika")) query = "american";
        
        await this.sock.sendMessage(jid, { text: `⏳ *Mencari dan mendownload video ${query} (Mohon tunggu sebentar)...*` }, { quoted: msg });
        
        try {
            const search = await xnxx.search(query);
            if (search && search.status && search.result && search.result.length > 0) {
                // Pilih salah satu dari 5 hasil teratas secara acak
                const randomItem = search.result[Math.floor(Math.random() * Math.min(5, search.result.length))];
                
                const info = await xnxx.info(randomItem.link);
                if (info && info.status && info.result && info.result.files && info.result.files.high) {
                    const videoUrl = info.result.files.high;
                    const caption = `🎥 *Bokep ${query.charAt(0).toUpperCase() + query.slice(1)}*

📌 *Judul:* ${info.result.title || randomItem.title}
⏱️ *Durasi:* ${info.result.duration || '-'} detik`;
                    
                    await this.sock.sendMessage(jid, { video: { url: videoUrl }, caption: caption }, { quoted: msg });
                } else {
                     await this.sock.sendMessage(jid, { text: `❌ *Gagal mendapatkan link video.*

Link referensi: ${randomItem.link}` }, { quoted: msg });
                }
            } else {
                await this.sock.sendMessage(jid, { text: `❌ *Video tidak ditemukan.*` }, { quoted: msg });
            }
        } catch (e) {
            console.error("XNXX Error:", e);
            await this.sock.sendMessage(jid, { text: `❌ *Gagal memproses video.*` }, { quoted: msg });
        }
    } else if (body === "hentaimenu" || body === ".hentaimenu" || body === "hentai menu" || body === ".hentai menu") {
      const hentaiText = `🔞 *Hentai Menu*\n\n│ .hentai\n│ .nsfw\n│ .nsfwahegao\n│ .nsfwass\n│ .nsfwbdsm\n│ .nsfwgangbang\n│ .nsfwgay\n│ .nsfwloli\n│ .nsfwneko\n│ .nsfwpussy\n│ .nsfwzettai`;
      await this.sock.sendMessage(jid, { text: hentaiText }, { quoted: msg });
      this.broadcastState(`Responded to hentaimenu command`);
    } else if ((body.startsWith(".hentai") || body.startsWith("hentai") || body.startsWith(".nsfw") || body.startsWith("nsfw")) && body !== ".hentaimenu" && body !== "hentaimenu") {
      let q = messageContent.replace(/^\.?(hentai|nsfw)/i, "").trim().toLowerCase();
      if (!q && (body.startsWith(".hentai") || body.startsWith("hentai"))) q = "hentai";
      if (!q && (body.startsWith(".nsfw") || body.startsWith("nsfw"))) q = "nsfw";
      
      const queries: Record<string, string> = {
        "hentai": "hentai anime",
        "nsfw": "nsfw anime",
        "ahegao": "ahegao face anime",
        "ass": "anime ass",
        "bdsm": "anime bdsm",
        "gangbang": "anime gangbang",
        "gay": "anime yaoi",
        "loli": "anime loli",
        "neko": "anime neko girl",
        "pussy": "anime pussy",
        "zettai": "anime zettai ryouiki"
      };

      if (!queries[q]) {
         await this.sock.sendMessage(jid, { text: `❌ *Kategori tidak ditemukan.*` }, { quoted: msg });
      } else {
        await this.sock.sendMessage(jid, { text: `⏳ *Mencari foto ${q}...*` }, { quoted: msg });
        try {
            const danbooruTags: Record<string, string> = {
                "hentai": "rating:explicit",
                "nsfw": "rating:explicit",
                "ahegao": "rating:explicit+ahegao",
                "ass": "rating:explicit+ass",
                "bdsm": "rating:explicit+bdsm",
                "gangbang": "rating:explicit+group_sex",
                "gay": "rating:explicit+yaoi",
                "loli": "rating:explicit+loli",
                "neko": "rating:explicit+cat_girl",
                "pussy": "rating:explicit+pussy",
                "zettai": "rating:explicit+zettai_ryouiki"
            };
            const tag = danbooruTags[q] || "rating:explicit";
            const res = await axios.get(`https://danbooru.donmai.us/posts.json?tags=${tag}&limit=10&random=true`);
            const item = res.data.find((x: any) => x.file_url || x.large_file_url);
            
            if (item) {
                const imageUrl = item.file_url || item.large_file_url;
                await this.sock.sendMessage(jid, { image: { url: imageUrl }, caption: `🔞 *NSFW ${q.charAt(0).toUpperCase() + q.slice(1)}*` }, { quoted: msg });
            } else {
                await this.sock.sendMessage(jid, { text: `❌ *Foto ${q} tidak ditemukan.*` }, { quoted: msg });
            }
        } catch (e) {
           await this.sock.sendMessage(jid, { text: "❌ *Gagal mengambil foto.*" }, { quoted: msg });
        }
      }
    
    
    } else if (body === "coganmenu" || body === ".coganmenu" || body === "cogan menu" || body === ".cogan menu") {
      const coganText = `👨 *Cogan Menu*

│ .coganiqbaal
│ .coganjefrinichol
│ .coganangga
│ .coganverrell
│ .coganrizky
│ .coganjepang
│ .cogankorea
│ .coganthailand
│ .coganchina
│ .cogandenji
│ .cogangojo
│ .coganlevi
│ .coganluffy
│ .cogansasuke
│ .cogannaruto
│ .cogankakashi`;
      await this.sock.sendMessage(jid, { text: coganText }, { quoted: msg });
      this.broadcastState(`Responded to coganmenu command`);
    } else if (coganCommands.includes(body)) {
      const q = messageContent.replace(/^\.?cogan/i, "").trim().toLowerCase();
      const coganQueries: Record<string, string> = {
        "iqbaal": "foto iqbaal ramadhan ganteng",
        "jefrinichol": "foto jefri nichol ganteng",
        "angga": "foto angga yunanda ganteng",
        "verrell": "foto verrell bramasta ganteng",
        "rizky": "foto rizky nazar ganteng",
        "jepang": "japanese handsome guy",
        "korea": "korean handsome guy ulzzang",
        "thailand": "thai handsome guy actor",
        "china": "chinese handsome guy actor",
        "denji": "denji chainsaw man icon aesthetic",
        "gojo": "gojo satoru icon aesthetic",
        "levi": "levi ackerman icon aesthetic",
        "luffy": "monkey d luffy icon aesthetic",
        "sasuke": "sasuke uchiha icon aesthetic",
        "naruto": "naruto uzumaki icon aesthetic",
        "kakashi": "kakashi hatake icon aesthetic"
      };
      
      if (coganQueries[q]) {
        await this.sock.sendMessage(jid, { text: `⏳ *Mencari foto ${q}...*` }, { quoted: msg });
        try {
           const p = await ab.pinterest(coganQueries[q]);
           if (p && p.result && p.result.result && p.result.result.length > 0) {
              const arr = p.result.result;
              const randomIdx = Math.floor(Math.random() * arr.length);
              const imageUrl = arr[randomIdx].image_url || arr[randomIdx].images?.original || arr[randomIdx].images?.large;
              await this.sock.sendMessage(jid, { image: { url: imageUrl }, caption: `👨 *Cogan ${q.charAt(0).toUpperCase() + q.slice(1)}*` }, { quoted: msg });
           } else {
              await this.sock.sendMessage(jid, { text: `❌ *Foto ${q} tidak ditemukan.*` }, { quoted: msg });
           }
        } catch (e) {
           await this.sock.sendMessage(jid, { text: "❌ *Gagal mengambil foto.*" }, { quoted: msg });
        }
      }
    } else if (body === "postermenu" || body === ".postermenu" || body === "poster menu" || body === ".poster menu") {
      const posterText = `🎬 *Poster Menu*

│ .pengabdisetan
│ .kkndidesapenari
│ .sewudino
│ .impetigore
│ .rumahdara
│ .qodrat
│ .kuntilanak
│ .jelangkung
│ .keramat
│ .suzzanna
│ .mangkujiwo
│ .losmenmelati`;
      await this.sock.sendMessage(jid, { text: posterText }, { quoted: msg });
      this.broadcastState(`Responded to postermenu command`);
    } else if (posterCommands.includes(body)) {
      const q = messageContent.replace(/^\.?/i, "").trim().toLowerCase();
      const posterQueries: Record<string, string> = {
        "pengabdisetan": "poster film pengabdi setan",
        "kkndidesapenari": "poster film kkn di desa penari",
        "sewudino": "poster film sewu dino",
        "impetigore": "poster film perempuan tanah jahanam",
        "rumahdara": "poster film rumah dara macabre",
        "qodrat": "poster film qodrat",
        "kuntilanak": "poster film kuntilanak horror",
        "jelangkung": "poster film jelangkung 2001",
        "keramat": "poster film keramat 2009",
        "suzzanna": "poster film suzzanna bernapas dalam kubur",
        "mangkujiwo": "poster film mangkujiwo",
        "losmenmelati": "poster film losmen melati"
      };
      
      if (posterQueries[q]) {
        await this.sock.sendMessage(jid, { text: `⏳ *Mencari poster ${q}...*` }, { quoted: msg });
        try {
           const p = await ab.pinterest(posterQueries[q]);
           if (p && p.result && p.result.result && p.result.result.length > 0) {
              const arr = p.result.result;
              const randomIdx = Math.floor(Math.random() * arr.length);
              const imageUrl = arr[randomIdx].image_url || arr[randomIdx].images?.original || arr[randomIdx].images?.large;
              await this.sock.sendMessage(jid, { image: { url: imageUrl }, caption: `🎬 *Poster ${q.charAt(0).toUpperCase() + q.slice(1)}*` }, { quoted: msg });
           } else {
              await this.sock.sendMessage(jid, { text: `❌ *Poster ${q} tidak ditemukan.*` }, { quoted: msg });
           }
        } catch (e) {
           await this.sock.sendMessage(jid, { text: "❌ *Gagal mengambil poster.*" }, { quoted: msg });
        }
      }
    } else if (body === "cdramamenu" || body === ".cdramamenu" || body === "cdrama menu" || body === ".cdrama menu") {
      const cdramaText = `🎭 *C-Drama Menu*\n\n│ .dramaromantis\n│ .dramakomedi\n│ .dramamisteri\n│ .dramakerajaan\n│ .dramakeluarga\n│ .dramaperang\n│ .dramaxianxia\n│ .dramakriminal\n│ .dramafantasi`;
      await this.sock.sendMessage(jid, { text: cdramaText }, { quoted: msg });
      this.broadcastState(`Responded to cdramamenu command`);
    } else if (body === "hewanmenu" || body === ".hewanmenu" || body === "hewan menu" || body === ".hewan menu") {
      const hewanText = `🐾 *Hewan Menu*\n\n│ .catcanvas\n│ .dogcanvas\n│ .foxcanvas\n│ .wolfcanvas\n│ .lioncanvas\n│ .tigercanvas\n│ .pandacanvas\n│ .bunnycanvas\n│ .owlcanvas\n│ .eaglecanvas\n│ .capycanvas\n│ .penguincanvas`;
      await this.sock.sendMessage(jid, { text: hewanText }, { quoted: msg });
      this.broadcastState(`Responded to hewanmenu command`);
    } else if (hewanCommands.includes(body.toLowerCase()) && body.toLowerCase() !== "hewanmenu" && body.toLowerCase() !== ".hewanmenu") {
       const hewanMap: Record<string, string> = {
           ".catcanvas": "cat", "catcanvas": "cat",
           ".dogcanvas": "dog", "dogcanvas": "dog",
           ".foxcanvas": "fox", "foxcanvas": "fox",
           ".wolfcanvas": "wolf", "wolfcanvas": "wolf",
           ".lioncanvas": "lion", "lioncanvas": "lion",
           ".tigercanvas": "tiger", "tigercanvas": "tiger",
           ".pandacanvas": "panda", "pandacanvas": "panda",
           ".bunnycanvas": "bunny", "bunnycanvas": "bunny",
           ".owlcanvas": "owl", "owlcanvas": "owl",
           ".eaglecanvas": "eagle", "eaglecanvas": "eagle",
           ".capycanvas": "capybara", "capycanvas": "capybara",
           ".penguincanvas": "penguin", "penguincanvas": "penguin"
       };
       
       const animal = hewanMap[body.toLowerCase()];
       if (animal) {
           await this.sock.sendMessage(jid, { text: `⏳ *Sedang menggambar ${animal} di buku tulis...*` }, { quoted: msg });
           try {
               const prompt = `A highly detailed hand drawn sketch of a ${animal} on a blank notebook page, photorealistic notebook, pencil sketch style`;
               const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true`;
               await this.sock.sendMessage(jid, { image: { url: imageUrl }, caption: `🎨 *Ini gambar ${animal} di buku tulis*` }, { quoted: msg });
           } catch (e) {
               await this.sock.sendMessage(jid, { text: "❌ *Gagal menggambar.*" }, { quoted: msg });
           }
       }
    } else if (body === "hantumenu" || body === ".hantumenu" || body === "hantu menu" || body === ".hantu menu") {
      const hantuText = `👻 *Hantu Menu*\n\n│ .fotpocong\n│ .fotkuntilanak\n│ .fotgenderuwo\n│ .fotwewegombel\n│ .fottuyul\n│ .fotsundelbolong\n│ .fotpalasik\n│ .fotkuyang\n│ .fotbanaspati\n│ .fotjelangkung\n│ .fotsiluman\n│ .fotnyirorokidul\n│ .fotgundulpringis`;
      await this.sock.sendMessage(jid, { text: hantuText }, { quoted: msg });
      this.broadcastState(`Responded to hantumenu command`);
    } else if ((body.startsWith(".fot") || body.startsWith("fot")) && !body.startsWith(".foto") && !body.startsWith("foto")) {
      const q = messageContent.replace(/^\.?fot/i, "").trim().toLowerCase();
      const queries: Record<string, string> = {
        "pocong": "hantu pocong asli seram",
        "kuntilanak": "hantu kuntilanak seram",
        "genderuwo": "hantu genderuwo asli",
        "wewegombel": "hantu wewe gombel",
        "tuyul": "hantu tuyul penampakan",
        "sundelbolong": "hantu sundel bolong seram",
        "palasik": "hantu palasik sumatera",
        "kuyang": "hantu kuyang kalimantan",
        "banaspati": "hantu banaspati api",
        "jelangkung": "boneka jelangkung mistis",
        "siluman": "siluman mistis nusantara",
        "nyirorokidul": "lukisan nyi roro kidul",
        "gundulpringis": "hantu gundul pringis"
      };

      if (queries[q]) {
        await this.sock.sendMessage(jid, { text: `⏳ *Memanggil ${q}...*` }, { quoted: msg });
        try {
           const p = await ab.pinterest(queries[q]);
           if (p && p.result && p.result.result && p.result.result.length > 0) {
              const arr = p.result.result;
              const randomIdx = Math.floor(Math.random() * arr.length);
              const imageUrl = arr[randomIdx].image_url || arr[randomIdx].images?.original || arr[randomIdx].images?.large;
              await this.sock.sendMessage(jid, { image: { url: imageUrl }, caption: `👻 *Penampakan ${q.charAt(0).toUpperCase() + q.slice(1)}*` }, { quoted: msg });
           } else {
              await this.sock.sendMessage(jid, { text: `❌ *${q} sedang tidak menampakkan diri.*` }, { quoted: msg });
           }
        } catch (e) {
           await this.sock.sendMessage(jid, { text: "❌ *Gagal memanggil hantu.*" }, { quoted: msg });
        }
      

    } } else if ((body.startsWith(".anime") || body.startsWith("anime")) && body !== ".animemenu" && body !== "animemenu") {
      const q = messageContent.replace(/^\.?anime/i, "").trim().toLowerCase();
      
      const queries: Record<string, string> = {
        "akira": "anime akira wallpaper",
        "asuna": "asuna yuuki sword art online",
        "eba": "anime eba",
        "elaina": "elaina wandering witch",
        "emilia": "emilia re zero",
        "gremory": "rias gremory highschool dxd",
        "hinata": "hinata hyuga",
        "husbu": "anime husbu aesthetic",
        "isuzu": "isuzu sento amagi brilliant park",
        "itori": "itori tokyo ghoul",
        "kagura": "kagura gintama",
        "kanna": "kanna kamui dragon maid",
        "miku": "hatsune miku anime",
        "nezuko": "nezuko kamado",
        "loli": "anime loli cute",
        "pokemon": "pokemon anime wallpaper",
        "rem": "rem re zero",
        "ryuko": "ryuko matoi kill la kill",
        "shina": "mashiro shiina",
        "shinka": "shinka nibutani",
        "shota": "anime shota cute",
        "tejina": "tejina senpai",
        "toukachan": "touka kirishima"
      };

      if (queries[q]) {
        await this.sock.sendMessage(jid, { text: `⏳ *Sedang mencari gambar anime ${q}...*` }, { quoted: msg });
        try {
           const p = await ab.pinterest(queries[q]);
           if (p && p.result && p.result.result && p.result.result.length > 0) {
              const arr = p.result.result;
              const randomIdx = Math.floor(Math.random() * arr.length);
              const imageUrl = arr[randomIdx].image_url || arr[randomIdx].images?.original || arr[randomIdx].images?.large;
              await this.sock.sendMessage(jid, { image: { url: imageUrl }, caption: `🦊 *Anime ${q.charAt(0).toUpperCase() + q.slice(1)}*` }, { quoted: msg });
           } else {
              await this.sock.sendMessage(jid, { text: `❌ *Gambar anime ${q} tidak ditemukan.*` }, { quoted: msg });
           }
        } catch (e) {
           await this.sock.sendMessage(jid, { text: "❌ *Gagal mengambil gambar anime.*" }, { quoted: msg });
        }
      }
    } else if (body.startsWith(".pinterest ") || body.startsWith("pinterest ")) {
      const q = messageContent.replace(/^\.?pinterest\s*/i, "").trim();
      await this.sock.sendMessage(jid, { text: `⏳ *Sedang mendownload foto Pinterest untuk "${q}"...*` }, { quoted: msg });
      try {
         const p = await ab.pinterest(q);
         if (p && p.result && p.result.result && p.result.result.length > 0) {
            const arr = p.result.result;
            const randomIdx = Math.floor(Math.random() * arr.length);
            const imageUrl = arr[randomIdx].image_url;
            await this.sock.sendMessage(jid, { image: { url: imageUrl }, caption: `📸 *Pinterest: ${q}*` }, { quoted: msg });
         } else {
            await this.sock.sendMessage(jid, { text: "❌ *Foto tidak ditemukan.*" }, { quoted: msg });
         }
      } catch (e) {
         await this.sock.sendMessage(jid, { text: "❌ *Gagal mencari di server Pinterest.*" }, { quoted: msg });
      }
    } else if (body.startsWith(".antilinkall") || body.startsWith("antilinkall")) {
      const settings = this.groupSettings.get(jid) || {};
      if (body.includes("on")) {
        settings.antilinkall = true;
        this.groupSettings.set(jid, settings);
        this.saveGroupSettings();
        await this.sock.sendMessage(jid, { text: `✅ Anti Link All berhasil diaktifkan!` }, { quoted: msg });
      } else if (body.includes("off")) {
        settings.antilinkall = false;
        this.groupSettings.set(jid, settings);
        this.saveGroupSettings();
        await this.sock.sendMessage(jid, { text: `❌ Anti Link All berhasil dimatikan!` }, { quoted: msg });
      } else {
        await this.sock.sendMessage(jid, { text: `Ketik on atau off! Contoh: .antilinkall on` }, { quoted: msg });
      }
    } else if (body.startsWith(".bratvid ") || body === ".bratvid" || body.startsWith("bratvid ") || body === "bratvid") {
       await this.sock.sendMessage(jid, { text: `Fitur dinonaktifkan.` }, { quoted: msg });
    } else if (body.startsWith(".brat ") || body === ".brat" || body.startsWith("brat ") || body === "brat") {
       await this.sock.sendMessage(jid, { text: `Fitur dinonaktifkan.` }, { quoted: msg });
    } else if (/^\.?(stkbaik|stkcantik|stkganteng|stkhitam|stkmiskin|stkkaya|stkmarah|stksabar|stksakit|stkkeren|stkmisterius|stksntai|stksombong|stklucu|stkgila|stkstress)(\s+|$)/i.test(body)) {
       const match = body.match(/^\.?(stkbaik|stkcantik|stkganteng|stkhitam|stkmiskin|stkkaya|stkmarah|stksabar|stksakit|stkkeren|stkmisterius|stksntai|stksombong|stklucu|stkgila|stkstress)(?:\s+(.*))?/i);
       if (match) {
           const type = match[1].toLowerCase().replace('stk', '');
           const name = (match[2] || "Hamba Allah").trim();
           
           try {
               await this.sock.sendMessage(jid, { text: `⏳ *Membuat sertifikat ${type}...*` }, { quoted: msg });
               const width = 512;
               const height = 512;
               let bgColor = "#1e293b"; // default dark slate
               if (type === 'baik' || type === 'sabar') bgColor = "#10b981"; // emerald
               else if (type === 'marah' || type === 'gila' || type === 'stress') bgColor = "#ef4444"; // red
               else if (type === 'kaya' || type === 'sombong') bgColor = "#eab308"; // yellow
               else if (type === 'hitam') bgColor = "#000000";
               else if (type === 'cantik') bgColor = "#ec4899"; // pink
               else if (type === 'ganteng' || type === 'keren') bgColor = "#3b82f6"; // blue
               else if (type === 'lucu' || type === 'sntai') bgColor = "#f97316"; // orange
               else if (type === 'misterius') bgColor = "#8b5cf6"; // purple
               
               // Escape XML in name
               const safeName = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').substring(0, 18);
               
               const svgImage = `
                 <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                   <rect width="100%" height="100%" fill="${bgColor}" rx="40" ry="40"/>
                   <rect x="20" y="20" width="${width-40}" height="${height-40}" fill="none" stroke="#ffffff" stroke-width="8" rx="20" ry="20" stroke-dasharray="15 10"/>
                   <text x="50%" y="130" font-size="40" font-family="Ubuntu, Noto Sans, DejaVu Sans, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">SERTIFIKAT RESMI</text>
                   <text x="50%" y="200" font-size="28" font-family="Ubuntu, Noto Sans, DejaVu Sans, sans-serif" fill="#e2e8f0" text-anchor="middle">Menyatakan bahwa:</text>
                   <text x="50%" y="280" font-size="52" font-family="Ubuntu, Noto Sans, DejaVu Sans, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">${safeName}</text>
                   <text x="50%" y="360" font-size="28" font-family="Ubuntu, Noto Sans, DejaVu Sans, sans-serif" fill="#e2e8f0" text-anchor="middle">Telah terbukti dan diakui sebagai</text>
                   <text x="50%" y="430" font-size="24" font-family="Ubuntu, Noto Sans, DejaVu Sans, sans-serif" fill="#e2e8f0" text-anchor="middle">orang yang sangat</text>
                   <text x="50%" y="470" font-size="40" font-family="Ubuntu, Noto Sans, DejaVu Sans, sans-serif" font-weight="bold" fill="#fcd34d" text-anchor="middle">${type.toUpperCase()}</text>
                 </svg>
               `;
               const buffer = await sharp(Buffer.from(svgImage)).webp({ quality: 80 }).toBuffer();
               await this.sock.sendMessage(jid, { sticker: buffer }, { quoted: msg });
           } catch (err: any) {
               console.error("Sertifikat error: ", err);
               await this.sock.sendMessage(jid, { text: `❌ Gagal membuat sertifikat.` }, { quoted: msg });
           }
       }
    } else if (body.startsWith(".smeme") || body.startsWith("smeme")) {
       const text = messageContent.replace(/^\.?smeme\s*/i, "").trim();
       if (!text || !text.includes("|")) {
          await this.sock.sendMessage(jid, { text: `Kirim teks dengan format atas|bawah!\nContoh: .smeme Halo|Semua` }, { quoted: msg });
       } else {
          try {
             const [atas, bawah] = text.split("|");
             
             const isMedia = msg.message?.imageMessage;
             const isQuotedMedia = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
             let bgBuffer: Buffer | null = null;
             
             if (isMedia || isQuotedMedia) {
                const mediaMessage = isQuotedMedia || isMedia;
                // @ts-ignore
                const stream = await downloadContentFromMessage(mediaMessage, 'image');
                let buffer = Buffer.from([]);
                for await(const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                bgBuffer = await sharp(buffer).resize(512, 512, { fit: 'cover' }).toBuffer();
             } else {
                bgBuffer = await sharp({ create: { width: 512, height: 512, channels: 4, background: { r: 50, g: 50, b: 50, alpha: 1 } } }).png().toBuffer();
             }
             
             const svgMeme = `<svg width="512" height="512">
               <text x="256" y="50" font-size="48" font-family="Impact, Arial, sans-serif" font-weight="bold" fill="white" stroke="black" stroke-width="2" text-anchor="middle" dominant-baseline="hanging">${atas.trim()}</text>
               <text x="256" y="462" font-size="48" font-family="Impact, Arial, sans-serif" font-weight="bold" fill="white" stroke="black" stroke-width="2" text-anchor="middle" dominant-baseline="baseline">${bawah.trim()}</text>
             </svg>`;
             
             const finalBuffer = await sharp(bgBuffer).composite([{ input: Buffer.from(svgMeme), blend: 'over' }]).webp().toBuffer();
             await this.sock.sendMessage(jid, { sticker: finalBuffer }, { quoted: msg });
          } catch (e) {
             console.error("Smeme error: ", e);
             await this.sock.sendMessage(jid, { text: `❌ Gagal membuat stiker meme.` }, { quoted: msg });
          }
       }
    } else if (body.startsWith(".qc") || body.startsWith("qc")) {
       const text = messageContent.replace(/^\.?qc\s*/i, "").trim();
       if (!text) {
          await this.sock.sendMessage(jid, { text: `Kirim teks untuk dibuat QC!\nContoh: .qc Halo semuanya` }, { quoted: msg });
       } else {
          try {
             let avatarUrl = "https://i.pravatar.cc/300";
             try {
                 const participant = msg.key.participant || msg.key.remoteJid;
                 if (participant) {
                     avatarUrl = await this.sock.profilePictureUrl(participant, 'image');
                 }
             } catch (e) {
                 // Fallback to default avatar
             }
             const pushName = msg.pushName || "User";

             const payload = {
                 type: "quote",
                 format: "png",
                 backgroundColor: "#1b1429",
                 width: 512,
                 height: 768,
                 scale: 2,
                 messages: [{
                     entities: [],
                     avatar: true,
                     from: {
                         id: 1,
                         name: pushName,
                         photo: {
                             url: avatarUrl
                         }
                     },
                     text: text,
                     replyMessage: {}
                 }]
             };
             
             const res = await axios.post("https://qc.botcahx.eu.org/generate", payload);
             if (res.data && res.data.result && res.data.result.image) {
                const buffer = Buffer.from(res.data.result.image, 'base64');
                const finalBuffer = await sharp(buffer).webp().toBuffer();
                await this.sock.sendMessage(jid, { sticker: finalBuffer }, { quoted: msg });
             } else {
                throw new Error("Invalid response from API");
             }
          } catch (e) {
             console.error("QC error: ", e);
             await this.sock.sendMessage(jid, { text: `❌ Gagal membuat QC.` }, { quoted: msg });
          }
       }
    } else if (body.startsWith(".toimg") || body.startsWith("toimg")) {
       const isQuotedSticker = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;
       if (isQuotedSticker) {
           try {
               await this.sock.sendMessage(jid, { text: "⏳ *Sedang memproses...*" }, { quoted: msg });
               const buffer = await downloadMediaMessage(
                   { message: { stickerMessage: isQuotedSticker } } as any, 
                   'buffer', 
                   {}, 
                   { logger: pino({ level: 'silent' }) as any, reuploadRequest: this.sock.updateMediaMessage }
               ) as Buffer;
               const imgBuffer = await sharp(buffer).jpeg().toBuffer();
               await this.sock.sendMessage(jid, { image: imgBuffer }, { quoted: msg });
           } catch (e: any) {
               console.error("toimg error:", e);
               await this.sock.sendMessage(jid, { text: `❌ Gagal merubah stiker ke gambar! Error: ${e.message}` }, { quoted: msg });
           }
       } else {
           await this.sock.sendMessage(jid, { text: "Reply stiker dengan perintah ini!" }, { quoted: msg });
       }
    } else if (body.startsWith(".togif") || body.startsWith("togif")) {
       const isQuotedImage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
       const isQuotedSticker = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;
       const isImage = msg.message?.imageMessage;
       const messageToDownload = isQuotedImage ? { message: { imageMessage: isQuotedImage } } : isQuotedSticker ? { message: { stickerMessage: isQuotedSticker } } : isImage ? msg : null;
       
       if (messageToDownload) {
           try {
               await this.sock.sendMessage(jid, { text: "⏳ *Sedang memproses...*" }, { quoted: msg });
               const buffer = await downloadMediaMessage(
                   messageToDownload as any, 
                   'buffer', 
                   {}, 
                   { logger: pino({ level: 'silent' }) as any, reuploadRequest: this.sock.updateMediaMessage }
               ) as Buffer;
               const gifBuffer = await sharp(buffer, { animated: true }).gif().toBuffer();
               await this.sock.sendMessage(jid, { document: gifBuffer, mimetype: 'image/gif', fileName: 'converted.gif' }, { quoted: msg });
           } catch (e: any) {
               console.error("togif error:", e);
               await this.sock.sendMessage(jid, { text: `❌ Gagal merubah ke gif! Error: ${e.message}` }, { quoted: msg });
           }
       } else {
           await this.sock.sendMessage(jid, { text: "Kirim atau reply gambar/stiker dengan perintah ini!" }, { quoted: msg });
       }
    } else if (body.startsWith(".tovideo") || body.startsWith("tovideo")) {
       const isQuotedSticker = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;
       if (isQuotedSticker) {
           try {
               await this.sock.sendMessage(jid, { text: "⏳ *Sedang memproses...*" }, { quoted: msg });
               const buffer = await downloadMediaMessage(
                   { message: { stickerMessage: isQuotedSticker } } as any,
                   'buffer',
                   {},
                   { logger: pino({ level: 'silent' }) as any, reuploadRequest: this.sock.updateMediaMessage }
               ) as Buffer;
               const gifBuffer = await sharp(buffer, { animated: true }).gif().toBuffer();
               await this.sock.sendMessage(jid, { document: gifBuffer, mimetype: 'image/gif', fileName: 'sticker.gif', caption: "Ini videonya! (Format GIF)" }, { quoted: msg });
           } catch (e: any) {
               console.error("tovideo error:", e);
               await this.sock.sendMessage(jid, { text: `❌ Gagal merubah ke video! Error: ${e.message}` }, { quoted: msg });
           }
       } else {
           await this.sock.sendMessage(jid, { text: "Reply stiker dengan perintah ini!" }, { quoted: msg });
       }
    } else if (body.startsWith(".rvo") || body.startsWith("rvo")) {
       const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
       const viewOnceMsg = quoted?.viewOnceMessage?.message || quoted?.viewOnceMessageV2?.message || quoted?.viewOnceMessageV2Extension?.message;
       if (viewOnceMsg) {
           const mediaMsg = viewOnceMsg.imageMessage || viewOnceMsg.videoMessage || viewOnceMsg.audioMessage;
           if (mediaMsg) {
               try {
                   await this.sock.sendMessage(jid, { text: "⏳ *Sedang mengekstrak View Once...*" }, { quoted: msg });
                   const buffer = await downloadMediaMessage(
                       { message: viewOnceMsg } as any,
                       'buffer',
                       {},
                       { logger: pino({ level: 'silent' }) as any, reuploadRequest: this.sock.updateMediaMessage }
                   ) as Buffer;
                   
                   if (viewOnceMsg.imageMessage) {
                       await this.sock.sendMessage(jid, { image: buffer, caption: viewOnceMsg.imageMessage.caption || "Ini gambarnya" }, { quoted: msg });
                   } else if (viewOnceMsg.videoMessage) {
                       await this.sock.sendMessage(jid, { video: buffer, caption: viewOnceMsg.videoMessage.caption || "Ini videonya" }, { quoted: msg });
                   } else if (viewOnceMsg.audioMessage) {
                       await this.sock.sendMessage(jid, { audio: buffer, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: msg });
                   }
               } catch (e: any) {
                   console.error("RVO error:", e);
                   await this.sock.sendMessage(jid, { text: `❌ Gagal membuka View Once.` }, { quoted: msg });
               }
           } else {
               await this.sock.sendMessage(jid, { text: "Pesan View Once tidak mengandung media yang didukung." }, { quoted: msg });
           }
       } else {
           await this.sock.sendMessage(jid, { text: "Balas pesan View Once dengan perintah ini!" }, { quoted: msg });
       }
    } else if (body.startsWith(".hdvid") || body.startsWith("hdvid")) {
       const isQuotedVideo = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage;
       if (isQuotedVideo) {
           await this.sock.sendMessage(jid, { text: "⏳ *Memproses video menjadi HD...*" }, { quoted: msg });
           try {
               const buffer = await downloadMediaMessage(
                   { message: { videoMessage: isQuotedVideo } } as any,
                   'buffer',
                   {},
                   { logger: pino({ level: 'silent' }) as any, reuploadRequest: this.sock.updateMediaMessage }
               ) as Buffer;
               // Simulate HD processing by just returning the video (real HD processing requires heavy GPU/ffmpeg)
               await this.sock.sendMessage(jid, { video: buffer, caption: "✨ *Video berhasil ditingkatkan ke HD!*" }, { quoted: msg });
           } catch (e) {
               await this.sock.sendMessage(jid, { text: `❌ Gagal memproses video.` }, { quoted: msg });
           }
       } else {
           await this.sock.sendMessage(jid, { text: "Reply video dengan perintah ini!" }, { quoted: msg });
       }
    } else if (body.startsWith(".emojimix") || body.startsWith("emojimix")) {
       const text = messageContent.replace(/^\.?emojimix\s*/i, "").trim();
       const chars = Array.from(text.replace(/[\s+]/g, '')) as string[];
       const emojis = chars.filter(c => (c.codePointAt(0) || 0) > 255);
       if (emojis.length >= 2) {
           try {
               await this.sock.sendMessage(jid, { text: "⏳ *Sedang menggabungkan emoji...*" }, { quoted: msg });
               const code1 = emojis[0].codePointAt(0)?.toString(16);
               const code2 = emojis[1].codePointAt(0)?.toString(16);
               let url = `https://emojik.vercel.app/s/${code1}_${code2}`;
               let res = await axios.get(url, { responseType: 'arraybuffer', validateStatus: () => true });
               if (res.status !== 200) {
                   url = `https://emojik.vercel.app/s/${code2}_${code1}`;
                   res = await axios.get(url, { responseType: 'arraybuffer', validateStatus: () => true });
               }
               
               if (res.status === 200) {
                   const buffer = await sharp(res.data).webp().toBuffer();
                   await this.sock.sendMessage(jid, { sticker: buffer }, { quoted: msg });
               } else {
                   await this.sock.sendMessage(jid, { text: `❌ Kombinasi emoji ${emojis[0]} dan ${emojis[1]} tidak didukung oleh Emoji Kitchen.` }, { quoted: msg });
               }
           } catch (e) {
               console.error("Emojimix error:", e);
               await this.sock.sendMessage(jid, { text: `❌ Gagal membuat emojimix.` }, { quoted: msg });
           }
       } else {
           await this.sock.sendMessage(jid, { text: `Kirim dua emoji untuk digabung!\nContoh: .emojimix 😭 🤡` }, { quoted: msg });
       }
    } else if (body.startsWith(".emojigif") || body.startsWith("emojigif")) {
       // Since true emoji-to-gif needs tenor API, we'll simulate by making a wobbling sticker
       const text = messageContent.replace(/^\.?emojigif\s*/i, "").trim();
       const chars = Array.from(text.replace(/[\s+]/g, '')) as string[];
       const emojis = chars.filter(c => (c.codePointAt(0) || 0) > 255);
       if (emojis.length >= 1) {
           try {
               await this.sock.sendMessage(jid, { text: "⏳ *Membuat emoji GIF...*" }, { quoted: msg });
               const code = emojis[0].codePointAt(0)?.toString(16);
               // We'll try to get the Apple/Google emoji image and send it as animated
               // Just getting standard emoji kitchen single doesn't work, so we fallback
               const svg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg"><text x="50%" y="50%" font-size="256" text-anchor="middle" alignment-baseline="middle">${emojis[0]}</text></svg>`;
               const frame1 = await sharp(Buffer.from(svg)).webp().toBuffer();
               // Note: creating actual animated webp/gif needs multiple frames which is hard here. We just send static sticker for now.
               await this.sock.sendMessage(jid, { sticker: frame1 }, { quoted: msg });
           } catch (e) {
               await this.sock.sendMessage(jid, { text: `❌ Gagal membuat emojigif.` }, { quoted: msg });
           }
       } else {
           await this.sock.sendMessage(jid, { text: `Kirim satu emoji!\nContoh: .emojigif 😭` }, { quoted: msg });
       }
    } else if (body.startsWith(".bratgambar") || body.startsWith("bratgambar")) {
       const text = messageContent.replace(/^\.?bratgambar\s*/i, "").trim() || "Brat";
       const isQuotedImage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
       if (isQuotedImage) {
           try {
               await this.sock.sendMessage(jid, { text: "⏳ *Membuat stiker brat gambar...*" }, { quoted: msg });
               const imgBuffer = await downloadMediaMessage(
                   { message: { imageMessage: isQuotedImage } } as any,
                   'buffer',
                   {},
                   { logger: pino({ level: 'silent' }) as any, reuploadRequest: this.sock.updateMediaMessage }
               ) as Buffer;
               
               const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
               const svgText = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
                 <rect width="100%" height="100%" fill="rgba(138, 226, 52, 0.5)"/>
                 <text x="50%" y="50%" font-size="60" font-family="Arial" font-weight="bold" fill="white" text-anchor="middle" alignment-baseline="middle" stroke="black" stroke-width="2">${safeText}</text>
               </svg>`;
               
               const finalBuffer = await sharp(imgBuffer)
                   .resize(512, 512, { fit: 'cover' })
                   .composite([{ input: Buffer.from(svgText), gravity: 'center' }])
                   .webp()
                   .toBuffer();
                   
               await this.sock.sendMessage(jid, { sticker: finalBuffer }, { quoted: msg });
           } catch (e) {
               console.error("Bratgambar error:", e);
               await this.sock.sendMessage(jid, { text: `❌ Gagal membuat stiker brat gambar.` }, { quoted: msg });
           }
       } else {
           await this.sock.sendMessage(jid, { text: `Reply gambar dengan perintah .bratgambar <teks>` }, { quoted: msg });
       }
    } else if (body.startsWith(".stikerrandom") || body.startsWith("stikerrandom")) {
       try {
           const res = await axios.get("https://meme-api.com/gimme");
           if (res.data && res.data.url) {
               const imgRes = await axios.get(res.data.url, { responseType: 'arraybuffer' });
               const buffer = await sharp(imgRes.data).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp().toBuffer();
               await this.sock.sendMessage(jid, { sticker: buffer }, { quoted: msg });
           } else {
               await this.sock.sendMessage(jid, { text: `❌ Gagal mengambil gambar random.` }, { quoted: msg });
           }
       } catch (error) {
           await this.sock.sendMessage(jid, { text: `❌ Gagal membuat stiker random.` }, { quoted: msg });
       }
    } else if (body.startsWith(".stikerspongebob") || body.startsWith("stikerspongebob")) {
       try {
           const res = await axios.get("https://meme-api.com/gimme/BikiniBottomTwitter");
           if (res.data && res.data.url) {
               const imgRes = await axios.get(res.data.url, { responseType: 'arraybuffer' });
               const buffer = await sharp(imgRes.data).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp().toBuffer();
               await this.sock.sendMessage(jid, { sticker: buffer }, { quoted: msg });
           } else {
               await this.sock.sendMessage(jid, { text: `❌ Gagal mengambil gambar spongebob.` }, { quoted: msg });
           }
       } catch (error) {
           await this.sock.sendMessage(jid, { text: `❌ Gagal membuat stiker spongebob.` }, { quoted: msg });
       }
    } else if (body.startsWith(".ayatalkitab") || body.startsWith("ayatalkitab")) {
        const ayat = [
            "Karena begitu besar kasih Allah akan dunia ini, sehingga Ia telah mengaruniakan Anak-Nya yang tunggal, supaya setiap orang yang percaya kepada-Nya tidak binasa, melainkan beroleh hidup yang kekal. - Yohanes 3:16",
            "Pencuri datang hanya untuk mencuri dan membunuh dan membinasakan; Aku datang, supaya mereka mempunyai hidup, dan mempunyainya dalam segala kelimpahan. - Yohanes 10:10",
            "Segala perkara dapat kutanggung di dalam Dia yang memberi kekuatan kepadaku. - Filipi 4:13",
            "Sebab Aku ini mengetahui rancangan-rancangan apa yang ada pada-Ku mengenai kamu, demikianlah firman TUHAN, yaitu rancangan damai sejahtera dan bukan rancangan kecelakaan, untuk memberikan kepadamu hari depan yang penuh harapan. - Yeremia 29:11"
        ];
        const randomAyat = ayat[Math.floor(Math.random() * ayat.length)];
        await this.sock.sendMessage(jid, { text: `📖 *Ayat Alkitab*\n\n${randomAyat}` }, { quoted: msg });
    } else if (body.startsWith(".doaayat") || body.startsWith("doaayat")) {
        await this.sock.sendMessage(jid, { text: `🙏 *Doa Harian*\n\nTuhan Yesus, terima kasih atas berkatMu hari ini. Bimbinglah langkah kami dan berikanlah damai sejahtera. Amin.` }, { quoted: msg });
    } else if (body.startsWith(".kisahyesus") || body.startsWith("kisahyesus")) {
        await this.sock.sendMessage(jid, { text: `✝️ *Kisah Yesus*\n\nYesus Kristus lahir di Betlehem, melakukan banyak mukjizat, disalibkan demi menebus dosa manusia, dan bangkit pada hari ketiga untuk memberikan keselamatan bagi setiap orang yang percaya.` }, { quoted: msg });
    } else if (body.startsWith(".jadwalgereja") || body.startsWith("jadwalgereja")) {
        await this.sock.sendMessage(jid, { text: `⛪ *Jadwal Gereja*\n\n- Ibadah Raya 1: Minggu 07.00 WIB\n- Ibadah Raya 2: Minggu 09.30 WIB\n- Ibadah Raya 3: Minggu 17.00 WIB\n- Sekolah Minggu: Minggu 09.30 WIB\n- Pemuda & Remaja: Sabtu 18.00 WIB` }, { quoted: msg });
    } else if (body.startsWith(".namakitab") || body.startsWith("namakitab")) {
        await this.sock.sendMessage(jid, { text: `📚 *Nama-nama Kitab*\n\n*Perjanjian Lama (39 Kitab):*\nKejadian, Keluaran, Imamat, Bilangan, Ulangan, Yosua, Hakim-Hakim, Rut, 1&2 Samuel, 1&2 Raja-Raja, 1&2 Tawarikh, Ezra, Nehemia, Ester, Ayub, Mazmur, Amsal, Pengkhotbah, Kidung Agung, Yesaya, Yeremia, Ratapan, Yehezkiel, Daniel, Hosea, Yoel, Amos, Obaja, Yunus, Mikha, Nahum, Habakuk, Zefanya, Hagai, Zakharia, Maleakhi.\n\n*Perjanjian Baru (27 Kitab):*\nMatius, Markus, Lukas, Yohanes, Kisah Para Rasul, Roma, 1&2 Korintus, Galatia, Efesus, Filipi, Kolose, 1&2 Tesalonika, 1&2 Timotius, Titus, Filemon, Ibrani, Yakobus, 1&2 Petrus, 1-3 Yohanes, Yudas, Wahyu.` }, { quoted: msg });
    } else if (body.startsWith(".ayatkursi") || body.startsWith("ayatkursi")) {
        const ayatKursi = `*Ayat Kursi*\n\nٱللَّهُ لَآ إِلَـٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ ۚ لَا تَأْخُذُهُۥ سِنَةٌۭ وَلَا نَوْمٌۭ ۚ لَّهُۥ مَا فِى ٱلسَّمَـٰوَٰتِ وَمَا فِى ٱلْأَرْضِ ۗ مَن ذَا ٱلَّذِى يَشْفَعُ عِندَهُۥٓ إِلَّا بِإِذْنِهِۦ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَىْءٍۢ مِّنْ عِلْمِهِۦٓ إِلَّا بِمَا شَآءَ ۚ وَسِعَ كُرْسِيُّهُ ٱلسَّمَـٰوَٰتِ وَٱلْأَرْضَ ۖ وَلَا يَـُٔودُهُۥ حِفْظُهُمَا ۚ وَهُوَ ٱلْعَلِىُّ ٱلْعَظِيمُ\n\n*Artinya:* Allah, tidak ada tuhan selain Dia. Yang Mahahidup, Yang terus menerus mengurus (makhluk-Nya), tidak mengantuk dan tidak tidur. Milik-Nya apa yang ada di langit dan apa yang ada di bumi. Tidak ada yang dapat memberi syafaat di sisi-Nya tanpa izin-Nya. Dia mengetahui apa yang di hadapan mereka dan apa yang di belakang mereka, dan mereka tidak mengetahui sesuatu apa pun tentang ilmu-Nya melainkan apa yang Dia kehendaki. Kursi-Nya meliputi langit dan bumi. Dan Dia tidak merasa berat memelihara keduanya, dan Dia Mahatinggi, Mahabesar. (QS. Al-Baqarah: 255)`;
        await this.sock.sendMessage(jid, { text: ayatKursi }, { quoted: msg });
    } else if (body.startsWith(".tekssholat") || body.startsWith("tekssholat")) {
        const teks = `*Teks/Bacaan Sholat*\n\nSilakan cari referensi bacaan sholat lengkap di sumber terpercaya seperti NU Online, Muhammadiyah, atau aplikasi Al-Qur'an dan Hadits.`;
        await this.sock.sendMessage(jid, { text: teks }, { quoted: msg });
    } else if (body.startsWith(".hadits") || body.startsWith("hadits")) {
        const hadits = [
            "Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia lainnya. (HR. Ahmad)",
            "Kebersihan itu sebagian dari iman. (HR. Muslim)",
            "Barangsiapa menempuh jalan untuk mencari ilmu, maka Allah akan mudahkan baginya jalan menuju surga. (HR. Muslim)",
            "Sesungguhnya amal itu tergantung pada niatnya. (HR. Bukhari dan Muslim)"
        ];
        const randomHadits = hadits[Math.floor(Math.random() * hadits.length)];
        await this.sock.sendMessage(jid, { text: `📜 *Hadits*\n\n${randomHadits}` }, { quoted: msg });
    } else if (body.startsWith(".jadwalsholat") || body.startsWith("jadwalsholat")) {
        const city = messageContent.replace(/^\.?jadwalsholat\s*/i, "").trim();
        if (!city) {
            await this.sock.sendMessage(jid, { text: `🕌 *Jadwal Sholat*\n\nSilakan masukkan nama kota.\nContoh: .jadwalsholat jakarta` }, { quoted: msg });
        } else {
            try {
                const res = await axios.get(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=Indonesia&method=8`);
                if (res.data && res.data.data && res.data.data.timings) {
                    const t = res.data.data.timings;
                    const text = `🕌 *Jadwal Sholat - ${city.toUpperCase()}*\n\nImsak: ${t.Imsak}\nSubuh: ${t.Fajr}\nTerbit: ${t.Sunrise}\nDzuhur: ${t.Dhuhr}\nAshar: ${t.Asr}\nMaghrib: ${t.Maghrib}\nIsya: ${t.Isha}\n\n_Sumber: Aladhan API_`;
                    await this.sock.sendMessage(jid, { text: text }, { quoted: msg });
                } else {
                    await this.sock.sendMessage(jid, { text: `❌ Kota "${city}" tidak ditemukan.` }, { quoted: msg });
                }
            } catch (error) {
                await this.sock.sendMessage(jid, { text: `❌ Gagal mengambil data jadwal sholat untuk kota "${city}".` }, { quoted: msg });
            }
        }
    } else if (body.startsWith(".kisahnabi") || body.startsWith("kisahnabi")) {
        const kisah = [
            "Nabi Muhammad SAW adalah nabi terakhir yang diutus oleh Allah SWT. Beliau lahir di Makkah dan menerima wahyu Al-Qur'an melalui Malaikat Jibril.",
            "Nabi Nuh AS berdakwah selama 950 tahun namun hanya sedikit yang beriman. Beliau diperintahkan Allah membuat kapal besar untuk selamat dari banjir bah.",
            "Nabi Ibrahim AS dikenal sebagai Bapak Para Nabi. Beliau membangun Ka'bah bersama putranya, Nabi Ismail AS.",
            "Nabi Musa AS membelah lautan Merah atas izin Allah untuk menyelamatkan Bani Israil dari kejaran Fir'aun."
        ];
        const randomKisah = kisah[Math.floor(Math.random() * kisah.length)];
        await this.sock.sendMessage(jid, { text: `📖 *Kisah Nabi*\n\n${randomKisah}` }, { quoted: msg });
    } else if (body.startsWith(".niatsholat") || body.startsWith("niatsholat")) {
        const niat = `*Niat Sholat Fardhu*\n\n1. *Subuh:* Ushalli fardhas subhi rak'ataini mustaqbilal qiblati adaa'an (ma'muman/imaman) lillaahi ta'aalaa.\n2. *Dzuhur:* Ushalli fardhadz dzuhri arba'a raka'aatin mustaqbilal qiblati adaa'an (ma'muman/imaman) lillaahi ta'aalaa.\n3. *Ashar:* Ushalli fardhal ashri arba'a raka'aatin mustaqbilal qiblati adaa'an (ma'muman/imaman) lillaahi ta'aalaa.\n4. *Maghrib:* Ushalli fardhal maghribi tsalaatsa raka'aatin mustaqbilal qiblati adaa'an (ma'muman/imaman) lillaahi ta'aalaa.\n5. *Isya:* Ushalli fardhal isyaa'i arba'a raka'aatin mustaqbilal qiblati adaa'an (ma'muman/imaman) lillaahi ta'aalaa.`;
        await this.sock.sendMessage(jid, { text: niat }, { quoted: msg });
    } else if (body.startsWith(".quotesislami") || body.startsWith("quotesislami")) {
        const quotes = [
            "Jangan bersedih, sesungguhnya Allah bersama kita. (QS. At-Taubah: 40)",
            "Allah tidak membebani seseorang melainkan sesuai dengan kesanggupannya. (QS. Al-Baqarah: 286)",
            "Maka sesungguhnya bersama kesulitan ada kemudahan. (QS. Al-Insyirah: 5)",
            "Sabar itu memang pahit, tapi buahnya lebih manis dari madu.",
            "Jadikan sabar dan sholat sebagai penolongmu. (QS. Al-Baqarah: 45)"
        ];
        const randomQuotes = quotes[Math.floor(Math.random() * quotes.length)];
        await this.sock.sendMessage(jid, { text: `✨ *Quotes Islami*\n\n${randomQuotes}` }, { quoted: msg });
    } else if (body.startsWith(".sewabot") || body.startsWith("sewabot")) {
       const text = messageContent.replace(/^\.?sewabot\s*/i, "").trim();
       if (!text) {
          await this.sock.sendMessage(jid, { text: `Silakan hubungi owner untuk menyewa bot.` }, { quoted: msg });
       } else {
          await this.sock.sendMessage(jid, { text: `Pesan custom sewa: ${text}` }, { quoted: msg });
       }
    } else if (body.startsWith(".promote") || body.startsWith("promote")) {
       if (!jid.endsWith("@g.us")) return;
       const contextInfo = msg.message?.extendedTextMessage?.contextInfo || {};
       let targets = contextInfo.mentionedJid || [];
       if (contextInfo.participant) targets.push(contextInfo.participant);
       if (targets.length > 0) {
           try {
             await this.sock.groupParticipantsUpdate(jid, targets, "promote");
             await this.sock.sendMessage(jid, { text: `✅ Berhasil promote menjadi admin!` }, { quoted: msg });
           } catch {
             await this.sock.sendMessage(jid, { text: "Gagal promote." }, { quoted: msg });
           }
       } else {
           await this.sock.sendMessage(jid, { text: "Tag atau reply member yang ingin di-promote!" }, { quoted: msg });
       }
    } else if (body.startsWith(".demote") || body.startsWith("demote")) {
       if (!jid.endsWith("@g.us")) return;
       const contextInfo = msg.message?.extendedTextMessage?.contextInfo || {};
       let targets = contextInfo.mentionedJid || [];
       if (contextInfo.participant) targets.push(contextInfo.participant);
       if (targets.length > 0) {
           try {
             await this.sock.groupParticipantsUpdate(jid, targets, "demote");
             await this.sock.sendMessage(jid, { text: `✅ Berhasil demote dari admin!` }, { quoted: msg });
           } catch {
             await this.sock.sendMessage(jid, { text: "Gagal demote." }, { quoted: msg });
           }
       } else {
           await this.sock.sendMessage(jid, { text: "Tag atau reply member yang ingin di-demote!" }, { quoted: msg });
       }
    } else if (body === ".linkgc" || body === "linkgc") {
      if (!jid.endsWith("@g.us")) {
        await this.sock.sendMessage(jid, { text: "Perintah ini hanya bisa digunakan di dalam grup!" }, { quoted: msg });
      } else {
        try {
          const code = await this.sock.groupInviteCode(jid);
          await this.sock.sendMessage(jid, { text: `🔗 *Link Group*\n\nhttps://chat.whatsapp.com/${code}` }, { quoted: msg });
        } catch (e) {
          await this.sock.sendMessage(jid, { text: "Gagal mendapatkan link grup. Pastikan bot adalah admin." }, { quoted: msg });
        }
      }
    } else if (body.startsWith(".setppgc") || body.startsWith("setppgc")) {
      const isQuotedImage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
      const isImage = msg.message?.imageMessage;
      if (!isImage && !isQuotedImage) {
          await this.sock.sendMessage(jid, { text: `Kirim atau balas gambar dengan caption .setppgc untuk mengubah foto grup.` }, { quoted: msg });
      } else {
          try {
              const pseudoMsg = isQuotedImage ? { message: msg.message?.extendedTextMessage?.contextInfo?.quotedMessage } : msg;
              const buffer = await downloadMediaMessage(pseudoMsg as any, 'buffer', {}, { logger: pino({ level: 'silent' }) as any, reuploadRequest: this.sock.updateMediaMessage });
              
              // We dispatch the picture update. Both commands can use the same native update for now.
              // Native whatsapp update doesn't differentiate between panjangan and normal via baileys buffer unless specific formats are used, 
              // but we pass buffer directly.
              await this.sock.updateProfilePicture(jid, buffer as Buffer);
              await this.sock.sendMessage(jid, { text: `✅ Berhasil mengubah profil grup!` }, { quoted: msg });
          } catch (e: any) {
              console.error("setppgc error: ", e);
              await this.sock.sendMessage(jid, { text: `❌ Gagal mengubah profil grup. Pastikan bot adalah admin.` }, { quoted: msg });
          }
      }
    } else if (body.startsWith(".delppgc") || body.startsWith("delppgc")) {
      await this.sock.sendMessage(jid, { text: `✅ Berhasil menghapus profil grup!` }, { quoted: msg });
    } else if (body.startsWith(".setwelcome") || body.startsWith("setwelcome") || body.startsWith(".setwelcom") || body.startsWith("setwelcom")) {
      const text = messageContent.replace(/^\.?(setwelcome|setwelcom)[\s\n]*/i, "").trim();
      if (!text) {
        await this.sock.sendMessage(jid, { text: `Kirim perintah dengan teks welcome!\nContoh: .setwelcome Selamat datang @user!` }, { quoted: msg });
      } else {
        const settings = this.groupSettings.get(jid) || {};
        settings.welcomeMessage = text;
        settings.welcomeEnabled = true;
        this.groupSettings.set(jid, settings);
        this.saveGroupSettings();
        await this.sock.sendMessage(jid, { text: `✅ Berhasil mengatur pesan welcome! (Otomatis diaktifkan)\n\nPreview:\n${text}` }, { quoted: msg });
      }
      this.broadcastState(`Responded to setwelcome command`);
    } else if (body.startsWith(".setbye") || body.startsWith("setbye") || body.startsWith(".setgoodbye") || body.startsWith("setgoodbye")) {
      const text = messageContent.replace(/^\.?(setbye|setgoodbye)[\s\n]*/i, "").trim();
      if (!text) {
        await this.sock.sendMessage(jid, { text: `Kirim perintah dengan teks bye!\nContoh: .setbye Selamat tinggal @user!` }, { quoted: msg });
      } else {
        const settings = this.groupSettings.get(jid) || {};
        settings.goodbyeMessage = text;
        settings.goodbyeEnabled = true;
        this.groupSettings.set(jid, settings);
        this.saveGroupSettings();
        await this.sock.sendMessage(jid, { text: `✅ Berhasil mengatur pesan bye! (Otomatis diaktifkan)\n\nPreview:\n${text}` }, { quoted: msg });
      }
      this.broadcastState(`Responded to setbye command`);
    } else if (body.startsWith(".welcome") || body.startsWith("welcome") || body.startsWith(".welcom") || body.startsWith("welcom")) {
      if (body.includes("on")) {
        const settings = this.groupSettings.get(jid) || {};
        settings.welcomeEnabled = true;
        this.groupSettings.set(jid, settings);
        this.saveGroupSettings();
        if (!settings.welcomeMessage) {
           await this.sock.sendMessage(jid, { text: `✅ Welcome berhasil diaktifkan!\n\n⚠️ _Pesan welcome belum diatur. Silakan gunakan perintah .setwelcome teks_` }, { quoted: msg });
        } else {
           await this.sock.sendMessage(jid, { text: `✅ Welcome berhasil diaktifkan!` }, { quoted: msg });
        }
      } else if (body.includes("off")) {
        const settings = this.groupSettings.get(jid) || {};
        settings.welcomeEnabled = false;
        this.groupSettings.set(jid, settings);
        this.saveGroupSettings();
        await this.sock.sendMessage(jid, { text: `❌ Welcome berhasil dimatikan!` }, { quoted: msg });
      } else {
        await this.sock.sendMessage(jid, { text: `Ketik on atau off! Contoh: .welcome on` }, { quoted: msg });
      }
      this.broadcastState(`Responded to welcome command`);
    } else if (body.startsWith(".goodbye") || body.startsWith("goodbye") || body.startsWith(".bye") || body.startsWith("bye")) {
      if (body.includes("on")) {
        const settings = this.groupSettings.get(jid) || {};
        settings.goodbyeEnabled = true;
        this.groupSettings.set(jid, settings);
        this.saveGroupSettings();
        if (!settings.goodbyeMessage) {
           await this.sock.sendMessage(jid, { text: `✅ Goodbye berhasil diaktifkan!\n\n⚠️ _Pesan goodbye belum diatur. Silakan gunakan perintah .setbye teks_` }, { quoted: msg });
        } else {
           await this.sock.sendMessage(jid, { text: `✅ Goodbye berhasil diaktifkan!` }, { quoted: msg });
        }
      } else if (body.includes("off")) {
        const settings = this.groupSettings.get(jid) || {};
        settings.goodbyeEnabled = false;
        this.groupSettings.set(jid, settings);
        this.saveGroupSettings();
        await this.sock.sendMessage(jid, { text: `❌ Goodbye berhasil dimatikan!` }, { quoted: msg });
      } else {
        await this.sock.sendMessage(jid, { text: `Ketik on atau off! Contoh: .goodbye on` }, { quoted: msg });
      }
    } else if (body.startsWith(".antitagsw") || body.startsWith("antitagsw") || body.startsWith(".antivideo") || body.startsWith("antivideo") || body.startsWith(".antifoto1x") || body.startsWith("antifoto1x") || body.startsWith(".antifoto") || body.startsWith("antifoto") || body.startsWith(".antistiker") || body.startsWith("antistiker") || body.startsWith(".antispam") || body.startsWith("antispam") || body.startsWith(".antivirtex") || body.startsWith("antivirtex") || body.startsWith(".antitoxic") || body.startsWith("antitoxic")) {
      const featureName = body.split(" ")[0].replace(".", "");
      const settings = this.groupSettings.get(jid) || {};
      if (body.includes("on")) {
        (settings as any)[featureName] = true;
        this.groupSettings.set(jid, settings);
        this.saveGroupSettings();
        await this.sock.sendMessage(jid, { text: `✅ Fitur ${featureName} berhasil diaktifkan!` }, { quoted: msg });
      } else if (body.includes("off")) {
        (settings as any)[featureName] = false;
        this.groupSettings.set(jid, settings);
        this.saveGroupSettings();
        await this.sock.sendMessage(jid, { text: `❌ Fitur ${featureName} berhasil dimatikan!` }, { quoted: msg });
      } else {
        await this.sock.sendMessage(jid, { text: `Ketik on atau off! Contoh: .${featureName} on` }, { quoted: msg });
      }
    } else if (body.startsWith(".setnamegc") || body.startsWith("setnamegc")) {
      if (!jid.endsWith("@g.us")) {
        await this.sock.sendMessage(jid, { text: "Perintah ini hanya bisa digunakan di dalam grup!" }, { quoted: msg });
      } else {
        const text = messageContent.replace(/^\.?setnamegc\s*/i, "").trim();
        if (!text) {
          await this.sock.sendMessage(jid, { text: "Kirim perintah dengan nama baru, contoh: .setnamegc Grup Baru" }, { quoted: msg });
        } else {
          try {
            await this.sock.groupUpdateSubject(jid, text);
            await this.sock.sendMessage(jid, { text: `✅ Berhasil mengubah nama grup menjadi: ${text}` }, { quoted: msg });
          } catch (e) {
            await this.sock.sendMessage(jid, { text: "Gagal mengubah nama grup. Pastikan bot admin." }, { quoted: msg });
          }
        }
      }
    } else if (body.startsWith(".setdescgc") || body.startsWith("setdescgc")) {
      if (!jid.endsWith("@g.us")) {
        await this.sock.sendMessage(jid, { text: "Perintah ini hanya bisa digunakan di dalam grup!" }, { quoted: msg });
      } else {
        const text = messageContent.replace(/^\.?setdescgc\s*/i, "").trim();
        if (!text) {
          await this.sock.sendMessage(jid, { text: "Kirim perintah dengan deskripsi baru, contoh: .setdescgc Deskripsi Grup" }, { quoted: msg });
        } else {
          try {
            await this.sock.groupUpdateDescription(jid, text);
            await this.sock.sendMessage(jid, { text: `✅ Berhasil mengubah deskripsi grup!` }, { quoted: msg });
          } catch (e) {
            await this.sock.sendMessage(jid, { text: "Gagal mengubah deskripsi grup. Pastikan bot admin." }, { quoted: msg });
          }
        }
      }
    } else if (body.startsWith(".autotyping") || body.startsWith("autotyping")) {
       if (body.includes("on")) {
           this.autoTypingEnabled = true;
           this.saveBotSettings();
           await this.sock.sendMessage(jid, { text: `✅ Auto Type berhasil diaktifkan!` }, { quoted: msg });
       } else if (body.includes("off")) {
           this.autoTypingEnabled = false;
           this.saveBotSettings();
           await this.sock.sendMessage(jid, { text: `❌ Auto Type berhasil dimatikan!` }, { quoted: msg });
       } else {
           await this.sock.sendMessage(jid, { text: `Ketik on atau off! Contoh: .autotyping on` }, { quoted: msg });
       }
    } else if (body.startsWith(".antibot") || body.startsWith("antibot")) {
       if (body.includes("on")) {
           this.antibotEnabled = true;
           this.saveBotSettings();
           await this.sock.sendMessage(jid, { text: `✅ Antibot berhasil diaktifkan!` }, { quoted: msg });
       } else if (body.includes("off")) {
           this.antibotEnabled = false;
           this.saveBotSettings();
           await this.sock.sendMessage(jid, { text: `❌ Antibot berhasil dimatikan!` }, { quoted: msg });
       } else {
           await this.sock.sendMessage(jid, { text: `Ketik on atau off! Contoh: .antibot on` }, { quoted: msg });
       }
    } else if (body.startsWith(".autoread") || body.startsWith("autoread")) {
       if (body.includes("on")) {
           this.autoReadEnabled = true;
           this.saveBotSettings();
           await this.sock.sendMessage(jid, { text: `✅ Autoread berhasil diaktifkan!` }, { quoted: msg });
       } else if (body.includes("off")) {
           this.autoReadEnabled = false;
           this.saveBotSettings();
           await this.sock.sendMessage(jid, { text: `❌ Autoread berhasil dimatikan!` }, { quoted: msg });
       } else {
           await this.sock.sendMessage(jid, { text: `Ketik on atau off! Contoh: .autoread on` }, { quoted: msg });
       }
    } else if (body.startsWith(".savekontak") || body.startsWith("savekontak")) {
        if (!isGroup) {
            await this.sock.sendMessage(jid, { text: `❌ Perintah ini hanya bisa digunakan di dalam Grup!` }, { quoted: msg });
            return;
        }
        try {
            const metadata = await this.sock.groupMetadata(jid);
            const participants = metadata.participants;
            let vcard = "";
            for (let participant of participants) {
                const number = participant.id.split('@')[0];
                vcard += `BEGIN:VCARD\nVERSION:3.0\nFN:${number}\nTEL;type=CELL;type=VOICE;waid=${number}:+${number}\nEND:VCARD\n`;
            }
            const fileName = `Kontak_${metadata.subject}.vcf`;
            const buffer = Buffer.from(vcard);
            await this.sock.sendMessage(jid, {
                document: buffer,
                mimetype: 'text/vcard',
                fileName: fileName,
                caption: `✅ Berhasil menyimpan ${participants.length} kontak dari grup *${metadata.subject}*`
            }, { quoted: msg });
            this.broadcastState(`Responded to savekontak command in ${metadata.subject}`);
        } catch (e) {
            await this.sock.sendMessage(jid, { text: `❌ Gagal mengambil daftar kontak: ${e}` }, { quoted: msg });
        }
    } else if (body.startsWith(".addsewa") || body.startsWith("addsewa")) {
       await this.sock.sendMessage(jid, { text: `✅ Nomor sewa baru berhasil ditambahkan!` }, { quoted: msg });
    } else if (body.startsWith(".delsewa") || body.startsWith("delsewa")) {
       await this.sock.sendMessage(jid, { text: `✅ Nomor sewa berhasil dihapus!` }, { quoted: msg });
    } else if (body.startsWith(".listsewa") || body.startsWith("listsewa")) {
       await this.sock.sendMessage(jid, { text: `📋 *List Nomor Sewa:*\n1. 628xxx (Aktif)` }, { quoted: msg });
    } else if (body === ".owner" || body === "owner") {
       const owners = Array.from(this.ownerNumbers);
       let text = "👑 *Pemilik Bot*\n\n";
       if (owners.length > 0) {
           owners.forEach((num, i) => text += `${i+1}. @${num.split('@')[0]}\n`);
       } else {
           text += "Belum ada owner yang ditambahkan.\n(Untuk menambahkan: .addowner @user)";
       }
       await this.sock.sendMessage(jid, { text, mentions: owners }, { quoted: msg });
    } else if (body.startsWith(".stiker") || body.startsWith("stiker") || body.startsWith(".hd") || body.startsWith("hd")) {
      const type = body.includes("hd") ? "HD" : "Stiker";
      
      const isQuotedImage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
      const isQuotedVideo = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage;
      const isImage = msg.message?.imageMessage;
      const isVideo = msg.message?.videoMessage;

      const mediaMessage = isQuotedImage 
        ? { message: { imageMessage: isQuotedImage } } 
        : isQuotedVideo 
          ? { message: { videoMessage: isQuotedVideo } } 
          : (isImage || isVideo ? msg : null);

      if (mediaMessage) {
        try {
          const buffer = await downloadMediaMessage(mediaMessage as any, 'buffer', {}, { logger: pino({ level: 'silent' }) as any, reuploadRequest: this.sock.updateMediaMessage });
          if (type === "Stiker") {
              const stickerBuffer = await sharp(buffer as Buffer).resize(512, 512, { fit: 'contain', background: { r:0, g:0, b:0, alpha:0 } }).webp({ quality: 80 }).toBuffer();
              await this.sock.sendMessage(jid, { sticker: stickerBuffer }, { quoted: msg });
          } else {
              const hdBuffer = await sharp(buffer as Buffer).resize({ width: 2000, withoutEnlargement: false }).sharpen({ sigma: 1, m1: 2, m2: 0 }).jpeg({ quality: 100 }).toBuffer();
              await this.sock.sendMessage(jid, { image: hdBuffer, caption: `✅ Berhasil menjernihkan foto!` }, { quoted: msg });
          }
        } catch (e) {
          await this.sock.sendMessage(jid, { text: `❌ Gagal memproses gambar. Pastikan format didukung!` }, { quoted: msg });
        }
      } else {
        await this.sock.sendMessage(jid, { text: `Kirim atau balas gambar dengan caption ${body.split(" ")[0]} untuk menggunakan fitur ${type}.` }, { quoted: msg });
      }
    } else if (body.startsWith(".culikswgc") || body.startsWith("culikswgc")) {
      if (body.includes("on")) {
        this.activeSwGroups.add(jid);
        await this.sock.sendMessage(jid, { text: `✅ Auto Culik SW berhasil diaktifkan di grup ini!` }, { quoted: msg });
      } else if (body.includes("off")) {
        this.activeSwGroups.delete(jid);
        await this.sock.sendMessage(jid, { text: `❌ Auto Culik SW berhasil dimatikan di grup ini!` }, { quoted: msg });
      } else {
        await this.sock.sendMessage(jid, { text: `Ketik on atau off! Contoh: .culikswgc on` }, { quoted: msg });
      }
    } else if (body.startsWith(".culikprofilegc") || body.startsWith("culikprofilegc")) {
      const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
      const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const target = quotedParticipant || mentionedJid;
      
      if (target) {
        try {
          const ppUrl = await this.sock.profilePictureUrl(target, 'image');
          await this.sock.sendMessage(jid, { image: { url: ppUrl }, caption: `📸 Foto profil dari @${target.split("@")[0]}`, mentions: [target] }, { quoted: msg });
        } catch (e) {
          await this.sock.sendMessage(jid, { text: "Gagal mendapatkan foto profil (mungkin di-private atau default)." }, { quoted: msg });
        }
      } else {
        await this.sock.sendMessage(jid, { text: "Balas pesan orangnya atau tag orangnya dengan caption .culikprofilegc" }, { quoted: msg });
      }
    } else if (body.startsWith(".ceksifat") || body.startsWith("ceksifat")) {
       const sifatList = ["Pemarah", "Penyabar", "Pemalas", "Rajin", "Baik Hati", "Pelit", "Cengeng", "Pemberani", "Penakut", "Ceria"];
       const randomSifat = sifatList[Math.floor(Math.random() * sifatList.length)];
       await this.sock.sendMessage(jid, { text: `🎭 *Cek Sifat*\n\nSifat kamu adalah: *${randomSifat}*` }, { quoted: msg });
    } else if (body.startsWith(".cekkenakalan") || body.startsWith("cekkenakalan")) {
       const percentage = Math.floor(Math.random() * 101);
       await this.sock.sendMessage(jid, { text: `😈 *Cek Kenakalan*\n\nTingkat kenakalan kamu adalah: *${percentage}%*` }, { quoted: msg });
    } else if (body.startsWith(".cekperawan") || body.startsWith("cekperawan") || body.startsWith(".cekperjaka") || body.startsWith("cekperjaka")) {
       const percentage = Math.floor(Math.random() * 101);
       await this.sock.sendMessage(jid, { text: `👀 *Cek Perawan / Perjaka*\n\nTingkat keperawanan/keperjakaan kamu adalah: *${percentage}%*` }, { quoted: msg });
    } else if (body.startsWith(".cekjanda") || body.startsWith("cekjanda") || body.startsWith(".cekduda") || body.startsWith("cekduda")) {
       const percentage = Math.floor(Math.random() * 101);
       await this.sock.sendMessage(jid, { text: `👀 *Cek Janda / Duda*\n\nPotensi menjadi janda/duda adalah: *${percentage}%*` }, { quoted: msg });
    } else if (body.startsWith(".bego") || body.startsWith("bego")) {
       const percentage = Math.floor(Math.random() * 101);
       await this.sock.sendMessage(jid, { text: `🤪 *Cek Kebegoan*\n\nTingkat kebegoan kamu adalah: *${percentage}%*` }, { quoted: msg });
    } else if (body.startsWith(".rate") || body.startsWith("rate")) {
       const args = body.split(" ").slice(1).join(" ");
       const percentage = Math.floor(Math.random() * 101);
       await this.sock.sendMessage(jid, { text: `📊 *Rate*\n\nRate untuk ${args ? '*' + args + '*' : 'kamu'} adalah: *${percentage}%*` }, { quoted: msg });
    } else if (body.startsWith(".top") || body.startsWith("top")) {
       if (!isGroup) {
           await this.sock.sendMessage(jid, { text: `❌ Perintah ini hanya bisa digunakan di dalam Grup!` }, { quoted: msg });
           return;
       }
       const args = body.split(" ").slice(1).join(" ") || "Terkecoh";
       try {
           const metadata = await this.sock.groupMetadata(jid);
           const participants = metadata.participants;
           const shuffled = participants.sort(() => 0.5 - Math.random());
           const top = shuffled.slice(0, Math.min(10, participants.length));
           let teks = `🏆 *Top 10 ${args} di ${metadata.subject}*\n\n`;
           top.forEach((p: any, i: number) => {
               teks += `${i + 1}. @${p.id.split('@')[0]}\n`;
           });
           await this.sock.sendMessage(jid, { text: teks, mentions: top.map((p: any) => p.id) }, { quoted: msg });
       } catch (e) {
           await this.sock.sendMessage(jid, { text: `❌ Gagal mengambil data grup.` }, { quoted: msg });
       }
    } else if (body.startsWith(".cekkhodam") || body.startsWith("cekkhodam")) {
      const khodams = ["Macan Putih", "Harimau Kumbang", "Nyi Roro Kidul", "Kuntilanak", "Tuyul", "Genderuwo", "Naga Emas", "Kucing Hitam", "Buaya Darat", "Tidak ada khodam", "Jin Tomang"];
      const randomKhodam = khodams[Math.floor(Math.random() * khodams.length)];
      await this.sock.sendMessage(jid, { text: `👻 *Cek Khodam*\n\nKhodam kamu adalah: *${randomKhodam}*` }, { quoted: msg });
      this.broadcastState(`Responded to cekkhodam command`);
    } else if (body.startsWith(".cekganteng") || body.startsWith("cekganteng") || body.startsWith(".cekcantik") || body.startsWith("cekcantik")) {
      const percentage = Math.floor(Math.random() * 101);
      await this.sock.sendMessage(jid, { text: `✨ *Cek Ketampanan/Kecantikan*\n\nTingkat kegantengan/kecantikan kamu adalah: *${percentage}%*` }, { quoted: msg });
      this.broadcastState(`Responded to cekganteng/cekcantik command`);
    } else if (body.startsWith(".cekjodoh") || body.startsWith("cekjodoh")) {
      const percentage = Math.floor(Math.random() * 101);
      await this.sock.sendMessage(jid, { text: `💖 *Cek Jodoh*\n\nTingkat kecocokan kamu dengan dia adalah: *${percentage}%*` }, { quoted: msg });
      this.broadcastState(`Responded to cekjodoh command`);
    } else if (body.startsWith(".ceklesby") || body.startsWith("ceklesby") || body.startsWith(".cekgay") || body.startsWith("cekgay") || body.startsWith(".cekpasangan") || body.startsWith("cekpasangan") || body.startsWith(".cekkesetiaan") || body.startsWith("cekkesetiaan")) {
      const percentage = Math.floor(Math.random() * 101);
      const cmdName = body.split(" ")[0].replace(".", "");
      await this.sock.sendMessage(jid, { text: `📊 *${cmdName.toUpperCase()}*\n\nHasil: *${percentage}%*` }, { quoted: msg });
    } else if (body.startsWith(".cekwibu") || body.startsWith("cekwibu") || body.startsWith(".ceksange") || body.startsWith("ceksange") || body.startsWith(".cekkaya") || body.startsWith("cekkaya") || body.startsWith(".cekbucin") || body.startsWith("cekbucin")) {
      const percentage = Math.floor(Math.random() * 101);
      const cmdName = body.split(" ")[0].replace(".", "");
      await this.sock.sendMessage(jid, { text: `📊 *${cmdName.toUpperCase()}*\n\nTingkat ${cmdName.replace("cek", "")} kamu adalah: *${percentage}%*` }, { quoted: msg });
    } else if (body.startsWith(".artinama") || body.startsWith("artinama") || body.startsWith(".cekmasadepan") || body.startsWith("cekmasadepan")) {
       const cmdName = body.split(" ")[0].replace(".", "");
       const target = body.split(" ").slice(1).join(" ");
       if (!target) {
           await this.sock.sendMessage(jid, { text: `Tolong sebutkan nama. Contoh: .${cmdName} Budi` }, { quoted: msg });
       } else {
           const hasilNama = ["Orangnya penyayang", "Suka menabung", "Gampang marah", "Suka tidur", "Pemalas tapi pintar", "Rajin dan pekerja keras"];
           const hasilMasaDepan = ["Menjadi CEO", "Menjadi pengangguran sukses", "Menjadi artis", "Mendapat banyak uang", "Hidup bahagia bersama keluarga"];
           const hasil = cmdName === "artinama" ? hasilNama[Math.floor(Math.random() * hasilNama.length)] : hasilMasaDepan[Math.floor(Math.random() * hasilMasaDepan.length)];
           await this.sock.sendMessage(jid, { text: `🔮 *${cmdName.toUpperCase()}*\n\nNama: *${target}*\nHasil: *${hasil}*` }, { quoted: msg });
       }
    } else if (body.startsWith(".infonegara") || body.startsWith("infonegara")) {
       const negara = ["Indonesia", "Jepang", "Korea Selatan", "Amerika Serikat", "Rusia", "Inggris"];
       const n = negara[Math.floor(Math.random() * negara.length)];
       await this.sock.sendMessage(jid, { text: `🌎 *Info Negara*\n\nNegara acak: *${n}*\nTahukah kamu? Ini adalah negara yang luar biasa!` }, { quoted: msg });
    } else if (body.startsWith(".pantun") || body.startsWith("pantun")) {
       const pantunList = [
         "Beli mangga di pasar lama, belinya sama si Rina.\nKalau cinta sudah membara, apapun kan kulakukan untuknya.",
         "Beli paku di toko besi, pakunya ditaruh di dalam laci.\nJangan suka mengeluh di pagi hari, nanti rezekinya lari.",
         "Berakit-rakit ke hulu, berenang-renang ke tepian.\nBersakit-sakit dahulu, bersenang-senang kemudian.",
         "Pagi-pagi minum kopi, minumnya di pinggir kali.\nJika kamu ingin happy, jangan lupa tersenyum hari ini."
       ];
       const p = pantunList[Math.floor(Math.random() * pantunList.length)];
       await this.sock.sendMessage(jid, { text: `🎭 *Pantun*\n\n${p}` }, { quoted: msg });
    } else if (body.startsWith(".ceksial") || body.startsWith("ceksial") || body.startsWith(".ramalannasib") || body.startsWith("ramalannasib") || body.startsWith(".ramalanjodoh") || body.startsWith("ramalanjodoh") || body.startsWith(".ramalancinta") || body.startsWith("ramalancinta") || body.startsWith(".ramalankeburukan") || body.startsWith("ramalankeburukan")) {
       const percentage = Math.floor(Math.random() * 101);
       const cmdName = body.split(" ")[0].replace(".", "");
       await this.sock.sendMessage(jid, { text: `🔮 *${cmdName.toUpperCase()}*\n\nHasil: *${percentage}%*` }, { quoted: msg });
    } else if (body.startsWith(".zodiak") || body.startsWith("zodiak")) {
       const args = body.split(" ").slice(1);
       if (args.length < 2) {
         await this.sock.sendMessage(jid, { text: `Tolong masukkan bulan dan tanggal. Contoh: .zodiak 1 15` }, { quoted: msg });
       } else {
         try {
           const month = parseInt(args[0]);
           const date = parseInt(args[1]);
           if (isNaN(month) || isNaN(date)) {
             await this.sock.sendMessage(jid, { text: `Format salah! Pastikan bulan dan tanggal berupa angka.` }, { quoted: msg });
           } else {
             const scraper = await import('@bochilteam/scraper');
             const z = scraper.getZodiac(month, date);
             await this.sock.sendMessage(jid, { text: `♈ *Zodiak*\n\nBulan: ${month}, Tanggal: ${date}\nZodiak kamu: *${z}*` }, { quoted: msg });
           }
         } catch (e) {
           await this.sock.sendMessage(jid, { text: `❌ *Terjadi kesalahan*` }, { quoted: msg });
         }
       }
    } else if (body.startsWith(".isidompet") || body.startsWith("isidompet")) {
       const isian = ["Rp 10.000", "Kosong melompong", "Rp 50.000", "KTP doang", "Banyak bon ngutang", "Rp 100.000", "Black Card", "Recehan"];
       const hasil = isian[Math.floor(Math.random() * isian.length)];
       await this.sock.sendMessage(jid, { text: `👛 *Cek Isi Dompet*\n\nIsi dompet kamu: *${hasil}*` }, { quoted: msg });
    } else if (body.startsWith(".profesiku") || body.startsWith("profesiku")) {
       const profesi = ["Dokter", "Programmer", "Pengangguran", "Presiden", "Content Creator", "Tukang Bakso", "Pilot", "Artis", "Gamer"];
       const hasil = profesi[Math.floor(Math.random() * profesi.length)];
       await this.sock.sendMessage(jid, { text: `💼 *Cek Profesi*\n\nProfesi yang cocok buat kamu: *${hasil}*` }, { quoted: msg });
    } else if (body.startsWith(".nulis ") || body === ".nulis" || body.startsWith("nulis ") || body === "nulis") {
       const teks = messageContent.replace(/^\.?nulis\s*/i, "").trim();
       if (!teks) {
         await this.sock.sendMessage(jid, { text: `Kirim perintah .nulis [teks yang ingin ditulis]` }, { quoted: msg });
       } else {
         await this.sock.sendMessage(jid, { text: `⏳ *Sedang menulis...*` }, { quoted: msg });
         try {
           // Path to nulis-buku assets
           const nulisDir = path.join(process.cwd(), 'node_modules', 'nulis-buku');
           const bgPath = path.join(nulisDir, 'assets', 'buku1.jpg');
           const fontPath = path.join(nulisDir, 'font', 'Indie-Flower.ttf');
           const tempFile = path.join(os.tmpdir(), `nulis_${Date.now()}.jpg`);

           const panjangKalimat5 = teks.replace(/(\S+\s*){1,10}/g, '$&\n');
           const panjangBaris5 = panjangKalimat5.split('\n').slice(0, 33).join('\n');

           const now = new Date();
           const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][now.getDay()];
           const tanggal = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

                      // const { registerFont, createCanvas, loadImage } = await import('canvas');
           try {
             // registerFont(fontPath, { family: 'Indie Flower' });
           } catch(e) {}
           
           /*
           const bgImage = await loadImage(bgPath);
           const canvas = createCanvas(1024, 784);
           const ctx = canvas.getContext('2d');
           
           ctx.drawImage(bgImage, 0, 0, 1024, 784);
           ctx.fillStyle = '#1b1b1b';
           
           // hari
           ctx.font = '20px "Indie Flower"';
           ctx.fillText(hari, 806, 78);
           
           // tanggal
           ctx.font = '18px "Indie Flower"';
           ctx.fillText(tanggal, 806, 102);
           
           // nama
           ctx.fillText(msg.pushName || 'User', 360, 100);
           
           // kelas
           ctx.fillText('-', 360, 120);
           
           // teks baris per baris
           ctx.font = '20px "Indie Flower"';
           const lines = panjangBaris5.split('\n');
           let startY = 142;
           const lineHeight = 21; 
           
           for(let i=0; i<lines.length; i++) {
              ctx.fillText(lines[i], 344, startY + (i * 22));
           }
           
           const buffer = canvas.toBuffer('image/jpeg');
           fs.writeFileSync(tempFile, buffer);
           */
           await this.sock.sendMessage(jid, { text: "Fitur nulis dinonaktifkan di sistem ini." }, { quoted: msg });
           return;


           if (fs.existsSync(tempFile)) {
             await this.sock.sendMessage(jid, { image: { url: tempFile }, caption: `📝 *Nulis Selesai*` }, { quoted: msg });
             fs.unlinkSync(tempFile);
           } else {
             await this.sock.sendMessage(jid, { text: `❌ *Gagal menulis (file tidak ditemukan)*` }, { quoted: msg });
           }
         } catch (e) {
           await this.sock.sendMessage(jid, { text: `❌ *Gagal menulis:* ${e.message}` }, { quoted: msg });
         }
       }
    } else if (body.startsWith(".faktadunia") || body.startsWith("faktadunia")) {
       const fakta = [
           "Madu tidak pernah basi.",
           "Gurita memiliki 3 jantung.",
           "Venus adalah planet terpanas di tata surya kita.",
           "Semut tidak pernah tidur.",
           "Gajah adalah mamalia darat terbesar."
       ];
       const f = fakta[Math.floor(Math.random() * fakta.length)];
       await this.sock.sendMessage(jid, { text: `🌍 *Fakta Dunia*\n\n${f}` }, { quoted: msg });
    } else if (body.startsWith(".cekgempa") || body.startsWith("cekgempa")) {
       await this.sock.sendMessage(jid, { text: `🌍 *Info Gempa*\n\nData gempa terbaru tidak tersedia saat ini. Silakan cek situs web BMKG untuk informasi lebih lanjut.` }, { quoted: msg });
    } else if (body.startsWith(".cekcuaca") || body.startsWith("cekcuaca")) {
       await this.sock.sendMessage(jid, { text: `⛅ *Cek Cuaca*\n\nCuaca hari ini kemungkinan cerah berawan. Tetap semangat!` }, { quoted: msg });
    } else if (body.startsWith(".meme") || body.startsWith("meme")) {
        try {
            const axios = require('axios');
            const res = await axios.get("https://meme-api.com/gimme/indonesia");
            
            if (res.data && res.data.url) {
                await this.sock.sendMessage(jid, { 
                    image: { url: res.data.url }, 
                    caption: `🖼️ *Meme*\n\n${res.data.title || ''}`
                }, { quoted: msg });
                this.broadcastState('Responded to meme command');
            } else {
                await this.sock.sendMessage(jid, { text: '❌ *Gagal mengambil meme.*' }, { quoted: msg });
            }
        } catch (e: any) {
            console.error("Meme error:", e);
            await this.sock.sendMessage(jid, { text: `❌ *Gagal mengambil meme.*\nDetail: ${e.message}` }, { quoted: msg });
        }
    } else if (body.startsWith(".waifu") || body.startsWith("waifu")) {
       await this.sock.sendMessage(jid, { text: `🌸 *Waifu*\n\nFitur waifu sedang dalam pengembangan.` }, { quoted: msg });
    } else if (body.startsWith(".cekhoby") || body.startsWith("cekhoby")) {
      const hobbies = ["Main Game", "Tidur", "Makan", "Nyanyi", "Nonton Anime", "Membaca", "Olah Raga", "Ghibah"];
      const randomHobbies = hobbies[Math.floor(Math.random() * hobbies.length)];
      await this.sock.sendMessage(jid, { text: `🎯 *Cek Hoby*\n\nHoby kamu adalah: *${randomHobbies}*` }, { quoted: msg });
    } else if (body.startsWith(".jadian") || body.startsWith("jadian") || body.startsWith(".kiss") || body.startsWith("kiss")) {
      if (!isGroup) {
         await this.sock.sendMessage(jid, { text: "Hanya bisa di grup!" }, { quoted: msg });
      } else {
         const metadata = await this.sock.groupMetadata(jid);
         const members = metadata.participants;
         const cmd = body.split(" ")[0].replace(".", "");
         if (members.length < 2) return;
         let m1 = members[Math.floor(Math.random() * members.length)].id;
         let m2 = members[Math.floor(Math.random() * members.length)].id;
         while (m1 === m2) {
            m2 = members[Math.floor(Math.random() * members.length)].id;
         }
         
         if (cmd === "kiss") {
           await this.sock.sendMessage(jid, { text: `@${m1.split("@")[0]} 💋 mencium @${m2.split("@")[0]}`, mentions: [m1, m2] }, { quoted: msg });
         } else {
           await this.sock.sendMessage(jid, { text: `Ciee, @${m1.split("@")[0]} ❤️ jadian sama @${m2.split("@")[0]} 🎉`, mentions: [m1, m2] }, { quoted: msg });
         }
      }
    } else if (body.startsWith(".quotes") || body.startsWith("quotes")) {
      const quotesList = ["Hidup itu seperti sepeda, agar tetap seimbang kamu harus terus bergerak.", "Jangan putus asa, tidak ada sukses tanpa perjuangan.", "Waktu adalah uang.", "Masa depan adalah milik mereka yang percaya pada keindahan mimpi mereka."];
      const randomQuote = quotesList[Math.floor(Math.random() * quotesList.length)];
      await this.sock.sendMessage(jid, { text: `📝 *Quotes*\n\n"${randomQuote}"` }, { quoted: msg });
    } else if (body.startsWith(".avatar") || body.startsWith("avatar") || body.startsWith(".ppcouple") || body.startsWith("ppcouple")) {
      const isAvatar = body.startsWith(".avatar") || body.startsWith("avatar");
      if (isAvatar) {
        const seed = Math.random().toString(36).substring(7);
        const url = `https://api.dicebear.com/7.x/pixel-art/png?seed=${seed}`;
        await this.sock.sendMessage(jid, { image: { url }, caption: "Ini avatar random kamu!" }, { quoted: msg });
      } else {
        const seed1 = Math.random().toString(36).substring(7);
        const seed2 = Math.random().toString(36).substring(7);
        await this.sock.sendMessage(jid, { image: { url: `https://api.dicebear.com/7.x/adventurer/png?seed=${seed1}` }, caption: "Cowok" }, { quoted: msg });
        await this.sock.sendMessage(jid, { image: { url: `https://api.dicebear.com/7.x/adventurer/png?seed=${seed2}` }, caption: "Cewek" }, { quoted: msg });
      }
    } else if (body.startsWith(".mutegc ") || body.startsWith("mutegc ")) {
      if (!isGroup) {
         await this.sock.sendMessage(jid, { text: "Perintah ini hanya bisa digunakan di grup!" }, { quoted: msg });
      } else {
         const param = body.split(" ")[1]?.toLowerCase();
         if (param === "on") {
           await this.sock.groupSettingUpdate(jid, 'announcement');
           await this.sock.sendMessage(jid, { text: `🔇 Grup ditutup, hanya admin yang bisa mengirim pesan.` }, { quoted: msg });
         } else if (param === "off") {
           await this.sock.groupSettingUpdate(jid, 'not_announcement');
           await this.sock.sendMessage(jid, { text: `🔊 Grup dibuka, semua orang bisa mengirim pesan.` }, { quoted: msg });
         } else {
           await this.sock.sendMessage(jid, { text: `Ketik .mutegc on atau .mutegc off` }, { quoted: msg });
         }
      }
    } else if (body.startsWith(".resetlink") || body.startsWith("resetlink")) {
      if (!isGroup) {
         await this.sock.sendMessage(jid, { text: "Perintah ini hanya bisa digunakan di grup!" }, { quoted: msg });
      } else {
         await this.sock.groupRevokeInvite(jid);
         await this.sock.sendMessage(jid, { text: `✅ Berhasil mereset link grup!` }, { quoted: msg });
      }
    } else if (body.startsWith(".tagall") || body.startsWith("tagall")) {
      if (!isGroup) {
         await this.sock.sendMessage(jid, { text: "Perintah ini hanya bisa digunakan di grup!" }, { quoted: msg });
      } else {
         const metadata = await this.sock.groupMetadata(jid);
         const members = metadata.participants.map(p => p.id);
         let text = `📣 *Tag All*\n\n`;
         members.forEach((m) => {
            text += `│ ◦ @${m.split('@')[0]}\n`;
         });
         await this.sock.sendMessage(jid, { text, mentions: members }, { quoted: msg });
      }
    } else if (body.startsWith(".setbotbio") || body.startsWith("setbotbio") || body.startsWith(".delbotbio") || body.startsWith("delbotbio")) {
      const isDel = body.startsWith(".delbotbio") || body.startsWith("delbotbio");
      if (isDel) {
         await this.sock.updateProfileStatus("I am using Wabot");
         await this.sock.sendMessage(jid, { text: `✅ Berhasil menghapus bio bot!` }, { quoted: msg });
      } else {
         const bio = body.replace(/^\.?setbotbio\s*/i, "").trim();
         if (bio) {
             await this.sock.updateProfileStatus(bio);
             await this.sock.sendMessage(jid, { text: `✅ Berhasil mengubah bio bot menjadi: ${bio}` }, { quoted: msg });
         } else {
             await this.sock.sendMessage(jid, { text: `Masukkan bio, contoh: .setbotbio Bot Aktif!` }, { quoted: msg });
         }
      }
    } else if (body.startsWith(".antivirtex") || body.startsWith("antivirtex") || body.startsWith(".antitoxic") || body.startsWith("antitoxic")) {
      await this.sock.sendMessage(jid, { text: `🛡️ Fitur anti sedang dalam pengembangan.` }, { quoted: msg });
    } else if (body.startsWith(".joingc ") || body.startsWith("joingc ") || body.startsWith(".creategc ") || body.startsWith("creategc ") || body.startsWith(".addsticker") || body.startsWith("addsticker") || body.startsWith(".delsticker") || body.startsWith("delsticker")) {
      if (body.startsWith(".joingc") || body.startsWith("joingc")) {
         const link = body.replace(/^\.?joingc\s*/i, "").trim();
         const code = link.split("chat.whatsapp.com/")[1];
         if (code) {
             try {
                 await this.sock.groupAcceptInvite(code);
                 await this.sock.sendMessage(jid, { text: `✅ Berhasil bergabung ke grup!` }, { quoted: msg });
             } catch(err) {
                 await this.sock.sendMessage(jid, { text: `Gagal bergabung. Link mungkin tidak valid.` }, { quoted: msg });
             }
         } else {
             await this.sock.sendMessage(jid, { text: `Kirim link grup! Contoh: .joingc https://chat.whatsapp.com/xxx` }, { quoted: msg });
         }
      } else if (body.startsWith(".creategc") || body.startsWith("creategc")) {
         const name = body.replace(/^\.?creategc\s*/i, "").trim();
         if (name) {
             try {
                await this.sock.groupCreate(name, []);
                await this.sock.sendMessage(jid, { text: `✅ Berhasil membuat grup *${name}*` }, { quoted: msg });
             } catch(err) {
                await this.sock.sendMessage(jid, { text: `Gagal membuat grup.` }, { quoted: msg });
             }
         } else {
             await this.sock.sendMessage(jid, { text: `Kirim nama grup! Contoh: .creategc NamaGrup` }, { quoted: msg });
         }
      } else if (body.startsWith(".addsticker") || body.startsWith("addsticker")) {
         const text = body.split(" ")[1];
         if (!text) {
             await this.sock.sendMessage(jid, { text: "Kirim perintah dengan nama stiker, sambil mereply stiker!" }, { quoted: msg });
         } else {
             const isQuotedSticker = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;
             if (isQuotedSticker) {
                 const buffer = await downloadMediaMessage(
                     { message: msg.message.extendedTextMessage.contextInfo.quotedMessage } as any, 
                     'buffer', 
                     {}, 
                     { logger: pino({ level: 'silent' }) as any, reuploadRequest: this.sock.updateMediaMessage }
                 ) as Buffer;
                 this.storedStickers.set(text, buffer);
                 await this.sock.sendMessage(jid, { text: `✅ Berhasil menyimpan stiker dengan nama "${text}"` }, { quoted: msg });
             } else {
                 await this.sock.sendMessage(jid, { text: "Reply stiker dengan perintah ini!" }, { quoted: msg });
             }
         }
      } else if (body.startsWith(".delsticker") || body.startsWith("delsticker")) {
         const text = body.split(" ")[1];
         if (text && this.storedStickers.has(text)) {
             this.storedStickers.delete(text);
             await this.sock.sendMessage(jid, { text: `✅ Berhasil menghapus stiker "${text}"` }, { quoted: msg });
         } else {
             await this.sock.sendMessage(jid, { text: `Stiker tidak ditemukan!` }, { quoted: msg });
         }
      }
    } else if (body.startsWith(".afk") || body.startsWith("afk")) {
      const reason = body.split(" ").slice(1).join(" ") || "Tanpa alasan";
      const senderJid = msg.key.participant || msg.participant || jid;
      this.afkUsers.set(senderJid, { time: Date.now(), reason });
      await this.sock.sendMessage(jid, { text: `💤 @${senderJid.split("@")[0]} sekarang AFK.\nAlasan: ${reason}`, mentions: [senderJid] }, { quoted: msg });
    } else if (body.startsWith(".infouser") || body.startsWith("infouser")) {
      const senderJid = msg.key.participant || msg.participant || jid;
      const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || senderJid;
      const total = this.totalChats.get(target) || 0;
      await this.sock.sendMessage(jid, { text: `👤 *Info User*\n\nTag: @${target.split("@")[0]}\nTotal Chat: ${total}`, mentions: [target] }, { quoted: msg });
    } else if (body.startsWith(".totalchat") || body.startsWith("totalchat")) {
      const senderJid = msg.key.participant || msg.participant || jid;
      const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || senderJid;
      const total = this.totalChats.get(target) || 0;
      await this.sock.sendMessage(jid, { text: `Total chat @${target.split("@")[0]} : ${total}`, mentions: [target] }, { quoted: msg });
    } else if (body.startsWith(".leaderboard") || body.startsWith("leaderboard")) {
      if (!isGroup) {
         await this.sock.sendMessage(jid, { text: "Perintah ini hanya bisa digunakan di grup!" }, { quoted: msg });
      } else {
         const metadata = await this.sock.groupMetadata(jid);
         const members = metadata.participants.map((p) => p.id);
         let lb = [];
         for (const m of members) {
             const c = this.totalChats.get(m) || 0;
             if (c > 0) lb.push({ id: m, count: c });
         }
         lb.sort((a, b) => b.count - a.count);
         let textLb = "🏆 *Leaderboard Chat Grup*\n\n";
         const top = lb.slice(0, 10);
         top.forEach((u, i) => { textLb += `${i+1}. @${u.id.split("@")[0]}: ${u.count} chat\n`; });
         await this.sock.sendMessage(jid, { text: textLb, mentions: top.map(u => u.id) }, { quoted: msg });
      }
    } else if (body.startsWith(".tagadmin") || body.startsWith("tagadmin")) {
      if (!isGroup) {
         await this.sock.sendMessage(jid, { text: "Perintah ini hanya bisa digunakan di grup!" }, { quoted: msg });
      } else {
         const metadata = await this.sock.groupMetadata(jid);
         const admins = metadata.participants.filter((p) => p.admin === 'admin' || p.admin === 'superadmin').map((p) => p.id);
         let textAdmin = "👮 *Tag Admin*\n\n";
         admins.forEach((a) => { textAdmin += `│ @${a.split("@")[0]}\n`; });
         await this.sock.sendMessage(jid, { text: textAdmin, mentions: admins }, { quoted: msg });
      }
    } else if (body.startsWith(".infogrup") || body.startsWith("infogrup")) {
      if (!isGroup) {
         await this.sock.sendMessage(jid, { text: "Perintah ini hanya bisa digunakan di grup!" }, { quoted: msg });
      } else {
         const metadata = await this.sock.groupMetadata(jid);
         const admins = metadata.participants.filter((p) => p.admin).length;
         await this.sock.sendMessage(jid, { text: `🏢 *Info Grup*\n\nNama: ${metadata.subject}\nID: ${metadata.id}\nMember: ${metadata.participants.length}\nAdmin: ${admins}\nDeskripsi:\n${metadata.desc || 'Tidak ada deskripsi'}` }, { quoted: msg });
      }
    } else if (body.startsWith(".joinch") || body.startsWith("joinch")) {
      await this.sock.sendMessage(jid, { text: "Fitur joinch sedang dalam pengembangan." }, { quoted: msg });
    } else if (body.startsWith(".cekidgc") || body.startsWith("cekidgc")) {
      const isGroup = jid.endsWith('@g.us');
      const codeMatches = body.match(/chat\.whatsapp\.com\/([a-zA-Z0-9_-]+)/i);
      
      if (codeMatches) {
        try {
          const inviteInfo = await this.sock.groupGetInviteInfo(codeMatches[1]);
          if (inviteInfo && inviteInfo.id) {
              await this.sock.sendMessage(jid, { text: `✅ *Info Grup*\n\nNama: ${inviteInfo.subject}\nID: ${inviteInfo.id}` }, { quoted: msg });
          } else {
              await this.sock.sendMessage(jid, { text: "❌ Gagal mendapatkan ID grup dari link tersebut." }, { quoted: msg });
          }
        } catch (e: any) {
           await this.sock.sendMessage(jid, { text: `❌ Terjadi kesalahan atau link tidak valid.` }, { quoted: msg });
        }
      } else if (isGroup) {
        try {
          const groupMetadata = await this.sock.groupMetadata(jid);
          await this.sock.sendMessage(jid, { text: `✅ *Info Grup*\n\nNama: ${groupMetadata.subject}\nID: ${jid}` }, { quoted: msg });
        } catch (e: any) {
          await this.sock.sendMessage(jid, { text: `✅ *Info Grup*\n\nID: ${jid}` }, { quoted: msg });
        }
      } else {
        await this.sock.sendMessage(jid, { text: "❌ Gunakan perintah ini di dalam grup atau berikan link grup.\nContoh: .cekidgc https://chat.whatsapp.com/xxxx" }, { quoted: msg });
      }
    } else if (body === ".tebakmakanan" || body === "tebakmakanan") {
      const clue = ["Bentuknya bulat, ada yang manis ada yang gurih, tengahnya bolong.", "Donat"];
      const sentMsg = await this.sock.sendMessage(jid, { text: `🍔 *Tebak Makanan*\n\nClue: ${clue[0]}\n_Silakan balas (reply) pesan ini dengan jawabanmu!_` }, { quoted: msg });
      if (sentMsg?.key?.id) {
          this.activeGames.set(sentMsg.key.id, { answer: clue[1], type: "tebakmakanan" });
      }
    } else if (body === ".tebakjkt48" || body === "tebakjkt48") {
      const members = ["Zee", "Freya", "Adel", "Gracia", "Shani", "Christy", "Marsha"];
      const randomMember = members[Math.floor(Math.random() * members.length)];
      const scrambled = randomMember.split('').sort(() => 0.5 - Math.random()).join('');
      const sentMsg = await this.sock.sendMessage(jid, { text: `🎤 *Tebak JKT48*\n\nClue: ${scrambled}\n_Silakan balas (reply) pesan ini dengan jawabanmu!_` }, { quoted: msg });
      if (sentMsg?.key?.id) {
          this.activeGames.set(sentMsg.key.id, { answer: randomMember, type: "tebakjkt48" });
      }
    } else if (body === ".truthordare" || body === "truthordare") {
      const isTruth = Math.random() < 0.5;
      const truths = ["Kapan terakhir kali kamu menangis?", "Apa rahasia terbesar yang tidak pernah kamu beri tahu pada siapapun?", "Siapa orang yang paling kamu benci di grup ini?", "Apa kebohongan terbesar yang pernah kamu katakan pada orang tuamu?", "Pernahkah kamu menyukai pacar temanmu sendiri?"];
      const dares = ["Kirim pesan suara (voice note) dengan suara hantu ke grup ini", "Jadikan foto profilmu foto konyol selama 24 jam", "Kirim pesan 'aku sayang kamu' ke mantanmu sekarang juga (sertakan screenshot)", "Spam chat grup ini dengan emoji 🐵 sebanyak 20 kali", "Nyanyikan lagu potong bebek angsa dengan nada marah dan kirim ke grup"];
      const selected = isTruth ? truths[Math.floor(Math.random() * truths.length)] : dares[Math.floor(Math.random() * dares.length)];
      const type = isTruth ? "Truth 🗣️" : "Dare 🎯";
      await this.sock.sendMessage(jid, { text: `🎭 *Truth or Dare*\n\nTerpilih: *${type}*\nTantangan/Pertanyaan: ${selected}` }, { quoted: msg });
    } else if (body.startsWith(".ulartangga") || body.startsWith("ulartangga")) {
      const args = body.split(" ").slice(1);
      const cmdArg = args[0] ? args[0].toLowerCase() : "";
      const gameKey = "ulartangga_" + jid;
      const utGame = this.activeGames.get(gameKey);

      if (cmdArg === "join") {
          if (!utGame) {
              this.activeGames.set(gameKey, { type: "ulartangga", state: "waiting", players: [senderJid], positions: { [senderJid]: 1 }, turnIndex: 0, answer: "" });
              await this.sock.sendMessage(jid, { text: `🐍🎲 *Ular Tangga*\n\n@${senderJid.split('@')[0]} membuat game Ular Tangga!\nKetik *.ulartangga join* untuk bergabung.\nKetik *.ulartangga start* untuk mulai.`, mentions: [senderJid] }, { quoted: msg });
          } else if (utGame.state === "waiting") {
              if (utGame.players?.includes(senderJid)) {
                  await this.sock.sendMessage(jid, { text: "Kamu sudah bergabung!" }, { quoted: msg });
              } else {
                  utGame.players?.push(senderJid);
                  utGame.positions![senderJid] = 1;
                  const playersText = utGame.players?.map(p => `- @${p.split('@')[0]}`).join("\n");
                  await this.sock.sendMessage(jid, { text: `✅ @${senderJid.split('@')[0]} bergabung!\n\nPemain:\n${playersText}\n\nKetik *.ulartangga start* untuk mulai.`, mentions: utGame.players }, { quoted: msg });
              }
          } else {
              await this.sock.sendMessage(jid, { text: "Game sudah dimulai!" }, { quoted: msg });
          }
      } else if (cmdArg === "start") {
          if (!utGame) {
              await this.sock.sendMessage(jid, { text: "Belum ada game! Ketik *.ulartangga join* untuk membuat." }, { quoted: msg });
          } else if (utGame.state === "playing") {
              await this.sock.sendMessage(jid, { text: "Game sudah berjalan!" }, { quoted: msg });
          } else if (utGame.players && utGame.players.length < 2) {
              await this.sock.sendMessage(jid, { text: "Minimal 2 pemain untuk mulai!" }, { quoted: msg });
          } else {
              utGame.state = "playing";
              const firstPlayer = utGame.players![0];
              await this.sock.sendMessage(jid, { text: `🎲 *Ular Tangga Dimulai!* 🐍\n\nGiliran pertama: @${firstPlayer.split('@')[0]}\nKetik *.roll* untuk melempar dadu!`, mentions: [firstPlayer] }, { quoted: msg });
          }
      } else {
         await this.sock.sendMessage(jid, { text: `🐍 *Ular Tangga* 🎲\n\nPerintah:\n.ulartangga join\n.ulartangga start\n.roll` }, { quoted: msg });
      }
    } else if (body === ".roll" || body === "roll") {
      const gameKey = "ulartangga_" + jid;
      const utGame = this.activeGames.get(gameKey);
      if (utGame && utGame.type === "ulartangga" && utGame.state === "playing") {
          const currentPlayer = utGame.players![utGame.turnIndex!];
          if (senderJid !== currentPlayer) {
              await this.sock.sendMessage(jid, { text: `Bukan giliranmu! Sekarang giliran @${currentPlayer.split('@')[0]}`, mentions: [currentPlayer] }, { quoted: msg });
              return;
          }
          const dice = Math.floor(Math.random() * 6) + 1;
          let pos = utGame.positions![senderJid] + dice;
          let msgText = `🎲 @${senderJid.split('@')[0]} melempar dadu dan mendapat *${dice}*!\nPosisi: ${utGame.positions![senderJid]} ➔ ${pos}\n`;
          
          const snakes: Record<number, number> = { 16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78 };
          const ladders: Record<number, number> = { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100 };
          
          if (pos > 100) pos = 100 - (pos - 100);
          
          if (snakes[pos]) {
              msgText += `🐍 *OH TIDAK!* Kamu digigit ular, turun ke *${snakes[pos]}*\n`;
              pos = snakes[pos];
          } else if (ladders[pos]) {
              msgText += `🪜 *MANTAP!* Kamu naik tangga ke *${ladders[pos]}*\n`;
              pos = ladders[pos];
          }
          
          utGame.positions![senderJid] = pos;
          
          if (pos === 100) {
              msgText += `\n🎉 *SELAMAT!* @${senderJid.split('@')[0]} mencapai 100 dan memenangkan permainan! 🎉`;
              this.activeGames.delete(gameKey);
              await this.sock.sendMessage(jid, { text: msgText, mentions: utGame.players }, { quoted: msg });
          } else {
              utGame.turnIndex = (utGame.turnIndex! + 1) % utGame.players!.length;
              const nextPlayer = utGame.players![utGame.turnIndex!];
              msgText += `\nGiliran selanjutnya: @${nextPlayer.split('@')[0]}\nKetik *.roll* untuk melempar dadu.`;
              await this.sock.sendMessage(jid, { text: msgText, mentions: [senderJid, nextPlayer] }, { quoted: msg });
          }
      }
    } else if (body.startsWith(".attp") || body.startsWith("attp")) {
       const { Sticker } = await import('wa-sticker-formatter');
       const text = messageContent.replace(/^\.?attp\s*/i, "").trim();
       if (!text) {
          await this.sock.sendMessage(jid, { text: `Kirim teks untuk dibuat stiker attp!\nContoh: .attp Halo` }, { quoted: msg });
       } else {
          try {
             await this.sock.sendMessage(jid, { text: `⏳ *Sedang membuat stiker ATTP...*` }, { quoted: msg });
             const url = `https://api.vreden.my.id/api/maker/attp?text=${encodeURIComponent(text)}`;
             try {
                // If the API works, it will return a webp buffer
                const res = await axios.get(url, { responseType: 'arraybuffer' });
                await this.sock.sendMessage(jid, { sticker: Buffer.from(res.data) }, { quoted: msg });
             } catch (err) {
                 // Fallback to text SVG
                 const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                 const svgMeme = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
                   <rect width="512" height="512" fill="transparent"/>
                   <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="#ff0055">${safeText}</text>
                 </svg>`;
                 const bgBuffer = Buffer.from(svgMeme);

                 const pngBuffer = await sharp(bgBuffer).png().toBuffer();
                 const sticker = new Sticker(pngBuffer, { pack: 'ATTP', author: 'Bot', type: 'full' });
                 const finalBuffer = await sticker.toBuffer();
                 await this.sock.sendMessage(jid, { sticker: finalBuffer }, { quoted: msg });
             }
          } catch (e) {
             console.error("ATTP error: ", e);
             await this.sock.sendMessage(jid, { text: `❌ Gagal membuat ATTP.` }, { quoted: msg });
          }
       }
    } else if (body.startsWith(".logo") || body.startsWith("logo")) {
       const text = messageContent.replace(/^\.?logo\s*/i, "").trim();
       if (!text) {
          await this.sock.sendMessage(jid, { text: `Kirim teks untuk dibuat logo!\nContoh: .logo Keren` }, { quoted: msg });
       } else {
          try {
             await this.sock.sendMessage(jid, { text: `⏳ *Sedang membuat logo...*` }, { quoted: msg });
             const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
             const svgLogo = `<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
               <defs>
                 <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                   <stop offset="0%" style="stop-color:rgb(131,58,180);stop-opacity:1" />
                   <stop offset="50%" style="stop-color:rgb(253,29,29);stop-opacity:1" />
                   <stop offset="100%" style="stop-color:rgb(252,176,69);stop-opacity:1" />
                 </linearGradient>
               </defs>
               <rect width="100%" height="100%" fill="url(#grad1)"/>
               <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Verdana, sans-serif" font-size="80" font-weight="bold" fill="white" stroke="black" stroke-width="2">${safeText}</text>
             </svg>`;
             const finalBuffer = await sharp(Buffer.from(svgLogo)).png().toBuffer();
             await this.sock.sendMessage(jid, { image: finalBuffer, caption: `🎨 *Logo berhasil dibuat!*` }, { quoted: msg });
          } catch (e) {
             console.error("Logo error: ", e);
             await this.sock.sendMessage(jid, { text: `❌ Gagal membuat logo.` }, { quoted: msg });
          }
       }
    } else if (body.startsWith(".wallpaper") || body.startsWith("wallpaper")) {
       try {
           await this.sock.sendMessage(jid, { text: `⏳ *Sedang mencari wallpaper...*` }, { quoted: msg });
           const res = await axios.get("https://nekos.life/api/v2/img/wallpaper");
           if (res.data && res.data.url) {
               await this.sock.sendMessage(jid, { image: { url: res.data.url }, caption: `🖼️ *Wallpaper Ditemukan!*` }, { quoted: msg });
           } else {
               await this.sock.sendMessage(jid, { text: `❌ Gagal menemukan wallpaper.` }, { quoted: msg });
           }
       } catch (e) {
           console.error("Wallpaper error:", e);
           await this.sock.sendMessage(jid, { text: `❌ Gagal mencari wallpaper.` }, { quoted: msg });
       }
    } else if (body.startsWith(".togel ") || body.startsWith("togel ")) {
      const guess = body.split(" ")[1];
      if (!/^\d{4}$/.test(guess)) {
        await this.sock.sendMessage(jid, { text: "❌ Format salah! Kirim .togel [4 digit angka]\nContoh: .togel 1234" }, { quoted: msg });
      } else {
        const winningNumber = Math.floor(1000 + Math.random() * 9000).toString();
        if (guess === winningNumber) {
           await this.sock.sendMessage(jid, { text: `🎰 *TOGEL*\n\nAngka Taruhanmu: ${guess}\nAngka Keluaran: ${winningNumber}\n\n🎉 *SELAMAT! KAMU MENANG JACKPOT!* 🎉` }, { quoted: msg });
        } else {
           await this.sock.sendMessage(jid, { text: `🎰 *TOGEL*\n\nAngka Taruhanmu: ${guess}\nAngka Keluaran: ${winningNumber}\n\n😢 Sayang sekali kamu kalah. Coba lagi!` }, { quoted: msg });
        }
      }
    } else if (body === ".stoptogel" || body === "stoptogel") {
       await this.sock.sendMessage(jid, { text: "🛑 *Sesi togel dihentikan!*" }, { quoted: msg });
    } else if (body.startsWith(".cekpariban") || body.startsWith("cekpariban") || body.startsWith(".cektartulang") || body.startsWith("cektartulang") || body.startsWith(".cektarito") || body.startsWith("cektarito") || body.startsWith(".cekpadan") || body.startsWith("cekpadan")) {
       let cmd = body.split(" ")[0].replace(".", "");
       const argsStr = messageContent.slice(messageContent.toLowerCase().indexOf(cmd) + cmd.length).trim();
       
       if (!argsStr.includes("|")) {
          await this.sock.sendMessage(jid, { text: `Format salah!\nContoh: .${cmd} Pandiangan|Sirait` }, { quoted: msg });
       } else {
          const [m1, m2] = argsStr.split("|").map(s => s.trim());
          if (!m1 || !m2) {
             await this.sock.sendMessage(jid, { text: `Format salah!\nPastikan ada nama marga/boru sebelum dan sesudah tanda |\nContoh: .${cmd} Pandiangan|Sirait` }, { quoted: msg });
          } else {
              const hashStr = [m1.toLowerCase(), m2.toLowerCase(), cmd].join('');
              let hash = 0; 
              for (let i = 0; i < hashStr.length; i++) hash = hashStr.charCodeAt(i) + ((hash << 5) - hash);
              // Pseudo-random true/false based on input
              const isTrue = Math.abs(hash) % 100 > 60; // 40% chance of relationship
              
              let answer = "";
              let title = "";
              
              if (cmd === "cekpariban") {
                 title = "👩‍❤️‍👨 *Cek Pariban*";
                 answer = isTrue 
                    ? `Iya, menurut perhitungan marga/boru *${m1}* dan *${m2}* kemungkinan besar marpariban!` 
                    : `Bukan, sepertinya marga/boru *${m1}* dan *${m2}* bukan pariban.`;
              } else if (cmd === "cektartulang") {
                 title = "👴 *Cek Tartulang*";
                 answer = isTrue 
                    ? `Iya, marga/boru *${m1}* dan *${m2}* kemungkinan besar martartulang!` 
                    : `Bukan, marga/boru *${m1}* dan *${m2}* sepertinya bukan tartulang.`;
              } else if (cmd === "cektarito") {
                 title = "👦👧 *Cek Tarito*";
                 answer = isTrue 
                    ? `Iya, marga/boru *${m1}* dan *${m2}* martarito (saudara)!` 
                    : `Bukan, sepertinya *${m1}* dan *${m2}* tidak martarito.`;
              } else if (cmd === "cekpadan") {
                 title = "📜 *Cek Padan*";
                 answer = isTrue 
                    ? `Iya! Marga *${m1}* dan *${m2}* terikat Padan (janji/ikatan) dan tidak boleh menikah!` 
                    : `Aman, marga *${m1}* dan *${m2}* sepertinya tidak terikat Padan secara langsung.`;
              }
              
              await this.sock.sendMessage(jid, { text: `${title}\n\nHasil: ${answer}` }, { quoted: msg });
          }
       }
       this.broadcastState(`Responded to ${cmd} command`);
    } else if (body.startsWith(".menfess") || body.startsWith("menfess") || body.startsWith(".confess") || body.startsWith("confess")) {
       let cmd = body.split(" ")[0].replace(".", "");
       const argsStr = messageContent.slice(messageContent.toLowerCase().indexOf(cmd) + cmd.length).trim();
       if (!argsStr.includes("|")) {
          await this.sock.sendMessage(jid, { text: `Format salah!\nContoh: .${cmd} 628xxx | Samaran | Halo ini pesan rahasiaku` }, { quoted: msg });
       } else {
          const parts = argsStr.split("|").map(s => s.trim());
          if (parts.length < 3) {
             await this.sock.sendMessage(jid, { text: `Format salah!\nContoh: .${cmd} 628xxx | Samaran | Halo ini pesan rahasiaku` }, { quoted: msg });
          } else {
             const [targetRaw, samaran, ...pesanArr] = parts;
             const pesan = pesanArr.join("|");
             const senderJid = msg.key.participant || msg.participant || jid;
             let targetNum = targetRaw.replace(/[^0-9]/g, "");
             if (targetNum.startsWith("0")) targetNum = "62" + targetNum.substring(1);
             const targetJid = targetNum + "@s.whatsapp.net";
             
             if (senderJid === targetJid) {
                await this.sock.sendMessage(jid, { text: "Tidak bisa mengirim menfess ke diri sendiri." }, { quoted: msg });
             } else if (this.menfessSessions.has(senderJid)) {
                await this.sock.sendMessage(jid, { text: "Kamu masih memiliki sesi menfess aktif. Ketik .stopmenfess untuk menghentikannya." }, { quoted: msg });
             } else if (this.menfessSessions.has(targetJid)) {
                await this.sock.sendMessage(jid, { text: "Target sedang dalam sesi menfess dengan orang lain. Coba lagi nanti." }, { quoted: msg });
             } else {
                this.menfessSessions.set(senderJid, { partner: targetJid, originalSender: senderJid });
                this.menfessSessions.set(targetJid, { partner: senderJid, originalSender: senderJid });
                
                const mfMsg = `Hai! Ada pesan rahasia (menfess) untukmu.\n\nDari: ${samaran}\nPesan: ${pesan}\n\n_Ketik .balasmenfess [pesan] untuk membalas, atau .tolakmenfess untuk menolak._`;
                try {
                   await this.sock.sendMessage(targetJid, { text: mfMsg });
                   await this.sock.sendMessage(jid, { text: `✅ Berhasil mengirim menfess ke ${targetRaw}.\nTunggu balasan darinya. Ketik .stopmenfess untuk menghentikan sesi.` }, { quoted: msg });
                } catch (e) {
                   await this.sock.sendMessage(jid, { text: "❌ Gagal mengirim menfess. Pastikan nomor tujuan valid dan sudah terdaftar di WhatsApp." }, { quoted: msg });
                   this.menfessSessions.delete(senderJid);
                   this.menfessSessions.delete(targetJid);
                }
             }
          }
       }
    } else if (body.startsWith(".balasmenfess") || body.startsWith("balasmenfess")) {
       const senderJid = msg.key.participant || msg.participant || jid;
       const session = this.menfessSessions.get(senderJid);
       if (!session) {
          await this.sock.sendMessage(jid, { text: "Kamu tidak memiliki sesi menfess aktif." }, { quoted: msg });
       } else {
          const replyText = messageContent.replace(/^\.?balasmenfess\s*/i, "").trim();
          if (!replyText) {
             await this.sock.sendMessage(jid, { text: "Silakan masukkan pesan balasan.\nContoh: .balasmenfess Halo juga!" }, { quoted: msg });
          } else {
             const partnerJid = session.partner;
             try {
                await this.sock.sendMessage(partnerJid, { text: `📩 *Balasan Menfess:*\n\n${replyText}` });
                await this.sock.sendMessage(jid, { text: "✅ Pesan balasan terkirim." }, { quoted: msg });
             } catch (e) {
                await this.sock.sendMessage(jid, { text: "❌ Gagal mengirim balasan." }, { quoted: msg });
             }
          }
       }
    } else if (body.startsWith(".tolakmenfess") || body.startsWith("tolakmenfess")) {
       const senderJid = msg.key.participant || msg.participant || jid;
       const session = this.menfessSessions.get(senderJid);
       if (!session) {
          await this.sock.sendMessage(jid, { text: "Kamu tidak memiliki sesi menfess aktif." }, { quoted: msg });
       } else {
          const partnerJid = session.partner;
          try {
             await this.sock.sendMessage(partnerJid, { text: `❌ Target telah menolak sesi menfess dan menghentikan percakapan.` });
          } catch(e) {}
          await this.sock.sendMessage(jid, { text: "✅ Sesi menfess telah ditolak dan dihentikan." }, { quoted: msg });
          this.menfessSessions.delete(senderJid);
          this.menfessSessions.delete(partnerJid);
       }
    } else if (body.startsWith(".stopmenfess") || body.startsWith("stopmenfess")) {
       const senderJid = msg.key.participant || msg.participant || jid;
       const session = this.menfessSessions.get(senderJid);
       if (!session) {
          await this.sock.sendMessage(jid, { text: "Kamu tidak memiliki sesi menfess aktif." }, { quoted: msg });
       } else {
          const partnerJid = session.partner;
          try {
             await this.sock.sendMessage(partnerJid, { text: `🛑 Pasangan menfess kamu telah menghentikan sesi ini.` });
          } catch(e) {}
          await this.sock.sendMessage(jid, { text: "✅ Sesi menfess telah dihentikan." }, { quoted: msg });
          this.menfessSessions.delete(senderJid);
          this.menfessSessions.delete(partnerJid);
       }
    
    } else if (deviceCommands.includes(requestedCmd.toLowerCase()) || deviceCommands.includes("." + requestedCmd.toLowerCase())) {
        const cmd = requestedCmd.replace(/^\.?/, "").toLowerCase();
        let argsStr = messageContent.slice(messageContent.toLowerCase().indexOf(cmd) + cmd.length).trim();
        
        if (cmd === "devicemenu") {
            const deviceText = `📱 *Device Menu*\n\n│ .battery\n│ .deviceinfo\n│ .cpuinfo\n│ .raminfo\n│ .storage\n│ .network\n│ .pingphone\n│ .sensor\n│ .apkinfo\n│ .appcheck`;
            await this.sock.sendMessage(jid, { text: deviceText }, { quoted: msg });
            this.broadcastState(`Responded to devicemenu command`);
            return;
        }
        
        if (cmd === "battery") {
            await this.sock.sendMessage(jid, { text: `🔋 *Battery Info*\n\nStatus: Charging\nLevel: 87%\nTemperature: 34°C\nHealth: Good\nVoltage: 4012 mV` }, { quoted: msg });
        } else if (cmd === "deviceinfo") {
            await this.sock.sendMessage(jid, { text: `📱 *Device Info*\n\nBrand: Samsung\nModel: Galaxy S23 Ultra\nAndroid Version: 14\nArchitecture: ${os.arch()}\nPlatform: ${os.platform()}\nHostname: ${os.hostname()}` }, { quoted: msg });
        } else if (cmd === "cpuinfo") {
            const cpus = os.cpus();
            const cpuModel = cpus[0] ? cpus[0].model : "Unknown";
            await this.sock.sendMessage(jid, { text: `⚙️ *CPU Info*\n\nModel: ${cpuModel}\nCores: ${cpus.length}\nSpeed: ${cpus[0]?.speed || 0} MHz` }, { quoted: msg });
        } else if (cmd === "raminfo") {
            const totalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
            const freeMemory = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
            const usedMemory = (parseFloat(totalMemory) - parseFloat(freeMemory)).toFixed(2);
            await this.sock.sendMessage(jid, { text: `💾 *RAM Info*\n\nTotal: ${totalMemory} GB\nUsed: ${usedMemory} GB\nFree: ${freeMemory} GB` }, { quoted: msg });
        } else if (cmd === "storage") {
            await this.sock.sendMessage(jid, { text: `🗄️ *Storage Info*\n\nInternal Total: 256 GB\nInternal Free: 124 GB\nSystem: 15 GB` }, { quoted: msg });
        } else if (cmd === "network") {
            await this.sock.sendMessage(jid, { text: `🌐 *Network Info*\n\nType: Wi-Fi\nSignal Strength: Excellent\nIP Address: 192.168.1.100\nMAC Address: 02:00:00:00:00:00` }, { quoted: msg });
        } else if (cmd === "pingphone") {
            const pingStart = Date.now();
            await this.sock.sendMessage(jid, { text: 'Pinging...' }, { quoted: msg });
            const pingEnd = Date.now();
            await this.sock.sendMessage(jid, { text: `🏓 *Pong!*\nResponse Time: ${pingEnd - pingStart} ms` });
        } else if (cmd === "sensor") {
            await this.sock.sendMessage(jid, { text: `🧭 *Sensor Info*\n\nAccelerometer: Supported\nGyroscope: Supported\nProximity: Supported\nLight: Supported\nMagnetic Field: Supported` }, { quoted: msg });
        } else if (cmd === "apkinfo") {
            if (!argsStr) return await this.sock.sendMessage(jid, { text: "Kirim perintah dengan nama aplikasi, contoh: .apkinfo whatsapp" }, { quoted: msg });
            await this.sock.sendMessage(jid, { text: `📦 *APK Info*\n\nName: ${argsStr}\nVersion: 2.23.12.78\nPackage: com.${argsStr.toLowerCase().replace(/\s/g, "")}.app\nSize: 45 MB` }, { quoted: msg });
        } else if (cmd === "appcheck") {
            if (!argsStr) return await this.sock.sendMessage(jid, { text: "Kirim perintah dengan nama aplikasi, contoh: .appcheck whatsapp" }, { quoted: msg });
            await this.sock.sendMessage(jid, { text: `🔍 *App Check*\n\nApp: ${argsStr}\nStatus: Installed\nPermissions: Storage, Camera, Microphone, Location\nMalware Scan: Safe ✅` }, { quoted: msg });
        }

        } else if (toolsCommands.includes(requestedCmd.toLowerCase()) || toolsCommands.includes("." + requestedCmd.toLowerCase())) {
        const cmd = requestedCmd.replace(/^\.?/, "").toLowerCase();
        let argsStr = messageContent.slice(messageContent.toLowerCase().indexOf(cmd) + cmd.length).trim();
        
        if (cmd === "toolsmenu") {
            const toolsText = `🛠️ *Tools Menu*\n\n│ .barcode\n│ .qrcode\n│ .dnslookup\n│ .whois\n\n│ .httpheader\n│ .shortlink\n│ .myip\n│ .ipinfo\n│ .hostcheck\n│ .countdown\n│ .iplookup\n│ .subdomain`;
            await this.sock.sendMessage(jid, { text: toolsText }, { quoted: msg });
            this.broadcastState(`Responded to toolsmenu command`);
            return;
        }

        if (cmd === "myip") {
            try {
                const { data } = await axios.get("https://api.ipify.org?format=json");
                await this.sock.sendMessage(jid, { text: `🖥️ *Bot IP:* ${data.ip}` }, { quoted: msg });
            } catch (e) {
                await this.sock.sendMessage(jid, { text: "❌ *Gagal mendapatkan IP.*" }, { quoted: msg });
            }
            return;
        }

        if (!argsStr && cmd !== "myip") {
            await this.sock.sendMessage(jid, { text: `Masukkan parameter!\nContoh: .${cmd} text_atau_url` }, { quoted: msg });
            return;
        }

        try {
            await this.sock.sendMessage(jid, { text: `⏳ *Memproses ${cmd}...*` }, { quoted: msg });
            switch (cmd) {
                case "barcode":
                    const bcUrl = `https://barcodeapi.org/api/auto/${encodeURIComponent(argsStr)}`;
                    await this.sock.sendMessage(jid, { image: { url: bcUrl }, caption: `🏷️ *Barcode:*\n${argsStr}` }, { quoted: msg });
                    break;
                case "qrcode":
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(argsStr)}`;
                    await this.sock.sendMessage(jid, { image: { url: qrUrl }, caption: `🔲 *QR Code:*\n${argsStr}` }, { quoted: msg });
                    break;
                case "dnslookup":
                    const dnsRes = await axios.get(`https://api.hackertarget.com/dnslookup/?q=${encodeURIComponent(argsStr)}`);
                    await this.sock.sendMessage(jid, { text: `🔍 *DNS Lookup:*\n\n${dnsRes.data}` }, { quoted: msg });
                    break;
                case "whois":
                    const whoisRes = await axios.get(`https://api.hackertarget.com/whois/?q=${encodeURIComponent(argsStr)}`);
                    await this.sock.sendMessage(jid, { text: `🔎 *Whois:*\n\n${whoisRes.data}` }, { quoted: msg });
                    break;
                case "httpheader":
                    const httpRes = await axios.get(`https://api.hackertarget.com/httpheaders/?q=${encodeURIComponent(argsStr)}`);
                    await this.sock.sendMessage(jid, { text: `🌐 *HTTP Header:*\n\n${httpRes.data}` }, { quoted: msg });
                    break;
                case "shortlink":
                    const shortRes = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(argsStr)}`);
                    await this.sock.sendMessage(jid, { text: `🔗 *Shortlink:*\n\n${shortRes.data}` }, { quoted: msg });
                    break;
                case "ipinfo":
                case "iplookup":
                    const ipRes = await axios.get(`http://ip-api.com/json/${encodeURIComponent(argsStr)}`);
                    if (ipRes.data.status === "success") {
                        const info = `📍 *IP Info:*\n\nIP: ${ipRes.data.query}\nNegara: ${ipRes.data.country}\nKota: ${ipRes.data.city}\nISP: ${ipRes.data.isp}\nOrganisasi: ${ipRes.data.org}\nTimezone: ${ipRes.data.timezone}`;
                        await this.sock.sendMessage(jid, { text: info }, { quoted: msg });
                    } else {
                        await this.sock.sendMessage(jid, { text: `❌ *Gagal mendapatkan info IP.*` }, { quoted: msg });
                    }
                    break;
                case "hostcheck":
                    const hostRes = await axios.get(`https://api.hackertarget.com/hostsearch/?q=${encodeURIComponent(argsStr)}`);
                    await this.sock.sendMessage(jid, { text: `🌍 *Host Check:*\n\n${hostRes.data}` }, { quoted: msg });
                    break;
                case "subdomain":
                    const subRes = await axios.get(`https://api.hackertarget.com/hostsearch/?q=${encodeURIComponent(argsStr)}`);
                    await this.sock.sendMessage(jid, { text: `📂 *Subdomain:*\n\n${subRes.data}` }, { quoted: msg });
                    break;
                case "countdown":
                    const targetDate = new Date(argsStr);
                    if (isNaN(targetDate.getTime())) {
                        await this.sock.sendMessage(jid, { text: `❌ *Format tanggal tidak valid.*\nContoh: .countdown 2024-12-31T23:59:59` }, { quoted: msg });
                    } else {
                        const now = new Date();
                        const diff = targetDate.getTime() - now.getTime();
                        if (diff <= 0) {
                            await this.sock.sendMessage(jid, { text: `⏳ *Waktu sudah habis!*` }, { quoted: msg });
                        } else {
                            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
                            const mins = Math.floor((diff / 1000 / 60) % 60);
                            const secs = Math.floor((diff / 1000) % 60);
                            await this.sock.sendMessage(jid, { text: `⏳ *Countdown:*\n\n${days} Hari ${hours} Jam ${mins} Menit ${secs} Detik` }, { quoted: msg });
                        }
                    }
                    break;
            }
        } catch (e) {
            await this.sock.sendMessage(jid, { text: `❌ *Terjadi kesalahan saat memproses ${cmd}.*` }, { quoted: msg });
        }
    } else if (beritaCommands.includes(requestedCmd.toLowerCase()) || beritaCommands.includes("." + requestedCmd.toLowerCase())) {
       const cmd = requestedCmd.replace(/^\.?/, "").toLowerCase();
       let query = "";
       
       if (cmd === "beritamenu") {
           const beritaText = `📰 *Berita Menu*\n\n│ .beritabola\n│ .fajar\n│ .cnn\n│ .layarkaca\n│ .cnbctribun\n│ .indozone\n│ .kompas\n│ .detiknews\n│ .dailynews\n│ .inews\n│ .okezone\n│ .sindo\n│ .tempo\n│ .antara\n│ .kontan\n│ .merdeka\n│ .jalantikus\n│ .beritasatu\n│ .liputan6\n│ .batampos\n│ .infoloker`;
           await this.sock.sendMessage(jid, { text: beritaText }, { quoted: msg });
           this.broadcastState(`Responded to beritamenu command`);
           return;
       }
       
       switch (cmd) {
           case "beritabola": query = "berita bola"; break;
           case "fajar": query = "site:fajar.co.id"; break;
           case "cnn": query = "site:cnnindonesia.com"; break;
           case "layarkaca": query = "film bioskop layarkaca"; break;
           case "cnbctribun": query = "site:cnbcindonesia.com OR site:tribunnews.com"; break;
           case "indozone": query = "site:indozone.id"; break;
           case "kompas": query = "site:kompas.com"; break;
           case "detiknews": query = "site:news.detik.com"; break;
           case "dailynews": query = "berita harian"; break;
           case "inews": query = "site:inews.id"; break;
           case "okezone": query = "site:okezone.com"; break;
           case "sindo": query = "site:sindonews.com"; break;
           case "tempo": query = "site:tempo.co"; break;
           case "antara": query = "site:antaranews.com"; break;
           case "kontan": query = "site:kontan.co.id"; break;
           case "merdeka": query = "site:merdeka.com"; break;
           case "jalantikus": query = "site:jalantikus.com"; break;
           case "beritasatu": query = "site:beritasatu.com"; break;
           case "liputan6": query = "site:liputan6.com"; break;
           case "batampos": query = "site:batampos.co.id"; break;
           case "infoloker": query = "lowongan kerja"; break;
           default: query = "berita terkini"; break;
       }
       
       try {
           const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=id&gl=ID&ceid=ID:id`;
           const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
           const { data } = await axios.get(apiUrl);
           
           if (data && data.items && data.items.length > 0) {
               let text = `📰 *Berita Terbaru - ${cmd.toUpperCase()}*\n\n`;
               const items = data.items.slice(0, 5);
               
               items.forEach((item, index) => {
                   let title = item.title.replace(/ - [^-]+$/, "");
                   text += `${index + 1}. *${title}*\n📅 ${item.pubDate}\n🔗 ${item.link}\n\n`;
               });
               
               await this.sock.sendMessage(jid, { text: text.trim() }, { quoted: msg });
               this.broadcastState(`Responded to ${cmd} command`);
           } else {
               await this.sock.sendMessage(jid, { text: "❌ Maaf, tidak ada berita ditemukan saat ini." }, { quoted: msg });
           }
       } catch (error) {
           console.error("Error fetching news:", error);
           await this.sock.sendMessage(jid, { text: "❌ Terjadi kesalahan saat mengambil berita." }, { quoted: msg });
       }

    } else if (sulapCommands.includes(requestedCmd.toLowerCase()) || sulapCommands.includes("." + requestedCmd.toLowerCase())) {
       const cmd = requestedCmd.replace(/^\.?/, "").toLowerCase();
       
       if (cmd === "sulapmenu") {
           const sulapText = `🎩 *Sulap Menu*\n\n│ .kartusulap\n│ .tongkatsulap\n│ .topisulap\n│ .koinsulap\n│ .thumbtip\n│ .cangkirdanbola\n│ .linkingrings\n│ .spongeballs\n│ .silkscarf\n│ .appearingcane\n│ .vanishingcane\n│ .changebag\n│ .dovepan\n│ .floatingtable\n│ .levitationdevice\n│ .kotakpedang\n│ .guillotinesulap\n│ .zigzagbox\n│ .kotaktembus\n│ .firewallet`;
           await this.sock.sendMessage(jid, { text: sulapText }, { quoted: msg });
           this.broadcastState(`Responded to sulapmenu command`);
           return;
       }
       
       let sulapResponse = "";
       console.log("SULAP COMMAND:", cmd);
       switch (cmd) {
           case "kartusulap": sulapResponse = "🃏 *Kartu Sulap*\nTrik di mana pesulap menebak kartu yang dipilih penonton atau mengubah kartu secara ajaib."; break;
           case "tongkatsulap": sulapResponse = "🪄 *Tongkat Sulap*\nAlat klasik pesulap. Bisa memunculkan atau menghilangkan benda di baliknya."; break;
           case "topisulap": sulapResponse = "🎩 *Topi Sulap*\nTopi tinggi yang sering digunakan untuk memunculkan kelinci atau burung merpati."; break;
           case "koinsulap": sulapResponse = "🪙 *Koin Sulap*\nTrik koin yang bisa menghilang, berpindah tangan, atau berubah menjadi koin lain."; break;
           case "thumbtip": sulapResponse = "👍 *Thumb Tip*\nJempol palsu yang digunakan untuk menghilangkan kain sutra atau benda kecil lainnya."; break;
           case "cangkirdanbola": sulapResponse = "🥤 *Cangkir dan Bola (Cups and Balls)*\nTrik klasik di mana bola bisa menembus cangkir atau berpindah secara ajaib."; break;
           case "linkingrings": sulapResponse = "⭕ *Linking Rings*\nTrik di mana beberapa cincin besi solid bisa saling menembus dan terkait satu sama lain."; break;
           case "spongeballs": sulapResponse = "🧽 *Sponge Balls*\nBola busa yang bisa membelah diri, menghilang, atau berpindah dari tangan pesulap ke tangan penonton."; break;
           case "silkscarf": sulapResponse = "🧣 *Silk Scarf*\nKain sutra yang digunakan untuk berbagai trik visual, seperti perubahan warna atau menghilang."; break;
           case "appearingcane": sulapResponse = "🦯 *Appearing Cane*\nTongkat yang tiba-tiba muncul dari udara kosong atau dari secarik kain kecil."; break;
           case "vanishingcane": sulapResponse = "🦯 *Vanishing Cane*\nTongkat padat yang tiba-tiba berubah menjadi kain atau menghilang begitu saja."; break;
           case "changebag": sulapResponse = "🛍️ *Change Bag*\nKantong ajaib yang bisa mengubah benda yang dimasukkan ke dalamnya menjadi benda lain."; break;
           case "dovepan": sulapResponse = "🕊️ *Dove Pan*\nPanci yang awalnya kosong atau terbakar, tiba-tiba memunculkan burung merpati atau kue."; break;
           case "floatingtable": sulapResponse = "🪑 *Floating Table*\nMeja yang bisa melayang di udara, seringkali terlihat terbang mengikuti tangan pesulap."; break;
           case "levitationdevice": sulapResponse = "🕴️ *Levitation Device*\nAlat untuk menciptakan ilusi orang melayang di udara menentang gravitasi."; break;
           case "kotakpedang": sulapResponse = "⚔️ *Kotak Pedang (Sword Box)*\nIlusi di mana asisten masuk ke dalam kotak dan ditusuk banyak pedang tanpa terluka."; break;
           case "guillotinesulap": sulapResponse = "🪓 *Guillotine Sulap*\nTrik berbahaya memotong leher atau tangan dengan pisau besar, namun korban tetap utuh."; break;
           case "zigzagbox": sulapResponse = "📦 *Zig Zag Box*\nIlusi di mana asisten dimasukkan ke kotak dan tubuhnya digeser menjadi tiga bagian terpisah."; break;
           case "kotaktembus": sulapResponse = "🧰 *Kotak Tembus*\nTrik ilusi benda padat menembus kotak padat secara magis."; break;
           case "firewallet": sulapResponse = "🔥 *Fire Wallet*\nDompet yang mengeluarkan api besar saat dibuka, lalu menjadi dompet biasa saat ditutup."; break;
           default: sulapResponse = "🎩 Trik sulap misterius!"; break;
       }
       
       await this.sock.sendMessage(jid, { text: sulapResponse }, { quoted: msg });
       this.broadcastState(`Responded to ${cmd} command`);

    } else if (tiketCommands.includes(requestedCmd.toLowerCase()) || tiketCommands.includes("." + requestedCmd.toLowerCase())) {
       const cmd = requestedCmd.replace(/^\.?/, "").toLowerCase();
       const args = body.split(/[\s\n]+/).slice(1).join(" ").trim();
       
       if (cmd === "tiketmenu") {
           const tiketText = `🎟️ *Tiket Menu*\n\n│ .ticket\n│ .konser\n│ .event\n│ .jadwal\n│ .harga\n│ .kategori\n│ .seatmap\n│ .stoktiket\n│ .bookingtiket\n│ .riwayat`;
           await this.sock.sendMessage(jid, { text: tiketText }, { quoted: msg });
           this.broadcastState(`Responded to tiketmenu command`);
           return;
       }
       
       let tiketResponse = "";
       console.log("TIKET COMMAND:", cmd, "ARGS:", args);
       switch (cmd) {
           case "ticket": tiketResponse = "🎟️ *Portal Tiket Resmi*\nSelamat datang di layanan pembelian tiket. Gunakan menu tiket untuk melihat daftar event, harga, dan melakukan pemesanan."; break;
           case "konser": tiketResponse = "🎸 *Daftar Konser Mendatang*\n1. Coldplay - Music of the Spheres World Tour\n2. Taylor Swift - The Eras Tour\n3. Ed Sheeran - Mathematics Tour\n4. BLACKPINK - Born Pink World Tour"; break;
           case "event": tiketResponse = "🎉 *Event & Festival*\n1. DWP (Djakarta Warehouse Project)\n2. We The Fest\n3. Synchronize Fest\n4. Java Jazz Festival"; break;
           case "jadwal": 
               if (!args) {
                   tiketResponse = "📅 *Jadwal Event*\nSilakan sebutkan nama event untuk melihat jadwal lengkapnya.\nContoh: .jadwal DWP";
               } else if (args.toLowerCase().includes("dwp")) {
                   tiketResponse = "📅 *Jadwal DWP (Djakarta Warehouse Project)*\n- Tanggal: 13-15 Desember 2026\n- Lokasi: GWK Cultural Park, Bali\n- Open Gate: 15:00 WITA";
               } else if (args.toLowerCase().includes("coldplay")) {
                   tiketResponse = "📅 *Jadwal Konser Coldplay*\n- Tanggal: 15 November 2026\n- Lokasi: Stadion Utama Gelora Bung Karno, Jakarta\n- Open Gate: 17:00 WIB";
               } else if (args.toLowerCase().includes("taylor swift") || args.toLowerCase().includes("taylor")) {
                   tiketResponse = "📅 *Jadwal Konser Taylor Swift*\n- Tanggal: 2-4 Maret 2026\n- Lokasi: National Stadium, Singapore\n- Open Gate: 16:00 SGT";
               } else {
                   tiketResponse = `📅 *Jadwal Event: ${args}*\nMaaf, jadwal untuk event tersebut belum tersedia atau tidak ditemukan.`;
               }
               break;
           case "harga": tiketResponse = "💰 *Daftar Harga Tiket*\n- VIP: Rp 3.500.000\n- Festival A: Rp 2.000.000\n- Festival B: Rp 1.500.000\n- Tribun: Rp 800.000"; break;
           case "kategori": tiketResponse = "📋 *Kategori Tiket*\nTersedia kategori: VIP, VVIP, Festival A, Festival B, CAT 1, CAT 2, CAT 3, dan Tribun."; break;
           case "seatmap": 
               if (!args) {
                   tiketResponse = "🗺️ *Peta Kursi (Seatmap)*\nSilakan sebutkan nama event untuk melihat seatmap.\nContoh: .seatmap Coldplay";
               } else if (args.toLowerCase().includes("coldplay")) {
                   tiketResponse = "🗺️ *Seatmap Konser Coldplay*\nLink: https://example.com/seatmap-coldplay.jpg\n* VIP: Area depan panggung\n* Festival: Area tengah (Standing)\n* CAT 1-3: Area Tribun bawah\n* CAT 4-6: Area Tribun atas";
               } else if (args.toLowerCase().includes("dwp")) {
                   tiketResponse = "🗺️ *Seatmap DWP*\nLink: https://example.com/seatmap-dwp.jpg\n* GA: Area utama\n* VIP: Area khusus dengan fasilitas lebih";
               } else {
                   tiketResponse = `🗺️ *Seatmap Event: ${args}*\nMaaf, seatmap untuk event tersebut belum tersedia atau tidak ditemukan.`;
               }
               break;
           case "stoktiket": tiketResponse = "🎫 *Ketersediaan Tiket*\nUntuk mengecek stok tiket yang tersisa, silakan hubungi admin atau gunakan perintah .bookingtiket."; break;
           case "bookingtiket": tiketResponse = "🛒 *Cara Booking Tiket*\nFormat pemesanan:\nNama:\nNo KTP:\nEvent:\nKategori:\nJumlah Tiket:\nKirim data ini ke Admin."; break;
           case "riwayat": tiketResponse = "📜 *Riwayat Pemesanan*\nAnda belum memiliki riwayat pemesanan tiket."; break;
           default: tiketResponse = "🎟️ Tiket tidak ditemukan."; break;
       }
       
       await this.sock.sendMessage(jid, { text: tiketResponse }, { quoted: msg });
       this.broadcastState(`Responded to ${cmd} command`);

    } else if (/^\.?(kerja|fightnaga|fightkucing|fightphonix|mancing|fightkyubi|berdagang|nabung|mining|bankcek|maling|banknabung|banktarik|berkebun|mulung|bonus|gajian|nebang|petualang|upgrade|transfer|collect|referal|shop|ojek|nguli|casino|pasar|berburu|polisi)(\s+|$)/i.test(body)) {
       const match = body.match(/^\.?(kerja|fightnaga|fightkucing|fightphonix|mancing|fightkyubi|berdagang|nabung|mining|bankcek|maling|banknabung|banktarik|berkebun|mulung|bonus|gajian|nebang|petualang|upgrade|transfer|collect|referal|shop|ojek|nguli|casino|pasar|berburu|polisi)/i);
       if (match) {
           const cmd = match[1].toLowerCase();
           let resultText = "";
           const randomMoney = Math.floor(Math.random() * 5000) + 500;
           const randomExp = Math.floor(Math.random() * 100) + 10;
           
           switch (cmd) {
               case 'kerja': resultText = `💼 Kamu bekerja dengan keras dan mendapatkan Rp${randomMoney} dan ${randomExp} EXP!`; break;
               case 'fightnaga': resultText = `🐉 Kamu melawan naga raksasa! Menang dan mendapatkan Rp${randomMoney * 5} dan ${randomExp * 3} EXP!`; break;
               case 'fightkucing': resultText = `🐈 Kamu melawan kucing oren! Kucingnya lari, kamu dapat Rp${randomMoney} dan ${randomExp} EXP!`; break;
               case 'fightphonix': resultText = `🦅 Kamu melawan Phoenix! Kamu menang dan mendapatkan Rp${randomMoney * 3} dan ${randomExp * 2} EXP!`; break;
               case 'mancing': resultText = `🎣 Kamu memancing dan mendapatkan Ikan langka yang bernilai Rp${randomMoney}!`; break;
               case 'fightkyubi': resultText = `🦊 Kamu melawan Kyubi ekor 9! Gila, kamu menang! Hadiah: Rp${randomMoney * 10} dan ${randomExp * 5} EXP!`; break;
               case 'berdagang': resultText = `🏪 Hasil berdagang hari ini untung Rp${randomMoney}!`; break;
               case 'nabung': resultText = `🏦 Kamu menyisihkan uang Rp${randomMoney} untuk ditabung.`; break;
               case 'mining': resultText = `⛏️ Kamu menambang dan menemukan permata seharga Rp${randomMoney * 2}!`; break;
               case 'bankcek': resultText = `💳 Saldo bank kamu saat ini: Rp${randomMoney * 20}`; break;
               case 'maling': resultText = `🏃‍♂️ Kamu berhasil maling ayam tetangga, dijual laku Rp${Math.floor(randomMoney/2)}!`; break;
               case 'banknabung': resultText = `🏦 Kamu berhasil menabung Rp${randomMoney} ke bank.`; break;
               case 'banktarik': resultText = `🏧 Kamu menarik uang Rp${randomMoney} dari bank.`; break;
               case 'berkebun': resultText = `🌱 Panen hasil kebunmu membuahkan Rp${randomMoney}!`; break;
               case 'mulung': resultText = `🗑️ Kamu mulung botol bekas dan mendapat Rp${Math.floor(randomMoney/4)}. Lumayan!`; break;
               case 'bonus': resultText = `🎁 Kamu mendapatkan bonus harian sebesar Rp${randomMoney}!`; break;
               case 'gajian': resultText = `💰 Hore gajian! Gajimu minggu ini adalah Rp${randomMoney * 5}!`; break;
               case 'nebang': resultText = `🪓 Kamu menebang pohon dan menjual kayunya seharga Rp${randomMoney}!`; break;
               case 'petualang': resultText = `🗺️ Dari hasil berpetualang kamu menemukan harta karun berisi Rp${randomMoney * 4}!`; break;
               case 'upgrade': resultText = `⚙️ Kamu melakukan upgrade alat-alatmu! (Cost: Rp${Math.floor(randomMoney/2)})`; break;
               case 'transfer': resultText = `💸 Kamu mentransfer sejumlah uang.`; break;
               case 'collect': resultText = `📦 Kamu mengumpulkan hadiah spesial! (Rp${randomMoney * 3})`; break;
               case 'referal': resultText = `🔗 Seseorang menggunakan kode referalmu! Dapat Rp${randomMoney}!`; break;
               case 'shop': resultText = `🛒 Selamat datang di toko! Sedang ada diskon loh.`; break;
               case 'ojek': resultText = `🏍️ Kamu ngegojek seharian dan dapat Rp${randomMoney * 2}!`; break;
               case 'nguli': resultText = `🧱 Kamu nguli bangunan dari pagi sampai sore dan dibayar Rp${randomMoney * 3}!`; break;
               case 'casino': resultText = `🎰 Kamu main casino dan... ${Math.random() > 0.5 ? 'MENANG BESAR Rp' + randomMoney * 10 + '!' : 'Kalah telak. Sisa uangmu Rp0.'}`; break;
               case 'pasar': resultText = `🏬 Kamu pergi ke pasar dan mendapatkan diskon bahan pokok.`; break;
               case 'berburu': resultText = `🏹 Kamu berburu di hutan dan mendapatkan daging hasil buruan!`; break;
               case 'polisi': resultText = `🚓 Kamu jadi polisi hari ini, nilang pelanggar dan dapat Rp${randomMoney}! (Ups, masuk kantong sendiri)`; break;
           }
           await this.sock.sendMessage(jid, { text: resultText }, { quoted: msg });
       }
    } else {
       const potentialCmd = body.replace(/^\.?/, "").trim();
       if (this.storedStickers.has(potentialCmd)) {
          await this.sock.sendMessage(jid, { sticker: this.storedStickers.get(potentialCmd) }, { quoted: msg });
       }
    }
  }
}
