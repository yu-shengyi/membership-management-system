import { test } from "node:test";
import assert from "node:assert/strict";
import { updateMember, createTransaction } from "../src/utils/domain.ts";
import { validateData } from "../src/utils/validation.ts";
import type { AppData, Member } from "../src/types/index.ts";
const member: Member = {
  id: "boundary-member",
  memberNo: "VIP-BOUNDARY",
  name: "边界会员",
  phone: "13800000001",
  cardType: "times",
  cardNumber: "BOUNDARY-CARD",
  balance: 10,
  points: 0,
  level: "bronze",
  remainingSessions: 5,
  status: "active",
  registrationDate: "2026-01-01",
  expiryDate: "2027-01-01",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};
const data = (): AppData => ({
  members: [{ ...member }],
  transactions: [],
  appointments: [],
  courses: [],
  courseSessions: [],
});
test("编辑资料不能切换卡类型而隐藏已有次数", () => {
  const result = updateMember(data(), member.id, {
    cardType: "monthly",
    name: "改名",
  });
  assert.equal(result.members[0].cardType, "times");
  assert.equal(result.members[0].remainingSessions, 5);
  assert.equal(result.members[0].name, "改名");
});
test("编辑资料保留历史最后到访时间", () => {
  const d = data();
  d.members[0].lastVisitDate = "2026-11-10T10:00:00Z";
  const result = updateMember(d, member.id, {
    lastVisitDate: "2020-01-01T00:00:00Z",
  });
  assert.equal(result.members[0].lastVisitDate, "2026-11-10T10:00:00Z");
});
test("余额刚好用尽时成功，账户与流水归零一致", () => {
  const result = createTransaction(
    data(),
    {
      memberId: member.id,
      type: "consume",
      amount: 10,
      paymentMethod: "balance",
      sessions: 5,
    },
    "2026-11-13",
  );
  assert.equal(result.members[0].balance, 0);
  assert.equal(result.members[0].remainingSessions, 0);
  assert.equal(result.transactions[0].balanceAfter, 0);
});
test("备份拒绝超过安全整数范围的积分与次数", () => {
  for (const key of ["points", "remainingSessions"] as const) {
    const d = data();
    d.members[0][key] = Number.MAX_SAFE_INTEGER + 1;
    assert.throws(() => validateData(d));
  }
});
