// OwnerApp/screens/TestDBConnection.js
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

export default function TestDBConnection({ navigation }) {
  const [testMessages, setTestMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Function to add a test message to Firestore
  const addTestMessage = async () => {
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'test_messages'), {
        message: `Owner app test message at ${new Date().toISOString()}`,
        createdAt: new Date(),
        source: 'owner_app'
      });
      console.log('Document written with ID: ', docRef.id);
      fetchTestMessages(); // Refresh the list after adding
    } catch (error) {
      console.error('Error adding document: ', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch test messages from Firestore
  const fetchTestMessages = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'test_messages'), orderBy('createdAt', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);
      const messages = [];
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      setTestMessages(messages);
      console.log('Fetched messages: ', messages.length);
    } catch (error) {
      console.error('Error fetching documents: ', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages when component mounts
  useEffect(() => {
    fetchTestMessages();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Connection Test</Text>
      
      <View style={styles.buttonRow}>
        <Button 
          title="Add Test Message" 
          onPress={addTestMessage} 
          disabled={loading}
        />
        <Button 
          title="Refresh Messages" 
          onPress={fetchTestMessages} 
          disabled={loading}
        />
      </View>

      <Button
        title="Back to Home"
        onPress={() => navigation.navigate('OwnerHome')}
        style={styles.backButton}
      />

      <Text style={styles.messageHeader}>Recent Messages:</Text>
      <ScrollView style={styles.messageList}>
        {testMessages.map((msg) => (
          <View key={msg.id} style={styles.messageItem}>
            <Text style={styles.messageSource}>{msg.source}</Text>
            <Text>{msg.message}</Text>
          </View>
        ))}
        {testMessages.length === 0 && (
          <Text style={styles.noMessages}>No messages found</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    marginBottom: 16,
  },
  messageHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  messageList: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
  },
  messageItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 8,
  },
  messageSource: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  noMessages: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
  }
});
