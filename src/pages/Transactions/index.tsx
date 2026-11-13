import { useState } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  DatePicker,
  Select,
  Statistic,
  Row,
  Col,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useSearchParams } from "react-router-dom";
import { useAppStore } from "@/store/appStore";
import type { Transaction } from "@/types";
import { TRANSACTION_TYPE_NAMES, PAYMENT_METHOD_NAMES } from "@/types";
import { dateKey } from "@/utils/dates";
import TransactionForm from "@/components/TransactionForm";
export default function Transactions() {
  const { transactions, members } = useAppStore();
  const [params, setParams] = useSearchParams();
  const [type, setType] = useState<string>();
  const [member, setMember] = useState<string>();
  const [range, setRange] = useState<[string, string]>();
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const filtered = transactions
    .filter(
      (t) =>
        (!type || t.type === type) &&
        (!member || t.memberId === member) &&
        (!range ||
          (dateKey(t.createdAt) >= range[0] &&
            dateKey(t.createdAt) <= range[1])),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const columns: ColumnsType<Transaction> = [
    {
      title: "交易时间",
      dataIndex: "createdAt",
      width: 180,
      render: (v) => new Date(v).toLocaleString("zh-CN"),
    },
    { title: "会员", dataIndex: "memberName", width: 120 },
    {
      title: "类型",
      width: 90,
      render: (_, t) => (
        <Tag color={t.type === "recharge" ? "green" : "blue"}>
          {TRANSACTION_TYPE_NAMES[t.type]}
        </Tag>
      ),
    },
    { title: "金额", width: 110, render: (_, t) => "¥" + t.amount.toFixed(2) },
    {
      title: "支付方式",
      width: 110,
      render: (_, t) => PAYMENT_METHOD_NAMES[t.paymentMethod],
    },
    {
      title: "余额变动",
      width: 180,
      render: (_, t) =>
        "¥" + t.balanceBefore.toFixed(2) + " → ¥" + t.balanceAfter.toFixed(2),
    },
    { title: "扣除次数", width: 90, render: (_, t) => t.sessions ?? "未记录" },
    { title: "备注", dataIndex: "notes", width: 180 },
  ];
  const close = () => {
    const n = new URLSearchParams(params);
    n.delete("action");
    n.delete("member");
    setParams(n);
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>交易记录</h1>
          <p>每笔账户变动均保留完整流水</p>
        </div>
        <Space wrap>
          <Button
            type="primary"
            onClick={() => setParams({ action: "recharge" })}
          >
            会员充值
          </Button>
          <Button onClick={() => setParams({ action: "consume" })}>
            会员消费
          </Button>
        </Space>
      </div>
      <Row gutter={[16, 16]} className="metric-row">
        {(["recharge", "consume", "refund"] as const).map((k) => (
          <Col xs={24} sm={8} key={k}>
            <Card>
              <Statistic
                title={"筛选范围内" + TRANSACTION_TYPE_NAMES[k]}
                value={
                  filtered
                    .filter((t) => t.type === k)
                    .reduce((n, t) => n + Math.round(t.amount * 100), 0) / 100
                }
                precision={2}
                prefix="¥"
              />
            </Card>
          </Col>
        ))}
      </Row>
      <Card>
        <div className="filter-bar">
          <DatePicker.RangePicker
            onChange={(v) => {
              setRange(
                v && v[0] && v[1]
                  ? [v[0].format("YYYY-MM-DD"), v[1].format("YYYY-MM-DD")]
                  : undefined,
              );
              setPage(1);
            }}
          />
          <Select
            aria-label="交易类型"
            placeholder="全部交易类型"
            allowClear
            style={{ width: 160 }}
            onChange={(v) => {
              setType(v);
              setPage(1);
            }}
            options={Object.entries(TRANSACTION_TYPE_NAMES).map(
              ([value, label]) => ({ value, label }),
            )}
          />
          <Select
            aria-label="交易会员"
            placeholder="全部会员（含归档）"
            allowClear
            showSearch
            optionFilterProp="label"
            style={{ width: 240 }}
            onChange={(v) => {
              setMember(v);
              setPage(1);
            }}
            options={members.map((m) => ({
              value: m.id,
              label: m.name + " · " + m.phone,
            }))}
          />
        </div>
        <Table
          rowKey="id"
          dataSource={filtered}
          columns={columns}
          scroll={{ x: 1100 }}
          pagination={{
            current: page,
            pageSize: size,
            showSizeChanger: true,
            onChange: (n, s) => {
              setPage(s === size ? n : 1);
              setSize(s);
            },
            showTotal: (n) => "共 " + n + " 笔",
          }}
        />
      </Card>
      <TransactionForm
        type={params.get("action") === "consume" ? "consume" : "recharge"}
        open={["recharge", "consume"].includes(params.get("action") || "")}
        memberId={params.get("member") || undefined}
        onClose={close}
      />
    </>
  );
}
