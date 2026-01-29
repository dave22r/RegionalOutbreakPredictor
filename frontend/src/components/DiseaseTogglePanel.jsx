import { useState } from "react";
import Icon from "@mdi/react";
import { mdiBacteria, mdiVirus, mdiBiohazard } from "@mdi/js";

const DISEASES = [
    { id: "all", label: "All Diseases", color: "bg-red-500", icon: mdiBiohazard },
    { id: "flu", label: "Flu", color: "bg-blue-500", icon: mdiVirus },
    { id: "covid-19", label: "COVID-19", color: "bg-orange-500", icon: mdiVirus },
    { id: "coccidioidomycosis", label: "Valley Fever", color: "bg-pink-500", icon: mdiBacteria },
    { id: "salmonella", label: "Salmonella", color: "bg-green-500", icon: mdiBacteria },
    { id: "campylobacter", label: "Campylobacter", color: "bg-yellow-500", icon: mdiBacteria },
];

export const DiseaseTogglePanel = ({ selectedDisease, onDiseaseChange }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="fixed top-4 left-4 z-10">
            <div className="bg-gray-900/90 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
                {/* Header */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Icon path={mdiBiohazard} size={0.9} className="text-red-400" />
                        <span className="font-semibold text-sm">Disease Filter</span>
                    </div>
                    <svg
                        className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Disease Buttons */}
                {isExpanded && (
                    <div className="p-3 space-y-2">
                        {DISEASES.map((disease) => (
                            <button
                                key={disease.id}
                                onClick={() => onDiseaseChange(disease.id)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${selectedDisease === disease.id
                                        ? `${disease.color} text-white shadow-lg scale-105`
                                        : "bg-gray-800/50 hover:bg-gray-700/50 text-gray-300"
                                    }`}
                            >
                                <Icon path={disease.icon} size={0.8} />
                                <span className="text-sm font-medium">{disease.label}</span>
                                {selectedDisease === disease.id && (
                                    <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export const getDiseaseColor = (disease) => {
    const diseaseObj = DISEASES.find((d) => d.id === disease);
    return diseaseObj?.color || DISEASES[0].color;
};

export const getDiseaseColorRGBA = (disease) => {
    const colors = {
        all: [251, 110, 112, 128],
        flu: [59, 130, 246, 128],
        "covid-19": [249, 115, 22, 128],
        coccidioidomycosis: [236, 72, 153, 128],
        salmonella: [34, 197, 94, 128],
        campylobacter: [234, 179, 8, 128],
    };
    return colors[disease] || colors.all;
};
