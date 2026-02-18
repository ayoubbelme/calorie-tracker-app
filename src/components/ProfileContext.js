import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileContext = createContext();

const DEFAULT_PROFILE = {
    name: 'User',
    age: '25',
    weight: '75',
    height: '178',
    goal: 'Maintain',
    activity: 'Moderate',
    gender: 'Male',
    calorieGoal: '2500',
};

export function ProfileProvider({ children }) {
    const [name, setName] = useState(DEFAULT_PROFILE.name);
    const [age, setAge] = useState(DEFAULT_PROFILE.age);
    const [weight, setWeight] = useState(DEFAULT_PROFILE.weight);
    const [height, setHeight] = useState(DEFAULT_PROFILE.height);
    const [goal, setGoal] = useState(DEFAULT_PROFILE.goal);
    const [activity, setActivity] = useState(DEFAULT_PROFILE.activity);
    const [gender, setGender] = useState(DEFAULT_PROFILE.gender);
    const [calorieGoal, setCalorieGoal] = useState(DEFAULT_PROFILE.calorieGoal);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from storage on mount
    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const stored = await AsyncStorage.getItem('user_profile');
            if (stored) {
                const parsed = JSON.parse(stored);
                setName(parsed.name || DEFAULT_PROFILE.name);
                setAge(parsed.age || DEFAULT_PROFILE.age);
                setWeight(parsed.weight || DEFAULT_PROFILE.weight);
                setHeight(parsed.height || DEFAULT_PROFILE.height);
                setGoal(parsed.goal || DEFAULT_PROFILE.goal);
                setActivity(parsed.activity || DEFAULT_PROFILE.activity);
                setGender(parsed.gender || DEFAULT_PROFILE.gender);
                setCalorieGoal(parsed.calorieGoal || DEFAULT_PROFILE.calorieGoal);
            }
        } catch (e) {
            console.error('Failed to load profile', e);
        } finally {
            setIsLoaded(true);
        }
    };

    const updateProfile = async (updates) => {
        const newProfile = {
            name: updates.name ?? name,
            age: updates.age ?? age,
            weight: updates.weight ?? weight,
            height: updates.height ?? height,
            goal: updates.goal ?? goal,
            activity: updates.activity ?? activity,
            gender: updates.gender ?? gender,
            calorieGoal: updates.calorieGoal ?? calorieGoal,
        };

        // Update state
        setName(newProfile.name);
        setAge(newProfile.age);
        setWeight(newProfile.weight);
        setHeight(newProfile.height);
        setGoal(newProfile.goal);
        setActivity(newProfile.activity);
        setGender(newProfile.gender);
        setCalorieGoal(newProfile.calorieGoal);

        // Save to storage
        try {
            await AsyncStorage.setItem('user_profile', JSON.stringify(newProfile));
            console.log('Profile saved:', newProfile); // Debug log
        } catch (e) {
            console.error('Failed to save profile', e);
        }
    };

    return (
        <ProfileContext.Provider value={{
            name, age, weight, height, goal, activity, gender, calorieGoal,
            updateProfile,
            isLoaded,
        }}>
            {children}
        </ProfileContext.Provider>
    );
}

export function useProfile() {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error('useProfile must be used within ProfileProvider');
    }
    return context;
}