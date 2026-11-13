import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { storage } from "../src/utils/storage.ts";

const values = new Map<string, string>();
let failKey = "";
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (key === failKey) throw new Error("模拟存储已满");
      values.set(key, value);
    },
    removeItem: (key: string) => values.delete(key),
  },
  configurable: true,
});
beforeEach(() => {
  values.clear();
  failKey = "";
});

test("拒绝非数组会员数据，不把损坏的备份当作成功导入", () => {
  assert.throws(() =>
    storage.importBackup(
      JSON.stringify({
        version: "2.0.0",
        timestamp: new Date().toISOString(),
        data: {
          members: { invalid: true },
          transactions: [],
          appointments: [],
        },
      }),
    ),
  );
  assert.equal(values.size, 0);
});

test("拒绝未知版本，保留现有本地数据", () => {
  values.set("membership_system_members", "[]");
  const before = [...values.entries()];
  assert.throws(() =>
    storage.importBackup(
      JSON.stringify({
        version: "99.0.0",
        timestamp: new Date().toISOString(),
        data: { members: [], transactions: [], appointments: [] },
      }),
    ),
  );
  assert.deepEqual([...values.entries()], before);
});

import type { AppData, Member } from "../src/types/index.ts";
import { SNAPSHOT_KEY } from "../src/utils/storage.ts";
import {
  createTransaction,
  getMemberStatus,
  updateMember,
  removeDemo,
} from "../src/utils/domain.ts";
const member: Member = {
  id: "m1",
  memberNo: "VIP1",
  name: "测试会员",
  phone: "13800000000",
  cardType: "times",
  cardNumber: "C1",
  balance: 10.1,
  points: 2,
  level: "bronze",
  remainingSessions: 5,
  status: "active",
  registrationDate: "2026-01-01",
  expiryDate: "2026-11-13",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};
const data = (): AppData => ({
  members: [{ ...member }],
  transactions: [],
  appointments: [],
});
const consume = {
  memberId: "m1",
  type: "consume" as const,
  amount: 0.2,
  paymentMethod: "balance" as const,
  sessions: 1,
};
test("到期当天有效，次日失效，冻结优先", () => {
  assert.equal(getMemberStatus(member, "2026-11-13"), "active");
  assert.equal(getMemberStatus(member, "2026-11-14"), "expired");
  assert.equal(
    getMemberStatus({ ...member, status: "frozen" }, "2026-11-14"),
    "frozen",
  );
});
test("消费同时扣余额和次数，原对象不变，金额按分计算", () => {
  const d = data();
  const next = createTransaction(d, consume, "2026-11-13");
  assert.equal(next.members[0].balance, 9.9);
  assert.equal(next.members[0].remainingSessions, 4);
  assert.equal(next.transactions[0].sessions, 1);
  assert.equal(d.members[0].balance, 10.1);
  assert.equal(d.transactions.length, 0);
});
test("拒绝无效金额与扣次", () => {
  for (const amount of [0, -1, NaN, Infinity, 0.001, 11])
    assert.throws(() =>
      createTransaction(data(), { ...consume, amount }, "2026-11-13"),
    );
  for (const sessions of [0, -1, 1.5, 6])
    assert.throws(() =>
      createTransaction(data(), { ...consume, sessions }, "2026-11-13"),
    );
});
test("冻结、过期、归档和未生效会员不能消费", () => {
  for (const patch of [
    { status: "frozen" as const },
    { expiryDate: "2026-11-12" },
    { archived: true },
    { registrationDate: "2026-11-14" },
  ]) {
    const d = data();
    Object.assign(d.members[0], patch);
    assert.throws(() => createTransaction(d, consume, "2026-11-13"));
  }
});
test("充值不受冻结限制，必须使用外部收款方式", () => {
  const d = data();
  d.members[0].status = "frozen";
  const r = createTransaction(d, {
    memberId: "m1",
    type: "recharge",
    amount: 0.2,
    paymentMethod: "cash",
  });
  assert.equal(r.members[0].balance, 10.3);
  assert.throws(() => createTransaction(d, { ...consume, type: "recharge" }));
});
test("编辑保护账户数值并拒绝重复手机号", () => {
  const d = data();
  const changed = updateMember(d, "m1", {
    balance: 999,
    points: 999,
    remainingSessions: 999,
    name: "新姓名",
  });
  assert.equal(changed.members[0].balance, 10.1);
  assert.equal(changed.members[0].points, 2);
  assert.equal(changed.members[0].remainingSessions, 5);
  d.members.push({
    ...member,
    id: "m2",
    memberNo: "VIP2",
    cardNumber: "C2",
    phone: "13900000000",
  });
  assert.throws(() => updateMember(d, "m1", { phone: "13900000000" }));
});
test("主存储失败不改动快照和备份", () => {
  storage.commit(data());
  const before = [...values.entries()];
  failKey = SNAPSHOT_KEY;
  assert.throws(() =>
    storage.commit(createTransaction(data(), consume, "2026-11-13")),
  );
  assert.deepEqual([...values.entries()], before);
});
test("备份失败不误报交易失败，给出警告", () => {
  storage.commit(data());
  failKey = "membership_system_backup";
  storage.commit(createTransaction(data(), consume, "2026-11-13"));
  assert.equal(storage.getMembers()[0].balance, 9.9);
  assert.ok(storage.getBackupWarning());
});
test("旧数据迁移完整且保留原键，损坏数据不被清空", () => {
  values.set("membership_system_members", JSON.stringify([member]));
  assert.equal(storage.getMembers().length, 1);
  assert.ok(values.has(SNAPSHOT_KEY));
  assert.ok(values.has("membership_system_members"));
  values.set(SNAPSHOT_KEY, "broken");
  assert.throws(() => storage.getMembers());
  assert.equal(values.get(SNAPSHOT_KEY), "broken");
});
test("导入写入失败保持原数据，正确导入可恢复损坏快照", () => {
  storage.commit(data());
  const text = storage.exportBackup();
  const before = values.get(SNAPSHOT_KEY);
  failKey = SNAPSHOT_KEY;
  assert.throws(() => storage.importBackup(text));
  assert.equal(values.get(SNAPSHOT_KEY), before);
  failKey = "";
  values.set(SNAPSHOT_KEY, "broken");
  storage.importBackup(text);
  assert.equal(storage.getMembers()[0].id, "m1");
});
test("备份倒序、稳定编号、按编号恢复", () => {
  storage.commit(data());
  const d = data();
  d.members[0].name = "第二次";
  storage.commit(d);
  const b = storage.getAutoBackups();
  assert.equal(b[0].data.members[0].name, "第二次");
  assert.equal(b[0].id, storage.getAutoBackups()[0].id);
  storage.restoreBackup(b[1].id);
  assert.equal(storage.getMembers()[0].name, "测试会员");
});
test("演示清理保留真实会员与交易", () => {
  const d = createTransaction(data(), consume, "2026-11-13");
  d.members.push({
    ...member,
    id: "demo",
    memberNo: "DEMO",
    cardNumber: "DEMO",
    phone: "demo",
    isDemo: true,
  });
  const r = removeDemo(d);
  assert.equal(r.members.length, 1);
  assert.equal(r.transactions.length, 1);
});
test("合法版本但结构损坏的备份也被拒绝", () => {
  for (const d of [
    { members: {}, transactions: [], appointments: [] },
    { members: [member, member], transactions: [], appointments: [] },
  ]) {
    assert.throws(() =>
      storage.importBackup(
        JSON.stringify({
          version: "2.0.0",
          timestamp: new Date().toISOString(),
          data: d,
        }),
      ),
    );
  }
});

import { transactionTrend } from "../src/utils/reports.ts";
test("存储占用同时计入当前数据和备份", () => {
  storage.commit(data());
  const expected = [...values.values()].reduce((n, v) => n + v.length * 2, 0);
  assert.equal(storage.getStorageInfo().totalSize, expected);
});
test("首次导入前的旧数据可从历史恢复", () => {
  values.set("membership_system_members", JSON.stringify([member]));
  storage.importBackup(
    JSON.stringify({
      version: "2.0.0",
      timestamp: new Date().toISOString(),
      data: { members: [], transactions: [], appointments: [] },
    }),
  );
  assert.ok(
    storage
      .getAutoBackups()
      .some((b) => b.data.members.some((m) => m.id === "m1")),
  );
});
test("趋势按本地日排序并填补零值，按月和周聚合", () => {
  const d = createTransaction(data(), consume, "2026-11-13");
  d.transactions[0].createdAt = "2026-11-13T12:00:00";
  const trend = transactionTrend(
    d.transactions,
    "2026-11-12",
    "2026-11-14",
    "day",
  );
  assert.deepEqual(
    trend.map((t) => t.date),
    ["2026-11-12", "2026-11-13", "2026-11-14"],
  );
  assert.deepEqual(
    trend.map((t) => t.consume),
    [0, 0.2, 0],
  );
  assert.equal(
    transactionTrend(d.transactions, "2026-11-01", "2026-11-30", "month")[0]
      .consume,
    0.2,
  );
  assert.equal(
    transactionTrend(d.transactions, "2026-11-09", "2026-11-15", "week")[0]
      .date,
    "2026-11-09",
  );
});

test("普通HTTP环境缺少randomUUID时仍可保存和交易", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  Object.defineProperty(globalThis, "crypto", {
    value: {
      getRandomValues: original?.get
        ?.call(globalThis)
        .getRandomValues.bind(globalThis.crypto),
    },
    configurable: true,
  });
  try {
    storage.commit(data());
    const d = createTransaction(data(), consume, "2026-11-13");
    assert.ok(d.transactions[0].id);
    assert.equal(d.members[0].balance, 9.9);
  } finally {
    if (original) Object.defineProperty(globalThis, "crypto", original);
  }
});
