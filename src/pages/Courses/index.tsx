import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  List,
  Select,
  Space,
  Tabs,
  Tag,
  message,
} from "antd";
import { useSearchParams } from "react-router-dom";
import { useAppStore } from "@/store/appStore";
import { APPOINTMENT_STATUS_NAMES } from "@/types";
import type { Course, CourseSession } from "@/types";
import { dateKey, shiftDate } from "@/utils/dates";
import { getOccupancy } from "@/utils/courses";
import CourseForm from "./CourseForm";
import SessionForm from "./SessionForm";
import SessionDetails from "./SessionDetails";

export default function Courses() {
  const state = useAppStore();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState("sessions");
  const [from, setFrom] = useState(dateKey());
  const [to, setTo] = useState(shiftDate(7));
  const [courseId, setCourseId] = useState<string>();
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [courseForm, setCourseForm] = useState<Course | "new" | null>(null);
  const [sessionForm, setSessionForm] = useState<CourseSession | "new" | null>(
    null,
  );
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);
  const selected = state.courseSessions.find(
    (s) => s.id === params.get("session"),
  );
  const showSession = (id?: string) =>
    setParams((old) => {
      const p = new URLSearchParams(old);
      if (id) p.set("session", id);
      else p.delete("session");
      return p;
    });
  const invalidRange = !!(from && to && from > to);
  const sessions = state.courseSessions
    .filter(
      (s) =>
        (!from || dateKey(s.startsAt) >= from) &&
        (!to || dateKey(s.startsAt) <= to) &&
        (!courseId || s.courseId === courseId) &&
        (status === "all" ||
          (status === "upcoming"
            ? s.status === "scheduled" && Date.parse(s.startsAt) > now
            : status === "past"
              ? s.status === "scheduled" && Date.parse(s.startsAt) <= now
              : s.status === "cancelled")) &&
        (!search.trim() ||
          `${s.coach} ${s.venue} ${s.courseName}`
            .toLocaleLowerCase()
            .includes(search.trim().toLocaleLowerCase())),
    )
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const reset = () => {
    setFrom(dateKey());
    setTo(shiftDate(7));
    setCourseId(undefined);
    setStatus("all");
    setSearch("");
  };
  const toggle = (course: Course) => {
    try {
      state.saveCourse({ ...course, active: !course.active }, course.id);
      message.success(
        course.active ? "课程已停用，已有排课保留" : "课程已启用",
      );
    } catch (e) {
      message.error((e as Error).message);
    }
  };
  const schedule = (
    <>
      <div className="filter-bar course-filters">
        <label className="course-date">
          起始日期
          <Input
            aria-label="排课起始日期"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="course-date">
          截止日期
          <Input
            aria-label="排课截止日期"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <Select
          aria-label="按课程筛选"
          placeholder="全部课程"
          allowClear
          value={courseId}
          onChange={setCourseId}
          style={{ minWidth: 160 }}
          options={state.courses.map((c) => ({ value: c.id, label: c.name }))}
        />
        <Select
          aria-label="按课次状态筛选"
          value={status}
          onChange={setStatus}
          style={{ minWidth: 140 }}
          options={[
            { value: "all", label: "全部状态" },
            { value: "upcoming", label: "待开课" },
            { value: "past", label: "已开始" },
            { value: "cancelled", label: "已取消" },
          ]}
        />
        <Input
          aria-label="搜索教练或场地"
          placeholder="搜索课程、教练或场地"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 220 }}
          allowClear
        />
        <Button onClick={reset}>重置筛选</Button>
      </div>
      {invalidRange && (
        <Alert
          type="warning"
          showIcon
          title="起始日期不能晚于截止日期"
          style={{ marginBottom: 16 }}
        />
      )}
      {!sessions.length || invalidRange ? (
        <Card>
          <Empty
            description={
              state.courseSessions.length
                ? "当前筛选没有课次，请调整日期或筛选条件。"
                : "还没有排课，先添加课程，再安排上课时间。"
            }
          >
            <Button
              type="primary"
              onClick={() =>
                state.courses.some((c) => c.active)
                  ? setSessionForm("new")
                  : setCourseForm("new")
              }
            >
              {state.courses.some((c) => c.active)
                ? "安排第一节课"
                : "创建第一门课程"}
            </Button>
          </Empty>
        </Card>
      ) : (
        <div className="course-session-list">
          {sessions.map((s) => {
            const future =
              s.status === "scheduled" && Date.parse(s.startsAt) > now;
            const occupied = getOccupancy(state, s.id);
            return (
              <Card
                key={s.id}
                data-session-id={s.id}
                className="course-session-card"
              >
                <div className="course-session-content">
                  <div>
                    <Space wrap>
                      <h2>{s.courseName}</h2>
                      <Tag
                        color={
                          s.status === "cancelled"
                            ? "default"
                            : future
                              ? "purple"
                              : "default"
                        }
                      >
                        {s.status === "cancelled"
                          ? "已取消"
                          : future
                            ? "待开课"
                            : "已开始"}
                      </Tag>
                      {future && occupied >= s.capacity && (
                        <Tag color="orange">已满</Tag>
                      )}
                    </Space>
                    <p className="course-time">
                      {new Date(s.startsAt).toLocaleString("zh-CN", {
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · {s.duration} 分钟
                    </p>
                    <p className="muted">
                      {s.coach} · {s.venue}
                    </p>
                  </div>
                  <div className="course-session-actions">
                    <span className="course-capacity">
                      {occupied} / {s.capacity}
                      <small> 已占名额</small>
                    </span>
                    <Space wrap>
                      <Button type="primary" onClick={() => showSession(s.id)}>
                        查看预约
                      </Button>
                      {future && (
                        <Button onClick={() => setSessionForm(s)}>
                          编辑排课
                        </Button>
                      )}
                    </Space>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
  const catalog = (
    <Card>
      <List
        rowKey="id"
        locale={{ emptyText: "暂无课程，点击新增课程开始。" }}
        dataSource={state.courses}
        renderItem={(c) => (
          <List.Item
            className="course-catalog-row"
            actions={[
              <Button key="edit" onClick={() => setCourseForm(c)}>
                编辑课程
              </Button>,
              <Button key="toggle" onClick={() => toggle(c)}>
                {c.active ? "停用课程" : "启用课程"}
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={
                <Space wrap>
                  <strong>{c.name}</strong>
                  <Tag color={c.active ? "green" : "default"}>
                    {c.active ? "可排课" : "已停用"}
                  </Tag>
                </Space>
              }
              description={
                <>
                  {c.duration} 分钟 · 默认 {c.capacity} 人<br />
                  {c.notes || "暂无课程说明"}
                </>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
  const history = (
    <Card>
      <Alert
        type="info"
        showIcon
        title="升级前的历史预约只读保留，不自动匹配新课程或生成课次。"
        style={{ marginBottom: 16 }}
      />
      <List
        rowKey="id"
        locale={{ emptyText: "没有旧版历史预约" }}
        dataSource={state.appointments
          .filter((a) => !a.sessionId)
          .sort(
            (a, b) =>
              Date.parse(b.appointmentTime) - Date.parse(a.appointmentTime),
          )}
        renderItem={(a) => (
          <List.Item>
            <List.Item.Meta
              title={
                <Space wrap>
                  <strong>
                    {a.courseName} · {a.memberName}
                  </strong>
                  <Tag>{APPOINTMENT_STATUS_NAMES[a.status]}</Tag>
                </Space>
              }
              description={
                <>
                  {new Date(a.appointmentTime).toLocaleString("zh-CN")} ·{" "}
                  {a.duration} 分钟{a.coach && ` · ${a.coach}`}
                  <br />
                  {a.notes}
                </>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">课程运营</span>
          <h1>课程管理</h1>
          <p>安排课程、管理名额，为会员预约</p>
        </div>
        <Space wrap>
          <Button onClick={() => setCourseForm("new")}>新增课程</Button>
          <Button
            type="primary"
            disabled={!state.courses.some((c) => c.active)}
            onClick={() => setSessionForm("new")}
          >
            新增排课
          </Button>
        </Space>
      </div>
      <Alert
        type="info"
        showIcon
        title="本轮预约不扣费，不支持签到扣次或扣余额。"
        style={{ marginBottom: 20 }}
      />
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: "sessions", label: "排课与预约", children: schedule },
          {
            key: "catalog",
            label: `课程目录（${state.courses.length}）`,
            children: catalog,
          },
          { key: "history", label: "历史预约", children: history },
        ]}
      />
      {params.has("session") && !selected && (
        <Alert
          type="warning"
          title="课次不存在或已被备份恢复替换。"
          action={<Button onClick={() => showSession()}>关闭详情</Button>}
        />
      )}
      {selected && (
        <SessionDetails
          key={selected.id}
          session={selected}
          now={now}
          onClose={() => showSession()}
          onEdit={() => setSessionForm(selected)}
        />
      )}
      {courseForm && (
        <CourseForm
          course={courseForm === "new" ? undefined : courseForm}
          onClose={() => setCourseForm(null)}
        />
      )}
      {sessionForm && (
        <SessionForm
          session={sessionForm === "new" ? undefined : sessionForm}
          onClose={() => setSessionForm(null)}
        />
      )}
    </>
  );
}
