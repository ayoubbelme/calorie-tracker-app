import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

// Light Theme (Default)
export const lightTheme = {
    name: 'Light',
    isDark: false,
    background: '#F9FAFB',
    surface: '#FFFFFF',
    surfaceAlt: '#FAFAFA',
    text: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
    divider: '#F3F4F6',
    primary: '#8B5CF6',
    primaryLight: '#F5F3FF',
    primaryDark: '#7C3AED',
    success: '#22C55E',
    successLight: '#F0FDF4',
    warning: '#F59E0B',
    warningLight: '#FFFBEB',
    error: '#EF4444',
    errorLight: '#FEF2F2',
    info: '#3B82F6',
    infoLight: '#EFF6FF',
    calories: '#22C55E',
    protein: '#3B82F6',
    carbs: '#F59E0B',
    fat: '#EF4444',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    cardBackground: '#FFFFFF',
    cardShadow: 'rgba(0, 0, 0, 0.05)',
};

// Dark Theme
export const darkTheme = {
    name: 'Dark',
    isDark: true,
    background: '#111827',
    surface: '#1F2937',
    surfaceAlt: '#374151',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    textTertiary: '#9CA3AF',
    border: '#374151',
    divider: '#4B5563',
    primary: '#A78BFA',
    primaryLight: '#312E81',
    primaryDark: '#C4B5FD',
    success: '#34D399',
    successLight: '#064E3B',
    warning: '#FBBF24',
    warningLight: '#78350F',
    error: '#F87171',
    errorLight: '#7F1D1D',
    info: '#60A5FA',
    infoLight: '#1E3A8A',
    calories: '#34D399',
    protein: '#60A5FA',
    carbs: '#FBBF24',
    fat: '#F87171',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    cardBackground: '#1F2937',
    cardShadow: 'rgba(0, 0, 0, 0.3)',
};

// Ocean Theme (Blue-Green)
export const oceanTheme = {
    name: 'Ocean',
    isDark: false,
    background: '#ECFEFF',
    surface: '#FFFFFF',
    surfaceAlt: '#F0FDFA',
    text: '#0F172A',
    textSecondary: '#475569',
    textTertiary: '#94A3B8',
    border: '#E0F2FE',
    divider: '#F0F9FF',
    primary: '#0EA5E9',
    primaryLight: '#E0F2FE',
    primaryDark: '#0284C7',
    success: '#10B981',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    info: '#06B6D4',
    infoLight: '#CFFAFE',
    calories: '#10B981',
    protein: '#06B6D4',
    carbs: '#F59E0B',
    fat: '#F43F5E',
    shadowColor: '#0EA5E9',
    shadowOpacity: 0.1,
    cardBackground: '#FFFFFF',
    cardShadow: 'rgba(14, 165, 233, 0.08)',
};

// Sunset Theme (Warm Orange-Pink)
export const sunsetTheme = {
    name: 'Sunset',
    isDark: false,
    background: '#FFF7ED',
    surface: '#FFFFFF',
    surfaceAlt: '#FFFBEB',
    text: '#1C1917',
    textSecondary: '#57534E',
    textTertiary: '#A8A29E',
    border: '#FED7AA',
    divider: '#FFEDD5',
    primary: '#F97316',
    primaryLight: '#FFEDD5',
    primaryDark: '#EA580C',
    success: '#22C55E',
    successLight: '#DCFCE7',
    warning: '#EAB308',
    warningLight: '#FEF9C3',
    error: '#DC2626',
    errorLight: '#FEE2E2',
    info: '#EC4899',
    infoLight: '#FCE7F3',
    calories: '#22C55E',
    protein: '#F97316',
    carbs: '#EAB308',
    fat: '#DC2626',
    shadowColor: '#F97316',
    shadowOpacity: 0.12,
    cardBackground: '#FFFFFF',
    cardShadow: 'rgba(249, 115, 22, 0.08)',
};

// Forest Theme (Green)
export const forestTheme = {
    name: 'Forest',
    isDark: false,
    background: '#F0FDF4',
    surface: '#FFFFFF',
    surfaceAlt: '#F7FEE7',
    text: '#14532D',
    textSecondary: '#365314',
    textTertiary: '#84CC16',
    border: '#BBF7D0',
    divider: '#DCFCE7',
    primary: '#16A34A',
    primaryLight: '#DCFCE7',
    primaryDark: '#15803D',
    success: '#22C55E',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    error: '#DC2626',
    errorLight: '#FEE2E2',
    info: '#0891B2',
    infoLight: '#CFFAFE',
    calories: '#22C55E',
    protein: '#16A34A',
    carbs: '#84CC16',
    fat: '#CA8A04',
    shadowColor: '#16A34A',
    shadowOpacity: 0.1,
    cardBackground: '#FFFFFF',
    cardShadow: 'rgba(22, 163, 74, 0.08)',
};

// Midnight Theme (Deep Dark Blue)
export const midnightTheme = {
    name: 'Midnight',
    isDark: true,
    background: '#0F172A',
    surface: '#1E293B',
    surfaceAlt: '#334155',
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textTertiary: '#94A3B8',
    border: '#334155',
    divider: '#475569',
    primary: '#6366F1',
    primaryLight: '#1E1B4B',
    primaryDark: '#818CF8',
    success: '#10B981',
    successLight: '#064E3B',
    warning: '#F59E0B',
    warningLight: '#78350F',
    error: '#EF4444',
    errorLight: '#7F1D1D',
    info: '#3B82F6',
    infoLight: '#1E3A8A',
    calories: '#10B981',
    protein: '#6366F1',
    carbs: '#F59E0B',
    fat: '#EF4444',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    cardBackground: '#1E293B',
    cardShadow: 'rgba(0, 0, 0, 0.4)',
};

// Rose Theme (Pink-Purple)
export const roseTheme = {
    name: 'Rose',
    isDark: false,
    background: '#FFF1F2',
    surface: '#FFFFFF',
    surfaceAlt: '#FCE7F3',
    text: '#1F2937',
    textSecondary: '#4B5563',
    textTertiary: '#9CA3AF',
    border: '#FBCFE8',
    divider: '#FCE7F3',
    primary: '#EC4899',
    primaryLight: '#FCE7F3',
    primaryDark: '#DB2777',
    success: '#10B981',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    info: '#8B5CF6',
    infoLight: '#F5F3FF',
    calories: '#10B981',
    protein: '#EC4899',
    carbs: '#F59E0B',
    fat: '#EF4444',
    shadowColor: '#EC4899',
    shadowOpacity: 0.1,
    cardBackground: '#FFFFFF',
    cardShadow: 'rgba(236, 72, 153, 0.08)',
};

// High Contrast Theme (Accessibility)
export const highContrastTheme = {
    name: 'High Contrast',
    isDark: false,
    background: '#FFFFFF',
    surface: '#F9FAFB',
    surfaceAlt: '#F3F4F6',
    text: '#000000',
    textSecondary: '#1F2937',
    textTertiary: '#4B5563',
    border: '#000000',
    divider: '#6B7280',
    primary: '#0000FF',
    primaryLight: '#DBEAFE',
    primaryDark: '#00008B',
    success: '#008000',
    successLight: '#D1FAE5',
    warning: '#FF8C00',
    warningLight: '#FEF3C7',
    error: '#FF0000',
    errorLight: '#FEE2E2',
    info: '#0000CD',
    infoLight: '#DBEAFE',
    calories: '#008000',
    protein: '#0000FF',
    carbs: '#FF8C00',
    fat: '#FF0000',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    cardBackground: '#F9FAFB',
    cardShadow: 'rgba(0, 0, 0, 0.15)',
};

// All available themes
export const THEMES = {
    light: lightTheme,
    dark: darkTheme,
    ocean: oceanTheme,
    sunset: sunsetTheme,
    forest: forestTheme,
    midnight: midnightTheme,
    rose: roseTheme,
    highContrast: highContrastTheme,
};

export const ThemeProvider = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState('light');
    const [theme, setTheme] = useState(lightTheme);

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('app_theme');
            if (savedTheme && THEMES[savedTheme]) {
                setCurrentTheme(savedTheme);
                setTheme(THEMES[savedTheme]);
            }
        } catch (error) {
            console.error('Failed to load theme:', error);
        }
    };

    const changeTheme = async (themeName) => {
        try {
            if (THEMES[themeName]) {
                setCurrentTheme(themeName);
                setTheme(THEMES[themeName]);
                await AsyncStorage.setItem('app_theme', themeName);
            }
        } catch (error) {
            console.error('Failed to save theme:', error);
        }
    };

    const toggleTheme = async () => {
        // Legacy function for backward compatibility
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        await changeTheme(newTheme);
    };

    const isDark = theme.isDark;

    return (
        <ThemeContext.Provider value={{
            theme,
            isDark,
            currentTheme,
            changeTheme,
            toggleTheme, // Keep for backward compatibility
            availableThemes: Object.keys(THEMES)
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};