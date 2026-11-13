import { createId } from "@/utils/id";
import { useEffect, useRef, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Row,
  Col,
  Divider,
  Alert,
  message,
} from "antd";
import type { Member } from "@/types";
import { CARD_TYPE_NAMES, LEVEL_NAMES } from "@/types";
import dayjs from "dayjs";
interface Props {
  visible: boolean;
  member?: Member;
  onClose: () => void;
  onSubmit: (m: Omit<Member, "id" | "createdAt" | "updatedAt">) => void;
}
export default function MemberForm({
  visible,
  member,
  onClose,
  onSubmit,
}: Props) {
  const [form] = Form.useForm();
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);
  const cardType = Form.useWatch("cardType", form);
  useEffect(() => {
    if (visible) {
      submitting.current = false;
      form.resetFields();
      form.setFieldsValue(
        member
          ? {
              ...member,
              birthday: member.birthday ? dayjs(member.birthday) : undefined,
              registrationDate: dayjs(member.registrationDate),
              expiryDate: dayjs(member.expiryDate),
            }
          : {
              status: "active",
              level: "bronze",
              cardType: "times",
              balance: 0,
              points: 0,
              remainingSessions: 0,
              registrationDate: dayjs(),
              expiryDate: dayjs().add(1, "year"),
              memberNo: "VIP-" + createId(),
              cardNumber: "C-" + createId(),
            },
      );
    }
  }, [visible, member, form]);
  const submit = async () => {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    try {
      const v = await form.validateFields();
      onSubmit({
        ...v,
        name: v.name.trim(),
        phone: v.phone.trim(),
        cardNumber: v.cardNumber.trim(),
        birthday: v.birthday?.format("YYYY-MM-DD"),
        registrationDate: v.registrationDate.format("YYYY-MM-DD"),
        expiryDate: v.expiryDate.format("YYYY-MM-DD"),
        remainingSessions: cardType === "times" ? v.remainingSessions : 0,
      });
      setBusy(false);
    } catch (e) {
      submitting.current = false;
      setBusy(false);
      if (e instanceof Error) message.error(e.message);
    }
  };
  const item = (
    name: string,
    label: string,
    child: React.ReactNode,
    required = false,
  ) => (
    <Col xs={24} sm={12}>
      <Form.Item
        name={name}
        label={label}
        rules={required ? [{ required: true, message: "请填写" + label }] : []}
      >
        {child}
      </Form.Item>
    </Col>
  );
  return (
    <Modal
      title={member ? "编辑会员" : "新增会员"}
      open={visible}
      onCancel={onClose}
      onOk={submit}
      confirmLoading={busy}
      okText="保存会员"
      cancelText="取消"
      width={760}
      styles={{
        body: {
          maxHeight: "calc(100dvh - 240px)",
          overflowY: "auto",
          paddingRight: 8,
        },
      }}
    >
      <Form form={form} layout="vertical" className="member-form">
        <Divider titlePlacement="left">基本资料</Divider>
        <Row gutter={20}>
          {item("name", "会员姓名", <Input maxLength={50} />, true)}
          <Col xs={24} sm={12}>
            <Form.Item
              name="phone"
              label={member?.isDemo ? "演示联系标识（不用于联系）" : "手机号"}
              rules={
                member?.isDemo
                  ? []
                  : [
                      { required: true, message: "请输入手机号" },
                      { pattern: /^1[3-9]\d{9}$/, message: "请输入11位手机号" },
                    ]
              }
            >
              <Input
                disabled={!!member?.isDemo}
                maxLength={member?.isDemo ? undefined : 11}
              />
            </Form.Item>
          </Col>
          {item(
            "gender",
            "性别",
            <Select
              allowClear
              options={[
                { value: "male", label: "男" },
                { value: "female", label: "女" },
              ]}
            />,
          )}
          {item("birthday", "生日", <DatePicker style={{ width: "100%" }} />)}
        </Row>
        <Divider titlePlacement="left">会员卡</Divider>
        <Row gutter={20}>
          {item("memberNo", "会员编号", <Input disabled />, true)}
          {item("cardNumber", "卡号", <Input />, true)}
          {item(
            "cardType",
            "卡类型",
            <Select
              disabled={!!member}
              options={Object.entries(CARD_TYPE_NAMES).map(
                ([value, label]) => ({ value, label }),
              )}
            />,
            true,
          )}
          {item(
            "level",
            "会员等级",
            <Select
              options={Object.entries(LEVEL_NAMES).map(([value, label]) => ({
                value,
                label,
              }))}
            />,
            true,
          )}
          {item(
            "registrationDate",
            "生效日期",
            <DatePicker style={{ width: "100%" }} />,
            true,
          )}
          {item(
            "expiryDate",
            "到期日期（含当天）",
            <DatePicker style={{ width: "100%" }} />,
            true,
          )}
          {item(
            "status",
            "状态",
            <Select
              options={[
                { value: "active", label: "正常（到期自动显示过期）" },
                { value: "frozen", label: "冻结" },
                { value: "expired", label: "手动标记过期" },
              ]}
            />,
            true,
          )}
        </Row>
        <Divider titlePlacement="left">账户信息</Divider>
        {member && (
          <Alert
            type="info"
            showIcon
            title="编辑资料时账户数值只读；余额变动请使用充值或消费。"
            style={{ marginBottom: 16 }}
          />
        )}
        <Row gutter={20}>
          {item(
            "balance",
            member ? "账户余额" : "初始余额",
            <InputNumber
              disabled={!!member}
              min={0}
              precision={2}
              style={{ width: "100%" }}
            />,
            true,
          )}
          {item(
            "points",
            "积分",
            <InputNumber
              disabled={!!member}
              min={0}
              precision={0}
              style={{ width: "100%" }}
            />,
            true,
          )}
          {cardType === "times" &&
            item(
              "remainingSessions",
              "剩余次数",
              <InputNumber
                disabled={!!member}
                min={0}
                precision={0}
                style={{ width: "100%" }}
              />,
              true,
            )}
        </Row>
        <Form.Item name="notes" label="备注">
          <Input.TextArea rows={3} maxLength={500} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
