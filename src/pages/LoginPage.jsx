import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader, Eye, EyeOff, X, ShieldAlert, Lock, Clock, AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import axios from "axios";
import { API_BASE_URL } from "../config";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("Invalid credentials");
  const [loading, setLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  
  // Lockout state
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutRemainingSeconds, setLockoutRemainingSeconds] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);
  const [warningMessage, setWarningMessage] = useState(null);
  
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check lockout status from server (the source of truth)
  const checkServerLockoutStatus = useCallback(async (emailToCheck) => {
    if (!emailToCheck || !emailToCheck.includes('@')) return;
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin-management/check-lockout`, {
        email: emailToCheck
      });
      
      const data = response.data;
      console.log('🔒 Server lockout status:', data);
      
      if (data.isLocked) {
        setIsLocked(true);
        setLockoutRemainingSeconds(data.remainingSeconds || 0);
        setAttemptsRemaining(0);
        setWarningMessage(null);
      } else {
        setIsLocked(false);
        setLockoutRemainingSeconds(0);
        setAttemptsRemaining(data.attemptsRemaining);
        
        // Show warning if attempts are low
        if (data.attemptsRemaining <= 2 && data.failedAttempts > 0) {
          setWarningMessage(`Warning: ${data.attemptsRemaining} attempt(s) remaining before account lockout.`);
        } else {
          setWarningMessage(null);
        }
      }
    } catch (error) {
      console.error('Error checking lockout status:', error);
      // Don't block login on error - let the login attempt handle it
    }
  }, []);

  // Countdown timer for lockout with periodic server sync
  useEffect(() => {
    let countdownInterval;
    let syncInterval;
    
    if (isLocked && lockoutRemainingSeconds > 0) {
      // Local countdown every second
      countdownInterval = setInterval(() => {
        setLockoutRemainingSeconds(prev => {
          if (prev <= 1) {
            // When timer ends, verify with server
            checkServerLockoutStatus(email);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Sync with server every 30 seconds to prevent drift/tampering
      syncInterval = setInterval(() => {
        if (email) {
          checkServerLockoutStatus(email);
        }
      }, 30000);
    }
    
    return () => {
      clearInterval(countdownInterval);
      clearInterval(syncInterval);
    };
  }, [isLocked, lockoutRemainingSeconds, email, checkServerLockoutStatus]);

  // Check lockout status when email changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (email && email.includes('@')) {
        checkServerLockoutStatus(email);
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [email, checkServerLockoutStatus]);

  // Also check on page load if there's a stored email (from browser autofill)
  useEffect(() => {
    // Small delay to allow browser autofill to populate
    const timeoutId = setTimeout(() => {
      if (email && email.includes('@')) {
        checkServerLockoutStatus(email);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [checkServerLockoutStatus]); // Added dependency

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    
    try {
      console.log("Attempting login with:", email, password);
      
      // Use the login function from AuthContext
      const success = await login(email, password);
      console.log("Login successful:", success);
      
      // Redirect to dashboard
      navigate("/");
    } catch (err) {
      console.error("Login error details:", err);
      console.error("Error response data:", err.response?.data);
      console.error("Error status:", err.response?.status);
      
      const responseData = err.response?.data;
      let message = "Invalid credentials. Please check your email and password.";
      
      if (err.response) {
        // Check if account is locked (HTTP 429 Too Many Requests)
        if (err.response.status === 429 || responseData?.isLocked) {
          setIsLocked(true);
          setLockoutRemainingSeconds(responseData?.remainingSeconds || 1800); // Default 30 min
          setAttemptsRemaining(0);
          message = responseData?.message || "Account temporarily locked due to too many failed attempts.";
        } else {
          // Handle remaining attempts
          if (responseData?.attemptsRemaining !== undefined) {
            setAttemptsRemaining(responseData.attemptsRemaining);
          }
          
          // Handle warning message
          if (responseData?.warningMessage) {
            setWarningMessage(responseData.warningMessage);
          } else {
            setWarningMessage(null);
          }
          
          // Use server message if available
          message = responseData?.message || message;
          
          // Keep specific messages for deactivated accounts
          if (message.toLowerCase().includes('deactivated')) {
            // Keep the deactivated message as-is
          } else if (message.toLowerCase().includes('invalid') || message.toLowerCase().includes('incorrect')) {
            // Keep the server message but add attempts info if available
            if (responseData?.attemptsRemaining !== undefined) {
              message = `Invalid credentials. ${responseData.attemptsRemaining} attempt(s) remaining.`;
            }
          }
        }
      } else {
        // Network error or no response
        message = "Unable to connect to server. Please check your connection.";
      }
      
      setErrorMessage(message);
      setError(true);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex items-center justify-center min-h-screen w-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} transition-colors duration-300`}>
      {/* Background */}
      <div className={`fixed inset-0 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100'} opacity-90 transition-colors duration-300`} />
      {/* Theme toggle button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleTheme}
        className={`absolute top-4 right-4 p-2 rounded-full ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-200'} transition-colors z-20`}
        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {isDarkMode ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </motion.button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`z-10 w-full max-w-md p-8 rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-xl transition-colors duration-300`}
      >
        <div className="flex flex-col items-center justify-center mb-6">
          <img 
            src="/ecoride_logo1_nobg.png" 
            alt="Ecoride Admin Panel" 
            className="h-28 w-auto mb-4"
          />
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} transition-colors duration-300`}>Admin Login</h2>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-2 transition-colors duration-300`}>
            Login to manage users and system settings
          </p>
        </div>

        {/* Lockout Banner */}
        <AnimatePresence>
          {isLocked && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className={`mb-6 p-4 rounded-lg border-2 ${
                isDarkMode 
                  ? 'bg-red-900/30 border-red-700' 
                  : 'bg-red-50 border-red-300'
              }`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className={`p-2 rounded-full ${isDarkMode ? 'bg-red-800' : 'bg-red-200'}`}>
                  <Lock className={`${isDarkMode ? 'text-red-300' : 'text-red-600'}`} size={20} />
                </div>
                <div>
                  <h3 className={`font-semibold ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                    Account Temporarily Locked
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                    Too many failed login attempts
                  </p>
                </div>
              </div>
              <div className={`flex items-center justify-center space-x-2 p-3 rounded-lg ${
                isDarkMode ? 'bg-red-900/50' : 'bg-red-100'
              }`}>
                <Clock className={`${isDarkMode ? 'text-red-300' : 'text-red-600'}`} size={18} />
                <span className={`font-mono text-lg font-bold ${isDarkMode ? 'text-red-200' : 'text-red-700'}`}>
                  {formatTime(lockoutRemainingSeconds)}
                </span>
                <span className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                  until unlock
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Warning Banner - Shows when attempts are low */}
        <AnimatePresence>
          {!isLocked && warningMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-4 p-3 rounded-lg border ${
                isDarkMode 
                  ? 'bg-yellow-900/30 border-yellow-700' 
                  : 'bg-yellow-50 border-yellow-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className={`${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} size={18} />
                <span className={`text-sm font-medium ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                  {warningMessage}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attempts Indicator - Shows remaining attempts after at least 1 failed attempt */}
        <AnimatePresence>
          {!isLocked && attemptsRemaining !== null && attemptsRemaining > 0 && attemptsRemaining < 5 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`mb-4 flex items-center justify-center space-x-2`}
            >
              <div className="flex space-x-1">
                {[...Array(5)].map((_, index) => {
                  // Calculate: first N dots are red (used), remaining are green (available)
                  const usedAttempts = 5 - attemptsRemaining;
                  const isUsed = index < usedAttempts;
                  const isRemaining = index < usedAttempts + attemptsRemaining;
                  
                  return (
                    <div
                      key={index}
                      className={`w-2.5 h-2.5 rounded-full transition-colors ${
                        isUsed
                          ? 'bg-red-500' // Used attempts (failed)
                          : isRemaining
                          ? 'bg-green-500' // Remaining attempts (available)
                          : isDarkMode ? 'bg-gray-600' : 'bg-gray-300' // Shouldn't happen
                      }`}
                    />
                  );
                })}
              </div>
              <span className={`text-xs font-medium ${
                attemptsRemaining <= 2 
                  ? isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                  : isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {attemptsRemaining}/5 attempts remaining
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 transition-colors duration-300`}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-300 ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder="Enter your email"
              required
              disabled={loading || isLocked}
            />
          </div>

          <div>
            <label htmlFor="password" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 transition-colors duration-300`}>
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-2 pr-10 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-300 ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="Enter your password"
                required
                disabled={loading || isLocked}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`w-full py-2 px-4 ${isLocked ? 'bg-gray-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 flex items-center justify-center`}
            disabled={loading || isLocked}
          >
            {loading ? (
              <>
                <Loader size={18} className="animate-spin mr-2" />
                Signing In...
              </>
            ) : isLocked ? (
              <>
                <Lock size={18} className="mr-2" />
                Account Locked
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Error notification - inline */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-md flex items-center text-red-200"
            >
              <AlertCircle size={18} className="mr-2" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error Modal Popup */}
      <AnimatePresence>
        {showErrorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowErrorModal(false)}
              className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative w-full max-w-md rounded-2xl shadow-2xl ${
                isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              } transition-colors duration-300`}
            >
              {/* Header */}
              <div className={`flex items-center justify-between p-6 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-600 rounded-lg">
                    <ShieldAlert className="text-white" size={24} />
                  </div>
                  <h2 className={`text-xl font-semibold ${
                    isDarkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>
                    Login Failed
                  </h2>
                </div>
                <button
                  onClick={() => setShowErrorModal(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                      : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className={`mb-4 p-4 rounded-lg ${
                  isDarkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-red-300' : 'text-red-700'
                  }`}>
                    {errorMessage}
                  </p>
                </div>

                {/* Show lockout timer in modal if locked */}
                {isLocked && (
                  <div className={`mb-4 p-4 rounded-lg flex items-center justify-center space-x-3 ${
                    isDarkMode ? 'bg-orange-900/20 border border-orange-800' : 'bg-orange-50 border border-orange-200'
                  }`}>
                    <Clock className={`${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} size={24} />
                    <div className="text-center">
                      <p className={`text-xs ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                        Time remaining
                      </p>
                      <p className={`font-mono text-2xl font-bold ${isDarkMode ? 'text-orange-300' : 'text-orange-700'}`}>
                        {formatTime(lockoutRemainingSeconds)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Show attempts remaining if not locked */}
                {!isLocked && attemptsRemaining !== null && (
                  <div className={`mb-4 p-3 rounded-lg ${
                    attemptsRemaining <= 2
                      ? isDarkMode ? 'bg-yellow-900/20 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'
                      : isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-gray-100 border border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Login attempts:
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          {[...Array(5)].map((_, index) => {
                            // First N dots are red (used), remaining are green (available)
                            const usedAttempts = 5 - attemptsRemaining;
                            const isUsed = index < usedAttempts;
                            
                            return (
                              <div
                                key={index}
                                className={`w-3 h-3 rounded-full ${
                                  isUsed
                                    ? 'bg-red-500' // Used attempts (failed)
                                    : 'bg-green-500' // Remaining attempts (available)
                                }`}
                              />
                            );
                          })}
                        </div>
                        <span className={`font-bold ${
                          attemptsRemaining <= 2
                            ? isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                            : isDarkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                          {attemptsRemaining}/5
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className={`space-y-2 text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  <p className="font-medium">Please check:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Your email address is correct</li>
                    <li>Your password is correct</li>
                    <li>Your account is active</li>
                    <li>You have admin privileges</li>
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div className={`flex justify-end gap-3 p-6 border-t ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;
