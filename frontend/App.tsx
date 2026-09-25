import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ScreeningProvider, useScreening } from './src/context/ScreeningContext';
import { BottomNavBar } from './src/components/BottomNavBar';
import { RoleSelectionScreen } from './src/screens/RoleSelectionScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { CampScreen } from './src/screens/CampScreen';
import { PatientHomeScreen } from './src/screens/PatientHomeScreen';
import { UserRecordsScreen } from './src/screens/UserRecordsScreen';
import { UserProfileScreen } from './src/screens/UserProfileScreen';
import { MoreScreen } from './src/screens/MoreScreen';
import { StudentFormScreen } from './src/screens/StudentFormScreen';
import { HealthFormPreviewScreen } from './src/screens/HealthFormPreviewScreen';
import { COLORS } from './src/constants/theme';

const MainNavigator: React.FC = () => {
  const { activeScreen, activeTab, bottomNavVisible, switchTab } = useScreening();

  const renderScreen = () => {
    switch (activeScreen) {
      case 'roleSelection':
        return <RoleSelectionScreen />;
      case 'dashboard':
        return <DashboardScreen />;
      case 'history':
        return <HistoryScreen />;
      case 'camp':
        return <CampScreen />;
      case 'patientHome':
        return <PatientHomeScreen />;
      case 'userRecords':
        return <UserRecordsScreen />;
      case 'userProfile':
        return <UserProfileScreen />;
      case 'more':
        return <MoreScreen />;
      case 'form':
        return <StudentFormScreen />;
      case 'preview':
        return <HealthFormPreviewScreen />;
      default:
        return <RoleSelectionScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.screenContainer}>{renderScreen()}</View>
      {bottomNavVisible ? (
        <SafeAreaView edges={['bottom']} style={styles.bottomNavWrapper}>
          <BottomNavBar activeTab={activeTab} onTabPress={switchTab} />
        </SafeAreaView>
      ) : null}
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ScreeningProvider>
        <StatusBar style="dark" />
        <MainNavigator />
      </ScreeningProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.card,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  bottomNavWrapper: {
    backgroundColor: COLORS.card,
  },
});
