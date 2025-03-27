import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { FaEye, FaEyeSlash, FaLock, FaUser, FaCalculator, FaCalendarCheck, FaChartLine, FaClock } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';
import { Modal } from 'antd';
import { setSessionCookie, removeSessionCookie } from '../utils/cookieUtils';
import { initializeSessionManager, updateLastActivity } from '../utils/sessionManager';

function Logins() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isCaptchaCorrect, setIsCaptchaCorrect] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const navigateTo = useNavigate();
    const [isHovering, setIsHovering] = useState(false);
    const controls = useAnimation();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [captchaText, setCaptchaText] = useState('');
    const [userCaptchaInput, setUserCaptchaInput] = useState('');
    const [captchaCanvasRef] = useState(React.createRef());
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [isEmailValid, setIsEmailValid] = useState(null);
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otp, setOtp] = useState('');
    const [resetKey, setResetKey] = useState('');
    const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);

    const [otpDigits, setOtpDigits] = useState(Array(8).fill(''));
    const [otpRefs] = useState(Array(8).fill(0).map(() => React.createRef()));
    const [showCaptchaAfterEmail, setShowCaptchaAfterEmail] = useState(false);
    const [forgotPasswordCaptchaRef] = useState(React.createRef());
    const [forgotPasswordCaptchaText, setForgotPasswordCaptchaText] = useState('');
    const [forgotPasswordCaptchaInput, setForgotPasswordCaptchaInput] = useState('');
    const [isForgotPasswordCaptchaCorrect, setIsForgotPasswordCaptchaCorrect] = useState(null);
    const [canResendOtp, setCanResendOtp] = useState(false);
    const [resendTimer, setResendTimer] = useState(180); // 3 minutes in seconds
    const [isResending, setIsResending] = useState(false);
    const [showPasswordReset, setShowPasswordReset] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordStrength, setPasswordStrength] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false
    });
    const [showLoginOTP, setShowLoginOTP] = useState(false);
    const [loginOtpDigits, setLoginOtpDigits] = useState(Array(8).fill(''));
    const [loginOtpRefs] = useState(Array(8).fill(0).map(() => React.createRef()));
    const [isVerifyingLoginOtp, setIsVerifyingLoginOtp] = useState(false);
    const [allowSevenDayAuth, setAllowSevenDayAuth] = useState(false);
    const [canResendLoginOtp, setCanResendLoginOtp] = useState(false);
    const [loginResendTimer, setLoginResendTimer] = useState(180); // 3 minutes
    const [isResendingLoginOtp, setIsResendingLoginOtp] = useState(false);
    const [lastTimerUpdate, setLastTimerUpdate] = useState(Date.now());

    useEffect(() => {
        if (localStorage.getItem('loggedIn') === 'true') {
            navigateTo("/adminDashboard");
            return;
        }

        // Delay captcha generation to ensure canvas is mounted
        const timer = setTimeout(() => {
            if (captchaCanvasRef.current) {
                generateCaptcha();
            }
        }, 100);

        const rememberedUsername = localStorage.getItem('rememberedUsername');
        if (rememberedUsername) {
            setUsername(rememberedUsername);
            setRememberMe(true);
        }

        controls.start({
            scale: [1, 1.1, 1],
            transition: { 
                duration: 2, 
                repeat: Infinity, 
                repeatType: "reverse" 
            }
        });

        return () => clearTimeout(timer);
    }, [controls, navigateTo]);

    useEffect(() => {
        if (showCaptchaAfterEmail) {
            // Delay captcha generation to ensure canvas is mounted
            const timer = setTimeout(() => {
                if (forgotPasswordCaptchaRef.current) {
                    generateForgotPasswordCaptcha();
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [showCaptchaAfterEmail]);

    useEffect(() => {
        let intervalId;
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                const now = Date.now();
                const timePassed = Math.floor((now - lastTimerUpdate) / 1000);
                
                if (showOtpInput && resendTimer > 0) {
                    setResendTimer(prev => Math.max(0, prev - timePassed));
                }
                
                if (showLoginOTP && loginResendTimer > 0) {
                    setLoginResendTimer(prev => Math.max(0, prev - timePassed));
                }
                
                setLastTimerUpdate(now);
            }
        };

        if ((showOtpInput && resendTimer > 0) || (showLoginOTP && loginResendTimer > 0)) {
            intervalId = setInterval(() => {
                setLastTimerUpdate(Date.now());
                
                if (showOtpInput) {
                    setResendTimer((prev) => {
                        if (prev <= 1) {
                            setCanResendOtp(true);
                            return 0;
                        }
                        return prev - 1;
                    });
                }
                
                if (showLoginOTP) {
                    setLoginResendTimer((prev) => {
                        if (prev <= 1) {
                            setCanResendLoginOtp(true);
                            return 0;
                        }
                        return prev - 1;
                    });
                }
            }, 1000);

            document.addEventListener('visibilitychange', handleVisibilityChange);
        }

        return () => {
            clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [showOtpInput, resendTimer, showLoginOTP, loginResendTimer, lastTimerUpdate]);

    useEffect(() => {
        // Initialize session timeout handling
        const cleanup = initializeSessionManager(navigateTo);
        return () => cleanup();
    }, [navigateTo]);

    const generateCaptcha = () => {
        const canvas = captchaCanvasRef.current;
        if (!canvas) return; // Early return if canvas not mounted

        const ctx = canvas.getContext('2d');
        if (!ctx) return; // Early return if context not available
        
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        let captcha = '';

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#f0fdf4');
        gradient.addColorStop(1, '#dcfce7');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Set fixed font properties
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Calculate character spacing
        const charWidth = canvas.width / 8;
        const startX = charWidth;
        const centerY = canvas.height / 2;

        // Generate and draw characters
        for (let i = 0; i < 6; i++) {
            const char = chars.charAt(Math.floor(Math.random() * chars.length));
            captcha += char;
            
            // Slightly randomize color for each character
            const hue = Math.floor(Math.random() * 360);
            ctx.fillStyle = `hsl(${hue}, 50%, 30%)`; // Using HSL for better contrast

            // Draw character at fixed position with slight vertical variation
            const x = startX + (i * charWidth);
            const y = centerY + (Math.random() * 6 - 3); // Small vertical variation (-3 to +3 pixels)
            ctx.fillText(char, x, y);
        }

        // Add subtle noise/lines in background (optional)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, 0);
            ctx.lineTo(Math.random() * canvas.width, canvas.height);
            ctx.stroke();
        }

        setCaptchaText(captcha);
        setUserCaptchaInput('');
        setIsCaptchaCorrect(null);
    };

    const generateForgotPasswordCaptcha = () => {
        const canvas = forgotPasswordCaptchaRef.current;
        if (!canvas) return; // Early return if canvas not mounted

        const ctx = canvas.getContext('2d');
        if (!ctx) return; // Early return if context not available
        
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        let captcha = '';

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#f0fdf4');
        gradient.addColorStop(1, '#dcfce7');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Set font properties
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const charWidth = canvas.width / 8;
        const startX = charWidth;
        const centerY = canvas.height / 2;

        // Generate and draw characters
        for (let i = 0; i < 6; i++) {
            const char = chars.charAt(Math.floor(Math.random() * chars.length));
            captcha += char;
            
            const hue = Math.floor(Math.random() * 360);
            ctx.fillStyle = `hsl(${hue}, 50%, 30%)`;

            const x = startX + (i * charWidth);
            const y = centerY + (Math.random() * 6 - 3);
            ctx.fillText(char, x, y);
        }

        // Add noise lines
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, 0);
            ctx.lineTo(Math.random() * canvas.width, canvas.height);
            ctx.stroke();
        }

        setForgotPasswordCaptchaText(captcha);
        setForgotPasswordCaptchaInput('');
        setIsForgotPasswordCaptchaCorrect(null);
    };

    const handleCaptchaInput = (e) => {
        const input = e.target.value;
        setUserCaptchaInput(input);
        setIsCaptchaCorrect(input === captchaText);
    };

    const handleForgotPasswordCaptchaInput = (e) => {
        const input = e.target.value;
        setForgotPasswordCaptchaInput(input);
        setIsForgotPasswordCaptchaCorrect(input === forgotPasswordCaptchaText);
    };

    const notify = (message, type = 'success') => {
        toast[type](message, {
            duration: 4000, // Increased duration for blocked messages
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

    const validateSchoolId = (id) => {
        const schoolIdPattern = /^[^-]+-[^-]+-[^-]+$/;
        return schoolIdPattern.test(id);
    };

    const handleUsernameChange = (e) => {
        const input = e.target.value;
        setUsername(input);
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
    
        if (!username || !password || !isCaptchaCorrect) {
            notify("Please fill in all fields and complete the CAPTCHA correctly.", 'error');
            generateCaptcha(); // Refresh captcha on validation failure
            return;
        }
    
        if (!validateSchoolId(username)) {
            notify("Invalid school ID format.", 'error');
            generateCaptcha(); // Refresh captcha on validation failure
            return;
        }
    
        setLoading(true);
    
        try {
            const loginResponse = await axios.post(`${localStorage.getItem("url")}login.php`, {
                operation: "login",
                json: { 
                    username: username, 
                    password: password 
                }
            });
    
            if (loginResponse.data.status === "success") {
                const userData = loginResponse.data.data;
                
                // Set initial activity timestamp using the centralized function
                updateLastActivity();
                
                // Set encrypted session cookie with 5-minute expiry
                setSessionCookie('userSession', {
                    user_id: userData.user_id,
                    school_id: userData.school_id,
                    user_level: userData.user_level_name,
                    timestamp: new Date().getTime() // Add timestamp for additional security
                });
    
                // Continue with existing login flow...
                // Step 2: Check if 2FA is active
                const is2FAactive = userData.is_2FAactive === "1";
    
                if (is2FAactive && !showLoginOTP) {
                    // Step 3: If 2FA is active and OTP input is not shown, send OTP
                    const otpResponse = await axios.post(`${localStorage.getItem("url")}update_master2.php`, {
                        operation: "sendLoginOTP",
                        json: { 
                            id: username
                        }
                    });
    
                    if (otpResponse.data.status === "success") {
                        // Show OTP input form
                        setShowLoginOTP(true);
                        notify("OTP has been sent to your email. Please verify.");
                    } else {
                        notify("Failed to send OTP. Please try again.", 'error');
                    }
                } else if (is2FAactive && showLoginOTP) {
                    // Step 4: If 2FA is active and OTP input is shown, verify OTP
                    const otpValue = loginOtpDigits.join('');
                    if (otpValue.length !== 8) {
                        notify("Please enter complete OTP", 'error');
                        return;
                    }
    
                    const otpResponse = await axios.post(`${localStorage.getItem("url")}update_master2.php`, {
                        operation: "validateLoginOTP",
                        json: { 
                            id: username,
                            otp: otpValue
                        }
                    });
    
                    if (otpResponse.data.status === "success" && otpResponse.data.authenticated) {
                        // If user opted for 7-day authentication, update auth period
                        if (allowSevenDayAuth) {
                            await axios.post(`${localStorage.getItem("url")}update_master2.php`, {
                                operation: "updateAuthPeriod",
                                json: { 
                                    user_id: userData.user_id
                                }
                            });
                        }
    
                        // Complete login
                        localStorage.clear();
                        sessionStorage.clear();
    
                        // Set localStorage items
                        localStorage.setItem("user_id", userData.user_id);
                        localStorage.setItem("name", `${userData.firstname} ${userData.middlename} ${userData.lastname}`.trim());
                        localStorage.setItem("school_id", userData.school_id);
                        localStorage.setItem("contact_number", userData.contact_number);
                        localStorage.setItem("user_level", userData.user_level_name);
                        localStorage.setItem("user_level_id", userData.user_level_id);
                        localStorage.setItem("department_id", userData.department_id);
                        localStorage.setItem("profile_pic", userData.profile_pic || "");
                        localStorage.setItem("loggedIn", "true");
    
                        // Set sessionStorage items
                        sessionStorage.setItem("user_id", userData.user_id);
                        sessionStorage.setItem("name", `${userData.firstname} ${userData.middlename} ${userData.lastname}`.trim());
                        sessionStorage.setItem("school_id", userData.school_id);
                        sessionStorage.setItem("contact_number", userData.contact_number);
                        sessionStorage.setItem("user_level", userData.user_level_name);
                        sessionStorage.setItem("user_level_id", userData.user_level_id);
                        sessionStorage.setItem("department_id", userData.department_id);
                        sessionStorage.setItem("profile_pic", userData.profile_pic || "");
                        sessionStorage.setItem("loggedIn", "true");
    
                        // Handle "Remember Me" functionality
                        if (rememberMe) {
                            localStorage.setItem("rememberedUsername", username);
                        } else {
                            localStorage.removeItem("rememberedUsername");
                        }
    
                        // Navigate based on user level
                        const userLevel = userData.user_level_name;
                        switch(userLevel) {
                            case "Super Admin":
                                notify("Super Admin Login Successful");
                                navigateTo("/adminDashboard");
                                break;
                            case "Personnel":
                                notify("Personnel Login Successful");
                                navigateTo("/personnelDashboard");
                                break;
                            case "Admin":
                                notify("Admin Login Successful");
                                navigateTo("/adminDashboard");
                                break;
                            case "Dean":
                                notify("Dean Login Successful");
                                navigateTo("/deanDashboard");
                                break;
                            default:
                                notify("User Login Successful");
                                navigateTo("/dashboard");
                        }
                    } else {
                        notify("Invalid OTP. Please try again.", 'error');
                        setLoginOtpDigits(Array(8).fill(''));
                    }
                } else {
                    // Step 5: If 2FA is not active, proceed with direct login
                    localStorage.clear();
                    sessionStorage.clear();
    
                    // Set localStorage items
                    localStorage.setItem("user_id", userData.user_id);
                    localStorage.setItem("name", `${userData.firstname} ${userData.middlename} ${userData.lastname}`.trim());
                    localStorage.setItem("school_id", userData.school_id);
                    localStorage.setItem("contact_number", userData.contact_number);
                    localStorage.setItem("user_level", userData.user_level_name);
                    localStorage.setItem("user_level_id", userData.user_level_id);
                    localStorage.setItem("department_id", userData.department_id);
                    localStorage.setItem("profile_pic", userData.profile_pic || "");
                    localStorage.setItem("loggedIn", "true");
    
                    // Set sessionStorage items
                    sessionStorage.setItem("user_id", userData.user_id);
                    sessionStorage.setItem("name", `${userData.firstname} ${userData.middlename} ${userData.lastname}`.trim());
                    sessionStorage.setItem("school_id", userData.school_id);
                    sessionStorage.setItem("contact_number", userData.contact_number);
                    sessionStorage.setItem("user_level", userData.user_level_name);
                    sessionStorage.setItem("user_level_id", userData.user_level_id);
                    sessionStorage.setItem("department_id", userData.department_id);
                    sessionStorage.setItem("profile_pic", userData.profile_pic || "");
                    sessionStorage.setItem("loggedIn", "true");
    
                    // Handle "Remember Me" functionality
                    if (rememberMe) {
                        localStorage.setItem("rememberedUsername", username);
                    } else {
                        localStorage.removeItem("rememberedUsername");
                    }
    
                    // Navigate based on user level
                    const userLevel = userData.user_level_name;
                    switch(userLevel) {
                        case "Super Admin":
                            notify("Super Admin Login Successful");
                            navigateTo("/adminDashboard");
                            break;
                        case "Personnel":
                            notify("Personnel Login Successful");
                            navigateTo("/personnelDashboard");
                            break;
                        case "Admin":
                            notify("Admin Login Successful");
                            navigateTo("/adminDashboard");
                            break;
                        case "Dean":
                            notify("Dean Login Successful");
                            navigateTo("/deanDashboard");
                            break;
                        default:
                            notify("User Login Successful");
                            navigateTo("/dashboard");
                    }
                }
            } else {
                // Password is incorrect
                notify("Incorrect password. Please try again.", 'error');
                generateCaptcha();
            }
        } catch (error) {
            console.error('Login error:', error);
            removeSessionCookie('userSession');
            notify("Login failed. Please try again.", 'error');
            generateCaptcha();
        } finally {
            setLoading(false);
        }
    };

    const handleCheckEmail = async () => {
        if (!email) {
            notify("Please enter your email address", 'error');
            return;
        }

        setIsVerifyingEmail(true);
        try {
            const response = await axios.post(`${localStorage.getItem("url")}login.php`, {
                operation: "checkEmail",
                json: { email }
            });

            if (response.data.status === "exists") {
                setIsEmailValid(true);
                setShowCaptchaAfterEmail(true);
                generateCaptcha();
            } else {
                setIsEmailValid(false);
                notify("Email not found in our records", 'error');
            }
        } catch (error) {
            notify("Error verifying email", 'error');
        } finally {
            setIsVerifyingEmail(false);
        }
    };

    const handleSendOTP = async (isResend = false) => {
        if (!isResend && !isForgotPasswordCaptchaCorrect) {
            notify("Please complete the CAPTCHA verification", 'error');
            return;
        }

        if (isResend) {
            setIsResending(true);
        } else {
            setIsSendingOtp(true);
        }

        try {
            const response = await axios.post(`${localStorage.getItem("url")}update_master2.php`, {
                operation: "send_password_reset_otp",
                email: email
            });

            if (response.data.status === "success") {
                setResetKey(response.data.key);
                setShowOtpInput(true);
                setResendTimer(180); // Reset timer
                setCanResendOtp(false);
                notify(isResend ? "OTP resent successfully" : "OTP sent to your email", 'success');
            } else {
                notify(response.data.message || "Failed to send OTP", 'error');
            }
        } catch (error) {
            notify(error.response?.data?.message || "Error sending OTP", 'error');
        } finally {
            if (isResend) {
                setIsResending(false);
            } else {
                setIsSendingOtp(false);
            }
        }
    };

    const handleOtpChange = (index, value) => {
        if (value.length > 1) return; // Only allow single digit

        const newOtpDigits = [...otpDigits];
        newOtpDigits[index] = value;
        setOtpDigits(newOtpDigits);

        // Move to next input if value is entered
        if (value && index < 7) {
            otpRefs[index + 1].current.focus();
        }
        
        // Auto-verify if all digits are filled
        if (value && index === 7) {
            const allFilled = newOtpDigits.every(digit => digit !== '');
            if (allFilled) {
                handleVerifyOtp();
            }
        }
    };

    const handleKeyDown = (index, e) => {
        // Move to previous input on backspace if current input is empty
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            otpRefs[index - 1].current.focus();
        }
        // Trigger verification on Enter if all digits are filled
        if (e.key === 'Enter') {
            const allFilled = otpDigits.every(digit => digit !== '');
            if (allFilled) {
                handleVerifyOtp();
            }
        }
    };

    const handleVerifyOtp = async () => {
        const otpValue = otpDigits.join('');
        if (otpValue.length !== 8) {
            notify("Please enter complete OTP", 'error');
            return;
        }

        try {
            const response = await axios.post(`${localStorage.getItem("url")}update_master2.php`, {
                operation: "validate_otp",
                otp: otpValue,
                email: email // Add email parameter to the request
            });

            if (response.data.status === "success") {
                setShowPasswordReset(true);
                notify("OTP verified successfully");
            } else {
                notify(response.data.message || "Invalid OTP", 'error');
                setOtpDigits(Array(8).fill(''));
            }
        } catch (error) {
            notify("Error validating OTP", 'error');
        }
    };

    const handlePasswordReset = async () => {
        if (!isPasswordValid()) {
            notify("Please ensure password meets all requirements", 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            notify("Passwords do not match", 'error');
            return;
        }

        try {
            const response = await axios.post(`${localStorage.getItem("url")}update_master2.php`, {
                operation: "update_password",
                email: email,
                password: newPassword
            });

            if (response.data.status === "success") {
                notify("Password successfully updated");
                handleModalClose();
            } else {
                notify(response.data.message || "Failed to update password", 'error');
            }
        } catch (error) {
            notify("Error updating password", 'error');
        }
    };

    const handleEmailKeyPress = (e) => {
        if (e.key === 'Enter' && !showCaptchaAfterEmail) {
            e.preventDefault();
            handleCheckEmail();
        }
    };

    const handleCaptchaKeyPress = (e) => {
        if (e.key === 'Enter' && showCaptchaAfterEmail) {
            e.preventDefault();
            handleSendOTP();
        }
    };

    const handlePasswordKeyPress = (e) => {
        if (e.key === 'Enter' && isPasswordValid() && newPassword === confirmPassword) {
            handlePasswordReset();
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleModalClose = () => {
        setShowForgotPassword(false);
        // Don't clear email
        setIsEmailValid(null);
        setForgotPasswordCaptchaInput('');
        setIsForgotPasswordCaptchaCorrect(null);
        setShowCaptchaAfterEmail(false);
        setOtpDigits(Array(8).fill(''));
        setShowOtpInput(false);
        setResendTimer(180);
        setCanResendOtp(false);
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

    const checkPasswordStrength = (password) => {
        return {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
    };

    const handleNewPasswordChange = (e) => {
        const password = e.target.value;
        setNewPassword(password);
        setPasswordStrength(checkPasswordStrength(password));
    };

    const isPasswordValid = () => {
        return Object.values(passwordStrength).every(value => value === true);
    };

    const handleLoginOtpChange = (index, value) => {
        if (value.length > 1) return;

        const newOtpDigits = [...loginOtpDigits];
        newOtpDigits[index] = value;
        setLoginOtpDigits(newOtpDigits);

        if (value && index < 7) {
            loginOtpRefs[index + 1].current.focus();
        }
    };

    const handleLoginOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !loginOtpDigits[index] && index > 0) {
            loginOtpRefs[index - 1].current.focus();
        }
    };

    const handleVerifyLoginOTP = async () => {
        const otpValue = loginOtpDigits.join('');
        if (otpValue.length !== 8) {
            notify("Please enter complete OTP", 'error');
            return;
        }

        setIsVerifyingLoginOtp(true);
        try {
            // First verify OTP
            const response = await axios.post(`${localStorage.getItem("url")}update_master2.php`, {
                operation: "validateLoginOTP",
                json: { 
                    id: username,
                    otp: otpValue
                }
            });

            if (response.data.status === "success" && response.data.authenticated) {
                // If user opted for 7-day authentication, update auth period
                if (allowSevenDayAuth) {
                    const authResponse = await axios.post(`${localStorage.getItem("url")}update_master2.php`, {
                        operation: "updateAuthPeriod",
                        json: { 
                            user_id: response.data.user_id
                        }
                    });
                    
                    if (authResponse.data.status !== "success") {
                        notify("Failed to set authentication period", 'error');
                    }
                }

                // Proceed with login
                const loginResponse = await axios.post(`${localStorage.getItem("url")}login.php`, {
                    operation: "login",
                    json: { 
                        username: username, 
                        password: password 
                    }
                });

                if (loginResponse.data.status === "success") {
                    const userData = loginResponse.data.data;
                    
                    // Clear existing storage
                    localStorage.clear();
                    sessionStorage.clear();

                    // Set localStorage items
                    localStorage.setItem("user_id", userData.user_id);
                    localStorage.setItem("name", `${userData.firstname} ${userData.middlename} ${userData.lastname}`.trim());
                    localStorage.setItem("school_id", userData.school_id);
                    localStorage.setItem("contact_number", userData.contact_number);
                    localStorage.setItem("user_level", userData.user_level_name);
                    localStorage.setItem("user_level_id", userData.user_level_id);
                    localStorage.setItem("department_id", userData.department_id);
                    localStorage.setItem("profile_pic", userData.profile_pic || "");
                    localStorage.setItem("loggedIn", "true");
                
                    // Set sessionStorage items
                    sessionStorage.setItem("user_id", userData.user_id);
                    sessionStorage.setItem("name", `${userData.firstname} ${userData.middlename} ${userData.lastname}`.trim());
                    sessionStorage.setItem("school_id", userData.school_id);
                    sessionStorage.setItem("contact_number", userData.contact_number);
                    sessionStorage.setItem("user_level", userData.user_level_name);
                    sessionStorage.setItem("user_level_id", userData.user_level_id);
                    sessionStorage.setItem("department_id", userData.department_id);
                    sessionStorage.setItem("profile_pic", userData.profile_pic || "");
                    sessionStorage.setItem("loggedIn", "true");
                    
                    // Handle "Remember Me" functionality
                    if (rememberMe) {
                        localStorage.setItem("rememberedUsername", username);
                    } else {
                        localStorage.removeItem("rememberedUsername");
                    }

                    // Navigate based on user level
                    const userLevel = userData.user_level_name;
                    switch(userLevel) {
                        case "Super Admin":
                            notify("Super Admin Login Successful");
                            navigateTo("/adminDashboard");
                            break;
                        case "Personnel":
                            notify("Personnel Login Successful");
                            navigateTo("/personnelDashboard");
                            break;
                        case "Admin":
                            notify("Admin Login Successful");
                            navigateTo("/adminDashboard");
                            break;
                        case "Dean":
                            notify("Dean Login Successful");
                            navigateTo("/deanDashboard");
                            break;
                        default:
                            notify("User Login Successful");
                            navigateTo("/dashboard");
                    }
                } else {
                    notify("Error retrieving user data", 'error');
                }
            } else {
                notify("Invalid OTP", 'error');
                setLoginOtpDigits(Array(8).fill(''));
            }
        } catch (error) {
            console.error('Error during OTP verification:', error);
            notify("Error verifying OTP", 'error');
            setLoginOtpDigits(Array(8).fill(''));
        } finally {
            setIsVerifyingLoginOtp(false);
        }
    };

    const handleResendLoginOTP = async () => {
        setIsResendingLoginOtp(true);
        try {
            const response = await axios.post(`${localStorage.getItem("url")}update_master2.php`, {
                operation: "sendLoginOTP",
                json: { 
                    id: username
                }
            });

            if (response.data.status === "success") {
                setLoginResendTimer(180);
                setCanResendLoginOtp(false);
                notify("OTP has been resent to your email");
            } else {
                notify(response.data.message || "Failed to resend OTP", 'error');
            }
        } catch (error) {
            notify("Error resending OTP", 'error');
        } finally {
            setIsResendingLoginOtp(false);
        }
    };

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key="login"
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className='flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-green-50 to-green-100 overflow-x-hidden'
            >
                {/* Left side: Introduction with picture */}
                <motion.div 
                    initial={{ opacity: 0, x: -50 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ duration: 0.5 }}
                    className='w-full md:w-1/2 p-4 md:p-8 flex flex-col items-center justify-center bg-gradient-to-br from-white to-green-100 text-green-800 relative'
                >
                    <motion.img 
                        src="/images/assets/phinma.png" 
                        alt="PHINMA CDO Logo" 
                        className='w-32 h-32 md:w-64 md:h-64 object-cover rounded-full mb-4 md:mb-8 shadow-lg'
                        whileHover={{ scale: 1.1, rotate: 360 }}
                        transition={{ duration: 0.5 }}
                    />
                    <motion.h2 
                        className='text-2xl md:text-4xl font-bold mb-2 md:mb-4 text-green-700 font-sans text-center'
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        General Service Department
                    </motion.h2>
                    <motion.h3 
                        className='text-xl md:text-2xl font-semibold mb-2 text-green-600 font-sans text-center'
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        Reservation and Monitoring System
                    </motion.h3>

                    {/* Features list - Hidden on small screens */}
                    <motion.ul 
                        className='hidden md:block space-y-4 mt-8'
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
                    className='w-full md:w-1/2 p-4 md:p-8 flex items-center justify-center relative'
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
                        {!showLoginOTP ? (
                            <>
                                <div className='bg-gradient-to-r from-green-600 to-green-700 p-4 md:p-6 text-white'>
                                    <h2 className='text-center text-2xl md:text-3xl font-bold'>General Service Department</h2>
                                    <p className='text-center text-green-100 mt-2 text-sm md:text-base'>Please login to your account</p>
                                </div>
                                <div className='p-4 md:p-8'>
                                    <form onSubmit={handleLogin} className='space-y-4 md:space-y-6'>
                                        <div className='space-y-1 md:space-y-2'>
                                            <label className='text-sm font-medium text-gray-700' htmlFor='username'>
                                                Username
                                            </label>
                                            <div className='relative rounded-md shadow-sm'>
                                                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                                    <FaUser className='text-green-500' />
                                                </div>
                                                <input 
                                                    value={username} 
                                                    onChange={handleUsernameChange} 
                                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition duration-150 ease-in-out" 
                                                    id='username' 
                                                    type='text'
                                                    placeholder='Enter your school ID (e.g., COL-2023-001)' 
                                                    required 
                                                />
                                            </div>
                                        </div>

                                        <div className='space-y-1 md:space-y-2'>
                                            <label className='text-sm font-medium text-gray-700' htmlFor='password'>
                                                Password
                                            </label>
                                            <div className='relative rounded-md shadow-sm'>
                                                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                                    <FaLock className='text-green-500' />
                                                </div>
                                                <input 
                                                    value={password} 
                                                    onChange={handlePasswordChange} 
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

                                        <div className='space-y-1 md:space-y-2'>
                                            <label className='text-sm font-medium text-gray-700'>
                                                Security Verification
                                            </label>
                                            <div className='space-y-2 md:space-y-3'>
                                                <div className='relative bg-white rounded-lg shadow-sm border border-gray-200 p-2 md:p-4'>
                                                    <canvas
                                                        ref={captchaCanvasRef}
                                                        width="280"
                                                        height="60"
                                                        className='w-full bg-white rounded-md'
                                                    />
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={generateCaptcha}
                                                        type="button"
                                                        className='absolute top-2 right-2 p-2 text-green-600 hover:text-green-700 rounded-full hover:bg-green-50 transition-colors'
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                                        </svg>
                                                    </motion.button>
                                                </div>
                                                <div className='relative rounded-md shadow-sm'>
                                                    <input
                                                        type="text"
                                                        value={userCaptchaInput}
                                                        onChange={handleCaptchaInput}
                                                        className={`block w-full px-4 py-2 border ${
                                                            isCaptchaCorrect === false ? 'border-red-500' : 
                                                            isCaptchaCorrect === true ? 'border-green-500' : 
                                                            'border-gray-300'
                                                        } rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors`}
                                                        placeholder='Enter the characters above'
                                                    />
                                                    {isCaptchaCorrect === false && (
                                                        <motion.p
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className='absolute text-xs text-red-500 mt-1'
                                                        >
                                                            Incorrect CAPTCHA. Please try again.
                                                        </motion.p>
                                                    )}
                                                </div>
                                            </div>
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
                                            disabled={loading}
                                        >
                                            {loading ? 'Logging in...' : 'Sign In'}
                                        </motion.button>
                                    </form>

                                    <div className='mt-4 md:mt-6 text-center'>
                                        <button
                                            onClick={() => setShowForgotPassword(true)}
                                            className='text-xs md:text-sm text-green-600 hover:text-green-700 transition duration-150 ease-in-out'
                                        >
                                            Forgot your password?
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            // OTP verification form
                            <div className="p-8 space-y-4">
                                <h2 className="text-2xl font-bold text-green-700 text-center">
                                    OTP Verification
                                </h2>
                                <p className="text-center text-gray-600">
                                    Enter the 8-digit OTP sent to your email
                                </p>
                                <div className="flex justify-between space-x-2">
                                    {loginOtpDigits.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={loginOtpRefs[index]}
                                            type="text"
                                            maxLength="1"
                                            value={digit}
                                            onChange={(e) => handleLoginOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleLoginOtpKeyDown(index, e)}
                                            className="w-10 h-12 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                    ))}
                                </div>
                                
                                <div className="flex items-center space-x-2 mt-4">
                                    <input
                                        type="checkbox"
                                        id="allowSevenDayAuth"
                                        checked={allowSevenDayAuth}
                                        onChange={(e) => setAllowSevenDayAuth(e.target.checked)}
                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="allowSevenDayAuth" className="text-sm text-gray-700">
                                        Allow login for 7 days
                                    </label>
                                </div>

                                <button
                                    onClick={handleVerifyLoginOTP}
                                    disabled={isVerifyingLoginOtp}
                                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                                >
                                    {isVerifyingLoginOtp ? 'Verifying...' : 'Verify OTP'}
                                </button>
                                
                                <div className="text-center">
                                    {loginResendTimer > 0 ? (
                                        <p className="text-sm text-gray-600">
                                            Resend OTP in {formatTime(loginResendTimer)}
                                        </p>
                                    ) : (
                                        <button
                                            onClick={handleResendLoginOTP}
                                            disabled={isResendingLoginOtp}
                                            className="text-green-600 hover:text-green-700 text-sm underline"
                                        >
                                            {isResendingLoginOtp ? 'Resending...' : 'Resend OTP'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
            <Modal
                title={<h2 className="text-2xl font-bold text-green-700">Reset Password</h2>}
                open={showForgotPassword}
                onCancel={handleModalClose}
                footer={null}
                maskClosable={false}
                className="max-w-md"
            >
                <div className="space-y-4">
                    {!showOtpInput ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyPress={handleEmailKeyPress}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Enter your email"
                                    disabled={showCaptchaAfterEmail}
                                />
                            </div>

                            {!showCaptchaAfterEmail ? (
                                <button
                                    onClick={handleCheckEmail}
                                    disabled={isVerifyingEmail}
                                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                                >
                                    {isVerifyingEmail ? 'Verifying...' : 'Verify Email'}
                                </button>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        <div className="relative bg-white rounded-lg shadow-sm border border-gray-200 p-2">
                                            <canvas
                                                ref={forgotPasswordCaptchaRef}
                                                width="280"
                                                height="60"
                                                className="w-full bg-white rounded-md"
                                            />
                                            <button
                                                onClick={generateForgotPasswordCaptcha}
                                                className="absolute top-2 right-2 p-2 text-green-600 hover:text-green-700 rounded-full hover:bg-green-50 transition-colors"
                                                type="button"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            value={forgotPasswordCaptchaInput}
                                            onChange={handleForgotPasswordCaptchaInput}
                                            onKeyPress={handleCaptchaKeyPress}
                                            className={`w-full px-3 py-2 border ${
                                                isForgotPasswordCaptchaCorrect === false ? 'border-red-500' : 
                                                isForgotPasswordCaptchaCorrect === true ? 'border-green-500' : 
                                                'border-gray-300'
                                            } rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                                            placeholder="Enter captcha"
                                        />
                                        {isForgotPasswordCaptchaCorrect === false && (
                                            <p className="text-xs text-red-500">Incorrect CAPTCHA. Please try again.</p>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleSendOTP}
                                        disabled={!isForgotPasswordCaptchaCorrect || isSendingOtp}
                                        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {isSendingOtp ? 'Sending OTP...' : 'Send OTP'}
                                    </button>
                                </>
                            )}
                        </>
                    ) : !showPasswordReset ? (
                        <div className="space-y-4">
                            <p className="text-green-600 mb-4">Enter the 8-digit OTP sent to your email</p>
                            <div className="flex justify-between space-x-2">
                                {otpDigits.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={otpRefs[index]}
                                        type="text"
                                        maxLength="1"
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className="w-10 h-12 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                ))}
                            </div>
                            <div className="text-center space-y-2">
                                <button
                                    onClick={handleVerifyOtp}
                                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                >
                                    Verify OTP
                                </button>
                                
                                {!canResendOtp ? (
                                    <p className="text-sm text-gray-600">
                                        Resend OTP in {formatTime(resendTimer)}
                                    </p>
                                ) : (
                                    <button
                                        onClick={() => handleSendOTP(true)}
                                        disabled={isResending}
                                        className="text-green-600 hover:text-green-700 text-sm"
                                    >
                                        {isResending ? 'Resending...' : 'Resend OTP'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900">Reset Password</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={handleNewPasswordChange}
                                    onKeyPress={handlePasswordKeyPress}
                                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <div className="mt-2 space-y-1">
                                    <p className={`text-xs ${passwordStrength.length ? 'text-green-600' : 'text-red-500'}`}>
                                        ✓ At least 8 characters
                                    </p>
                                    <p className={`text-xs ${passwordStrength.uppercase ? 'text-green-600' : 'text-red-500'}`}>
                                        ✓ One uppercase letter
                                    </p>
                                    <p className={`text-xs ${passwordStrength.lowercase ? 'text-green-600' : 'text-red-500'}`}>
                                        ✓ One lowercase letter
                                    </p>
                                    <p className={`text-xs ${passwordStrength.number ? 'text-green-600' : 'text-red-500'}`}>
                                        ✓ One number
                                    </p>
                                    <p className={`text-xs ${passwordStrength.special ? 'text-green-600' : 'text-red-500'}`}>
                                        ✓ One special character
                                    </p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    onKeyPress={handlePasswordKeyPress}
                                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                            <button
                                onClick={handlePasswordReset}
                                disabled={!isPasswordValid() || newPassword !== confirmPassword}
                                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                            >
                                Reset Password
                            </button>
                        </div>
                    )}
                </div>
            </Modal>
            <Toaster position="top-right" reverseOrder={false} />
        </AnimatePresence>
    );
}

export default Logins;
