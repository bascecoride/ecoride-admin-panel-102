import Header from "../components/common/Header";
import Profile from "../components/settings/Profile";
import AccountInfo from "../components/settings/AccountInfo";
import ChangePassword from "../components/settings/ChangePassword";
import FareRateManagement from "../components/settings/FareRateManagement";
import DistanceRadiusManagement from "../components/settings/DistanceRadiusManagement";
import PWDDiscountManagement from "../components/settings/PWDDiscountManagement";
import TermsAndConditions from "../components/settings/TermsAndConditions";
import DangerZone from "../components/settings/DangerZone";
import { useTheme } from "../context/ThemeContext";

const SettingsPage = () => {
	const { isDarkMode } = useTheme();
	
	return (
		<div className={`flex-1 overflow-auto relative z-10 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
			<Header title='Settings' />
			<main className='max-w-4xl mx-auto py-6 px-4 lg:px-8'>
				{/* Profile Section with Edit Functionality */}
				<Profile />
				
				{/* Account Information */}
				<AccountInfo />
				
				{/* Change Password */}
				<ChangePassword />
				
				{/* Fare Rate Management */}
				<FareRateManagement />
				
				{/* Distance Radius Management */}
				<DistanceRadiusManagement />
				
				{/* PWD Discount Management */}
				<PWDDiscountManagement />
				
				{/* Terms and Conditions Management */}
				<TermsAndConditions />
				
				{/* Logout Section */}
				<DangerZone /> 
			</main>
		</div>
	);
};
export default SettingsPage;
