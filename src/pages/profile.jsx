import React, { useState } from 'react';
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  TextField,
  Fade,
  styled,
  Grid,
  useTheme,
  Card,
  Tabs,
  Tab,
  Chip,
  LinearProgress,
  Divider
} from '@mui/material';
import { 
  Edit as EditIcon,
  PhotoCamera,
  Save as SaveIcon,
  Close as CloseIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  GitHub as GitHubIcon,
  Timeline as TimelineIcon,
  Badge as BadgeIcon,
  Work as WorkIcon
} from '@mui/icons-material';
import { Modal } from 'antd';

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(20px)',
  borderRadius: '20px',
  border: '1px solid rgba(255, 255, 255, 0.5)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.4s ease-in-out',
  '&:hover': {
    boxShadow: '0 12px 45px rgba(0, 0, 0, 0.15)',
    transform: 'translateY(-2px)'
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    '&:hover fieldset': {
      borderColor: '#1e88e5',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#1e88e5',
    }
  }
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 600,
  minWidth: 120,
  transition: 'all 0.3s ease',
  '&.Mui-selected': {
    color: '#1e88e5'
  }
}));

const Profile = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [profileImage, setProfileImage] = useState(localStorage.getItem('profile_pic') || 'https://via.placeholder.com/150');
  const [editMode, setEditMode] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({
    fullName: localStorage.getItem('name') || '',
    email: localStorage.getItem('email') || '',
    phoneNumber: localStorage.getItem('contact_number') || '',
    department: localStorage.getItem('department_name') || '',
    role: localStorage.getItem('user_level') || ''  // Changed from user_level_name to user_level
  });

  // Add new state for skills and social links
  const [skills] = useState([
    { name: 'JavaScript', level: 90 },
    { name: 'React', level: 85 },
    { name: 'Node.js', level: 80 },
    { name: 'UI/UX Design', level: 75 }
  ]);

  const [socialLinks] = useState({
    linkedin: 'https://linkedin.com/in/username',
    twitter: 'https://twitter.com/username',
    github: 'https://github.com/username'
  });

  // Add useEffect to log data when component mounts
  React.useEffect(() => {
    console.log('Profile Data from localStorage:', {
      profileImage: localStorage.getItem('profile_pic'),
      name: localStorage.getItem('name'),
      email: localStorage.getItem('email'),
      contact_number: localStorage.getItem('contact_number'),
      department_name: localStorage.getItem('department_name'),
      user_level: localStorage.getItem('user_level')  // Changed from user_level_name to user_level
    });

    console.log('Current Personal Info State:', personalInfo);
  }, []);

  // Add logging to handleInfoChange
  const handleInfoChange = (field) => (event) => {
    const newValue = event.target.value;
    setPersonalInfo(prev => {
      const updatedInfo = {
        ...prev,
        [field]: newValue
      };
      console.log('Updated Personal Info:', updatedInfo);
      return updatedInfo;
    });
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setProfileImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  const fields = [
    { id: 'fullName', label: 'Full Name' },
    { id: 'email', label: 'Email Address' },
    { id: 'phoneNumber', label: 'Phone Number' },
    { id: 'department', label: 'Department' },
    { id: 'role', label: 'Role' }
  ];

  const theme = useTheme();

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <Grid container spacing={4}>
            {/* Existing personal info fields */}
            {fields.map((field) => (
              <Grid item xs={12} sm={6} key={field.id}>
                <Fade in={true} timeout={500}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(76, 175, 80, 0.05)'
                      }
                    }}
                  >
                    {editMode ? (
                      <StyledTextField
                        fullWidth
                        label={field.label}
                        value={personalInfo[field.id]}
                        onChange={handleInfoChange(field.id)}
                        variant="outlined"
                      />
                    ) : (
                      <Box>
                        <Typography 
                          color="textSecondary" 
                          variant="subtitle2" 
                          sx={{ mb: 1, color: '#2e7d32' }}
                        >
                          {field.label}
                        </Typography>
                        <Typography 
                          variant="body1"
                          sx={{ 
                            fontWeight: 500,
                            color: '#333'
                          }}
                        >
                          {personalInfo[field.id]}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Fade>
              </Grid>
            ))}
          </Grid>
        );
      case 1:
        return (
          <Box sx={{ py: 3 }}>
            {skills.map((skill) => (
              <Box key={skill.name} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>{skill.name}</Typography>
                  <Typography variant="body2" color="textSecondary">{skill.level}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={skill.level}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(30, 136, 229, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#1e88e5'
                    }
                  }}
                />
              </Box>
            ))}
          </Box>
        );
      case 2:
        return (
          <Box sx={{ py: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <IconButton href={socialLinks.linkedin} target="_blank" color="primary">
                    <LinkedInIcon />
                  </IconButton>
                  <IconButton href={socialLinks.twitter} target="_blank" color="primary">
                    <TwitterIcon />
                  </IconButton>
                  <IconButton href={socialLinks.github} target="_blank" color="primary">
                    <GitHubIcon />
                  </IconButton>
                </Box>
              </Grid>
              {/* Add more social/contact information here */}
            </Grid>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={null}
      width={1000}
      centered
      destroyOnClose
      className="profile-modal"
    >
      <Box
        sx={{
          maxWidth: 1000,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <StyledCard elevation={0} sx={{ p: 4, position: 'relative' }}>
          {/* Enhanced header background */}
          <Box sx={{ 
            position: 'relative', 
            mb: 6,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -24,
              left: -32,
              right: -32,
              height: 220,
              background: 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)',
              borderRadius: '20px',
              zIndex: 0
            }
          }}>
            <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', pt: 3 }}>
              <Avatar
                src={profileImage}
                sx={{
                  width: 180,
                  height: 180,
                  margin: '0 auto',
                  border: '6px solid white',
                  boxShadow: 3,
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)'
                  }
                }}
              />
              <input
                type="file"
                accept="image/*"
                id="icon-button-file"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
              <label htmlFor="icon-button-file">
                <IconButton
                  component="span"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: '50%',
                    transform: 'translateX(80px)',
                    backgroundColor: 'white',
                    boxShadow: 1,
                    '&:hover': { backgroundColor: '#f5f5f5' }
                  }}
                >
                  <PhotoCamera />
                </IconButton>
              </label>
            </Box>
          </Box>

          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              mb: 4,
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTabs-indicator': {
                backgroundColor: '#1e88e5'
              }
            }}
          >
            <StyledTab icon={<BadgeIcon />} iconPosition="start" label="Profile" />
            <StyledTab icon={<TimelineIcon />} iconPosition="start" label="Skills" />
            <StyledTab icon={<WorkIcon />} iconPosition="start" label="Social" />
          </Tabs>

          {renderTabContent()}
        </StyledCard>
      </Box>
    </Modal>
  );
};

export default Profile;
