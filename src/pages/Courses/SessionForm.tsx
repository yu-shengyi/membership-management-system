import { useRef } from "react";
import { Alert, Form, Input, InputNumber, Modal, Select, message } from "antd";
import type { CourseSession, SessionInput } from "@/types";
import { useAppStore } from "@/store/appStore";
import { dateKey, shiftDate } from "@/utils/dates";
import { getOccupancy } from "@/utils/courses";

function localTime(value: string) {
  const d = new Date(value);
  return `${dateKey(d)}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
type Values = Omit<SessionInput, "startsAt"> & { localStart: string };
export default function SessionForm({
  session,
  onClose,
}: {
  session?: CourseSession;
  onClose: () => void;
}) {
  const state = useAppStore();
  const [form] = Form.useForm<Values>();
  const locked = useRef(false);
  const booked = session ? getOccupancy(state, session.id) > 0 : false;
  const submit = (v: Values) => {
    if (locked.current) return;
    locked.current = true;
    try {
      const startsAt =
        session && booked
          ? session.startsAt
          : new Date(v.localStart).toISOString();
      state.saveSession(
        {
          courseId: v.courseId,
          startsAt,
          duration: v.duration,
          capacity: v.capacity,
          coach: v.coach,
          venue: v.venue,
        },
        session?.id,
      );
      message.success("排课已保存");
      onClose();
    } catch (e) {
      locked.current = false;
      message.error((e as Error).message);
    }
  };
  return (
    <Modal
      open
      title={session ? "编辑排课" : "新增排课"}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="保存排课"
      cancelText="取消"
      destroyOnHidden
    >
      {booked && (
        <Alert
          type="info"
          showIcon
          title="已有预约，仅能调整教练、场地和名额。"
          style={{ marginBottom: 16 }}
        />
      )}
      <Form
        form={form}
        name="session-form"
        layout="vertical"
        initialValues={
          session
            ? { ...session, localStart: localTime(session.startsAt) }
            : {
                duration: 60,
                capacity: 12,
                localStart: shiftDate(1) + "T09:00",
              }
        }
        onFinish={submit}
      >
        <Form.Item
          name="courseId"
          label="选择课程"
          rules={[{ required: true, message: "请选择课程" }]}
        >
          <Select
            disabled={booked}
            placeholder="请选择开放排课的课程"
            options={state.courses.map((c) => ({
              value: c.id,
              label: c.name + (!c.active ? "（已停用）" : ""),
              disabled: !c.active,
            }))}
            onChange={(id) => {
              const c = state.courses.find((c) => c.id === id);
              if (c)
                form.setFieldsValue({
                  duration: c.duration,
                  capacity: c.capacity,
                });
            }}
          />
        </Form.Item>
        <Form.Item
          name="localStart"
          label="开始时间"
          rules={[{ required: true, message: "请选择开始时间" }]}
        >
          <Input type="datetime-local" disabled={booked} />
        </Form.Item>
        <div className="course-form-grid">
          <Form.Item
            name="duration"
            label="时长（分钟）"
            rules={[{ required: true }]}
          >
            <InputNumber
              min={5}
              max={480}
              precision={0}
              disabled={booked}
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item
            name="capacity"
            label="课次名额"
            rules={[{ required: true }]}
          >
            <InputNumber
              min={session ? Math.max(1, getOccupancy(state, session.id)) : 1}
              max={500}
              precision={0}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </div>
        <Form.Item
          name="coach"
          label="教练"
          rules={[
            { required: true, whitespace: true, message: "请输入教练姓名" },
          ]}
        >
          <Input maxLength={80} />
        </Form.Item>
        <Form.Item
          name="venue"
          label="场地"
          rules={[
            { required: true, whitespace: true, message: "请输入场地名称" },
          ]}
        >
          <Input maxLength={80} />
        </Form.Item>
        <p className="muted small">
          时间使用本机时区。同一教练或场地不能重叠；前课结束时可开始下一课。
        </p>
      </Form>
    </Modal>
  );
}
