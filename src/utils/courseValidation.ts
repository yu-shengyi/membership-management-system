import type { AppData, CourseSession } from "../types/index.ts";
import { validDate } from "./dates.ts";

function check(ok: unknown, label: string): asserts ok {
  if (!ok) throw new Error("数据校验失败：" + label);
}
export const courseText = (v: unknown, max = 80): v is string =>
  typeof v === "string" && v.trim().length > 0 && v.length <= max;
export const courseTime = (v: unknown): v is string =>
  typeof v === "string" &&
  /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?(?:Z|[+-]\d\d:\d\d)$/.test(v) &&
  validDate(v.slice(0, 10)) &&
  Number.isFinite(Date.parse(v));
export const overlap = (
  a: Pick<CourseSession, "startsAt" | "duration">,
  b: Pick<CourseSession, "startsAt" | "duration">,
) =>
  Date.parse(a.startsAt) < Date.parse(b.startsAt) + b.duration * 60000 &&
  Date.parse(b.startsAt) < Date.parse(a.startsAt) + a.duration * 60000;
export function validateCourseData(d: AppData) {
  for (const key of ["courses", "courseSessions"] as const) {
    check(Array.isArray(d[key]), key + "必须为数组");
    const ids = new Set<string>();
    for (const row of d[key]) {
      check(
        row &&
          typeof row === "object" &&
          courseText(row.id, 200) &&
          !ids.has(row.id),
        "课程/课次编号缺失或重复",
      );
      ids.add(row.id);
      check(
        Number.isInteger(row.duration) &&
          row.duration >= 5 &&
          row.duration <= 480,
        "课程时长必须为5～480整数分钟",
      );
      check(
        Number.isInteger(row.capacity) &&
          row.capacity >= 1 &&
          row.capacity <= 500,
        "课程容量必须为1～500整数",
      );
      check(
        courseTime(row.createdAt) && courseTime(row.updatedAt),
        "课程/课次创建时间不合法",
      );
    }
  }
  for (const c of d.courses) {
    check(
      courseText(c.name) && typeof c.active === "boolean",
      "课程名称或启用状态不合法",
    );
    check(
      c.notes === undefined ||
        (typeof c.notes === "string" && c.notes.length <= 500),
      "课程说明最多500字",
    );
  }
  const courses = new Map(d.courses.map((c) => [c.id, c]));
  const sessions = new Map(d.courseSessions.map((s) => [s.id, s]));
  for (const s of d.courseSessions) {
    check(courses.has(s.courseId), "课次关联课程不存在");
    check(
      courseText(s.courseName) && courseText(s.coach) && courseText(s.venue),
      "课次名称、教练或场地不合法",
    );
    check(courseTime(s.startsAt), "课次开始时间不合法");
    check(["scheduled", "cancelled"].includes(s.status), "课次状态不合法");
  }
  for (const s of d.courseSessions) {
    if (s.status === "scheduled") {
      const conflict = d.courseSessions.some(
        (other) =>
          other.id !== s.id &&
          other.status === "scheduled" &&
          (other.coach.trim() === s.coach.trim() ||
            other.venue.trim() === s.venue.trim()) &&
          overlap(s, other),
      );
      check(!conflict, "课次教练或场地冲突");
    }
  }
  const active = d.appointments.filter(
    (a) => a.sessionId !== undefined && a.status !== "cancelled",
  );
  for (const a of d.appointments) {
    if (a.sessionId === undefined) continue;
    check(
      courseText(a.sessionId, 200) && sessions.has(a.sessionId),
      "预约关联课次不存在",
    );
    check(courses.has(a.courseId), "预约关联课程不存在");
  }
  for (const a of active) {
    const s = sessions.get(a.sessionId!)!;
    check(
      s.status === "scheduled" && s.courseId === a.courseId,
      "预约课次或课程关联不一致",
    );
    check(
      Date.parse(a.appointmentTime) === Date.parse(s.startsAt) &&
        a.duration === s.duration,
      "预约与课次时间不一致",
    );
    check(
      active.filter((other) => other.sessionId === s.id).length <= s.capacity,
      "课次容量不足",
    );
    check(
      !active.some(
        (other) =>
          other.id !== a.id &&
          other.memberId === a.memberId &&
          (other.sessionId === a.sessionId ||
            overlap(s, sessions.get(other.sessionId!)!)),
      ),
      "会员预约重复或时间冲突",
    );
  }
}
