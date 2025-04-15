import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { colors } from '../styles/colors';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('owner1@test.com');
  const [password, setPassword] = useState('owner1@test.com');
  const [accountType, setAccountType] = useState('owner'); // Default to owner since this is the Owner app
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      // Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Login success!'); // Check Expo DevTools console

      // Check if the selected account type matches this app (Owner app)
      if (accountType !== 'owner') {
        Alert.alert(
          'Wrong App',
          'You selected Renter account type. Please use the Renter app instead.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      // Check if user exists in Firestore owners collection
      const ownerDocRef = doc(db, 'owners', user.uid);
      const ownerDoc = await getDoc(ownerDocRef);

      if (!ownerDoc.exists()) {
        // First time login - create owner document
        await setDoc(ownerDocRef, {
          email: user.email,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });
        console.log('Created new owner document');
      } else {
        // Owner exists - update last login time
        await setDoc(ownerDocRef, { lastLogin: serverTimestamp() }, { merge: true });
      }

      // Navigate to home screen
      navigation.navigate('OwnerHome');
    } catch (error) {
      // Handle different Firebase auth error codes with user-friendly messages
      let errorMessage = 'An error occurred during login. Please try again.';

      // Map common Firebase auth errors to user-friendly messages
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-email' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later or reset your password.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }

      // Log error for debugging (only in development)
      if (__DEV__) {
        console.log('Login error code:', error.code);
      }

      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Car Owner Login</Text>
        <Text style={styles.subtitle}>Sign in to manage your car listings</Text>
      </View>

      {/* Account Type Selection */}
      <View style={styles.accountTypeContainer}>
        <Text style={styles.accountTypeLabel}>Select Account Type:</Text>
        <View style={styles.radioContainer}>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setAccountType('owner')}
          >
            <View style={[styles.radioButton, accountType === 'owner' && styles.radioButtonActive]}>
              {accountType === 'owner' && <View style={styles.radioButtonSelected} />}
            </View>
            <Text style={[styles.radioText, accountType === 'owner' && styles.radioTextActive]}>Owner</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setAccountType('renter')}
          >
            <View style={[styles.radioButton, accountType === 'renter' && styles.radioButtonActive]}>
              {accountType === 'renter' && <View style={styles.radioButtonSelected} />}
            </View>
            <Text style={[styles.radioText, accountType === 'renter' && styles.radioTextActive]}>Renter</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.textSecondary}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.loginButtonText}>{loading ? 'Logging in...' : 'Login'}</Text>
      </TouchableOpacity>

      <Text style={styles.testNote}>
        Note: For testing, use owner1@test.com / owner1@test.com
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  headerContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  accountTypeContainer: {
    marginBottom: 24,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  accountTypeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: colors.text,
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  radioButton: {
    height: 22,
    width: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioButtonActive: {
    borderColor: colors.primary,
  },
  radioButtonSelected: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  radioText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  radioTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    fontSize: 16,
    color: colors.text,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: colors.secondary,
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testNote: {
    marginTop: 24,
    textAlign: 'center',
    color: colors.textSecondary,
    fontStyle: 'italic',
    fontSize: 14,
  },
});