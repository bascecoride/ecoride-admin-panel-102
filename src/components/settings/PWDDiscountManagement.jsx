import { useState, useEffect } from "react";
import { Accessibility, Save, RefreshCw, AlertCircle, CheckCircle, Info } from "lucide-react";
import SettingSection from "./SettingSection";
import { useTheme } from "../../context/ThemeContext";
import { appSettingsService } from "../../services/appSettingsService";

const PWDDiscountManagement = () => {
	const { isDarkMode } = useTheme();
	const [pwdDiscount, setPwdDiscount] = useState(25); // Default 25%
	const [originalValue, setOriginalValue] = useState(25);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isResetting, setIsResetting] = useState(false);
	const [message, setMessage] = useState({ type: '', text: '' });

	// Default PWD discount value
	const DEFAULT_PWD_DISCOUNT = 25; // 25%

	useEffect(() => {
		fetchPWDDiscount();
	}, []);

	const fetchPWDDiscount = async () => {
		try {
			setIsLoading(true);
			// Use public endpoint to fetch PWD discount
			const data = await appSettingsService.getPWDDiscount();
			setPwdDiscount(data.pwdDiscount);
			setOriginalValue(data.pwdDiscount);
		} catch (error) {
			console.error('Error fetching PWD discount:', error);
			// If setting doesn't exist, use default
			setPwdDiscount(25);
			setOriginalValue(25);
		} finally {
			setIsLoading(false);
		}
	};

	const handleInputChange = (value) => {
		const numValue = parseFloat(value);
		if (value === '' || (!isNaN(numValue) && numValue >= 0 && numValue <= 100)) {
			setPwdDiscount(value === '' ? '' : numValue);
		}
	};

	const handleSave = async () => {
		try {
			setIsSaving(true);
			setMessage({ type: '', text: '' });

			// Validate
			if (pwdDiscount === '' || pwdDiscount < 0 || pwdDiscount > 100) {
				setMessage({ type: 'error', text: 'Discount must be between 0% and 100%' });
				return;
			}

			await appSettingsService.updateSetting(
				'PWD_DISCOUNT',
				pwdDiscount,
				'Discount percentage for verified PWD passengers',
				false
			);

			setOriginalValue(pwdDiscount);
			setMessage({ type: 'success', text: 'PWD discount updated successfully! Changes will apply to new rides immediately.' });

			// Clear message after 5 seconds
			setTimeout(() => {
				setMessage({ type: '', text: '' });
			}, 5000);
		} catch (error) {
			console.error('Error saving PWD discount:', error);
			setMessage({ type: 'error', text: error.message || 'Failed to update PWD discount' });
		} finally {
			setIsSaving(false);
		}
	};

	const hasChanges = () => {
		return pwdDiscount !== originalValue;
	};

	const calculateSampleDiscount = (fare) => {
		return Math.round(fare * (pwdDiscount / 100));
	};

	const handleResetToDefaults = async () => {
		if (!window.confirm(`Are you sure you want to reset the PWD discount to the default value?\n\nDefault value: ${DEFAULT_PWD_DISCOUNT}%`)) {
			return;
		}

		try {
			setIsResetting(true);
			setMessage({ type: '', text: '' });

			await appSettingsService.updateSetting(
				'PWD_DISCOUNT',
				DEFAULT_PWD_DISCOUNT,
				'Discount percentage for verified PWD passengers',
				true
			);

			setPwdDiscount(DEFAULT_PWD_DISCOUNT);
			setOriginalValue(DEFAULT_PWD_DISCOUNT);
			setMessage({ type: 'success', text: `PWD discount reset to default (${DEFAULT_PWD_DISCOUNT}%) successfully!` });

			// Clear message after 5 seconds
			setTimeout(() => {
				setMessage({ type: '', text: '' });
			}, 5000);
		} catch (error) {
			console.error('Error resetting PWD discount:', error);
			setMessage({ type: 'error', text: error.message || 'Failed to reset PWD discount' });
		} finally {
			setIsResetting(false);
		}
	};

	return (
		<SettingSection icon={Accessibility} title={"PWD Discount Configuration"}>
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
									Person with Disability (PWD) Discount
								</p>
								<p className={`text-xs mt-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
									Set the discount percentage for verified PWD passengers. This discount is automatically applied 
									to ride fares when a verified PWD user books a ride. Users must upload their PWD card during 
									registration and be verified by an admin to receive this discount.
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

					{/* PWD Discount Card */}
					<div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-700 bg-opacity-30 border-gray-600' : 'bg-white border-gray-200'} transition-colors duration-300 shadow-sm hover:shadow-md mb-6`}>
						{/* Header */}
						<div className="flex items-center justify-between mb-6">
							<div className="flex items-center space-x-3">
								<div className={`p-3 rounded-full ${isDarkMode ? 'bg-purple-900 bg-opacity-50' : 'bg-purple-100'}`}>
									<Accessibility className={`${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} size={24} />
								</div>
								<div>
									<h4 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
										PWD Discount Percentage
									</h4>
									<p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
										Applied to verified PWD passengers' ride fares
									</p>
								</div>
							</div>
							<span className={`px-3 py-1 rounded-full text-xs font-medium ${
								isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
							}`}>
								Active
							</span>
						</div>

						{/* Discount Input */}
						<div className="mb-6">
							<label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
								Discount Percentage
							</label>
							<div className="relative">
								<input
									type="number"
									step="1"
									min="0"
									max="100"
									value={pwdDiscount}
									onChange={(e) => handleInputChange(e.target.value)}
									className={`w-full px-4 py-3 rounded-lg border text-lg font-semibold ${
										isDarkMode 
											? 'bg-gray-600 border-gray-500 text-gray-100 focus:border-purple-500' 
											: 'bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-600'
									} focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-colors duration-200`}
									placeholder="25"
								/>
								<span className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
									%
								</span>
							</div>
							<div className="flex items-center justify-between mt-2">
								<p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
									Range: 0% - 100%
								</p>
							</div>
						</div>

						{/* Sample Discount Calculations */}
						<div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-600 bg-opacity-30' : 'bg-gray-50'} mb-4`}>
							<p className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
								Sample Discount Calculations:
							</p>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
								<div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
									<div className="flex items-center space-x-2 mb-1">
										<div className="w-2 h-2 rounded-full bg-green-500"></div>
										<span className={`text-xs font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
											₱50 Fare
										</span>
									</div>
									<p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
										Discount: ₱{calculateSampleDiscount(50)} → Final: ₱{50 - calculateSampleDiscount(50)}
									</p>
								</div>
								<div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
									<div className="flex items-center space-x-2 mb-1">
										<div className="w-2 h-2 rounded-full bg-blue-500"></div>
										<span className={`text-xs font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
											₱100 Fare
										</span>
									</div>
									<p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
										Discount: ₱{calculateSampleDiscount(100)} → Final: ₱{100 - calculateSampleDiscount(100)}
									</p>
								</div>
								<div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
									<div className="flex items-center space-x-2 mb-1">
										<div className="w-2 h-2 rounded-full bg-purple-500"></div>
										<span className={`text-xs font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
											₱200 Fare
										</span>
									</div>
									<p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
										Discount: ₱{calculateSampleDiscount(200)} → Final: ₱{200 - calculateSampleDiscount(200)}
									</p>
								</div>
							</div>
						</div>

						{/* Current Setting Display */}
						<div className={`p-4 rounded-lg border-l-4 ${
							isDarkMode ? 'bg-purple-900 bg-opacity-20 border-purple-500' : 'bg-purple-50 border-purple-500'
						}`}>
							<div className="flex items-center justify-between">
								<div>
									<p className={`text-sm font-medium ${isDarkMode ? 'text-purple-300' : 'text-purple-800'}`}>
										Current Active Discount
									</p>
									<p className={`text-xs mt-1 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
										This is what verified PWD passengers currently receive
									</p>
								</div>
								<div className="text-right">
									<p className={`text-2xl font-bold ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
										{originalValue}%
									</p>
									<p className={`text-xs ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
										off ride fare
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
									: 'bg-purple-600 hover:bg-purple-700 text-white'
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
							onClick={handleResetToDefaults}
							disabled={isSaving || isResetting}
							className={`flex items-center justify-center space-x-2 py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
								isDarkMode
									? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
									: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
							} ${(isSaving || isResetting) ? 'opacity-50 cursor-not-allowed' : ''}`}
						>
							{isResetting ? (
								<>
									<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
									<span>Resetting...</span>
								</>
							) : (
								<>
									<RefreshCw size={18} />
									<span>Reset to Default</span>
								</>
							)}
						</button>
					</div>

					{/* Help Text */}
					<div className={`mt-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700 bg-opacity-30' : 'bg-gray-50'}`}>
						<p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
							<strong>💡 Tip:</strong> The default PWD discount is 25% as per Philippine law (RA 9442). 
							You can adjust this value based on your business requirements. The discount is automatically 
							applied when a verified PWD user books a ride. Users must upload their PWD card during 
							registration and be verified by an admin to receive this discount.
						</p>
					</div>
				</>
			)}
		</SettingSection>
	);
};

export default PWDDiscountManagement;
