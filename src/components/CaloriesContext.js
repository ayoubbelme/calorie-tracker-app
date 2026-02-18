import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CaloriesContext = createContext();

const getTodayKey = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export function CaloriesProvider({ children }) {
    const [history, setHistory] = useState({});

    // ✅ Derive today's values directly from history.
    // On a new day, history[todayKey] won't exist → automatically 0.
    const todayKey = getTodayKey();
    const todayData = history[todayKey] || {};
    const todayCalories = todayData.calories || 0;
    const todayProtein = todayData.protein || 0;
    const todayCarbs = todayData.carbs || 0;
    const todayFat = todayData.fat || 0;

    // Load full history on app start
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const stored = await AsyncStorage.getItem('macro_history');
                const parsed = stored ? JSON.parse(stored) : {};
                setHistory(parsed);
            } catch (e) {
                console.error('Failed to load history', e);
            }
        };
        loadHistory();
    }, []);

    const addMeal = async (calories, protein, carbs, fat) => {
        try {
            const key = getTodayKey(); // Always the real current date

            // Read fresh from storage to avoid stale closure issues
            const stored = await AsyncStorage.getItem('macro_history');
            const parsed = stored ? JSON.parse(stored) : {};

            const existing = parsed[key] || { calories: 0, protein: 0, carbs: 0, fat: 0 };

            parsed[key] = {
                calories: existing.calories + calories,
                protein: existing.protein + parseFloat(protein || 0),
                carbs: existing.carbs + parseFloat(carbs || 0),
                fat: existing.fat + parseFloat(fat || 0),
                date: key,
            };

            await AsyncStorage.setItem('macro_history', JSON.stringify(parsed));
            setHistory({ ...parsed }); // Re-derive triggers automatic reset if day changed
        } catch (e) {
            console.error('Failed to save meal', e);
        }
    };

    return (
        <CaloriesContext.Provider value={{
            todayCalories, todayProtein, todayCarbs, todayFat,
            addMeal, history,
        }}>
            {children}
        </CaloriesContext.Provider>
    );
}

export function useCalories() {
    return useContext(CaloriesContext);
}