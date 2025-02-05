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
                { operation: "fetchAllUser" },  // Changed to use JSON
                { 
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            if (response.data.status === 'success') {
                // Transform the data to ensure all user types are included
                const allUsers = response.data.data.map(user => ({
                    users_id: user.id,
                    users_fname: user.fname,
                    users_mname: user.mname,
                    users_lname: user.lname,
                    users_email: user.email,
                    users_school_id: user.school_id,
                    users_contact_number: user.contact_number,
                    users_pic: user.pic,
                    departments_name: user.departments_name,
                    user_level_name: user.user_level_name,
                    users_user_level_id: user.user_level_desc,
                    user_type: user.type
                }));
                setUsers(allUsers);
            } else {
                toast.error("Error fetching users: " + response.data.message);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
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
            // First try to fetch as admin
            const adminResponse = await axios({
                method: 'post',
                url: 'http://localhost/coc/gsd/fetchMaster.php',
                data: new URLSearchParams({
                    operation: 'fetchAdminById',
                    id: userId
                }).toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (adminResponse.data.status === 'success' && adminResponse.data.data.length > 0) {
                const adminData = adminResponse.data.data[0];
                return {
                    users_id: adminData.admin_id,
                    users_fname: adminData.admin_fname,
                    users_mname: adminData.admin_mname,
                    users_lname: adminData.admin_lname,
                    users_email: adminData.admin_email,
                    users_school_id: adminData.admin_school_id,
                    users_contact_number: adminData.admin_contact_number,
                    users_pic: adminData.admin_pic,
                    departments_name: adminData.departments_name,
                    user_level_name: adminData.user_level_name,
                    users_user_level_id: adminData.admin_user_level_id,
                    users_department_id: adminData.admin_department_id,
                    is_admin: true
                };
            }

            // If not found as admin, try as regular user
            const userResponse = await axios({
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

            if (userResponse.data.status === 'success' && userResponse.data.data.length > 0) {
                return userResponse.data.data[0];
            }

            // If not found as regular user, try as dean/secretary
            const deanSecResponse = await axios({
                method: 'post',
                url: 'http://localhost/coc/gsd/fetchMaster.php',
                data: new URLSearchParams({
                    operation: 'fetchDeanSecById',
                    id: userId
                }).toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (deanSecResponse.data.status === 'success' && deanSecResponse.data.data.length > 0) {
                const deanData = deanSecResponse.data.data[0];
                return {
                    users_id: deanData.dept_id,
                    users_fname: deanData.dept_fname,
                    users_mname: deanData.dept_mname,
                    users_lname: deanData.dept_lname,
                    users_email: deanData.dept_email,
                    users_school_id: deanData.dept_school_id,
                    users_contact_number: deanData.dept_contact_number,
                    users_pic: deanData.dept_pic,
                    departments_name: deanData.departments_name,
                    user_level_name: deanData.user_level_name,
                    users_user_level_id: deanData.dept_user_level_id,
                    users_department_id: deanData.dept_department_id,
                    is_dean_sec: true
                };
            }

            throw new Error('User not found');
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
            <div className="flex gap-2">
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
            'Dean': { color: 'bg-orange-500', icon: 'pi pi-briefcase' },
            'Secretary': { color: 'bg-pink-500', icon: 'pi pi-inbox' },
            'Personnel': { color: 'bg-blue-500', icon: 'pi pi-user' },
            'user': { color: 'bg-green-500', icon: 'pi pi-users' }
        };
        
        const config = levelConfig[rowData.user_level_name] || { color: 'bg-gray-500', icon: 'pi pi-user' };
        
        return (
            <Chip
                icon={`${config.icon}`}
                label={rowData.user_level_name}
                className={`${config.color} text-white`}
            />
        );
    };

    const departmentTemplate = (rowData) => {
        return (
            <Chip
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
                            header="Photo" 
                            body={imageBodyTemplate} 
                            style={{ width: '100px' }}
                            className="text-center"
                        />
                        <Column 
                            field="users_school_id" 
                            header="School ID" 
                            filter 
                            filterPlaceholder="Search ID"
                            sortable 
                            className="font-semibold"
                        />
                        <Column 
                            field="users_fname" 
                            header="First Name" 
                            filter 
                            filterPlaceholder="Search first name"
                            sortable 
                        />
                        <Column 
                            field="users_lname" 
                            header="Last Name" 
                            filter 
                            filterPlaceholder="Search last name"
                            sortable 
                        />
                        <Column 
                            field="departments_name" 
                            header="Department" 
                            body={departmentTemplate}
                            filter 
                            filterPlaceholder="Search department"
                            sortable 
                        />
                        <Column 
                            field="user_level_name" 
                            header="Role" 
                            body={userLevelTemplate}
                            sortable 
                            style={{ width: '150px' }}
                        />
                        <Column 
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
        departments_name: '',
        users_password: '',
        users_role: '',
    });

    // Add imageUrl state
    const [imageUrl, setImageUrl] = useState('');

    // Add these new state variables
    const [passwordValidation, setPasswordValidation] = useState({
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false,
        hasMinLength: false
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordsMatch, setPasswordsMatch] = useState(true);

    // Add password validation function
    const validatePassword = (password) => {
        setPasswordValidation({
            hasUpperCase: /[A-Z]/.test(password),
            hasLowerCase: /[a-z]/.test(password),
            hasNumber: /[0-9]/.test(password),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
            hasMinLength: password.length >= 8
        });
    };

    // Add new state for validation
    const [validation, setValidation] = useState({
        email: { isValid: true, message: '' },
        schoolId: { isValid: true, message: '' }
    });

    // Add debounce function
    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    };

    // Add check duplicates function
    const checkDuplicates = async (field, value) => {
        try {
            const response = await axios.post('http://localhost/coc/gsd/user.php', {
                operation: 'checkUniqueEmailAndSchoolId',
                email: field === 'email' ? value : formData.users_email,
                schoolId: field === 'schoolId' ? value : formData.users_school_id
            });

            if (response.data.status === 'success' && response.data.exists) {
                const duplicates = response.data.duplicates;
                duplicates.forEach(duplicate => {
                    if (duplicate.field === 'email' && field === 'email') {
                        setValidation(prev => ({
                            ...prev,
                            email: {
                                isValid: false,
                                message: `This email is already registered as a ${duplicate.type}`
                            }
                        }));
                    }
                    if (duplicate.field === 'school_id' && field === 'schoolId') {
                        setValidation(prev => ({
                            ...prev,
                            schoolId: {
                                isValid: false,
                                message: `This School ID is already registered as a ${duplicate.type}`
                            }
                        }));
                    }
                });
            } else {
                setValidation(prev => ({
                    ...prev,
                    [field === 'email' ? 'email' : 'schoolId']: {
                        isValid: true,
                        message: ''
                    }
                }));
            }
        } catch (error) {
            console.error('Validation error:', error);
        }
    };

    // Create debounced version of check duplicates
    const debouncedCheckDuplicates = debounce(checkDuplicates, 500);

    useEffect(() => {
        const fetchUserData = async () => {
            if (user && type === 'edit') {
                const userDetails = await getUserDetails(user.users_id);
                if (userDetails) {
                    setFormData({
                        users_id: userDetails.users_id,
                        users_firstname: userDetails.users_fname || userDetails.dept_fname,
                        users_middlename: userDetails.users_mname || userDetails.dept_mname,
                        users_lastname: userDetails.users_lname || userDetails.dept_lname,
                        users_school_id: userDetails.users_school_id || userDetails.dept_school_id,
                        users_contact_number: userDetails.users_contact_number || userDetails.dept_contact_number,
                        users_email: userDetails.users_email || userDetails.dept_email,
                        departments_name: userDetails.departments_name,
                        users_password: '',
                        users_role: userDetails.users_user_level_id || userDetails.dept_user_level_id,
                        users_department_id: userDetails.users_department_id || userDetails.dept_department_id,
                        is_dean_sec: userDetails.is_dean_sec || false
                    });
                    setImageUrl(`http://localhost/coc/gsd/${userDetails.users_pic || userDetails.dept_pic || 'uploads/profileni.png'}`);
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
                    departments_name: '',
                    users_password: '',
                    users_role: '',
                });
                setImageUrl('http://localhost/coc/gsd/uploads/profileni.png');
            }
        };

        fetchUserData();
    }, [user, type, getUserDetails]);

    // Modify handleChange to include validation
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Validate password if it's changing
        if (name === 'users_password') {
            validatePassword(value);
            setPasswordsMatch(value === confirmPassword);
        }
        if (name === 'confirm_password') {
            setConfirmPassword(value);
            setPasswordsMatch(formData.users_password === value);
        }

        // Check for duplicates
        if (name === 'users_email') {
            debouncedCheckDuplicates('email', value);
        }
        if (name === 'users_school_id') {
            debouncedCheckDuplicates('schoolId', value);
        }
    };

    // Modify handleSubmit to include validation check
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check for validation errors
        if (!validation.email.isValid || !validation.schoolId.isValid) {
            toast.error("Please fix validation errors before submitting");
            return;
        }

        // Check if all password requirements are met when adding new user
        if (type === 'add') {
            const isPasswordValid = Object.values(passwordValidation).every(Boolean);
            if (!isPasswordValid) {
                toast.error("Password does not meet requirements");
                return;
            }
            if (!passwordsMatch) {
                toast.error("Passwords do not match");
                return;
            }
        }

        const selectedDepartment = departments.find(
            dept => dept.departments_name === formData.departments_name
        );
        
        if (!selectedDepartment) {
            console.error('Department not found:', formData.departments_name);
            return;
        }

        // Determine operation based on user level
        let operation;
        switch (formData.users_role) {
            case '1': // Admin
                operation = 'saveAdmin';
                break;
            case '5': // Dean
                operation = 'saveDean';
                break;
            default: // Regular user
                operation = 'saveUser';
        }

        const jsonData = {
            operation: operation,
            data: {
                fname: formData.users_firstname,
                mname: formData.users_middlename,
                lname: formData.users_lastname,
                email: formData.users_email,
                schoolId: formData.users_school_id,
                contact: formData.users_contact_number,
                userLevelId: formData.users_role,
                password: formData.users_password,
                departmentId: selectedDepartment.departments_id,
                pic: "" // Add pic field if needed
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
                                <Form.Control 
                                    type="text" 
                                    name="users_school_id" 
                                    value={formData.users_school_id} 
                                    onChange={handleChange} 
                                    required
                                    className={!validation.schoolId.isValid ? 'border-red-500' : ''}
                                />
                                {!validation.schoolId.isValid && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {validation.schoolId.message}
                                    </div>
                                )}
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Phone Number</Form.Label>
                                <Form.Control type="tel" name="users_contact_number" value={formData.users_contact_number} onChange={handleChange} required />
                            </Form.Group>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <Form.Group>
                                <Form.Label>Email Address</Form.Label>
                                <Form.Control 
                                    type="email" 
                                    name="users_email" 
                                    value={formData.users_email} 
                                    onChange={handleChange} 
                                    required
                                    className={!validation.email.isValid ? 'border-red-500' : ''}
                                />
                                {!validation.email.isValid && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {validation.email.message}
                                    </div>
                                )}
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
                                <Form.Select name="departments_name" value={formData.departments_name} onChange={handleChange} required>
                                    <option value="">Select Department</option>
                                    {departments && departments.map((department) => (
                                        <option key={department.departments_id} value={department.departments_name}>
                                            {department.departments_name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>{type === 'edit' ? 'New Password (leave blank to keep current)' : 'Password'}</Form.Label>
                                <Form.Control 
                                    type="password" 
                                    name="users_password" 
                                    value={formData.users_password} 
                                    onChange={handleChange} 
                                    required={type === 'add'}
                                    className={type === 'add' && !Object.values(passwordValidation).every(Boolean) ? 'border-red-500' : ''}
                                />
                                {type === 'add' && (
                                    <div className="mt-2 text-sm">
                                        <p className={passwordValidation.hasUpperCase ? 'text-green-600' : 'text-red-600'}>
                                            ✓ One uppercase letter
                                        </p>
                                        <p className={passwordValidation.hasLowerCase ? 'text-green-600' : 'text-red-600'}>
                                            ✓ One lowercase letter
                                        </p>
                                        <p className={passwordValidation.hasNumber ? 'text-green-600' : 'text-red-600'}>
                                            ✓ One number
                                        </p>
                                        <p className={passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-red-600'}>
                                            ✓ One special character
                                        </p>
                                        <p className={passwordValidation.hasMinLength ? 'text-green-600' : 'text-red-600'}>
                                            ✓ Minimum 8 characters
                                        </p>
                                    </div>
                                )}
                            </Form.Group>
                            {type === 'add' && (
                                <Form.Group>
                                    <Form.Label>Confirm Password</Form.Label>
                                    <Form.Control 
                                        type="password" 
                                        name="confirm_password" 
                                        value={confirmPassword} 
                                        onChange={handleChange} 
                                        required
                                        className={!passwordsMatch ? 'border-red-500' : ''}
                                    />
                                    {!passwordsMatch && (
                                        <p className="text-red-600 text-sm mt-1">
                                            Passwords do not match
                                        </p>
                                    )}
                                </Form.Group>
                            )}
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
