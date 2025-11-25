import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  UsersIcon, 
  Car, 
  MapPin, 
  Loader, 
  AlertCircle, 
  TrendingUp, 
  DollarSign, 
  CheckCircle, 
  XCircle,
  Bike,
  RefreshCw,
  CreditCard,
  Banknote,
  BarChart3,
  Filter,
  UserX
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { userService } from "../services/userService";
import analyticsService from "../services/analyticsService";
import { useTheme } from "../context/ThemeContext";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// Vehicle type config
const VEHICLE_CONFIG = {
  'Single Motorcycle': { icon: Bike, color: '#3B82F6', bgColor: '#DBEAFE' },
  'Tricycle': { icon: Car, color: '#10B981', bgColor: '#D1FAE5' },
  'Cab': { icon: Car, color: '#F59E0B', bgColor: '#FEF3C7' }
};

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0);
};

const StatCard = ({ name, icon: Icon, value, color, clickable, onClick }) => {
  const { isDarkMode } = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={clickable ? onClick : undefined}
      className={`backdrop-blur-md shadow-lg rounded-xl p-6 border transition-all duration-300 ${
        isDarkMode ? 'bg-gray-800 bg-opacity-50 border-gray-700' : 'bg-white border-gray-200'
      } ${
        clickable 
          ? 'cursor-pointer hover:scale-105 hover:shadow-xl ' + (isDarkMode ? 'hover:border-blue-500' : 'hover:border-blue-400')
          : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}>
            {name}
            {clickable && (
              <span className={`ml-2 text-xs ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`}>
                (Click to view)
              </span>
            )}
          </p>
          <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-800'} transition-colors duration-300`}>{value}</p>
        </div>
        <div
          className="p-3 rounded-full"
          style={{ backgroundColor: `${color}30`, color: color }}
        >
          <Icon size={24} />
        </div>
      </div>
    </motion.div>
  );
};

const OverviewPage = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDrivers: 0,
    totalPassengers: 0,
    unapprovedUsers: 0
  });
  
  const [vehicleData, setVehicleData] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [rideStatusData, setRideStatusData] = useState(null);

  // Fetch all data
  const fetchAllData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      // Fetch user stats
      const usersResponse = await userService.getAllUsers();
      const users = usersResponse.users || [];
      
      setStats({
        totalUsers: users.length,
        totalDrivers: users.filter(u => u.role === 'rider').length,
        totalPassengers: users.filter(u => u.role === 'customer').length,
        unapprovedUsers: users.filter(u => u.status === 'pending').length
      });

      // Fetch analytics data in parallel
      const [vehicleRes, paymentRes, statusRes] = await Promise.all([
        analyticsService.getVehicleBreakdown(timeFilter),
        analyticsService.getPaymentMethodAnalytics(timeFilter),
        analyticsService.getRideStatusBreakdown(timeFilter)
      ]);

      setVehicleData(vehicleRes);
      setPaymentData(paymentRes);
      setRideStatusData(statusRes);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [timeFilter]);

  // Get totals from data
  const totals = vehicleData?.totals || { totalRides: 0, completedRides: 0, cancelledRides: 0, totalRevenue: 0 };
  const paymentSummary = paymentData?.summary || { cash: { rides: 0, revenue: 0 }, gcash: { rides: 0, revenue: 0 } };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Title and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className={`text-3xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Overview & Analytics
          </h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Comprehensive dashboard with ride analytics and insights
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Time Filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
            >
              <option value="24h">Last 24 Hours</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={() => fetchAllData(true)}
            disabled={refreshing}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border p-4 rounded-lg mb-6 flex items-center ${isDarkMode ? 'bg-red-500 bg-opacity-20 border-red-500 text-red-200' : 'bg-red-100 border-red-300 text-red-800'}`}
        >
          <AlertCircle size={20} className="mr-2" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* User Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard name="Total Users" icon={UsersIcon} value={loading ? <Loader size={20} className="animate-spin" /> : stats.totalUsers} color="#6366F1" clickable onClick={() => navigate("/users")} />
        <StatCard name="Total Drivers" icon={Car} value={loading ? <Loader size={20} className="animate-spin" /> : stats.totalDrivers} color="#10B981" clickable onClick={() => navigate("/users?filter=rider")} />
        <StatCard name="Total Passengers" icon={MapPin} value={loading ? <Loader size={20} className="animate-spin" /> : stats.totalPassengers} color="#F59E0B" clickable onClick={() => navigate("/users?filter=customer")} />
        <StatCard name="Pending Approvals" icon={UserX} value={loading ? <Loader size={20} className="animate-spin" /> : stats.unapprovedUsers} color="#EF4444" clickable onClick={() => navigate("/users?filter=pending")} />
      </div>

      {/* Ride Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard name="Total Rides" icon={BarChart3} value={loading ? <Loader size={20} className="animate-spin" /> : totals.totalRides} color="#8B5CF6" />
        <StatCard name="Completed Rides" icon={CheckCircle} value={loading ? <Loader size={20} className="animate-spin" /> : totals.completedRides} color="#10B981" />
        <StatCard name="Cancelled Rides" icon={XCircle} value={loading ? <Loader size={20} className="animate-spin" /> : totals.cancelledRides} color="#EF4444" />
        <StatCard name="Total Revenue" icon={DollarSign} value={loading ? <Loader size={20} className="animate-spin" /> : formatCurrency(totals.totalRevenue)} color="#F59E0B" />
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Vehicle Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-6 border ${isDarkMode ? 'bg-gray-800 bg-opacity-50 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <div className="flex items-center gap-2 mb-4">
            <Car className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} size={20} />
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Vehicle Type Breakdown
            </h2>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8"><Loader className="animate-spin" size={32} /></div>
          ) : (
            <div className="space-y-4">
              {(vehicleData?.vehicleBreakdown || []).map((vehicle, idx) => {
                const config = VEHICLE_CONFIG[vehicle.vehicleType] || VEHICLE_CONFIG['Single Motorcycle'];
                const VIcon = config.icon;
                return (
                  <div key={idx} className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700 bg-opacity-50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: config.bgColor }}>
                        <VIcon size={18} style={{ color: config.color }} />
                      </div>
                      <div>
                        <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{vehicle.vehicleType}</h4>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{vehicle.completionRate}% completion</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-sm">
                      <div><p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{vehicle.totalRides}</p><p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total</p></div>
                      <div><p className="font-bold text-green-500">{vehicle.completedRides}</p><p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Done</p></div>
                      <div><p className="font-bold text-red-500">{vehicle.cancelledRides}</p><p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Cancelled</p></div>
                      <div><p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{formatCurrency(vehicle.totalRevenue)}</p><p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Revenue</p></div>
                    </div>
                  </div>
                );
              })}
              {(!vehicleData?.vehicleBreakdown || vehicleData.vehicleBreakdown.length === 0) && (
                <p className={`text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No vehicle data available</p>
              )}
            </div>
          )}
        </motion.div>

        {/* Payment Methods & Ride Status */}
        <div className="space-y-6">
          {/* Payment Methods */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`rounded-xl p-6 border ${isDarkMode ? 'bg-gray-800 bg-opacity-50 border-gray-700' : 'bg-white border-gray-200'}`}
          >
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className={isDarkMode ? 'text-green-400' : 'text-green-600'} size={20} />
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Payment Methods</h2>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8"><Loader className="animate-spin" size={32} /></div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700 bg-opacity-50 border-gray-600' : 'bg-green-50 border-green-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Banknote className="text-green-500" size={18} />
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Cash</span>
                  </div>
                  <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{formatCurrency(paymentSummary.cash?.revenue || 0)}</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{paymentSummary.cash?.rides || 0} rides</p>
                </div>
                <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700 bg-opacity-50 border-gray-600' : 'bg-blue-50 border-blue-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="text-blue-500" size={18} />
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>GCash</span>
                  </div>
                  <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{formatCurrency(paymentSummary.gcash?.revenue || 0)}</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{paymentSummary.gcash?.rides || 0} rides</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Ride Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`rounded-xl p-6 border ${isDarkMode ? 'bg-gray-800 bg-opacity-50 border-gray-700' : 'bg-white border-gray-200'}`}
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className={isDarkMode ? 'text-purple-400' : 'text-purple-600'} size={20} />
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Ride Status</h2>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8"><Loader className="animate-spin" size={32} /></div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{rideStatusData?.summary?.total || 0}</p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total</p>
                  </div>
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-green-900 bg-opacity-30' : 'bg-green-100'}`}>
                    <p className="text-xl font-bold text-green-500">{rideStatusData?.summary?.completed || 0}</p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Completed</p>
                  </div>
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-red-900 bg-opacity-30' : 'bg-red-100'}`}>
                    <p className="text-xl font-bold text-red-500">{rideStatusData?.summary?.cancelled || 0}</p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Cancelled</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Completion Rate</span>
                    <span className="text-sm font-medium text-green-500">{rideStatusData?.summary?.completionRate || 0}%</span>
                  </div>
                  <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div className="h-2 rounded-full bg-green-500" style={{ width: `${rideStatusData?.summary?.completionRate || 0}%` }} />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`rounded-xl p-6 border ${isDarkMode ? 'bg-gray-800 bg-opacity-50 border-gray-700' : 'bg-white border-gray-200'}`}
      >
        <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/users" className={`p-4 rounded-lg text-center transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
            <UsersIcon className={`mx-auto mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} size={24} />
            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Manage Users</p>
          </Link>
          <Link to="/analytics" className={`p-4 rounded-lg text-center transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
            <BarChart3 className={`mx-auto mb-2 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} size={24} />
            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Full Analytics</p>
          </Link>
          <Link to="/rides" className={`p-4 rounded-lg text-center transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
            <Car className={`mx-auto mb-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} size={24} />
            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Ride History</p>
          </Link>
          <Link to="/settings" className={`p-4 rounded-lg text-center transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
            <TrendingUp className={`mx-auto mb-2 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} size={24} />
            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Settings</p>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default OverviewPage;
