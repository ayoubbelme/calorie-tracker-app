import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { CaloriesProvider } from './src/components/CaloriesContext';
import { ProfileProvider } from './src/components/ProfileContext';
import { ThemeProvider } from './src/components/ThemeContext';
import { AchievementsProvider } from './src/components/AchievementsContext';
import { SoundProvider } from './src/components/SoundContext';

export default function App() {
    return (
        <ThemeProvider>
            <SoundProvider>
                <SafeAreaProvider>
                    <ProfileProvider>
                        <CaloriesProvider>
                            <AchievementsProvider>

                                <AppNavigator />

                            </AchievementsProvider>
                        </CaloriesProvider>
                    </ProfileProvider>
                </SafeAreaProvider>
            </SoundProvider>
        </ThemeProvider>);
}
