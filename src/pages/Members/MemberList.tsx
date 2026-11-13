import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Card,
  Modal,
  message,
} from "antd";
import type { InputRef } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useAppStore } from "@/store/appStore";
import type { Member } from "@/types";
import { CARD_TYPE_NAMES, STATUS_NAMES } from "@/types";
import { getMemberStatus } from "@/utils/domain";
import { dateKey, shiftDate } from "@/utils/dates";
import MemberForm from "./MemberForm";
export default function MemberList() {
  const { members, addMember, updateMember, archiveMember } = useAppStore();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<Member>();
  const [open, setOpen] = useState(params.get("action") === "new");
  const [page, setPage] = useState(1);
  const [searchReset, setSearchReset] = useState(0);
  const searchInput = useRef<InputRef>(null);
  const urlQuery = params.get("q") || "";
  useEffect(() => {
    if (searchInput.current?.input) searchInput.current.input.value = urlQuery;
  }, [urlQuery]);
  const [size, setSize] = useState(10);
  const change = (key: string, value: string) => {
    const n = new URLSearchParams(params);
    if (value) n.set(key, value);
    else n.delete(key);
    setParams(n);
    setPage(1);
  };
  const filtered = members.filter((m) => {
    const q = (params.get("q") || "").toLowerCase();
    const status = getMemberStatus(m);
    return (
      !!m.archived === (params.get("archive") === "yes") &&
      (!q ||
        [m.name, m.phone, m.memberNo, m.cardNumber].some((x) =>
          x.toLowerCase().includes(q),
        )) &&
      (!params.get("status") || status === params.get("status")) &&
      (!params.get("card") || m.cardType === params.get("card")) &&
      (params.get("due") !== "yes" ||
        (status === "active" &&
          m.expiryDate >= dateKey() &&
          m.expiryDate <= shiftDate(7))) &&
      (params.get("low") !== "yes" ||
        (m.cardType === "times" && m.remainingSessions <= 3))
    );
  });
  const close = () => {
    setOpen(false);
    setEditing(undefined);
    change("action", "");
  };
  const columns: ColumnsType<Member> = [
    {
      title: "会员",
      width: 180,
      render: (_, m) => (
        <>
          <strong>{m.name}</strong>
          {m.isDemo && <Tag>演示</Tag>}
          <div className="muted small">{m.memberNo}</div>
        </>
      ),
    },
    { title: "手机号", dataIndex: "phone", width: 150 },
    {
      title: "卡类型",
      width: 100,
      render: (_, m) => CARD_TYPE_NAMES[m.cardType],
    },
    { title: "余额", width: 110, render: (_, m) => "¥" + m.balance.toFixed(2) },
    {
      title: "剩余次数",
      width: 100,
      render: (_, m) => (m.cardType === "times" ? m.remainingSessions : "—"),
    },
    {
      title: "状态",
      width: 100,
      render: (_, m) => (
        <Tag
          color={
            { active: "green", expired: "red", frozen: "orange" }[
              getMemberStatus(m)
            ]
          }
        >
          {STATUS_NAMES[getMemberStatus(m)]}
        </Tag>
      ),
    },
    { title: "到期日期", dataIndex: "expiryDate", width: 120 },
    {
      title: "操作",
      width: 240,
      render: (_, m) => (
        <Space wrap>
          <Button
            size="small"
            onClick={() => {
              setEditing(m);
              setOpen(true);
            }}
          >
            编辑
          </Button>
          {!m.archived && (
            <Button
              size="small"
              onClick={() =>
                navigate("/transactions?action=consume&member=" + m.id)
              }
            >
              消费
            </Button>
          )}
          <Button
            size="small"
            onClick={() =>
              Modal.confirm({
                title: m.archived ? "恢复会员？" : "归档会员？",
                content: "保留资料与全部交易历史，归档会员不可交易。",
                okText: "确定",
                cancelText: "取消",
                onOk: (close: () => void) => {
                  try {
                    archiveMember(m.id, !m.archived);
                    message.success("已更新");
                    close();
                  } catch (e) {
                    message.error((e as Error).message);
                    // Keep confirmation available for retry.
                  }
                },
              })
            }
          >
            {m.archived ? "恢复" : "归档"}
          </Button>
        </Space>
      ),
    },
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>会员管理</h1>
          <p>资料、会员卡与账户，一处管理</p>
        </div>
        <Button
          type="primary"
          onClick={() => {
            setEditing(undefined);
            setOpen(true);
          }}
        >
          新增会员
        </Button>
      </div>
      <Card>
        <div className="filter-bar">
          <Input.Search
            aria-label="搜索会员"
            placeholder="姓名、手机号、编号、卡号"
            allowClear
            key={searchReset}
            ref={searchInput}
            defaultValue={params.get("q") || ""}
            onChange={(e) => change("q", e.target.value)}
            style={{ width: 280 }}
          />
          <Select
            aria-label="会员状态"
            placeholder="全部状态"
            allowClear
            value={params.get("status") || undefined}
            onChange={(v) => change("status", v || "")}
            options={Object.entries(STATUS_NAMES).map(([value, label]) => ({
              value,
              label,
            }))}
            style={{ width: 150 }}
          />
          <Select
            aria-label="卡类型"
            placeholder="全部卡类型"
            allowClear
            value={params.get("card") || undefined}
            onChange={(v) => change("card", v || "")}
            options={Object.entries(CARD_TYPE_NAMES).map(([value, label]) => ({
              value,
              label,
            }))}
            style={{ width: 140 }}
          />
          <Select
            aria-label="归档筛选"
            value={params.get("archive") || ""}
            onChange={(v) => change("archive", v)}
            options={[
              { value: "", label: "在册会员" },
              { value: "yes", label: "已归档" },
            ]}
            style={{ width: 130 }}
          />
          <Button
            onClick={() => {
              setParams({});
              setSearchReset((n) => n + 1);
              setPage(1);
            }}
          >
            重置筛选
          </Button>
        </div>
        {(params.get("due") || params.get("low")) && (
          <p className="muted">
            当前待办：{params.get("due") ? "7天内到期" : "剩余次数不超过3次"}
          </p>
        )}
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          scroll={{ x: 1200 }}
          pagination={{
            current: page,
            pageSize: size,
            showSizeChanger: true,
            total: filtered.length,
            onChange: (n, s) => {
              setPage(s === size ? n : 1);
              setSize(s);
            },
            showTotal: (n) => "共 " + n + " 位会员",
          }}
        />
      </Card>
      <MemberForm
        visible={open}
        member={editing}
        onClose={close}
        onSubmit={(v) => {
          if (editing) updateMember(editing.id, v);
          else addMember(v);
          message.success("会员已保存");
          close();
        }}
      />
    </>
  );
}
