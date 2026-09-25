# ServeYeah Health - Student Health Screening Mobile Prototype

A modern, frontend-only healthcare prototype built with **React Native**, **Expo (SDK 57)**, and **TypeScript** under the **ServeYeah** brand ([www.serveyeah.com](https://www.serveyeah.com)).

Designed specifically for bulk student health check-ups and cardiac evaluation camps (e.g. *Shree Raj Education Centre* & *Shree Raj Medical & Healthcare Centre*).

---

## Features

1. **Screen 1 — Home / Dashboard**:
   - Clean ServeYeah Health branding with "Student Health Screening" subtitle.
   - Primary action: `+ New Student Entry`.
   - Medical camp overview banner (Oct 2026 camp details).
   - "Recent Entries" list loaded with demo records for immediate client presentation, updating reactively as new students are screened.

2. **Screen 2 — New Student Entry Form**:
   - **Student Information**: Student Name (required), Village, Age (required), Weight, Height, Class (required), Roll No. (required), C/o. (Parent/Guardian).
   - **Student Photograph**: Dedicated photo area with modal choices:
     - *Take Photo*: Requests camera permission and opens device camera.
     - *Choose Photo*: Requests photo library permission and opens image picker.
     - Preview with change/replace and remove options.
   - **Health Evaluation**: ECG and 2D Echo Heart with quick clinical pill selectors + custom inputs, and Doctor's Advice multi-line input.
   - **Frontend Validation**: Friendly alerts ensuring mandatory fields are filled.
   - **Action**: "Generate Health Form" saves entry to React local state and routes to the printable preview.

3. **Screen 3 — Health Form Preview (Paper Replica)**:
   - Faithful digital representation of the client's physical health screening form (`reference-form.jpg`):
     - Exact header: *Shree Raj Education Centre, Nanose* with *Shree Raj Medical & Healthcare Centre, Parali, Khopoli, Raigad*.
     - Title: *FREE GENERAL HEALTH CHECK-UP AND CARDIAC EVALUATION CAMP*.
     - Date: *on 8th & 9th (Thursday, Friday), October 2026*.
     - In association with: *ONELIFE Charitable Trust, Mulund* & *Parisoha Foundation Pvt. Ltd.*
     - Venue: *Shree Raj Education Centre, Nanose, Rajnagar, Parali, Khopoli, Raigad*.
     - Student photo framed neatly alongside student details in passport-box format.
     - Underlined field values matching the original paper form lines.
     - Clinical findings: ECG, 2D Echo Heart, Doctor's Advice.
     - Doctor / authorized signatory lines.
   - **Toolbar Actions**: "Edit Details" (returns to form with current values) and "Print Form".

4. **A4 Document Printing**:
   - Implemented using `expo-print` (and `expo-sharing`).
   - Renders a clean, print-optimized A4 page (`@page { size: A4 portrait; }`).
   - Completely strips mobile navigation, buttons, and app controls from the print output.

---

## Getting Started

### 1. Run the Development Server
```bash
npm start
```
Scan the QR code with **Expo Go** on your Android device or camera app on iOS.

### 2. Run on Web (Browser)
```bash
npm run web
```

### 3. Run on Android Emulator
```bash
npm run android
```

### 4. Run on iOS Simulator (macOS only)
```bash
npm run ios
```

---

## Project Structure

```
├── reference-form.jpg       # Client's paper health check-up form reference
├── App.tsx                  # Root application with Screen Navigator & SafeArea
├── app.json                 # Expo config & camera/photo permissions
├── package.json             # Expo SDK 57 & dependencies
├── src/
│   ├── types/
│   │   └── student.ts       # Strongly-typed data model for screening records
│   ├── constants/
│   │   ├── campDetails.ts   # Exact camp & hospital organization details
│   │   └── theme.ts         # Healthcare blue/teal color palette & typography
│   ├── data/
│   │   └── mockData.ts      # Initial demo student records
│   ├── services/
│   │   └── printService.ts  # Pixel-perfect A4 HTML/CSS generation & expo-print
│   ├── context/
│   │   └── ScreeningContext.tsx # React Context managing local screening state
│   ├── components/
│   │   ├── AppHeader.tsx        # Subtle ServeYeah Health brand header
│   │   ├── PrimaryButton.tsx    # Accessible healthcare button with states
│   │   ├── FormInput.tsx        # Styled input with validation cues
│   │   ├── FormSection.tsx      # Grouped section card with step badges
│   │   ├── PhotoPicker.tsx      # Camera & gallery photo capture modal
│   │   └── RecentEntryCard.tsx  # Dashboard screening card with quick print
│   └── screens/
│       ├── DashboardScreen.tsx          # Screen 1: Landing & recent entries
│       ├── StudentFormScreen.tsx        # Screen 2: Form with validation & photo
│       └── HealthFormPreviewScreen.tsx  # Screen 3: Paper replica preview
```
