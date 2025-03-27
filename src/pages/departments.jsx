import React, { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast, Toaster } from 'sonner';
import Sidebar from './Sidebar';
import { FaArrowLeft, FaPlus, FaTrash, FaSearch, FaBuilding } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { sanitizeInput, validateInput } from '../utils/sanitize';

const Departments = () => {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState([]);
    const [filteredDepartments, setFilteredDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ id: '', name: '' });
    const [showModal, setShowModal] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const user_level_id = localStorage.getItem('user_level_id');

    useEffect(() => {
        if (user_level_id !== '1' && user_level_id !== '2' && user_level_id !== '4') {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [user_level_id, navigate]);

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost/coc/gsd/fetchMaster.php', new URLSearchParams({ operation: 'fetchDepartments' }));
            if (response.data.status === 'success') {
                setDepartments(response.data.data);
                setFilteredDepartments(response.data.data);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error('Error fetching departments');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (id) => {
        const departmentToEdit = departments.find((dept) => dept.departments_id === id);
        if (departmentToEdit) {
            setFormData({ id: departmentToEdit.departments_id, name: departmentToEdit.departments_name });
            setEditMode(true);
            setShowModal(true);
        }
    };

    const handleDelete = (id) => {
        setSelectedDepartmentId(id);
        setShowConfirmDelete(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await axios.post('http://localhost/coc/gsd/delete_master.php', 
                {
                    operation: 'deleteDepartment',
                    departmentId: selectedDepartmentId  // Changed from department_id to departmentId
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            if (response.data.status === 'success') {
                setDepartments(departments.filter(dept => dept.departments_id !== selectedDepartmentId));
                setFilteredDepartments(filteredDepartments.filter(dept => dept.departments_id !== selectedDepartmentId));
                toast.success('Department deleted successfully!');
            } else {
                toast.error(response.data.message || 'Failed to delete department.');
            }
        } catch (error) {
            toast.error('Error deleting department.');
        } finally {
            setShowConfirmDelete(false);
        }
    };

    const handleSave = async () => {
        const sanitizedName = sanitizeInput(formData.name);
        if (!sanitizedName.trim()) {
            toast.error("Please enter a department name.");
            return;
        }
        
        if (!validateInput(sanitizedName)) {
            toast.error("Invalid characters in department name.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await axios.post('http://localhost/coc/gsd/update_master1.php', 
                {
                    operation: 'updateDepartment',
                    id: formData.id,
                    name: sanitizedName.trim()
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.status === 'success') {
                setDepartments(departments.map(dept => 
                    dept.departments_id === formData.id ? { ...dept, departments_name: sanitizedName.trim() } : dept
                ));
                setFilteredDepartments(filteredDepartments.map(dept => 
                    dept.departments_id === formData.id ? { ...dept, departments_name: sanitizedName.trim() } : dept
                ));
                toast.success('Department updated successfully!');
                closeModal();
            } else {
                toast.error(response.data.message || 'Failed to update department.');
            }
        } catch (error) {
            console.error('Error updating department:', error);
            toast.error('Error updating department.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditMode(false);
        setFormData({ id: '', name: '' });
    };

    const handleSearchChange = (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const results = departments.filter(dept =>
            dept.departments_name.toLowerCase().includes(searchTerm)
        );
        setFilteredDepartments(results);
    };

    const handleAddDepartment = () => {
        setFormData({ id: '', name: '' });
        setEditMode(false);
        setShowModal(true);
    };

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
                <h2 className="text-4xl font-bold mb-6 text-green-800 drop-shadow-lg">Departments</h2>
                <div className="bg-white bg-opacity-90 rounded-lg shadow-xl p-6 mb-6 backdrop-filter backdrop-blur-lg">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-4">
                        <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="relative w-full md:w-64 mb-4 md:mb-0"
                        >
                            <input
                                type="text"
                                onChange={handleSearchChange}
                                placeholder="Search by department name"
                                className="w-full pl-10 pr-4 py-2 rounded-full border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                            />
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400" />
                        </motion.div>
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleAddDepartment}
                            className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center shadow-md"
                        >
                            <FaPlus className="mr-2" /> Add Department
                        </motion.button>
                    </div>
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
                                        {filteredDepartments.map((department) => (
                                            <motion.tr 
                                                key={department.departments_id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="border-b border-green-200 hover:bg-green-50 transition-colors duration-200"
                                            >
                                                <td className="py-3 px-4">{department.departments_name}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <motion.button 
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleDelete(department.departments_id)}
                                                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-full transition duration-300 ease-in-out mr-2"
                                                    >
                                                        <FaTrash />
                                                    </motion.button>
                                                    <motion.button 
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleEdit(department.departments_id)}
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

            {/* Add/Edit Department Modal */}
            <Modal show={showModal} onHide={closeModal} centered>
                <Modal.Header closeButton className="bg-green-600 text-white">
                    <Modal.Title><FaBuilding className="inline-block mr-2" /> {editMode ? 'Edit' : 'Add'} Department</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-green-50">
                    <Form>
                        <Form.Group controlId="formDepartmentName">
                            <Form.Label>Name:</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: sanitizeInput(e.target.value) })}
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
                    <p>Are you sure you want to delete this department?</p>
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

export default Departments;
