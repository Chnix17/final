import React, { useState, useEffect } from 'react';
import {
  Avatar,
  IconButton,
  Grid,
  styled,
} from '@mui/material';
import { Typography } from 'antd'; // Change to Ant Design Typography
import { 
  EditOutlined,
  CameraOutlined,
  SaveOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  UserOutlined,
  LockOutlined,
  SecurityScanOutlined,
} from '@ant-design/icons';
import { Modal, Input, message, Spin, Tooltip, Tabs, Switch, Button, Layout, Menu } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';

const { Sider, Content } = Layout;

const StyledInput = styled(Input)`
  &.ant-input-affix-wrapper {
    border-radius: 12px;
    border: 1px solid #e0e0e0;
    padding: 12px 16px;
    background: #f8f9fa;
    transition: all 0.3s ease;
    
    &:hover, &:focus {
      border-color: #4caf50;
      background: #ffffff;
      box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
    }
  }
`;

const ProfileCard = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
  }
`;

const ProfileModal = ({ visible, onClose }) => {
  const [profileImage, setProfileImage] = useState('https://via.placeholder.com/150');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    schoolId: '',
    email: '',
    phoneNumber: '',
    department: '',
    userLevel: ''
  });
  const [activeTab, setActiveTab] = useState('1');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false); // Move state here
  const [selectedSetting, setSelectedSetting] = useState('profile');

  const menuItems = [
    { key: 'profile', label: 'Profile', icon: <UserOutlined /> },
    { key: 'security', label: 'Security', icon: <SecurityScanOutlined /> },
    { key: 'account', label: 'Account Settings', icon: <IdcardOutlined /> },
    { key: 'notifications', label: 'Notifications', icon: <PhoneOutlined /> },
  ];

  useEffect(() => {
    if (visible) {
      fetchAdminData();
    }
  }, [visible]);

  const fetchAdminData = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      
      const response = await fetch('http://localhost/coc/gsd/fetchMaster.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'fetchUsersById',
          id: userId
        })
      });

      const result = await response.json();
      
      if (result.status === 'success' && result.data.length > 0) {
        const userData = result.data[0];
        
        setPersonalInfo({
          firstName: userData.users_fname,
          middleName: userData.users_mname,
          lastName: userData.users_lname,
          schoolId: userData.users_school_id,
          email: userData.users_email,
          phoneNumber: userData.users_contact_number || '',
          department: userData.departments_name || '',
          userLevel: userData.user_level_name || 'Administrator'
        });
        
        setTwoFactorEnabled(userData.is_2FAactive === "1");

        if (userData.users_pic) {
          setProfileImage(`http://localhost/coc/gsd/${userData.users_pic}`);
        }
      }
    } catch (err) {
      message.error('Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setProfileImage(e.target.result);
      reader.readAsDataURL(file);
      message.success('Profile picture updated successfully');
    }
  };

  const handleSave = () => {
    message.success('Profile updated successfully');
    setEditMode(false);
  };

  const handleInfoChange = (field, e) => {
    setPersonalInfo(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handlePasswordChange = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      message.error('New passwords do not match');
      return;
    }
    // Add your password change logic here
    message.success('Password updated successfully');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleTwoFactorToggle = async (checked) => {
    try {
      const userId = localStorage.getItem('user_id');
      const userLevel = localStorage.getItem('user_level_id');
      const userType = userLevel === '4' ? 'super_admin' : 'admin';

      const response = await fetch('http://localhost/coc/gsd/fetchMaster.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: checked ? 'enable2FA' : 'unenable2FA',
          id: userId,
          userType: userType
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        setTwoFactorEnabled(checked);
        message.success(`Two-factor authentication ${checked ? 'enabled' : 'disabled'}`);
      } else {
        message.error('Failed to update 2FA status');
        setTwoFactorEnabled(!checked); // Revert the switch if failed
      }
    } catch (error) {
      console.error('Error updating 2FA:', error);
      message.error('Failed to update 2FA status');
      setTwoFactorEnabled(!checked); // Revert the switch if failed
    }
  };

  const renderInformationTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex-1 bg-white p-6 shadow-md rounded-lg">
        <div className="max-w-3xl mx-auto">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative"
            >
              <Avatar
                src={profileImage}
                size={180}
                style={{
                  border: '6px solid white',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                  cursor: 'pointer'
                }}
              />
              <Tooltip title="Change Profile Picture" placement="right">
                <label htmlFor="profile-upload" className="absolute bottom-0 right-0">
                  <div className="bg-green-500 p-2 rounded-full cursor-pointer hover:bg-green-600 transition-all duration-300 transform hover:scale-110">
                    <CameraOutlined style={{ color: 'white', fontSize: '20px' }} />
                  </div>
                  <input type="file" id="profile-upload" hidden accept="image/*" onChange={handleImageUpload} />
                </label>
              </Tooltip>
            </motion.div>
            <Typography.Title level={4} className="mt-4 mb-1">
              {`${personalInfo.firstName} ${personalInfo.lastName}`}
            </Typography.Title>
            <Typography.Text type="secondary">{personalInfo.userLevel}</Typography.Text>
          </div>

          {/* Profile Form */}
          <div className="space-y-6">
            {[
              { label: 'First Name', value: 'firstName' },
              { label: 'Middle Name', value: 'middleName' },
              { label: 'Last Name', value: 'lastName' },
              { label: 'School ID', value: 'schoolId' },
              { label: 'Department', value: 'department' },
              { label: 'Role', value: 'userLevel' },
              { label: 'Email', value: 'email' },
              { label: 'Contact Number', value: 'phoneNumber' }
            ].map((field) => (
              <div key={field.value}>
                <label className="text-gray-600 block mb-2">{field.label}</label>
                <StyledInput
                  value={personalInfo[field.value]}
                  onChange={(e) => handleInfoChange(field.value, e)}
                  disabled={!editMode}
                />
              </div>
            ))}

            <div className="flex justify-end pt-4">
              <Button
                type={editMode ? "primary" : "default"}
                icon={editMode ? <SaveOutlined /> : <EditOutlined />}
                onClick={() => editMode ? handleSave() : setEditMode(true)}
              >
                {editMode ? "Save Changes" : "Edit Profile"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderSettingsTab = () => {
    const isPasswordValid = 
      passwordForm.currentPassword && 
      passwordForm.newPassword && 
      passwordForm.confirmPassword && 
      passwordForm.newPassword === passwordForm.confirmPassword;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <ProfileCard className="mb-6">
          <Typography.Title level={4} className="mb-6">
            Security Settings
          </Typography.Title>
          
          <div className="space-y-6">
            {/* 2FA Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-xl border border-gray-100"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <SecurityScanOutlined className="text-2xl text-green-500" />
                    <Typography.Title level={5} className="m-0">
                      Two-Factor Authentication (2FA)
                    </Typography.Title>
                  </div>
                  <Typography.Paragraph className="text-gray-600 mb-4">
                    Enhance your account security with 2FA. When enabled:
                    <ul className="list-disc ml-6 mt-2">
                      <li>Receive a unique code via email for each login</li>
                      <li>Protect against unauthorized access even if password is compromised</li>
                      <li>Required for sensitive operations like password changes</li>
                    </ul>
                  </Typography.Paragraph>
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={twoFactorEnabled}
                      onChange={handleTwoFactorToggle}
                      className={`${twoFactorEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                    />
                    <Typography.Text className="text-gray-600">
                      {twoFactorEnabled ? 'Activated' : 'Not activated'}
                    </Typography.Text>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Password Section Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button 
                type="default"
                icon={<LockOutlined />}
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="w-full mb-4"
              >
                {showPasswordSection ? 'Hide Password Settings' : 'Show Password Settings'}
              </Button>

              {/* Collapsible Password Section */}
              {showPasswordSection && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gray-50 p-6 rounded-xl"
                >
                  <Typography variant="subtitle1" className="mb-4 font-semibold">
                    Change Password
                  </Typography>
                  <Grid container spacing={3}>
                    {[
                      { placeholder: 'Current Password', value: 'currentPassword' },
                      { placeholder: 'New Password', value: 'newPassword' },
                      { placeholder: 'Confirm New Password', value: 'confirmPassword' }
                    ].map((field, index) => (
                      <Grid item xs={12} key={index}>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <StyledInput
                            type="password"
                            placeholder={field.placeholder}
                            prefix={<LockOutlined className="text-gray-400" />}
                            value={passwordForm[field.value]}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, [field.value]: e.target.value }))}
                          />
                        </motion.div>
                      </Grid>
                    ))}
                    <Grid item xs={12}>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                          ${isPasswordValid ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400'}
                          text-white px-6 py-3 rounded-xl font-medium transition-all duration-300
                          ${!isPasswordValid && 'cursor-not-allowed opacity-75'}
                        `}
                        onClick={handlePasswordChange}
                        disabled={!isPasswordValid}
                      >
                        Update Password
                      </motion.button>
                    </Grid>
                  </Grid>
                </motion.div>
              )}
            </motion.div>
          </div>
        </ProfileCard>
      </motion.div>
    );
  };

  return (
    <Modal
      visible={visible}
      onCancel={onClose}
      width={1000}
      footer={null}
      bodyStyle={{ padding: 0, height: '80vh' }}
      title={null}
      centered
    >
      <Layout style={{ height: '100%' }}>
        <Sider width={250} style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}>
          <div className="p-4 border-b">
            <Typography.Title level={4} style={{ margin: 0 }}>
              Settings
            </Typography.Title>
          </div>
          <Menu
            mode="inline"
            selectedKeys={[selectedSetting]}
            onClick={({ key }) => setSelectedSetting(key)}
            items={menuItems}
            style={{ borderRight: 'none' }}
          />
        </Sider>
        <Content style={{ padding: '24px', overflowY: 'auto', background: '#fff' }}>
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Spin size="large" />
            </div>
          ) : (
            <>
              {selectedSetting === 'profile' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="max-w-4xl mx-auto">
                    {/* Profile Picture Section */}
                    <div className="flex flex-col items-center mb-8">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="relative"
                      >
                        <Avatar
                          src={profileImage}
                          size={180}
                          style={{
                            border: '6px solid white',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                            cursor: 'pointer'
                          }}
                        />
                        <Tooltip title="Change Profile Picture" placement="right">
                          <label htmlFor="profile-upload" className="absolute bottom-0 right-0">
                            <div className="bg-green-500 p-2 rounded-full cursor-pointer hover:bg-green-600 transition-all duration-300">
                              <CameraOutlined style={{ color: 'white', fontSize: '20px' }} />
                            </div>
                            <input type="file" id="profile-upload" hidden accept="image/*" onChange={handleImageUpload} />
                          </label>
                        </Tooltip>
                      </motion.div>
                      <Typography.Title level={4} className="mt-4 mb-1">
                        {`${personalInfo.firstName} ${personalInfo.lastName}`}
                      </Typography.Title>
                      <Typography.Text type="secondary">{personalInfo.userLevel}</Typography.Text>
                    </div>

                    {/* Profile Form */}
                    <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
                      <div className="grid grid-cols-2 gap-6">
                        { [
                          { label: 'First Name', value: 'firstName', icon: <UserOutlined /> },
                          { label: 'Middle Name', value: 'middleName', icon: <UserOutlined /> },
                          { label: 'Last Name', value: 'lastName', icon: <UserOutlined /> },
                          { label: 'School ID', value: 'schoolId', icon: <IdcardOutlined /> },
                          { label: 'Department', value: 'department', icon: <IdcardOutlined /> },
                          { label: 'Email', value: 'email', icon: <MailOutlined /> },
                          { label: 'Contact Number', value: 'phoneNumber', icon: <PhoneOutlined /> }
                        ].map((field) => (
                          <div key={field.value} className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-gray-600 block mb-2 flex items-center gap-2">
                              {field.icon}
                              {field.label}
                            </label>
                            <StyledInput
                              value={personalInfo[field.value]}
                              onChange={(e) => handleInfoChange(field.value, e)}
                              disabled={!editMode}
                              className="w-full"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end pt-4">
                        <Button
                          type={editMode ? "primary" : "default"}
                          icon={editMode ? <SaveOutlined /> : <EditOutlined />}
                          onClick={() => editMode ? handleSave() : setEditMode(true)}
                        >
                          {editMode ? "Save Changes" : "Edit Profile"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              {selectedSetting === 'security' && renderSettingsTab()}
              {/* Add other sections as needed */}
            </>
          )}
        </Content>
      </Layout>
    </Modal>
  );
};

export default ProfileModal;