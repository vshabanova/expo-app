import { useState, useEffect } from 'react';
import { View, TextInput, Pressable, Text, Alert, StyleSheet, Switch } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

export default function AddTaskScreen() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(''); // Default to empty, meaning no category selected
  const [optional, setOptional] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themePreference');
        if (savedTheme) {
          setIsDark(savedTheme === 'dark');
        }
      } catch (error) {
        console.error('Failed to load theme preference', error);
      }
    };
    loadThemePreference();
  }, []);

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    try {
      await AsyncStorage.setItem('themePreference', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme preference', error);
    }
  };

  const handleAddTask = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Task title cannot be empty');
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert('Error', 'Not authenticated');
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('tasks')
      .insert({ 
        title,
        category: category || null, // Use null if category is empty
        optional,
        deadline,
        user_id: user.id
      });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setTitle('');
      setCategory(''); // Reset category to empty after task is added
      setOptional(false);
      setDeadline('');
      router.back();
    }
    setLoading(false);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: isDark ? '#121212' : '#f8f9fa',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#333',
    },
    input: {
      borderWidth: 1,
      borderColor: isDark ? '#555' : '#ddd',
      padding: 15,
      marginBottom: 20,
      backgroundColor: isDark ? '#333' : '#fff',
      color: isDark ? '#fff' : '#000',
      borderRadius: 8,
      fontSize: 16,
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    button: {
      backgroundColor: isDark ? '#1E88E5' : '#007AFF',
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
    },
    buttonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 16,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    themeButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: isDark ? '#333' : '#f0f0f0',
    },
    backButton: {
      padding: 10,
      borderRadius: 20,
      backgroundColor: isDark ? '#333' : '#f0f0f0',
    },
    picker: {
      borderWidth: 1,
        borderColor: isDark ? '#555' : '#ddd',
        padding: 15,
        marginBottom: 20,
        backgroundColor: isDark ? '#333' : '#fff',
        color: isDark ? '#999' : '#aaa',
        borderRadius: 8,
        fontSize: 16,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#333"} />
        </Pressable>
        <Text style={styles.headerTitle}>Add New Task</Text>
        <Pressable onPress={toggleTheme} style={styles.themeButton}>
          <MaterialIcons 
            name={isDark ? "wb-sunny" : "nights-stay"} 
            size={24} 
            color={isDark ? "#FFD700" : "#333"} 
          />
        </Pressable>
      </View>

      <TextInput
        placeholder="Enter task title..."
        placeholderTextColor={isDark ? '#aaa' : '#888'}
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        autoFocus
      />

      <Text style={{ color: isDark ? '#fff' : '#333' , margin:10}}>Category (Optional):</Text>
      <Picker
        selectedValue={category}
        onValueChange={(itemValue) => setCategory(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="None" value="" />
        <Picker.Item label="Work" value="Work" />
        <Picker.Item label="Personal" value="Personal" />
        <Picker.Item label="Health" value="Health" />
        <Picker.Item label="Other" value="Other" />
      </Picker>

      {/* Deadline Input */}
      <Text style={{ color: isDark ? '#fff' : '#333' ,margin:10}}>Deadline:</Text>
      <TextInput
        placeholder="YYYY-MM-DD"
        placeholderTextColor={isDark ? '#aaa' : '#888'}
        value={deadline}
        onChangeText={setDeadline}
        style={styles.input}
      />

      <Pressable
        onPress={handleAddTask}
        style={[styles.button, loading && styles.buttonDisabled]}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Adding Task..." : "Add Task"}
        </Text>
      </Pressable>
    </View>
  );
}
