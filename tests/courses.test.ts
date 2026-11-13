import { test } from "node:test";
import assert from "node:assert/strict";
import type { AppData, Member } from "../src/types/index.ts";
import { parseBackup, validateData } from "../src/utils/validation.ts";
import { removeDemo } from "../src/utils/domain.ts";
import { storage, SNAPSHOT_KEY } from "../src/utils/storage.ts";
import {
  saveCourse,
  saveSession,
  bookSession,
  cancelAppointment,
  cancelSession,
  getOccupancy,
  getBookingIssue,
} from "../src/utils/courses.ts";

const NOW = "2026-11-13T04:00:00Z";
const START = "2026-11-14T04:00:00Z";
const member: Member = {
  id: "m1",
  name: "预约会员",
  phone: "13800000000",
  memberNo: "VIP1",
  cardNumber: "CARD1",
  cardType: "times",
  level: "bronze",
  status: "active",
  balance: 0,
  points: 0,
  remainingSessions: 0,
  registrationDate: "2020-01-01",
  expiryDate: "2099-01-01",
  createdAt: NOW,
  updatedAt: NOW,
};
const empty = (): AppData => ({
  members: [{ ...member }],
  transactions: [],
  appointments: [],
  courses: [],
  courseSessions: [],
});
const courseInput = {
  name: "瑜伽基础",
  duration: 60,
  capacity: 1,
  active: true,
  notes: "自备水杯",
};
function ready() {
  let d = saveCourse(empty(), courseInput, undefined, NOW);
  d = saveSession(
    d,
    {
      courseId: d.courses[0].id,
      startsAt: START,
      duration: 60,
      capacity: 1,
      coach: "林教练",
      venue: "一号教室",
    },
    undefined,
    NOW,
  );
  return d;
}
const sid = (d: AppData) => d.courseSessions[0].id;
function memory() {
  const values = new Map<string, string>();
  let fail = false;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k: string) => values.get(k) ?? null,
      setItem: (k: string, v: string) => {
        if (fail && k === SNAPSHOT_KEY) throw new Error("空间不足");
        values.set(k, v);
      },
      removeItem: (k: string) => values.delete(k),
    },
  });
  return {
    values,
    fail: () => {
      fail = true;
    },
  };
}

test("旧备份补齐课程数组，旧会员和历史预约原样保留", () => {
  const old = {
    members: [member],
    transactions: [],
    appointments: [
      {
        id: "old-a",
        memberId: "m1",
        memberName: "原名",
        courseId: "legacy",
        courseName: "旧课程",
        appointmentTime: START,
        duration: 60,
        status: "confirmed",
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
  };
  for (const version of ["2.0.0", "2.1.0"]) {
    const result = parseBackup(
      JSON.stringify({ version, timestamp: NOW, data: old }),
    );
    assert.deepEqual(result.data.courses, []);
    assert.deepEqual(result.data.courseSessions, []);
    assert.deepEqual(result.data.appointments, old.appointments);
    assert.deepEqual(result.data.members, [member]);
    assert.equal(result.version, "2.2.0");
  }
});
test("新版备份不能用缺失数组或无效关联伪装有效数据", () => {
  const d = ready();
  for (const bad of [
    { ...d, courses: undefined },
    { ...d, courseSessions: [{ ...d.courseSessions[0], courseId: "missing" }] },
    { ...d, courseSessions: [{ ...d.courseSessions[0], capacity: 0 }] },
  ]) {
    assert.throws(
      () =>
        parseBackup(
          JSON.stringify({ version: "2.2.0", timestamp: NOW, data: bad }),
        ),
      /校验/,
    );
  }
  const booked = bookSession(d, sid(d), "m1", "", NOW);
  assert.throws(
    () =>
      validateData({
        ...booked,
        appointments: [{ ...booked.appointments[0], sessionId: "missing" }],
      }),
    /课次/,
  );
  assert.throws(
    () =>
      validateData({
        ...booked,
        appointments: [{ ...booked.appointments[0], appointmentTime: NOW }],
      }),
    /时间/,
  );
});
test("课程输入规范化并拒绝空名和越界参数", () => {
  const d = saveCourse(
    empty(),
    { ...courseInput, name: "  瑜伽  " },
    undefined,
    NOW,
  );
  assert.equal(d.courses[0].name, "瑜伽");
  for (const patch of [
    { name: " " },
    { duration: 4 },
    { duration: 481 },
    { duration: 5.5 },
    { capacity: 0 },
    { capacity: 501 },
    { capacity: 1.5 },
    { notes: "x".repeat(501) },
  ]) {
    assert.throws(() =>
      saveCourse(empty(), { ...courseInput, ...patch }, undefined, NOW),
    );
  }
});
test("教练或场地冲突被拒绝，首尾相接允许", () => {
  const d = ready();
  const s = d.courseSessions[0];
  for (const patch of [
    { coach: "林教练", venue: "二号教室" },
    { coach: "王教练", venue: " 一号教室 " },
  ]) {
    assert.throws(
      () =>
        saveSession(
          d,
          { ...s, ...patch, startsAt: "2026-11-14T04:30:00Z" },
          undefined,
          NOW,
        ),
      /冲突/,
    );
  }
  assert.equal(
    saveSession(d, { ...s, startsAt: "2026-11-14T05:00:00Z" }, undefined, NOW)
      .courseSessions.length,
    2,
  );
  assert.throws(
    () => saveSession(d, { ...s, startsAt: NOW }, undefined, NOW),
    /晚于/,
  );
});
test("目录更新不改已有课次快照，停用阻止新排课但不阻止已有课次预约", () => {
  const d = ready();
  const id = d.courses[0].id;
  const next = saveCourse(
    d,
    { ...courseInput, name: "新名字", active: false },
    id,
    NOW,
  );
  assert.equal(next.courseSessions[0].courseName, "瑜伽基础");
  assert.throws(
    () =>
      saveSession(
        next,
        { ...d.courseSessions[0], startsAt: "2026-11-15T04:00:00Z" },
        undefined,
        NOW,
      ),
    /停用/,
  );
  assert.equal(
    bookSession(next, sid(next), "m1", "", NOW).appointments.length,
    1,
  );
});
test("预约不扣费，满额和重复预约都拒绝", () => {
  const d = ready();
  d.members.push({
    ...member,
    id: "m2",
    phone: "13900000000",
    memberNo: "VIP2",
    cardNumber: "CARD2",
  });
  const result = bookSession(d, sid(d), "m1", "  首次上课  ", NOW);
  assert.equal(getOccupancy(result, sid(d)), 1);
  assert.equal(result.appointments[0].notes, "首次上课");
  assert.deepEqual(result.members, d.members);
  assert.deepEqual(result.transactions, []);
  assert.equal(d.appointments.length, 0);
  assert.throws(() => bookSession(result, sid(d), "m1", "", NOW), /重复/);
  assert.throws(() => bookSession(result, sid(d), "m2", "", NOW), /已满/);
});
test("预约资格按上课日期判断，到期当天允许，冻结归档与未生效拒绝", () => {
  const d = ready();
  for (const patch of [
    { status: "frozen" },
    { status: "expired" },
    { archived: true },
    { expiryDate: "2026-11-13" },
    { registrationDate: "2026-11-15" },
  ]) {
    const bad = { ...d, members: [{ ...member, ...patch }] } as AppData;
    assert.notEqual(getBookingIssue(bad, sid(d), "m1", NOW), null);
    assert.throws(() => bookSession(bad, sid(d), "m1", "", NOW));
  }
  assert.equal(
    bookSession(
      { ...d, members: [{ ...member, expiryDate: "2026-11-14" }] },
      sid(d),
      "m1",
      "",
      NOW,
    ).appointments.length,
    1,
  );
});
test("同会员撞课拒绝，不同教练场地和相邻课次允许", () => {
  let d = ready();
  d = bookSession(d, sid(d), "m1", "", NOW);
  d = saveSession(
    d,
    {
      ...d.courseSessions[0],
      startsAt: "2026-11-14T04:30:00Z",
      coach: "王教练",
      venue: "二号教室",
    },
    undefined,
    NOW,
  );
  assert.throws(
    () => bookSession(d, d.courseSessions[1].id, "m1", "", NOW),
    /冲突/,
  );
  d = saveSession(
    d,
    { ...d.courseSessions[0], startsAt: "2026-11-14T05:00:00Z" },
    undefined,
    NOW,
  );
  assert.equal(
    bookSession(d, d.courseSessions[2].id, "m1", "", NOW).appointments.length,
    2,
  );
});
test("取消释放名额，再预约保留取消历史", () => {
  let d = ready();
  d = bookSession(d, sid(d), "m1", "", NOW);
  const id = d.appointments[0].id;
  d = cancelAppointment(d, id, NOW);
  assert.equal(getOccupancy(d, sid(d)), 0);
  assert.throws(() => cancelAppointment(d, id, NOW), /取消/);
  d = bookSession(d, sid(d), "m1", "", NOW);
  assert.equal(d.appointments.length, 2);
  assert.equal(d.appointments[0].status, "cancelled");
  assert.equal(getOccupancy(d, sid(d)), 1);
});
test("有预约时锁定时间，取消课次级联取消预约且释放冲突", () => {
  let d = ready();
  d = bookSession(d, sid(d), "m1", "", NOW);
  const s = d.courseSessions[0];
  assert.throws(
    () => saveSession(d, { ...s, duration: 90 }, s.id, NOW),
    /预约/,
  );
  d = cancelSession(d, s.id, NOW);
  assert.equal(d.courseSessions[0].status, "cancelled");
  assert.equal(d.appointments[0].status, "cancelled");
  assert.throws(() => bookSession(d, s.id, "m1", "", NOW), /取消/);
  assert.equal(saveSession(d, s, undefined, NOW).courseSessions.length, 2);
});
test("容量不能低于已占人数，已开课不能预约编辑或取消", () => {
  let d = ready();
  d = saveSession(d, { ...d.courseSessions[0], capacity: 2 }, sid(d), NOW);
  d.members.push({
    ...member,
    id: "m2",
    phone: "13900000000",
    memberNo: "VIP2",
    cardNumber: "CARD2",
  });
  d = bookSession(d, sid(d), "m1", "", NOW);
  d = bookSession(d, sid(d), "m2", "", NOW);
  assert.throws(
    () => saveSession(d, { ...d.courseSessions[0], capacity: 1 }, sid(d), NOW),
    /容量/,
  );
  assert.throws(() => bookSession(d, sid(d), "m1", "", START), /开始/);
  assert.throws(
    () => cancelAppointment(d, d.appointments[0].id, START),
    /开始/,
  );
  assert.throws(() => cancelSession(d, sid(d), START), /开始/);
});
test("演示清理保留课程课次和真实会员预约", () => {
  let d = ready();
  d = bookSession(d, sid(d), "m1", "", NOW);
  d.members.push({
    ...member,
    id: "demo",
    phone: "demo",
    memberNo: "demo",
    cardNumber: "demo",
    isDemo: true,
  });
  const result = removeDemo(d);
  assert.equal(result.courses.length, 1);
  assert.equal(result.courseSessions.length, 1);
  assert.equal(result.appointments.length, 1);
});
test("预约写入失败保留整个旧快照，成功后可备份恢复", () => {
  const mem = memory();
  const d = ready();
  storage.commit(d);
  const before = mem.values.get(SNAPSHOT_KEY);
  const booked = bookSession(d, sid(d), "m1", "", NOW);
  mem.fail();
  assert.throws(() => storage.commit(booked), /空间不足/);
  assert.equal(mem.values.get(SNAPSHOT_KEY), before);
  memory();
  storage.commit(booked);
  const text = storage.exportBackup();
  storage.clearAll();
  assert.equal(storage.readSnapshot().data.courses.length, 0);
  storage.importBackup(text);
  assert.equal(storage.readSnapshot().data.appointments.length, 1);
  assert.equal(storage.readSnapshot().data.courseSessions.length, 1);
});
