import { Button, Card, Col, Row, Statistic, Table, Empty, Space } from "antd";
import { useNavigate, Link } from "react-router-dom";
import { useAppStore } from "@/store/appStore";
import { getMemberStatus } from "@/utils/domain";
import { dateKey, shiftDate } from "@/utils/dates";
import { TRANSACTION_TYPE_NAMES } from "@/types";
import { getOccupancy } from "@/utils/courses";
export default function Dashboard() {
  const state = useAppStore();
  const { members, transactions, courseSessions } = state;
  const nav = useNavigate();
  const current = members.filter((m) => !m.archived);
  const today = dateKey();
  const todaySessions = courseSessions
    .filter((s) => s.status === "scheduled" && dateKey(s.startsAt) === today)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const due = current.filter(
    (m) =>
      getMemberStatus(m) === "active" &&
      m.expiryDate >= today &&
      m.expiryDate <= shiftDate(7),
  );
  const low = current.filter(
    (m) => m.cardType === "times" && m.remainingSessions <= 3,
  );
  const recent = [...transactions]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">日常运营 · {today}</span>
          <h1>工作台</h1>
          <p>从这里开始今天的会员服务</p>
        </div>
        <Space wrap>
          <Button type="primary" onClick={() => nav("/members?action=new")}>
            新增会员
          </Button>
          <Button onClick={() => nav("/transactions?action=recharge")}>
            充值
          </Button>
          <Button onClick={() => nav("/transactions?action=consume")}>
            消费
          </Button>
        </Space>
      </div>
      <Row gutter={[16, 16]} className="metric-row">
        {[
          { label: "在册会员", value: current.length, suffix: "人" },
          {
            label: "正常会员",
            value: current.filter((m) => getMemberStatus(m) === "active")
              .length,
            suffix: "人",
          },
          {
            label: "当前账户余额合计",
            value:
              current.reduce((n, m) => n + Math.round(m.balance * 100), 0) /
              100,
            suffix: "元",
            precision: 2,
          },
          {
            label: "今日消费金额",
            value:
              transactions
                .filter(
                  (t) => t.type === "consume" && dateKey(t.createdAt) === today,
                )
                .reduce((n, t) => n + Math.round(t.amount * 100), 0) / 100,
            suffix: "元",
            precision: 2,
          },
        ].map((item) => (
          <Col xs={24} sm={12} xl={6} key={item.label}>
            <Card>
              <Statistic
                title={item.label}
                value={item.value}
                suffix={item.suffix}
                precision={item.precision}
              />
            </Card>
          </Col>
        ))}
      </Row>
      <Card
        title="今日课程"
        extra={<Link to="/courses">查看排课</Link>}
        style={{ marginBottom: 24 }}
      >
        <p className="muted small">
          {todaySessions.length} 节课程 ·{" "}
          {todaySessions.reduce((n, s) => n + getOccupancy(state, s.id), 0)}{" "}
          人次有效预约 · 预约不扣费
        </p>
        {todaySessions.length ? (
          todaySessions.map((s) => (
            <div className="todo-row" key={s.id}>
              <div>
                <strong>{s.courseName}</strong>
                <p className="muted">
                  {new Date(s.startsAt).toLocaleTimeString("zh-CN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · {s.coach} · {s.venue}
                </p>
              </div>
              <Link to={`/courses?session=${encodeURIComponent(s.id)}`}>
                {getOccupancy(state, s.id)} / {s.capacity} 人 →
              </Link>
            </div>
          ))
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="今天暂无课程，可前往课程管理安排排课。"
          />
        )}
      </Card>
      <Row gutter={[20, 20]}>
        <Col xs={24} xl={16}>
          <Card
            title="最近交易"
            extra={<Link to="/transactions">查看全部</Link>}
          >
            {recent.length ? (
              <Table
                size="small"
                rowKey="id"
                pagination={false}
                scroll={{ x: 520 }}
                dataSource={recent}
                columns={[
                  { title: "会员", dataIndex: "memberName" },
                  {
                    title: "类型",
                    render: (_, t) => TRANSACTION_TYPE_NAMES[t.type],
                  },
                  {
                    title: "金额",
                    render: (_, t) => "¥" + t.amount.toFixed(2),
                  },
                  {
                    title: "时间",
                    render: (_, t) =>
                      new Date(t.createdAt).toLocaleString("zh-CN"),
                  },
                ]}
              />
            ) : (
              <Empty description="还没有交易记录">
                <Button onClick={() => nav("/transactions?action=recharge")}>
                  为会员充值
                </Button>
              </Empty>
            )}
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title="服务提醒">
            <div className="todo-row">
              <div>
                <strong>7 天内到期</strong>
                <p className="muted">提前联系会员，安排续卡</p>
              </div>
              <Link to="/members?due=yes">{due.length} 人 →</Link>
            </div>
            <div className="todo-row">
              <div>
                <strong>次数即将用完</strong>
                <p className="muted">剩余不超过 3 次</p>
              </div>
              <Link to="/members?low=yes">{low.length} 人 →</Link>
            </div>
            <p className="muted small">
              余额为当前账户快照；充值和消费分别统计，不能相加视为营收。
            </p>
          </Card>
        </Col>
      </Row>
      {!current.length && (
        <Card style={{ marginTop: 20 }}>
          <Empty description="欢迎使用会员管理系统，先添加第一位会员。">
            <Button type="primary" onClick={() => nav("/members?action=new")}>
              新增会员
            </Button>
            <Button type="link" onClick={() => nav("/settings")}>
              在设置中试用演示数据
            </Button>
          </Empty>
        </Card>
      )}
    </>
  );
}
