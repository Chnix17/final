import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DeanSidebar from './component/dean_sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiRefreshCw, FiCheck, FiX, FiEye, FiCalendar, FiMapPin, FiUser } from 'react-icons/fi';
import { Modal, Descriptions, Badge, Timeline, Card, Tabs, Button, Tag, Space, Divider, Alert, Table, List, Avatar } from 'antd';

const ViewApproval = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [departmentId, setDepartmentId] = useState(null); // Will be fetched from localStorage
  const [requestType, setRequestType] = useState('all'); // Default type
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [availabilityData, setAvailabilityData] = useState(null);

  // Fetch the department_id from localStorage on component mount
  useEffect(() => {
    const storedDepartmentId = localStorage.getItem("department_id");
    if (storedDepartmentId) {
      setDepartmentId(storedDepartmentId);
    } else {
      console.error("No department ID found in localStorage.");
    }
  }, []);

  // Fetch the approval requests when the component mounts or when filters change
  const fetchApprovalRequests = async () => {
    if (!departmentId) {
      console.error("Department ID is not available");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost/coc/gsd/process_reservation.php', {
        operation: 'fetchApprovalByDept',
        department_id: departmentId,
      });
      setRequests(response.data.data || []);
    } catch (error) {
      console.error('Error fetching approval requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Modified handleApproval function
  const handleApproval = async (reservationId, isAccepted) => {
    if (isAccepted && isAnyResourceUnavailable(availabilityData, selectedRequest)) {
      alert('Cannot approve: One or more resources are unavailable');
      return;
    }

    // Get the correct reservation_id from the request
    const actualReservationId = selectedRequest.reservation_id;

    try {
      const response = await axios.post('http://localhost/coc/gsd/process_reservation.php', {
        operation: 'handleApproval',
        reservation_id: actualReservationId,
        is_accepted: isAccepted
      });

      if (response.data.status === 'success') {
        alert(response.data.message);
        fetchApprovalRequests();
        handleCloseDetails();
      } else {
        alert(response.data.message || 'Failed to update approval status');
      }
    } catch (error) {
      console.error('Error updating approval status:', error);
      alert('Network error occurred while updating approval status');
    }
  };

  // Handle request type filter change
  const handleRequestTypeChange = (event) => {
    setRequestType(event.target.value);
  };

  // View details of the selected request
  const handleViewDetails = async (request) => {
    setSelectedRequest(request);
    await checkAvailability(request);
  };

  // Close the details view
  const handleCloseDetails = () => {
    setSelectedRequest(null);
    setAvailabilityData(null);
  };

  useEffect(() => {
    if (departmentId) {
      fetchApprovalRequests();
    }
  }, [departmentId]);

  const filteredRequests = requests.filter(request => {
    const matchesSearch = (
      (request.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.purpose || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const matchesType = requestType === 'all' || 
      (requestType === 'vehicle' && request.vehicle?.id) ||
      (requestType === 'venue' && request.venue?.id);

    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.approval_created_at) - new Date(a.approval_created_at);
    }
    return new Date(a.approval_created_at) - new Date(b.approval_created_at);
  });

  const checkAvailability = async (details) => {
    try {
      const startDate = details.venue ? details.venue.venue_form_start_date : details.vehicle.vehicle_form_start_date;
      const endDate = details.venue ? details.venue.venue_form_end_date : details.vehicle.vehicle_form_end_date;

      const response = await axios.post('http://localhost/coc/gsd/process_reservation.php', {
        operation: 'doubleCheckAvailability',
        start_datetime: startDate,
        end_datetime: endDate,
        venue_id: details.venue?.ven_id,
        vehicle_id: details.vehicle?.vehicle_id,
        equipment_id: details.equipment?.equip_id,
        driver_id: details.vehicle?.driver_id // Add driver_id for checking
      });

      if (response.data?.status === 'success') {
        setAvailabilityData(response.data.data);
        return !isAnyResourceUnavailable(response.data.data, details);
      }
      return false;
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  };

  const isAnyResourceUnavailable = (availabilityData, details) => {
    if (!availabilityData) return false;

    let isUnavailable = false;

    if (details.venue) {
      isUnavailable = availabilityData.unavailable_venues?.some(
        v => v.ven_id === details.venue.venue_id
      ) || isUnavailable;
    }

    if (details.vehicle) {
      isUnavailable = availabilityData.unavailable_vehicles?.some(
        v => v.vehicle_id === details.vehicle.vehicle_id
      ) || isUnavailable;
      
      // Check driver availability
      isUnavailable = availabilityData.unavailable_drivers?.some(
        d => d.driver_id === details.vehicle.driver_id
      ) || isUnavailable;
    }

    if (details.equipment) {
      isUnavailable = availabilityData.unavailable_equipment?.some(
        e => e.equip_id === details.equipment.equip_id
      ) || isUnavailable;
    }

    return isUnavailable;
  };

  const getAvailabilityStatus = (type, id) => {
    if (!availabilityData) return true;

    switch (type) {
      case 'venue':
        return !availabilityData.unavailable_venues?.some(v => v.ven_id === id);
      case 'vehicle':
        return !availabilityData.unavailable_vehicles?.some(v => v.vehicle_id === id);
      case 'driver':
        return !availabilityData.unavailable_drivers?.some(d => d.driver_id === id);
      case 'equipment':
        return !availabilityData.unavailable_equipment?.some(e => e.equip_id === id);
      default:
        return true;
    }
  };

  const VenueRequestModal = ({ request, visible, onClose, onApprove, onDecline, availabilityData }) => {
    if (!request?.venue) return null;

    return (
      <Modal
        visible={visible}
        onCancel={onClose}
        width={800}
        title={
          <div className="flex items-center justify-between">
            <span className="text-xl font-semibold">Venue Request Details</span>
            <Space>
              <Tag color="blue">{request.venue.name}</Tag>
            </Space>
          </div>
        }
        footer={[
          <Button key="decline" danger icon={<FiX />} onClick={onDecline}>Decline</Button>,
          <Button key="approve" type="primary" className="bg-green-600" icon={<FiCheck />} onClick={onApprove}>Approve</Button>
        ]}
      >
        <div className="space-y-6">
          <Card title="Event Information" className="shadow-sm">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Event Title" span={2}>{request.venue.title}</Descriptions.Item>
              <Descriptions.Item label="Requester">{request.requester}</Descriptions.Item>
              <Descriptions.Item label="Department">{request.department_name}</Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>{request.venue.description}</Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      </Modal>
    );
  };

  const VehicleRequestModal = ({ request, visible, onClose, onApprove, onDecline, availabilityData }) => {
    if (!request?.vehicle) return null;

    return (
      <Modal
        visible={visible}
        onCancel={onClose}
        width={800}
        title={
          <div className="flex items-center justify-between">
            <span className="text-xl font-semibold">Vehicle Request Details</span>
            <Space>
              <Tag color="purple">{request.vehicle.license}</Tag>
            </Space>
          </div>
        }
        footer={[
          <Button key="decline" danger icon={<FiX />} onClick={onDecline}>Decline</Button>,
          <Button key="approve" type="primary" className="bg-green-600" icon={<FiCheck />} onClick={onApprove}>Approve</Button>
        ]}
      >
        <div className="space-y-6">
          <Card title="Trip Information" className="shadow-sm">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Purpose" span={2}>{request.vehicle.purpose}</Descriptions.Item>
              <Descriptions.Item label="Requester">{request.requester}</Descriptions.Item>
              <Descriptions.Item label="Department">{request.department_name}</Descriptions.Item>
              <Descriptions.Item label="Destination">{request.vehicle.destination}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Vehicle Details" className="shadow-sm">
            <Descriptions bordered>
              <Descriptions.Item label="License Plate">{request.vehicle.license}</Descriptions.Item>
              <Descriptions.Item label="Make">{request.vehicle.make}</Descriptions.Item>
              <Descriptions.Item label="Model">{request.vehicle.model}</Descriptions.Item>
              <Descriptions.Item label="Category">{request.vehicle.category}</Descriptions.Item>
            </Descriptions>
          </Card>

          {request.vehicle.drivers && (
            <Card title="Assigned Drivers" className="shadow-sm">
              <List
                dataSource={request.vehicle.drivers}
                renderItem={driver => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<FiUser />} />}
                      title={driver}
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}

          {request.passengers && request.passengers.length > 0 && (
            <Card title="Passengers" className="shadow-sm">
              <List
                dataSource={request.passengers}
                renderItem={passenger => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<FiUser />} />}
                      title={passenger.passenger_name}
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}
        </div>
      </Modal>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <DeanSidebar />
      
      <main className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header Section */}
          <header className="bg-white shadow-sm px-8 py-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-900">Approval Requests Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">Manage and process department requests</p>
            </div>
          </header>

          {/* Filters Section */}
          <div className="bg-white border-b px-8 py-4">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-4">
                <select
                  value={requestType}
                  onChange={handleRequestTypeChange}
                  className="px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="venue">Venue</option>
                  <option value="vehicle">Vehicle</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="declined">Declined</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>

                <button
                  onClick={fetchApprovalRequests}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="max-w-7xl mx-auto">
              <AnimatePresence>
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </div>
                ) : sortedRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No requests found matching your criteria</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {sortedRequests.map((request) => (
                      <motion.div
                        key={request.approval_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                      >
                        {/* Enhanced Request Card Layout */}
                        <div className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {request.venue?.title || request.vehicle?.purpose || 'Unnamed Request'}
                              </h3>
                              <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center">
                                  <FiUser className="mr-2" />
                                  {request.requester}
                                </span>
                                <span className="flex items-center">
                                  <FiCalendar className="mr-2" />
                                  {new Date(request.reservation_created_at).toLocaleDateString()}
                                </span>
                                <span className="flex items-center">
                                  <FiMapPin className="mr-2" />
                                  {request.vehicle?.destination || request.venue?.name || 'N/A'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <span className={`px-3 py-1 rounded-full text-sm ${
                                request.vehicle ? 
                                'bg-blue-100 text-blue-800' : 
                                'bg-green-100 text-green-800'
                              }`}>
                                {request.vehicle ? 'Vehicle' : 'Venue'}
                              </span>
                              <button
                                onClick={() => handleViewDetails(request)}
                                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                              >
                                <FiEye className="mr-2" />
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* Enhanced Modal */}
      <AnimatePresence>
        {selectedRequest && (
          selectedRequest.vehicle ? (
            <VehicleRequestModal
              request={selectedRequest}
              visible={!!selectedRequest}
              onClose={handleCloseDetails}
              onApprove={() => handleApproval(selectedRequest.reservation_id, true)}
              onDecline={() => handleApproval(selectedRequest.reservation_id, false)}
              availabilityData={availabilityData}
            />
          ) : selectedRequest.venue ? (
            <VenueRequestModal
              request={selectedRequest}
              visible={!!selectedRequest}
              onClose={handleCloseDetails}
              onApprove={() => handleApproval(selectedRequest.reservation_id, true)}
              onDecline={() => handleApproval(selectedRequest.reservation_id, false)}
              availabilityData={availabilityData}
            />
          ) : null
        )}
      </AnimatePresence>
    </div>
  );
};

export default ViewApproval;
