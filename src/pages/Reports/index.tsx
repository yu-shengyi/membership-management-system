import { useState } from "react";
import {
  Card,
  Col,
  Row,
  DatePicker,
  Select,
  Statistic,
  Alert,
  Empty,
} from "antd";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import dayjs from "dayjs";
import { useAppStore } from "@/store/appStore";
import { CARD_TYPE_NAMES, TRANSACTION_TYPE_NAMES } from "@/types";
import type { CardType } from "@/types";
import { dateKey, shiftDate } from "@/utils/dates";
import { transactionTrend } from "@/utils/reports";
export default function Reports() {
  const { members, transactions } = useAppStore();
  const [range, setRange] = useState<[string, string]>(() => [
    shiftDate(-29),
    dateKey(),
  ]);
  const [unit, setUnit] = useState<"day" | "week" | "month">("day");
  const filtered = transactions.filter(
    (t) => dateKey(t.createdAt) >= range[0] && dateKey(t.createdAt) <= range[1],
  );
  const trend = transactionTrend(transactions, range[0], range[1], unit);
  const cards = (Object.entries(CARD_TYPE_NAMES) as [CardType, string][]).map(
    ([key, name]) => ({
      name,
      count: members.filter((m) => !m.archived && m.cardType === key).length,
    }),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>数据报表</h1>
          <p>按时间查看流水，了解会员卡分布</p>
        </div>
      </div>
      <Card style={{ marginBottom: 20 }}>
        <div className="filter-bar">
          <DatePicker.RangePicker
            allowClear={false}
            value={[dayjs(range[0]), dayjs(range[1])]}
            onChange={(v) => {
              if (v?.[0] && v[1])
                setRange([
                  v[0].format("YYYY-MM-DD"),
                  v[1].format("YYYY-MM-DD"),
                ]);
            }}
            disabledDate={(d) => d.isAfter(dayjs(), "day")}
            maxDate={dayjs()}
          />
          <Select
            aria-label="统计粒度"
            value={unit}
            onChange={setUnit}
            options={[
              { value: "day", label: "按天" },
              { value: "week", label: "按周（周一开始）" },
              { value: "month", label: "按月" },
            ]}
            style={{ width: 190 }}
          />
        </div>
        <Alert
          type="info"
          showIcon
          title="充值是账户入金，消费是余额支出；两者分开统计。以下卡类型分布为当前在册快照。"
        />
      </Card>
      <Row gutter={[16, 16]} className="metric-row">
        {(["recharge", "consume", "refund"] as const).map((type) => (
          <Col xs={24} sm={8} key={type}>
            <Card>
              <Statistic
                title={"区间" + TRANSACTION_TYPE_NAMES[type]}
                value={
                  filtered
                    .filter((t) => t.type === type)
                    .reduce((n, t) => n + Math.round(t.amount * 100), 0) / 100
                }
                precision={2}
                prefix="¥"
              />
            </Card>
          </Col>
        ))}
      </Row>
      <Row gutter={[20, 20]}>
        <Col xs={24} xl={16}>
          <Card title="交易趋势">
            {filtered.length ? (
              <div style={{ height: 320, width: "100%", minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" minTickGap={30} />
                    <YAxis width={55} />
                    <Tooltip />
                    <Legend />
                    {(["recharge", "consume", "refund"] as const).map(
                      (key, i) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          name={TRANSACTION_TYPE_NAMES[key]}
                          stroke={["#7561cf", "#2c9e9a", "#e6a04c"][i]}
                          dot={false}
                        />
                      ),
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty description="所选时间没有交易" />
            )}
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title="当前卡类型分布（含全部 5 类）">
            <div style={{ height: 320, width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cards}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} width={35} />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    name="会员人数"
                    fill="#8e7bd9"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </>
  );
}
