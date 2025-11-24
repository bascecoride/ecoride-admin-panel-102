import { useState, useEffect } from "react";
import { DollarSign, Save, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import SettingSection from "./SettingSection";
import { useTheme } from "../../context/ThemeContext";
import { fareRateService } from "../../services/fareRateService";

const FareRateManagement = () => {
	const { isDarkMode } = useTheme();
	const [fareRates, setFareRates] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [message, setMessage] = useState({ type: '', text: '' });
	const [editedRates, setEditedRates] = useState({});

	// Vehicle type configurations
	const vehicleConfig = {
		"Single Motorcycle": {
			icon: "🏍️",
			color: "bg-blue-100 text-blue-800",
			darkColor: "bg-blue-900 text-blue-200"
		},
		"Tricycle": {
			icon: "🛺",
			color: "bg-green-100 text-green-800",
			darkColor: "bg-green-900 text-green-200"
		},
		"Cab": {
			icon: "🚕",
			color: "bg-yellow-100 text-yellow-800",
			darkColor: "bg-yellow-900 text-yellow-200"
		}
	};

	useEffect(() => {
		fetchFareRates();
	}, []);

	const fetchFareRates = async () => {
		try {
			setIsLoading(true);
			const data = await fareRateService.getAllFareRates();
			setFareRates(data);
			
			// Initialize edited rates
			const initialEdits = {};
			data.forEach(rate => {
				initialEdits[rate.vehicleType] = {
					minimumRate: rate.minimumRate,
					perKmRate: rate.perKmRate
				};
			});
			setEditedRates(initialEdits);
		} catch (error) {
			console.error('Error fetching fare rates:', error);
			setMessage({ type: 'error', text: 'Failed to load fare rates' });
		} finally {
			setIsLoading(false);
		}
	};

	const handleInputChange = (vehicleType, field, value) => {
		// Allow only positive numbers with up to 2 decimal places
		const numValue = parseFloat(value);
		if (value === '' || (!isNaN(numValue) && numValue >= 0)) {
			setEditedRates(prev => ({
				...prev,
				[vehicleType]: {
					...prev[vehicleType],
					[field]: value === '' ? '' : numValue
				}
			}));
		}
	};

	const handleSave = async () => {
		try {
			setIsSaving(true);
			setMessage({ type: '', text: '' });

			// Validate all rates
			for (const vehicleType in editedRates) {
				const rate = editedRates[vehicleType];
				if (rate.minimumRate === '' || rate.perKmRate === '') {
					setMessage({ type: 'error', text: 'All fields are required' });
					return;
				}
				if (rate.minimumRate < 0 || rate.perKmRate < 0) {
					setMessage({ type: 'error', text: 'Rates must be positive numbers' });
					return;
				}
			}

			// Prepare data for bulk update
			const ratesToUpdate = Object.keys(editedRates).map(vehicleType => ({
				vehicleType,
				minimumRate: editedRates[vehicleType].minimumRate,
				perKmRate: editedRates[vehicleType].perKmRate
			}));

			await fareRateService.bulkUpdateFareRates(ratesToUpdate);
			
			// Refresh data
			await fetchFareRates();
			
			setMessage({ type: 'success', text: 'Fare rates updated successfully!' });
			
			// Clear message after 3 seconds
			setTimeout(() => {
				setMessage({ type: '', text: '' });
			}, 3000);
		} catch (error) {
			console.error('Error saving fare rates:', error);
			setMessage({ type: 'error', text: error.message || 'Failed to update fare rates' });
		} finally {
			setIsSaving(false);
		}
	};

	const hasChanges = () => {
		return fareRates.some(rate => {
			const edited = editedRates[rate.vehicleType];
			return edited && (
				edited.minimumRate !== rate.minimumRate ||
				edited.perKmRate !== rate.perKmRate
			);
		});
	};

	return (
		<SettingSection icon={DollarSign} title={"Fare Rate Management"}>
			{isLoading ? (
				<div className="flex items-center justify-center py-8">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
				</div>
			) : (
				<>
					{/* Info Banner */}
					<div className={`mb-6 p-4 rounded-lg border ${isDarkMode ? 'bg-indigo-900 bg-opacity-20 border-indigo-800' : 'bg-indigo-50 border-indigo-200'} transition-colors duration-300`}>
						<div className="flex items-start space-x-3">
							<AlertCircle className={`mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} size={20} />
							<div>
								<p className={`text-sm font-medium ${isDarkMode ? 'text-indigo-300' : 'text-indigo-800'}`}>
									Fare Rate Configuration
								</p>
								<p className={`text-xs mt-1 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
									Set the minimum fare and per-kilometer rate for each vehicle type. Changes will apply to all new ride bookings immediately.
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

					{/* Fare Rate Cards */}
					<div className="space-y-4 mb-6">
						{fareRates.map((rate) => {
							const config = vehicleConfig[rate.vehicleType];
							const edited = editedRates[rate.vehicleType] || {};
							
							return (
								<div 
									key={rate.vehicleType}
									className={`p-5 rounded-lg border ${isDarkMode ? 'bg-gray-700 bg-opacity-30 border-gray-600' : 'bg-white border-gray-200'} transition-colors duration-300 shadow-sm hover:shadow-md`}
								>
									{/* Vehicle Header */}
									<div className="flex items-center justify-between mb-4">
										<div className="flex items-center space-x-3">
											<span className="text-3xl">{config.icon}</span>
											<div>
												<h4 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
													{rate.vehicleType}
												</h4>
												{rate.updatedBy && (
													<p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
														Last updated by {rate.updatedBy.firstName} {rate.updatedBy.lastName}
													</p>
												)}
											</div>
										</div>
										<span className={`px-3 py-1 rounded-full text-xs font-medium ${isDarkMode ? config.darkColor : config.color}`}>
											Active
										</span>
									</div>

									{/* Rate Inputs */}
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										{/* Minimum Rate */}
										<div>
											<label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
												Minimum Fare (₱)
											</label>
											<div className="relative">
												<span className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
													₱
												</span>
												<input
													type="number"
													step="0.01"
													min="0"
													value={edited.minimumRate ?? ''}
													onChange={(e) => handleInputChange(rate.vehicleType, 'minimumRate', e.target.value)}
													className={`w-full pl-8 pr-4 py-2.5 rounded-lg border ${
														isDarkMode 
															? 'bg-gray-600 border-gray-500 text-gray-100 focus:border-indigo-500' 
															: 'bg-gray-50 border-gray-300 text-gray-900 focus:border-indigo-600'
													} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors duration-200`}
													placeholder="0.00"
												/>
											</div>
											<p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
												Base fare for this vehicle type
											</p>
										</div>

										{/* Per KM Rate */}
										<div>
											<label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
												Per Kilometer Rate (₱)
											</label>
											<div className="relative">
												<span className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
													₱
												</span>
												<input
													type="number"
													step="0.01"
													min="0"
													value={edited.perKmRate ?? ''}
													onChange={(e) => handleInputChange(rate.vehicleType, 'perKmRate', e.target.value)}
													className={`w-full pl-8 pr-4 py-2.5 rounded-lg border ${
														isDarkMode 
															? 'bg-gray-600 border-gray-500 text-gray-100 focus:border-indigo-500' 
															: 'bg-gray-50 border-gray-300 text-gray-900 focus:border-indigo-600'
													} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors duration-200`}
													placeholder="0.00"
												/>
											</div>
											<p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
												Additional charge per kilometer
											</p>
										</div>
									</div>

									{/* Example Calculation */}
									{edited.minimumRate && edited.perKmRate && (
										<div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-600 bg-opacity-30' : 'bg-gray-50'}`}>
											<p className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>
												Example Fares:
											</p>
											<div className="flex flex-wrap gap-3 text-xs">
												<span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
													1 km: <strong className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>
														₱{Math.max(edited.minimumRate, 1 * edited.perKmRate).toFixed(2)}
													</strong>
												</span>
												<span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
													5 km: <strong className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>
														₱{Math.max(edited.minimumRate, 5 * edited.perKmRate).toFixed(2)}
													</strong>
												</span>
												<span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
													10 km: <strong className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>
														₱{Math.max(edited.minimumRate, 10 * edited.perKmRate).toFixed(2)}
													</strong>
												</span>
											</div>
										</div>
									)}
								</div>
							);
						})}
					</div>

					{/* Action Buttons */}
					<div className="flex flex-col sm:flex-row gap-3">
						<button
							onClick={handleSave}
							disabled={isSaving || !hasChanges()}
							className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-6 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
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
							onClick={fetchFareRates}
							disabled={isSaving}
							className={`flex items-center justify-center space-x-2 py-2.5 px-6 rounded-lg font-semibold transition-all duration-200 ${
								isDarkMode
									? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
									: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
							} ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
						>
							<RefreshCw size={18} />
							<span>Reset</span>
						</button>
					</div>
				</>
			)}
		</SettingSection>
	);
};

export default FareRateManagement;
