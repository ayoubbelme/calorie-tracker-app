import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { CaloriesProvider } from './src/components/CaloriesContext';
import { ProfileProvider } from './src/components/ProfileContext';
export default function App() {
  return (
    <ProfileProvider>
      <CaloriesProvider>
        <AppNavigator />
      </CaloriesProvider>
    </ProfileProvider>);
}
