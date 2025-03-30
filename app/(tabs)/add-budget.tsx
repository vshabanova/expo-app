import { useState, useEffect } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';

// Supported currencies with symbols
const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
];

export default function AddBudgetScreen() {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'outcome'>('income');
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  // Load theme and currency preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        // Load theme
        const savedTheme = await AsyncStorage.getItem('themePreference');
        if (savedTheme) setIsDark(savedTheme === 'dark');

        // Load currency preference
        const savedCurrency = await AsyncStorage.getItem('currencyPreference');
        if (savedCurrency) {
          const preferredCurrency = CURRENCIES.find(c => c.code === savedCurrency);
          if (preferredCurrency) setCurrency(preferredCurrency);
        }
      } catch (error) {
        console.error('Failed to load preferences', error);
      }
    };
    loadPreferences();
  }, []);

  const handleCurrencyChange = (currencyCode: string) => {
    const selectedCurrency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
    setCurrency(selectedCurrency);
    setShowCurrencyPicker(false);
    // Save preference for future use
    AsyncStorage.setItem('currencyPreference', currencyCode);
  };

  const handleAddBudgetItem = async () => {
    setError('');

    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (!amount || isNaN(Number(amount))) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    const { error: supabaseError } = await supabase
      .from('budget_items')
      .insert({ 
        title,
        amount: parseFloat(amount),
        type,
        currency: currency.code,
        user_id: user.id
      });

    if (supabaseError) {
      setError(supabaseError.message);
    } else {
      setTitle('');
      setAmount('');
      router.replace('/(tabs)'); // Navigate back to budget tab
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
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#333',
      marginLeft: 15,
    },
    inputContainer: {
      flexDirection: 'row',
      marginBottom: 10,
      height: 50,
      alignItems: 'center',
    },
    input: {
      height: 50,
      flex: 1,
      borderWidth: 1,
      borderColor: isDark ? '#555' : '#ddd',
      padding: 15,
      backgroundColor: isDark ? '#333' : '#fff',
      color: isDark ? '#fff' : '#000',
      borderRadius: 8,
      fontSize: 16,
    },
    currencyButton: {
      height: 50,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      marginLeft: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#555' : '#ddd',
      backgroundColor: isDark ? '#333' : '#fff',
    },
    currencyText: {
      marginLeft: 5,
      color: isDark ? '#fff' : '#000',
      fontSize: 16,
    },
    currencyPicker: {
      position: 'absolute',
      top: 60,
      right: 20,
      backgroundColor: isDark ? '#333' : '#fff',
      borderRadius: 8,
      padding: 10,
      zIndex: 100,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      maxHeight: 300,
    },
    currencyOption: {
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#555' : '#eee',
    },
    currencyOptionText: {
      color: isDark ? '#fff' : '#000',
    },
    typeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
      gap: 10,
    },
    typeButton: {
      flex: 1,
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: isDark ? '#444' : '#ddd',
    },
    incomeButton: {
      backgroundColor: type === 'income' ? (isDark ? '#1B5E20' : '#C8E6C9') : 'transparent',
      borderColor: type === 'income' ? (isDark ? '#4CAF50' : '#2E7D32') : (isDark ? '#444' : '#ddd'),
    },
    outcomeButton: {
      backgroundColor: type === 'outcome' ? (isDark ? '#B71C1C' : '#FFCDD2') : 'transparent',
      borderColor: type === 'outcome' ? (isDark ? '#F44336' : '#C62828') : (isDark ? '#444' : '#ddd'),
    },
    typeButtonText: {
      fontWeight: '600',
    },
    incomeButtonText: {
      color: type === 'income' ? (isDark ? '#fff' : '#1B5E20') : (isDark ? '#aaa' : '#666'),
    },
    outcomeButtonText: {
      color: type === 'outcome' ? (isDark ? '#fff' : '#C62828') : (isDark ? '#aaa' : '#666'),
    },
    button: {
      backgroundColor: isDark ? '#1E88E5' : '#007AFF',
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 16,
    },
    themeButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: isDark ? '#333' : '#f0f0f0',
    },
    backButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: isDark ? '#333' : '#f0f0f0',
    },
    errorText: {
      color: isDark ? '#F44336' : '#D32F2F',
      marginBottom: 10,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#333"} />
          </Pressable>
          <Text style={styles.headerTitle}>Add Budget Item</Text>
        </View>
        <Pressable onPress={() => setIsDark(!isDark)} style={styles.themeButton}>
          <MaterialIcons 
            name={isDark ? "wb-sunny" : "nights-stay"} 
            size={24} 
            color={isDark ? "#FFD700" : "#333"} 
          />
        </Pressable>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Item title"
          placeholderTextColor={isDark ? '#aaa' : '#888'}
          value={title}
          onChangeText={setTitle}
          style={styles.input}
          autoFocus
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Amount"
          placeholderTextColor={isDark ? '#aaa' : '#888'}
          value={amount}
          onChangeText={setAmount}
          style={styles.input}
          keyboardType="numeric"
        />
        <Pressable 
          onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
          style={styles.currencyButton}
        >
          <Text style={styles.currencyText}>{currency.code}</Text>
          <Feather 
            name={showCurrencyPicker ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={isDark ? "#aaa" : "#666"} 
          />
        </Pressable>
      </View>

      {showCurrencyPicker && (
        <View style={styles.currencyPicker}>
          {CURRENCIES.map((curr) => (
            <Pressable
              key={curr.code}
              onPress={() => handleCurrencyChange(curr.code)}
              style={styles.currencyOption}
            >
              <Text style={styles.currencyOptionText}>
                {curr.code} - {curr.name} ({curr.symbol})
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.typeContainer}>
        <Pressable
          onPress={() => setType('income')}
          style={[styles.typeButton, styles.incomeButton]}
        >
          <Feather 
            name="arrow-down-circle" 
            size={20} 
            color={type === 'income' ? (isDark ? '#fff' : '#2E7D32') : (isDark ? '#aaa' : '#666')} 
          />
          <Text style={[styles.typeButtonText, styles.incomeButtonText]}>
            Income
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setType('outcome')}
          style={[styles.typeButton, styles.outcomeButton]}
        >
          <Feather 
            name="arrow-up-circle" 
            size={20} 
            color={type === 'outcome' ? (isDark ? '#fff' : '#C62828') : (isDark ? '#aaa' : '#666')} 
          />
          <Text style={[styles.typeButtonText, styles.outcomeButtonText]}>
            Outcome
          </Text>
        </Pressable>
      </View>

      <Pressable
        onPress={handleAddBudgetItem}
        style={[styles.button, loading && styles.buttonDisabled]}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Adding..." : "Add Budget Item"}
        </Text>
      </Pressable>
    </View>
  );
}