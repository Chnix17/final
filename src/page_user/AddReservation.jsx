import React, { useState, useEffect, Fragment, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../pages/Sidebar';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { FaCalendarAlt, FaMapMarkerAlt, FaUser, FaCar, FaTools, FaTimes, FaSearch, FaCheck, FaCheckCircle } from 'react-icons/fa';
import 'react-datepicker/dist/react-datepicker.css';
import { motion } from 'framer-motion';
import { BsCalendarCheck, BsClock, BsPeople, BsFillGridFill, BsList } from 'react-icons/bs';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { Calendar } from 'primereact/calendar'; // Add this import
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Tag } from 'primereact/tag';
import { UserOutlined, InfoCircleOutlined, TeamOutlined, FileTextOutlined, PrinterOutlined, DashboardOutlined, PlusOutlined, TagOutlined, BankOutlined, CarOutlined, FormOutlined, FileSearchOutlined, CheckCircleOutlined, CheckCircleFilled } from '@ant-design/icons';
import { DatePicker, TimePicker, Form, Input, InputNumber, Select, Card, Typography, Row, Col, Divider, Radio, Result, Alert, Modal, Empty, Steps, Spin } from 'antd';
import moment from 'moment';
import { CalendarOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import { Dialog } from 'primereact/dialog';
import { InputNumber as PrimeInputNumber } from 'primereact/inputnumber';
import ReservationCalendar from './component/reservation_calendar';
import { Button as AntButton } from 'antd';  // Add this import

const { RangePicker } = DatePicker;

const fadeInAnimation = {
  initial: { opacity: 0, y: 0 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
};

// Add these new style constants
const mobileBreakpoint = '375px';

const containerStyles = {
  mobile: {
    padding: '12px',
    margin: '0',
    width: '100%'
  },
  desktop: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto'
  }
};

const cardStyles = {
  mobile: {
    padding: '12px',
    margin: '8px 0'
  },
  desktop: {
    padding: '24px',
    margin: '16px 0'
  }
};

const AddReservation = () => {
  const timeSlots = [
    { id: '08:00-10:00', label: 'Early Morning', time: '8:00 AM - 10:00 AM', start: 8, end: 10 },
    { id: '10:00-12:00', label: 'Mid Morning', time: '10:00 AM - 12:00 PM', start: 10, end: 12 },
    { id: '13:00-15:00', label: 'Early Afternoon', time: '1:00 PM - 3:00 PM', start: 13, end: 15 },
    { id: '15:00-17:00', label: 'Late Afternoon', time: '3:00 PM - 5:00 PM', start: 15, end: 17 },
    { id: '08:00-12:00', label: 'Morning', time: '8:00 AM - 12:00 PM', start: 8, end: 12 },
    { id: '13:00-17:00', label: 'Afternoon', time: '1:00 PM - 5:00 PM', start: 13, end: 17 },
    { id: '08:00-17:00', label: 'Full Day', time: '8:00 AM - 5:00 PM', start: 8, end: 17 },
  ];

  const navigate = useNavigate();
  const [userLevel] = useState(localStorage.getItem('user_level') || '');
  const userId = localStorage.getItem('user_id');
  const [loading, setLoading] = useState(false);
  
  // Add this state declaration for driver department selection
  const [selectedDriverDept, setSelectedDriverDept] = useState('current');

  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  const [venues, setVenues] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [selectedModels, setSelectedModels] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState({});
  const [users, setUsers] = useState([]);

  const [timeSlotMode, setTimeSlotMode] = useState('preset');
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [unavailableSlots, setUnavailableSlots] = useState([]);
  const [timeSlotAvailability, setTimeSlotAvailability] = useState({
    isChecking: false,
    isAvailable: false,
    conflicts: []
  });
  const [reservations, setReservations] = useState([]);

  const [resourceView, setResourceView] = useState('vehicles');
  const [currentStep, setCurrentStep] = useState(0);
  const [resourceStep, setResourceStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [vehicleCategories, setVehicleCategories] = useState([]);
  const [equipmentCategories, setEquipmentCategories] = useState([]);
  const [resourceType, setResourceType] = useState(''); // 'vehicle' or 'venue'
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [dateAvailability, setDateAvailability] = useState(null);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [selectedVenueEquipment, setSelectedVenueEquipment] = useState({});
  const [equipmentQuantities, setEquipmentQuantities] = useState({});

  const [formData, setFormData] = useState({
    resourceType: '',
    // Common fields
    startDate: null,
    endDate: null,
    selectedTime: null,
    // Venue specific fields
    eventTitle: '',
    description: '',
    participants: '',
    venue: [], // Change to array for multiple venues
    // Vehicle specific fields
    purpose: '',
    destination: '',
    passengers: [], // Make sure this is initialized as an empty array
    driverName: '',
  });

  // Add this with other state declarations at the top
  const [viewMode, setViewMode] = useState('grid');

  // Add these two new state declarations
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState([]);

  // Add this state declaration
  const [showUserModal, setShowUserModal] = useState(false);

  // Add responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 375);

  // Add resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 375);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add these new functions
const handleAddPassenger = (passengerName) => {
  setFormData(prev => ({
    ...prev,
    passengers: [
      ...prev.passengers,
      { id: Date.now(), name: passengerName }
    ]
  }));
};

const handleRemovePassenger = (passengerId) => {
  setFormData(prev => ({
    ...prev,
    passengers: prev.passengers.filter(p => p.id !== passengerId)
  }));
};

const handlePassengerChange = (passengerId, value) => {
  setFormData(prev => ({
    ...prev,
    passengers: prev.passengers.map(p =>
      p.id === passengerId ? { ...p, name: value } : p
    )
  }));
};

const handleEquipmentQuantityChange = (equipId, value) => {
  // Don't allow undefined, null, or negative values
  if (value === undefined || value === null || value < 0) return;
  
  const equip = equipment.find(e => e.equipment_id === equipId);
  if (!equip) return;

  // Check if quantity exceeds available amount
  if (value > equip.equipment_quantity) {
    toast.error(`Maximum available quantity is ${equip.equipment_quantity}`);
    return;
  }

  setEquipmentQuantities(prev => ({
    ...prev,
    [equipId]: value // Store the actual number value
  }));
};

const handleAddEquipment = () => {
  const newEquipment = {};
  Object.entries(equipmentQuantities).forEach(([equipId, quantity]) => {
    if (quantity > 0) {
      // Make sure to store as string consistently
      newEquipment[equipId.toString()] = quantity;
    }
  });
  
  setSelectedVenueEquipment(newEquipment);
  setShowEquipmentModal(false);

  // Add debug log
  console.log('Added Equipment:', newEquipment);
};

  useEffect(() => {
    const user_level_id = localStorage.getItem('user_level_id');
    const fetchData = async () => {
      setLoading(true);
      try {
        if (user_level_id !== '3' && user_level_id !== '3') {
          localStorage.clear();
          navigate('/gsd');
          return;
        }
        await Promise.all([fetchVenues(), fetchVehicles(), fetchEquipment()]);
      } catch (error) {
        toast.error("An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);



  const fetchVenues = async () => {
    try {
      const response = await axios({
        method: 'post',
        url: 'http://localhost/coc/gsd/fetch2.php',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          operation: 'fetchVenue'
        }
      });

      if (response.data.status === 'success') {
        setVenues(response.data.data);
      } else {
        toast.error("Error fetching venues: " + response.data.message);
      }
    } catch (error) {
      console.error("Error fetching venues:", error);
      toast.error("An error occurred while fetching venues.");
    }
  };

  

const fetchVehicles = async () => {
  try {
    const response = await axios({
      method: 'post',
      url: 'http://localhost/coc/gsd/fetch2.php',
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        operation: 'fetchVehicles'
      }
    });

    if (response.data.status === 'success') {
      setVehicles(response.data.data);
    } else {
      toast.error("Error fetching vehicles: " + response.data.message);
    }
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    toast.error("An error occurred while fetching vehicles.");
  }
};

const fetchEquipment = async () => {
  // Only fetch equipment if we have both start and end dates
  if (!formData.startDate || !formData.endDate) return;

  try {
    // Convert dates to required format
    const startDateTime = format(new Date(formData.startDate), 'yyyy-MM-dd HH:mm:ss');
    const endDateTime = format(new Date(formData.endDate), 'yyyy-MM-dd HH:mm:ss');

    // Log the request payload for debugging
    console.log('Equipment fetch payload:', {
      operation: 'fetchEquipments',
      startDateTime,
      endDateTime
    });

    const response = await axios({
      method: 'post',
      url: 'http://localhost/coc/gsd/fetch2.php',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: JSON.stringify({
        operation: 'fetchEquipments',
        startDateTime: startDateTime,
        endDateTime: endDateTime
      })
    });

    // Log the response for debugging
    console.log('Equipment fetch response:', response.data);

    if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
      const formattedEquipment = response.data.data.map(item => ({
        equipment_id: item.equip_id,
        equipment_name: item.equip_name,
        equipment_quantity: parseInt(item.equip_quantity) || 0,
        equipment_category: item.equipments_category_name || 'Uncategorized',
        equipment_pic: item.equip_pic,
        status_availability_name: item.status_availability_name || 'unavailable',
        reserved_quantity: parseInt(item.reserved_quantity || 0),
        available_quantity: parseInt(item.equip_quantity || 0) - parseInt(item.reserved_quantity || 0)
      }));
      
      setEquipment(formattedEquipment);
    } else {
      throw new Error('Invalid response format from server');
    }
  } catch (error) {
    console.error("Error fetching equipment:", error);
    console.error("Response data:", error.response?.data);
    toast.error("An error occurred while fetching equipment.");
  }
};
  
  // Update useEffect to call fetchEquipment when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      fetchEquipment();
    }
  }, [formData.startDate, formData.endDate]);
  

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const vehicleResponse = await axios.post(
          'http://localhost/coc/gsd/fetch2.php',
          new URLSearchParams({ operation: 'fetchVehicleCategories' })
        );
        if (vehicleResponse.data.status === 'success') {
          setVehicleCategories(vehicleResponse.data.data);
        }

        const equipResponse = await axios.post(
          'http://localhost/coc/gsd/fetch2.php',
          new URLSearchParams({ operation: 'fetchEquipmentCategories' })
        );
        if (equipResponse.data.status === 'success') {
          setEquipmentCategories(equipResponse.data.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);



const handleNext = async () => {
  if (!validateCurrentStep()) {
    return;
  }

  // For equipment selection, ensure the state is updated before moving to review
  if (currentStep === 3 && formData.resourceType === 'venue') {
    // First update the equipment state
    const newEquipment = {};
    Object.entries(equipmentQuantities).forEach(([equipId, quantity]) => {
      if (quantity > 0) {
        newEquipment[equipId.toString()] = quantity;
      }
    });
    
    // Update the selected equipment state
    setSelectedVenueEquipment(newEquipment);
    
    // Use a callback to ensure state is updated before moving to next step
    setTimeout(() => {
      setCurrentStep(4);
    }, 0);
    return;
  }

  if (currentStep === 4) { // Review step
    const success = await handleAddReservation();
    if (success) {
      setCurrentStep(5); // Move to success state
      resetForm(); // Optional: reset form after successful submission
    }
    return;
  }

  setCurrentStep(prev => prev + 1);
};

// Update validateCurrentStep to check for complete date/time selection
const validateCurrentStep = () => {
  switch (currentStep) {
    case 0:
      if (!formData.resourceType) {
        toast.error('Please select a resource type (Venue or Vehicle)');
        return false;
      }
      return true;

    case 1:
      if (formData.resourceType === 'venue' && formData.venue.length === 0) {
        toast.error('Please select at least one venue');
        return false;
      }
      if (formData.resourceType === 'vehicle' && (!selectedModels || selectedModels.length === 0)) {
        toast.error('Please select at least one vehicle');
        return false;
      }
      return true;

    case 2: // Calendar step
      if (!formData.startDate || !formData.endDate) {
        toast.error('Please select both start and end date/time');
        return false;
      }
      
      // Validate business hours (8 AM - 5 PM)
      const startHour = formData.startDate.getHours();
      const endHour = formData.endDate.getHours();
      if (startHour < 5 || startHour > 20 || endHour < 5 || endHour > 20) {
        toast.error('Please select times between 8 AM and 5 PM');
        return false;
      }

      // Validate that end time is after start time
      if (formData.endDate <= formData.startDate) {
        toast.error('End time must be after start time');
        return false;
      }
      
      return true;

    case 3:
      if (formData.resourceType === 'venue') {
        if (!formData.eventTitle || !formData.eventTitle.trim()) {
          toast.error('Please enter an event title');
          return false;
        }
        if (!formData.description || !formData.description.trim()) {
          toast.error('Please enter a description');
          return false;
        }
        // Note: participants is not required
        return true;
      } else { // Vehicle validation
        if (!formData.purpose || !formData.purpose.trim()) {
          toast.error('Please enter a purpose');
          return false;
        }
        if (!formData.destination || !formData.destination.trim()) {
          toast.error('Please enter a destination');
          return false;
        }
        if (!formData.driverName || !formData.driverName.trim()) {
          toast.error('Please enter a driver name');
          return false;
        }
        if (!formData.passengers || formData.passengers.length === 0) {
          toast.error('Please add at least one passenger');
          return false;
        }
        return true;
      }

    default:
      return true;
  }
};

const handleBack = () => {
  if (currentStep > 0) {
    setCurrentStep(prev => prev - 1);
  }
};

const handleInputChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: value
  }));
};

const handleCheckboxChange = (id, type) => {
  if (type === 'vehicle') {
    setSelectedModels(prevSelected => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter(selectedId => selectedId !== id);
      } else {
        return [...prevSelected, id];
      }
    });
  }
};

const handleEquipmentCheckboxChange = (equipId, quantity = 1) => {
  setSelectedEquipment(prev => {
    const newSelected = { ...prev };
    if (newSelected[equipId]) {
      delete newSelected[equipId];
    } else {
      const equip = equipment.find(e => e.equipment_id === equipId);
      if (equip && quantity <= equip.equipment_quantity) {
        newSelected[equipId] = quantity;
      } else {
        toast.error(`Maximum available quantity is ${equip?.equipment_quantity}`);
        return prev;
      }
    }
    return newSelected;
  });
};

const handleUserSearch = (e) => {
  const term = e.target.value.toLowerCase();
  setSearchTerm(term);
  const filtered = users.filter(user => 
    user.users_name.toLowerCase().includes(term) ||
    user.users_school_id.toLowerCase().includes(term)
  );
  setFilteredUsers(filtered);
};

const selectUser = (user) => {
  setFormData(prevState => ({
    ...prevState,
    selectedUserId: user.users_id
  }));
  setShowUserModal(false);
};

const handleStartDateChange = (date) => {
  setFormData(prev => {
    const newEndDate = prev.endDate && new Date(prev.endDate) < date ? null : prev.endDate;
    return {
      ...prev,
      startDate: date,
      endDate: newEndDate
    };
  });
};

const handleEndDateChange = (date) => {
  setFormData(prev => ({
    ...prev,
    endDate: date
  }));
};

const renderVenues = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-2"
  >
    {/* Compact header */}
    <div className="flex justify-between items-center px-2 mb-2">
      <h3 className="font-medium text-sm sm:text-base truncate flex-1">
        {formData.venue.length > 0 
          ? `Selected Venues (${formData.venue.length})`
          : 'Select Venues'}
      </h3>
      <div className="flex space-x-1 bg-gray-100 p-0.5 rounded-md ml-2">
        <button
          onClick={() => setViewMode('grid')}
          className={`p-1 rounded ${
            viewMode === 'grid' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600'
          }`}
        >
          <BsFillGridFill size={14} />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`p-1 rounded ${
            viewMode === 'list' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600'
          }`}
        >
          <BsList size={14} />
        </button>
      </div>
    </div>

    {/* Responsive grid/list container */}
    <div className={`
      ${viewMode === 'grid' 
        ? 'grid grid-cols-2 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
        : 'space-y-2'
      }
    `}>
      {venues.map((venue) => (
        <Card
          key={venue.ven_id}
          className={`
            cursor-pointer
            ${viewMode === 'list' ? 'flex' : ''}
            ${formData.venue.includes(venue.ven_id) ? 'ring-1 ring-green-500' : ''}
            p-1.5 hover:shadow-md transition-shadow
          `}
          onClick={() => {
            setFormData(prev => ({
              ...prev,
              venue: prev.venue.includes(venue.ven_id)
                ? prev.venue.filter(id => id !== venue.ven_id)
                : [...prev.venue, venue.ven_id]
            }));
          }}
        >
          <div className={`
            ${viewMode === 'list' ? 'flex items-center gap-2' : ''}
            ${isMobile ? 'text-xs' : 'text-sm'}
          `}>
            {/* Optimized image size */}
            <div className={viewMode === 'list' ? 'w-16 flex-shrink-0' : ''}>
              <img
                src={venue.ven_pic ? `http://localhost/coc/gsd/${venue.ven_pic}` : '/default-venue.jpg'}
                alt={venue.ven_name}
                className={`
                  object-cover rounded
                  ${viewMode === 'grid' ? 'w-full h-20 sm:h-24' : 'h-16 w-16'}
                `}
                onError={(e) => {
                  e.target.src = '/default-venue.jpg';
                  e.target.onerror = null;
                }}
              />
            </div>

            {/* Compact content */}
            <div className={`
              ${viewMode === 'list' ? 'flex-1 min-w-0' : 'mt-1.5'}
              ${isMobile ? 'space-y-0.5' : 'space-y-1'}
            `}>
              <div className="flex items-start justify-between gap-1">
                <h3 className="font-medium text-gray-800 truncate flex-1 text-xs sm:text-sm">
                  {venue.ven_name}
                </h3>
                <Tag
                  severity={venue.status_availability_name === 'available' ? 'success' : 'danger'}
                  value={venue.status_availability_name}
                  className="text-[10px] px-1 py-0.5"
                />
              </div>
              
              <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs text-gray-600">
                <div className="flex items-center gap-0.5">
                  <i className="pi pi-users text-[10px]" />
                  <span>{venue.ven_occupancy}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <i className="pi pi-clock text-[10px]" />
                  <span>8-5</span>
                </div>
              </div>

              {formData.venue === venue.ven_id && (
                <div className="flex items-center gap-0.5 text-green-600 text-[10px]">
                  <i className="pi pi-check" />
                  <span>Selected</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  </motion.div>
);


// Modify renderResources to only show vehicles without equipment options
const renderResources = () => (
  <div className="space-y-4">
    {/* Header section with responsive controls */}
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-white p-2 sm:p-4 rounded-lg shadow-sm">
      {/* Title with responsive font size */}
      <h3 className="text-sm sm:text-lg font-semibold text-gray-800">
        {selectedModels.length > 0 ? `Vehicles (${selectedModels.length})` : 'Select Vehicle'}
      </h3>

      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        {/* Category filter - Full width on mobile */}
        <Dropdown
          value={selectedCategory}
          options={[
            { label: 'All Categories', value: 'all' },
            ...vehicleCategories.map(cat => ({ 
              label: cat.name, 
              value: cat.id 
            }))
          ]}
          onChange={(e) => setSelectedCategory(e.value)}
          className="w-full sm:w-[200px]"
          placeholder="Category"
        />

        {/* Compact view toggle */}
        <div className="flex bg-gray-100 p-0.5 rounded-md ml-auto sm:ml-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1 rounded-md ${
              viewMode === 'grid' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600'
            }`}
          >
            <BsFillGridFill size={12} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1 rounded-md ${
              viewMode === 'list' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600'
            }`}
          >
            <BsList size={12} />
          </button>
        </div>
      </div>
    </div>

    {/* Vehicles grid/list with responsive layout */}
    <div className={`
      ${viewMode === 'grid' 
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2'
        : 'space-y-2'}
    `}>
      {vehicles
        .filter(vehicle => selectedCategory === 'all' || vehicle.vehicle_category_id === selectedCategory)
        .map((vehicle) => (
          <Card
            key={vehicle.vehicle_id}
            className={`
              ${viewMode === 'list' ? 'flex' : ''}
              transition-all duration-200
              cursor-pointer
              ${selectedModels.includes(vehicle.vehicle_id) 
                ? 'ring-1 ring-blue-500 bg-blue-50' 
                : 'hover:shadow-md hover:border-blue-200'
              }
              p-2
            `}
            onClick={() => handleVehicleSelect(vehicle.vehicle_id)}
          >
            <div className={`
              ${viewMode === 'list' ? 'flex items-center w-full gap-2' : ''}
            `}>
              {/* Responsive image container */}
              <div className={viewMode === 'list' ? 'w-20 sm:w-32 flex-shrink-0' : ''}>
                <img
                  src={vehicle.vehicle_pic ? `http://localhost/coc/gsd/${vehicle.vehicle_pic}` : '/default-vehicle.jpg'}
                  alt={`${vehicle.vehicle_make_name} ${vehicle.vehicle_model_name}`}
                  className={`
                    object-cover rounded-lg
                    ${viewMode === 'grid' 
                      ? 'w-full h-20 sm:h-32' 
                      : 'h-16 sm:h-24 w-full'}
                  `}
                  onError={(e) => {
                    e.target.src = '/default-vehicle.jpg';
                    e.target.onerror = null;
                  }}
                />
              </div>

              {/* Content with minimized info on mobile */}
              <div className={`
                ${viewMode === 'list' 
                  ? 'flex-grow flex justify-between items-start' 
                  : 'mt-2'}
                p-1
              `}>
                <div className="space-y-1 w-full">
                  {/* Vehicle title - Truncated on mobile */}
                  <h3 className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[150px] sm:max-w-none">
                    {vehicle.vehicle_make_name} {vehicle.vehicle_model_name}
                  </h3>
                  
                  {/* License and availability status */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <CarOutlined className="text-gray-400 text-xs" />
                      <span className="text-xs text-gray-600 truncate">
                        {vehicle.vehicle_license}
                      </span>
                    </div>
                    <Tag
                      severity={vehicle.status_availability_name === 'available' ? 'success' : 'danger'}
                      value={vehicle.status_availability_name}
                      className="text-[10px] px-1 py-0"
                    />
                  </div>

                  {/* Capacity - Hidden on mobile grid view */}
                  <div className={`
                    flex items-center gap-1
                    ${viewMode === 'grid' && window.innerWidth <= 375 ? 'hidden' : 'block'}
                  `}>
                    <BsPeople className="text-gray-400 text-xs" />
                    <span className="text-xs text-gray-600">
                      {vehicle.vehicle_capacity || 'N/A'}
                    </span>
                  </div>

                  {/* Selection indicator - Minimal on mobile */}
                  {selectedModels.includes(vehicle.vehicle_id) && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <CheckCircleOutlined className="text-xs" />
                      <span className="text-xs">Selected</span>
                    </div>
                  )}
                </div>

                {/* Checkbox - Only in list view */}
                {viewMode === 'list' && (
                  <Checkbox
                    checked={selectedModels.includes(vehicle.vehicle_id)}
                    onChange={() => {}}
                    className="ml-2"
                    disabled={vehicle.status_availability_name !== 'available'}
                  />
                )}
              </div>
            </div>
          </Card>
        ))}
    </div>

    {/* Empty state - Compact on mobile */}
    {vehicles.filter(vehicle => 
      selectedCategory === 'all' || vehicle.vehicle_category_id === selectedCategory
    ).length === 0 && (
      <Empty
        description={
          <span className="text-xs sm:text-sm text-gray-500">No vehicles found</span>
        }
        className="bg-white p-3 sm:p-6 rounded-lg"
      />
    )}
  </div>
);

// Modify renderBasicInformation to include date selection button and modal
const renderBasicInformation = () => {
  const { Title } = Typography;
  const { TextArea } = Input;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <Card className="shadow-sm border-0">
        <div className={`${isMobile ? 'p-3' : 'p-6'}`}>
          {/* Compact Header */}
          <Title level={isMobile ? 5 : 4} className="mb-4 flex items-center gap-2">
            <InfoCircleOutlined />
            <span className="truncate">
              {formData.resourceType === 'venue' ? 'Venue Details' : 'Vehicle Details'}
            </span>
          </Title>

          <Form layout="vertical" className="space-y-3">
            {formData.resourceType === 'venue' ? (
              // Venue Fields - Minimized for Mobile
              <>
                <Form.Item
                  label={<span className="text-sm">Event Title <span className="text-red-500">*</span></span>}
                  required
                >
                  <Input
                    name="eventTitle"
                    value={formData.eventTitle}
                    onChange={handleInputChange}
                    className="rounded"
                    size={isMobile ? 'middle' : 'large'}
                    placeholder="Event title"
                  />
                </Form.Item>

                <Form.Item
                  label={<span className="text-sm">Description <span className="text-red-500">*</span></span>}
                  required
                >
                  <TextArea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={isMobile ? 3 : 4}
                    className="rounded"
                    placeholder="Event description"
                  />
                </Form.Item>

                <Form.Item
                  label={<span className="text-sm">Participants</span>}
                >
                  <InputNumber
                    min={1}
                    name="participants"
                    value={formData.participants}
                    onChange={(value) => handleInputChange({
                      target: { name: 'participants', value }
                    })}
                    className="w-full"
                    size={isMobile ? 'middle' : 'large'}
                  />
                </Form.Item>

                {/* Equipment Section - Collapsed on Mobile */}
                <div className={`${isMobile ? 'mt-3 pt-3' : 'mt-6 pt-6'} border-t`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className={`font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>
                      Equipment
                    </span>
                    <Button
                      type="dashed"
                      icon={<FaTools className="text-xs" />}
                      onClick={() => setShowEquipmentModal(true)}
                      size={isMobile ? 'small' : 'middle'}
                    >
                      Add
                    </Button>
                  </div>

                  {/* Equipment List - Grid for Desktop, List for Mobile */}
                  {Object.keys(selectedVenueEquipment).length > 0 && (
                    <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                      {Object.entries(selectedVenueEquipment).map(([equipId, quantity]) => {
                        const equip = equipment.find(e => e.equipment_id.toString() === equipId);
                        if (!equip) return null;
                        
                        return (
                          <Card 
                            key={equipId} 
                            size="small"
                            className="bg-gray-50"
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src={`http://localhost/coc/gsd/${equip.equipment_pic}`}
                                alt={equip.equipment_name}
                                className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} object-cover rounded`}
                                onError={(e) => {
                                  e.target.src = '/default-equipment.jpg';
                                  e.target.onerror = null;
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium truncate">
                                  {equip.equipment_name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Qty: {quantity}
                                </div>
                              </div>
                              <Button
                                danger
                                type="text"
                                size="small"
                                icon={<FaTimes className="text-xs" />}
                                onClick={() => {
                                  const newSelected = { ...selectedVenueEquipment };
                                  delete newSelected[equipId];
                                  setSelectedVenueEquipment(newSelected);
                                }}
                              />
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Vehicle Fields - Minimized for Mobile
              <>
                <Form.Item
                  label={<span className="text-sm">Purpose <span className="text-red-500">*</span></span>}
                  required
                >
                  <TextArea
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    rows={isMobile ? 2 : 3}
                    className="rounded"
                    placeholder="Trip purpose"
                  />
                </Form.Item>

                <Form.Item
                  label={<span className="text-sm">Destination <span className="text-red-500">*</span></span>}
                  required
                >
                  <Input
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    className="rounded"
                    size={isMobile ? 'middle' : 'large'}
                    placeholder="Enter destination"
                  />
                </Form.Item>

                {renderDriverDropdown()}

                {/* Passengers Section */}
                <Form.Item
                  label={<span className="text-sm">Passengers <span className="text-red-500">*</span></span>}
                  required
                >
                  <Button
                    icon={<UserOutlined className="text-xs" />}
                    onClick={() => setShowPassengerModal(true)}
                    size={isMobile ? 'middle' : 'large'}
                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                  >
                    Add Passengers
                  </Button>

                  {/* Passenger List - Compact on Mobile */}
                  {formData.passengers.length > 0 && (
                    <div className={`mt-2 border rounded divide-y ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      {formData.passengers.map((passenger, index) => (
                        <div 
                          key={passenger.id}
                          className="flex items-center justify-between p-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">{index + 1}.</span>
                            <span className="truncate">{passenger.name}</span>
                          </div>
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<FaTimes className="text-xs" />}
                            onClick={() => handleRemovePassenger(passenger.id)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </Form.Item>
              </>
            )}
          </Form>
        </div>
      </Card>
      {formData.resourceType === 'venue' && <EquipmentSelectionModal />}
    </motion.div>
  );
};

const renderResourceTypeSelection = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="max-w-4xl mx-auto"
  >
    <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-6'}`}>
      <Card 
        className={`
          cursor-pointer transform transition-all duration-300
          ${isMobile ? 'p-3' : 'p-6'}
          ${resourceType === 'venue' ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-lg'}`}
        onClick={() => {
          setResourceType('venue');
          setFormData(prev => ({ ...prev, resourceType: 'venue' }));
        }}
      >
        <div className={`text-center ${isMobile ? 'space-y-2' : 'space-y-4'}`}>
          <div className={`
            mx-auto rounded-full flex items-center justify-center
            ${isMobile ? 'w-12 h-12' : 'w-16 h-16'}
            bg-blue-100
          `}>
            <FaMapMarkerAlt className={`${isMobile ? 'text-xl' : 'text-2xl'} text-blue-600`} />
          </div>
          <h4 className={`font-semibold ${isMobile ? 'text-lg' : 'text-xl'}`}>
            Venue Reservation
          </h4>
          {!isMobile && <p className="text-gray-600">Book a venue for your upcoming event</p>}
        </div>
      </Card>

      <Card 
        className={`cursor-pointer transform transition-all duration-300 hover:scale-105
          ${resourceType === 'vehicle' ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-lg'}`}
        onClick={() => {
          setResourceType('vehicle');
          setFormData(prev => ({ ...prev, resourceType: 'vehicle', venue: '' }));
        }}
      >
        <div className={`text-center ${isMobile ? 'space-y-2' : 'space-y-4'}`}>
          <div className={`
            mx-auto rounded-full flex items-center justify-center
            ${isMobile ? 'w-12 h-12' : 'w-16 h-16'}
            bg-green-100
          `}>
            <FaCar className={`${isMobile ? 'text-xl' : 'text-2xl'} text-green-600`} />
          </div>
          <h4 className={`font-semibold ${isMobile ? 'text-lg' : 'text-xl'}`}>
            Vehicle Reservation
          </h4>
          {!isMobile && <p className="text-gray-600">Reserve a vehicle for transportation</p>}
        </div>
      </Card>
    </div>
  </motion.div>
);

const handleAddReservation = async () => {
  try {
    setLoading(true);

    const userId = localStorage.getItem('user_id');
    
    if (!userId) {
      toast.error('User session invalid. Please log in again.');
      return false;
    }

    if (formData.resourceType === 'venue') {
      if (formData.venue.length === 0 || !formData.eventTitle || !formData.description || 
          !formData.startDate || !formData.endDate) {
        toast.error('Please fill in all required venue reservation fields');
        return false;
      }

      // Format the payload according to API requirements
      const venuePayload = {
        operation: 'venuereservation',
        form_data: {
          title: formData.eventTitle.trim(),
          description: formData.description.trim(),
          participants: formData.participants ? formData.participants.toString() : "0",
          start_date: format(new Date(formData.startDate), 'yyyy-MM-dd HH:mm:ss'),
          end_date: format(new Date(formData.endDate), 'yyyy-MM-dd HH:mm:ss'),
          user_id: parseInt(userId),
          venues: formData.venue.map(id => parseInt(id)), // Convert venue IDs to array
          equipment: Object.entries(selectedVenueEquipment).map(([equipId, quantity]) => ({
            equipment_id: parseInt(equipId),
            quantity: parseInt(quantity)
          }))
        }
      };

      const response = await axios.post(
        'http://localhost/coc/gsd/insert_reservation.php',
        venuePayload,
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.data.status === 'success') {
        toast.success('Venue reservation submitted successfully!');
        setCurrentStep(5);
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to submit venue reservation');
      }
    } else { // Vehicle reservation
      if (!selectedModels || selectedModels.length === 0 || !formData.driverName) {
        toast.error('Please select vehicle(s) and driver');
        return false;
      }
      if (!formData.purpose || !formData.destination || !formData.startDate || !formData.endDate) {
        toast.error('Please fill in all required vehicle reservation fields');
        return false;
      }

      const vehiclePayload = {
        operation: 'vehiclereservation',
        form_data: {
          destination: formData.destination.trim(),
          purpose: formData.purpose.trim(),
          start_date: format(new Date(formData.startDate), 'yyyy-MM-dd HH:mm:ss'),
          end_date: format(new Date(formData.endDate), 'yyyy-MM-dd HH:mm:ss'),
          user_id: userId,
          vehicles: selectedModels.map(id => parseInt(id)),
          passengers: formData.passengers.map(p => p.name.trim()),
          driver_id: formData.driverName
        }
      };

      const response = await axios.post(
        'http://localhost/coc/gsd/insert_reservation.php',
        vehiclePayload,
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.data.status === 'success') {
        toast.success('Vehicle reservation submitted successfully!');
        setCurrentStep(5);
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to submit vehicle reservation');
      }
    }
  } catch (error) {
    console.error('Submission error:', error);
    toast.error(error.message || 'An error occurred while submitting the reservation');
    return false;
  } finally {
    setLoading(false);
  }
};

// Add this new validation helper function
const validatePayload = (payload) => {
  const missing = [];

  if (!payload.user_id) missing.push('User ID');
  if (!payload.dept_id) missing.push('Department ID');

  if (payload.operation === 'venueReservation') {
    if (!payload.venue_id) missing.push('Venue');
    if (!payload.form_data.name) missing.push('Reservation Name');
    if (!payload.form_data.event_title) missing.push('Event Title');
    if (!payload.form_data.description) missing.push('Description');
    if (!payload.form_data.participants) missing.push('Participants');
    if (!payload.form_data.start_date) missing.push('Start Date');
    if (!payload.form_data.end_date) missing.push('End Date');
    
    // Validate equipment quantities if equipment is present
    if (payload.form_data.equipment && payload.form_data.equipment.length > 0) {
      const invalidEquipment = payload.form_data.equipment.filter(
        item => !item.equipment_id || !item.quantity || item.quantity < 1
      );
      if (invalidEquipment.length > 0) missing.push('Valid Equipment Quantities');
    }
  } else {
    if (!payload.vehicles || payload.vehicles.length === 0) missing.push('Vehicles');
    if (!payload.form_data.name) missing.push('Reservation Name');
    if (!payload.form_data.purpose) missing.push('Purpose');
    if (!payload.form_data.destination) missing.push('Destination');
    if (!payload.form_data.start_date) missing.push('Start Date');
    if (!payload.form_data.end_date) missing.push('End Date');
    if (!payload.form_data.passengers || payload.form_data.passengers.length === 0) missing.push('Passengers');
  }

  return {
    valid: missing.length === 0,
    missing
  };
};

const resetForm = () => {
  setFormData({
    resourceType: '',
    startDate: null,
    endDate: null,
    selectedTime: null,
    eventTitle: '',
    description: '',
    participants: '',
    venue: [],
    purpose: '',
    destination: '',
    passengers: [], // Reset passengers to empty array
    driverName: '',
  });
  setSelectedModels([]);
  setSelectedEquipment({});
  setCurrentStep(0);
  setSelectedTime(null);
  setTimeSlotAvailability({
    isChecking: false,
    isAvailable: false,
    conflicts: []
  });
  setUnavailableSlots([]);
  setSelectedVenueEquipment({});
  setEquipmentQuantities({});
};



const renderReviewSection = () => {
  const selectedVenues = venues.filter(v => formData.venue.includes(v.ven_id));
  const selectedVehicleDetails = vehicles.filter(v => selectedModels.includes(v.vehicle_id));
  const storedName = localStorage.getItem('name');
  const selectedDriver = drivers.find(d => d.driver_id.toString() === formData.driverName?.toString());

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className={`${isMobile ? 'p-3 space-y-3' : 'p-6 space-y-6'}`}>
          {/* Basic Details - Minimized for mobile */}
          <div className="space-y-3">
            <h4 className={`${isMobile ? 'text-sm' : 'text-lg'} font-medium text-gray-700 flex items-center gap-2`}>
              <FaCalendarAlt className="text-green-600" />
              Basic Details
            </h4>
            <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-2 gap-6'} pl-4`}>
              <div>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>Name</p>
                <p className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-gray-900 truncate`}>
                  {storedName || '-'}
                </p>
              </div>
              <div>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>Type</p>
                <p className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-gray-900 capitalize`}>
                  {formData.resourceType}
                </p>
              </div>
            </div>
          </div>

          {formData.resourceType === 'venue' ? (
            // Venue Details - Minimized for mobile
            <div className="space-y-4">
              <h4 className={`${isMobile ? 'text-sm' : 'text-lg'} font-medium text-gray-700`}>
                Selected Venues ({selectedVenues.length})
              </h4>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                  {selectedVenues.map(venue => (
                    <div key={venue.ven_id} className="bg-white rounded-lg p-3">
                      <div className="space-y-3">
                        <img
                          src={venue.image_url || '/default-venue.jpg'}
                          alt={venue.ven_name}
                          className={`w-full ${isMobile ? 'h-32' : 'h-48'} object-cover rounded-lg`}
                        />
                        <div className={isMobile ? 'text-sm' : ''}>
                          <h5 className="font-medium">{venue.ven_name}</h5>
                          <p className="text-xs text-gray-600">Capacity: {venue.ven_occupancy}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-4'} mt-3`}>
                  <div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>Event</p>
                    <p className={`${isMobile ? 'text-sm' : 'text-base'} font-medium truncate`}>
                      {formData.eventTitle}
                    </p>
                  </div>
                  {!isMobile && (
                    <div>
                      <p className="text-sm text-gray-500">Participants</p>
                      <p className="font-medium">{formData.participants}</p>
                    </div>
                  )}
                </div>

                {/* Equipment Section - Collapsed on mobile */}
                {Object.keys(selectedVenueEquipment).length > 0 && (
                  <div className="mt-4">
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium mb-2`}>Equipment</p>
                    <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                      {Object.entries(selectedVenueEquipment).map(([equipId, quantity]) => {
                        const equip = equipment.find(e => e.equipment_id.toString() === equipId.toString());
                        if (!equip) return null;
                        return (
                          <div key={equipId} className="flex items-center gap-2 bg-white p-2 rounded">
                            <img
                              src={`http://localhost/coc/gsd/${equip.equipment_pic}`}
                              alt={equip.equipment_name}
                              className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} object-cover rounded`}
                              onError={(e) => { e.target.src = '/default-equipment.jpg'; }}
                            />
                            <div className={isMobile ? 'text-xs' : 'text-sm'}>
                              <p className="font-medium truncate">{equip.equipment_name}</p>
                              <p className="text-gray-500">Qty: {quantity}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Vehicle Details - Minimized for mobile
            <div className="space-y-4">
              <h4 className={`${isMobile ? 'text-sm' : 'text-lg'} font-medium text-gray-700`}>
                Vehicle Details
              </h4>
              <div className="bg-gray-50 rounded-lg p-3">
                {/* Trip Info - Minimized */}
                <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-4'}`}>
                  <div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>Purpose</p>
                    <p className={`${isMobile ? 'text-sm' : 'text-base'} font-medium truncate`}>
                      {formData.purpose}
                    </p>
                  </div>
                  <div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>Driver</p>
                    <p className={`${isMobile ? 'text-sm' : 'text-base'} font-medium truncate`}>
                      {selectedDriver?.driver_full_name || '-'}
                    </p>
                  </div>
                </div>

                {/* Vehicles - Compact grid */}
                <div className="mt-4">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium mb-2`}>Vehicles</p>
                  <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                    {selectedVehicleDetails.map(vehicle => (
                      <div key={vehicle.vehicle_id} className="bg-white rounded p-2 flex gap-2">
                        <img
                          src={vehicle.vehicle_pic ? `http://localhost/coc/gsd/${vehicle.vehicle_pic}` : '/default-vehicle.jpg'}
                          alt={vehicle.vehicle_model_name}
                          className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} object-cover rounded`}
                        />
                        <div className={isMobile ? 'text-xs' : 'text-sm'}>
                          <p className="font-medium">{vehicle.vehicle_model_name}</p>
                          <p className="text-gray-500">{vehicle.vehicle_license}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Passengers - Compact list */}
                <div className="mt-4">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium mb-2`}>
                    Passengers ({formData.passengers.length})
                  </p>
                  <div className={`${isMobile ? 'text-xs' : 'text-sm'} bg-white rounded p-2`}>
                    {formData.passengers.length > 0 ? (
                      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                        {formData.passengers.map((passenger, index) => (
                          <div key={passenger.id} className="flex items-center gap-1">
                            <span className="text-gray-500">{index + 1}.</span>
                            <span className="truncate">{passenger.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No passengers</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Schedule - Minimized for mobile */}
          <div className="space-y-2">
            <h4 className={`${isMobile ? 'text-sm' : 'text-lg'} font-medium text-gray-700 flex items-center gap-2`}>
              <BsClock className="text-green-600" />
              Schedule
            </h4>
            <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-4'} pl-4`}>
              <div>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>Start</p>
                <p className={`${isMobile ? 'text-sm' : 'text-base'} font-medium`}>
                  {formData.startDate ? format(new Date(formData.startDate), isMobile ? 'PP p' : 'PPpp') : '-'}
                </p>
              </div>
              <div>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>End</p>
                <p className={`${isMobile ? 'text-sm' : 'text-base'} font-medium`}>
                  {formData.endDate ? format(new Date(formData.endDate), isMobile ? 'PP p' : 'PPpp') : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const handleVehicleSelect = (vehicleId) => {
  setSelectedModels(prevSelected => {
    if (prevSelected.includes(vehicleId)) {
      return prevSelected.filter(id => id !== vehicleId);
    } else {
      return [...prevSelected, vehicleId];
    }
  });
};

const handleEquipmentSelect = (equipId, quantity) => {
  setSelectedEquipment(prev => {
    const newSelected = { ...prev };
    if (quantity === 0 || !quantity) {
      delete newSelected[equipId];
    } else {
      newSelected[equipId] = quantity;
    }
    return newSelected;
  });
};

const handleTimeSlotSelect = (timeSlotId) => {
  if (unavailableSlots.includes(timeSlotId)) {
    toast.error('This time slot is not available');
    return;
  }

  setSelectedTime(timeSlotId);
  const selectedSlot = timeSlots.find(slot => slot.id === timeSlotId);
  
  if (!selectedSlot) return;

  const startDate = new Date(formData.startDate);
  const endDate = new Date(formData.startDate); // Use same day for both

  // Set the correct hours
  startDate.setHours(selectedSlot.start, 0, 0, 0);
  endDate.setHours(selectedSlot.end, 0, 0, 0);

  setFormData(prev => ({
    ...prev,
    startDate,
    endDate,
    customStartTime: `${selectedSlot.start}:00`,
    customEndTime: `${selectedSlot.end}:00`
  }));
};

const handleCustomTimeChange = (field, value) => {
  setFormData(prev => {
    const newData = { ...prev, [field]: value };
    
    if (field === 'customStartTime') {
      const startDate = new Date(prev.startDate);
      const [hours, minutes] = value.split(':');
      startDate.setHours(parseInt(hours), parseInt(minutes));
      newData.startDate = startDate;
    } else if (field === 'customEndTime') {
      const endDate = new Date(prev.endDate);
      const [hours, minutes] = value.split(':');
      endDate.setHours(parseInt(hours), parseInt(minutes));
      newData.endDate = endDate;
    }
    
    return newData;
  });
};

const formatTime = (time) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
};

const renderSuccessState = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    <Result
      status="success"
      title={
        <span className="text-2xl font-semibold text-green-600">
          Reservation Request Submitted Successfully!
        </span>
      }
      subTitle={
        <div className="text-gray-600 mt-2">
          <p>Your reservation request has been submitted and is pending approval.</p>
          <p>You will receive a notification once the status has been updated.</p>
        </div>
      }
      extra={[
        <Button
          key="print"
          type="default"
          icon={<PrinterOutlined />}
          onClick={handlePrintRequest}
          size="large"
          className="mr-4"
        >
          Print Request
        </Button>,
        <Button
          key="dashboard"
          type="primary"
          icon={<DashboardOutlined />}
          onClick={() => navigate('/dashboard')}
          size="large"
          className="mr-4 bg-blue-500 hover:bg-blue-600"
        >
          Go to Dashboard
        </Button>,
        <Button
          key="newRequest"
          type="default"
          icon={<PlusOutlined />}
          onClick={() => {
            resetForm();
            setCurrentStep(0);
          }}
          size="large"
          className="border-green-500 text-green-500 hover:text-green-600 hover:border-green-600"
        >
          New Request
        </Button>,
      ]}
    />
  </motion.div>
);

const TimeSlotVisualizer = ({ selectedTime, unavailableSlots, isChecking, conflicts }) => {
  return (
    <div className="mt-4 md:mt-6 p-3 md:p-4 bg-white rounded-lg shadow-sm">
      <h5 className="font-medium mb-3 text-sm md:text-base">Select Time Slot</h5>
      {isChecking ? (
        <div className="text-center py-4">
          <i className="pi pi-spin pi-spinner mr-2" />
          <span className="text-gray-600 text-sm">Checking availability...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {timeSlots.map(slot => {
            const isConflicting = conflicts.some(conflict => {
              const conflictStart = new Date(conflict.reservation_start_date);
              const conflictEnd = new Date(conflict.reservation_end_date);
              const conflictStartHour = conflictStart.getHours();
              const conflictEndHour = conflictEnd.getHours();
              
              const [slotStart, slotEnd] = slot.id.split('-').map(time => parseInt(time));
              
              return (conflictStartHour < slotEnd && conflictEndHour > slotStart);
            });
            const isSelected = selectedTime === slot.id;

            return (
              <button
                key={slot.id}
                onClick={() => !isConflicting && handleTimeSlotSelect(slot.id)}
                disabled={isConflicting}
                className={`
                  p-4 rounded-lg border transition-all duration-200 relative
                  ${isSelected ? 'border-green-500 bg-green-50 text-green-700' : ''}
                  ${isConflicting 
                    ? 'border-red-300 bg-red-50 text-red-700 cursor-not-allowed' 
                    : 'border-gray-200 hover:border-green-300 hover:bg-green-50'}
                `}
              >
                <div className="text-center">
                  <div className="font-medium">{slot.label}</div>
                  <div className="text-sm">{slot.time}</div>
                  {isConflicting && (
                    <div className="text-xs text-red-500 mt-1">
                      Unavailable
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const RecurringOptions = ({ onRecurringChange }) => (
  <div className="mt-6 p-4 bg-white rounded-lg shadow-sm">
    <h5 className="font-medium mb-3">Recurring Reservation</h5>
    <div className="space-y-2">
      <label className="flex items-center space-x-2">
        <input
          type="radio"
          name="recurring"
          value="none"
          onChange={(e) => onRecurringChange(e.target.value)}
          defaultChecked
        />
        <span>One-time</span>
      </label>
      <label className="flex items-center space-x-2">
        <input
          type="radio"
          name="recurring"
          value="weekly"
          onChange={(e) => onRecurringChange(e.target.value)}
        />
        <span>Weekly</span>
      </label>
      <label className="flex items-center space-x-2">
        <input
          type="radio"
          name="recurring"
          value="monthly"
          onChange={(e) => onRecurringChange(e.target.value)}
        />
        <span>Monthly</span>
      </label>
    </div>
  </div>
);

// Fix the renderCalendarSection
const renderCalendarSection = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <Card className="shadow-lg border-0">
      <div className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700">
              Start Date
            </label>
            <Calendar
              value={formData.startDate ? new Date(formData.startDate) : null}
              onChange={(e) => handleDateChange('start', e.value)}
              showTime={false}
              dateFormat="dd/mm/yy"
              minDate={new Date()}
              className="w-full"
              panelClassName="date-panel"
              inline
            />
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700">
              End Date
            </label>
            <Calendar
              value={formData.endDate ? new Date(formData.endDate) : null}
              onChange={(e) => handleDateChange('end', e.value)}
              showTime={false}
              dateFormat="dd/mm/yy"
              minDate={formData.startDate ? new Date(formData.startDate) : new Date()}
              className="w-full"
              panelClassName="date-panel"
              disabled={!formData.startDate}
              inline
            />
          </div>
        </div>

        <TimeSlotVisualizer
          selectedTime={selectedTime}
          unavailableSlots={unavailableSlots}
          isChecking={timeSlotAvailability.isChecking}
          conflicts={timeSlotAvailability.conflicts}
        />
      </div>
    </Card>
  </motion.div>
);

// Update your useEffect to fetch initial availability
useEffect(() => {
  if (formData.venue) {
    const today = new Date();
    fetchDateAvailability(today.getMonth(), today.getFullYear());
  }
}, [formData.venue]);

const fetchDateAvailability = async (month, year) => {
  setIsLoadingAvailability(true);
  try {
    const response = await axios.post(
      'http://localhost/coc/gsd/fetch_reserve.php',
      {
        operation: "fetchMonthlyAvailability",
        month: month + 1, // JavaScript months are 0-based
        year: year,
        venueId: formData.venue || null
      }
    );

    if (response.data.status === 'success') {
      const availability = {};
      response.data.data.forEach(day => {
        availability[day.date] = {
          status: day.slots_available === 0 ? 'full' : 
                 day.slots_available < day.total_slots ? 'partial' : 
                 'available',
          reservations: day.reservations || []
        };
      });
      setDateAvailability(availability);
    }
  } catch (error) {
    console.error('Error fetching availability:', error);
  } finally {
    setIsLoadingAvailability(false);
  }
};

// Add the isSameDay helper function
const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// Fix the ResourceTimeline component
const ResourceTimeline = ({ resource, bookings }) => {
  return (
    <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
      <h5 className="font-medium mb-3">{resource.name}</h5>
    </div>
  );
};

const checkTimeSlotAvailability = async (startDate, endDate) => {
  if (!startDate || !endDate || !formData.venue) return;
  
  setTimeSlotAvailability(prev => ({ ...prev, isChecking: true }));
  
  try {
    const formatDateForAPI = (date) => {
      const d = new Date(date);
      return d.toISOString().slice(0, 19).replace('T', ' ');
    };

    if (isSameDay(startDate, endDate)) {
      startDate.setHours(8, 0, 0);
      endDate.setHours(17, 0, 0);
    }

    const response = await axios.post(
      'http://localhost/coc/gsd/fetch_reserve.php',
      {
        operation: "checkTimeSlotAvailability",
        startDate: formatDateForAPI(startDate),
        endDate: formatDateForAPI(endDate),
        venueId: parseInt(formData.venue)
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data) {
      const conflicts = response.data.conflicts || [];
      const unavailableTimeSlots = new Set();

      conflicts.forEach(conflict => {
        const conflictStart = new Date(conflict.reservation_start_date);
        const conflictEnd = new Date(conflict.reservation_end_date);
        
        if (isSameDay(conflictStart, startDate)) {
          const conflictStartHour = conflictStart.getHours();
          const conflictEndHour = conflictEnd.getHours();
          
          // Check individual time slots
          if (conflictStartHour < 10 && conflictEndHour > 8) {
            unavailableTimeSlots.add('08:00-10:00');
          }
          
          if (conflictStartHour < 12 && conflictEndHour > 10) {
            unavailableTimeSlots.add('10:00-12:00');
          }
          
          if (conflictStartHour < 15 && conflictEndHour > 13) {
            unavailableTimeSlots.add('13:00-15:00');
          }
          
          if (conflictStartHour < 17 && conflictEndHour > 15) {
            unavailableTimeSlots.add('15:00-17:00');
          }

          // Check morning slot (8:00-12:00)
          if ((conflictStartHour < 12 && conflictEndHour > 8) &&
              (unavailableTimeSlots.has('08:00-10:00') && unavailableTimeSlots.has('10:00-12:00'))) {
            unavailableTimeSlots.add('08:00-12:00');
          }
          
          // Check afternoon slot (13:00-17:00)
          if ((conflictStartHour < 17 && conflictEndHour > 13) &&
              (unavailableTimeSlots.has('13:00-15:00') && unavailableTimeSlots.has('15:00-17:00'))) {
            unavailableTimeSlots.add('13:00-17:00');
          }
          
          // Check full day slot (8:00-17:00)
          if ((unavailableTimeSlots.has('08:00-12:00') && unavailableTimeSlots.has('13:00-17:00')) ||
              (conflictStartHour <= 8 && conflictEndHour >= 17)) {
            unavailableTimeSlots.add('08:00-17:00');
          }
        }
      });

      setUnavailableSlots([...unavailableTimeSlots]);
      setTimeSlotAvailability({
        isChecking: false,
        isAvailable: response.data.available,
        conflicts: conflicts.filter(conflict => 
          isSameDay(new Date(conflict.reservation_start_date), startDate)
        )
      });
    }

  } catch (error) {
    console.error('Error checking time slot:', error);
    setTimeSlotAvailability({
      isChecking: false,
      isAvailable: false,
      conflicts: []
    });
    toast.error('Unable to verify time slot availability.');
  }
};



// Update the step content rendering to change the order
const renderStepContent = () => {
  const steps = {
    0: renderResourceTypeSelection,
    1: () => resourceType === 'venue' ? renderVenues() : renderResources(),
    2: () => <ReservationCalendar 
                onDateSelect={(startDate, endDate) => {
                  setFormData(prev => ({
                    ...prev,
                    startDate: startDate,
                    endDate: endDate
                  }));
                }}
                selectedResource={{
                  type: formData.resourceType,
                  id: formData.resourceType === 'venue' ? formData.venue : selectedModels
                }}
              />,
    3: renderBasicInformation,
    4: renderReviewSection,
    5: renderSuccessState
  };

  return (
    <div className="min-h-[400px]">
      {steps[currentStep] && steps[currentStep]()}
    </div>
  );
};

// Separate date selection into its own component
const renderDateSelection = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    {renderCalendarSection()}
  </motion.div>
);

// Update handleDateChange function
const handleDateChange = (type, newDate) => {
  if (!newDate) return; // Guard against null values

  const value = newDate instanceof Date ? newDate : newDate.target?.value;
  
  if (type === 'start') {
    setFormData(prev => {
      const currentEndDate = prev.endDate ? new Date(prev.endDate) : null;
      const newStartDate = new Date(value);
      
      return {
        ...prev,
        startDate: newStartDate,
        // If end date exists and is before new start date, update it
        endDate: currentEndDate && currentEndDate < newStartDate ? newStartDate : currentEndDate
      };
    });

    // Only check availability if we have both dates
    if (value && formData.endDate) {
      checkTimeSlotAvailability(new Date(value), new Date(formData.endDate));
    }
  } else if (type === 'end') {
    setFormData(prev => ({
      ...prev,
      endDate: new Date(value)
    }));

    // Only check availability if we have both dates
    if (formData.startDate && value) {
      checkTimeSlotAvailability(new Date(formData.startDate), new Date(value));
    }
  }
};



const StepIndicator = ({ currentStep }) => {
  const steps = [
    { title: 'Select Type', icon: <TagOutlined /> },
    { title: 'Select Resource', icon: resourceType === 'venue' ? <BankOutlined /> : <CarOutlined /> },
    { title: 'Choose Date', icon: <CalendarOutlined /> },
    { title: 'Fill Details', icon: <FormOutlined /> },
    { title: 'Review', icon: <FileSearchOutlined /> },
    { title: 'Complete', icon: <CheckCircleOutlined /> }
  ];

  return (
    <Steps
      current={currentStep}
      className="custom-steps"
      responsive={false}
      size="small"
    >
      {steps.map((step, index) => (
        <Steps.Step
          key={index}
          title={<span className="hidden sm:inline">{step.title}</span>}
          icon={
            index < currentStep ? (
              <CheckCircleFilled className="text-green-500" />
            ) : (
              <div className={`
                ${currentStep === index ? 'text-blue-500' : 'text-gray-400'}
              `}>
                {step.icon}
              </div>
            )
          }
          status={
            index === currentStep 
              ? 'process'
              : index < currentStep 
                ? 'finish' 
                : 'wait'
          }
        />
      ))}
    </Steps>
  );
};

const handlePrintRequest = () => {
  // Find the selected driver using formData.driverName
  const selectedDriver = drivers.find(d => d.driver_id.toString() === formData.driverName?.toString());
  
  const printContent = document.createElement('div');
  printContent.innerHTML = `
    <div style="padding: 20px;">
      <h2 style="text-align: center; margin-bottom: 20px;">Reservation Request Details</h2>
      
      <div style="margin-bottom: 20px;">
        <h3>Basic Information</h3>
        <p><strong>Reservation Name:</strong> ${formData.reservationName}</p>
        <p><strong>Resource Type:</strong> ${formData.resourceType}</p>
        <p><strong>Date:</strong> ${format(new Date(formData.startDate), 'PPP')} - ${format(new Date(formData.endDate), 'PPP')}</p>
        <p><strong>Time:</strong> ${format(new Date(formData.startDate), 'p')} - ${format(new Date(formData.endDate), 'p')}</p>
      </div>

      ${formData.resourceType === 'venue' ? `
        // ...existing venue details code...
      ` : `
        <div style="margin-bottom: 20px;">
          <h3>Vehicle Details</h3>
          <p><strong>Purpose:</strong> ${formData.purpose}</p>
          <p><strong>Destination:</strong> ${formData.destination}</p>
          <p><strong>Driver:</strong> ${selectedDriver?.driver_full_name || 'Not specified'}</p>
          <p><strong>Passengers:</strong></p>
          <ul>
            ${formData.passengers.map(p => `<li>${p.name}</li>`).join('')}
          </ul>
        </div>
      `}
    </div>
  `;

  // ...rest of the print function code...
};

// Add new state for drivers
const [drivers, setDrivers] = useState([]);
const [showPassengerModal, setShowPassengerModal] = useState(false);
const [newPassenger, setNewPassenger] = useState('');

// Add fetchDrivers function
const fetchDrivers = async (startDate, endDate) => {
  setIsLoadingDrivers(true);

  try {
    const response = await axios.post('http://localhost/coc/gsd/user.php', {
      operation: 'fetchDriver',
      startDateTime: format(startDate, 'yyyy-MM-dd HH:mm:ss'),
      endDateTime: format(endDate, 'yyyy-MM-dd HH:mm:ss')
    });

    if (response.data.status === 'success') {
      const driversData = response.data.data.map(driver => ({
        driver_id: driver.users_id,
        driver_full_name: `${driver.users_fname} ${driver.users_mname} ${driver.users_lname}`,
        departments_name: driver.departments_name
      }));
      setAvailableDrivers(driversData);
    } else {
      setAvailableDrivers([]);
    }

  } catch (error) {
    console.error('Error fetching drivers:', error);
    setAvailableDrivers([]);
    toast.error('Failed to fetch available drivers');
  } finally {
    setIsLoadingDrivers(false);
  }
};

// Add useEffect to fetch drivers
useEffect(() => {
  if (formData.startDate && formData.endDate && formData.resourceType === 'vehicle') {
    fetchDrivers(formData.startDate, formData.endDate);
  }
}, [formData.startDate, formData.endDate, formData.resourceType]); // Add selectedDriverDept

// Add PassengerModal component
const PassengerModal = ({ visible, onHide }) => {
  const [localPassengerName, setLocalPassengerName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (visible) {
      // Focus input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible]);

  const handleSubmit = () => {
    if (localPassengerName.trim()) {
      handleAddPassenger(localPassengerName.trim());
      setLocalPassengerName(''); // Clear input
      inputRef.current?.focus(); // Refocus input for next passenger
      // Removed onHide() to keep modal open
    }
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={
        <div className="flex items-center gap-3 px-4 py-2">
          <UserOutlined className="text-blue-500 text-xl" />
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Add Passengers</h3>
            <p className="text-sm text-gray-500">Enter passenger details below</p>
          </div>
        </div>
      }
      modal
      className="w-[90vw] md:w-[500px]"
      closeOnEscape
      dismissableMask
      footer={
        <div className="flex justify-end gap-2">
          <Button
            label="Done"
            icon="pi pi-check"
            onClick={onHide}
            className="p-button-text"
          />
          <Button
            label="Add Passenger"
            icon="pi pi-plus"
            onClick={handleSubmit}
            className="p-button-primary"
            disabled={!localPassengerName.trim()}
          />
        </div>
      }
    >
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Passenger Name <span className="text-red-500">*</span>
          </label>
          <div className="relative"></div>
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserOutlined className="text-gray-400" />
            </span>
            <InputText
              ref={inputRef}
              value={localPassengerName}
              onChange={(e) => setLocalPassengerName(e.target.value)}
              placeholder="Enter passenger name"
              className="w-full pl-10"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit();
                }
              }}
            />
          </div>
        </div>

        {/* Show current passengers list if any */}
        {formData.passengers.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Current Passengers ({formData.passengers.length})
            </div>
            <div className="max-h-48 overflow-y-auto">
              <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
                {formData.passengers.map((passenger, index) => (
                  <div 
                    key={passenger.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">{index + 1}.</span>
                      <UserOutlined className="text-gray-400" />
                      <span className="font-medium text-gray-700">{passenger.name}</span>
                    </div>
                    <Button
                      icon="pi pi-trash"
                      onClick={() => handleRemovePassenger(passenger.id)}
                      className="p-button-text p-button-danger p-button-sm"
                      tooltip="Remove passenger"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick tips */}
        <div className="mt-4 bg-blue-50 text-blue-700 p-3 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <InfoCircleOutlined />
            <span className="font-medium">Quick Tips:</span>
          </div>
          <ul className="list-disc ml-5 mt-1 text-blue-600">
            <li>Press Enter to quickly add multiple passengers</li>
            <li>Click the trash icon to remove a passenger</li>
            <li>Click Done when finished adding all passengers</li>
          </ul>
        </div>

    </Dialog>
  );
};

const EquipmentSelectionModal = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [localEquipmentQuantities, setLocalEquipmentQuantities] = useState({});

  // Track viewport size
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 375);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 375);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (showEquipmentModal) {
      setLocalEquipmentQuantities({ ...equipmentQuantities });
    }
  }, [showEquipmentModal]);

  const categories = ['all', ...new Set(equipment.map(item => item.equipment_category))];

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.equipment_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.equipment_category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleLocalQuantityChange = (equipId, value) => {
    if (value === undefined || value === null || value < 0) return;
    
    const equip = equipment.find(e => e.equipment_id === equipId);
    if (!equip) return;

    const availableQty = getAvailableQuantity(equip);
    if (value > availableQty) {
      toast.error(`Maximum available quantity is ${availableQty}`);
      return;
    }

    setLocalEquipmentQuantities(prev => ({
      ...prev,
      [equipId]: value
    }));
  };

  const handleConfirm = () => {
    setEquipmentQuantities(localEquipmentQuantities);
    const newEquipment = {};
    Object.entries(localEquipmentQuantities).forEach(([equipId, quantity]) => {
      if (quantity > 0) {
        newEquipment[equipId.toString()] = quantity;
      }
    });
    setSelectedVenueEquipment(newEquipment);
    setShowEquipmentModal(false);
  };

  const getAvailableQuantity = (item) => item.available_quantity || 0;

  // Responsive card rendering
  const renderEquipmentCard = (item) => (
    <Card
      key={item.equipment_id}
      className={`
        transition-all duration-300 hover:shadow-md
        ${viewMode === 'list' ? 'flex items-center' : ''}
        ${equipmentQuantities[item.equipment_id] > 0 ? 'ring-2 ring-blue-500' : ''}
        ${isMobile ? 'p-2' : 'p-4'}
      `}
      bodyStyle={viewMode === 'list' ? { padding: isMobile ? '8px' : '16px', width: '100%' } : {}}
    >
      <div className={viewMode === 'list' ? 'flex gap-2 w-full' : ''}>
        {/* Image */}
        <div className={viewMode === 'list' ? (isMobile ? 'w-20' : 'w-32') : ''}>
          <img
            src={`http://localhost/coc/gsd/${item.equipment_pic}`}
            alt={item.equipment_name}
            className={`
              object-cover rounded-lg
              ${viewMode === 'grid' 
                ? isMobile ? 'h-24 w-full' : 'h-32 w-full'
                : isMobile ? 'h-20 w-20' : 'h-32 w-32'}
            `}
            onError={(e) => {
              e.target.src = '/default-equipment.jpg';
              e.target.onerror = null;
            }}
          />
        </div>

        {/* Content */}
        <div className={`
          ${viewMode === 'list' ? 'flex-grow flex justify-between items-center' : 'mt-2'}
          ${isMobile ? 'space-y-1' : 'space-y-2'}
        `}>
          <div>
            <h4 className={`font-medium ${isMobile ? 'text-sm' : 'text-base'} text-gray-900 truncate`}>
              {item.equipment_name}
            </h4>
            {!isMobile && (
              <p className="text-xs text-gray-500">{item.equipment_category}</p>
            )}
            <Tag 
              color={item.status_availability_name === 'available' ? 'green' : 'red'}
              className={`${isMobile ? 'text-xs' : 'text-sm'}`}
            >
              {item.status_availability_name}
            </Tag>
            <div className={isMobile ? 'text-xs' : 'text-sm'}>
              Available: {getAvailableQuantity(item)}
            </div>
          </div>

          {/* Quantity Input */}
          <div className={viewMode === 'list' ? 'ml-2' : 'mt-2'}>
            <InputNumber
              min={0}
              max={getAvailableQuantity(item)}
              value={localEquipmentQuantities[item.equipment_id] || 0}
              onChange={(value) => handleLocalQuantityChange(item.equipment_id, value)}
              disabled={getAvailableQuantity(item) === 0}
              className={`w-full ${isMobile ? 'mini-input' : ''}`}
              size={isMobile ? 'small' : 'middle'}
              controls={!isMobile}
            />
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <Modal
      open={showEquipmentModal}
      onCancel={() => setShowEquipmentModal(false)}
      title={
        <div className="flex items-center gap-2">
          <FaTools className={isMobile ? 'text-sm' : 'text-base'} />
          <span className={`font-semibold ${isMobile ? 'text-sm' : 'text-base'}`}>
            Equipment Selection
          </span>
        </div>
      }
      width={isMobile ? '100%' : 1000}
      footer={[
        <Button 
          key="cancel" 
          onClick={() => setShowEquipmentModal(false)}
          size={isMobile ? 'small' : 'middle'}
        >
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleConfirm}
          icon={<FaCheck />}
          size={isMobile ? 'small' : 'middle'}
        >
          Confirm
        </Button>
      ]}
      className="equipment-modal"
    >
      {/* Search and Filter Controls */}
      <div className={`${isMobile ? 'space-y-2' : 'space-y-4'} mb-4`}>
        <Input.Search
          placeholder="Search equipment..."
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
          size={isMobile ? 'small' : 'middle'}
          allowClear
        />
        <div className="flex items-center gap-2 justify-between">
          <Select
            value={categoryFilter}
            onChange={setCategoryFilter}
            className={isMobile ? 'w-32' : 'w-48'}
            size={isMobile ? 'small' : 'middle'}
            placeholder="Category"
          >
            {categories.map(category => (
              <Select.Option key={category} value={category}>
                {category === 'all' ? 'All' : category}
              </Select.Option>
            ))}
          </Select>
          <Radio.Group
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            size={isMobile ? 'small' : 'middle'}
          >
            <Radio.Button value="grid"><BsFillGridFill /></Radio.Button>
            <Radio.Button value="list"><BsList /></Radio.Button>
          </Radio.Group>
        </div>
      </div>

      {/* Equipment List */}
      <div className={`
        ${viewMode === 'grid' 
          ? 'grid grid-cols-2 gap-2'
          : 'space-y-2'}
      `}>
        {filteredEquipment.map(renderEquipmentCard)}
      </div>

      {filteredEquipment.length === 0 && (
        <Empty
          description={<span className={isMobile ? 'text-xs' : 'text-sm'}>No equipment found</span>}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          className="my-4"
          imageStyle={{ width: isMobile ? 40 : 60 }}
        />
      )}
    </Modal>
  );
};

// Add this with other function declarations
const renderDriverDropdown = () => {
  return (
    <Form.Item
      label={<span className="text-sm">Select Driver <span className="text-red-500">*</span></span>}
      required
    >
      <div className="space-y-3">
        {isLoadingDrivers ? (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Spin size="small" />
            <span className="text-gray-500">Loading available drivers...</span>
          </div>
        ) : (
          <>
            <Select
              value={formData.driverName}
              onChange={(value) => handleInputChange({
                target: { name: 'driverName', value }
              })}
              placeholder="Select a driver"
              className="w-full"
              disabled={availableDrivers.length === 0}
              showSearch
              filterOption={(input, option) =>
                (option?.title ?? '').toLowerCase().includes(input.toLowerCase())
              }
              notFoundContent={
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No drivers available for the selected time slot."
                />
              }
            >
              {availableDrivers.map(driver => (
                <Select.Option 
                  key={driver.driver_id} 
                  value={driver.driver_id}
                  title={driver.driver_full_name}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserOutlined className="text-gray-400" />
                      <span>{driver.driver_full_name}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {driver.departments_name}
                    </span>
                  </div>
                </Select.Option>
              ))}
            </Select>

            {formData.driverName && (
              <Card className="bg-blue-50 border-blue-200">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <UserOutlined className="text-xl text-blue-500" />
                  </div>
                  <div>
                    <div className="font-medium text-blue-700">
                      {availableDrivers.find(d => d.driver_id === formData.driverName)?.driver_full_name}
                    </div>
                    <div className="text-sm text-blue-600">
                      {availableDrivers.find(d => d.driver_id === formData.driverName)?.departments_name}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </Form.Item>
  );
};


return (
  <div className="min-h-screen bg-gradient-to-br">
    {/* Sidebar handling */}
    <div className="hidden md:block">
      {userLevel === '100' && <Sidebar />}
    </div>

    {/* Enhanced main content area */}
    <div className={`w-full p-6 transition-all duration-300 ${isMobile ? 'px-3 py-4' : 'p-6'}`}>
      <div className={`mx-auto ${isMobile ? 'max-w-full' : 'max-w-6xl'}`}>
        {/* Enhanced header section with back button */}
        <div className={`bg-white rounded-2xl shadow-sm p-6 border border-gray-100 ${isMobile ? 'mb-3' : 'mb-6'}`}>
          <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'}`}>
            <Button
              onClick={() => navigate('/dashboard')}
              className="p-button-text flex items-center gap-2 hover:bg-blue-50 transition-colors"
              icon={<i className="pi pi-arrow-left text-blue-500" />}
            >
              <span className="font-medium text-blue-600">Back to Dashboard</span>
            </Button>
          </div>
          <h1 className={`font-bold text-gray-900 ${isMobile ? 'text-xl' : 'text-3xl'}`}>
            Create Reservation
          </h1>
          <p className="text-gray-600">
            Complete the steps below to make your reservation
          </p>
        </div>

        {/* Enhanced steps indicator */}
        <div className={`bg-white rounded-2xl shadow-sm p-6 border border-gray-100 ${isMobile ? 'mb-3 p-2' : 'mb-6 p-4'}`}>
          <StepIndicator 
            currentStep={currentStep} 
            resourceType={formData.resourceType} 
            isMobile={isMobile}
          />
        </div>

        {/* Main content card with enhanced styling */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Content header */}
          <div className={`px-6 py-4 bg-gray-50 border-b border-gray-100 ${isMobile ? 'p-3' : 'px-6 py-4'}`}>
            <h2 className={`text-xl font-semibold text-gray-800 ${isMobile ? 'text-lg' : 'text-xl'}`}>
              {currentStep === 0 && "Select Resource Type"}
              {currentStep === 1 && `Select ${formData.resourceType === 'venue' ? 'Venue' : 'Vehicle'}`}
              {currentStep === 2 && "Choose Date & Time"}
              {currentStep === 3 && "Enter Details"}
              {currentStep === 4 && "Review Reservation"}
              {currentStep === 5 && "Reservation Complete"}
            </h2>
          </div>

          {/* Main content area with enhanced padding */}
          <div className={isMobile ? 'p-3' : 'p-6'}>
            <div className={`mx-auto ${isMobile ? 'max-w-full' : 'max-w-4xl'}`}>
              {renderStepContent()}
            </div>
          </div>

          {/* Enhanced footer with better positioned buttons */}
          {currentStep !== 5 && (
            <div className={`px-6 py-4 bg-gray-50 border-t border-gray-100 ${isMobile ? 'p-3' : 'px-6 py-4'}`}>
              <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'}`}>
               
                
                <div className={`flex gap-2 ${isMobile ? 'w-full' : ''}`}>
                  <AntButton
                    type="default"
                    icon={<i className="pi pi-arrow-left" />}
                    onClick={handleBack}
                    size="large"
                    className={`p-button-outlined ${isMobile ? 'w-full' : ''}`}
                    disabled={currentStep === 0}
                  >
                    {isMobile ? 'Back' : 'Previous'}
                  </AntButton>
                  {currentStep === 4 ? (
                    <AntButton
                      type="primary"
                      icon={loading ? <Spin className="mr-2" /> : <CheckCircleOutlined />}
                      onClick={handleAddReservation}
                      size="large"
                      className={`${isMobile ? 'w-full' : ''} p-button-success`}
                      disabled={loading} // Disable button when loading
                    >
                      {loading ? 'Submitting...' : 'Submit'}
                  </AntButton>
                  ) : (
                    <AntButton
                      type="primary"
                      icon={<i className="pi pi-arrow-right" />}
                      onClick={handleNext}
                      size="large"
                      className={`${isMobile ? 'w-full' : ''} p-button-primary`}
                    >
                      Next
                    </AntButton>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Enhanced toast styling */}
    <Toaster 
      position="top-right"
      toastOptions={{
        className: 'text-sm',
        duration: 3000,
        style: {
          background: '#333',
          color: '#fff',
          borderRadius: '8px',
        },
      }}
    />

    {/* Enhanced modal styling */}
    <PassengerModal
      visible={showPassengerModal}
      onHide={() => {
        setShowPassengerModal(false);
        setNewPassenger('');
      }}
    />
    <EquipmentSelectionModal />
  </div>
);
};

// Update the StepIndicator component with enhanced styling
const StepIndicator = ({ currentStep, resourceType, isMobile }) => {
  const steps = [
    { title: 'Select Type', icon: <TagOutlined className="text-lg" /> },
    { 
      title: 'Select Resource', 
      icon: resourceType === 'venue' 
        ? <BankOutlined className="text-lg" /> 
        : <CarOutlined className="text-lg" /> 
    },
    { title: 'Schedule', icon: <CalendarOutlined className="text-lg" /> },
    { title: 'Details', icon: <FormOutlined className="text-lg" /> },
    { title: 'Review', icon: <FileSearchOutlined className="text-lg" /> },
    { title: 'Complete', icon: <CheckCircleOutlined className="text-lg" /> }
  ];

  return (
    <Steps
      current={currentStep}
      className={`custom-steps site-navigation-steps ${isMobile ? 'mobile-steps' : ''}`}
      responsive={false}
      size={isMobile ? 'small' : 'default'}
      // Only show current and adjacent steps on mobile
      progressDot={isMobile}
    >
      {steps.map((step, index) => (
        <Steps.Step
          key={index}
          title={!isMobile && <span>{step.title}</span>}
          icon={
            index < currentStep ? (
              <CheckCircleFilled className="text-green-500 text-lg" />
            ) : (
              <div className={`
                transition-colors duration-200
                ${currentStep === index ? 'text-blue-500' : 'text-gray-400'}
              `}>
                {step.icon}
              </div>
            )
          }
          status={
            index === currentStep 
              ? 'process'
              : index < currentStep 
                ? 'finish' 
                : 'wait'
          }
        />
      ))}
    </Steps>
  );
};



export default AddReservation;



