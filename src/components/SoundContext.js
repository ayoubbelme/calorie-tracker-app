import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const SoundContext = createContext();

export const SoundProvider = ({ children }) => {
    const [soundEnabled, setSoundEnabled] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const stored = await AsyncStorage.getItem('sound_effects_enabled');
            if (stored !== null) {
                setSoundEnabled(stored === 'true');
            }
        } catch (error) {
            console.error('Failed to load sound settings:', error);
        }
    };

    // Simple sound effects using haptics only (reliable cross-platform)
    const playSound = async (soundType) => {
        if (!soundEnabled) return;

        try {
            switch (soundType) {
                case 'success':
                case 'achievement':
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    break;
                
                case 'levelUp':
                    // Triple haptic for level up
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 100);
                    setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 200);
                    break;
                
                case 'tap':
                case 'click':
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    break;
                
                case 'button':
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    break;
                
                case 'error':
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    break;
                
                case 'notification':
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    break;
                
                case 'streak':
                    // Double tap for streak
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 100);
                    break;
                
                case 'water':
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    break;
                
                case 'camera':
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    break;
                
                case 'heavy':
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    break;
                
                default:
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        } catch (error) {
            console.warn('Failed to play sound:', error);
        }
    };

    const toggleSound = async (enabled) => {
        setSoundEnabled(enabled);
        try {
            await AsyncStorage.setItem('sound_effects_enabled', enabled.toString());
            
            // Play feedback when toggling
            if (enabled) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (error) {
            console.error('Failed to save sound settings:', error);
        }
    };

    return (
        <SoundContext.Provider value={{ playSound, soundEnabled, toggleSound }}>
            {children}
        </SoundContext.Provider>
    );
};

export const useSound = () => {
    const context = useContext(SoundContext);
    if (!context) {
        throw new Error('useSound must be used within SoundProvider');
    }
    return context;
};