import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiList, FiHelpCircle, FiLogOut, FiBell, FiUser, FiSettings, FiClock, FiCheckCircle, FiAlertCircle, FiBarChart2, FiUsers, FiBookmark, FiX, FiCheck, FiTrash2, FiInfo, FiMessageSquare } from 'react-icons/fi';
import ReservationCalendar from '../components/ReservationCalendar';

const Dashboard = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [showSupportTicket, setShowSupportTicket] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);

  const navButtonVariants = {
    hover: { 
      scale: 1.05,
      backgroundColor: "rgba(16, 185, 129, 0.1)",
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.95 }
  };

  const statsData = [
    { title: "Total Reservations", value: "156", icon: FiBookmark, color: "bg-blue-500" },
    { title: "Pending Requests", value: "8", icon: FiClock, color: "bg-yellow-500" },
    { title: "Approved Today", value: "12", icon: FiCheckCircle, color: "bg-green-500" },
    
  ];

  const recentActivities = [
    { type: "Approved", message: "Roofdeck reservation approved", time: "2 minutes ago" },
    { type: "Pending", message: "New reservation request for Ms Lobby", time: "1 hour ago" },
    { type: "Cancelled", message: "Multipurpose Hall reservation cancelled", time: "3 hours ago" },
    { type: "Completed", message: "Event in Auditorium completed", time: "5 hours ago" },
  ];

  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const response = await fetch('http://localhost/coc/gsd/fetch_reserve.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'fetchNotificationsByUserId',
          user_id: localStorage.getItem('user_id')
        })
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      if (result.status === 'success') {
        setNotifications(result.data);
      } else {
        console.error('Failed to fetch notifications:', result);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await fetch('http://localhost/coc/gsd/update_master.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'updateNotification',
          notification_id: notificationId
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        // Update local state to reflect the change
        setNotifications(notifications.map(notif => 
          notif.notification_id === notificationId 
            ? {...notif, is_read_by_user: '1'}
            : notif
        ));
      } else {
        console.error('Failed to mark notification as read:', result.message);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const storedName = localStorage.getItem('name');
    setUserName(storedName || 'User');
  }, []);

  useEffect(() => {
    const hasLoadedBefore = localStorage.getItem('hasLoadedDashboard');
    const user_level_id = localStorage.getItem('user_level_id');

    if (user_level_id !== '3' ) {
      localStorage.clear();
      navigate('/');
    } else {
      if (!hasLoadedBefore) {
        const timeoutId = setTimeout(() => {
          setLoading(false);
          setFadeIn(true);
          localStorage.setItem('hasLoadedDashboard', 'true');
        }, 2000);

        return () => clearTimeout(timeoutId);
      } else {
        setLoading(false);
        setFadeIn(true);
      }
    }
  }, [navigate]);

  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'success':
        return <FiCheck className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <FiAlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <FiAlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FiInfo className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationStyle = (type) => {
    switch (type?.toLowerCase()) {
      case 'success':
        return 'border-l-4 border-green-500 bg-green-50';
      case 'warning':
        return 'border-l-4 border-yellow-500 bg-yellow-50';
      case 'error':
        return 'border-l-4 border-red-500 bg-red-50';
      default:
        return 'border-l-4 border-blue-500 bg-blue-50';
    }
  };

  const NotificationsPopup = () => (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl z-50 overflow-hidden"
      >
        <div className="p-4 bg-gradient-to-r from-green-600 to-green-500 text-white">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">Notifications</h3>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setNotifications([])}
                className="p-1 hover:bg-green-700 rounded-full transition-colors"
                title="Clear all notifications"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-sm text-green-100 mt-1">
            {notifications.length} {notifications.length === 1 ? 'notification' : 'notifications'}
          </p>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {notificationsLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          ) : notifications.length > 0 ? (
            <motion.div layout>
              {notifications.map((notif, index) => (
                <motion.div
                  layout
                  key={notif.notification_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative ${
                    notif.is_read_by_user === '0'
                      ? getNotificationStyle(notif.type)
                      : 'bg-gray-50'
                  } p-4 hover:bg-opacity-90 transition-all cursor-pointer group`}
                  onClick={() => markNotificationAsRead(notif.notification_id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        notif.is_read_by_user === '0' ? 'text-gray-900' : 'text-gray-600'
                      }`}>
                        {notif.notification_message}
                      </p>
                      <div className="mt-1 flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {new Date(notif.notification_created_at).toLocaleString()}
                        </span>
                        {notif.is_read_by_user === '0' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            New
                          </span>
                        )}
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded-full transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        const updatedNotifications = notifications.filter(
                          n => n.notification_id !== notif.notification_id
                        );
                        setNotifications(updatedNotifications);
                      }}
                    >
                      <FiTrash2 className="w-4 h-4 text-gray-500" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center p-8 text-gray-500"
            >
              <FiBell className="w-12 h-12 mb-2 text-gray-400" />
              <p className="text-center">No notifications yet</p>
              <p className="text-sm text-center text-gray-400">
                We'll notify you when something arrives
              </p>
            </motion.div>
          )}
        </div>

        <div className="p-3 bg-gray-50 border-t text-xs text-center text-gray-500">
          Click on a notification to mark it as read
        </div>
      </motion.div>
    </AnimatePresence>
  );

  const SupportTicketPopup = () => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl z-50"
    >
      <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-t-lg">
        <h3 className="font-bold text-lg">Support Tickets</h3>
        <p className="text-sm text-blue-100">Create or view your support tickets</p>
      </div>
      <div className="p-4 space-y-3">
        <button
          onClick={() => navigate('/support/new')}
          className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-3 px-4 rounded-lg flex items-center space-x-3 transition-colors"
        >
          <FiMessageSquare className="w-5 h-5" />
          <span>Create New Ticket</span>
        </button>
        <button
          onClick={() => navigate('/support/list')}
          className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 px-4 rounded-lg flex items-center space-x-3 transition-colors"
        >
          <FiList className="w-5 h-5" />
          <span>View My Tickets</span>
        </button>
      </div>
    </motion.div>
  );

  const NotificationBell = () => (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="p-2 text-gray-700 hover:text-green-600 transition-colors relative"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <FiBell className="w-6 h-6" />
        <AnimatePresence>
          {notifications.filter(n => n.is_read_by_user === '0').length > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
            >
              {notifications.filter(n => n.is_read_by_user === '0').length}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
      <AnimatePresence>
        {showNotifications && <NotificationsPopup />}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white relative">
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: fadeIn ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.header 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white backdrop-blur-sm bg-opacity-80 shadow-lg sticky top-0 z-50"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-20">
                <div className="flex items-center space-x-4">
                  <motion.img 
                    src="/images/assets/phinma.png"
                    alt="PHINMA CDO Logo"
                    className="w-12 h-12 object-cover rounded-full shadow-md"
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  />
                  <motion.h1 
                    className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    GSD Reservation
                  </motion.h1>
                </div>
                <nav className="flex items-center space-x-6">
                  <motion.button 
                    variants={navButtonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    className="flex items-center space-x-2 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    onClick={() => navigate('/addReservation')}
                  >
                    <FiCalendar className="w-5 h-5" />
                    <span>Make Reserve</span>
                  </motion.button>
                  <motion.button 
                    variants={navButtonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    className="flex items-center space-x-2 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    onClick={() => setIsCalendarOpen(true)}
                  >
                    <FiCalendar className="w-5 h-5" />
                    <span>Calendar</span>
                  </motion.button>
                  <motion.button 
                    variants={navButtonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    className="flex items-center space-x-2 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
                    onClick={() => navigate('/viewReserve')}
                  >
                    <FiList className="w-5 h-5" />
                    <span>View Reserve</span>
                  </motion.button>
                  <div className="relative">
                    <motion.button 
                      variants={navButtonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      className="flex items-center space-x-2 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
                      onClick={() => setShowSupportTicket(!showSupportTicket)}
                    >
                      <FiHelpCircle className="w-5 h-5" />
                      <span>Support</span>
                    </motion.button>
                    <AnimatePresence>
                      {showSupportTicket && <SupportTicketPopup />}
                    </AnimatePresence>
                  </div>
                  <NotificationBell />
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 text-gray-700 hover:text-green-600 transition-colors"
                    onClick={() => navigate('/profile')}
                  >
                    <FiUser className="w-6 h-6" />
                  </motion.button>
                  <motion.button
                    variants={navButtonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => {
                      sessionStorage.clear();
                      localStorage.clear();
                      navigate('/gsd');
                      window.location.reload();
                    }}
                    className="flex items-center space-x-2 text-red-600 px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    <FiLogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </motion.button>
                </nav>
              </div>
            </div>
          </motion.header>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-xl p-8 backdrop-blur-sm bg-opacity-80 mb-8"
            >
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Welcome back, {userName}! 👋
              </h2>
              <p className="text-gray-600 text-lg">
                Here's what's happening with your reservations today.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statsData.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium mb-1">{stat.title}</p>
                      <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                    </div>
                    <div className={`${stat.color} p-3 rounded-full text-white`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="lg:col-span-2 bg-white rounded-xl shadow-md p-6"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Activities</h3>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className={`
                        p-2 rounded-full 
                        ${activity.type === 'Approved' ? 'bg-green-100 text-green-600' :
                          activity.type === 'Pending' ? 'bg-yellow-100 text-yellow-600' :
                          activity.type === 'Cancelled' ? 'bg-red-100 text-red-600' :
                          'bg-blue-100 text-blue-600'}
                      `}>
                        <FiBarChart2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-800 font-medium">{activity.message}</p>
                        <p className="text-gray-400 text-sm">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-xl shadow-md p-6"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
                <div className="space-y-4">
                  <button className="w-full bg-green-50 hover:bg-green-100 text-green-700 py-3 px-4 rounded-lg flex items-center space-x-3 transition-colors">
                    <FiCalendar className="w-5 h-5" />
                    <span>New Reservation</span>
                  </button>
                  <button className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-3 px-4 rounded-lg flex items-center space-x-3 transition-colors">
                    <FiList className="w-5 h-5" />
                    <span>View Schedule</span>
                  </button>
                  <button className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 py-3 px-4 rounded-lg flex items-center space-x-3 transition-colors">
                    <FiHelpCircle className="w-5 h-5" />
                    <span>Get Help</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </main>
          <ReservationCalendar 
            isOpen={isCalendarOpen}
            onClose={() => setIsCalendarOpen(false)}
          />
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
