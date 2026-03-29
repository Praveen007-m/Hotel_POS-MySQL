import { Loader } from "lucide-react";

export const LoadingSpinner = ({ text = "Loading...", subText = "Please wait a moment" }) => {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
          <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </div>
        <p className="text-gray-600 font-medium text-lg">{text}</p>
        {subText && <p className="text-gray-400 text-sm mt-2">{subText}</p>}
      </div>
    </div>
  );
};