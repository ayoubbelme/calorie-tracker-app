import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { useTheme } from './ThemeContext';

export default function CelebrationModal({ visible, achievement, onClose }) {
    const { theme } = useTheme();

    if (!achievement) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.card, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.title, { color: theme.text }]}>
                        🎉 Achievement Unlocked!
                    </Text>
                    <Text style={styles.emoji}>{achievement.icon}</Text>
                    <Text style={[styles.achievementTitle, { color: theme.text }]}>
                        {achievement.title}
                    </Text>
                    <Text style={[styles.achievementDesc, { color: theme.textSecondary }]}>
                        {achievement.description}
                    </Text>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        borderRadius: 32,
        padding: 40,
        alignItems: 'center',
        width: '90%',
        maxWidth: 400,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 20,
        textAlign: 'center',
    },
    emoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    achievementTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 8,
        textAlign: 'center',
    },
    achievementDesc: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
});