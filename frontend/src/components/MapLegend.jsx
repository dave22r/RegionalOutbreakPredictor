import { useState } from "react";

const RISK_LEVELS = [
    { label: "Low", range: "0-25%", color: "bg-green-500" },
    { label: "Medium", range: "25-50%", color: "bg-yellow-500" },
    { label: "High", range: "50-75%", color: "bg-orange-500" },
    { label: "Critical", range: "75-100%", color: "bg-red-500" },
];

export const MapLegend = ({ selectedDisease, metadata }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="fixed bottom-4 left-4 z-10">
            <div className="bg-gray-900/90 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden max-w-xs">
                {/* Header */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                >
                    <span className="font-semibold text-sm">Risk Legend</span>
                    <svg
                        className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Content */}
                {isExpanded && (
                    <div className="p-4 space-y-4">
                        {/* Risk Levels */}
                        <div className="space-y-2">
                            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
                                Outbreak Risk
                            </p>
                            {RISK_LEVELS.map((level) => (
                                <div key={level.label} className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded ${level.color}`} />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium">{level.label}</div>
                                        <div className="text-xs text-gray-400">{level.range}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Metadata */}
                        {metadata && (
                            <div className="pt-3 border-t border-gray-700/50 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">Data Points:</span>
                                    <span className="text-sm font-semibold">{metadata.count?.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">Avg Risk:</span>
                                    <span className="text-sm font-semibold">
                                        {metadata.avgRisk ? `${(parseFloat(metadata.avgRisk) * 100).toFixed(1)}%` : "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">Disease:</span>
                                    <span className="text-sm font-semibold capitalize">
                                        {selectedDisease === "all" ? "All" : selectedDisease}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Last Updated */}
                        <div className="pt-2 border-t border-gray-700/50">
                            <p className="text-xs text-gray-500">
                                Updated: {new Date().toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
