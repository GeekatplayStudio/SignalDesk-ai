import { User, Settings, HelpCircle, LogOut, CreditCard, Shield, Bell } from 'lucide-react';

interface ProfileDropdownProps {
  onClose: () => void;
  onOpenSettings: () => void;
}

export function ProfileDropdown({ onClose, onOpenSettings }: ProfileDropdownProps) {
  const handleSettingsClick = () => {
    onClose();
    onOpenSettings();
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose}></div>
      <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
        {/* User Info */}
        <div className="px-4 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
              AE
            </div>
            <div>
              <div className="font-medium text-gray-900">AI Engineer</div>
              <div className="text-sm text-gray-600">engineer@company.com</div>
            </div>
          </div>
        </div>

        {/* Account Stats */}
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">24</div>
              <div className="text-xs text-gray-600">Deployments</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">1.2K</div>
              <div className="text-xs text-gray-600">Test Cases</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">94%</div>
              <div className="text-xs text-gray-600">Pass Rate</div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="py-2">
          <button className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left">
            <User className="w-4 h-4 text-gray-600" />
            <div>
              <div className="text-sm font-medium text-gray-900">My Profile</div>
              <div className="text-xs text-gray-500">View and edit your profile</div>
            </div>
          </button>

          <button 
            onClick={handleSettingsClick}
            className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
          >
            <Settings className="w-4 h-4 text-gray-600" />
            <div>
              <div className="text-sm font-medium text-gray-900">Settings</div>
              <div className="text-xs text-gray-500">Manage your preferences</div>
            </div>
          </button>

          <button className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left">
            <Bell className="w-4 h-4 text-gray-600" />
            <div>
              <div className="text-sm font-medium text-gray-900">Notifications</div>
              <div className="text-xs text-gray-500">Configure alerts</div>
            </div>
          </button>

          <button className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left">
            <CreditCard className="w-4 h-4 text-gray-600" />
            <div>
              <div className="text-sm font-medium text-gray-900">Billing</div>
              <div className="text-xs text-gray-500">Manage subscription</div>
            </div>
          </button>

          <button className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left">
            <Shield className="w-4 h-4 text-gray-600" />
            <div>
              <div className="text-sm font-medium text-gray-900">Security</div>
              <div className="text-xs text-gray-500">Password & authentication</div>
            </div>
          </button>

          <button className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left">
            <HelpCircle className="w-4 h-4 text-gray-600" />
            <div>
              <div className="text-sm font-medium text-gray-900">Help & Support</div>
              <div className="text-xs text-gray-500">Get help with Sentinel</div>
            </div>
          </button>
        </div>

        {/* Logout */}
        <div className="border-t border-gray-200 py-2">
          <button className="w-full px-4 py-2 flex items-center gap-3 hover:bg-red-50 transition-colors text-left text-red-600">
            <LogOut className="w-4 h-4" />
            <div className="text-sm font-medium">Sign Out</div>
          </button>
        </div>
      </div>
    </>
  );
}
