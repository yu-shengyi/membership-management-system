import { createId } from "./id.ts";
import type {
  AppData,
  Member,
  TransactionInput,
  MemberStatus,
} from "../types/index.ts";
import { dateKey } from "./dates.ts";
import { validateData } from "./validation.ts";
export function getMemberStatus(m: Member, today = dateKey()): MemberStatus {
  return m.status === "frozen"
    ? "frozen"
    : m.expiryDate < today
      ? "expired"
      : m.status;
}
export function cents(amount: number): number {
  const n = Math.round(amount * 100);
  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !Number.isSafeInteger(n) ||
    Math.abs(amount * 100 - n) > 1e-6
  )
    throw new Error("金额必须大于零，最多两位小数");
  return n;
}
export function createTransaction(
  data: AppData,
  input: TransactionInput,
  today = dateKey(),
): AppData {
  const m = data.members.find((x) => x.id === input.memberId);
  if (!m || m.archived) throw new Error("会员不存在或已归档");
  const amount = cents(input.amount);
  let remaining = m.remainingSessions;
  if (!["recharge", "consume"].includes(input.type))
    throw new Error("不支持的交易类型");
  if (input.type === "consume") {
    if (getMemberStatus(m, today) !== "active")
      throw new Error("会员已冻结或过期，无法消费");
    if (m.registrationDate > today) throw new Error("会员卡尚未生效");
    if (input.paymentMethod !== "balance")
      throw new Error("消费必须使用账户余额");
    if (Math.round(m.balance * 100) < amount) throw new Error("余额不足");
    if (input.sessions !== undefined) {
      if (
        m.cardType !== "times" ||
        !Number.isInteger(input.sessions) ||
        input.sessions <= 0 ||
        input.sessions > remaining
      )
        throw new Error("扣次必须是可用范围内的正整数，仅支持次数卡");
      remaining -= input.sessions;
    }
  } else if (
    !["cash", "wechat", "alipay", "card", "other"].includes(
      input.paymentMethod,
    ) ||
    input.sessions !== undefined
  )
    throw new Error("充值请选择外部收款方式，不支持扣次");
  const balance =
    (Math.round(m.balance * 100) +
      (input.type === "recharge" ? amount : -amount)) /
    100;
  const now = new Date().toISOString();
  const result: AppData = {
    ...data,
    members: data.members.map((x) =>
      x.id === m.id
        ? {
            ...x,
            balance,
            remainingSessions: remaining,
            updatedAt: now,
            ...(input.type === "consume" ? { lastVisitDate: now } : {}),
          }
        : x,
    ),
    transactions: [
      {
        id: createId(),
        memberId: m.id,
        memberName: m.name,
        type: input.type,
        amount: amount / 100,
        paymentMethod: input.paymentMethod,
        balanceBefore: m.balance,
        balanceAfter: balance,
        operator: "本机操作员",
        createdAt: now,
        notes: input.notes,
        sessions: input.sessions,
      },
      ...data.transactions,
    ],
  };
  validateData(result);
  return result;
}
export function updateMember(
  data: AppData,
  id: string,
  patch: Partial<Member>,
): AppData {
  const m = data.members.find((x) => x.id === id);
  if (!m) throw new Error("会员不存在");
  const result = {
    ...data,
    members: data.members.map((x) =>
      x.id === id
        ? {
            ...x,
            ...patch,
            id: x.id,
            memberNo: x.memberNo,
            createdAt: x.createdAt,
            balance: x.balance,
            points: x.points,
            remainingSessions: x.remainingSessions,
            cardType: x.cardType,
            lastVisitDate: x.lastVisitDate,
            archived: x.archived,
            isDemo: x.isDemo,
            updatedAt: new Date().toISOString(),
          }
        : x,
    ),
  };
  validateData(result);
  return result;
}
export function removeDemo(data: AppData): AppData {
  const ids = new Set(data.members.filter((m) => m.isDemo).map((m) => m.id));
  return {
    ...data,
    members: data.members.filter((m) => !ids.has(m.id)),
    transactions: data.transactions.filter((t) => !ids.has(t.memberId)),
    appointments: data.appointments.filter((a) => !ids.has(a.memberId)),
  };
}
