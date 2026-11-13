import { createId } from "./id.ts";
import type {
  AppData,
  Backup,
  Member,
  Transaction,
  Appointment,
} from "../types/index.ts";
import { parseBackup, validateData } from "./validation.ts";
export const SNAPSHOT_KEY = "membership_system_snapshot_v2";
const HISTORY = "membership_system_backup";
const legacy = [
  "membership_system_members",
  "membership_system_transactions",
  "membership_system_appointments",
];
let warning: string | null = null;
const empty = (): AppData => ({
  members: [],
  transactions: [],
  appointments: [],
  courses: [],
  courseSessions: [],
});
function snapshot(data: AppData): Backup {
  return {
    id: createId(),
    version: "2.2.0",
    timestamp: new Date().toISOString(),
    data,
  };
}
function download(text: string, name: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const storage = {
  readSnapshot(): Backup {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (raw !== null) return parseBackup(raw);
    const d = empty();
    for (const [i, key] of (
      ["members", "transactions", "appointments"] as const
    ).entries()) {
      const old = localStorage.getItem(legacy[i]);
      if (old !== null) Object.assign(d, { [key]: JSON.parse(old) });
    }
    validateData(d);
    const b = snapshot(d);
    if (legacy.some((k) => localStorage.getItem(k) !== null))
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(b));
    return b;
  },
  commit(data: AppData): Backup {
    validateData(data);
    const b = snapshot(data);
    let previous = localStorage.getItem(SNAPSHOT_KEY);
    if (!previous && legacy.some((k) => localStorage.getItem(k) !== null)) {
      try {
        const old: AppData = {
          members: JSON.parse(localStorage.getItem(legacy[0]) || "[]"),
          transactions: JSON.parse(localStorage.getItem(legacy[1]) || "[]"),
          appointments: JSON.parse(localStorage.getItem(legacy[2]) || "[]"),
          courses: [],
          courseSessions: [],
        };
        validateData(old);
        previous = JSON.stringify(snapshot(old));
      } catch {
        /* 损坏的旧键原样保留，可导出原始数据 */
      }
    }
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(b));
    warning = null;
    try {
      const history = this.getAutoBackups();
      if (previous) {
        try {
          const old = parseBackup(previous);
          if (!history.some((h) => h.id === old.id)) history.unshift(old);
        } catch {
          /* 保留损坏的原始数据请先使用故障导出 */
        }
      }
      history.unshift(b);
      localStorage.setItem(HISTORY, JSON.stringify(history.slice(0, 7)));
    } catch {
      warning = "数据已保存，但自动备份失败。请导出完整备份并检查空间。";
    }
    return b;
  },
  getBackupWarning() {
    return warning;
  },
  getMembers() {
    return this.readSnapshot().data.members;
  },
  getTransactions() {
    return this.readSnapshot().data.transactions;
  },
  getAppointments() {
    return this.readSnapshot().data.appointments;
  },
  getMemberById(id: string) {
    return this.getMembers().find((m) => m.id === id);
  },
  saveMembers(members: Member[]) {
    this.commit({ ...this.readSnapshot().data, members });
  },
  saveTransactions(transactions: Transaction[]) {
    this.commit({ ...this.readSnapshot().data, transactions });
  },
  saveAppointments(appointments: Appointment[]) {
    this.commit({ ...this.readSnapshot().data, appointments });
  },
  createBackup() {
    return snapshot(this.readSnapshot().data);
  },
  exportBackup() {
    return JSON.stringify(this.createBackup(), null, 2);
  },
  downloadBackup() {
    download(this.exportBackup(), "会员系统备份.json");
  },
  downloadRaw() {
    download(
      JSON.stringify(
        Object.fromEntries(
          [SNAPSHOT_KEY, HISTORY, ...legacy].map((k) => [
            k,
            localStorage.getItem(k),
          ]),
        ),
        null,
        2,
      ),
      "会员系统原始数据.json",
    );
  },
  getAutoBackups(): Backup[] {
    const raw = localStorage.getItem(HISTORY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr))
      throw new Error("数据操作失败，请检查文件或存储空间");
    return arr
      .map((b, i) => ({
        ...parseBackup(JSON.stringify(b)),
        id: b.id || "legacy-" + b.timestamp + "-" + i,
      }))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  },
  previewBackup(text: string) {
    return parseBackup(text);
  },
  importBackup(text: string) {
    const b = parseBackup(text);
    this.commit(b.data);
    return true;
  },
  restoreBackup(id: string) {
    const b = this.getAutoBackups().find((x) => x.id === id);
    if (!b) throw new Error("数据操作失败，请检查文件或存储空间");
    return this.importBackup(JSON.stringify(b));
  },
  clearAll() {
    this.commit(empty());
    for (const k of legacy) localStorage.removeItem(k);
  },
  getStorageInfo() {
    const details = Object.fromEntries(
      [
        ["当前数据", SNAPSHOT_KEY],
        ["自动备份", HISTORY],
        ...legacy.map((k, i) => ["旧版保留数据" + (i + 1), k]),
      ].map(([name, k]) => [name, (localStorage.getItem(k)?.length || 0) * 2]),
    );
    const totalSize = Object.values(details).reduce((a, b) => a + b, 0);
    return {
      details,
      totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      usage: ((totalSize / (5 * 1024 * 1024)) * 100).toFixed(2),
      limit: 5 * 1024 * 1024,
    };
  },
};
