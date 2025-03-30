import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function EditBudgetScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'outcome'>('income');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

    const fetchItem = async () => {
      const { data, error } = await supabase
        .from('budget_items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching item:', error);
        setError('Failed to fetch item details');
        setTimeout(() => router.back(), 1500);
      } else if (data) {
        setTitle(data.title);
        setAmount(data.amount.toString());
        setType(data.type);
      }
    };

    fetchItem();
  }, [id]);

  const handleSave = async () => {
    if (!title.trim() || !amount.trim()) {
      setError('Please fill in all fields');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue)) {
      setError('Please enter a valid amount');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setError('');
    setLoading(true);
    const { error: updateError } = await supabase
      .from('budget_items')
      .update({
        title,
        amount: amountValue,
        type
      })
      .eq('id', id);

    setLoading(false);
    if (updateError) {
      console.error('Error updating item:', updateError);
      setError('Failed to update item');
      setTimeout(() => setError(''), 3000);
    } else {
      setSuccess('Changes saved successfully');
      setTimeout(() => router.back(), 1000);
    }
  };

  const toggleType = () => {
    setType(prev => prev === 'income' ? 'outcome' : 'income');
  };

  const handleDelete = async () => {
    setLoading(true);
    const { error: deleteError } = await supabase
      .from('budget_items')
      .delete()
      .eq('id', id);

    setLoading(false);
    if (deleteError) {
      console.error('Error deleting item:', deleteError);
      setError('Failed to delete item');
      setTimeout(() => setError(''), 3000);
    } else {
      setSuccess('Item deleted successfully');
      setTimeout(() => router.back(), 1000);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: isDark ? '#121212' : '#f8f9fa',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: isDark ? '#fff' : '#333',
    },
    backButton: {
      padding: 8,
    },
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 16,
      marginBottom: 8,
      color: isDark ? '#fff' : '#333',
    },
    input: {
      backgroundColor: isDark ? '#2D2D2D' : 'white',
      padding: 12,
      borderRadius: 8,
      fontSize: 16,
      color: isDark ? '#fff' : '#333',
    },
    typeToggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    typeToggleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      backgroundColor: isDark ? '#2D2D2D' : '#eaeaea',
    },
    typeToggleText: {
      marginLeft: 8,
      fontSize: 16,
      color: isDark ? '#fff' : '#333',
    },
    incomeType: {
      color: isDark ? '#4CAF50' : '#2E7D32',
    },
    outcomeType: {
      color: isDark ? '#FF5252' : '#C62828',
    },
    saveButton: {
      backgroundColor: isDark ? '#1E88E5' : '#007AFF',
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 16,
    },
    saveButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    buttonPressed: {
      opacity: 0.8,
      transform: [{ scale: 0.96 }],
    },
    deleteButton: {
      backgroundColor: isDark ? '#333' : '#ffebee',
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 8,
      flexDirection: 'row',
      justifyContent: 'center',
    },
    deleteButtonText: {
      color: isDark ? '#ff6b6b' : '#ff4444',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    messageContainer: {
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
      alignItems: 'center',
    },
    errorMessage: {
      backgroundColor: isDark ? '#ffebee' : '#ffcdd2',
    },
    successMessage: {
      backgroundColor: isDark ? '#e8f5e9' : '#c8e6c9',
    },
    messageText: {
      fontSize: 14,
      fontWeight: '500',
    },
    errorText: {
      color: isDark ? '#c62828' : '#b71c1c',
    },
    successText: {
      color: isDark ? '#2E7D32' : '#1B5E20',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable 
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.buttonPressed
          ]}
        >
          <Feather name="arrow-left" size={24} color={isDark ? '#fff' : '#333'} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Item</Text>
        <View style={{ width: 24 }} /> {/* Spacer for alignment */}
      </View>

      {error ? (
        <View style={[styles.messageContainer, styles.errorMessage]}>
          <Text style={[styles.messageText, styles.errorText]}>{error}</Text>
        </View>
      ) : null}

      {success ? (
        <View style={[styles.messageContainer, styles.successMessage]}>
          <Text style={[styles.messageText, styles.successText]}>{success}</Text>
        </View>
      ) : null}

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter title"
          placeholderTextColor={isDark ? '#aaa' : '#999'}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="Enter amount"
          placeholderTextColor={isDark ? '#aaa' : '#999'}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.typeToggleContainer}>
        <Pressable
          onPress={toggleType}
          style={({ pressed }) => [
            styles.typeToggleButton,
            pressed && styles.buttonPressed
          ]}
        >
          <Feather 
            name={type === 'income' ? "arrow-down-circle" : "arrow-up-circle"} 
            size={24} 
            color={type === 'income' ? 
              (isDark ? "#4CAF50" : "#2E7D32") : 
              (isDark ? "#FF5252" : "#C62828")} 
          />
          <Text style={[
            styles.typeToggleText,
            type === 'income' ? styles.incomeType : styles.outcomeType
          ]}>
            {type === 'income' ? 'Income' : 'Outcome'}
          </Text>
        </Pressable>
      </View>

      <Pressable
        onPress={handleSave}
        disabled={loading}
        style={({ pressed }) => [
          styles.saveButton,
          pressed && styles.buttonPressed,
          loading && { opacity: 0.6 }
        ]}
      >
        <Text style={styles.saveButtonText}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Text>
      </Pressable>

      <Pressable
        onPress={handleDelete}
        disabled={loading}
        style={({ pressed }) => [
          styles.deleteButton,
          pressed && styles.buttonPressed,
          loading && { opacity: 0.6 }
        ]}
      >
        <Feather name="trash-2" size={20} color={isDark ? '#ff6b6b' : '#ff4444'} />
        <Text style={styles.deleteButtonText}>Delete Item</Text>
      </Pressable>
    </View>
  );
}