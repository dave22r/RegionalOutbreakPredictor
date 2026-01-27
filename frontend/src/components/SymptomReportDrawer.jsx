import { useState, useEffect } from "react";
import Icon from "@mdi/react";
import { mdiClose, mdiCheckCircle, mdiAlertCircle } from "@mdi/js";
import { Portal } from "./Portal";

const { VITE_BACKEND_URL } = import.meta.env;

const SYMPTOMS = [
    { id: "fever", label: "Fever" },
    { id: "cough", label: "Cough" },
    { id: "sore_throat", label: "Sore Throat" },
    { id: "fatigue", label: "Fatigue" },
    { id: "headache", label: "Headache" },
    { id: "body_aches", label: "Body Aches" },
    { id: "nausea", label: "Nausea" },
    { id: "diarrhea", label: "Diarrhea" },
    { id: "loss_of_taste", label: "Loss of Taste/Smell" },
    { id: "shortness_of_breath", label: "Shortness of Breath" },
];

const DISEASES = [
    { id: "unknown", label: "Not Sure" },
    { id: "flu", label: "Flu" },
    { id: "covid-19", label: "COVID-19" },
    { id: "food_poisoning", label: "Food Poisoning" },
    { id: "other", label: "Other" },
];

export const SymptomReportDrawer = ({ isOpen, onClose }) => {
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);
    const [suspectedDisease, setSuspectedDisease] = useState("unknown");
    const [severity, setSeverity] = useState(2);
    const [location, setLocation] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null

    // Get user location
    const getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setLocation({ lat: 37.7749, lng: -122.4194 }); // Default to SF
                },
                {
                    timeout: 5000,
                    enableHighAccuracy: false,
                    maximumAge: 60000,
                }
            );
        } else {
            setLocation({ lat: 37.7749, lng: -122.4194 }); // Default to SF
        }
    };

    // Auto-get location when drawer opens
    useEffect(() => {
        if (isOpen && !location) {
            getLocation();
        }
    }, [isOpen]);

    const toggleSymptom = (symptomId) => {
        setSelectedSymptoms((prev) =>
            prev.includes(symptomId)
                ? prev.filter((id) => id !== symptomId)
                : [...prev, symptomId]
        );
    };

    const handleSubmit = async () => {
        if (selectedSymptoms.length === 0) {
            alert("Please select at least one symptom");
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus(null);

        try {
            const response = await fetch(`${VITE_BACKEND_URL}/symptoms`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    symptoms: selectedSymptoms,
                    suspectedDisease,
                    severity,
                    location: location || { lat: 37.7749, lng: -122.4194 },
                }),
            });

            if (response.ok) {
                setSubmitStatus("success");
                setTimeout(() => {
                    onClose();
                    // Reset form
                    setSelectedSymptoms([]);
                    setSuspectedDisease("unknown");
                    setSeverity(2);
                    setSubmitStatus(null);
                }, 2000);
            } else {
                setSubmitStatus("error");
            }
        } catch (error) {
            console.error("Error submitting symptoms:", error);
            setSubmitStatus("error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Portal>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
                <div className="bg-gray-900 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-gray-900 border-b border-gray-700/50 px-6 py-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold">Report Symptoms</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <Icon path={mdiClose} size={1} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Success/Error Message */}
                        {submitStatus && (
                            <div
                                className={`p-4 rounded-xl flex items-center gap-3 ${submitStatus === "success"
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-red-500/20 text-red-400"
                                    }`}
                            >
                                <Icon
                                    path={submitStatus === "success" ? mdiCheckCircle : mdiAlertCircle}
                                    size={1}
                                />
                                <span className="font-medium">
                                    {submitStatus === "success"
                                        ? "Thank you! Your report has been submitted."
                                        : "Failed to submit. Please try again."}
                                </span>
                            </div>
                        )}

                        {/* Symptoms Section */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                                Select Your Symptoms
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {SYMPTOMS.map((symptom) => (
                                    <button
                                        key={symptom.id}
                                        onClick={() => toggleSymptom(symptom.id)}
                                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${selectedSymptoms.includes(symptom.id)
                                            ? "bg-blue-500 text-white shadow-lg scale-105"
                                            : "bg-gray-800/50 hover:bg-gray-700/50 text-gray-300"
                                            }`}
                                    >
                                        {symptom.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Disease Suspicion */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                                What do you think it might be?
                            </h3>
                            <select
                                value={suspectedDisease}
                                onChange={(e) => setSuspectedDisease(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {DISEASES.map((disease) => (
                                    <option key={disease.id} value={disease.id}>
                                        {disease.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Severity Slider */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                                Severity Level
                            </h3>
                            <div className="space-y-2">
                                <input
                                    type="range"
                                    min="1"
                                    max="3"
                                    value={severity}
                                    onChange={(e) => setSeverity(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                                <div className="flex justify-between text-sm">
                                    <span className={severity === 1 ? "text-green-400 font-semibold" : "text-gray-500"}>
                                        Mild
                                    </span>
                                    <span className={severity === 2 ? "text-yellow-400 font-semibold" : "text-gray-500"}>
                                        Moderate
                                    </span>
                                    <span className={severity === 3 ? "text-red-400 font-semibold" : "text-gray-500"}>
                                        Severe
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Location Info */}
                        <div className="p-4 bg-gray-800/30 rounded-xl">
                            <p className="text-sm text-gray-400">
                                📍 Location: {location ? "Detected" : "Detecting..."}
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || selectedSymptoms.length === 0}
                            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold py-4 rounded-xl transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Submitting..." : "Submit Report"}
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};
