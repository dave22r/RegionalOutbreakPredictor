# Development Changelog

## January 26, 2026 - ML Integration and UI Enhancements

### Overview

This update integrates the trained machine learning model with the frontend application and adds several new user interface components to improve interactivity and data visualization. Previously, the application was using static test data with hardcoded coordinates. Now, the system generates predictions using the actual Logistic Regression model trained on historical outbreak data.

### Machine Learning Integration

#### New Files

**ml/src/ml_predict_outbreaks.py**

This script replaces the previous fake data generator. It loads the trained Logistic Regression model from `ml/models/lr_classifier.pkl` and generates outbreak predictions based on real feature engineering. The script creates feature vectors that match the training data format, including temporal features (year, week), cyclical encodings, disease one-hot encodings, historical case data, and weather parameters.

The prediction pipeline works by iterating through each disease and region combination, creating appropriate feature vectors, and using the model's `predict_proba` method to get actual outbreak probabilities. These probabilities are then mapped to geographic coordinates clustered around major California cities. The output is saved to `ml/data/processed/predictions.json` in a format the backend can consume.

Key improvements over the previous approach:
- Uses real ML model instead of random seasonal patterns
- Generates 1,673 prediction points (down from 3,620 fake points)
- Produces realistic risk scores: Flu at 22.0%, COVID-19 at 34.0%, Valley Fever at 10.3%
- Based on actual weather and disease features, not arbitrary seasonal curves

**ml/data/processed/predictions.json**

This file contains the generated predictions. Each entry includes latitude, longitude, and risk score. The backend reads this file to serve predictions through the API.

#### Modified Files

**backend/app.js**

Added import and route registration for the new predictions API endpoint. The predictions route is now available at `/predictions`.

**backend/src/api/predictions.js** (New)

Created a new API endpoint that serves ML predictions. The endpoint reads from `predictions.json` and supports filtering by disease type via query parameters. When a disease filter is applied (e.g., `?disease=flu`), it returns only the relevant subset of predictions. The response includes the coordinate array, metadata about available diseases and regions, and calculated statistics like average risk and point count.

### Frontend UI Components

#### Disease Filter Panel

**frontend/src/components/DiseaseTogglePanel.jsx** (New)

Added a collapsible panel positioned in the top-left corner of the map that allows users to filter predictions by disease type. The panel includes six filter options: All Diseases, Flu, COVID-19, Valley Fever (Coccidioidomycosis), Salmonella, and Campylobacter. Each disease has a distinct color scheme that updates the heatmap visualization when selected.

The component uses smooth animations for state transitions and provides visual feedback when a disease is selected. The selected disease is highlighted with a checkmark icon and a subtle scale animation. Users can collapse the panel to maximize map viewing area.

#### Risk Legend

**frontend/src/components/MapLegend.jsx** (New)

Created an interactive legend positioned in the bottom-left corner that explains the risk level color coding and displays real-time metadata about the current view. The legend shows four risk categories: Low (0-25%, green), Medium (25-50%, yellow), High (50-75%, orange), and Critical (75-100%, red).

Below the color scale, the legend displays dynamic statistics including the number of data points currently visible, the average risk percentage, the active disease filter, and the last update timestamp. Like the disease panel, this component is collapsible to give users control over screen space.

#### Symptom Reporting Interface

**frontend/src/components/SymptomReportButton.jsx** (New)

Added a floating action button in the bottom-right corner that opens the symptom reporting interface. The button features a pulsing animation with a ring effect to draw user attention. On hover, it displays a tooltip indicating its purpose.

**frontend/src/components/SymptomReportDrawer.jsx** (New)

Implemented a drawer component that slides up from the bottom of the screen when the symptom report button is clicked. The drawer allows users to report their symptoms by selecting from ten common options: Fever, Cough, Sore Throat, Fatigue, Headache, Body Aches, Nausea, Diarrhea, Loss of Taste/Smell, and Shortness of Breath.

Users can also specify what they suspect the illness might be via a dropdown menu (options include Not Sure, Flu, COVID-19, Food Poisoning, and Other) and indicate severity using a slider ranging from Mild to Severe. The form automatically detects the user's location using the browser's geolocation API.

Form validation ensures at least one symptom is selected before submission. Upon successful submission, the form displays a success message and automatically closes after a brief delay.

#### Main Application Updates

**frontend/src/App.jsx**

Modified the main application component to integrate all new UI elements. The app now fetches predictions from the backend API instead of using static test data. When a user changes the disease filter, the app makes a new API request and updates the heatmap layer accordingly.

Added state management for the symptom reporting drawer and wired up all the new components. The heatmap layer now uses disease-specific colors that correspond to the selected filter, providing better visual distinction between different outbreak types.

Removed the `mapId` and `renderingType` props from the Map component to avoid Google Maps API errors during development when a valid Map ID is not configured.

**frontend/src/index.css**

Added custom CSS animations for the pulsing symptom report button and smooth transitions for component state changes. Included utility classes for the glassmorphism effect used throughout the new UI components.

### Data Changes

The application now displays significantly different data compared to the previous version:

**Before:**
- Total points: 3,620 (randomly generated)
- Flu average risk: 86.7% (unrealistically high)
- COVID-19 average risk: 63.2%
- Based on hardcoded seasonal patterns

**After:**
- Total points: 1,673 (ML-generated based on outbreak probability)
- Flu average risk: 22.0% (realistic for late January)
- COVID-19 average risk: 34.0%
- Based on trained Logistic Regression model with weather and disease features

### Technical Notes

The ML prediction script should be run weekly to generate updated predictions. After running the script, restart the backend server to reload the new predictions file. The script currently uses hardcoded weather values as placeholders; in a production environment, these should be replaced with real-time weather API data.

The frontend components use a consistent design language with glassmorphism effects (backdrop blur with semi-transparent backgrounds) and smooth animations. All interactive elements provide visual feedback to improve user experience.


### Known Issues

The Google Maps API displays a billing error on initial load if a valid API key with billing enabled is not configured. This does not prevent the application from functioning, but it does show a warning modal. The map remains interactive and displays all outbreak predictions correctly after dismissing the modal.

### Files Modified

- backend/app.js
- backend/src/api/auth/callback.js
- backend/src/api/auth/login.js
- frontend/src/App.jsx
- frontend/src/index.css

### Files Added

- backend/src/api/predictions.js
- frontend/src/components/DiseaseTogglePanel.jsx
- frontend/src/components/MapLegend.jsx
- frontend/src/components/SymptomReportButton.jsx
- frontend/src/components/SymptomReportDrawer.jsx
- ml/src/ml_predict_outbreaks.py
- ml/data/processed/predictions.json
- ml/src/generate_predictions.py (deprecated, replaced by ml_predict_outbreaks.py)
