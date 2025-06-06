import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faSearch, faPlus, faUser } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { motion, AnimatePresence } from 'framer-motion';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import "primereact/resources/themes/lara-light-indigo/theme.css";  // theme
import "primereact/resources/primereact.css";     // core css
import "primeicons/primeicons.css";               // icons
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import { Divider } from 'primereact/divider';
import { Chip } from 'primereact/chip';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';

const generateAvatarColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
        '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#34495e',
        '#16a085', '#27ae60', '#2980b9', '#8e44ad', '#2c3e50',
        '#f1c40f', '#e67e22', '#e74c3c', '#95a5a6', '#f39c12',
        '#d35400', '#c0392b', '#7f8c8d'
    ];
    return colors[Math.abs(hash) % colors.length];
};

const Faculty = () => {
    const user_level_id = localStorage.getItem('user_level_id');
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [userLevels, setUserLevels] = useState([]); // Add this new state for user levels
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalState, setModalState] = useState({ isOpen: false, type: '', user: null });
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        'users_fname': { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        'users_lname': { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        'departments_name': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'users_school_id': { value: null, matchMode: FilterMatchMode.CONTAINS },
    });

    // Add this new state for role filter
    const [selectedRole, setSelectedRole] = useState('');

    // Add this function to filter by role
    const handleRoleFilter = (role) => {
        setSelectedRole(role);
    };

    const navigate = useNavigate();
    const user_id = localStorage.getItem('user_id');

  

    useEffect(() => {
        if (user_level_id !== '1' && user_level_id !== '2' && user_level_id !== '4') {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [user_level_id, navigate]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axios.post("http://localhost/coc/gsd/user.php", 
                { operation: "fetchAdmin" },  // Send as JSON object
                { 
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            if (response.data.status === 'success') {
                // Transform admin data to match the expected structure
                const transformedData = response.data.data.map(admin => ({
                    users_id: admin.admin_id,
                    users_fname: admin.admin_fname,
                    users_mname: admin.admin_mname,
                    users_lname: admin.admin_lname,
                    users_email: admin.admin_email,
                    users_school_id: admin.admin_school_id,
                    users_contact_number: admin.admin_contact_number,
                    users_user_level_id: admin.admin_user_level_id,
                    users_pic: admin.admin_pic,
                    departments_id: admin.admin_department_id,
                    // Add any other fields needed for display
                }));
                setUsers(transformedData);
            } else {
                toast.error("Error fetching users: " + response.data.message);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error("An error occurred while fetching users.");
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const response = await axios({
                method: 'post',
                url: 'http://localhost/coc/gsd/fetchMaster.php',
                data: new URLSearchParams({
                    operation: 'fetchDepartments'
                }).toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
    
            console.log('Department response:', response.data); // Debug log
    
            if (response.data && Array.isArray(response.data.data)) {
                setDepartments(response.data.data);
            } else {
                console.error('Invalid department data:', response.data);
                toast.error("Invalid department data format");
            }
        } catch (error) {
            console.error('Department fetch error:', error);
            toast.error(error.response?.data?.message || "Failed to fetch departments");
        } finally {
            setLoading(false);
        }
    };
    
    // Add this new function after other fetch functions
    const fetchUserLevels = async () => {
        try {
            const response = await axios({
                method: 'post',
                url: 'http://localhost/coc/gsd/fetchMaster.php',
                data: new URLSearchParams({
                    operation: 'fetchUserLevels'
                }).toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (response.data && Array.isArray(response.data.data)) {
                setUserLevels(response.data.data);
            } else {
                console.error('Invalid user level data:', response.data);
                toast.error("Invalid user level data format");
            }
        } catch (error) {
            console.error('User level fetch error:', error);
            toast.error("Failed to fetch user levels");
        }
    };

    const getUserDetails = async (userId) => {
        try {
            const response = await axios({
                method: 'post',
                url: 'http://localhost/coc/gsd/fetchMaster.php',
                data: new URLSearchParams({
                    operation: 'fetchUsersById',
                    id: userId
                }).toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (response.data.status === 'success') {
                return response.data.data[0];
            } else {
                throw new Error('Failed to fetch user details');
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
            toast.error("Failed to fetch user details");
            return null;
        }
    };

    // Add to useEffect
    useEffect(() => {
        fetchDepartments();
        fetchUsers();
        fetchUserLevels(); // Add this line
    }, []);

    useEffect(() => {
        fetchUsers();
    }, []); // Add this useEffect to fetch users on mount

    const handleSubmit = async (jsonData) => {
        const operation = jsonData.data.users_id ? "updateUser" : "saveUser";
        setLoading(true);
        try {
            const url = "http://localhost/coc/gsd/insert_master.php";
            
            const response = await axios.post(url, jsonData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Server Response:', response.data);

            if (response.data.status === 'success') {
                toast.success(`Faculty successfully ${operation === 'updateUser' ? 'updated' : 'added'}!`);
                fetchUsers();
                setModalState({ isOpen: false, type: '', user: null });
            } else {
                throw new Error(response.data.message || "Unknown error");
            }
        } catch (error) {
            console.error('Error details:', error);
            toast.error(`Failed to ${operation === 'updateUser' ? 'update' : 'add'} faculty: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = async (userId) => {
        try {
            const response = await axios.post("http://localhost/coc/gsd/delete_master.php", 
                new URLSearchParams({ 
                    operation: "deleteUser",
                    user_id: userId
                }),
                { headers: { 'Content-Type': 'application/json' } }
            );
            if (response.data.status === 'success') {
                toast.success("Faculty deleted successfully!");
                fetchUsers();
            } else {
                toast.error("Error deleting faculty: " + response.data.message);
            }
        } catch (error) {
            toast.error("An error occurred while deleting the faculty.");
        } finally {
            setModalState({ isOpen: false, type: '', user: null });
        }
    };

    const filteredUsers = users?.filter(user =>
        (user?.users_fname + ' ' + user?.users_lname)?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];  // Add null checks and provide empty array fallback

    const imageBodyTemplate = (rowData) => {
        if (rowData.users_pic) {
            return (
                <div className="relative w-12 h-12">
                    <img 
                        src={`http://localhost/coc/gsd/${rowData.users_pic}`}
                        alt={rowData.users_name}
                        className="w-full h-full rounded-full object-cover"
                        onError={() => {
                            const initials = `${rowData.users_fname?.[0] || ''}${rowData.users_lname?.[0] || ''}`.toUpperCase();
                            const bgColor = generateAvatarColor(initials);
                            const imgElement = document.getElementById(`user-img-${rowData.users_id}`);
                            if (imgElement) {
                                imgElement.style.display = 'none';
                                const parent = imgElement.parentElement;
                                const fallbackDiv = document.createElement('div');
                                fallbackDiv.className = 'w-full h-full rounded-full flex items-center justify-center text-white font-bold text-lg';
                                fallbackDiv.style.backgroundColor = bgColor;
                                fallbackDiv.textContent = initials;
                                parent.appendChild(fallbackDiv);
                            }
                        }}
                        id={`user-img-${rowData.users_id}`}
                    />
                </div>
            );
        }
    
        const initials = `${rowData.users_fname?.[0] || ''}${rowData.users_lname?.[0] || ''}`.toUpperCase();
        const bgColor = generateAvatarColor(initials);
    
        return (
            <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: bgColor }}
            >
                {initials}
            </div>
        );
    };

    const actionsBodyTemplate = (rowData) => {
        const handleEditClick = async () => {
            const userDetails = await getUserDetails(rowData.users_id);
            if (userDetails) {
                setModalState({ isOpen: true, type: 'edit', user: userDetails });
            }
        };

        return (
            <div className="flex gap-2" key={`actions-${rowData.users_id}`}>
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleEditClick}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-full"
                >
                    <FontAwesomeIcon icon={faEdit} />
                </motion.button>
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setModalState({ isOpen: true, type: 'delete', user: rowData })}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-full"
                >
                    <FontAwesomeIcon icon={faTrashAlt} />
                </motion.button>
            </div>
        );
    };

    const userLevelTemplate = (rowData) => {
        const levelConfig = {
            'Admin': { color: 'bg-purple-500', icon: 'pi pi-star' },
            'Faculty': { color: 'bg-blue-500', icon: 'pi pi-users' },
            'Staff': { color: 'bg-green-500', icon: 'pi pi-user' }
        };
        const config = levelConfig[rowData.user_level_name] || { color: 'bg-gray-500', icon: 'pi pi-user' };
        
        return (
            <Chip
                key={`level-${rowData.users_id}`}
                icon={`${config.icon}`}
                label={rowData.user_level_name}
                className={`${config.color} text-white`}
            />
        );
    };

    const departmentTemplate = (rowData) => {
        return (
            <Chip
                key={`dept-${rowData.users_id}`}
                icon="pi pi-building"
                label={rowData.departments_name}
                className="bg-teal-500 text-white"
            />
        );
    };

    const header = (
        <div className="flex flex-col gap-6">
            {/* Header Title Section */}
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-50 rounded-full">
                        <FontAwesomeIcon icon={faUser} className="text-2xl text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 m-0">Faculty Management</h2>
                        <p className="text-gray-500 text-sm mt-1">Manage your faculty members here</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {/* Role Filter Dropdown */}
                    <select
                        className="p-2 border rounded-lg"
                        value={selectedRole}
                        onChange={(e) => handleRoleFilter(e.target.value)}
                    >
                        <option value="">All Roles</option>
                        <option value="Admin">Admin</option>
                        <option value="Faculty">Faculty</option>
                        <option value="Staff">Staff</option>
                    </select>
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setModalState({ isOpen: true, type: 'add', user: null })}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center gap-2 shadow-sm transition-all"
                    >
                        <FontAwesomeIcon icon={faPlus} className="text-sm" />
                        <span>Add Faculty</span>
                    </motion.button>
                </div>
            </div>

            <Divider className="my-0" />

            
        </div>
    );

    // Modify the DataTable value prop to include role filtering
    const filteredData = selectedRole 
        ? users.filter(user => user.user_level_name === selectedRole)
        : users;

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
            <Sidebar />
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex-grow p-6 lg:p-8 overflow-hidden"
            >
                <Card className="shadow-md border-0">
                    <DataTable
                        value={filteredData}
                        paginator
                        rows={10}
                        dataKey="users_id"
                        filters={filters}
                        filterDisplay="row"
                        loading={loading}
                        header={header}
                        emptyMessage={
                            <div className="text-center py-8">
                                <i className="pi pi-search text-gray-300 text-4xl mb-4"></i>
                                <p className="text-gray-500">No faculty members found</p>
                            </div>
                        }
                        className="p-datatable-users"
                        responsiveLayout="scroll"
                        showGridlines
                        stripedRows
                        size="small"
                        tableStyle={{ minWidth: '50rem' }}
                        rowClassName="hover:bg-gray-50 transition-colors duration-200"
                    >
                        <Column 
                            key="photo"
                            header="Photo" 
                            body={imageBodyTemplate} 
                            style={{ width: '100px' }}
                            className="text-center"
                        />
                        <Column 
                            key="school_id"
                            field="users_school_id" 
                            header="School ID" 
                            filter 
                            filterPlaceholder="Search ID"
                            sortable 
                            className="font-semibold"
                        />
                        <Column 
                            key="first_name"
                            field="users_fname" 
                            header="First Name" 
                            filter 
                            filterPlaceholder="Search first name"
                            sortable 
                        />
                        <Column 
                            key="last_name"
                            field="users_lname" 
                            header="Last Name" 
                            filter 
                            filterPlaceholder="Search last name"
                            sortable 
                        />
                        <Column 
                            key="department"
                            field="departments_name" 
                            header="Department" 
                            body={departmentTemplate}
                            filter 
                            filterPlaceholder="Search department"
                            sortable 
                        />
                        <Column 
                            key="role"
                            field="user_level_name" 
                            header="Role" 
                            body={userLevelTemplate}
                            sortable 
                            style={{ width: '150px' }}
                        />
                        <Column 
                            key="contact"
                            field="users_contact_number" 
                            header="Contact" 
                            sortable 
                            body={(rowData) => (
                                <div className="flex items-center gap-2">
                                    <i className="pi pi-phone text-green-500" />
                                    {rowData.users_contact_number}
                                </div>
                            )}
                        />
                        <Column 
                            key="actions"
                            header="Actions" 
                            body={actionsBodyTemplate} 
                            style={{ width: '150px' }}
                            className="text-center"
                        />
                    </DataTable>
                </Card>
            </motion.div>

            <FacultyModal 
                show={modalState.isOpen} 
                onHide={() => setModalState({ isOpen: false, type: '', user: null })}
                type={modalState.type}
                user={modalState.user}
                departments={departments}
                onSubmit={handleSubmit}
                onDelete={deleteUser}
                userLevels={userLevels} // Pass userLevels to FacultyModal
                getUserDetails={getUserDetails} // Add this line
                generateAvatarColor={generateAvatarColor} // Add this prop
            />
        </div>
    );
};

const FacultyModal = ({ 
    show, 
    onHide, 
    type, 
    user, 
    departments, 
    onSubmit, 
    onDelete, 
    userLevels,
    getUserDetails,
    generateAvatarColor // Add this to props
}) => {
    const [formData, setFormData] = useState({
        users_id: '',
        users_firstname: '',
        users_middlename: '',
        users_lastname: '',
        users_school_id: '',
        users_contact_number: '',
        users_email: '',
        departments_id: '', // Changed from departments_name
        users_password: '',
        users_role: '',
    });

    // Add imageUrl state
    const [imageUrl, setImageUrl] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            if (user && type === 'edit') {
                const userDetails = await getUserDetails(user.users_id);
                if (userDetails) {
                    setFormData({
                        users_id: userDetails.users_id || '',
                        users_firstname: userDetails.users_fname || '',
                        users_middlename: userDetails.users_mname || '',
                        users_lastname: userDetails.users_lname || '',
                        users_school_id: userDetails.users_school_id || '',
                        users_contact_number: userDetails.users_contact_number || '',
                        users_email: userDetails.users_email || '',
                        departments_id: userDetails.departments_id || '', // Changed to use departments_id
                        users_password: '',
                        users_role: userDetails.users_user_level_id || '',
                    });
                    // Set the image URL
                    setImageUrl(`http://localhost/coc/gsd/${userDetails.users_pic || 'uploads/profileni.png'}`);
                }
            } else {
                // Reset form for new user
                setFormData({
                    users_id: '',
                    users_firstname: '',
                    users_middlename: '',
                    users_lastname: '',
                    users_school_id: '',
                    users_contact_number: '',
                    users_email: '',
                    departments_id: '', // Changed from departments_name
                    users_password: '',
                    users_role: '',
                });
                setImageUrl('http://localhost/coc/gsd/uploads/profileni.png');
            }
        };

        fetchUserData();
    }, [user, type, getUserDetails]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Modified handleSubmit to use departments_id directly
    const handleSubmit = async (e) => {
        e.preventDefault();

        const jsonData = {
            operation: "saveUser",
            data: {
                fname: formData.users_firstname,
                mname: formData.users_middlename,
                lname: formData.users_lastname,
                email: formData.users_email,
                schoolId: formData.users_school_id,
                contact: formData.users_contact_number,
                userLevelId: formData.users_role,
                password: formData.users_password,
                departmentId: formData.departments_id, // Use departments_id directly
            }
        };

        console.log('Sending data:', jsonData);
        onSubmit(jsonData);
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg" className="rounded-xl">
            <Modal.Header closeButton className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                <Modal.Title className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faUser} className="text-xl" />
                    <span className="font-bold">
                        {type === 'add' ? 'Add New Faculty' : type === 'edit' ? 'Edit Faculty Details' : 'Confirm Deletion'}
                    </span>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-green-50 px-4 py-4">
                {type === 'delete' ? (
                    <p>Are you sure you want to delete this faculty member?</p>
                ) : (
                    <Form onSubmit={handleSubmit}>
                        {/* Add image preview at the top of the form */}
                        {type === 'edit' && (
                            <div className="flex justify-center mb-6">
                                <div className="relative w-32 h-32">
                                    {imageUrl ? (
                                        <div className="w-full h-full">
                                            <img
                                                src={imageUrl}
                                                alt="Profile"
                                                className="w-full h-full rounded-full object-cover border-4 border-green-500"
                                                onError={() => {
                                                    const initials = `${formData.users_firstname?.[0] || ''}${formData.users_lastname?.[0] || ''}`.toUpperCase();
                                                    const bgColor = generateAvatarColor(initials);
                                                    const container = document.getElementById('profile-image-container');
                                                    if (container) {
                                                        container.innerHTML = `
                                                            <div
                                                                class="w-full h-full rounded-full border-4 border-green-500 flex items-center justify-center text-white font-bold text-3xl"
                                                                style="background-color: ${bgColor}"
                                                            >
                                                                ${initials}
                                                            </div>
                                                        `;
                                                    }
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            className="w-full h-full rounded-full border-4 border-green-500 flex items-center justify-center text-white font-bold text-3xl"
                                            style={{ 
                                                backgroundColor: generateAvatarColor(
                                                    `${formData.users_firstname?.[0] || ''}${formData.users_lastname?.[0] || ''}`
                                                )
                                            }}
                                        >
                                            {`${formData.users_firstname?.[0] || ''}${formData.users_lastname?.[0] || ''}`.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* Rest of your form groups remain unchanged */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <Form.Group>
                                <Form.Label>First Name</Form.Label>
                                <Form.Control type="text" name="users_firstname" value={formData.users_firstname} onChange={handleChange} required />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Middle Name</Form.Label>
                                <Form.Control type="text" name="users_middlename" value={formData.users_middlename} onChange={handleChange} />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Last Name</Form.Label>
                                <Form.Control type="text" name="users_lastname" value={formData.users_lastname} onChange={handleChange} required />
                            </Form.Group>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Form.Group>
                                <Form.Label>School ID</Form.Label>
                                <Form.Control type="text" name="users_school_id" value={formData.users_school_id} onChange={handleChange} required />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Phone Number</Form.Label>
                                <Form.Control type="tel" name="users_contact_number" value={formData.users_contact_number} onChange={handleChange} required />
                            </Form.Group>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <Form.Group>
                                <Form.Label>Email Address</Form.Label>
                                <Form.Control type="email" name="users_email" value={formData.users_email} onChange={handleChange} required />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Role</Form.Label>
                                <Form.Select name="users_role" value={formData.users_role} onChange={handleChange} required>
                                    <option value="">Select Role</option>
                                    {userLevels.map((level) => (
                                        <option key={level.user_level_id} value={level.user_level_id}>
                                            {level.user_level_name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <Form.Group>
                                <Form.Label>Department</Form.Label>
                                <Form.Select name="departments_id" value={formData.departments_id} onChange={handleChange} required>
                                    <option value="">Select Department</option>
                                    {departments && departments.map((department) => (
                                        <option key={department.departments_id} value={department.departments_id}>
                                            {`${department.departments_name} (ID: ${department.departments_id})`}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>{type === 'edit' ? 'New Password (leave blank to keep current)' : 'Password'}</Form.Label>
                                <Form.Control type="password" name="users_password" value={formData.users_password} onChange={handleChange} required={type === 'add'} />
                            </Form.Group>
                        </div>
                    </Form>
                )}
            </Modal.Body>
            <Modal.Footer className="bg-green-50">
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
                {type === 'delete' ? (
                    <Button variant="danger" onClick={() => onDelete(user.users_id)}>
                        Delete
                    </Button>
                ) : (
                    <Button variant="primary" onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                        {type === 'add' ? 'Add Faculty' : 'Save Changes'}
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default Faculty;
