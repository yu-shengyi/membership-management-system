import type { AppData, Backup } from "../types/index.ts";
import { validDate } from "./dates.ts";
function check(ok: unknown, label: string): asserts ok {
  if (!ok) throw new Error("数据校验失败：" + label);
}
const text = (v: unknown) => typeof v === "string" && v.trim().length > 0;
const timestamp = (v: unknown) =>
  typeof v === "string" && Number.isFinite(Date.parse(v));
const money = (v: number) =>
  Number.isFinite(v) &&
  v >= 0 &&
  Number.isSafeInteger(Math.round(v * 100)) &&
  Math.abs(v * 100 - Math.round(v * 100)) < 1e-6;
export function validateData(value: unknown): asserts value is AppData {
  check(value && typeof value === "object", "数据必须是对象");
  const d = value as AppData;
  for (const key of ["members", "transactions", "appointments"] as const) {
    check(Array.isArray(d[key]), key + "必须为数组");
    const ids = new Set<string>();
    for (const row of d[key]) {
      check(row && typeof row === "object", "记录格式错误");
      check(text(row.id) && !ids.has(row.id), "记录编号缺失或重复");
      ids.add(row.id);
    }
  }
  const uniques = {
    phone: new Set<string>(),
    memberNo: new Set<string>(),
    cardNumber: new Set<string>(),
  };
  const labels = { phone: "手机号", memberNo: "会员编号", cardNumber: "卡号" };
  for (const m of d.members) {
    for (const key of ["name", "phone", "memberNo", "cardNumber"] as const)
      check(text(m[key]), "会员" + key + "不能为空");
    for (const key of ["phone", "memberNo", "cardNumber"] as const) {
      check(!uniques[key].has(m[key].trim()), labels[key] + "重复：" + m[key]);
      uniques[key].add(m[key].trim());
    }
    check(
      ["times", "day", "monthly", "quarterly", "yearly"].includes(m.cardType),
      "未知卡类型",
    );
    check(
      ["bronze", "silver", "gold", "diamond"].includes(m.level),
      "未知会员等级",
    );
    check(["active", "expired", "frozen"].includes(m.status), "未知会员状态");
    check(money(m.balance), "余额必须为非负金额，最多两位小数");
    check(
      Number.isSafeInteger(m.points) &&
        m.points >= 0 &&
        Number.isSafeInteger(m.remainingSessions) &&
        m.remainingSessions >= 0,
      "积分和次数必须为非负整数",
    );
    check(
      validDate(m.registrationDate) &&
        validDate(m.expiryDate) &&
        m.expiryDate >= m.registrationDate,
      "会员生效/到期日期不合法",
    );
    check(
      timestamp(m.createdAt) && timestamp(m.updatedAt),
      "会员创建/更新时间不合法",
    );
    check(
      m.gender === undefined || ["male", "female"].includes(m.gender),
      "性别不合法",
    );
    check(m.birthday === undefined || validDate(m.birthday), "生日不合法");
    check(
      m.lastVisitDate === undefined || timestamp(m.lastVisitDate),
      "最后到访时间不合法",
    );
    for (const key of ["notes", "avatar"] as const)
      check(
        m[key] === undefined || typeof m[key] === "string",
        "会员备注或头像不合法",
      );
    for (const flag of ["archived", "isDemo"] as const)
      check(
        m[flag] === undefined || typeof m[flag] === "boolean",
        "归档或演示标记不合法",
      );
  }
  const memberIds = new Set(d.members.map((m) => m.id));
  for (const t of d.transactions) {
    check(memberIds.has(t.memberId), "交易关联的会员不存在");
    check(["recharge", "consume", "refund"].includes(t.type), "交易类型不合法");
    check(
      ["cash", "wechat", "alipay", "card", "other", "balance"].includes(
        t.paymentMethod,
      ),
      "支付方式不合法",
    );
    check(
      [t.amount, t.balanceBefore, t.balanceAfter].every(money),
      "交易金额或余额不合法",
    );
    check(
      text(t.memberName) && text(t.operator) && timestamp(t.createdAt),
      "交易姓名、操作员或时间不合法",
    );
    check(
      t.sessions === undefined ||
        (Number.isSafeInteger(t.sessions) && t.sessions > 0),
      "交易次数必须为正整数",
    );
    for (const key of ["pointsUsed", "pointsEarned"] as const)
      check(
        t[key] === undefined || (Number.isSafeInteger(t[key]) && t[key]! >= 0),
        "交易积分不合法",
      );
    check(
      t.notes === undefined || typeof t.notes === "string",
      "交易备注不合法",
    );
  }
  for (const a of d.appointments) {
    check(memberIds.has(a.memberId), "预约关联的会员不存在");
    for (const key of ["memberName", "courseId", "courseName"] as const)
      check(text(a[key]), "预约字段" + key + "不能为空");
    check(
      ["pending", "confirmed", "completed", "cancelled"].includes(a.status),
      "预约状态不合法",
    );
    check(
      timestamp(a.appointmentTime) &&
        timestamp(a.createdAt) &&
        timestamp(a.updatedAt),
      "预约时间不合法",
    );
    check(Number.isFinite(a.duration) && a.duration > 0, "预约时长不合法");
    for (const key of ["coach", "notes"] as const)
      check(
        a[key] === undefined || typeof a[key] === "string",
        "预约教练或备注不合法",
      );
  }
}
export function parseBackup(text: string): Backup {
  const b = JSON.parse(text);
  check(b && ["2.0.0", "2.1.0"].includes(b.version), "不支持的备份版本");
  check(timestamp(b.timestamp), "备份时间不合法");
  validateData(b.data);
  return {
    ...b,
    id: typeof b.id === "string" && b.id ? b.id : "legacy-" + b.timestamp,
    version: "2.1.0",
  };
}
