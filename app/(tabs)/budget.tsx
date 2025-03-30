import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, SectionList } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

type BudgetItem = {
  id: string;
  title: string;
  amount: number;
  created_at: string;
  type: 'income' | 'outcome';
  currency: string;
};

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  INR: '₹',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  CNY: '¥',
  SEK: 'kr',
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

export default function BudgetScreen() {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [isDark, setIsDark] = useState(false);
  const [userCurrency, setUserCurrency] = useState('USD');
  const router = useRouter();

  // Load preferences and data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [themePref, currencyPref] = await Promise.all([
          AsyncStorage.getItem('themePreference'),
          AsyncStorage.getItem('currencyPreference')
        ]);

        if (themePref) setIsDark(themePref === 'dark');
        if (currencyPref) setUserCurrency(currencyPref);

        fetchBudgetItems();
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  const fetchBudgetItems = async () => {
    const { data, error } = await supabase
      .from('budget_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching items:', error);
    } else {
      setItems(data || []);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    await AsyncStorage.setItem('themePreference', newTheme ? 'dark' : 'light');
  };

  const updateCurrency = async (currency: string) => {
    setUserCurrency(currency);
    await AsyncStorage.setItem('currencyPreference', currency);
    fetchBudgetItems();
  };

  const toggleItemType = async (id: string, currentType: 'income' | 'outcome') => {
    const { error } = await supabase
      .from('budget_items')
      .update({ type: currentType === 'income' ? 'outcome' : 'income' })
      .eq('id', id);

    if (!error) fetchBudgetItems();
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase
      .from('budget_items')
      .delete()
      .eq('id', id);

    if (!error) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  // Prepare sections
  const incomeItems = items.filter(item => item.type === 'income');
  const outcomeItems = items.filter(item => item.type === 'outcome');

  const sections = [
    { title: 'Income', data: incomeItems },
    { title: 'Outcome', data: outcomeItems }
  ];

  // Styles
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#f8f9fa',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      paddingTop: 50,
      backgroundColor: isDark ? '#1E1E1E' : 'white',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#eee',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#fff' : '#333',
    },
    headerControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    themeButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#333' : '#f0f0f0',
    },
    currencySelector: {
      position: 'absolute',
      top: 60,
      right: 16,
      backgroundColor: isDark ? '#2D2D2D' : 'white',
      borderRadius: 8,
      padding: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      zIndex: 10,
    },
    currencyOption: {
      padding: 8,
      borderRadius: 4,
    },
    selectedCurrency: {
      backgroundColor: isDark ? '#1E88E5' : '#007AFF',
    },
    currencyOptionText: {
      color: isDark ? '#fff' : '#333',
    },
    listContent: {
      paddingBottom: 20,
    },
    sectionHeader: {
      padding: 10,
      paddingLeft: 16,
      fontSize: 18,
      fontWeight: 'bold',
      backgroundColor: isDark ? '#252525' : '#eaeaea',
      color: isDark ? '#fff' : '#333',
    },
    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 8,
      backgroundColor: isDark ? '#2D2D2D' : 'white',
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    itemContent: {
      flex: 1,
    },
    itemText: {
      fontSize: 16,
      color: isDark ? '#fff' : '#333',
    },
    amountText: {
      fontSize: 14,
      marginTop: 4,
    },
    incomeText: {
      color: isDark ? '#4CAF50' : '#2E7D32',
    },
    outcomeText: {
      color: isDark ? '#FF5252' : '#C62828',
    },
    currencySymbol: {
      fontSize: 14,
      marginLeft: 4,
      fontWeight: '600',
    },
    addButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
      margin: 16,
      backgroundColor: isDark ? '#1E88E5' : '#007AFF',
      borderRadius: 8,
      shadowColor: '#007AFF',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    addButtonText: {
      marginLeft: 8,
      color: 'white',
      fontWeight: '600',
      fontSize: 16,
    },
  });

  const renderItem = ({ item }: { item: BudgetItem }) => (
    <View style={styles.itemContainer}>
      <Pressable onPress={() => toggleItemType(item.id, item.type)}>
        <Feather 
          name={item.type === 'income' ? "arrow-down-circle" : "arrow-up-circle"} 
          size={24} 
          color={item.type === 'income' ? (isDark ? "#4CAF50" : "#2E7D32") : (isDark ? "#FF5252" : "#C62828")} 
        />
      </Pressable>
      <View style={styles.itemContent}>
        <Text style={styles.itemText}>{item.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
          <Text style={[styles.amountText, item.type === 'income' ? styles.incomeText : styles.outcomeText]}>
            {item.type === 'income' ? '+' : '-'}{item.amount.toFixed(2)}
          </Text>
          <Text style={[styles.currencySymbol, item.type === 'income' ? styles.incomeText : styles.outcomeText]}>
            {currencySymbols[item.currency] || currencySymbols[userCurrency]}
          </Text>
        </View>
        <Text style={{ color: isDark ? '#aaa' : '#666', fontSize: 12, marginTop: 4 }}>
          {formatDateTime(item.created_at)}
        </Text>
      </View>
      <Pressable onPress={() => deleteItem(item.id)}>
        <Feather name="trash-2" size={20} color={isDark ? "#ff6b6b" : "#ff4444"} />
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Budget</Text>
        <View style={styles.headerControls}>
          <Pressable onPress={toggleTheme} style={styles.themeButton}>
            <MaterialIcons 
              name={isDark ? "wb-sunny" : "nights-stay"} 
              size={22} 
              color={isDark ? "#FFD700" : "#333"} 
            />
          </Pressable>
          <View style={styles.currencySelector}>
            {Object.keys(currencySymbols).map(currency => (
              <Pressable
                key={currency}
                style={[
                  styles.currencyOption,
                  userCurrency === currency && styles.selectedCurrency
                ]}
                onPress={() => updateCurrency(currency)}
              >
                <Text style={styles.currencyOptionText}>
                  {currency} ({currencySymbols[currency]})
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        contentContainerStyle={styles.listContent}
      />

      <Pressable 
        style={styles.addButton}
        onPress={() => router.push({
          pathname: "/(tabs)/add-budget",
          params: { 
            presentation: 'modal',
            currency: userCurrency 
          }
        })}
      >
        <Feather name="plus" size={20} color="white" />
        <Text style={styles.addButtonText}>Add Item</Text>
      </Pressable>
    </View>
  );
}