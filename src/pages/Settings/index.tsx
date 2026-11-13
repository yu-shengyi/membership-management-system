import { useState } from "react";
import {
  Card,
  Button,
  Space,
  message,
  Upload,
  Modal,
  List,
  Tag,
  Progress,
  Alert,
} from "antd";
import { storage } from "@/utils/storage";
import { useAppStore } from "@/store/appStore";
import type { Backup } from "@/types";
export default function Settings() {
  const { load, addDemo, clearDemo } = useAppStore();
  const [, refresh] = useState(0);
  let backups: Backup[] = [];
  let historyError = "";
  try {
    backups = storage.getAutoBackups();
  } catch (e) {
    historyError = (e as Error).message;
  }
  const info = storage.getStorageInfo();
  const act = (fn: () => unknown) => {
    try {
      fn();
      load();
      refresh((n) => n + 1);
      message.success("操作完成");
    } catch (e) {
      message.error((e as Error).message);
      throw e;
    }
  };
  const importFile = (file: File) => {
    file
      .text()
      .then((text) => {
        const b = storage.previewBackup(text);
        Modal.confirm({
          title: "确认导入备份",
          content: (
            <>
              <p>文件时间：{new Date(b.timestamp).toLocaleString("zh-CN")}</p>
              <p>
                会员 {b.data.members.length} 人 · 交易{" "}
                {b.data.transactions.length} 笔 · 预约{" "}
                {b.data.appointments.length} 条
              </p>
              <p>
                将完整替换当前数据。建议先导出当前备份；历史备份保留最近7次。
              </p>
            </>
          ),
          okText: "确认导入",
          cancelText: "取消",
          onOk: () => act(() => storage.importBackup(text)),
        });
      })
      .catch((e) => message.error("导入失败：" + e.message));
    return false;
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>系统设置</h1>
          <p>备份、恢复与本地数据维护</p>
        </div>
      </div>
      <Alert
        type="info"
        showIcon
        title="数据保存在当前浏览器中，请定期导出备份。换浏览器或清理浏览器数据会影响访问。"
        style={{ marginBottom: 20 }}
      />
      <Card title="备份与恢复" style={{ marginBottom: 20 }}>
        <Space wrap>
          <Button
            type="primary"
            onClick={() => {
              try {
                storage.downloadBackup();
              } catch (e) {
                message.error((e as Error).message);
              }
            }}
          >
            导出完整备份
          </Button>
          <Upload
            accept=".json"
            showUploadList={false}
            beforeUpload={importFile}
          >
            <Button>导入备份（先预览）</Button>
          </Upload>
          <Button onClick={() => storage.downloadRaw()}>
            导出原始数据（故障恢复）
          </Button>
        </Space>
        <p className="muted">
          支持旧版 2.0.0 和新版 2.1.0
          格式；格式、日期、金额和关联关系校验通过后才允许导入。
        </p>
      </Card>
      <Card title="自动备份 · 最近7次" style={{ marginBottom: 20 }}>
        {historyError && <Alert type="error" title={historyError} />}
        <List
          rowKey="id"
          locale={{ emptyText: "尚无自动备份" }}
          dataSource={backups}
          renderItem={(b, index) => (
            <List.Item
              actions={[
                <Button
                  key="restore"
                  onClick={() =>
                    Modal.confirm({
                      title: "恢复这份备份？",
                      content: "将完整替换当前数据，请先导出当前备份。",
                      okText: "恢复",
                      cancelText: "取消",
                      onOk: () => act(() => storage.restoreBackup(b.id)),
                    })
                  }
                >
                  恢复
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <>
                    {new Date(b.timestamp).toLocaleString("zh-CN")}{" "}
                    {index === 0 && <Tag color="green">最新</Tag>}
                  </>
                }
                description={
                  "会员 " +
                  b.data.members.length +
                  " 人 · 交易 " +
                  b.data.transactions.length +
                  " 笔"
                }
              />
            </List.Item>
          )}
        />
      </Card>
      <Card title="存储空间（估计）" style={{ marginBottom: 20 }}>
        <p>{info.totalSizeMB} MB / 约5 MB，实际限额由浏览器决定</p>
        <Progress percent={Math.min(100, Number(info.usage))} />
        <List
          size="small"
          dataSource={Object.entries(info.details)}
          renderItem={([key, value]) => (
            <List.Item>
              <span>{key}</span>
              <span>{(value / 1024).toFixed(2)} KB</span>
            </List.Item>
          )}
        />
      </Card>
      <Card title="演示数据" style={{ marginBottom: 20 }}>
        <p className="muted">
          新增带标记的演示会员；清理仅移除演示会员及其关联记录。
        </p>
        <Space wrap>
          <Button
            onClick={() => {
              try {
                act(addDemo);
              } catch {
                /* 已显示错误 */
              }
            }}
          >
            添加演示数据
          </Button>
          <Button
            onClick={() =>
              Modal.confirm({
                title: "清理演示数据？",
                content: "演示会员的交易与预约也会被移除，真实会员保留。",
                okText: "清理",
                cancelText: "取消",
                onOk: () => act(clearDemo),
              })
            }
          >
            清理演示数据
          </Button>
        </Space>
      </Card>
      <Card title="清空业务数据">
        <p>
          会清空会员、交易和预约。请先导出备份；操作前的数据仍可从最近历史备份恢复。
        </p>
        <Button
          danger
          onClick={() =>
            Modal.confirm({
              title: "确认清空业务数据？",
              content: "请确认已导出备份。",
              okText: "确认清空",
              cancelText: "取消",
              okType: "danger",
              onOk: () => act(() => storage.clearAll()),
            })
          }
        >
          清空业务数据
        </Button>
      </Card>
    </>
  );
}
