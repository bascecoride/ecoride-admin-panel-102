import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, RefreshCw, History, AlertCircle, CheckCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const TermsAndConditions = () => {
  const { isDarkMode } = useTheme();
  const [content, setContent] = useState('');
  const [version, setVersion] = useState('1.0');
  const [loading, setLoading] = useState(false);
  const [fetchingTerms, setFetchingTerms] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [updatedBy, setUpdatedBy] = useState(null);

  useEffect(() => {
    fetchActiveTerms();
    fetchTermsHistory();
  }, []);

  const fetchActiveTerms = async () => {
    try {
      setFetchingTerms(true);
      const response = await axios.get(`${API_URL}/api/terms/active`);
      setContent(response.data.content || '');
      setVersion(response.data.version || '1.0');
      setLastUpdated(response.data.lastUpdated);
      setUpdatedBy(response.data.updatedBy);
    } catch (error) {
      console.error('Error fetching terms:', error);
      // Set default content if none exists
      setContent(getDefaultTerms());
    } finally {
      setFetchingTerms(false);
    }
  };

  const fetchTermsHistory = async () => {
    try {
      const token = localStorage.getItem('admin_access_token');
      const response = await axios.get(`${API_URL}/api/terms/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data.terms || []);
    } catch (error) {
      console.error('Error fetching terms history:', error);
    }
  };

  const getDefaultTerms = () => {
    return `ECORIDE-BASC TERMS AND CONDITIONS
Last Updated: October 2025

Welcome to EcoRide-BASC, a ride-sharing system developed to promote an eco-friendly and convenient transportation experience within Bulacan Agricultural State College (BASC). By creating an account and using the EcoRide-BASC application (the "Service"), you agree to comply with and be bound by these Terms and Conditions.

1. ACCOUNT REGISTRATION AND APPROVAL
1.1 Registration Through the App Only - All users must register exclusively through the official EcoRide-BASC mobile application. No other method of registration is allowed.
1.2 Account Approval Before Use - After registration, users must wait for the administrator's review and approval. Only approved and verified accounts can access and use EcoRide-BASC features such as booking rides, offering rides, viewing notifications, or managing profiles.
1.3 Verification Requirements - Drivers are required to upload a valid school ID and driver's license for verification. - Passengers must upload valid school credentials to confirm that they are official BASC students or faculty members. - Any submission of fake or tampered documents will lead to immediate disapproval or permanent account suspension.
1.4 Account Security - Users are responsible for maintaining the security of their account information. EcoRide-BASC will not be held liable for any misuse caused by user negligence.

2. USER ROLES AND RESPONSIBILITIES
2.1 Drivers - Must ensure their vehicle is in safe, clean, and roadworthy condition. - Must be sure that the passenger paid them correspondedly.
2.2 Passengers - Must verify their payment after a ride by selecting "PAID" or "UNPAID." - Are expected to respect drivers and follow ride rules. - Can only use the system for campus-related transportation or going home.
2.3 Administrators - Are responsible for reviewing, verifying, and approving user registrations. - Have the authority to manage accounts, issue disapprovals, and ensure safe operation of the platform.

3. SYSTEM USAGE POLICY
3.1 Acceptable Use - EcoRide-BASC is intended only for transportation within BASC premises or traveling home from the campus. Any other use beyond these purposes is strictly prohibited.
3.2 Payment Confirmation - After each ride, both the passenger and driver must confirm the payment status. A ride is only marked as completed when both confirmations match.
3.3 Prohibited Activities Users are prohibited from: - Sharing or selling accounts. - Submitting false information or impersonating others. - Using the system for commercial or non-campus-related transport. - Attempting to hack, alter, or exploit the platform in any way.

4. ACCOUNT VIOLATIONS AND PENALTIES
4.1 Penalty Enforcement – Disapproval Only - If a user violates the Terms and Conditions, their account will be disapproved by the administrator. Disapproval serves as the sole form of penalty in the system.
4.2 Ticket Submission for Appeal - If your account has been disapproved and you wish to appeal or clarify the reason, you must go to the designated EcoRide-BASC related office to submit a support ticket for review and resolution. Online appeals are not accepted.

5. DATA PRIVACY AND SECURITY - EcoRide-BASC values your privacy and complies with the Data Privacy Act of 2012. All information collected during registration and verification will be securely stored and used solely for system operations and user authentication.

6. MODIFICATION OF TERMS - EcoRide-BASC reserves the right to modify or update these Terms and Conditions at any time. Continued use of the app after revisions means you agree to the updated terms.

7. CONTACT INFORMATION - For assistance, verification inquiries, or ticket concerns, please visit the designated EcoRide-BASC related office.`;
  };

  const handleSave = async () => {
    if (!content.trim()) {
      setError('Terms and conditions content cannot be empty');
      return;
    }

    if (!version.trim()) {
      setError('Version number is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('admin_access_token');
      const response = await axios.post(
        `${API_URL}/api/terms/update`,
        { content, version },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Terms and conditions updated successfully!');
      setLastUpdated(response.data.terms.lastUpdated);
      setUpdatedBy(response.data.terms.updatedBy);
      
      // Refresh history
      await fetchTermsHistory();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating terms:', error);
      setError(error.response?.data?.message || 'Failed to update terms and conditions');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset to the current saved version?')) {
      fetchActiveTerms();
      setError('');
      setSuccess('');
    }
  };

  const loadHistoryVersion = (historicalTerms) => {
    setContent(historicalTerms.content);
    setVersion(historicalTerms.version);
    setShowHistory(false);
    setSuccess('Historical version loaded. Click Save to apply.');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (fetchingTerms) {
    return (
      <motion.div
        className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} backdrop-blur-md shadow-lg rounded-xl p-6 border mb-6 transition-colors duration-300`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="animate-spin mr-2" size={20} />
          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Loading terms...</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} backdrop-blur-md shadow-lg rounded-xl p-6 border mb-6 transition-colors duration-300`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-800'} transition-colors duration-300`}>
            Terms and Conditions
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} transition-colors duration-300`}>
            Manage the terms and conditions shown to users during registration
          </p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
            isDarkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <History size={18} className="mr-2" />
          {showHistory ? 'Hide' : 'Show'} History
        </button>
      </div>

      {/* Last Updated Info */}
      {lastUpdated && (
        <div className={`mb-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <strong>Last Updated:</strong> {formatDate(lastUpdated)}
            {updatedBy && (
              <span className="ml-4">
                <strong>By:</strong> {updatedBy.firstName} {updatedBy.lastName} ({updatedBy.email})
              </span>
            )}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 border border-red-300 flex items-start">
          <AlertCircle size={18} className="text-red-600 mr-2 mt-0.5 flex-shrink-0" />
          <span className="text-red-800 text-sm">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-100 border border-green-300 flex items-start">
          <CheckCircle size={18} className="text-green-600 mr-2 mt-0.5 flex-shrink-0" />
          <span className="text-green-800 text-sm">{success}</span>
        </div>
      )}

      {/* History Panel */}
      {showHistory && (
        <div className={`mb-6 p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Version History
          </h3>
          {history.length === 0 ? (
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No version history available
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {history.map((item) => (
                <div
                  key={item._id}
                  className={`p-3 rounded-lg border ${
                    item.isActive
                      ? isDarkMode ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-200'
                      : isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                          Version {item.version}
                        </span>
                        {item.isActive && (
                          <span className="px-2 py-0.5 text-xs bg-green-500 text-white rounded">
                            Active
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Updated: {formatDate(item.lastUpdated)}
                        {item.updatedBy && ` by ${item.updatedBy.firstName} ${item.updatedBy.lastName}`}
                      </p>
                    </div>
                    {!item.isActive && (
                      <button
                        onClick={() => loadHistoryVersion(item)}
                        className={`px-3 py-1 text-sm rounded transition-colors ${
                          isDarkMode
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        Load
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Version Input */}
      <div className="mb-4">
        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-300`}>
          Version Number
        </label>
        <input
          type="text"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          placeholder="e.g., 1.0, 2.0, 2.1"
          className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          } transition-colors duration-300`}
        />
      </div>

      {/* Content Editor */}
      <div className="mb-4">
        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-300`}>
          Terms and Conditions Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={20}
          placeholder="Enter the terms and conditions content here..."
          className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          } transition-colors duration-300`}
        />
        <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          This content will be displayed to users during registration. They must agree to proceed.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={loading}
          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white font-medium`}
        >
          {loading ? (
            <>
              <RefreshCw size={18} className="mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} className="mr-2" />
              Save Changes
            </>
          )}
        </button>
        <button
          onClick={handleReset}
          disabled={loading}
          className={`px-4 py-2 rounded-lg transition-colors ${
            isDarkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          } font-medium`}
        >
          <RefreshCw size={18} className="inline mr-2" />
          Reset
        </button>
      </div>
    </motion.div>
  );
};

export default TermsAndConditions;
