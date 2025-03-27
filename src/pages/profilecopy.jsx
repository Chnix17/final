import React, { useState } from "react";
import { Avatar, Button, Input } from "antd";
import { UserOutlined, SearchOutlined } from "@ant-design/icons";

const ProfileSettings = () => {
  const [profileName, setProfileName] = useState("Kevin Heart");
  const [username] = useState("kevinunhuy");
  const [status, setStatus] = useState("On duty");
  const [about, setAbout] = useState("Discuss only on work hour, unless you wanna discuss about music 🙏");

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md p-4">
        <h2 className="text-lg font-semibold mb-4">Settings</h2>
        <ul className="space-y-2">
          {["Profile", "Account", "Chat", "Voice & video", "Appearance", "Notification"].map((item, index) => (
            <li
              key={index}
              className={`flex items-center p-2 rounded-lg cursor-pointer hover:bg-gray-200 ${
                item === "Profile" ? "bg-blue-100 text-blue-600 font-semibold" : ""
              }`}
            >
              <SearchOutlined className="mr-2 text-lg" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Profile Settings */}
      <div className="flex-1 bg-white p-6 shadow-md">
        <div className="max-w-lg mx-auto">
          <h2 className="text-lg font-semibold mb-4">Profile picture</h2>

          {/* Profile Picture */}
          <div className="flex items-center space-x-4 mb-6">
            <Avatar size={64} icon={<UserOutlined />} />
            <Button type="primary" className="bg-blue-500">Change picture</Button>
            <Button danger>Delete picture</Button>
          </div>

          {/* Profile Form */}
          <div className="space-y-4">
            <div>
              <label className="text-gray-600">Profile name</label>
              <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} />
            </div>

            <div>
              <label className="text-gray-600">Username</label>
              <div className="flex items-center bg-gray-100 p-2 rounded">
                <span className="mr-2">@</span>
                <Input value={username} disabled className="border-none bg-transparent" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Available change in 25/04/2024</p>
            </div>

            <div>
              <label className="text-gray-600">Status recently</label>
              <Input value={status} onChange={(e) => setStatus(e.target.value)} />
            </div>

            <div>
              <label className="text-gray-600">About me</label>
              <Input.TextArea rows={3} value={about} onChange={(e) => setAbout(e.target.value)} />
            </div>

            {/* Save Button */}
            <Button type="primary" className="w-full mt-4 bg-gray-300 cursor-not-allowed" disabled>
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
