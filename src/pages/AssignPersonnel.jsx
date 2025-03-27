import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Sidebar from './Sidebar';  // Add this import

const AssignPersonnel = () => {
  const [activeTab, setActiveTab] = useState('Not Assigned');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [personnel, setPersonnel] = useState([]);
  const [formData, setFormData] = useState({
    personnel: '',
    checklists: []
  });
  const [errorMessage, setErrorMessage] = useState('');
  
  const [reservations, setReservations] = useState([]);

  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [selectedChecklists, setSelectedChecklists] = useState([]);

  const handleOpenModal = async (reservation) => {
    try {
      const response = await axios.post('http://localhost/coc/gsd/fetch2.php', {
        operation: 'getReservedById',
        reservation_id: reservation.id
      });

      if (response.data.status === 'success') {
        const { data } = response.data;
        let checklists = [];
        
        // Process venues
        if (data.venues && data.venues.length > 0) {
          data.venues.forEach(venue => {
            if (venue.checklists && venue.checklists.length > 0) {
              const venueItems = venue.checklists.map(item => ({
                id: item.checklist_venue_id,
                name: item.checklist_name,
                type: 'venue',
                reservation_venue_id: venue.reservation_venue_id
              }));
              checklists.push({
                category: `Venue: ${venue.name}`,
                items: venueItems
              });
            }
          });
        }

        // Process equipment
        if (data.equipments && data.equipments.length > 0) {
          data.equipments.forEach(equipment => {
            if (equipment.checklists && equipment.checklists.length > 0) {
              const equipmentItems = equipment.checklists.map(item => ({
                id: item.checklist_equipment_id,
                name: item.checklist_name,
                type: 'equipment',
                reservation_equipment_id: equipment.reservation_equipment_id
              }));
              checklists.push({
                category: `Equipment: ${equipment.name} (Qty: ${equipment.quantity})`,
                items: equipmentItems
              });
            }
          });
        }

        // Process vehicles
        if (data.vehicles && data.vehicles.length > 0) {
          data.vehicles.forEach(vehicle => {
            if (vehicle.checklists && vehicle.checklists.length > 0) {
              const vehicleItems = vehicle.checklists.map(item => ({
                id: item.checklist_vehicle_id,
                name: item.checklist_name,
                type: 'vehicle',
                reservation_vehicle_id: vehicle.reservation_vehicle_id
              }));
              checklists.push({
                category: `Vehicle: ${vehicle.name}`,
                items: vehicleItems
              });
            }
          });
        }

        setSelectedReservation(reservation);
        setFormData({
          personnel: '',
          checklists: checklists
        });
      }
    } catch (error) {
      console.error('Error fetching reservation details:', error);
      setFormData({ personnel: '', checklists: [] });
    }
    setIsModalOpen(true);
  };

  

  const handleAssign = async () => {
    setErrorMessage('');
    if (!formData.personnel) {
      setErrorMessage('Please select a personnel');
      return;
    }

    const selectedPersonnelObj = personnel.find(p => p.full_name === formData.personnel);
    if (!selectedPersonnelObj) {
      setErrorMessage('Selected personnel not found');
      return;
    }

    try {
      const checklistIds = [];

      formData.checklists.forEach(category => {
        category.items.forEach(item => {
          const entry = {
            type: item.type,
            checklist_id: item.id
          };

          switch (item.type) {
            case 'venue':
              entry.reservation_venue_id = item.reservation_venue_id;
              break;
            case 'equipment':
              entry.reservation_equipment_id = item.reservation_equipment_id;
              break;
            case 'vehicle':
              entry.reservation_vehicle_id = item.reservation_vehicle_id;
              break;
          }

          checklistIds.push(entry);
        });
      });

      const payload = {
        operation: 'saveChecklist',
        data: {
          admin_id: localStorage.getItem("user_id"),
          personnel_id: selectedPersonnelObj.users_id,
          checklist_ids: checklistIds
        }
      };

      const response = await axios.post('http://localhost/coc/gsd/fetch2.php', payload);

      if (response.data.status === 'success') {
        setReservations(prev => 
          prev.map(res => 
            res.id === selectedReservation.id ? {
              ...res,
              personnel: formData.personnel,
              status: 'Assigned'
            } : res
          )
        );
        
        setIsModalOpen(false);
        setFormData({ personnel: '', checklists: [] });
        setSelectedReservation(null);
        setErrorMessage('');

        if (activeTab === 'Not Assigned') {
          fetchNotAssignedReservations();
        }
      } else {
        setErrorMessage('Failed to assign personnel. Please try again.');
      }
    } catch (error) {
      console.error('Error assigning personnel:', error);
      setErrorMessage(error.message || 'An error occurred while assigning personnel.');
    }
  };

  const handleComplete = async (reservationId, personnelId) => {
    try {
      const response = await axios.post('http://localhost/coc/gsd/records&reports.php', {
        operation: 'updateReleaseStatus',
        json: {
          reservation_id: reservationId,
          status_checklist_id: 2 // Assuming 2 is the ID for "Completed" status
        }
      });

      if (response.data.status === 'success') {
        // Refresh the current tab's data
        if (activeTab === 'Assigned') {
          fetchAssignedReservations();
        }
      }
    } catch (error) {
      console.error('Error updating release status:', error);
    }
  };

  const toggleChecklistStatus = (reservationId, checklistIndex) => {
    setReservations(reservations.map(res => {
      if (res.id === reservationId) {
        const updatedChecklists = res.checklists.map((checklist, idx) => 
          idx === checklistIndex 
            ? { ...checklist, status: checklist.status === 'pending' ? 'completed' : 'pending' }
            : checklist
        );
        return { ...res, checklists: updatedChecklists };
      }
      return res;
    }));
  };

  const fetchPersonnel = async () => {
    try {
      const response = await axios.post('http://localhost/coc/gsd/fetch2.php', {
        operation: 'fetchPersonnel'
      });

      if (response.data.status === 'success' && Array.isArray(response.data.data)) {
        setPersonnel(response.data.data);
      } else {
        console.error('Invalid data format received:', response.data);
      }
    } catch (error) {
      console.error('Error fetching personnel:', error);
    }
  };

  const fetchNotAssignedReservations = async () => {
    try {
      const response = await axios.post('http://localhost/coc/gsd/records&reports.php', {
        operation: 'fetchNoAssignedReservation'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success' && Array.isArray(response.data.data)) {
        const formattedData = response.data.data.map(item => ({
          id: item.reservation_id,
          type: item.venue_form_name ? 'Venue' : 'Vehicle',
          name: item.reservation_title || 'Untitled',  // Changed to use reservation_title
          details: item.venue_details || item.vehicle_details,
          personnel: 'N/A',
          checklists: [],
          status: 'Not Assigned',
          createdAt: new Date(item.reservation_created_at).toLocaleString() // Format the date
        }));
        setReservations(formattedData);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  const fetchAssignedReservations = async () => {
    try {
      const response = await axios.post('http://localhost/coc/gsd/records&reports.php', {
        operation: 'fetchAssignedRelease'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success' && Array.isArray(response.data.data)) {
        const formattedData = response.data.data.map(item => {
          const masterData = item.master_data;
          return {
            id: masterData.reservation_id,
            type: masterData.venue_form_name ? 'Venue' : 'Vehicle',
            name: masterData.venue_form_name || masterData.vehicle_form_name,
            details: '',
            personnel: personnel.find(p => p.jo_personel_id === masterData.checklist_personnel_id)?.full_name || 'Unknown',
            checklists: masterData.venue_form_name 
              ? item.venue_equipment.map(eq => ({
                  name: eq.release_checklist_name,
                  status: eq.status_checklist_name || (eq.release_isActive === '1' ? 'completed' : 'pending')
                }))
              : item.vehicle_checklist.map(vc => ({
                  name: vc.release_checklist_name,
                  status: vc.status_checklist_name || (vc.release_isActive === '1' ? 'completed' : 'pending')
                })),
            status: 'Assigned',
            createdAt: masterData.reservation_date
          };
        });
        setReservations(formattedData);
      }
    } catch (error) {
      console.error('Error fetching assigned reservations:', error);
    }
  };

  const fetchCompletedReservations = async () => {
    try {
      const response = await axios.post('http://localhost/coc/gsd/records&reports.php', {
        operation: 'fetchCompletedRelease'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success' && Array.isArray(response.data.data)) {
        const formattedData = response.data.data.map(item => {
          const masterData = item.master_data;
          return {
            id: masterData.reservation_id,
            type: masterData.venue_form_name ? 'Venue' : 'Vehicle',
            name: masterData.venue_form_name || masterData.vehicle_form_name,
            details: '',
            personnel: personnel.find(p => p.jo_personel_id === masterData.checklist_personnel_id)?.full_name || 'Unknown',
            checklists: masterData.venue_form_name 
              ? item.venue_equipment.map(eq => ({
                  name: eq.release_checklist_name,
                  status: masterData.status_checklist_name || 'Completed'
                }))
              : item.vehicle_checklist.map(vc => ({
                  name: vc.release_checklist_name,
                  status: masterData.status_checklist_name || 'Completed'
                })),
            status: 'Completed',
            createdAt: masterData.reservation_date
          };
        });
        setReservations(formattedData);
      }
    } catch (error) {
      console.error('Error fetching completed reservations:', error);
    }
  };

  useEffect(() => {
    fetchPersonnel();
  }, []);

  useEffect(() => {
    if (activeTab === 'Not Assigned') {
      fetchNotAssignedReservations();
    } else if (activeTab === 'Assigned') {
      fetchAssignedReservations();
    } else if (activeTab === 'Completed') {
      fetchCompletedReservations();
    }
  }, [activeTab]);

  const filteredReservations = reservations.filter(res => res.status === activeTab);

  const renderStatusCell = (reservation) => {
    if (activeTab === 'Assigned') {
      const allCompleted = reservation.checklists.every(item => item.status === 'completed');
      return (
        <td className="px-6 py-4">
          {allCompleted ? (
            <button
              onClick={() => handleComplete(reservation.id, reservation.personnel_id)}
              className="px-3 py-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
            >
              Mark as Complete
            </button>
          ) : (
            <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
              Pending
            </span>
          )}
        </td>
      );
    }
    return null;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Assign Personnel</h1>
          </div>
          
          {/* Enhanced Tabs */}
          <div className="bg-white p-1 rounded-lg shadow-sm mb-6 inline-flex">
            {['Not Assigned', 'Assigned', 'Completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-md transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>{tab}</span>
                  <span className="bg-opacity-20 px-2 py-0.5 rounded-full text-sm">
                    {reservations.filter(r => r.status === tab).length}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Enhanced Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reservation Name</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Personnel</th>
                    {activeTab !== 'Not Assigned' && (
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Checklists</th>
                    )}
                    {activeTab === 'Not Assigned' && (
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    )}
                    {(activeTab === 'Assigned' || activeTab === 'Completed') && (
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredReservations.map((reservation) => (
                    <motion.tr
                      key={reservation.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <h1 className="text-sm font-medium text-gray-900">{reservation.name}</h1>
                        </div>
                      </td>
                      
                      {/* Rest of the row cells */}
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {reservation.personnel === 'N/A' ? (
                            <span className="text-sm text-gray-500">Not Assigned</span>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                {reservation.personnel.charAt(0)}
                              </div>
                              <span className="text-sm font-medium">{reservation.personnel}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      {activeTab !== 'Not Assigned' && (
                        <td className="px-6 py-4">
                          {reservation.checklists.length > 0 ? (
                            <button
                              onClick={() => {
                                setSelectedChecklists(reservation.checklists);
                                setIsChecklistModalOpen(true);
                              }}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Checklist
                            </button>
                          ) : (
                            <span className="text-sm text-gray-500">No checklist items</span>
                          )}
                        </td>
                      )}
                      {activeTab === 'Not Assigned' && (
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleOpenModal(reservation)}
                            className="inline-flex items-center px-3 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Assign
                          </button>
                        </td>
                      )}
                      {(activeTab === 'Assigned' || activeTab === 'Completed') && (
                        <td className="px-6 py-4">
                          {activeTab === 'Assigned' ? (
                            reservation.checklists.every(item => item.status === 'completed') ? (
                              <button
                                onClick={() => handleComplete(reservation.id, reservation.personnel_id)}
                                className="px-3 py-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                              >
                                Mark as Complete
                              </button>
                            ) : (
                              <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Pending
                              </span>
                            )
                          ) : (
                            <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Completed
                            </span>
                          )}
                        </td>
                      )}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Enhanced Modal */}
          <AnimatePresence>
            {isModalOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
                open={isModalOpen}  // Changed from visible to open
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Assign Personnel</h2>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Personnel</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.personnel}
                        onChange={(e) => setFormData({...formData, personnel: e.target.value})}
                      >
                        <option value="">Select Personnel</option>
                        {personnel.map((person) => (
                          <option key={person.users_id} value={person.full_name}>
                            {person.full_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Checklists</h3>
                      <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                        {formData.checklists.map((categoryList, categoryIndex) => (
                          <div key={categoryIndex} className="space-y-2">
                            <h4 className="font-medium text-blue-600">{categoryList.category}</h4>
                            {categoryList.items.map((checklist, index) => (
                              <div key={index} className="flex items-center space-x-3 ml-4">
                                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                <span className="text-sm text-gray-700">
                                  {checklist.name} 
                                </span>
                              </div>
                            ))}
                          </div>
                        ))}
                        {formData.checklists.length === 0 && (
                          <p className="text-sm text-gray-500 italic">No checklists available</p>
                        )}
                      </div>
                    </div>

                    {errorMessage && (
                      <div className="text-red-500 text-sm mt-2">
                        {errorMessage}
                      </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAssign}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Assign Personnel
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add Checklist Modal */}
          <AnimatePresence>
            {isChecklistModalOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
                open={isChecklistModalOpen}  // Changed from visible to open
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Checklist Items</h2>
                    <button
                      onClick={() => setIsChecklistModalOpen(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {selectedChecklists.map((checklist, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <span className={`text-sm flex-1 ${checklist.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {checklist.name}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          checklist.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {checklist.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setIsChecklistModalOpen(false)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AssignPersonnel;
