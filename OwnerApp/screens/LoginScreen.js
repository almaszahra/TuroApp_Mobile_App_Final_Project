import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('almas@owner.com');
  const [password, setPassword] = useState('password123');
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
      console.error('Login error:', error.message);
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      {/* Account Type Selection */}
      <View style={styles.accountTypeContainer}>
        <Text style={styles.accountTypeLabel}>Select Account Type:</Text>
        <View style={styles.radioContainer}>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setAccountType('owner')}
          >
            <View style={styles.radioButton}>
              {accountType === 'owner' && <View style={styles.radioButtonSelected} />}
            </View>
            <Text style={styles.radioText}>Owner</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setAccountType('renter')}
          >
            <View style={styles.radioButton}>
              {accountType === 'renter' && <View style={styles.radioButtonSelected} />}
            </View>
            <Text style={styles.radioText}>Renter</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Email- example@gmail.com"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button
        title={loading ? 'Logging in...' : 'Login'}
        onPress={handleLogin}
        disabled={loading}
      />

      <Text style={styles.testNote}>
        Note: For testing, you can use almas@owner.com / password123
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  accountTypeContainer: {
    marginBottom: 20,
  },
  accountTypeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2a9d8f',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioButtonSelected: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#2a9d8f',
  },
  radioText: {
    fontSize: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  testNote: {
    marginTop: 20,
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
});