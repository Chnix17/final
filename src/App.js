import React, { useState, createContext, useCallback } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
// import Sidebar from './pages/Sidebar';
// import Login from './pages/Login';
import Register from './pages/Register';
import VehicleEntry from './pages/VehicleEntry';
import Venue from './pages/Venue';
import  Dashboard from './page_user/dashboard';
import Equipment from './pages/Equipment';
import ViewRequest from './pages/viewRequest';
import Reports from './pages/Reports';
import AddReservation from './page_user/AddReservation'; // Import the AddReservation component
import { Toaster } from 'sonner';
import './App.css'; 
import Logins from './pages/logins';
import AdminDashboard from './pages/adminDashboard';
import Faculty from './pages/Faculty';  // Updated casing to match file name
import Master from './pages/Master';
import Vehiclem from './pages/vehiclemake';
import Departments from './pages/departments';
import Vehiclec from './pages/vehiclecategory';
import Position from './pages/position';
import Equipmentc from './pages/equipmentCategory';
import Userlevel from './pages/condition';
import VehicleModel from './pages/vehiclemodel';
import PersonnelDashboard from './pages/PersonelDashboard';
import ViewReserve from './page_user/viewReserve';
import Profile from './page_user/profile'
import Calendar from './pages/calendar';
import Calendars from './pages/landCalendar';
import Pofiles from './pages/profile';
import Settings from './pages/Settings';
import Record from './pages/Record';
import Admin from './pages/Admin';
import DeanDashboard from './page_dean/dashboard';
import ViewApproval from './page_dean/viewApproval';

import Chat from './components/chat';

// Create a new context for the theme
export const ThemeContext = createContext();

const App = () => {
    const defaultUrl = "http://localhost/coc/gsd/";
    if (localStorage.getItem("url") !== defaultUrl) {
        localStorage.setItem("url", defaultUrl);
    }

    // Add state for the current theme
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme || 'light';
    });

    // Function to toggle the theme
    const toggleTheme = useCallback(() => {
        setTheme(prevTheme => {
            const newTheme = prevTheme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            return newTheme;
        });
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            <div className={`app-container ${theme}`}>
                <Toaster richColors position='top-center' duration={1500} />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Navigate to="/gsd" replace />} />
                        <Route path="/Admin" element={<Admin/>} />
                        <Route path="/viewApproval" element={<ViewApproval />} />
                        <Route path="/deanDashboard" element={<DeanDashboard />} />
                        <Route path="/record" element={<Record />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/profile1" element={<Pofiles />} />
                        <Route path="/chat" element={<Chat />} />
                        <Route path="/landCalendar" element={<Calendars />} />
                        <Route path="/calendar" element={<Calendar />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/viewReserve" element={<ViewReserve />} />                      
                        <Route path="/gsd" element={<Logins />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/departments" element={<Departments />} />
                        <Route path="/vehiclemodel" element={<VehicleModel />} />
                        <Route path="/personeldashboard" element={<PersonnelDashboard />} />
                        <Route path="/condition" element={<Userlevel /> } /> 
                        <Route path="/position" element={<Position />} />
                        <Route path="/equipmentCat" element={<Equipmentc />} />
                        <Route path="/vehiclemake" element={<Vehiclem />} /> 
                        <Route path="/vehicleCategory" element={<Vehiclec />} /> 
                        <Route path="/VehicleEntry" element={<VehicleEntry />} /> 
                        <Route path="/Reports" element={<Reports />} /> 
                        <Route path="/addReservation" element={<AddReservation />} /> {/* Add new route for AddReservation */}
                        <Route path="/Venue" element={<Venue />} /> 
                        <Route path="/adminDashboard" element={<AdminDashboard />} />
                        <Route path="/Equipment" element={<Equipment />} />
                        <Route path="/Faculty" element={<Faculty />} />
                        <Route path="/Register" element={<Register />} />
                        <Route path="/viewRequest" element={<ViewRequest />} />
                        <Route path="/Master" element={<Master />} />
                        <Route path="*" element={<div>404 Not Found</div>} /> 
                    </Routes>
                </main>
            </div>
        </ThemeContext.Provider>
    );
};

export default App;
