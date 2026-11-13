import { useEffect, useRef, useState } from "react";
import { Modal, Form, Select, InputNumber, Input, Alert, message } from "antd";
import { useAppStore } from "@/store/appStore";
import { PAYMENT_METHOD_NAMES } from "@/types";
import type { PaymentMethod } from "@/types";
interface Props {
  type: "recharge" | "consume";
  open: boolean;
  memberId?: string;
  onClose: () => void;
}
export default function TransactionForm({
  type,
  open,
  memberId,
  onClose,
}: Props) {
  const { members, transact } = useAppStore();
  const [form] = Form.useForm();
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);
  const id = Form.useWatch("memberId", form);
  const amount = Form.useWatch("amount", form);
  const sessions = Form.useWatch("sessions", form);
  const m = members.find((x) => x.id === id);
  const consuming = type === "consume";
  useEffect(() => {
    if (open) {
      submitting.current = false;
      form.resetFields();
      form.setFieldsValue({
        memberId,
        paymentMethod: consuming ? "balance" : "wechat",
      });
    }
  }, [open, memberId, consuming, form]);
  const submit = async () => {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    try {
      const v = await form.validateFields();
      transact({
        ...v,
        type,
        sessions:
          consuming && m?.cardType === "times" && v.sessions != null
            ? v.sessions
            : undefined,
        paymentMethod: consuming ? "balance" : v.paymentMethod,
      });
      setBusy(false);
      message.success(consuming ? "消费成功" : "充值成功");
      onClose();
    } catch (e) {
      submitting.current = false;
      setBusy(false);
      if (e instanceof Error) message.error(e.message);
    }
  };
  return (
    <Modal
      title={consuming ? "会员消费" : "会员充值"}
      open={open}
      onCancel={onClose}
      onOk={submit}
      confirmLoading={busy}
      okText={consuming ? "确认扣款" : "确认充值"}
      cancelText="取消"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="memberId"
          label="会员"
          rules={[{ required: true, message: "请选择会员" }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="搜索姓名、手机号或卡号"
            options={members
              .filter((x) => !x.archived)
              .map((x) => ({
                value: x.id,
                label: x.name + " · " + x.phone + " · " + x.cardNumber,
              }))}
            onChange={() => form.setFieldValue("sessions", undefined)}
          />
        </Form.Item>
        {m && (
          <p>
            当前余额 <strong>¥{m.balance.toFixed(2)}</strong>
            {m.cardType === "times"
              ? " · 剩余 " + m.remainingSessions + " 次"
              : ""}
          </p>
        )}
        <Form.Item
          name="amount"
          label={consuming ? "消费金额" : "充值金额"}
          rules={[{ required: true, message: "请输入金额" }]}
        >
          <InputNumber
            min={0.01}
            precision={2}
            prefix="¥"
            style={{ width: "100%" }}
          />
        </Form.Item>
        {consuming ? (
          <Alert type="info" title="从会员账户余额扣款" />
        ) : (
          <Form.Item
            name="paymentMethod"
            label="收款方式"
            rules={[{ required: true }]}
          >
            <Select
              options={(Object.keys(PAYMENT_METHOD_NAMES) as PaymentMethod[])
                .filter((k) => k !== "balance")
                .map((value) => ({
                  value,
                  label: PAYMENT_METHOD_NAMES[value],
                }))}
            />
          </Form.Item>
        )}
        {consuming && m?.cardType === "times" && (
          <Form.Item
            name="sessions"
            label="同时扣除次数（可选）"
            extra="填写后将同时扣款和扣次；留空只扣款。"
          >
            <InputNumber
              min={1}
              precision={0}
              max={m.remainingSessions}
              style={{ width: "100%" }}
            />
          </Form.Item>
        )}
        {m && Number.isFinite(amount) && (
          <Alert
            style={{ margin: "16px 0" }}
            type={consuming && amount > m.balance ? "error" : "info"}
            title={
              "提交后余额：¥" +
              (
                (Math.round(m.balance * 100) +
                  (consuming ? -1 : 1) * Math.round(amount * 100)) /
                100
              ).toFixed(2) +
              (consuming && sessions ? "；同时扣除 " + sessions + " 次" : "")
            }
          />
        )}
        <Form.Item name="notes" label="备注">
          <Input.TextArea rows={2} maxLength={500} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
