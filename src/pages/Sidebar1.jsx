import React, { useState } from 'react';
import {
  DashboardOutlined,
  HistoryOutlined,
  BarChartOutlined,
  DollarCircleOutlined,
  MessageOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import { Avatar, Badge, Tooltip } from 'antd';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const sessionTime = '9 min 53 s';

  const handleToggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div
      className={`
        h-screen
        flex flex-col
        bg-white
        border-r
        transition-all
        duration-300
        ${collapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Header with Toggle Button */}
      <div className="flex items-center justify-between p-4 border-b">
        <span className="font-bold text-gray-700 text-lg">
          {collapsed ? 'G' : 'GSD PORTAL'}
        </span>
        <button
          onClick={handleToggleCollapse}
          className="text-gray-500 hover:text-gray-700 transition"
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
      </div>

      {/* Scrollable Menu */}
      <div className="flex-1 overflow-auto">
        <SectionTitle collapsed={collapsed} title="Banking" />
        <NavItem icon={<DashboardOutlined />} label="Dashboard" collapsed={collapsed} />
        <NavItem icon={<HistoryOutlined />} label="History" collapsed={collapsed} />
        <NavItem icon={<BarChartOutlined />} label="Analysis" collapsed={collapsed} />
        <NavItem icon={<DollarCircleOutlined />} label="Finances" collapsed={collapsed} tooltip />

        <SectionTitle collapsed={collapsed} title="Services" />
        <NavItem
          icon={<Badge count={1} size="small"><MessageOutlined /></Badge>}
          label="Messages"
          collapsed={collapsed}
        />
        <NavItem icon={<FileTextOutlined />} label="Documents" collapsed={collapsed} />
        <NavItem icon={<AppstoreOutlined />} label="Products" collapsed={collapsed} />

        <SectionTitle collapsed={collapsed} title="Other" />
        <NavItem icon={<QuestionCircleOutlined />} label="Help" collapsed={collapsed} />
        <NavItem icon={<SettingOutlined />} label="Settings" collapsed={collapsed} />
      </div>

      {/* Profile Section (Hidden when collapsed) */}
      {!collapsed && (
        <div className="flex items-center p-4 border-t">
          <Avatar size={40} src="https://via.placeholder.com/40" alt="User Avatar" />
          <div className="ml-3">
            <div className="font-semibold text-gray-700">Michael Kowalski</div>
            <div className="text-xs text-gray-500">Session ends in {sessionTime}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;

/* Nav Item Component */
const NavItem = ({ icon, label, collapsed, tooltip }) => {
  const content = collapsed && tooltip ? (
    <Tooltip title={label} placement="right">
      <span className="text-xl">{icon}</span>
    </Tooltip>
  ) : (
    <span className="text-xl">{icon}</span>
  );

  return (
    <div className="flex items-center p-2 mx-2 mb-1 rounded cursor-pointer hover:bg-gray-100 transition">
      {content}
      {!collapsed && <span className="ml-3 text-gray-700">{label}</span>}
    </div>
  );
};

/* Section Title Component */
const SectionTitle = ({ collapsed, title }) => (
  <div className={`px-4 mt-4 mb-2 text-xs text-gray-400 uppercase ${collapsed ? 'hidden' : 'block'}`}>
    {title}
  </div>
);
