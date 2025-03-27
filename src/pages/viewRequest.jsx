import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import {Spinner } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { toast } from 'sonner';
import { FaCheck, FaTimes, FaCar, FaBuilding, FaTools, FaFilter, FaSearch, FaCalendarAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
  DialogDescription,
  DialogContainer,
} from '../components/core/dialog';
import { Loader2 } from 'lucide-react';
import { Modal, Tabs, Badge, Descriptions, Space, Tag, Timeline, Button, Alert, Radio, Table } from 'antd';
import { 
    CarOutlined, 
    BuildOutlined, 
    ToolOutlined,
    UserOutlined,
    CalendarOutlined,
    EnvironmentOutlined,
    TeamOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    LoadingOutlined,
    AppstoreOutlined, 
    UnorderedListOutlined,
    EyeOutlined,
    HistoryOutlined,
    ClockCircleOutlined,  // Add this import
} from '@ant-design/icons';

const ReservationRequests = () => {
    const [reservations, setReservations] = useState([]);
    const [userLevel, setUserLevel] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
    const [currentRequest, setCurrentRequest] = useState(null);
    const [reservationDetails, setReservationDetails] = useState(null);
    const [filter, setFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState([null, null]);
    const [startDate, endDate] = dateRange;
    const [isAccepting, setIsAccepting] = useState(false);
    const [isDeclining, setIsDeclining] = useState(false);
    const [activeTab, setActiveTab] = useState('1');
    const [viewMode, setViewMode] = useState('grid'); // Add this new state
    const navigate = useNavigate();
    const user_level_id = localStorage.getItem('user_level_id');

    const user_id = localStorage.getItem('user_id');

    useEffect(() => {
        if (user_level_id !== '1' && user_level_id !== '2' && user_level_id !== '4') {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [user_level_id, navigate]);

    const fetchReservations = async () => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost/coc/gsd/process_reservation.php', {
                operation: 'fetchRequestReservation'
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data?.status === 'success') {
                setReservations(response.data.data);
            } else {
                toast.error('No pending reservations found.');
            }
        } catch (error) {
            toast.error('Error fetching reservations. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const fetchReservationDetails = async (reservationId) => {
        try {
            const response = await axios.post('http://localhost/coc/gsd/process_reservation.php', 
                {
                    operation: 'fetchRequestById',  
                    reservation_id: reservationId  
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data?.status === 'success' && response.data.data) {
                // Set the details directly from response
                const details = response.data.data;
                setReservationDetails(details);
                setCurrentRequest({
                    reservation_id: details.reservation_id,
                    isUnderReview: details.active === "0"
                });
                setIsDetailModalOpen(true);
            } else {
                toast.error('Failed to fetch reservation details');
            }
        } catch (error) {
            console.error('API Error:', error);
            toast.error('Failed to fetch reservation details. Please try again.');
        }
    };

    useEffect(() => {
        fetchReservations();
    }, []);

    const handleAccept = async () => {
        setIsAccepting(true);
        try {
            const response = await axios.post('http://localhost/coc/gsd/process_reservation.php', {
                operation: 'handleRequest',
                reservation_id: currentRequest.reservation_id,
                is_accepted: true
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data?.status === 'success') {
                toast.success('Reservation accepted successfully!', {
                    icon: '✅',
                    duration: 3000,
                });
                await fetchReservations();
                setIsDetailModalOpen(false); // Close the detail modal
            } else {
                toast.error('Failed to accept reservation.');
            }
        } catch (error) {
            toast.error(`Error accepting reservation: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsAccepting(false);
        }
    };

    const handleDecline = async () => {
        setIsDeclining(true);
        try {
            const response = await axios.post('http://localhost/coc/gsd/process_reservation.php', {
                operation: 'handleRequest',
                reservation_id: currentRequest.reservation_id,
                is_accepted: false
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data?.status === 'success') {
                toast.success('Reservation declined successfully!', {
                    icon: '❌',
                    duration: 3000,
                });
                await fetchReservations();
                setIsDeclineModalOpen(false); // Close the decline modal
                setIsDetailModalOpen(false);  // Also close the detail modal
            } else {
                toast.error('Failed to decline reservation.');
            }
        } catch (error) {
            console.error('Decline error:', error);
            toast.error('Error declining reservation. Please try again.');
        } finally {
            setIsDeclining(false);
        }
    };

    const getIconForType = (type) => {
        const icons = {
            Equipment: <FaTools className="mr-2 text-orange-500" />,
            Venue: <FaBuilding className="mr-2 text-green-500" />,
            Vehicle: <FaCar className="mr-2 text-blue-500" />,
        };
        return icons[type] || null;
    };

    useEffect(() => {
        const level = localStorage.getItem('user_level');
        setUserLevel(level);
        fetchReservations();
    }, []);

    const filteredReservations = reservations.filter(reservation => 
        (filter === 'All' || (reservation.type && reservation.type === filter)) &&
        (searchTerm === '' || reservation.reservation_id.toString().includes(searchTerm) || 
         reservation.reservations_users_id.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (!startDate || new Date(reservation.reservation_start_date) >= startDate) &&
        (!endDate || new Date(reservation.reservation_end_date) <= endDate)
    );

    // Add this helper function for status styling
    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'approve':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'decline':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };



    // Add new fetch functions for different request types
    const fetchPendingRequests = async () => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost/coc/gsd/process_reservation.php', {
                operation: 'fetchRequestReservation'
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.data?.status === 'success') {
                // Filter for active === "1"
                const pendingRequests = response.data.data.filter(request => request.active === "1");
                setReservations(pendingRequests);
            }
        } catch (error) {
            toast.error('Error fetching pending requests');
        } finally {
            setLoading(false);
        }
    };

    const fetchReviewRequests = async () => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost/coc/gsd/process_reservation.php', {
                operation: 'fetchRequestReservation'
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.data?.status === 'success') {
                // Filter for active === "0"
                const reviewRequests = response.data.data.filter(request => request.active === "0");
                setReservations(reviewRequests);
            }
        } catch (error) {
            toast.error('Error fetching review requests');
        } finally {
            setLoading(false);
        }
    };

    const fetchHistoryRequests = async () => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost/coc/gsd/process_reservation.php', {
                operation: 'fetchHistoryRequests'
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.data?.status === 'success') {
                setReservations(response.data.data);
            }
        } catch (error) {
            toast.error('Error fetching history');
        } finally {
            setLoading(false);
        }
    };

    // Update tab change handler
    const handleTabChange = (key) => {
        setActiveTab(key);
        setReservations([]);
        switch (key) {
            case '1':
                fetchPendingRequests();
                break;
            case '2':
                fetchReviewRequests();
                break;
            case '3':
                fetchHistoryRequests();
                break;
            default:
                break;
        }
    };

    useEffect(() => {
        // Initial load of pending requests
        fetchPendingRequests();
    }, []);

    // Add this new component for the view toggle
    const ViewToggle = () => (
        <div className="mb-4 flex justify-end">
            <Radio.Group value={viewMode} onChange={e => setViewMode(e.target.value)}>
                <Radio.Button value="grid">
                    <AppstoreOutlined /> Grid
                </Radio.Button>
                <Radio.Button value="list">
                    <UnorderedListOutlined /> List
                </Radio.Button>
            </Radio.Group>
        </div>
    );

    // Add this new component for rendering requests in list view
    const ListViewItem = ({ reservation, onClick }) => (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white mb-4 p-4 rounded-lg shadow hover:shadow-md transition-shadow"
        >
            <div className="flex justify-between items-center">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        {getIconForType(reservation.type)}
                        <h3 className="text-lg font-semibold">
                            {reservation.reservation_type === "Vehicle Form" 
                                ? reservation.reservation_destination 
                                : reservation.reservation_title}
                        </h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm text-gray-600">
                        <div>
                            <span className="font-medium">Created:</span><br/>
                            {new Date(reservation.reservation_created_at).toLocaleDateString()}
                        </div>
                        <div>
                            <span className="font-medium">Type:</span><br/>
                            {reservation.reservation_type}
                        </div>
                        <div>
                            <span className="font-medium">Status:</span><br/>
                            <span className={`px-2 py-1 rounded-full ${getStatusStyle(reservation.reservation_status)}`}>
                                {reservation.reservation_status}
                            </span>
                        </div>
                        <div>
                            {reservation.active === "0" ? (
                                <Tag color="processing">Waiting for Approval</Tag>
                            ) : (
                                <button
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                    onClick={() => fetchReservationDetails(reservation.reservation_id)}
                                >
                                    View Details
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );

    // Add this new Table component
    const RequestTable = ({ data, onView }) => {
        const columns = [
            {
            title: 'Title',
            dataIndex: 'reservation_title',
            key: 'reservation_title',
            },
            {
            title: 'Description',
            dataIndex: 'reservation_description',
            key: 'reservation_description',
            ellipsis: true,
            },
            {
            title: 'Requester',
            dataIndex: 'requester_name',
            key: 'requester_name',
            },
            {
            title: 'Created At',
            dataIndex: 'reservation_created_at',
            key: 'reservation_created_at',
            render: (text) => new Date(text).toLocaleString(),
            },
            {
            title: 'Status',
            dataIndex: 'reservation_status',
            key: 'reservation_status',
            render: (status, record) => (
                <Tag color={
                record.active === "0" ? 'gold' :
                status === 'Pending' ? 'blue' :
                status === 'Approved' ? 'green' :
                status === 'Declined' ? 'red' : 'default'
                }>
                {record.active === "0" ? "Final Confirmation" : "Waiting for Approval"}
                </Tag>
            ),
            },
            {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Button 
                type="primary"
                onClick={() => fetchReservationDetails(record.reservation_id)}
                icon={<EyeOutlined />}
                >
                View
                </Button>
            ),
            },
        ];

        return (
            <Table
                columns={columns}
                dataSource={data}
                rowKey="reservation_id"
                pagination={{ pageSize: 10 }}
            />
        );
    };

    // Update the items array to use the new table component
    const items = [
        {
            key: '1',
            label: (
                <span>
                    <ClockCircleOutlined /> Waiting for Approval
                </span>
            ),
            children: (
                <div className="mt-4">
                    <RequestTable 
                        data={filteredReservations.filter(r => r.active === "1")}
                        onView={fetchReservationDetails}
                    />
                </div>
            ),
        },
        {
            key: '2',
            label: (
                <span>
                    <CheckCircleOutlined /> Final Confirmation
                </span>
            ),
            children: (
                <div className="mt-4">
                    <RequestTable 
                        data={filteredReservations.filter(r => r.active === "0")}
                        onView={fetchReservationDetails}
                    />
                </div>
            ),
        },
        {
            key: '3',
            label: (
                <span>
                    <HistoryOutlined /> History
                </span>
            ),
            children: (
                <div className="mt-4">
                    <RequestTable 
                        data={filteredReservations}
                        onView={fetchReservationDetails}
                    />
                </div>
            ),
        },
    ];

    // Modify the tab content rendering
    const renderRequests = (requests, status) => {
        if (loading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <Spinner animation="border" role="status" className="text-blue-500">
                        <span className="sr-only">Loading...</span>
                    </Spinner>
                </div>
            );
        }

        if (!requests.length) {
            return (
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-gray-600 text-center py-12"
                >
                    No requests found.
                </motion.p>
            );
        }

        return (
            <>
                <ViewToggle />
                <AnimatePresence>
                    {viewMode === 'grid' ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
                        >
                            {/* Existing grid view code */}
                            {requests.map((reservation, index) => (
                                // Your existing grid card component
                                <motion.div 
                                    key={reservation.reservation_id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: index * 0.1, duration: 0.5 }}
                                    className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 transition-all duration-300 hover:shadow-xl hover:scale-105"
                                >
                                    <div className="p-6">
                                        <div className="flex flex-col gap-4">
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="text-2xl font-semibold text-gray-800">
                                                        {reservation.reservation_type === "Vehicle Form" 
                                                            ? reservation.reservation_destination 
                                                            : reservation.reservation_title}
                                                    </h3>
                                                    {getIconForType(reservation.type)}
                                                </div>
                                            </div>
                                            {/* Request Details */}
                                            <div className="space-y-2 text-sm">
                                                <p className="text-gray-600">
                                                    <span className="font-medium text-gray-700">Created:</span> {' '}
                                                    {new Date(reservation.reservation_created_at).toLocaleString()}
                                                </p>
                                               
                                                <p className="text-gray-600">
                                                    <span className="font-medium text-gray-700">Reservation Status:</span> {' '}
                                                    <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                                                        {reservation.active === "1" ? "Waiting Approval" : reservation.reservation_status}
                                                    </span>
                                                </p>
                                            </div>

                                            {/* View Details Button */}
                                            <button
                                                className="w-full mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                                onClick={() => {
                                                    // Fix: Pass the reservation_id directly
                                                    fetchReservationDetails(reservation.reservation_id);
                                                }}
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            {requests.map((reservation) => (
                                <ListViewItem 
                                    key={reservation.reservation_id}
                                    reservation={reservation}
                                    onClick={() => fetchReservationDetails(reservation.reservation_id)}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </>
        );
    };

    // Update the tab items to use the new rendering function
    

    // Replace the existing card rendering code in the return statement
    return (
        <div className="flex flex-col lg:flex-row bg-gradient-to-br from-white to-green-100">
            <Sidebar />
            <div className="flex-grow p-8 lg:p-12">
                <motion.h2 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-4xl font-bold mb-8 text-gray-800"
                >
                    Reservation Requests
                </motion.h2>

                <Tabs 
                    activeKey={activeTab} 
                    onChange={handleTabChange}
                    items={items}
                />

                {/* Detail Modal for Accepting */}
                <DetailModal 
                    visible={isDetailModalOpen}
                    onClose={() => {
                        setIsDetailModalOpen(false);
                        setCurrentRequest(null);
                        setReservationDetails(null);
                    }}
                    reservationDetails={reservationDetails}
                    onAccept={handleAccept}
                    onDecline={() => setIsDeclineModalOpen(true)}
                    isAccepting={isAccepting}
                    isDeclining={isDeclining}
                />

                {/* Confirmation Modal for Declining */}
                <Modal
                    title="Confirm Decline"
                    visible={isDeclineModalOpen}
                    onCancel={() => setIsDeclineModalOpen(false)}
                    footer={[
                        <Button key="back" onClick={() => setIsDeclineModalOpen(false)}>
                            Cancel
                        </Button>,
                        <Button 
                            key="submit" 
                            type="primary" 
                            danger
                            loading={isDeclining}
                            onClick={handleDecline}
                        >
                            Decline
                        </Button>,
                    ]}
                >
                    <p>Are you sure you want to decline this reservation? This action cannot be undone.</p>
                </Modal>
            </div>
        </div>
    );
};

// Add this utility function before the DetailModal component
const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const isSameDay = start.toDateString() === end.toDateString();
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    if (isSameDay) {
        return `${monthNames[start.getMonth()]} ${start.getDate()} ${formatTime(start)} to ${formatTime(end)}`;
    } else {
        return `${monthNames[start.getMonth()]} ${start.getDate()}-${end.getDate()}\n${formatTime(start)} to ${formatTime(end)}`;
    }
};

const DetailModal = ({ visible, onClose, reservationDetails, onAccept, onDecline, isAccepting, isDeclining }) => {
    if (!reservationDetails) return null;

    const getModalFooter = () => {
        // Show accept/decline buttons only for requests in Final Confirmation (active === "0")
        if (reservationDetails.active === "0") {
            return [
                <Button key="decline" danger loading={isDeclining} onClick={onDecline}>
                    Decline
                </Button>,
                <Button key="accept" type="primary" loading={isAccepting} onClick={onAccept}>
                    Accept
                </Button>,
                <Button key="close" onClick={onClose}>
                    Close
                </Button>
            ];
        }
        return [
            <Button key="close" onClick={onClose}>
                Close
            </Button>
        ];
    };

    const commonHeaderDetails = (
        <>
            <Descriptions.Item label="Requester" span={2}>
                <Space>
                    <UserOutlined />
                    {reservationDetails.requester_name}
                </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Department" span={2}>
                <Tag color="blue">{reservationDetails.department_name}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Request Date" span={2}>
                {new Date(reservationDetails.reservation_created_at).toLocaleString()}
            </Descriptions.Item>
        </>
    );

    return (
        <Modal
            title={`Request Details - ${reservationDetails.active === "0" ? "Final Confirmation" : "Waiting for Approval"}`}
            visible={visible}
            onCancel={onClose}
            width={800}
            footer={getModalFooter()}
        >
            {reservationDetails.request_type && reservationDetails.request_type.toLowerCase() === 'venue' ? (
                <Descriptions bordered column={2}>
                    {commonHeaderDetails}
                    <Descriptions.Item label="Venue Name" span={2}>
                        {reservationDetails.venue?.venue_name}
                    </Descriptions.Item>
                    <Descriptions.Item label="Event Title" span={2}>
                        {reservationDetails.reservation_title}
                    </Descriptions.Item>
                    <Descriptions.Item label="Description" span={2}>
                        {reservationDetails.reservation_description}
                    </Descriptions.Item>
                    <Descriptions.Item label="Participants">
                        <Space>
                            <TeamOutlined />
                            {reservationDetails.reservation_participants}
                        </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Schedule" span={2}>
                        <Space direction="vertical">
                            <CalendarOutlined />
                            {formatDateRange(
                                reservationDetails.reservation_start_date,
                                reservationDetails.reservation_end_date
                            )}
                        </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Equipment Requested" span={2}>
                        {!reservationDetails.equipment || !reservationDetails.equipment.length ? (
                            <Tag color="default">No Equipment Added</Tag>
                        ) : (
                            <div className="space-y-2">
                                {Array.isArray(reservationDetails.equipment) && 
                                    reservationDetails.equipment.map((item, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <span>{item.equipment_name}</span>
                                            <Tag color="orange">
                                                Quantity: {item.reservation_equipment_quantity}
                                            </Tag>
                                        </div>
                                    ))
                                }
                            </div>
                        )}
                    </Descriptions.Item>
                </Descriptions>
            ) : reservationDetails.request_type && reservationDetails.request_type.toLowerCase() === 'vehicle' ? (
                <Descriptions bordered column={2}>
                    {commonHeaderDetails}
                    <Descriptions.Item label="Vehicle" span={2}>
                        <Tag color="blue">{reservationDetails.vehicle?.vehicle_model_name || 'N/A'}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Purpose" span={2}>
                        {reservationDetails.reservation_purpose}
                    </Descriptions.Item>
                    <Descriptions.Item label="Destination" span={2}>
                        <Space>
                            <EnvironmentOutlined />
                            {reservationDetails.reservation_destination}
                        </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Schedule" span={2}>
                        <Space direction="vertical">
                            <CalendarOutlined />
                            {formatDateRange(
                                reservationDetails.reservation_start_date,
                                reservationDetails.reservation_end_date
                            )}
                        </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Driver" span={2}>
                        <Space>
                            <UserOutlined />
                            {reservationDetails.driver?.driver_name || 'No driver assigned'}
                        </Space>
                    </Descriptions.Item>
                    {reservationDetails.passengers && (
                        <Descriptions.Item label="Passengers" span={2}>
                            <Space>
                                <TeamOutlined />
                                {reservationDetails.passengers.passenger_name}
                            </Space>
                        </Descriptions.Item>
                    )}
                </Descriptions>
            ) : (
                <Alert
                    message="Request Type Information"
                    description={`Request Type: ${reservationDetails.request_type || 'Not specified'}`}
                    type="info"
                />
            )}
        </Modal>
    );
};

export default ReservationRequests;

