import type { AppData, CourseInput, SessionInput } from "../types/index.ts";
import { createId } from "./id.ts";
import { dateKey } from "./dates.ts";
import { validateData } from "./validation.ts";
import { courseTime, overlap } from "./courseValidation.ts";

const finish = (data: AppData) => {
  validateData(data);
  return data;
};
const clock = (now: string) => {
  if (!courseTime(now)) throw new Error("操作时间不合法");
  return Date.parse(now);
};
function editable(data: AppData, id: string, now: string) {
  const s = data.courseSessions.find((s) => s.id === id);
  if (!s) throw new Error("课次不存在");
  if (s.status === "cancelled") throw new Error("课次已取消");
  if (Date.parse(s.startsAt) <= clock(now))
    throw new Error("课次已开始，不能进行此操作");
  return s;
}
export function getOccupancy(data: AppData, sessionId: string) {
  return data.appointments.filter(
    (a) => a.sessionId === sessionId && a.status !== "cancelled",
  ).length;
}
export function saveCourse(
  data: AppData,
  input: CourseInput,
  id?: string,
  now = new Date().toISOString(),
): AppData {
  clock(now);
  const old = id ? data.courses.find((c) => c.id === id) : undefined;
  if (id && !old) throw new Error("课程不存在");
  const course = {
    id: old?.id ?? createId(),
    name: typeof input.name === "string" ? input.name.trim() : input.name,
    notes: typeof input.notes === "string" ? input.notes.trim() : input.notes,
    duration: input.duration,
    capacity: input.capacity,
    active: input.active,
    createdAt: old?.createdAt ?? now,
    updatedAt: now,
  };
  return finish({
    ...data,
    courses: old
      ? data.courses.map((c) => (c.id === id ? course : c))
      : [...data.courses, course],
  });
}
export function saveSession(
  data: AppData,
  input: SessionInput,
  id?: string,
  now = new Date().toISOString(),
): AppData {
  const old = id ? editable(data, id, now) : undefined;
  const course = data.courses.find((c) => c.id === input.courseId);
  if (!course || !course.active) throw new Error("课程不存在或已停用");
  if (!courseTime(input.startsAt) || Date.parse(input.startsAt) <= clock(now))
    throw new Error("排课开始时间必须晚于当前时间");
  if (
    old &&
    getOccupancy(data, old.id) > 0 &&
    (old.courseId !== input.courseId ||
      Date.parse(old.startsAt) !== Date.parse(input.startsAt) ||
      old.duration !== input.duration)
  )
    throw new Error("已有预约，不能修改课程、开始时间或时长");
  if (old && input.capacity < getOccupancy(data, old.id))
    throw new Error("容量不能低于已有预约人数");
  const session = {
    id: old?.id ?? createId(),
    courseId: course.id,
    courseName: old?.courseId === course.id ? old.courseName : course.name,
    startsAt: new Date(input.startsAt).toISOString(),
    duration: input.duration,
    capacity: input.capacity,
    coach: typeof input.coach === "string" ? input.coach.trim() : input.coach,
    venue: typeof input.venue === "string" ? input.venue.trim() : input.venue,
    status: "scheduled" as const,
    createdAt: old?.createdAt ?? now,
    updatedAt: now,
  };
  const conflict = data.courseSessions.find(
    (s) =>
      s.id !== id &&
      s.status === "scheduled" &&
      overlap(s, session) &&
      (s.coach === session.coach || s.venue === session.venue),
  );
  if (conflict)
    throw new Error(
      `排课冲突：${conflict.courseName}（${new Date(conflict.startsAt).toLocaleString("zh-CN")}，${conflict.coach} / ${conflict.venue}）`,
    );
  return finish({
    ...data,
    courseSessions: old
      ? data.courseSessions.map((s) => (s.id === id ? session : s))
      : [...data.courseSessions, session],
  });
}
export function getBookingIssue(
  data: AppData,
  sessionId: string,
  memberId: string,
  now = new Date().toISOString(),
): string | null {
  try {
    const s = editable(data, sessionId, now);
    const m = data.members.find((m) => m.id === memberId);
    if (!m || m.archived) return "会员不存在或已归档";
    if (m.status !== "active") return "会员已冻结或标记过期";
    const day = dateKey(s.startsAt);
    if (m.registrationDate > day) return "会员卡在上课日尚未生效";
    if (m.expiryDate < day) return "会员卡在上课日已过期";
    const existing = data.appointments.filter(
      (a) => a.memberId === m.id && a.status !== "cancelled",
    );
    if (existing.some((a) => a.sessionId === s.id))
      return "重复预约：该会员已预约本课次";
    const conflict = existing.find((a) =>
      overlap({ startsAt: a.appointmentTime, duration: a.duration }, s),
    );
    if (conflict) return `会员时间冲突：${conflict.courseName}`;
    if (getOccupancy(data, s.id) >= s.capacity) return "课次名额已满";
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "预约校验失败";
  }
}
export function bookSession(
  data: AppData,
  sessionId: string,
  memberId: string,
  notes = "",
  now = new Date().toISOString(),
): AppData {
  const issue = getBookingIssue(data, sessionId, memberId, now);
  if (issue) throw new Error(issue);
  if (typeof notes !== "string" || notes.length > 500)
    throw new Error("预约备注最多500字");
  const s = data.courseSessions.find((s) => s.id === sessionId)!;
  const m = data.members.find((m) => m.id === memberId)!;
  return finish({
    ...data,
    appointments: [
      ...data.appointments,
      {
        id: createId(),
        sessionId,
        memberId,
        memberName: m.name,
        courseId: s.courseId,
        courseName: s.courseName,
        appointmentTime: s.startsAt,
        duration: s.duration,
        coach: s.coach,
        status: "confirmed",
        notes: notes.trim(),
        createdAt: now,
        updatedAt: now,
      },
    ],
  });
}
export function cancelAppointment(
  data: AppData,
  id: string,
  now = new Date().toISOString(),
): AppData {
  const a = data.appointments.find((a) => a.id === id);
  if (!a?.sessionId) throw new Error("历史预约为只读记录");
  if (!["pending", "confirmed"].includes(a.status))
    throw new Error("已完成或已取消的预约不能取消");
  editable(data, a.sessionId, now);
  return finish({
    ...data,
    appointments: data.appointments.map((a) =>
      a.id === id ? { ...a, status: "cancelled", updatedAt: now } : a,
    ),
  });
}
export function cancelSession(
  data: AppData,
  id: string,
  now = new Date().toISOString(),
): AppData {
  editable(data, id, now);
  if (
    data.appointments.some(
      (a) => a.sessionId === id && a.status === "completed",
    )
  )
    throw new Error("存在已完成的历史预约，不能取消整个课次");
  return finish({
    ...data,
    courseSessions: data.courseSessions.map((s) =>
      s.id === id ? { ...s, status: "cancelled", updatedAt: now } : s,
    ),
    appointments: data.appointments.map((a) =>
      a.sessionId === id && a.status !== "cancelled"
        ? { ...a, status: "cancelled", updatedAt: now }
        : a,
    ),
  });
}
