import { useEffect, lazy, Suspense } from "react";
import {
  BrowserRouter,
  HashRouter,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";
import { ConfigProvider, Alert, Button, Space, Spin, message } from "antd";
import zhCN from "antd/locale/zh_CN";
import Layout from "./components/Layout/Layout";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Members = lazy(() => import("./pages/Members"));
const Courses = lazy(() => import("./pages/Courses"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
import { useAppStore } from "./store/appStore";
import { storage } from "./utils/storage";
import "./App.css";
const Router = import.meta.env.BASE_URL === "/" ? BrowserRouter : HashRouter;
function App() {
  const { load, error, warning } = useAppStore();
  useEffect(() => {
    load();
    const sync = () => load();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [load]);
  const recovery = (
    <Alert
      type="error"
      showIcon
      title="无法读取本地业务数据，已停止业务操作"
      description={
        <>
          <p>{error}</p>
          <Space wrap>
            <Button
              onClick={() => {
                try {
                  storage.downloadRaw();
                } catch (e) {
                  message.error((e as Error).message);
                }
              }}
            >
              导出原始数据
            </Button>
            <Link to="/settings">前往设置导入有效备份</Link>
            <Button onClick={load}>重新读取</Button>
          </Space>
        </>
      }
    />
  );
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: "#7561cf",
          borderRadius: 10,
          fontFamily: 'Inter, "Microsoft YaHei", sans-serif',
          colorBgLayout: "#f5f6fa",
        },
      }}
    >
      <Router>
        <Suspense
          fallback={
            <div style={{ padding: 48, textAlign: "center" }}>
              <Spin tip="正在加载页面" />
            </div>
          }
        >
          {warning && <Alert type="warning" showIcon title={warning} />}
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route
                path="dashboard"
                element={error ? recovery : <Dashboard />}
              />
              <Route
                path="members/*"
                element={error ? recovery : <Members />}
              />
              <Route path="courses" element={<Courses />} />
              <Route
                path="transactions"
                element={error ? recovery : <Transactions />}
              />
              <Route path="reports" element={error ? recovery : <Reports />} />
              <Route
                path="settings"
                element={
                  <>
                    {error && recovery}
                    <Settings />
                  </>
                }
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </ConfigProvider>
  );
}
export default App;
