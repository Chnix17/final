import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTrash, FaPlus, FaClock, FaCalendar, FaUser, FaEye, FaEdit } from 'react-icons/fa';
import { FiCalendar, FiList, FiHelpCircle, FiBell, FiSettings, FiUser, FiLogOut } from 'react-icons/fi';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReservationCalendar from '../components/ReservationCalendar';


// Add this animation variants object before the component
const navButtonVariants = {
    hover: {
        scale: 1.05,
        backgroundColor: "rgba(0, 0, 0, 0.05)",
    },
    tap: {
        scale: 0.95
    }
};

const ViewReserve = () => {
    
    const navigate = useNavigate();
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [reservations, setReservations] = useState([]);
    const [currentReservation, setCurrentReservation] = useState({
        name: '',
        date: '',
        time: '',
        guests: 1,
        notes: '',
        type: 'dinner',
        status: 'pending'
    });
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [reservationToCancel, setReservationToCancel] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState(null);
    // Add these new state variables with the other useState declarations
    const [notifications, setNotifications] = useState(0);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const user_level_id = localStorage.getItem('user_level_id');

    const statusColors = {
        confirmed: 'bg-green-100 text-green-800',
        pending: 'bg-yellow-100 text-yellow-800',
        cancelled: 'bg-red-100 text-red-800'
    };

    const handleCancelReservation = (reservation) => {
        setReservationToCancel(reservation);
        setShowCancelModal(true);
    };

    const confirmCancelReservation = async () => {
        try {
            const formData = new URLSearchParams();
            formData.append('approval_id', reservationToCancel.id);  // Changed from reservation_id to approval_id
            formData.append('operation', 'cancelReservation');

            const response = await fetch('http://localhost/coc/gsd/fetch_reserve.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString()
            });

            const result = await response.json();

            if (result.status === 'success') {
                // Update the local state
                setReservations(prevReservations =>
                    prevReservations.map(res =>
                        res.id === reservationToCancel.id
                            ? { ...res, status: 'cancelled' }
                            : res
                    )
                );
                toast.success('Reservation cancelled successfully!');
            } else {
                toast.error(result.message || 'Failed to cancel reservation');
            }
        } catch (error) {
            console.error('Error cancelling reservation:', error);
            toast.error('Failed to cancel reservation');
        } finally {
            setShowCancelModal(false);
            setReservationToCancel(null);
        }
    };
    useEffect(() => {
        if (user_level_id !== '3' ) {
            localStorage.clear();
            navigate('/gsd');
        }
      }, [user_level_id, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCurrentReservation({ ...currentReservation, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (currentReservation.id) {
            // Update existing reservation
            const updatedReservations = reservations.map(r => 
                r.id === currentReservation.id ? { ...r, ...currentReservation } : r
            );
            setReservations(updatedReservations);
        } else {
            // Create new reservation
            const newReservation = {
                ...currentReservation,
                id: Date.now(), // Temporary ID, should be replaced with server-generated ID
                status: 'pending'
            };
            setReservations([...reservations, newReservation]);
        }
        setEditModalOpen(false);
    };

    const fetchReservations = async () => {
        try {
            const userId = localStorage.getItem('user_id'); // Get user_id from localStorage
            
            // Create the request body
            const requestBody = {
                operation: 'getUserReservations',
                userId: parseInt(userId)
            };

            const response = await fetch('http://localhost/coc/gsd/user1.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                const transformedReservations = result.data.map(approval => ({
                    id: approval.approval_id,
                    name: approval.venue_form_name || approval.vehicle_form_name || 'Unnamed Reservation',
                    date: approval.approval_created_at.split(' ')[0],
                    time: approval.approval_created_at.split(' ')[1],
                    status: approval.approval_status.toLowerCase(),
                    details: approval.venue_details || approval.vehicle_details || 'No details available',
                    type: approval.approval_form_venue_id ? 'venue' : 'vehicle',
                    reservationStatus: approval.reservation_status || approval.approval_status,
                    // Add additional fields that might be useful
                    formVenueId: approval.approval_form_venue_id,
                    formVehicleId: approval.approval_form_vehicle_id,
                    statusId: approval.approval_status_id,
                    reservationStatusId: approval.reservation_status_status_reservation_id
                }));
                
                console.log('Transformed reservations:', transformedReservations); // Debug log
                setReservations(transformedReservations);
            } else {
                console.error('Failed to fetch reservations:', result.message);
                toast.error('Failed to fetch reservations');
            }
        } catch (error) {
            console.error('Error fetching reservations:', error);
            toast.error('Error fetching reservations');
        }
    };

    // Make sure to call fetchReservations when the component mounts
    useEffect(() => {
        fetchReservations();
        // Set up periodic refresh (optional)
        const interval = setInterval(fetchReservations, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const filteredReservations = reservations.filter(reservation => 
        activeFilter === 'all' ? true : reservation.status === activeFilter
    );

    const handleViewReservation = async (reservation) => {
        console.log('View button clicked for reservation:', reservation);

        try {
            const requestBody = {
                operation: "getUserReservationDetailsById",
                approvalId: reservation.id
            };
            
            console.log('Sending request with body:', requestBody);

            const response = await fetch('http://localhost/coc/gsd/user1.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            const result = await response.json();
            console.log('API Response:', result);

            if (result.status === 'success' && result.data.length > 0) {
                const details = result.data[0];
                console.log('Raw details:', details);

                // Transform the data to match the API response structure
                const processedReservation = {
                    id: details.approval_id,
                    approvalCreatedAt: details.approval_created_at,
                    department: details.departments_name,
                    vehicleInfo: details.approval_form_vehicle_id ? {
                        license: details.vehicle_license,
                        model: details.vehicle_model,
                        make: details.vehicle_make,
                        category: details.vehicle_category,
                        formName: details.vehicle_form_name,
                        purpose: details.vehicle_form_purpose,
                        destination: details.vehicle_form_destination,
                        startDate: details.vehicle_form_start_date,
                        endDate: details.vehicle_form_end_date,
                        userFullName: details.vehicle_form_user_full_name,
                        passengerNames: details.passenger_names?.split(',') || [],
                        passengerIds: details.passenger_ids?.split(',') || []
                    } : null,
                    venueInfo: details.approval_form_venue_id ? {
                        name: details.venue_name,
                        formName: details.venue_form_name,
                        eventTitle: details.venue_form_event_title,
                        description: details.venue_form_description,
                        participants: details.venue_participants,
                        startDate: details.venue_form_start_date,
                        endDate: details.venue_form_end_date,
                        userFullName: details.venue_form_user_full_name
                    } : null,
                    equipmentInfo: details.equipment_name ? {
                        name: details.equipment_name,
                        quantity: details.reservation_equipment_quantity
                    } : null,
                    status: {
                        approvalStatus: details.status_approval_name,
                        requestStatus: details.status_request,
                        currentReservationStatus: details.current_reservation_status
                    }
                };

                console.log('Processed reservation data:', processedReservation);
                setSelectedReservation(processedReservation);
                setShowViewModal(true);
            } else {
                console.error('Failed to fetch details:', result);
                toast.error('Failed to fetch reservation details');
            }
        } catch (error) {
            console.error('Error in handleViewReservation:', error);
            toast.error('Error fetching reservation details');
        }
    };

    const handleNavigation = () => {
        navigate('/dashboard'); // Navigate to /dashboard on click
      };

    return (
        <>
            {/* Add ToastContainer at the root level */}
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
            
            {/* Header Component */}
            <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white backdrop-blur-sm bg-opacity-80 shadow-lg sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Left side - Logo and GSD Reservation title */}
            <div className="flex items-center space-x-4" onClick={handleNavigation}>
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

            {/* Right side navigation */}
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

              <motion.button 
                variants={navButtonVariants}
                whileHover="hover"
                whileTap="tap"
                className="flex items-center space-x-2 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
                onClick={() => navigate('/support')}
              >
                <FiHelpCircle className="w-5 h-5" />
                <span>Support</span>
              </motion.button>

              {/* Notification Bell */}
              <motion.div className="relative"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <button className="p-2 text-gray-700 hover:text-green-600 transition-colors">
                  <FiBell className="w-6 h-6" />
                  {notifications > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notifications}
                    </span>
                  )}
                </button>
              </motion.div>

              {/* Settings */}
              

              {/* Profile */}
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-gray-700 hover:text-green-600 transition-colors"
              >
                <FiUser className="w-6 h-6" />
              </motion.button>

              {/* Logout */}
              <motion.button
                variants={navButtonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => navigate('/gsd')}
                className="flex items-center space-x-2 text-red-600 px-4 py-2 rounded-lg text-sm font-medium"
              >
                <FiLogOut className="w-5 h-5" />
                <span>Logout</span>
              </motion.button>
            </nav>
          </div>
        </div>
      </motion.header>

            {/* Main Content */}
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Enhance the main content styles */}
                    

                    <div className="flex gap-4 mb-6">
                        {['all', 'confirmed', 'pending', 'cancelled'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-4 py-2 rounded-full capitalize ${
                                    activeFilter === filter
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-100'
                                } transition duration-300 ease-in-out shadow-sm`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>

                    <div className="grid gap-6">
                        {filteredReservations.map((reservation) => (
                            <motion.div 
                                key={reservation.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-semibold text-gray-800">
                                            {reservation.name}
                                            <span className="ml-2 text-sm text-gray-500 capitalize">({reservation.type})</span>
                                        </h3>
                                        <div className="flex gap-4 text-gray-600">
                                            <span className="flex items-center gap-2">
                                                <FaCalendar className="text-blue-500" />
                                                {format(new Date(reservation.date), 'MMM dd, yyyy')}
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <FaClock className="text-blue-500" />
                                                {reservation.time}
                                            </span>
                                        </div>
                                        <p className="text-gray-500 text-sm">
                                            {reservation.details}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[reservation.status]}`}>
                                            {reservation.reservationStatus}
                                        </span>
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                onClick={() => handleViewReservation(reservation)}
                                                className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-300"
                                            >
                                                <FaEye size={16} />
                                                <span className="text-sm">View</span>
                                            </button>
                                            {reservation.status !== 'cancelled' && (
                                                <button
                                                    onClick={() => handleCancelReservation(reservation)}
                                                    className="flex items-center gap-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded-full transition-all duration-300"
                                                >
                                                    <FaTrash size={16} />
                                                    <span className="text-sm">Cancel Reservation</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* View Reservation Modal */}
                    {showViewModal && selectedReservation && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-800">Reservation Details</h2>
                                    <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                                </div>

                                <div className="space-y-6">
                                    {/* Basic Info */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Department</h3>
                                            <p className="mt-1">{selectedReservation.department}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">GSD Action Status:</h3>
                                            <p className="mt-1">{selectedReservation.status.currentReservationStatus}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Dean Secretary Action Status:</h3>
                                            <p className="mt-1">{selectedReservation.status.approvalStatus}</p>
                                        </div>
                                    </div>

                                    {/* Venue Information - Updated Section */}
                                    {selectedReservation.venueInfo && (
                                        <div className="border-t pt-4">
                                            <h3 className="text-lg font-semibold mb-3">Venue Details</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-500">Venue Name</h4>
                                                    <p className="mt-1">{selectedReservation.venueInfo.name}</p>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-500">Event Title</h4>
                                                    <p className="mt-1">{selectedReservation.venueInfo.eventTitle}</p>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-500">Description</h4>
                                                    <p className="mt-1">{selectedReservation.venueInfo.description}</p>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-500">Number of Participants</h4>
                                                    <p className="mt-1">{selectedReservation.venueInfo.participants}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <h4 className="text-sm font-medium text-gray-500">Duration</h4>
                                                    <p className="mt-1">
                                                        From: {format(new Date(selectedReservation.venueInfo.startDate), 'MMM dd, yyyy HH:mm')}
                                                        <br />
                                                        To: {format(new Date(selectedReservation.venueInfo.endDate), 'MMM dd, yyyy HH:mm')}
                                                    </p>
                                                </div>
                                                {selectedReservation.equipmentInfo && (
                                                    <div className="col-span-2">
                                                        <h4 className="text-sm font-medium text-gray-500">Equipment</h4>
                                                        <p className="mt-1">
                                                            {selectedReservation.equipmentInfo.name} 
                                                            (Quantity: {selectedReservation.equipmentInfo.quantity})
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Keep existing vehicle and equipment sections */}
                                    {selectedReservation.vehicleInfo && (
                                        <div className="border-t pt-4">
                                            <h3 className="text-lg font-semibold mb-3">Vehicle Details</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-500">Vehicle Info</h4>
                                                    <p className="mt-1">{`${selectedReservation.vehicleInfo.make} ${selectedReservation.vehicleInfo.model} (${selectedReservation.vehicleInfo.license})`}</p>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-500">Purpose</h4>
                                                    <p className="mt-1">{selectedReservation.vehicleInfo.purpose}</p>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-500">Destination</h4>
                                                    <p className="mt-1">{selectedReservation.vehicleInfo.destination}</p>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-500">Duration</h4>
                                                    <p className="mt-1">{`${format(new Date(selectedReservation.vehicleInfo.startDate), 'MMM dd, yyyy HH:mm')} - ${format(new Date(selectedReservation.vehicleInfo.endDate), 'MMM dd, yyyy HH:mm')}`}</p>
                                                </div>
                                            </div>
                                            {selectedReservation.vehicleInfo.passengerNames.length > 0 && (
                                                <div className="mt-3">
                                                    <h4 className="text-sm font-medium text-gray-500">Passengers</h4>
                                                    <ul className="mt-1 list-disc list-inside">
                                                        {selectedReservation.vehicleInfo.passengerNames.map((name, index) => (
                                                            <li key={index}>{name}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Equipment Information */}
                                    {selectedReservation.equipmentInfo && (
                                        <div className="border-t pt-4">
                                            <h3 className="text-lg font-semibold mb-3">Equipment Details</h3>
                                            <p>{`${selectedReservation.equipmentInfo.name} (Qty: ${selectedReservation.equipmentInfo.quantity})`}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 flex justify-end">
                                    <button
                                        onClick={() => setShowViewModal(false)}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* Cancel Reservation Modal */}
                    {showCancelModal && reservationToCancel && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                            <motion.div 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white rounded-2xl p-8 w-full max-w-md transform transition-all duration-300 ease-in-out"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold">Confirm Cancellation</h2>
                                    <button onClick={() => setShowCancelModal(false)} className="text-gray-400 hover:text-gray-600">
                                        &times;
                                    </button>
                                </div>
                                <p>Are you sure you want to cancel the reservation "{reservationToCancel.name}"?</p>
                                <div className="flex justify-end mt-6 gap-4">
                                    <button 
                                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                                        onClick={() => setShowCancelModal(false)}
                                    >
                                        No, Keep Reservation
                                    </button>
                                    <button 
                                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                                        onClick={confirmCancelReservation}
                                    >
                                        Yes, Cancel Reservation
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </div>
                
            </div>
        </>
    );
};

export default ViewReserve;
