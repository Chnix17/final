import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { FaEye, FaEyeSlash, FaLock, FaUser, FaCalculator, FaCalendarCheck, FaChartLine, FaClock } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';

function Logins() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [captchaNum1, setCaptchaNum1] = useState(Math.floor(Math.random() * 10));
    const [captchaNum2, setCaptchaNum2] = useState(Math.floor(Math.random() * 10));
    const [captchaAnswer, setCaptchaAnswer] = useState("");
    const [isCaptchaCorrect, setIsCaptchaCorrect] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loginAttempts, setLoginAttempts] = useState(0);
    const navigateTo = useNavigate();
    const [isHovering, setIsHovering] = useState(false);
    const controls = useAnimation();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        if (localStorage.getItem('loggedIn') === 'true') {
            navigateTo("/adminDashboard");
        }
        generateCaptcha();
        const rememberedUsername = localStorage.getItem('rememberedUsername');
        if (rememberedUsername) {
            setUsername(rememberedUsername);
            setRememberMe(true);
        }

        // Looping animation for the feature icons
        controls.start({
            scale: [1, 1.1, 1],
            transition: { 
                duration: 2, 
                repeat: Infinity, 
                repeatType: "reverse" 
            }
        });
    }, [controls, navigateTo]);

    const generateCaptcha = () => {
        setCaptchaNum1(Math.floor(Math.random() * 10));
        setCaptchaNum2(Math.floor(Math.random() * 10));
        setCaptchaAnswer("");
        setIsCaptchaCorrect(null);
    };

    const handleCaptchaChange = (e) => {
        const userAnswer = e.target.value;
        setCaptchaAnswer(userAnswer);
        setIsCaptchaCorrect(userAnswer == (captchaNum1 + captchaNum2));
    };

    const notify = (message, type = 'success') => {
        toast[type](message, {
            duration: 3000,
            position: 'top-right',
            style: {
                borderRadius: '10px',
                background: type === 'error' ? '#FEE2E2' : '#ECFDF5',
                color: type === 'error' ? '#DC2626' : '#059669',
            },
            iconTheme: {
                primary: type === 'error' ? '#DC2626' : '#059669',
                secondary: 'white',
            },
        });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!username || !password || isCaptchaCorrect === null) {
            toast.error("Please fill in all fields and solve the CAPTCHA.");
            return;
        }
        if (!isCaptchaCorrect) {
            toast.error("Incorrect CAPTCHA. Please try again.");
            generateCaptcha();
            return;
        }

        setLoading(true);

        const url = `${localStorage.getItem("url")}login.php`;
        if (!url) {
            toast.error("Invalid URL.");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(url, 
                {
                    operation: "login",
                    json: {
                        username: username,
                        password: password
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data) {
                const user = response.data;
                
                if (user.status === "success" && user.data) {
                    const userData = user.data;
                    
                    // Set common localStorage items with additional fields
                    localStorage.setItem("user_id", userData.user_id);
                    localStorage.setItem("name", `${userData.firstname} ${userData.middlename} ${userData.lastname}`.trim());
                    localStorage.setItem("school_id", userData.school_id);
                    localStorage.setItem("contact_number", userData.contact_number);
                    localStorage.setItem("user_level", userData.user_level_name);
                    localStorage.setItem("user_level_desc", userData.user_level_desc);
                    localStorage.setItem("user_level_id", userData.user_level_id);
                    localStorage.setItem("department_id", userData.department_id);
                    localStorage.setItem("department_name", userData.department_name);
                    localStorage.setItem("profile_pic", userData.profile_pic || "");
                    localStorage.setItem("email", userData.email || ""); // Set empty string if email is null
                    localStorage.setItem("created_at", userData.created_at);
                    localStorage.setItem("updated_at", userData.updated_at);
                    localStorage.setItem("loggedIn", "true");

                    // Add session storage items with additional fields
                    sessionStorage.setItem("user_id", userData.user_id);
                    sessionStorage.setItem("name", `${userData.firstname} ${userData.middlename} ${userData.lastname}`.trim());
                    sessionStorage.setItem("school_id", userData.school_id);
                    sessionStorage.setItem("contact_number", userData.contact_number);
                    sessionStorage.setItem("user_level", userData.user_level_name);
                    sessionStorage.setItem("user_level_desc", userData.user_level_desc);
                    sessionStorage.setItem("user_level_id", userData.user_level_id);
                    sessionStorage.setItem("department_id", userData.department_id);
                    sessionStorage.setItem("department_name", userData.department_name);
                    sessionStorage.setItem("profile_pic", userData.profile_pic || "");
                    sessionStorage.setItem("email", userData.email || ""); // Set empty string if email is null
                    sessionStorage.setItem("created_at", userData.created_at);
                    sessionStorage.setItem("updated_at", userData.updated_at);
                    sessionStorage.setItem("loggedIn", "true");

                    if (userData.user_level_name === "Super Admin") {
                        notify("Super Admin Login Successful");
                        navigateTo("/adminDashboard");
                    } else if (userData.user_level_name === "Personnel") {
                        notify("Personnel Login Successful");
                        navigateTo("/personeldashboard");
                    } else if (userData.user_level_name === "Admin") {
                        notify("Admin Login Successful");
                        navigateTo("/adminDashboard");
                    } else if (userData.user_level_name === "Dean") {
                        notify("Dean Login Successful");
                        navigateTo("/deandashboard");  // Changed to lowercase to match route
                    } else {
                        notify("User Login Successful");
                        navigateTo("/dashboard");
                    }

                    // Handle "Remember Me" functionality
                    if (rememberMe) {
                        localStorage.setItem("rememberedUsername", username);
                    } else {
                        localStorage.removeItem("rememberedUsername");
                    }
                } else {
                    const newAttempts = loginAttempts + 1;
                    setLoginAttempts(newAttempts);
                    if (newAttempts >= 3) {
                        notify("Too many failed attempts. Please try again later.", 'error');
                        setTimeout(() => setLoginAttempts(0), 300000); // Reset after 5 minutes
                    } else {
                        notify("Invalid Credentials", 'error');
                    }
                }
            }
        } catch (error) {
            console.error("Login error:", error.response ? error.response.data : error.message);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const featureVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const pageVariants = {
        initial: { opacity: 0, scale: 0.8 },
        in: { opacity: 1, scale: 1 },
        out: { opacity: 0, scale: 1.2 }
    };

    const pageTransition = {
        type: "tween",
        ease: "anticipate",
        duration: 0.5
    };

    return (
        <AnimatePresence mode="wait">
            {!isLoggedIn ? (
                <motion.div
                    key="login"
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                    className='flex min-h-screen bg-gradient-to-br from-green-50 to-green-100 overflow-hidden'
                >
                    {/* Left side: Introduction with picture */}
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        transition={{ duration: 0.5 }}
                        className='w-1/2 p-8 flex flex-col items-center justify-center bg-gradient-to-br from-white to-green-100 text-green-800 relative'
                    >
                        <motion.img 
                            src="/images/assets/phinma.png" 
                            alt="PHINMA CDO Logo" 
                            className='w-64 h-64 object-cover rounded-full mb-8 shadow-lg'
                            whileHover={{ scale: 1.1, rotate: 360 }}
                            transition={{ duration: 0.5 }}
                        />
                        <motion.h2 
                            className='text-4xl font-bold mb-4 text-green-700 font-sans'
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            General Service Department
                        </motion.h2>
                        <motion.h3 
                            className='text-2xl font-semibold mb-2 text-green-600 font-sans'
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            Reservation and Monitoring System
                        </motion.h3>
                      
                        <motion.ul 
                            className='space-y-4 mt-8'
                            variants={{
                                hidden: { opacity: 0 },
                                visible: { 
                                    opacity: 1,
                                    transition: { staggerChildren: 0.2 }
                                }
                            }}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.li 
                                className='flex items-center'
                                variants={featureVariants}
                                whileHover={{ scale: 1.05 }}
                            >
                                <motion.div animate={controls}>
                                    <FaCalendarCheck className='w-6 h-6 mr-2 text-green-500' />
                                </motion.div>
                                <span className='text-green-700'>Efficient Facilities reservations</span>
                            </motion.li>
                            <motion.li 
                                className='flex items-center'
                                variants={featureVariants}
                                whileHover={{ scale: 1.05 }}
                            >
                                <motion.div animate={controls}>
                                    <FaChartLine className='w-6 h-6 mr-2 text-green-500' />
                                </motion.div>
                                <span className='text-green-700'>Real-time facility monitoring</span>
                            </motion.li>
                            <motion.li 
                                className='flex items-center'
                                variants={featureVariants}
                                whileHover={{ scale: 1.05 }}
                            >
                                <motion.div animate={controls}>
                                    <FaClock className='w-6 h-6 mr-2 text-green-500' />
                                </motion.div>
                                <span className='text-green-700'>Optimized resource allocation</span>
                            </motion.li>
                        </motion.ul>

                        {/* Floating particles */}
                        <motion.div 
                            className="absolute top-10 right-10 w-4 h-4 bg-green-400 rounded-full"
                            animate={{
                                y: [0, -20, 0],
                                opacity: [1, 0.5, 1],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                repeatType: "reverse"
                            }}
                        />
                        <motion.div 
                            className="absolute bottom-20 left-20 w-6 h-6 bg-yellow-400 rounded-full"
                            animate={{
                                x: [0, 20, 0],
                                opacity: [1, 0.5, 1],
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                repeatType: "reverse"
                            }}
                        />

                        {/* New cool animations */}
                        <motion.div 
                            className="absolute top-1/4 left-1/4 w-8 h-8 border-4 border-green-500 rounded-full"
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.7, 0.3, 0.7],
                            }}
                            transition={{
                                duration: 5,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                        <motion.div 
                            className="absolute bottom-1/4 right-1/4 w-12 h-12 border-2 border-yellow-500"
                            animate={{
                                rotate: [0, 180, 360],
                                borderRadius: ["0%", "50%", "0%"],
                            }}
                            transition={{
                                duration: 8,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        />
                       
                    </motion.div>

                    {/* Right side: Login form */}
                    <motion.div 
                        initial={{ opacity: 0, x: 50 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        transition={{ duration: 0.5 }}
                        className='w-1/2 p-8 flex items-center justify-center relative'
                    >
                        {/* Decorative background elements */}
                        <motion.div 
                            className="absolute top-0 left-0 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
                            animate={{
                                scale: [1, 1.2, 1],
                                rotate: [0, 90, 0],
                            }}
                            transition={{
                                duration: 20,
                                repeat: Infinity,
                                repeatType: "reverse"
                            }}
                        />
                        <motion.div 
                            className="absolute bottom-0 right-0 w-80 h-80 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
                            animate={{
                                scale: [1, 1.3, 1],
                                rotate: [0, -90, 0],
                            }}
                            transition={{
                                duration: 25,
                                repeat: Infinity,
                                repeatType: "reverse"
                            }}
                        />

                        <div className='w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden z-10'>
                            <div className='bg-gradient-to-r from-green-600 to-green-700 p-6 text-white'>
                                <h2 className='text-center text-3xl font-bold'>General Service Department</h2>
                                <p className='text-center text-green-100 mt-2'>Please login to your account</p>
                            </div>
                            <div className='p-8'>
                                <form onSubmit={handleLogin} className='space-y-6'>
                                    <div className='space-y-2'>
                                        <label className='text-sm font-medium text-gray-700' htmlFor='username'>
                                            Username
                                        </label>
                                        <div className='relative rounded-md shadow-sm'>
                                            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                                <FaUser className='text-green-500' />
                                            </div>
                                            <input 
                                                value={username} 
                                                onChange={(e) => setUsername(e.target.value)} 
                                                className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition duration-150 ease-in-out' 
                                                id='username' 
                                                type='text'
                                                placeholder='Enter your username' 
                                                required 
                                            />
                                        </div>
                                    </div>

                                    <div className='space-y-2'>
                                        <label className='text-sm font-medium text-gray-700' htmlFor='password'>
                                            Password
                                        </label>
                                        <div className='relative rounded-md shadow-sm'>
                                            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                                <FaLock className='text-green-500' />
                                            </div>
                                            <input 
                                                value={password} 
                                                onChange={(e) => setPassword(e.target.value)} 
                                                className='block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition duration-150 ease-in-out' 
                                                id='password' 
                                                type={showPassword ? 'text' : 'password'} 
                                                placeholder='Enter your password' 
                                                required 
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => setShowPassword(!showPassword)} 
                                                className='absolute inset-y-0 right-0 pr-3 flex items-center'
                                            >
                                                {showPassword ? <FaEyeSlash className='text-green-500' /> : <FaEye className='text-green-500' />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className='space-y-2'>
                                        <label className='text-sm font-medium text-gray-700'>
                                            Math CAPTCHA
                                        </label>
                                        <div className='flex items-center space-x-2 bg-green-50 p-3 rounded-md'>
                                            <FaCalculator className='text-green-500' />
                                            <span>{captchaNum1} + {captchaNum2} = ?</span>
                                            <input 
                                                value={captchaAnswer}
                                                onChange={handleCaptchaChange}
                                                className={`w-20 px-2 py-1 border ${isCaptchaCorrect === false ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition duration-150 ease-in-out`}
                                                placeholder='Answer'
                                            />
                                        </div>
                                        <AnimatePresence>
                                            {isCaptchaCorrect === false && (
                                                <motion.p 
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className='text-red-500 text-xs'
                                                >
                                                    Incorrect answer.
                                                </motion.p>
                                            )}
                                            {isCaptchaCorrect === true && (
                                                <motion.p 
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className='text-green-500 text-xs'
                                                >
                                                    Correct!
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className='flex items-center'>
                                        <input
                                            type="checkbox"
                                            id="rememberMe"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className='h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded transition duration-150 ease-in-out'
                                        />
                                        <label htmlFor="rememberMe" className='ml-2 block text-sm text-gray-700'>Remember me</label>
                                    </div>

                                    <motion.button 
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        type='submit'
                                        disabled={loading || loginAttempts >= 3}
                                    >
                                        {loading ? 'Logging in...' : 'Sign In'}
                                    </motion.button>
                                </form>

                                <div className='mt-6 text-center'>
                                    <a href="#" className='text-sm text-green-600 hover:text-green-700 transition duration-150 ease-in-out'>Forgot your password?</a>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            ) : (
                <motion.div
                    key="success"
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                    className="flex items-center justify-center min-h-screen bg-green-100"
                >
                    <div className="text-center">
                        <motion.h2 
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-4xl font-bold text-green-700 mb-4"
                        >
                            Login Successful!
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-xl text-green-600"
                        >
                            Redirecting to dashboard...
                        </motion.p>
                    </div>
                </motion.div>
            )}
            <Toaster position="top-right" reverseOrder={false} />
        </AnimatePresence>
    );
}

export default Logins;
