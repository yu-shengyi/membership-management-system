import { createId } from "../utils/id";
import { create } from "zustand";
import type { AppData, Member, TransactionInput } from "../types/index";
import { storage } from "../utils/storage";
import { createTransaction, updateMember, removeDemo } from "../utils/domain";
import { dateKey, shiftDate } from "../utils/dates";
interface Store extends AppData {
  error: string | null;
  warning: string | null;
  load: () => void;
  addMember: (m: Omit<Member, "id" | "createdAt" | "updatedAt">) => void;
  updateMember: (id: string, m: Partial<Member>) => void;
  archiveMember: (id: string, archived: boolean) => void;
  transact: (input: TransactionInput) => void;
  addDemo: () => void;
  clearDemo: () => void;
}
export const useAppStore = create<Store>((set) => {
  const publish = (data: AppData) => {
    storage.commit(data);
    set({ ...data, error: null, warning: storage.getBackupWarning() });
  };
  const current = () => storage.readSnapshot().data;
  return {
    members: [],
    transactions: [],
    appointments: [],
    error: null,
    warning: null,
    load: () => {
      try {
        set({ ...current(), error: null, warning: storage.getBackupWarning() });
      } catch (e) {
        set({ error: e instanceof Error ? e.message : "读取失败" });
      }
    },
    addMember: (m) => {
      const d = current();
      const now = new Date().toISOString();
      publish({
        ...d,
        members: [
          ...d.members,
          { ...m, id: createId(), createdAt: now, updatedAt: now },
        ],
      });
    },
    updateMember: (id, m) => publish(updateMember(current(), id, m)),
    archiveMember: (id, archived) => {
      const d = current();
      if (!d.members.some((m) => m.id === id)) throw new Error("会员不存在");
      publish({
        ...d,
        members: d.members.map((m) =>
          m.id === id
            ? { ...m, archived, updatedAt: new Date().toISOString() }
            : m,
        ),
      });
    },
    transact: (input) => publish(createTransaction(current(), input)),
    clearDemo: () => publish(removeDemo(current())),
    addDemo: () => {
      const d = current();
      if (d.members.some((m) => m.isDemo))
        throw new Error("已有演示会员，请先清理");
      const now = new Date().toISOString();
      const token = createId();
      publish({
        ...d,
        members: [
          ...d.members,
          {
            id: token,
            memberNo: "DEMO-" + token,
            cardNumber: "DEMO-" + token,
            name: "演示会员",
            phone: "demo-" + token,
            cardType: "times",
            balance: 100,
            points: 0,
            remainingSessions: 10,
            status: "active",
            level: "bronze",
            registrationDate: dateKey(),
            expiryDate: shiftDate(30),
            createdAt: now,
            updatedAt: now,
            isDemo: true,
          },
        ],
      });
    },
  };
});
