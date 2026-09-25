import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  StudentScreeningEntry,
  ScreenName,
  TabName,
  UserRole,
  MockPatientProfile,
} from '../types/student';
import { Screening, User, Camp } from '../types/api';
import { INITIAL_STUDENT_ENTRIES } from '../data/mockData';
import { MOCK_PATIENT_PROFILES } from '../data/patientMockData';
import {
  usersApi,
  screeningsApi,
  campsApi,
  workersApi,
  getDevUserId,
  getDevWorkerId,
  getDevCampId,
  mapFormDataToScreening,
  mapScreeningToEntry,
  formatBackendDate,
} from '../services/api';

export const TAB_ROUTES: Record<TabName, ScreenName> = {
  home: 'dashboard',
  history: 'history',
  camp: 'camp',
  records: 'userRecords',
  profile: 'userProfile',
  more: 'more',
};

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ScreeningContextType {
  // Existing state
  entries: StudentScreeningEntry[];
  currentEntry: StudentScreeningEntry | null;
  activeScreen: ScreenName;
  activeTab: TabName;
  bottomNavVisible: boolean;
  userRole: UserRole;
  patientProfiles: MockPatientProfile[];
  selectedPatient: MockPatientProfile | null;

  // API state
  apiPatient: User | null;
  apiScreenings: Screening[];
  apiCamps: Camp[];
  apiPatientLoading: boolean;
  apiScreeningsLoading: boolean;
  apiCampsLoading: boolean;
  apiError: string | null;

  // Existing actions
  saveEntry: (entry: StudentScreeningEntry) => void;
  selectEntryForPreview: (id: string) => void;
  previewScreeningFromApi: (screening: Screening) => void;
  startNewEntry: () => void;
  editCurrentEntry: () => void;
  navigateTo: (screen: ScreenName) => void;
  switchTab: (tab: TabName) => void;
  setUserRole: (role: UserRole) => void;
  selectPatient: (patient: MockPatientProfile) => void;
  deleteEntry: (id: string) => void;
  TAB_ROUTES: Record<TabName, ScreenName>;

  // API actions
  loadPatientProfile: (userId?: string) => Promise<void>;
  loadUserScreenings: (userId?: string) => Promise<void>;
  loadWorkerScreenings: (workerId?: string) => Promise<void>;
  loadCamps: () => Promise<void>;
  createScreeningFromForm: (formData: StudentScreeningEntry) => Promise<Screening | null>;
  clearApiError: () => void;
}

const ScreeningContext = createContext<ScreeningContextType | undefined>(undefined);

const OVERLAY_SCREENS: ScreenName[] = ['form', 'preview', 'roleSelection'];

export const ScreeningProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [entries, setEntries] = useState<StudentScreeningEntry[]>(INITIAL_STUDENT_ENTRIES);
  const [currentEntry, setCurrentEntry] = useState<StudentScreeningEntry | null>(null);
  const [activeScreen, setActiveScreen] = useState<ScreenName>('roleSelection');
  const [activeTab, setActiveTab] = useState<TabName>('home');
  const [userRole, setUserRoleState] = useState<UserRole>(null);
  const [patientProfiles] = useState<MockPatientProfile[]>(MOCK_PATIENT_PROFILES);
  const [selectedPatient, setSelectedPatient] = useState<MockPatientProfile | null>(null);

  // API state
  const [apiPatient, setApiPatient] = useState<User | null>(null);
  const [apiScreenings, setApiScreenings] = useState<Screening[]>([]);
  const [apiCamps, setApiCamps] = useState<Camp[]>([]);
  const [apiPatientLoading, setApiPatientLoading] = useState(false);
  const [apiScreeningsLoading, setApiScreeningsLoading] = useState(false);
  const [apiCampsLoading, setApiCampsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const bottomNavVisible = !OVERLAY_SCREENS.includes(activeScreen);

  const handleSetUserRole = useCallback((role: UserRole) => {
    setUserRoleState(role);
    setSelectedPatient(null);
    setApiPatient(null);
    setApiScreenings([]);
    if (role === 'worker') {
      setActiveScreen('dashboard');
      setActiveTab('home');
    } else if (role === 'patient') {
      if (MOCK_PATIENT_PROFILES.length > 0) {
        setSelectedPatient(MOCK_PATIENT_PROFILES[0]);
      }
      setActiveScreen('patientHome');
      setActiveTab('home');
    } else {
      setActiveScreen('roleSelection');
    }
  }, []);

  const selectPatient = useCallback((patient: MockPatientProfile) => {
    setSelectedPatient(patient);
    setActiveScreen('patientHome');
    setActiveTab('home');
  }, []);

  const switchTab = useCallback(
    (tab: TabName) => {
      setActiveTab(tab);
      const screenMap: Record<TabName, ScreenName> = {
        home: userRole === 'patient' ? 'patientHome' : 'dashboard',
        history: 'history',
        camp: 'camp',
        records: 'userRecords',
        profile: 'userProfile',
        more: 'more',
      };
      setActiveScreen(screenMap[tab] || 'dashboard');
    },
    [userRole]
  );

  const saveEntry = useCallback((entry: StudentScreeningEntry) => {
    setEntries((prev) => {
      const existingIndex = prev.findIndex((e) => e.id === entry.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = entry;
        return updated;
      }
      return [entry, ...prev];
    });
    setCurrentEntry(entry);
    setActiveScreen('preview');
    setActiveTab('home');
  }, []);

  const selectEntryForPreview = useCallback((id: string) => {
    const found = entries.find((e) => e.id === id);
    if (found) {
      setCurrentEntry(found);
      setActiveScreen('preview');
    }
  }, [entries]);

  const previewScreeningFromApi = useCallback((screening: Screening) => {
    const mapped = mapScreeningToEntry(screening);
    setCurrentEntry(mapped);
    setActiveScreen('preview');
  }, []);

  const startNewEntry = useCallback(() => {
    const emptyEntry: StudentScreeningEntry = {
      id: 'entry-' + Date.now(),
      createdAt: new Date().toISOString(),
      name: '',
      village: '',
      age: '',
      weight: '',
      height: '',
      classRoom: '',
      rollNo: '',
      careOf: '',
      photoUri: undefined,
      photoBase64: undefined,
      ecg: 'Normal',
      echoHeart: 'Normal',
      advice: 'Annual pediatric health check-up advised.',
    };
    setCurrentEntry(emptyEntry);
    setActiveScreen('form');
  }, []);

  const editCurrentEntry = useCallback(() => {
    if (currentEntry) {
      setActiveScreen('form');
    }
  }, [currentEntry]);

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (currentEntry?.id === id) {
      setCurrentEntry(null);
    }
  }, [currentEntry]);

  const navigateTo = useCallback((screen: ScreenName) => {
    setActiveScreen(screen);
  }, []);

  // ============================================
  // API Actions
  // ============================================

  const clearApiError = useCallback(() => {
    setApiError(null);
  }, []);

  const loadPatientProfile = useCallback(async (userId?: string) => {
    const targetId = userId || getDevUserId();
    setApiPatientLoading(true);
    setApiError(null);
    try {
      const response = await usersApi.getById(targetId);
      if (response.success && response.data) {
        setApiPatient(response.data);
      } else {
        setApiError(response.error?.message || 'Failed to load patient profile');
      }
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to load patient profile');
    } finally {
      setApiPatientLoading(false);
    }
  }, []);

  const loadUserScreenings = useCallback(async (userId?: string) => {
    const targetId = userId || getDevUserId();
    setApiScreeningsLoading(true);
    setApiError(null);
    try {
      const response = await screeningsApi.getByUser(targetId, { limit: 50, offset: 0 });
      if (response.success && response.data) {
        setApiScreenings(response.data);
      } else {
        setApiError(response.error?.message || 'Failed to load screenings');
      }
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to load screenings');
    } finally {
      setApiScreeningsLoading(false);
    }
  }, []);

  const loadWorkerScreenings = useCallback(async (workerId?: string) => {
    const targetId = workerId || getDevWorkerId();
    setApiScreeningsLoading(true);
    setApiError(null);
    try {
      const response = await screeningsApi.getByWorker(targetId, { limit: 50, offset: 0 });
      if (response.success && response.data) {
        setApiScreenings(response.data);
      } else {
        setApiError(response.error?.message || 'Failed to load screenings');
      }
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to load screenings');
    } finally {
      setApiScreeningsLoading(false);
    }
  }, []);

  const loadCamps = useCallback(async () => {
    setApiCampsLoading(true);
    setApiError(null);
    try {
      const response = await campsApi.getAll({ activeOnly: true, limit: 50, offset: 0 });
      if (response.success && response.data) {
        setApiCamps(response.data);
      } else {
        setApiError(response.error?.message || 'Failed to load camps');
      }
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to load camps');
    } finally {
      setApiCampsLoading(false);
    }
  }, []);

  const createScreeningFromForm = useCallback(
    async (formData: StudentScreeningEntry): Promise<Screening | null> => {
      setApiError(null);
      try {
        const screeningData = mapFormDataToScreening(formData);
        
        // Determine which API to use based on user role
        let response;
        if (userRole === 'worker') {
          const workerId = getDevWorkerId();
          const campId = getDevCampId();
          response = await screeningsApi.create({
            ...screeningData,
            user_id: getDevUserId(), // For now, use dev user ID; in real app, this would be selected patient
            camp_id: campId,
            worker_id: workerId,
          });
        } else {
          // Patient role uses dev helper
          response = await screeningsApi.createDevScreening(screeningData);
        }
        
        if (response.success && response.data) {
          // Also add to local entries for immediate UI feedback
          saveEntry(formData);
          // Reload screenings to get the server-generated ID and data
          if (userRole === 'worker') {
            await loadWorkerScreenings();
          } else {
            await loadUserScreenings();
          }
          return response.data;
        } else {
          setApiError(response.error?.message || 'Failed to create screening');
          return null;
        }
      } catch (error) {
        setApiError(error instanceof Error ? error.message : 'Failed to create screening');
        return null;
      }
    },
    [userRole, saveEntry, loadUserScreenings, loadWorkerScreenings]
  );

  // Load patient profile when patient role is selected
  useEffect(() => {
    if (userRole === 'patient') {
      loadPatientProfile();
      loadUserScreenings();
      loadCamps();
    } else if (userRole === 'worker') {
      loadWorkerScreenings();
      loadCamps();
    }
  }, [userRole, loadPatientProfile, loadUserScreenings, loadWorkerScreenings, loadCamps]);

  // Also load when selectedPatient changes for patient role
  useEffect(() => {
    if (userRole === 'patient' && selectedPatient) {
      // Could load specific patient data here if needed
      loadUserScreenings();
    }
  }, [selectedPatient, userRole, loadUserScreenings]);

  return (
    <ScreeningContext.Provider
      value={{
        // Existing state
        entries,
        currentEntry,
        activeScreen,
        activeTab,
        bottomNavVisible,
        userRole,
        patientProfiles,
        selectedPatient,

        // API state
        apiPatient,
        apiScreenings,
        apiCamps,
        apiPatientLoading,
        apiScreeningsLoading,
        apiCampsLoading,
        apiError,

        // Existing actions
        saveEntry,
        selectEntryForPreview,
        previewScreeningFromApi,
        startNewEntry,
        editCurrentEntry,
        navigateTo,
        switchTab,
        setUserRole: handleSetUserRole,
        selectPatient,
        deleteEntry,
        TAB_ROUTES,

        // API actions
        loadPatientProfile,
        loadUserScreenings,
        loadWorkerScreenings,
        loadCamps,
        createScreeningFromForm,
        clearApiError,
      }}
    >
      {children}
    </ScreeningContext.Provider>
  );
};

export const useScreening = (): ScreeningContextType => {
  const context = useContext(ScreeningContext);
  if (!context) {
    throw new Error('useScreening must be used within a ScreeningProvider');
  }
  return context;
};