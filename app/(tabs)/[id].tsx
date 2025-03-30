import { useState, useEffect } from 'react';
import { View, TextInput, Text, Switch, StyleSheet, Pressable} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';


type Task = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  category?: string;
  deadline?: string;
};

export default function EditTask() {
  const { id } = useLocalSearchParams();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const theme = await AsyncStorage.getItem('themePreference');
        if (theme) {
          setIsDark(theme === 'dark');
        }
      } catch (error) {
        console.error('Failed to load theme preference', error);
      }
    };

    loadThemePreference();
  }, []);

  useEffect(() => {
    const fetchTask = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        setTask(data);
        setCategory(data.category || '');
      }
      setLoading(false);
    };

    fetchTask();

    setCategories(['Work', 'Personal', 'Urgent', 'Shopping']);
  }, [id]);

  const handleSave = async () => {
    if (!task) return;

    const { error } = await supabase
      .from('tasks')
      .update({ 
        title: task.title,
        completed: task.completed,
        category,
      })
      .eq('id', id);

    if (!error) router.back();
  };

  if (loading) return <Text style={[styles.loadingText, isDark && styles.darkText]}>Loading...</Text>;
  if (!task) return <Text style={[styles.errorText, isDark && styles.darkText]}>Task not found</Text>;

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#333"} />
      </Pressable>

      <TextInput
        value={task.title}
        onChangeText={(text) => setTask({ ...task, title: text })}
        placeholder="Task title"
        placeholderTextColor={isDark ? '#aaa' : '#888'}
        style={[styles.input, isDark && styles.darkInput]}
      />

      <View style={styles.switchContainer}>
        <Text style={[styles.switchText, isDark && styles.darkText]}>Completed: </Text>
        <Switch
          value={task.completed}
          onValueChange={(value) => setTask({ ...task, completed: value })}
          trackColor={{ false: isDark ? '#555' : '#f0f0f0', true: '#4CAF50' }}
          thumbColor={task.completed ? '#fff' : isDark ? '#aaa' : '#f4f3f4'}
        />
      </View>

      <Text style={[styles.switchText, isDark && styles.darkText]}>Category:</Text>

        <Picker
          selectedValue={category}
          onValueChange={(itemValue) => setCategory(itemValue)}
          style={[styles.picker, isDark && styles.darkInput]}
        >
          {categories.length > 0 ? (
            categories.map((cat, index) => (
              <Picker.Item key={index} label={cat} value={cat} />
            ))
          ) : (
            <Picker.Item label="Loading categories..." value="" />
          )}
        </Picker>



      <Pressable onPress={handleSave} style={[styles.button, isDark && styles.darkButton]}>
        <Text style={styles.buttonText}>Save</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    color: '#000',
    borderRadius: 5,
  },
  darkInput: {
    borderColor: '#555',
    backgroundColor: '#333',
    color: '#fff',
  },
  switchContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20,
  },
  switchText: {
    color: '#000',
    marginRight: 10,
  },
  darkText: {
    color: '#fff',
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  darkButton: {
    backgroundColor: '#1E88E5',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingText: {
    flex: 1,
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: {
    flex: 1,
    textAlign: 'center',
    marginTop: 20,
    color: 'red',
  },
  backButton: {
    marginBottom: 20,
  }
});
