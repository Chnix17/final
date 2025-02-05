import React, { useState, useEffect, createContext, useContext, useMemo, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaSignOutAlt, FaTachometerAlt, FaCar, FaCog, FaFileAlt, FaHeadset,
  FaChevronDown, FaBars, FaHome, FaTools, FaUserCircle, FaFolder,
  FaCalendarAlt, FaChartBar, FaClipboardList  // Add this import
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Popover } from '@headlessui/react';
import { Modal, Tooltip } from 'antd';  // Add this import
import Profile from './profile';  // Add this import
import { useSwipeable } from 'react-swipeable'; // Add this import

const SidebarContext = createContext();

const sidebarVariants = {
  open: { width: '16rem' },
  closed: { width: '4rem' },
};

// Add new popover variants
const popoverVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.2 } 
  }
};

const mobileOverlayVariants = {
  open: { opacity: 0.5 },
  closed: { opacity: 0 },
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState('');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [systemStatus, setSystemStatus] = useState('online');
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Add swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => isMobile && setSidebarOpen(false),
    onSwipedRight: () => isMobile && setSidebarOpen(true),
    trackMouse: false
  });

  const name = localStorage.getItem('name') || 'Admin User';
  const user_level_id = localStorage.getItem('user_level_id');

  const canAccessMenu = (menuType) => {
    switch (user_level_id) {
      case '1':
        return true; // User level 1 can access all menus, including 'master'
      case '2':
        return ['calendar', 'viewRequest', 'viewReservation'].includes(menuType); // Limited access
      case '4':
        return true; // Full access
      default:
        return false; // No access for undefined user levels
    }
  };
  

  useEffect(() => {
    setActiveItem(location.pathname);
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [location]);

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    navigate('/gsd');
    window.location.reload();
  };

  const showProfileModal = () => {
    setIsProfileModalVisible(true);
  };

  const handleProfileModalClose = () => {
    setIsProfileModalVisible(false);
  };

  const contextValue = useMemo(() => ({ isSidebarOpen }), [isSidebarOpen]);

  const formattedTime = format(currentTime, 'h:mm:ss a');
  const formattedDate = format(currentTime, 'EEEE, MMMM d, yyyy');

  return (
    <SidebarContext.Provider value={contextValue}>
      <div className="flex h-screen relative" {...swipeHandlers}>
        {/* Mobile overlay backdrop */}
        {isMobile && isSidebarOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={mobileOverlayVariants}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <motion.aside
          initial={false}
          animate={isSidebarOpen ? "open" : "closed"}
          variants={sidebarVariants}
          transition={{ duration: 0.3, type: 'tween' }}
          className={`fixed md:relative h-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-xl flex flex-col z-40 transform ${isMobile ? 'translate-x-0' : ''} ${isSidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 ease-in-out`}
        >
          <div className="flex items-center justify-between p-4 border-b border-green-200">
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center space-x-3"
                >
                  <img src="/images/assets/phinma.png" alt="GSD Logo" className="w-8 h-8" />
                  <span className="font-semibold text-lg text-green-600">GSD Portal</span>
                </motion.div>
              )}
            </AnimatePresence>
            <button onClick={toggleSidebar} className="text-green-600 hover:text-green-700">
              <FaBars />
            </button>
          </div>

          {isSidebarOpen && (
            <div className="px-4 py-3 border-b border-green-200 bg-green-50">
              <div className="text-lg font-bold text-green-600">{formattedTime}</div>
              <div className="text-sm text-green-500">{formattedDate}</div>
            </div>
          )}

          <div className="flex-grow overflow-y-auto">
            <nav className="mt-5 px-2">
              {(user_level_id === '1' || user_level_id === '4') && (
                <SidebarItem icon={FaTachometerAlt} text="Dashboard" link="/adminDashboard" active={activeItem === '/adminDashboard'} />
              )}
              
             
              {(user_level_id === '1' || user_level_id === '4') && (
                <SidebarDropdown icon={FaFileAlt} text="Manage Resources" active={['/Venue', '/VehicleEntry', '/Equipment'].includes(activeItem)}>
                  <SidebarSubItem icon={FaHome} text="Venue" link="/Venue" active={activeItem === '/Venue'} />
                  <SidebarSubItem icon={FaCar} text="Vehicle" link="/VehicleEntry" active={activeItem === '/VehicleEntry'} />
                  <SidebarSubItem icon={FaTools} text="Equipments" link="/Equipment" active={activeItem === '/Equipment'} />
                </SidebarDropdown>
              )}

              {user_level_id === '1' && (
                <SidebarItem icon={FaFolder} text="Master" link="/Master" active={activeItem === '/Master'} />
              )}

              {(user_level_id === '1' || user_level_id === '4') && (
                <SidebarItem icon={FaUserCircle} text="Users" link="/Faculty" active={activeItem === '/Faculty'} />
              )}

              {canAccessMenu('viewRequest') && (
                <SidebarDropdown icon={FaCar} text="Reservations" active={['/viewReservation', '/ViewRequest', '/AddReservation'].includes(activeItem)}>
                  <SidebarSubItem icon={FaHeadset} text="View Requests" link="/ViewRequest" active={activeItem === '/ViewRequest'} />
                  {(user_level_id === '1' || user_level_id === '4') && (
                    <SidebarSubItem icon={FaCar} text="Add Reservation" link="/AddReservation" active={activeItem === '/AddReservation'} />
                  )}
                </SidebarDropdown>
              )}

              {canAccessMenu('viewReservation') && (
                <SidebarItem 
                  icon={FaClipboardList} 
                  text="Records" 
                  link="/record" 
                  active={activeItem === '/record'} 
                />
              )}
            </nav>
          </div>

          <div className="border-t border-green-200 p-4">
            <Popover className="relative">
              <Popover.Button className="flex items-center space-x-3 w-full hover:bg-green-50 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                <FaUserCircle className="text-2xl text-green-600" />
                {isSidebarOpen && (
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-700">{name}</p>
                    <p className="text-sm text-gray-500">Admin</p>
                  </div>
                )}
              </Popover.Button>

              <Popover.Panel className="absolute bottom-full left-0 w-full mb-2">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-200 bg-green-50">
                    <p className="font-semibold text-green-600">{name}</p>
                    <p className="text-sm text-gray-500">Administrator</p>
                  </div>
                  
                  <div className="p-2">
                    <button 
                      onClick={showProfileModal}
                      className="w-full text-left px-4 py-2 hover:bg-green-50 text-gray-700 rounded flex items-center space-x-2"
                    >
                      <FaUserCircle />
                      <span>Profile</span>
                    </button>
                    <button 
                      onClick={() => navigate('/settings')}
                      className="w-full text-left px-4 py-2 hover:bg-green-50 text-gray-700 rounded flex items-center space-x-2"
                    >
                      <FaCog />
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 rounded flex items-center space-x-2"
                    >
                      <FaSignOutAlt />
                      <span>Logout</span>
                    </button>
                  </div>
                </motion.div>
              </Popover.Panel>
            </Popover>
          </div>
        </motion.aside>
        <Profile 
          open={isProfileModalVisible} 
          onClose={handleProfileModalClose}
        />
        {/* Mobile close button */}
        {isMobile && isSidebarOpen && (
          <button
            className="fixed top-4 right-4 z-50 p-2 rounded-full bg-white shadow-lg"
            onClick={() => setSidebarOpen(false)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </SidebarContext.Provider>
  );
};

// Memoize the SidebarItem component
const SidebarItem = React.memo(({ icon: Icon, text, link, active }) => {
  const { isSidebarOpen } = useContext(SidebarContext);
  const isMobile = window.innerWidth < 768;
  
  const content = (
    <Link 
      to={link} 
      className={`
        flex items-center space-x-3 p-3 rounded-lg transition-colors
        touch-manipulation // Improve touch target size
        ${active ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200' : 
        'text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900 hover:text-green-600 dark:hover:text-green-300'}
      `}
    >
      <Icon className={`text-xl ${active ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`} />
      {isSidebarOpen && (
        <motion.span className="font-medium">{text}</motion.span>
      )}
    </Link>
  );

  return isMobile || isSidebarOpen ? content : (
    <Tooltip placement="right" title={text}>
      {content}
    </Tooltip>
  );
});

// Memoize the SidebarDropdown component
const SidebarDropdown = React.memo(({ icon: Icon, text, active, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isSidebarOpen } = useContext(SidebarContext);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const isMobile = window.innerWidth < 768;

  const handleClickOutside = useCallback((event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        buttonRef.current && !buttonRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  const getPopoverPosition = () => {
    if (isMobile) {
      return {
        position: 'fixed',
        left: isSidebarOpen ? '16rem' : '4rem',
        top: buttonRef.current?.getBoundingClientRect().top ?? 0,
      };
    }
    return {};
  };

  const dropdownContent = (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
          active ? 'bg-green-100 text-green-700' : 
          'text-gray-600 hover:bg-green-50 hover:text-green-600'
        }`}
      >
        <div className="flex items-center space-x-3">
          <Icon className={`text-xl ${active ? 'text-green-600' : 'text-gray-400'}`} />
          {isSidebarOpen && <span className="font-medium">{text}</span>}
        </div>
        {isSidebarOpen && (
          <FaChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={popoverVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={`
              fixed
              ${isSidebarOpen ? 'left-64' : 'left-16'}
              z-[100] bg-white rounded-lg shadow-lg border border-gray-200
              min-w-[200px]
            `}
            style={getPopoverPosition()}
          >
            <div className="py-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return isSidebarOpen ? dropdownContent : (
    <Tooltip placement="right" title={text}>
      {dropdownContent}
    </Tooltip>
  );
});

// Memoize the SidebarSubItem component
const SidebarSubItem = React.memo(({ icon: Icon, text, link, active }) => {
  const { isSidebarOpen } = useContext(SidebarContext);
  
  const content = (
    <Link 
      to={link} 
      className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
        active ? 'bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-300' : 
        'text-gray-500 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900 hover:text-green-600 dark:hover:text-green-300'
      }`}
    >
      <Icon className={`text-sm ${active ? 'text-green-500' : 'text-gray-400'}`} />
      <span className="text-sm whitespace-nowrap">{text}</span>
    </Link>
  );

  return content;
});

export default Sidebar;
