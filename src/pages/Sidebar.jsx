import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaSignOutAlt, FaTachometerAlt, FaCar, FaCog, FaFileAlt, FaHeadset,
  FaChevronDown, FaBars, FaHome, FaTools, FaUserCircle, FaFolder,
  FaCalendarAlt, FaChartBar, FaArchive,
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Popover } from '@headlessui/react';
import ProfileModal from './profile';  // Add this import
import { clearAllExceptLoginAttempts } from '../utils/loginAttempts';

const SidebarContext = createContext();

const sidebarVariants = {
  open: { width: '16rem' },
  closed: { width: '4rem' },
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
  const [showProfileModal, setShowProfileModal] = useState(false);

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
      setSidebarOpen(window.innerWidth >= 768);
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
    // Save loginAttempts
    const loginAttempts = localStorage.getItem('loginAttempts');
    const url = localStorage.getItem('url');
  
    // Clear everything
    sessionStorage.clear();
    localStorage.clear();
  
    // Restore critical data
    if (loginAttempts) {
      localStorage.setItem('loginAttempts', loginAttempts);
    }
    if (url) {
      localStorage.setItem('url', url);
    }
  
    // Navigate to login
    navigate('/gsd');
    window.location.reload();
  };

  const contextValue = useMemo(() => ({ isSidebarOpen }), [isSidebarOpen]);

  const formattedTime = format(currentTime, 'h:mm:ss a');
  const formattedDate = format(currentTime, 'EEEE, MMMM d, yyyy');

  return (
    <SidebarContext.Provider value={contextValue}>
      <div className={`flex h-screen ${isDarkMode ? 'dark' : ''}`}>
        <motion.aside
          initial="open"
          animate={isSidebarOpen ? "open" : "closed"}
          variants={sidebarVariants}
          transition={{ duration: 0.3, type: 'tween' }}
          className={`fixed md:relative h-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-xl flex flex-col z-40 ${
            isSidebarOpen ? 'w-64' : 'w-16'
          } transition-all duration-300 ease-in-out`}
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

          

          <div className="flex-grow overflow-y-auto">
            <nav className="mt-5 px-2">
              {/* Main Navigation */}
              <SidebarItem icon={FaTachometerAlt} text="Dashboard" link="/adminDashboard" active={activeItem === '/adminDashboard'} />
              <SidebarItem icon={FaCalendarAlt} text="Calendar" link="/LandCalendar" active={activeItem === '/LandCalendar'} />
              
              {/* Resource Management */}
              <SidebarDropdown icon={FaFileAlt} text="Manage Resources" active={['/Venue', '/VehicleEntry', '/Equipment'].includes(activeItem)}>
                <SidebarSubItem icon={FaHome} text="Venue" link="/Venue" active={activeItem === '/Venue'} />
                <SidebarSubItem icon={FaCar} text="Vehicle" link="/VehicleEntry" active={activeItem === '/VehicleEntry'} />
                <SidebarSubItem icon={FaTools} text="Equipment" link="/Equipment" active={activeItem === '/Equipment'} />
              </SidebarDropdown>

              {/* Checklist and Personnel */}
              <SidebarDropdown icon={FaUserCircle} text="Checklist & Personnel" active={['/Checklist', '/AssignPersonnel'].includes(activeItem)}>
                <SidebarSubItem icon={FaFileAlt} text="Add Checklist" link="/Checklist" active={activeItem === '/Checklist'} />
                <SidebarSubItem icon={FaUserCircle} text="Assign Personnel" link="/AssignPersonnel" active={activeItem === '/AssignPersonnel'} />
              </SidebarDropdown>

              {/* Reservation Management */}
              <SidebarDropdown icon={FaCar} text="Reservations" active={['/viewReservation', '/ViewRequest', '/AddReservation'].includes(activeItem)}>
                <SidebarSubItem icon={FaHeadset} text="View Requests" link="/ViewRequest" active={activeItem === '/ViewRequest'} />
                <SidebarSubItem icon={FaCar} text="Add Reservation" link="/AddReservation" active={activeItem === '/AddReservation'} />
              </SidebarDropdown>

              {/* Administration */}
              <SidebarItem icon={FaFolder} text="Master" link="/Master" active={activeItem === '/Master'} />
              <SidebarItem icon={FaUserCircle} text="Users" link="/Faculty" active={activeItem === '/Faculty'} />

              {/* Records */}
              <SidebarItem icon={FaFileAlt} text="Records" link="/record" active={activeItem === '/record'} />
              <SidebarItem icon={FaArchive} text="Archive" link="/archive" active={activeItem === '/archive'} />
            </nav>
          </div>

          <div className="border-t border-green-200 p-4">
            <Popover className="relative">
              <Popover.Button className="flex items-center space-x-3 w-full hover:bg-green-50 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                <FaUserCircle className="text-2xl text-green-600" />
                {isSidebarOpen && (
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-700">{name}</p>
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
                      onClick={() => setShowProfileModal(true)}
                      className="w-full text-left px-4 py-2 hover:bg-green-50 text-gray-700 rounded flex items-center space-x-2"
                    >
                      <FaUserCircle />
                      <span>Profile</span>
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
          <ProfileModal 
            visible={showProfileModal} 
            onClose={() => setShowProfileModal(false)}
          />
        </motion.aside>
      </div>
    </SidebarContext.Provider>
  );
};

// Memoize the SidebarItem component
const SidebarItem = React.memo(({ icon: Icon, text, link, active }) => {
  const { isSidebarOpen } = useContext(SidebarContext);
  
  return (
    <Link 
      to={link} 
      className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
        active ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200' : 
        'text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900 hover:text-green-600 dark:hover:text-green-300'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className={`text-xl ${active ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`} />
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="font-medium"
          >
            {text}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
});

// Memoize the SidebarDropdown component
const SidebarDropdown = React.memo(({ icon: Icon, text, active, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isSidebarOpen } = useContext(SidebarContext);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
          active ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200' : 
          'text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900 hover:text-green-600 dark:hover:text-green-300'
        }`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-3">
          <Icon className={`text-xl ${active ? 'text-green-600' : 'text-gray-400'}`} />
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-medium"
              >
                {text}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <FaChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''} text-gray-400`} />
      </button>
      {isOpen && (
        <div className="ml-4 mt-2 space-y-2" role="menu">
          {children}
        </div>
      )}
    </div>
  );
});

// Memoize the SidebarSubItem component
const SidebarSubItem = React.memo(({ icon: Icon, text, link, active }) => {
  const { isSidebarOpen } = useContext(SidebarContext);
  
  return (
    <Link 
      to={link} 
      className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
        active ? 'bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-300' : 
        'text-gray-500 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900 hover:text-green-600 dark:hover:text-green-300'
      }`}
      role="menuitem"
      aria-current={active ? 'page' : undefined}
    >
      <Icon className={`text-sm ${active ? 'text-green-500' : 'text-gray-400'}`} />
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm"
          >
            {text}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
});

export default Sidebar;
