import { useState, useEffect } from 'react';
import { View, TextInput, Text, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

type BudgetItem = {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'outcome';
  currency: string;
  created_at: string;
};

export default function EditBudgetItem() {
  const { id } = useLocalSearchParams();
  const [item, setItem] = useState<BudgetItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

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
    const fetchItem = async () => {
      const { data, error } = await supabase
        .from('budget_items')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        setItem(data);
      }
      setLoading(false);
    };

    fetchItem();
  }, [id]);

  const handleSave = async () => {
    if (!item) return;

    try {
      const { error } = await supabase
        .from('budget_items')
        .update({
          title: item.title,
          amount: item.amount,
          type: item.type,
          currency: item.currency,
        })
        .eq('id', id);

      if (error) {
        console.error('Error saving budget item:', error);
        return;
      }

      // Save currency preference
      await AsyncStorage.setItem('currencyPreference', item.currency);
      router.replace('/(tabs)'); // Navigate back to the budget tab
    } catch (error) {
      console.error('Failed to save budget item:', error);
    }
  };


  const toggleType = () => {
    if (item) {
      setItem({
        ...item,
        type: item.type === 'income' ? 'outcome' : 'income'
      });
    }
  };

  const handleCurrencyChange = async (currencyCode: string) => {
    if (!item) return;

    try {
      // Update the local state immediately
      setItem({
        ...item,
        currency: currencyCode
      });

      // Update in Supabase
      const { error } = await supabase
        .from('budget_items')
        .update({ currency: currencyCode })
        .eq('id', id);

      if (error) {
        console.error('Error updating currency:', error);
        // Revert the change if there's an error
        setItem({
          ...item,
          currency: item.currency
        });
        return;
      }

      // Save the preference
      await AsyncStorage.setItem('currencyPreference', currencyCode);
    } catch (error) {
      console.error('Failed to update currency:', error);
    }
  };

  if (loading) return <Text style={[styles.loadingText, isDark && styles.darkText]}>Loading...</Text>;
  if (!item) return <Text style={[styles.errorText, isDark && styles.darkText]}>Item not found</Text>;

  const currentCurrency = CURRENCIES.find(c => c.code === item.currency) || CURRENCIES[0];

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#333"} />
      </Pressable>

      <TextInput
        value={item.title}
        onChangeText={(text) => setItem({ ...item, title: text })}
        placeholder="Item title"
        placeholderTextColor={isDark ? '#aaa' : '#888'}
        style={[styles.input, isDark && styles.darkInput]}
      />

      <View style={styles.inputContainer}>
        <TextInput
          value={item.amount.toString()}
          onChangeText={(text) => {
            const amount = parseFloat(text) || 0;
            setItem({ ...item, amount });
          }}
          placeholder="Amount"
          placeholderTextColor={isDark ? '#aaa' : '#888'}
          style={[styles.input, isDark && styles.darkInput, { flex: 1 }]}
          keyboardType="numeric"
        />
        <Pressable 
          onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
          style={[styles.currencyButton, isDark && styles.darkInput]}
        >
          <Text style={[styles.currencyText, isDark && styles.darkText]}>
            {currentCurrency.symbol} {/* Display the symbol */}
          </Text>
          <Feather 
            name={showCurrencyPicker ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={isDark ? "#aaa" : "#666"} 
          />
        </Pressable>
      </View>

      {showCurrencyPicker && (
        <View style={[styles.currencyPicker, isDark && styles.darkInput]}>
          {CURRENCIES.map((curr) => (
          <Pressable
            key={curr.code}
            onPress={() => {
              handleCurrencyChange(curr.code);
              setShowCurrencyPicker(false);
            }}
            style={styles.currencyOption}
          >
              <Text style={[styles.currencyOptionText, isDark && styles.darkText]}>
                {curr.symbol} - {curr.name} ({curr.code})
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <Pressable 
        onPress={toggleType}
        style={[styles.typeToggle, isDark && styles.darkTypeToggle]}
      >
        <Feather 
          name={item.type === 'income' ? "arrow-down-circle" : "arrow-up-circle"} 
          size={24} 
          color={item.type === 'income' ? 
            (isDark ? "#4CAF50" : "#2E7D32") : 
            (isDark ? "#FF5252" : "#C62828")} 
        />
        <Text style={[styles.typeText, isDark && styles.darkText]}>
          {item.type === 'income' ? 'Income' : 'Outcome'}
        </Text>
      </Pressable>

      <Pressable 
        onPress={handleSave} 
        style={[styles.button, isDark && styles.darkButton]}
      >
        <Text style={styles.buttonText}>Save Changes</Text>
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
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    backgroundColor: '#fff',
    color: '#000',
    borderRadius: 8,
    fontSize: 16,
    height: 50,
  },
  darkInput: {
    borderColor: '#555',
    backgroundColor: '#333',
    color: '#fff',
  },
  currencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    minWidth: 80,
  },
  currencyText: {
    fontSize: 16,
    color: '#000',
  },
  currencyPicker: {
    position: 'absolute',
    top: 130,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    zIndex: 100,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    maxHeight: 200,
  },
  currencyOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  currencyOptionText: {
    fontSize: 16,
    color: '#000',
  },
  typeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 20,
    backgroundColor: '#eaeaea',
    borderRadius: 8,
  },
  darkTypeToggle: {
    backgroundColor: '#333',
  },
  typeText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#000',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  darkButton: {
    backgroundColor: '#1E88E5',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingText: {
    flex: 1,
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  darkText: {
    color: '#fff',
  },
  errorText: {
    flex: 1,
    textAlign: 'center',
    marginTop: 20,
    color: 'red',
    fontSize: 16,
  },
  backButton: {
    marginBottom: 20,
    padding: 8,
    alignSelf: 'flex-start',
  },
});
