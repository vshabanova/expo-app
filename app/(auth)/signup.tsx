import { useState } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const validatePassword = (password: string) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10}$/;
    return passwordRegex.test(password);
  };

  const handleSignup = async () => {
    if (!validatePassword(password)) {
      setPasswordError('Password must be 10 characters long, with at least one uppercase letter, one lowercase letter, one number, and one special character.');
      return;
    }

    setPasswordError(''); // Reset password error message

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setPasswordError(error.message);
    } else {
      router.replace('/(auth)/login');
    }
    setLoading(false);
  };

  const handleLoginRedirect = () => {
    router.push('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>WhatToDo? Sign Up</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
        placeholderTextColor="#999"
      />
      <TextInput
        placeholder="Password (min 10 characters)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        placeholderTextColor="#999"
      />
      {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
      
      <Pressable 
        onPress={handleSignup} 
        disabled={loading}
        style={({ pressed }) => [
          styles.signupButton,
          pressed && styles.buttonPressed,
          loading && styles.buttonDisabled
        ]}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </Pressable>

      <View style={styles.separator}>
        <View style={styles.line} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.line} />
      </View>

      <Pressable 
        onPress={handleLoginRedirect}
        style={({ pressed }) => [
          styles.loginButton,
          pressed && styles.buttonPressed
        ]}
      >
        <Text style={[styles.buttonText, { padding: 15, borderRadius: 8,
                                                    alignItems: 'center',
                                                    borderWidth: 1,
                                                    borderColor: '#007AFF',
                                                    color: '#007AFF',    
                     marginTop: 10, }]}>Already have an account? Login</Text>                      
        </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  input: {
    marginBottom: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    fontSize: 16,
  },
  signupButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#fff',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  orText: {
    marginHorizontal: 10,
    color: '#999',
    fontWeight: '600',
  },
  title: {
    fontSize: 32, 
    fontWeight: 'bold',
    color: '#333', 
    textAlign: 'center', 
    marginBottom: 40,
    letterSpacing: 1.5,
  },
});