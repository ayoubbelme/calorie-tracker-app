import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileContext = createContext();

// Calculate BMR using Mifflin-St Jeor Equation
const calculateBMR = (weight, height, age, gender) => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseFloat(age);

    if (!w || !h || !a) return 0;

    if (gender === 'male') {
        return (10 * w) + (6.25 * h) - (5 * a) + 5;
    } else {
        return (10 * w) + (6.25 * h) - (5 * a) - 161;
    }
};

// Activity multipliers
const getActivityMultiplier = (activity) => {
    const multipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        veryActive: 1.9
    };
    return multipliers[activity] || 1.55;
};

// Calculate TDEE
const calculateTDEE = (bmr, activity) => {
    return bmr * getActivityMultiplier(activity);
};

// Calculate calorie goal based on fitness goal
const calculateCalorieGoal = (tdee, goal) => {
    switch (goal) {
        case 'Weight Loss':
            return Math.round(tdee - 500);
        case 'Extreme Weight Loss':
            return Math.round(tdee - 750);
        case 'Muscle Gain':
            return Math.round(tdee + 300);
        case 'Maintain Weight':
        default:
            return Math.round(tdee);
    }
};

// Calculate optimal macros
const calculateMacros = (calorieGoal, weight, goal) => {
    const w = parseFloat(weight);
    if (!w || !calorieGoal) {
        return { protein: 150, carbs: 200, fat: 67 };
    }

    let proteinGrams, fatGrams, carbGrams;

    switch (goal) {
        case 'Weight Loss':
        case 'Extreme Weight Loss':
            proteinGrams = Math.round(w * 2.2);
            fatGrams = Math.round((calorieGoal * 0.25) / 9);
            const remainingCalsLoss = calorieGoal - (proteinGrams * 4) - (fatGrams * 9);
            carbGrams = Math.round(Math.max(remainingCalsLoss / 4, 50));
            break;

        case 'Muscle Gain':
            proteinGrams = Math.round(w * 2.0);
            fatGrams = Math.round((calorieGoal * 0.25) / 9);
            const remainingCalsGain = calorieGoal - (proteinGrams * 4) - (fatGrams * 9);
            carbGrams = Math.round(Math.max(remainingCalsGain / 4, 50));
            break;

        case 'Maintain Weight':
        default:
            proteinGrams = Math.round(w * 1.8);
            fatGrams = Math.round((calorieGoal * 0.28) / 9);
            const remainingCalsMaint = calorieGoal - (proteinGrams * 4) - (fatGrams * 9);
            carbGrams = Math.round(Math.max(remainingCalsMaint / 4, 50));
            break;
    }

    // Ensure positive values
    proteinGrams = Math.max(proteinGrams, 50);
    fatGrams = Math.max(fatGrams, 30);
    carbGrams = Math.max(carbGrams, 50);

    return {
        protein: proteinGrams,
        carbs: carbGrams,
        fat: fatGrams
    };
};

export function ProfileProvider({ children }) {
    const [profile, setProfile] = useState({
        name: '',
        age: '',
        weight: '',
        height: '',
        gender: 'male',
        goal: 'Maintain Weight',
        activity: 'moderate',
        calorieGoal: '', // Empty by default for auto-calculation
        proteinGoal: '150',
        carbsGoal: '200',
        fatGoal: '67',
        bmr: '0',
        tdee: '0',
    });

    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const stored = await AsyncStorage.getItem('user_profile');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setProfile({
                        name: '',
                        age: '',
                        weight: '',
                        height: '',
                        gender: 'male',
                        goal: 'Maintain Weight',
                        activity: 'moderate',
                        calorieGoal: '',
                        proteinGoal: '150',
                        carbsGoal: '200',
                        fatGoal: '67',
                        bmr: '0',
                        tdee: '0',
                        ...parsed,
                    });
                }
            } catch (e) {
                console.error('Failed to load profile', e);
            } finally {
                setIsLoaded(true);
            }
        };
        loadProfile();
    }, []);

    const updateProfile = async (updates) => {
        try {
            let newProfile = { ...profile, ...updates };

            // Check if any fields that affect calculations were updated
            const shouldRecalculate =
                updates.weight !== undefined ||
                updates.height !== undefined ||
                updates.age !== undefined ||
                updates.gender !== undefined ||
                updates.activity !== undefined ||
                updates.goal !== undefined;

            if (shouldRecalculate) {
                const { weight, height, age, gender, activity, goal } = newProfile;

                // Only calculate if we have the minimum required data
                if (weight && height && age) {
                    // Calculate BMR
                    const bmr = calculateBMR(weight, height, age, gender);
                    newProfile.bmr = String(Math.round(bmr));

                    // Calculate TDEE
                    const tdee = calculateTDEE(bmr, activity);
                    newProfile.tdee = String(Math.round(tdee));

                    // Calculate calorie goal (auto if empty)
                    const autoCalorieGoal = calculateCalorieGoal(tdee, goal);

                    // If user has a custom calorie goal and didn't change goal/activity/weight significantly, keep it
                    // Otherwise, use auto-calculated value
                    if (!newProfile.calorieGoal || newProfile.calorieGoal === '' || newProfile.calorieGoal === '0') {
                        newProfile.calorieGoal = String(autoCalorieGoal);
                    } else if (updates.goal !== undefined || updates.activity !== undefined) {
                        // If goal or activity changed, recalculate
                        newProfile.calorieGoal = String(autoCalorieGoal);
                    }

                    // Calculate optimal macros
                    const finalCalorieGoal = parseFloat(newProfile.calorieGoal) || autoCalorieGoal;
                    const macros = calculateMacros(finalCalorieGoal, weight, goal);
                    newProfile.proteinGoal = String(macros.protein);
                    newProfile.carbsGoal = String(macros.carbs);
                    newProfile.fatGoal = String(macros.fat);
                } else {
                    // Not enough data yet, use defaults
                    if (!newProfile.calorieGoal) {
                        newProfile.calorieGoal = '2000';
                    }
                }
            }

            await AsyncStorage.setItem('user_profile', JSON.stringify(newProfile));
            setProfile(newProfile);
        } catch (e) {
            console.error('Failed to save profile', e);
        }
    };

    // Get effective calorie goal (auto-calculate if empty)
    const getEffectiveCalorieGoal = () => {
        if (profile.calorieGoal && profile.calorieGoal !== '' && profile.calorieGoal !== '0') {
            return profile.calorieGoal;
        }

        // Auto-calculate
        const { weight, height, age, gender, activity, goal, tdee } = profile;

        if (tdee && parseFloat(tdee) > 0) {
            return String(calculateCalorieGoal(parseFloat(tdee), goal));
        }

        if (weight && height && age) {
            const bmr = calculateBMR(weight, height, age, gender);
            const calculatedTdee = calculateTDEE(bmr, activity);
            return String(calculateCalorieGoal(calculatedTdee, goal));
        }

        return '2000'; // Fallback default
    };

    return (
        <ProfileContext.Provider value={{
            ...profile,
            calorieGoal: getEffectiveCalorieGoal(), // Always return effective value
            isLoaded,
            updateProfile
        }}>
            {children}
        </ProfileContext.Provider>
    );
}

export function useProfile() {
    return useContext(ProfileContext);
}