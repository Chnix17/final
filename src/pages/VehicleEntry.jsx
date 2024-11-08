import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { FaPlus, FaTrash, FaSearch, FaCar } from 'react-icons/fa';
import { toast } from 'sonner';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../vehicle.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const VehicleEntry = () => {
    const [vehicles, setVehicles] = useState([]);
    const [filteredVehicles, setFilteredVehicles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [makes, setMakes] = useState([]);
    const [modelsByCategory, setModelsByCategory] = useState({});
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [vehicleLicensed, setVehicleLicensed] = useState('');
    const [makeId, setMakeId] = useState('');
    const [vehicleModelId, setVehicleModelId] = useState('');
    const [category, setCategory] = useState('');
    const [selectedVehicleId, setSelectedVehicleId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const navigate = useNavigate();
    const BASE_URL = "http://localhost/coc/gsd/user.php";
    const user_id = localStorage.getItem('user_id');

    useEffect(() => {
        if (user_id !== '100' && user_id !== '1' && user_id !== '4') {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [user_id, navigate]);

    useEffect(() => {
        fetchVehicles();
        fetchMakes();
        fetchCategoriesAndModels();
    }, []);

    const fetchVehicles = async () => {
        setLoading(true);
        try {
            const response = await axios.post(BASE_URL, new URLSearchParams({ operation: "fetchAllVehicles" }));
            if (response.data.status === 'success') {
                setVehicles(response.data.data);
                setFilteredVehicles(response.data.data);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchMakes = async () => {
        try {
            const response = await axios.post(BASE_URL, new URLSearchParams({ operation: "fetchMake" }));
            if (response.data.status === 'success') {
                setMakes(response.data.data);
                return response.data.data;
            } else {
                toast.error(response.data.message);
                return [];
            }
        } catch (error) {
            toast.error(error.message);
            return [];
        }
    };

    const getVehicleById = async (id) => {
        try {
            const response = await axios.post("http://localhost/coc/gsd/fetchMaster.php", new URLSearchParams({ operation: "fetchVehicleById", id }));
            if (response.data.status === 'success' && response.data.data.length > 0) {
                const vehicle = response.data.data[0];
                setEditingVehicle(vehicle);
                setVehicleLicensed(vehicle.vehicle_license);
                const makesData = await fetchMakes();
                const selectedMake = makesData.find(make => make.vehicle_make_name === vehicle.vehicle_make_name);
                if (selectedMake) {
                    setMakeId(selectedMake.vehicle_make_id);
                    await fetchCategoriesAndModels(selectedMake.vehicle_make_id);
                }
            } else {
                toast.error("Failed to fetch vehicle details");
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    useEffect(() => {
        if (editingVehicle && categories.length > 0) {
            const selectedCategory = categories.find(cat => cat.vehicle_category_name === editingVehicle.vehicle_category_name);
            if (selectedCategory) {
                setCategory(selectedCategory.vehicle_category_id);
                
                const models = modelsByCategory[selectedCategory.vehicle_category_id] || [];
                const selectedModel = models.find(model => model.vehicle_model_name === editingVehicle.vehicle_model_name);
                if (selectedModel) {
                    setVehicleModelId(selectedModel.vehicle_model_id);
                }
            }
        }
    }, [editingVehicle, categories, modelsByCategory]);

    const handleEditVehicle = (vehicle) => {
        setSelectedVehicleId(vehicle.vehicle_id);
        getVehicleById(vehicle.vehicle_id);
        setShowEditModal(true);
    };

    const handleAddVehicle = () => {
        resetForm();
        setSelectedVehicleId(null);
        setShowAddModal(true);
    };

    const resetForm = () => {
        setVehicleLicensed('');
        setMakeId('');
        setCategory('');
        setVehicleModelId('');
        setCategories([]);
        setModelsByCategory({});
        setSelectedVehicleId(null);
    };

    const handleSubmit = async () => {
        if (!vehicleModelId || !vehicleLicensed) {
            toast.error("Please fill in all required fields.");
            return;
        }
    
        const jsonData = {
            vehicle_model_id: vehicleModelId,
            vehicle_license: vehicleLicensed,
           
            vehicle_id: selectedVehicleId || undefined,
        };
    
        setIsSubmitting(true);
    
        try {
            let response;

            if (selectedVehicleId) {
                response = await axios.post("http://localhost/coc/gsd/update_master1.php", new URLSearchParams({
                    ...jsonData,
                    operation: "updateVehicle", // Operation specifically for update
                }));
            } else {
                response = await axios.post("http://localhost/coc/gsd/insert_master.php", new URLSearchParams({
                    ...jsonData,
                    operation: "saveVehicle", // Operation specifically for save
                }));
            }
    
            if (response.data.status === 'success') {
                toast.success(response.data.message);
                resetForm();
                setShowAddModal(false);
                setShowEditModal(false);
                fetchVehicles();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteVehicle = async (vehicle) => {
        if (window.confirm("Are you sure you want to delete this vehicle?")) {
            try {
                const response = await axios.post("http://localhost/coc/gsd/delete_master.php", new URLSearchParams({
                    operation: "deleteVehicle",
                    vehicle_id: vehicle.vehicle_id,
                }));
                if (response.data.status === 'success') {
                    toast.success("Vehicle successfully deleted!");
                    fetchVehicles();
                } else {
                    toast.error(response.data.message);
                }
            } catch (error) {
                toast.error(error.message);
            }
        }
    };

    const handleMakeChange = async (e) => {
        const selectedMakeId = e.target.value;
        setMakeId(selectedMakeId);
        setCategory(''); // Reset category when make changes
        setVehicleModelId(''); // Reset model when make changes
        if (selectedMakeId) {
            await fetchCategoriesAndModels(selectedMakeId);
        } else {
            setCategories([]);
            setModelsByCategory({});
        }
    };

    const handleCategoryChange = (e) => {
        const selectedCategoryId = e.target.value;
        setCategory(selectedCategoryId);
        setVehicleModelId(''); // Reset model when category changes
    };

    const fetchCategoriesAndModels = async (makeId) => {
        if (!makeId) return;
        try {
            const response = await axios.post(BASE_URL, new URLSearchParams({ 
                operation: "fetchCategoriesAndModels",
                make_id: makeId
            }));
            if (response.data.status === 'success') {
                setCategories(response.data.data.categories);
                setModelsByCategory(response.data.data.modelsByCategory);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleSearchChange = (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const results = vehicles.filter(vehicle =>
            vehicle.vehicle_model_name && vehicle.vehicle_model_name.toLowerCase().includes(searchTerm)
        );
        setFilteredVehicles(results);
    };
    const handleCloseModal = () => {
        resetForm();
        setShowAddModal(false);
        setShowEditModal(false);
        setEditingVehicle(null);
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-white to-green-500">
            <Sidebar />
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex-grow p-6 lg:p-10"
            >
                <h2 className="text-4xl font-bold mb-6 text-green-800 drop-shadow-lg">Vehicle Entry</h2>
                <div className="bg-white bg-opacity-90 rounded-lg shadow-xl p-6 mb-6 backdrop-filter backdrop-blur-lg">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-4">
                        <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="relative w-full md:w-64 mb-4 md:mb-0"
                        >
                            <input
                                type="text"
                                onChange={handleSearchChange}
                                placeholder="Search by model name"
                                className="w-full pl-10 pr-4 py-2 rounded-full border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                            />
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400" />
                        </motion.div>
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleAddVehicle}
                            className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center shadow-md"
                        >
                            <FaPlus className="mr-2" /> Add Vehicle
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
                                        <th className="py-3 px-4 text-left rounded-tl-lg">Make Name</th>
                                        <th className="py-3 px-4 text-left">Category</th>
                                        <th className="py-3 px-4 text-left">Model</th>
                                        <th className="py-3 px-4 text-left">License</th>
                                        <th className="py-3 px-4 text-center rounded-tr-lg">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-600 text-sm font-light">
                                    <AnimatePresence>
                                        {filteredVehicles.map((vehicle) => (
                                            <motion.tr 
                                                key={vehicle.vehicle_id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="border-b border-green-200 hover:bg-green-50 transition-colors duration-200"
                                            >
                                                <td className="py-3 px-4">{vehicle.vehicle_make_name || 'N/A'}</td>
                                                <td className="py-3 px-4">{vehicle.vehicle_category_name || 'N/A'}</td>
                                                <td className="py-3 px-4">{vehicle.vehicle_model_name || 'N/A'}</td>
                                                <td className="py-3 px-4">{vehicle.vehicle_license || 'N/A'}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <motion.button 
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleDeleteVehicle(vehicle)}
                                                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-full transition duration-300 ease-in-out mr-2"
                                                    >
                                                        <FaTrash />
                                                    </motion.button>
                                                    <motion.button 
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleEditVehicle(vehicle)}
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

            {/* Add Vehicle Modal */}
            <Modal show={showAddModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton className="bg-green-600 text-white">
                    <Modal.Title><FaCar className="inline-block mr-2" /> Add Vehicle</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-green-50">
                    <div className="flex flex-col gap-4">
                        <div>
                            <label htmlFor="make" className="block mb-2 font-semibold">Make</label>
                            <select
                                id="make"
                                value={makeId}
                                onChange={handleMakeChange}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select Make</option>
                                {makes.map(make => (
                                    <option key={make.vehicle_make_id} value={make.vehicle_make_id}>
                                        {make.vehicle_make_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="category" className="block mb-2 font-semibold">Category</label>
                            <select
                                id="category"
                                value={category}
                                onChange={handleCategoryChange}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={!makeId}
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.vehicle_category_id} value={cat.vehicle_category_id}>
                                        {cat.vehicle_category_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="model" className="block mb-2 font-semibold">Model</label>
                            <select
                                id="model"
                                value={vehicleModelId}
                                onChange={e => setVehicleModelId(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={!category}
                            >
                                <option value="">Select Model</option>
                                {modelsByCategory[category]?.map(model => (
                                    <option key={model.vehicle_model_id} value={model.vehicle_model_id}>
                                        {model.vehicle_model_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="license" className="block mb-2 font-semibold">License</label>
                            <input
                                type="text"
                                id="license"
                                value={vehicleLicensed}
                                onChange={e => setVehicleLicensed(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer className="bg-green-50">
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Edit Vehicle Modal */}
            <Modal show={showEditModal} onHide={handleCloseModal} centered>
    <Modal.Header closeButton className="bg-green-600 text-white">
        <Modal.Title><FaCar className="inline-block mr-2" /> Edit Vehicle</Modal.Title>
    </Modal.Header>
    <Modal.Body className="bg-green-50">
        <div className="flex flex-col gap-4">
            <div>
                <label htmlFor="make" className="block mb-2 font-semibold">Make</label>
                <select
                    id="make"
                    value={makeId}
                    onChange={handleMakeChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Select Make</option>
                    {makes.map(make => (
                        <option key={make.vehicle_make_id} value={make.vehicle_make_id}>
                            {make.vehicle_make_name}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="category" className="block mb-2 font-semibold">Category</label>
                <select
                    id="category"
                    value={category}
                    onChange={handleCategoryChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!makeId}
                >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                        <option key={cat.vehicle_category_id} value={cat.vehicle_category_id}>
                            {cat.vehicle_category_name}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="model" className="block mb-2 font-semibold">Model</label>
                <select
                    id="model"
                    value={vehicleModelId}
                    onChange={e => setVehicleModelId(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!category}
                >
                    <option value="">Select Model</option>
                    {modelsByCategory[category]?.map(model => (
                        <option key={model.vehicle_model_id} value={model.vehicle_model_id}>
                            {model.vehicle_model_name}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="license" className="block mb-2 font-semibold">License</label>
                <input
                    type="text"
                    id="license"
                    value={vehicleLicensed}
                    onChange={e => setVehicleLicensed(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
        </div>
    </Modal.Body>
    <Modal.Footer className="bg-green-50">
        <Button variant="secondary" onClick={handleCloseModal}>
            Close
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
    </Modal.Footer>
</Modal>

        </div>
    );
};

export default VehicleEntry;
