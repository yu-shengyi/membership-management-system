import { Card, Alert, Button, Empty, Space } from "antd";
export default function Courses() {
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>课程管理</h1>
          <p>课程与预约功能规划</p>
        </div>
      </div>
      <Alert
        type="info"
        showIcon
        title="课程预约尚未开放"
        description="后续可扩展课程排期、教练与场地、名额限制、预约取消和签到扣次。目前没有真实课程与预约操作。"
        style={{ marginBottom: 20 }}
      />
      <Card>
        <Empty description="暂无可预约课程">
          <Space wrap>
            <Button disabled>新增课程（待开放）</Button>
            <Button disabled>预约日历（待开放）</Button>
          </Space>
        </Empty>
      </Card>
    </>
  );
}
