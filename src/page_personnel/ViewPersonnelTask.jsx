import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Sidebar from './component/sidebar';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ViewPersonnelTask = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 10;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState('ongoing'); // 'ongoing' or 'completed'

  const fetchPersonnelTasks = async () => {
    try {
      setLoading(true);
    const response = await axios.post('http://localhost/coc/gsd/personnel.php', {
      operation: 'fetchAssignedRelease',
      personnel_id: localStorage.getItem('user_id')
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

      if (response.data.status === 'success') {
        setTasks(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch tasks');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

const handleChecklistUpdate = async (type, checklistId, value) => {
  try {
    // Determine the correct ID field for the item
    const idMapping = {
      venue: 'reservation_checklist_venue_id',
      vehicle: 'reservation_checklist_vehicle_id',
      equipment: 'reservation_checklist_equipment_id'
    };

    const lookupField = {
      venue: 'checklist_venue_id',
      vehicle: 'checklist_vehicle_id',
      equipment: 'checklist_equipment_id'
    };

    // Find the checklist item using the original checklist ID
    const checklist = selectedTask[type]?.checklists?.find(
      item => item[lookupField[type]] === checklistId
    );

    if (!checklist) {
      console.error('Checklist item not found');
      return;
    }

    // Get the reservation checklist ID
    const reservationChecklistId = checklist[idMapping[type]];

    const response = await axios.post('http://localhost/coc/gsd/personnel.php', {
      operation: 'updateTask',
      type: type,
      id: reservationChecklistId,
      isActive: value === "1" ? 1 : 0
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.status === 'success') {
      // Update local state
      setSelectedTask(prevData => {
        if (!prevData) return prevData;
        const updatedData = { ...prevData };
        
        if (updatedData[type]?.checklists) {
          updatedData[type].checklists = updatedData[type].checklists.map(item =>
            item[lookupField[type]] === checklistId
              ? { ...item, isChecked: value }
              : item
          );
        }
        
        return updatedData;
      });

      toast.success('Task updated successfully');
    } else {
      // Revert to unchecked state on failure
      setSelectedTask(prevData => {
        if (!prevData) return prevData;
        const updatedData = { ...prevData };
        
        if (updatedData[type]?.checklists) {
          updatedData[type].checklists = updatedData[type].checklists.map(item =>
            item[lookupField[type]] === checklistId
              ? { ...item, isChecked: "0" }
              : item
          );
        }
        
        return updatedData;
      });

      toast.error('Failed to update task');
    }
  } catch (err) {
    console.error('Error updating task:', err);
    toast.error('Error updating task');
  }
};

  const updateTaskStatus = async (type, id, isActive) => {
    try {
      const response = await axios.post('http://localhost/coc/gsd/personnel.php', {
        operation: 'updateTask',
        type: type,
        id: id,
        isActive: isActive
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        
        
        // Update modalTaskData immediately
        setSelectedTask(prevData => ({
          ...prevData,
          venue_tasks: prevData.venue_tasks?.map(task => 
            task.release_venue_id === id 
              ? { ...task, release_isActive: isActive }
              : task
          ) || [],
          vehicle_tasks: prevData.vehicle_tasks?.map(task => 
            task.release_vehicle_id === id 
              ? { ...task, release_isActive: isActive }
              : task
          ) || []
        }));

        // Refresh the main tasks list
        fetchPersonnelTasks();
      } else {
        toast.error('Failed to update task');
      }
    } catch (err) {
      console.error('Error updating task:', err);
      toast.error('Error updating task');
    }
  };

  const handleModalOpen = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleRefresh = () => {
    fetchPersonnelTasks();
    toast.info('Refreshing tasks...');
  };
  const fetchCompletedTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost/coc/gsd/personnel.php', {
        operation: 'fetchCompletedTask',
        personnel_id: localStorage.getItem('user_id')
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      if (response.data.status === 'success') {
        setTasks(response.data.data || []);
      } else {
        setTasks([]);
        toast.info('No completed tasks found');
      }
    } catch (err) {
      setError('Failed to fetch completed tasks');
      console.error('Error:', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filter === 'ongoing') {
      fetchPersonnelTasks();
    } else if (filter === 'completed') {
      fetchCompletedTasks();
    }
  }, [filter]);

  

  const handleSubmitTask = async () => {
    try {
      setIsSubmitting(true);
      const response = await axios.post('http://localhost/coc/gsd/personnel.php', {
        operation: 'insertComplete',
        checklist_id: selectedTask.master_data.checklist_id,
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        toast.success('Task submitted successfully');
        setIsModalOpen(false);
        
        // Remove the completed task from the local state
        setTasks(prevTasks => prevTasks.filter(task => 
          task.master_data.checklist_id !== selectedTask.master_data.checklist_id
        ));
        
        // Reset selected task
        setSelectedTask(null);
      } else {
        toast.error('Failed to submit task');
      }
    } catch (err) {
      console.error('Error submitting task:', err);
      toast.error('Error submitting task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAllTasksCompleted = (tasks) => {
    return tasks.every(task => task.release_isActive === '1');
  };

  useEffect(() => {
    fetchPersonnelTasks();
  }, []);

  // Calculate pagination
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = tasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(tasks.length / tasksPerPage);

  // Calculate progress helper function
  const calculateProgress = (task) => {
    const items = task.venue_tasks?.length > 0 ? task.venue_tasks : task.vehicle_tasks;
    if (!items || items.length === 0) return 0;
    const completed = items.filter(item => item.release_isActive === '1').length;
    return Math.round((completed / items.length) * 100);
  };

  // Enhanced task card rendering with status
  const renderTaskCard = (task) => (
    <motion.div
      key={task.master_data?.checklist_id || task.reservation_title}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-5 border border-gray-100"
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start space-x-3">
          <h3 className="text-lg font-medium text-gray-900 line-clamp-2">
            {task.reservation_title || 'Untitled Task'}
          </h3>
          <div className="flex flex-col gap-2">
            <span className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full whitespace-nowrap">
              {task.venue?.name || task.vehicle?.vehicle_license || 'General Task'}
            </span>
            <span className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap ${
              filter === 'completed' 
                ? 'bg-green-50 text-green-700'
                : 'bg-amber-50 text-amber-700'
            }`}>
              {filter === 'completed' ? 'Completed' : 'In Progress'}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 text-sm text-gray-600">
          {task.venue && <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {task.venue.name}
          </span>}
          {task.vehicle && <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
            {task.vehicle.vehicle_license}
          </span>}
        </div>
        
        <button
          onClick={() => handleModalOpen(task)}
          className={`w-full py-2.5 px-4 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all duration-300 ${
            filter === 'completed'
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow'
          }`}
        >
          <span>{filter === 'completed' ? 'View Details' : 'Manage Task'}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </motion.div>
  );

  const renderListItem = (task) => (
    <motion.div
      key={task.master_data?.checklist_id || task.reservation_title}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-xl shadow-sm p-4 mb-4 hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between"> 
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {task.reservation_title || 'Untitled Task'}
          </h3>
          <div className="flex flex-col gap-1">
            {task.venue && <p className="text-sm text-gray-500">Venue: {task.venue.name}</p>}
            {task.vehicle && <p className="text-sm text-gray-500">Vehicle: {task.vehicle.vehicle_license}</p>}
          </div>
        </div>
        <div className="flex items-center mt-2 md:mt-0 gap-3">
          <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
            {task.master_data.checklist_type || 'Task'}
          </span>
          {filter === 'completed' ? (
            <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
              Completed
            </span>
          ) : (
            <button
              onClick={() => handleModalOpen(task)}
              className="px-4 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Manage
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );

  // Enhanced modal content
  const renderModalContent = () => (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
      <div className="sticky top-0 bg-white px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedTask?.reservation_title || 'Task Checklist'}
          </h2>
          <p className="text-xs text-gray-500">
            Reservation ID: {selectedTask?.reservation_id}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(false)}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(80vh-120px)]">
        {selectedTask ? (
          <div className="space-y-4">
            {/* Venue Checklist Section */}
            {selectedTask.venue?.checklists?.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-md font-semibold mb-3">
                  Venue: {selectedTask.venue.name}
                </h3>
                <div className="space-y-2">
                  {selectedTask.venue.checklists.map((item) => (
                    <div key={item.checklist_venue_id} 
                         className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.checklist_name || 'Unnamed Item'}</p>
                        </div>
                        <div className="flex gap-4">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name={`venue-${item.checklist_venue_id}`}
                              value="1"
                              checked={item.isChecked === "1"}
                              onChange={() => {
                                handleChecklistUpdate('venue', item.checklist_venue_id, "1");
                              }}
                              className="form-radio h-4 w-4 text-green-600"
                            />
                            <span className="ml-2 text-sm text-green-600">Yes</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name={`venue-${item.checklist_venue_id}`}
                              value="0"
                              checked={item.isChecked === "0"}
                              onChange={() => handleChecklistUpdate('venue', item.checklist_venue_id, "0")}
                              className="form-radio h-4 w-4 text-red-600"
                            />
                            <span className="ml-2 text-sm text-red-600">No</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vehicle Checklist Section */}
            {selectedTask.vehicle?.checklists?.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-md font-semibold mb-3">
                  Vehicle Inspection
                </h3>
                <div className="space-y-2">
                  {selectedTask.vehicle.checklists.map((item) => (
                    <div key={item.checklist_vehicle_id} 
                         className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.checklist_name || 'Unnamed Item'}</p>
                        </div>
                        <div className="flex gap-4">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name={`vehicle-${item.checklist_vehicle_id}`}
                              value="1"
                              checked={item.isChecked === "1"}
                              onChange={() => handleChecklistUpdate('vehicle', item.checklist_vehicle_id, "1")}
                              className="form-radio h-4 w-4 text-green-600"
                            />
                            <span className="ml-2 text-sm text-green-600">Pass</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name={`vehicle-${item.checklist_vehicle_id}`}
                              value="0"
                              checked={item.isChecked === "0"}
                              onChange={() => handleChecklistUpdate('vehicle', item.checklist_vehicle_id, "0")}
                              className="form-radio h-4 w-4 text-red-600"
                            />
                            <span className="ml-2 text-sm text-red-600">Fail</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Equipment Checklist Section */}
            {selectedTask.equipment?.checklists?.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-md font-semibold mb-3">
                  Equipment Inspection
                </h3>
                <div className="space-y-2">
                  {selectedTask.equipment.checklists.map((item) => (
                    <div key={item.checklist_equipment_id} 
                         className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.checklist_name || 'Unnamed Item'}</p>
                        </div>
                        <div className="flex gap-4">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name={`equipment-${item.checklist_equipment_id}`}
                              value="1"
                              checked={item.isChecked === "1"}
                              onChange={() => handleChecklistUpdate('equipment', item.checklist_equipment_id, "1")}
                              className="form-radio h-4 w-4 text-green-600"
                            />
                            <span className="ml-2 text-sm text-green-600">Pass</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name={`equipment-${item.checklist_equipment_id}`}
                              value="0"
                              checked={item.isChecked === "0"}
                              onChange={() => handleChecklistUpdate('equipment', item.checklist_equipment_id, "0")}
                              className="form-radio h-4 w-4 text-red-600"
                            />
                            <span className="ml-2 text-sm text-red-600">Fail</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button Section */}
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitTask}
                disabled={isSubmitting}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">
            Failed to load checklist details
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="flex-1 p-3 sm:p-6 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sticky top-0 z-10 bg-gray-50/80 backdrop-blur-sm pt-2 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
                <div className="flex p-1 bg-white rounded-lg shadow-sm border border-gray-200">
                  <button
                    onClick={() => setFilter('ongoing')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      filter === 'ongoing'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Ongoing
                  </button>
                  <button
                    onClick={() => setFilter('completed')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      filter === 'completed'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Completed
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  className="p-2 rounded-lg bg-white shadow-sm border border-gray-200 hover:bg-gray-50 transition-all"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <div className="flex p-1 bg-white rounded-lg shadow-sm border border-gray-200">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'grid' 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'list' 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content grid with better responsive design */}
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4" 
              : "space-y-4"
            }>
              {currentTasks.map(task => viewMode === 'grid' ? renderTaskCard(task) : renderListItem(task))}
            </div>
          )}

          {/* Pagination */}
          <div className="mt-6 flex justify-center">
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm rounded bg-white border disabled:opacity-50"
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 text-sm rounded ${
                    currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-white border'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm rounded bg-white border disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isModalOpen && selectedTask && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              >
                {renderModalContent()}
              </motion.div>
            )}
          </AnimatePresence>
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </div>
    </div>
  );
};

export default ViewPersonnelTask;
