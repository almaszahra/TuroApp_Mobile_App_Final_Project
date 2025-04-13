// RenterApp/screens/RenterHomeScreen.js
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function RenterHomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, Renter!</Text>

      <View style={styles.buttonContainer}>
        <Button
          title="Search Listings"
          onPress={() => navigation.navigate('SearchListing')}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="My Bookings"
          onPress={() => navigation.navigate('MyBookings')}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Test Database Connection"
          onPress={() => navigation.navigate('TestDBConnection')}
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