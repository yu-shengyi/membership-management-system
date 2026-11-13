import { useState } from "react";
import { Layout as AntLayout, Menu, Drawer, Button } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  DashboardOutlined,
  UserOutlined,
  CalendarOutlined,
  TransactionOutlined,
  BarChartOutlined,
  SettingOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import "./Layout.css";

const { Header, Sider, Content, Footer } = AntLayout;
const currentYear = new Date().getFullYear();

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);

  const menuItems = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "工作台",
    },
    {
      key: "/members",
      icon: <UserOutlined />,
      label: "会员管理",
    },
    {
      key: "/courses",
      icon: <CalendarOutlined />,
      label: "课程管理",
    },
    {
      key: "/transactions",
      icon: <TransactionOutlined />,
      label: "交易记录",
    },
    {
      key: "/reports",
      icon: <BarChartOutlined />,
      label: "数据报表",
    },
    {
      key: "/settings",
      icon: <SettingOutlined />,
      label: "系统设置",
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
    setMobileMenuVisible(false);
  };

  const selectedKey = "/" + location.pathname.split("/")[1];

  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      <Header className="layout-header">
        <div className="header-left">
          <Button
            className="mobile-menu-button"
            aria-label="打开导航菜单"
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setMobileMenuVisible(true)}
            style={{ color: "#fff" }}
          />
          <div className="header-title">会员管理系统</div>
        </div>
      </Header>

      <AntLayout>
        {/* 桌面端侧边栏 */}
        <Sider
          width={200}
          className="desktop-sider"
          breakpoint="lg"
          collapsedWidth="0"
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            style={{ height: "100%", borderRight: 0 }}
            items={menuItems}
            onClick={handleMenuClick}
          />
        </Sider>

        {/* 移动端抽屉菜单 */}
        <Drawer
          title="菜单"
          placement="left"
          onClose={() => setMobileMenuVisible(false)}
          open={mobileMenuVisible}
          className="mobile-drawer"
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={handleMenuClick}
          />
        </Drawer>

        <AntLayout className="content-layout">
          <Content className="main-content">
            <Outlet />
          </Content>
        </AntLayout>
      </AntLayout>

      <Footer className="layout-footer">会员管理系统 ©{currentYear}</Footer>
    </AntLayout>
  );
}
