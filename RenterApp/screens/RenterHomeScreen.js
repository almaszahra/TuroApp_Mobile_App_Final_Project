import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';

export default function RenterHomeScreen({ navigation }) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error signing out: ', error);
      Alert.alert('Error', 'Failed to log out');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, Renter!</Text>

      <View style={styles.buttonContainer}>
        <Button
          title="Search Listings"
          onPress={() => navigation.navigate('SearchScreen')}
          color="#2a9d8f"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="My Bookings"
          onPress={() => navigation.navigate('MyBookings')}
          color="#457b9d"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Test Database Connection"
          onPress={() => navigation.navigate('TestDBConnection')}
          color="#888"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Logout"
          onPress={handleLogout}
          color="#d00"
        />
      </View>
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
  buttonContainer: {
    marginBottom: 16,
  },
});
