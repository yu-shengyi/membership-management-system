import { useRef } from "react";
import { Form, Input, InputNumber, Modal, Switch, message } from "antd";
import type { Course, CourseInput } from "@/types";
import { useAppStore } from "@/store/appStore";

export default function CourseForm({
  course,
  onClose,
}: {
  course?: Course;
  onClose: () => void;
}) {
  const [form] = Form.useForm<CourseInput>();
  const locked = useRef(false);
  const save = useAppStore((s) => s.saveCourse);
  const submit = (values: CourseInput) => {
    if (locked.current) return;
    locked.current = true;
    try {
      save(values, course?.id);
      message.success("课程已保存");
      onClose();
    } catch (e) {
      locked.current = false;
      message.error((e as Error).message);
    }
  };
  return (
    <Modal
      open
      title={course ? "编辑课程" : "新增课程"}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="保存课程"
      cancelText="取消"
      destroyOnHidden
    >
      <Form
        form={form}
        name="course-form"
        layout="vertical"
        initialValues={course ?? { duration: 60, capacity: 12, active: true }}
        onFinish={submit}
      >
        <Form.Item
          name="name"
          label="课程名称"
          rules={[
            { required: true, whitespace: true, message: "请输入课程名称" },
          ]}
        >
          <Input maxLength={80} />
        </Form.Item>
        <div className="course-form-grid">
          <Form.Item
            name="duration"
            label="默认时长（分钟）"
            rules={[{ required: true }]}
          >
            <InputNumber
              min={5}
              max={480}
              precision={0}
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item
            name="capacity"
            label="默认名额"
            rules={[{ required: true }]}
          >
            <InputNumber
              min={1}
              max={500}
              precision={0}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </div>
        <Form.Item name="notes" label="课程说明">
          <Input.TextArea maxLength={500} showCount rows={3} />
        </Form.Item>
        <Form.Item name="active" label="开放排课" valuePropName="checked">
          <Switch />
        </Form.Item>
        <p className="muted small">
          课程更新只影响之后的新排课，已排课次保留原信息。
        </p>
      </Form>
    </Modal>
  );
}
