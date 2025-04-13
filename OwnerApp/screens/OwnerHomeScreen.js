// OwnerApp/screens/OwnerHomeScreen.js
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function OwnerHomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, Owner!</Text>

      <View style={styles.buttonContainer}>
        <Button
          title="Create New Listing"
          onPress={() => navigation.navigate('CreateListing')}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="View My Listings"
          onPress={() => navigation.navigate('MyListings')}
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