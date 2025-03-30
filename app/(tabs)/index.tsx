import { useState, useEffect } from 'react';

import { View, Text, Pressable, StyleSheet, SectionList} from 'react-native';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Task = {
  id: string;
  title: string;
  created_at: string;
  completed: boolean;
  deadline?: string;
  category?: string;
};
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
  created_at: string;
  type: 'income' | 'outcome';
  currency: string;
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

const getDaysRemaining = (deadline: string) => {
  const now = new Date();
  const dueDate = new Date(deadline);
  const diffTime = dueDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default function TaskList() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'budget'>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [isDark, setIsDark] = useState(false);
  const router = useRouter();


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

  useEffect(() => {
    if (activeTab === 'tasks') {
      fetchTasks();
    } else {
      fetchBudgetItems();
    }
  }, [activeTab]);

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    try {
      await AsyncStorage.setItem('themePreference', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme preference', error);
    }
  };

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
    } else {
      setTasks(data || []);
    }
  };

  const fetchBudgetItems = async () => {
    const { data, error } = await supabase
      .from('budget_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching budget items:', error);
    else setBudgetItems(data || []);
  };

  const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
    const { error } = await supabase
      .from('tasks')
      .update({ completed: !completed })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
    } else {
      fetchTasks();
    }
  };

  const toggleBudgetItemType = async (id: string, currentType: 'income' | 'outcome') => {
    const { error } = await supabase
      .from('budget_items')
      .update({ type: currentType === 'income' ? 'outcome' : 'income' })
      .eq('id', id);

    if (error) {
      console.error('Error updating budget item:', error);
    } else {
      fetchBudgetItems();
    }
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
    } else {
      setTasks(prev => prev.filter(task => task.id !== taskId));
    }
  };

  const deleteBudgetItem = async (id: string) => {
    const { error } = await supabase
      .from('budget_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting budget item:', error);
    } else {
      setBudgetItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const navigateToEdit = (id: string, type: 'task' | 'budget') => {
    router.push({
      pathname: `/(tabs)/${type === 'task' ? '' : 'edit-budget'}/${id}`,
      params: { theme: isDark ? 'dark' : 'light' }
    });
  };

  const ongoingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  const taskSections = [
    { 
      title: 'Urgent', 
      data: ongoingTasks.filter(task => 
        task.deadline && getDaysRemaining(task.deadline) <= 3
      ) 
    },
    { 
      title: 'Ongoing', 
      data: ongoingTasks.filter(task => 
        !task.deadline || getDaysRemaining(task.deadline) > 3
      ) 
    },
    { 
      title: 'Done', 
      data: completedTasks 
    }
  ];

  const incomeItems = budgetItems.filter(item => item.type === 'income');
  const outcomeItems = budgetItems.filter(item => item.type === 'outcome');

  const budgetSections = [
    { title: 'Income', data: incomeItems },
    { title: 'Outcome', data: outcomeItems }
  ];

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
    signOutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
      borderRadius: 8,
      backgroundColor: '#ffebee',
    },
    signOutText: {
      marginLeft: 6,
      color: '#ff4444',
      fontWeight: '500',
    },
    buttonPressed: {
      opacity: 0.8,
      transform: [{ scale: 0.96 }],
    },
    content: {
      flex: 1,
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
    taskItem: {
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
    urgentTaskItem: {
      borderLeftWidth: 4,
      borderLeftColor: isDark ? '#F44336' : '#D32F2F',
    },
    budgetItem: {
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
    checkbox: {
      marginRight: 12,
    },
    typeIndicator: {
      marginRight: 12,
    },
    itemContent: {
      flex: 1,
    },
    taskText: {
      fontSize: 18, // Made bigger
      fontWeight: 'bold', // Made bold
      color: isDark ? '#fff' : '#333',
    },
    urgentText: {
      color: isDark ? '#F44336' : '#D32F2F',
    },
    budgetText: {
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
    dateText: {
      fontSize: 12,
      color: isDark ? '#aaa' : '#666',
      marginTop: 4,
    },
    completedTask: {
      textDecorationLine: 'line-through',
      color: isDark ? '#777' : '#999',
    },
    categoryText: {
      fontSize: 14,
      color: isDark ? '#ccc' : '#666',
      marginTop: 4,
    },
    deleteButton: {
      padding: 8,
      marginLeft: 8,
    },
    tabBar: {
      flexDirection: 'row',
      height: 60,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#333' : '#e0e0e0',
      backgroundColor: isDark ? '#1E1E1E' : '#f8f9fa',
    },
    tabItem: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    activeTab: {
      borderTopWidth: 2,
      borderTopColor: isDark ? '#1E88E5' : '#007AFF',
    },
    tabText: {
      fontSize: 12,
      color: isDark ? '#aaa' : '#8e8e93',
      marginTop: 4,
    },
    activeTabText: {
      color: isDark ? '#1E88E5' : '#007AFF',
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

  const renderTaskItem = ({ item }: { item: Task }) => {
    const isUrgent = item.deadline && getDaysRemaining(item.deadline) <= 3 && !item.completed;

    return (
      <View style={[
        styles.taskItem,
        isUrgent && styles.urgentTaskItem
      ]}>
        <Pressable 
          onPress={() => toggleTaskCompletion(item.id, item.completed)}
          style={styles.checkbox}
        >
          <Feather 
            name={item.completed ? "check-square" : "square"} 
            size={24} 
            color={item.completed ? "#4CAF50" : (isDark ? "#aaa" : "#666")} 
          />
        </Pressable>
        <Pressable 
          onPress={() => navigateToEdit(item.id, 'task')}
          style={styles.itemContent}
        >
          <Text style={[
            styles.taskText,
            item.completed && styles.completedTask,
            isUrgent && styles.urgentText
          ]}>
            {item.title}
          </Text>
          {item.deadline && (
            <Text style={[
              styles.dateText,
              isUrgent && styles.urgentText
            ]}>
              Due: {formatDateTime(item.deadline)} ({getDaysRemaining(item.deadline)} days left)
            </Text>
          )}
          {item.category && (
            <Text style={styles.categoryText}>
              {item.category}
            </Text>
          )}
          <Text style={styles.dateText}>
            Created: {formatDateTime(item.created_at)}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => deleteTask(item.id)}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.buttonPressed
          ]}
        >
          <Feather
            name="trash-2"
            size={20}
            color={isDark ? "#ff6b6b" : "#ff4444"}
          />
        </Pressable>
      </View>
    );
  };

  const renderBudgetItem = ({ item }: { item: BudgetItem }) => {
    // Find the currency symbol based on the currency code
    const currencySymbol = CURRENCIES.find(c => c.code === item.currency)?.symbol || item.currency;

    return (
      <View style={styles.budgetItem}>
        <Pressable 
          onPress={() => toggleBudgetItemType(item.id, item.type)}
          style={styles.typeIndicator}
        >
          <Feather 
            name={item.type === 'income' ? "arrow-down-circle" : "arrow-up-circle"} 
            size={24} 
            color={item.type === 'income' ? 
              (isDark ? "#4CAF50" : "#2E7D32") : 
              (isDark ? "#FF5252" : "#C62828")} 
          />
        </Pressable>
        <Pressable 
          onPress={() => navigateToEdit(item.id, 'budget')}
          style={styles.itemContent}
        >
          <Text style={styles.budgetText}>
            {item.title}
          </Text>
          <Text style={[
            styles.amountText,
            item.type === 'income' ? styles.incomeText : styles.outcomeText
          ]}>
            {item.type === 'income' ? '+' : '-'}{currencySymbol}{item.amount.toFixed(2)}
          </Text>
          <Text style={styles.dateText}>
            {formatDateTime(item.created_at)}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => deleteBudgetItem(item.id)}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.buttonPressed
          ]}
        >
          <Feather
            name="trash-2"
            size={20}
            color={isDark ? "#ff6b6b" : "#ff4444"}
          />
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {activeTab === 'tasks' ? 'My Tasks' : 'Budget'}
        </Text>
        <View style={styles.headerControls}>
          <Pressable
            onPress={toggleTheme}
            style={({ pressed }) => [
              styles.themeButton,
              pressed && styles.buttonPressed
            ]}
          >
            <MaterialIcons 
              name={isDark ? "wb-sunny" : "nights-stay"} 
              size={22} 
              color={isDark ? "#FFD700" : "#333"} 
            />
          </Pressable>
          <Pressable
            onPress={async () => {
              await supabase.auth.signOut();
              router.replace('/login');
            }}
            style={({ pressed }) => [
              styles.signOutButton,
              pressed && styles.buttonPressed
            ]}
          >
            <Ionicons name="exit-outline" size={20} color="#ff4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
        {activeTab === 'tasks' ? (
          <SectionList
            sections={taskSections}
            keyExtractor={(item) => item.id}
            renderItem={renderTaskItem}
            renderSectionHeader={({ section: { title } }) => (
              <Text style={styles.sectionHeader}>{title}</Text>
            )}
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled={false}
          />
        ) : (
          <SectionList
            sections={budgetSections}
            keyExtractor={(item) => item.id}
            renderItem={renderBudgetItem}
            renderSectionHeader={({ section: { title } }) => (
              <Text style={styles.sectionHeader}>{title}</Text>
            )}
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled={false}
          />
        )}
      </View>

      <Link href={activeTab === 'tasks' ? "/(tabs)/add" : "/(tabs)/add-budget"} asChild>
        <Pressable style={styles.addButton}>
          <Feather name="plus" size={20} color="white" />
          <Text style={styles.addButtonText}>
            {activeTab === 'tasks' ? 'Add Task' : 'Add Budget Item'}
          </Text>
        </Pressable>
      </Link>

      <View style={styles.tabBar}>
        <Pressable 
          style={[styles.tabItem, activeTab === 'tasks' && styles.activeTab]}
          onPress={() => setActiveTab('tasks')}
        >
          <Feather 
            name="check-square" 
            size={24} 
            color={activeTab === 'tasks' ? 
              (isDark ? '#1E88E5' : '#007AFF') : 
              (isDark ? '#aaa' : '#8e8e93')} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'tasks' && styles.activeTabText
          ]}>
            Tasks
          </Text>
        </Pressable>

        <Pressable 
          style={[styles.tabItem, activeTab === 'budget' && styles.activeTab]}
          onPress={() => setActiveTab('budget')}
        >
          <Feather 
            name="dollar-sign" 
            size={24} 
            color={activeTab === 'budget' ? 
              (isDark ? '#1E88E5' : '#007AFF') : 
              (isDark ? '#aaa' : '#8e8e93')} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'budget' && styles.activeTabText
          ]}>
            Budget
          </Text>
        </Pressable>
      </View>
    </View>
  );
}