import React, { useEffect, useState, useMemo } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast, Toaster } from 'sonner';
import Sidebar from './Sidebar';
import { FaArrowLeft, FaTrash, FaCar } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { sanitizeInput, validateInput } from '../utils/sanitize';

const VehicleMakes = () => {
  const navigate = useNavigate();
  const [makes, setMakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ id: '', name: '' });
  const [showModal, setShowModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedMakeId, setSelectedMakeId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user_level_id = localStorage.getItem('user_level_id');


  useEffect(() => {
      if (user_level_id !== '1' && user_level_id !== '2' && user_level_id !== '4') {
          localStorage.clear();
          navigate('/gsd');
      }
  }, [user_level_id, navigate]);

  useEffect(() => {
    const fetchMakes = async () => {
      try {
        const response = await fetch('http://localhost/coc/gsd/fetchMaster.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ operation: 'fetchMake' }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        if (data.status === 'success') {
          setMakes(data.data);
        } else {
          console.error(data.message);
        }
      } catch (error) {
        console.error('Error fetching vehicle makes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMakes();
  }, []);

  const filteredMakes = useMemo(() => {
    return makes.filter(make => 
      make.vehicle_make_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [makes, searchTerm]);

  const handleEdit = (id) => {
    const makeToEdit = makes.find((make) => make.vehicle_make_id === id);
    if (makeToEdit) {
      setFormData({ id: makeToEdit.vehicle_make_id, name: makeToEdit.vehicle_make_name });
      setEditMode(true);
      setShowModal(true);
    }
  };

  const handleDelete = (id) => {
    setSelectedMakeId(id);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch('http://localhost/coc/gsd/delete_master.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          operation: 'deleteVehicleMake', 
          vehicle_make_id: selectedMakeId 
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setMakes(makes.filter(make => make.vehicle_make_id !== selectedMakeId));
        toast.success('Vehicle make deleted successfully!');
      } else {
        toast.error(data.message || 'Failed to delete vehicle make.');
      }
    } catch (error) {
      console.error('Error deleting vehicle make:', error);
      toast.error('Error deleting vehicle make.');
    } finally {
      setShowConfirmDelete(false);
    }
  };

  const handleSave = async () => {
    const sanitizedName = sanitizeInput(formData.name);
    
    if (!sanitizedName.trim()) {
      toast.error("Please enter a make name.");
      return;
    }

    if (!validateInput(sanitizedName)) {
      toast.error("Input contains invalid characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost/coc/gsd/update_master1.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ operation: 'updateVehicleMake', id: formData.id, name: sanitizedName }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setMakes(makes.map(make => make.vehicle_make_id === formData.id ? { ...make, vehicle_make_name: formData.name } : make));
        toast.success('Vehicle make updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update vehicle make.');
      }
    } catch (error) {
      console.error('Error updating vehicle make:', error);
      toast.error('Error updating vehicle make.');
    } finally {
      setIsSubmitting(false);
      closeModal();
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setFormData({ id: '', name: '' });
  };

  if (loading) {
    return <div className="text-center text-xl">Loading...</div>;
  }

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-white to-green-100">
            <Sidebar />
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex-grow p-6 lg:p-10"
            >
                <div className="mb-4">
                    <Button variant="link" onClick={() => navigate('/Master')} className="text-green-800">
                        <FaArrowLeft className="mr-2" /> Back to Master
                    </Button>
                </div>
                <h2 className="text-4xl font-bold mb-6 text-green-800 drop-shadow-lg">Vehicle Makes</h2>
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search makes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="p-2 border rounded"
                    />
                </div>
                <div className="bg-white bg-opacity-90 rounded-lg shadow-xl p-6 mb-6 backdrop-filter backdrop-blur-lg">
                    
                    {loading ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex justify-center items-center h-64"
                        >
                            <div className="loader"></div>
                        </motion.div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full table-auto">
                                <thead>
                                    <tr className="bg-green-600 text-white">
                                        <th className="py-3 px-4 text-left rounded-tl-lg">Name</th>
                                        <th className="py-3 px-4 text-center rounded-tr-lg">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-600 text-sm font-light">
                                    <AnimatePresence>
                                        {filteredMakes.map((make) => (
                                            <motion.tr 
                                                key={make.vehicle_make_id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="border-b border-green-200 hover:bg-green-50 transition-colors duration-200"
                                            >
                                                <td className="py-3 px-4">{make.vehicle_make_name}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <motion.button 
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleDelete(make.vehicle_make_id)}
                                                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-full transition duration-300 ease-in-out mr-2"
                                                    >
                                                        <FaTrash />
                                                    </motion.button>
                                                    <motion.button 
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleEdit(make.vehicle_make_id)}
                                                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-full transition duration-300 ease-in-out"
                                                    >
                                                        Edit
                                                    </motion.button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Add/Edit Vehicle Make Modal */}
            <Modal show={showModal} onHide={closeModal} centered>
                <Modal.Header closeButton className="bg-green-600 text-white">
                    <Modal.Title><FaCar className="inline-block mr-2" /> {editMode ? 'Edit' : 'Add'} Vehicle Make</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-green-50">
                    <Form>
                        <Form.Group controlId="formMakeName">
                            <Form.Label>Name:</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer className="bg-green-50">
                    <Button variant="secondary" onClick={closeModal}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleSave} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Confirm Delete Modal */}
            <Modal show={showConfirmDelete} onHide={() => setShowConfirmDelete(false)} centered>
                <Modal.Header closeButton className="bg-red-600 text-white">
                    <Modal.Title>Confirm Deletion</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure you want to delete this vehicle make?</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConfirmDelete(false)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmDelete}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>

            <Toaster position="top-right" />
        </div>
    );
};

export default VehicleMakes;
