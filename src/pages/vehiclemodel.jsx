import React, { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast, Toaster } from 'sonner';
import Sidebar from './Sidebar';
import { FaArrowLeft, FaPlus, FaTrash, FaSearch, FaEdit } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { sanitizeInput, validateInput } from '../utils/sanitize';

const VehicleModels = () => {
  const navigate = useNavigate();
  const [models, setModels] = useState([]);
  const [filteredModels, setFilteredModels] = useState([]);
  const [makes, setMakes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ id: '', name: '', makeId: '', categoryId: '' });
  const [showModal, setShowModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user_level_id = localStorage.getItem('user_level_id');
  const [setEditingModel] = useState(null);

  useEffect(() => {
      if (user_level_id !== '1' && user_level_id !== '2' && user_level_id !== '4') {
          localStorage.clear();
          navigate('/gsd');
      }
  }, [user_level_id, navigate]);

  useEffect(() => {
    fetchModels();
    fetchMakes();
    fetchCategories();
  }, []);

  const fetchMakes = async () => {
    try {
      const response = await axios.post('http://localhost/coc/gsd/fetchMaster.php', 
        'operation=fetchMake',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      const data = response.data;
      if (data.status === 'success') {
        setMakes(data.data);
      } else {
        toast.error(`Error fetching makes: ${data.message}`);
      }
    } catch (error) {
      console.error('Error fetching makes:', error);
      toast.error('Error fetching makes.');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.post('http://localhost/coc/gsd/fetchMaster.php', 
        'operation=fetchVehicleCategories',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      const data = response.data;
      if (data.status === 'success') {
        setCategories(data.data);
      } else {
        toast.error(`Error fetching categories: ${data.message}`);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Error fetching categories.');
    }
  };

  const fetchModels = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost/coc/gsd/fetchMaster.php', 
        new URLSearchParams({ operation: 'fetchModels' })
      );
      if (response.data.status === 'success') {
        setModels(response.data.data);
        setFilteredModels(response.data.data);
      } else {
        toast.error(`Error fetching models: ${response.data.message}`);
      }
    } catch (error) {
      toast.error('Error fetching vehicle models.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicleModelById = async (id) => {
    try {
      const response = await axios.post('http://localhost/coc/gsd/fetchMaster.php',
        `operation=fetchModelById&id=${id}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      console.log('API Response:', response.data); // Log the entire response

      if (response.data.status === 'success' && response.data.data.length > 0) {
        const modelData = response.data.data[0];
        console.log('Fetched Model Data:', modelData); // Log the fetched model data
        
        setFormData({
          id: modelData.vehicle_model_id,
          name: modelData.vehicle_model_name,
          makeId: makes.find(make => make.vehicle_make_name === modelData.vehicle_make_name)?.vehicle_make_id || '',
          categoryId: categories.find(category => category.vehicle_category_name === modelData.vehicle_category_name)?.vehicle_category_id || ''
        });
        
        console.log('Form Data after setting:', formData); // Log the form data
        
        setEditMode(true);
        setShowModal(true);
      } else {
        toast.error('Failed to fetch vehicle model details.');
      }
    } catch (error) {
      console.error('Error fetching vehicle model details:', error);
      toast.error('Error fetching vehicle model details.');
    }
  };

  const handleEdit = (id) => {
    fetchVehicleModelById(id);
  };

  const handleDelete = (id) => {
    setSelectedModelId(id);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await axios.post('http://localhost/coc/gsd/delete_master.php', 
        {
          operation: 'deleteModel',
          modelId: selectedModelId
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      if (response.data.status === 'success') {
        setModels(models.filter(model => model.vehicle_model_id !== selectedModelId));
        setFilteredModels(filteredModels.filter(model => model.vehicle_model_id !== selectedModelId));
        toast.success('Vehicle model deleted successfully!');
      } else {
        toast.error(response.data.message || 'Failed to delete vehicle model.');
      }
    } catch (error) {
      toast.error('Error deleting vehicle model.');
    } finally {
      setShowConfirmDelete(false);
    }
  };

  const handleSave = async () => {
    const sanitizedName = sanitizeInput(formData.name);
    
    if (!sanitizedName.trim() || !formData.makeId || !formData.categoryId) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (!validateInput(sanitizedName)) {
      toast.error("Input contains invalid characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const requestData = {
        operation: 'updateVehicleModel',
        modelData: {
          id: formData.id,
          name: sanitizedName,
          make_id: parseInt(formData.makeId),
          category_id: parseInt(formData.categoryId)
        }
      };

      const response = await axios.post('http://localhost/coc/gsd/update_master1.php', 
        requestData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
        toast.success(response.data.message);
        fetchModels();
        closeModal();
      } else {
        toast.error(response.data.message || 'Failed to update vehicle model.');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error updating vehicle model.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setFormData({ id: '', name: '', makeId: '', categoryId: '' });
    setEditingModel(null);
  };

  const handleSearchChange = (e) => {
    const searchTerm = sanitizeInput(e.target.value.toLowerCase());
    const results = models.filter(model =>
      model.vehicle_model_name.toLowerCase().includes(searchTerm) ||
      model.vehicle_make_name.toLowerCase().includes(searchTerm) ||
      model.vehicle_category_name.toLowerCase().includes(searchTerm)
    );
    setFilteredModels(results);
  };

  const handleAddModel = () => {
    setFormData({ id: '', name: '', makeId: '', categoryId: '' });
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
        <h2 className="text-4xl font-bold mb-6 text-green-800 drop-shadow-lg">Vehicle Models</h2>
        <div className="bg-white bg-opacity-90 rounded-lg shadow-xl p-6 mb-6 backdrop-filter backdrop-blur-lg">
          <div className="flex flex-col md:flex-row items-center justify-between mb-4">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="relative w-full md:w-64 mb-4 md:mb-0"
            >
              <input
                type="text"
                onChange={handleSearchChange}
                placeholder="Search models"
                className="w-full pl-10 pr-4 py-2 rounded-full border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400" />
            </motion.div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddModel}
              className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center shadow-md"
            >
              <FaPlus className="mr-2" /> Add Model
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
                    <th className="py-3 px-4 text-left">Make</th>
                    <th className="py-3 px-4 text-left">Category</th>
                    <th className="py-3 px-4 text-center rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm font-light">
                  <AnimatePresence>
                    {filteredModels.map((model) => (
                      <motion.tr 
                        key={model.vehicle_model_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b border-green-200 hover:bg-green-50 transition-colors duration-200"
                      >
                        <td className="py-3 px-4">{model.vehicle_model_name}</td>
                        <td className="py-3 px-4">{model.vehicle_make_name}</td>
                        <td className="py-3 px-4">{model.vehicle_category_name}</td>
                        <td className="py-3 px-4 text-center">
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(model.vehicle_model_id)}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-full transition duration-300 ease-in-out mr-2"
                          >
                            <FaTrash />
                          </motion.button>
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEdit(model.vehicle_model_id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded-full transition duration-300 ease-in-out"
                          >
                            <FaEdit />
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

        <Modal show={showModal} onHide={closeModal}>
          <Modal.Header closeButton>
            <Modal.Title>{editMode ? 'Edit Vehicle Model' : 'Add New Vehicle Model'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group controlId="formModelName">
                <Form.Label>Name:</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Form.Group>
              <Form.Group controlId="formMakeSelect">
                <Form.Label>Select Make:</Form.Label>
                <Form.Control 
                  as="select" 
                  value={formData.makeId} 
                  onChange={(e) => setFormData({ ...formData, makeId: e.target.value })}
                >
                  <option value="">Select a make...</option>
                  {makes.map((make) => (
                    <option key={make.vehicle_make_id} value={make.vehicle_make_id}>
                      {make.vehicle_make_name}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
              <Form.Group controlId="formCategorySelect">
                <Form.Label>Select Category:</Form.Label>
                <Form.Control 
                  as="select" 
                  value={formData.categoryId} 
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                >
                  <option value="">Select a category...</option>
                  {categories.map((category) => (
                    <option key={category.vehicle_category_id} value={category.vehicle_category_id}>
                      {category.vehicle_category_name}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal}>
              Close
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showConfirmDelete} onHide={() => setShowConfirmDelete(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Deletion</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Are you sure you want to delete this vehicle model?</p>
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

        <Toaster />
      </motion.div>
    </div>
  );
};

export default VehicleModels;
