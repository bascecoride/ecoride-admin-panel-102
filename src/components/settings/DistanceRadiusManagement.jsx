import { useState, useEffect } from "react";
import { MapPin, Save, RefreshCw, AlertCircle, CheckCircle, Info } from "lucide-react";
import SettingSection from "./SettingSection";
import { useTheme } from "../../context/ThemeContext";
import { appSettingsService } from "../../services/appSettingsService";

const DistanceRadiusManagement = () => {
	const { isDarkMode } = useTheme();
	const [distanceRadius, setDistanceRadius] = useState(3); // Default 3km
	const [originalValue, setOriginalValue] = useState(3);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [message, setMessage] = useState({ type: '', text: '' });

	useEffect(() => {
		fetchDistanceRadius();
	}, []);

	const fetchDistanceRadius = async () => {
		try {
			setIsLoading(true);
			// Use public endpoint to fetch distance radius
			const data = await appSettingsService.getDistanceRadius();
			setDistanceRadius(data.distanceRadius);
			setOriginalValue(data.distanceRadius);
		} catch (error) {
			console.error('Error fetching distance radius:', error);
			// If setting doesn't exist, use default
			setDistanceRadius(3);
			setOriginalValue(3);
		} finally {
			setIsLoading(false);
		}
	};

	const handleInputChange = (value) => {
		const numValue = parseFloat(value);
		if (value === '' || (!isNaN(numValue) && numValue >= 0.5 && numValue <= 50)) {
			setDistanceRadius(value === '' ? '' : numValue);
		}
	};

	const handleSave = async () => {
		try {
			setIsSaving(true);
			setMessage({ type: '', text: '' });

			// Validate
			if (distanceRadius === '' || distanceRadius < 0.5 || distanceRadius > 50) {
				setMessage({ type: 'error', text: 'Distance must be between 0.5 km and 50 km' });
				return;
			}

			await appSettingsService.updateSetting(
				'DISTANCE_RADIUS',
				distanceRadius,
				'Maximum distance radius for showing nearby riders/bookings'
			);

			setOriginalValue(distanceRadius);
			setMessage({ type: 'success', text: 'Distance radius updated successfully! Changes will apply immediately.' });

			// Clear message after 5 seconds
			setTimeout(() => {
				setMessage({ type: '', text: '' });
			}, 5000);
		} catch (error) {
			console.error('Error saving distance radius:', error);
			setMessage({ type: 'error', text: error.message || 'Failed to update distance radius' });
		} finally {
			setIsSaving(false);
		}
	};

	const hasChanges = () => {
		return distanceRadius !== originalValue;
	};

	const getRadiusInMeters = () => {
		return distanceRadius * 1000;
	};

	return (
		<SettingSection icon={MapPin} title={"Distance Radius Configuration"}>
			{isLoading ? (
				<div className="flex items-center justify-center py-8">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
				</div>
			) : (
				<>
					{/* Info Banner */}
					<div className={`mb-6 p-4 rounded-lg border ${isDarkMode ? 'bg-blue-900 bg-opacity-20 border-blue-800' : 'bg-blue-50 border-blue-200'} transition-colors duration-300`}>
						<div className="flex items-start space-x-3">
							<Info className={`mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} size={20} />
							<div>
								<p className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
									Rider Discovery Radius
								</p>
								<p className={`text-xs mt-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
									Set the maximum distance for showing nearby riders to passengers and available bookings to riders. 
									This affects the "Active Riders" feature and ride request notifications. Recommended: 2-5 km for urban areas.
								</p>
							</div>
						</div>
					</div>

					{/* Message Display */}
					{message.text && (
						<div className={`mb-6 p-4 rounded-lg border ${
							message.type === 'success' 
								? isDarkMode ? 'bg-green-900 bg-opacity-20 border-green-800' : 'bg-green-50 border-green-200'
								: isDarkMode ? 'bg-red-900 bg-opacity-20 border-red-800' : 'bg-red-50 border-red-200'
						} transition-colors duration-300`}>
							<div className="flex items-center space-x-3">
								{message.type === 'success' ? (
									<CheckCircle className={`${isDarkMode ? 'text-green-400' : 'text-green-600'}`} size={20} />
								) : (
									<AlertCircle className={`${isDarkMode ? 'text-red-400' : 'text-red-600'}`} size={20} />
								)}
								<p className={`text-sm font-medium ${
									message.type === 'success'
										? isDarkMode ? 'text-green-300' : 'text-green-800'
										: isDarkMode ? 'text-red-300' : 'text-red-800'
								}`}>
									{message.text}
								</p>
							</div>
						</div>
					)}

					{/* Distance Radius Card */}
					<div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-700 bg-opacity-30 border-gray-600' : 'bg-white border-gray-200'} transition-colors duration-300 shadow-sm hover:shadow-md mb-6`}>
						{/* Header */}
						<div className="flex items-center justify-between mb-6">
							<div className="flex items-center space-x-3">
								<div className={`p-3 rounded-full ${isDarkMode ? 'bg-indigo-900 bg-opacity-50' : 'bg-indigo-100'}`}>
									<MapPin className={`${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} size={24} />
								</div>
								<div>
									<h4 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
										Maximum Distance Radius
									</h4>
									<p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
										Controls rider visibility and booking notifications
									</p>
								</div>
							</div>
							<span className={`px-3 py-1 rounded-full text-xs font-medium ${
								isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
							}`}>
								Active
							</span>
						</div>

						{/* Distance Input */}
						<div className="mb-6">
							<label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
								Distance Radius (kilometers)
							</label>
							<div className="relative">
								<input
									type="number"
									step="0.5"
									min="0.5"
									max="50"
									value={distanceRadius}
									onChange={(e) => handleInputChange(e.target.value)}
									className={`w-full px-4 py-3 rounded-lg border text-lg font-semibold ${
										isDarkMode 
											? 'bg-gray-600 border-gray-500 text-gray-100 focus:border-indigo-500' 
											: 'bg-gray-50 border-gray-300 text-gray-900 focus:border-indigo-600'
									} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors duration-200`}
									placeholder="3.0"
								/>
								<span className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
									km
								</span>
							</div>
							<div className="flex items-center justify-between mt-2">
								<p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
									Range: 0.5 km - 50 km
								</p>
								<p className={`text-xs font-medium ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
									= {getRadiusInMeters().toLocaleString()} meters
								</p>
							</div>
						</div>

						{/* Visual Radius Indicator */}
						<div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-600 bg-opacity-30' : 'bg-gray-50'} mb-4`}>
							<p className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
								Coverage Examples:
							</p>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
								<div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
									<div className="flex items-center space-x-2 mb-1">
										<div className="w-2 h-2 rounded-full bg-green-500"></div>
										<span className={`text-xs font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
											1 km radius
										</span>
									</div>
									<p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
										~3 km² area • Dense urban
									</p>
								</div>
								<div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
									<div className="flex items-center space-x-2 mb-1">
										<div className="w-2 h-2 rounded-full bg-blue-500"></div>
										<span className={`text-xs font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
											3 km radius
										</span>
									</div>
									<p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
										~28 km² area • City coverage
									</p>
								</div>
								<div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
									<div className="flex items-center space-x-2 mb-1">
										<div className="w-2 h-2 rounded-full bg-purple-500"></div>
										<span className={`text-xs font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
											5 km radius
										</span>
									</div>
									<p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
										~79 km² area • Wide coverage
									</p>
								</div>
							</div>
						</div>

						{/* Current Setting Display */}
						<div className={`p-4 rounded-lg border-l-4 ${
							isDarkMode ? 'bg-indigo-900 bg-opacity-20 border-indigo-500' : 'bg-indigo-50 border-indigo-500'
						}`}>
							<div className="flex items-center justify-between">
								<div>
									<p className={`text-sm font-medium ${isDarkMode ? 'text-indigo-300' : 'text-indigo-800'}`}>
										Current Active Radius
									</p>
									<p className={`text-xs mt-1 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
										This is what riders and passengers currently see
									</p>
								</div>
								<div className="text-right">
									<p className={`text-2xl font-bold ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
										{originalValue} km
									</p>
									<p className={`text-xs ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
										{(originalValue * 1000).toLocaleString()} meters
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex flex-col sm:flex-row gap-3">
						<button
							onClick={handleSave}
							disabled={isSaving || !hasChanges()}
							className={`flex-1 flex items-center justify-center space-x-2 py-3 px-6 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
								isSaving || !hasChanges()
									? 'bg-gray-400 cursor-not-allowed'
									: 'bg-indigo-600 hover:bg-indigo-700 text-white'
							}`}
						>
							{isSaving ? (
								<>
									<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
									<span>Saving...</span>
								</>
							) : (
								<>
									<Save size={18} />
									<span>Save Changes</span>
								</>
							)}
						</button>

						<button
							onClick={fetchDistanceRadius}
							disabled={isSaving}
							className={`flex items-center justify-center space-x-2 py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
								isDarkMode
									? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
									: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
							} ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
						>
							<RefreshCw size={18} />
							<span>Reset</span>
						</button>
					</div>

					{/* Help Text */}
					<div className={`mt-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700 bg-opacity-30' : 'bg-gray-50'}`}>
						<p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
							<strong>💡 Tip:</strong> Lower values (1-3 km) work best for dense urban areas with many riders. 
							Higher values (5-10 km) are suitable for suburban areas with fewer riders. 
							Very high values (10+ km) may show too many riders and affect app performance.
						</p>
					</div>
				</>
			)}
		</SettingSection>
	);
};

export default DistanceRadiusManagement;
