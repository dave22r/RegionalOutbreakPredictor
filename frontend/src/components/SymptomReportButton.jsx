import Icon from "@mdi/react";
import { mdiPlusCircle } from "@mdi/js";

export const SymptomReportButton = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 z-20 group"
            aria-label="Report symptoms"
        >
            <div className="relative">
                {/* Pulsing ring animation */}
                <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75" />

                {/* Main button */}
                <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full p-4 shadow-2xl transform transition-all duration-200 group-hover:scale-110">
                    <Icon path={mdiPlusCircle} size={1.5} />
                </div>
            </div>

            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Report Symptoms
                <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
            </div>
        </button>
    );
};
