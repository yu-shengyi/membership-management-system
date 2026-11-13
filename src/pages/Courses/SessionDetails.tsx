import { useRef, useState } from "react";
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Form,
  Input,
  List,
  Modal,
  Select,
  Space,
  Tag,
  message,
} from "antd";
import { useAppStore } from "@/store/appStore";
import { APPOINTMENT_STATUS_NAMES } from "@/types";
import type { CourseSession } from "@/types";
import { getBookingIssue, getOccupancy } from "@/utils/courses";

export default function SessionDetails({
  session,
  now,
  onClose,
  onEdit,
}: {
  session: CourseSession;
  now: number;
  onClose: () => void;
  onEdit: () => void;
}) {
  const state = useAppStore();
  const [memberId, setMemberId] = useState<string>();
  const [notes, setNotes] = useState("");
  const locked = useRef(false);
  const future =
    Date.parse(session.startsAt) > now && session.status === "scheduled";
  const issue = memberId ? getBookingIssue(state, session.id, memberId) : null;
  const list = state.appointments.filter((a) => a.sessionId === session.id);
  const confirm = (title: string, content: string, fn: () => void) =>
    Modal.confirm({
      title,
      content,
      okText: "确认取消",
      cancelText: "返回",
      onOk: (close) => {
        try {
          fn();
          message.success("已取消，记录已保留");
          close();
        } catch (e) {
          message.error((e as Error).message);
        }
      },
    });
  const book = () => {
    if (!memberId || locked.current) return;
    locked.current = true;
    try {
      state.bookSession(session.id, memberId, notes);
      message.success("预约成功，本次不扣费");
      setMemberId(undefined);
      setNotes("");
      setTimeout(() => {
        locked.current = false;
      }, 300);
    } catch (e) {
      locked.current = false;
      message.error((e as Error).message);
    }
  };
  return (
    <Drawer
      open
      title="课次与预约"
      size={560}
      onClose={onClose}
      destroyOnHidden
      extra={future && <Button onClick={onEdit}>编辑排课</Button>}
    >
      <h2>{session.courseName}</h2>
      <Descriptions
        column={1}
        size="small"
        items={[
          {
            key: "time",
            label: "上课时间",
            children: new Date(session.startsAt).toLocaleString("zh-CN"),
          },
          {
            key: "duration",
            label: "时长",
            children: `${session.duration} 分钟`,
          },
          {
            key: "coach",
            label: "教练 / 场地",
            children: `${session.coach} / ${session.venue}`,
          },
          {
            key: "capacity",
            label: "已占名额",
            children: `${getOccupancy(state, session.id)} / ${session.capacity}`,
          },
          {
            key: "status",
            label: "状态",
            children:
              session.status === "cancelled" ? (
                <Tag color="default">已取消</Tag>
              ) : (
                <Tag color={future ? "purple" : "default"}>
                  {future ? "待开课" : "已开始"}
                </Tag>
              ),
          },
        ]}
      />
      <Alert
        type="info"
        showIcon
        title="预约不收费"
        description="本轮仅支持排课和预约，不提供签到或扣费。会员余额、次数和交易流水保持不变。"
        style={{ margin: "20px 0" }}
      />
      {future && (
        <Form layout="vertical" name="booking-form">
          <Form.Item label="预约会员" htmlFor="booking-member">
            <Select
              id="booking-member"
              showSearch={{ optionFilterProp: "label" }}
              value={memberId}
              onChange={setMemberId}
              placeholder="搜索姓名、手机号或会员号"
              style={{ width: "100%" }}
              options={state.members
                .filter((m) => !m.archived)
                .map((m) => ({
                  value: m.id,
                  label: `${m.name} · ${m.phone} · ${m.memberNo}`,
                }))}
            />
          </Form.Item>
          <Form.Item label="预约备注" htmlFor="booking-notes">
            <Input.TextArea
              id="booking-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={2}
            />
          </Form.Item>
          {issue && (
            <Alert
              type="warning"
              showIcon
              title={issue}
              style={{ marginBottom: 12 }}
            />
          )}
          <Button type="primary" disabled={!memberId || !!issue} onClick={book}>
            确认预约
          </Button>
        </Form>
      )}
      <h3 style={{ marginTop: 28 }}>
        预约名单 <span className="muted small">含已取消记录</span>
      </h3>
      <List
        locale={{ emptyText: "暂无预约，选择会员添加第一条预约。" }}
        dataSource={list}
        rowKey="id"
        renderItem={(a) => (
          <List.Item
            className="booking-row"
            data-appointment-id={a.id}
            actions={
              future && ["pending", "confirmed"].includes(a.status)
                ? [
                    <Button
                      key="cancel"
                      size="small"
                      danger
                      onClick={() =>
                        confirm(
                          "取消这条预约？",
                          "取消后立即释放名额，不产生扣款或退款。",
                          () => state.cancelAppointment(a.id),
                        )
                      }
                    >
                      取消预约
                    </Button>,
                  ]
                : []
            }
          >
            <List.Item.Meta
              title={
                <Space wrap>
                  <strong>{a.memberName}</strong>
                  <Tag color={a.status === "cancelled" ? "default" : "purple"}>
                    {APPOINTMENT_STATUS_NAMES[a.status]}
                  </Tag>
                </Space>
              }
              description={
                <>
                  <span>{a.notes || "无备注"}</span>
                  <br />
                  <span className="small">
                    预约于 {new Date(a.createdAt).toLocaleString("zh-CN")}
                  </span>
                </>
              }
            />
          </List.Item>
        )}
      />
      {future && (
        <Button
          danger
          style={{ marginTop: 24 }}
          onClick={() =>
            confirm(
              "取消整个课次？",
              `将同时取消该课次的 ${getOccupancy(state, session.id)} 条有效预约，记录保留。`,
              () => state.cancelSession(session.id),
            )
          }
        >
          取消课次
        </Button>
      )}
    </Drawer>
  );
}
