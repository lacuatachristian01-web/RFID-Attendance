import React, { useState, useEffect, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import styles from "./styles";

const API_BASE_URL = "http://13.214.102.163:8000"; // Replace with your backend URL

export default function ViewStudentsScreen() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [displayedStudents, setDisplayedStudents] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const ITEMS_PER_PAGE = 20; // Load 20 students at a time

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/students`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStudents(data);
    } catch (e) {
      console.error("Error fetching students:", e);
      setError("Failed to load students. Please try again later.");
      Alert.alert("Error", "Failed to load students. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // Initialize displayed students when data loads
  useEffect(() => {
    if (students.length > 0) {
      const initialLoad = students.slice(0, ITEMS_PER_PAGE);
      setDisplayedStudents(initialLoad);
      setHasMoreData(students.length > ITEMS_PER_PAGE);
    } else {
      setDisplayedStudents([]);
      setHasMoreData(false);
    }
  }, [students]);

  // Update displayed students when search term changes
  useEffect(() => {
    const filtered = students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const initialLoad = filtered.slice(0, ITEMS_PER_PAGE);
    setDisplayedStudents(initialLoad);
    setHasMoreData(filtered.length > ITEMS_PER_PAGE);
  }, [searchTerm, students]);

  useFocusEffect(
    useCallback(() => {
      fetchStudents();
    }, [])
  );

  // Pull to refresh function
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStudents();
    setRefreshing(false);
  };

  // Load more students (infinite scroll)
  const loadMoreStudents = () => {
    if (loadingMore || !hasMoreData) return;

    setLoadingMore(true);

    // Simulate API delay for better UX
    setTimeout(() => {
      const filtered = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
      );

      const currentLength = displayedStudents.length;
      const nextBatch = filtered.slice(currentLength, currentLength + ITEMS_PER_PAGE);

      if (nextBatch.length > 0) {
        setDisplayedStudents(prev => [...prev, ...nextBatch]);
        setHasMoreData(currentLength + nextBatch.length < filtered.length);
      } else {
        setHasMoreData(false);
      }

      setLoadingMore(false);
    }, 500);
  };

  const handleUnregister = async (student) => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Enter Password',
        'Please enter the administrator password to unregister this student:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unregister',
            onPress: (password) => {
              if (password === '12345678') {
                confirmUnregister(student);
              } else {
                Alert.alert('Error', 'Incorrect password.');
              }
            }
          }
        ],
        'secure-text'
      );
    } else {
      // For Android and other platforms, use a regular alert first
      Alert.alert(
        'Enter Password',
        'Please enter the administrator password to unregister this student:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enter Password',
            onPress: () => {
              // Since Alert.prompt is iOS only, we'll use a simple confirmation for now
              Alert.alert(
                'Confirm Unregister',
                `Are you sure you want to unregister ${student.name}?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Unregister',
                    style: 'destructive',
                    onPress: () => confirmUnregister(student)
                  }
                ]
              );
            }
          }
        ]
      );
    }
  };

  const confirmUnregister = async (student) => {
    try {
      const response = await fetch(`${API_BASE_URL}/students/${student.student_id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        Alert.alert('Success', `${student.name} has been unregistered successfully.`);
        fetchStudents(); // Refresh the list
      } else {
        const data = await response.json();
        Alert.alert('Error', data.detail || 'Failed to unregister student.');
      }
    } catch (error) {
      console.error('Error unregistering student:', error);
      Alert.alert('Error', 'Could not connect to the server. Please check your connection.');
    }
  };

  // Filter students based on search term (search by name or student ID)
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <View style={styles.tableRow}>
      <TouchableOpacity
        style={{ flex: 6, flexDirection: 'row', alignItems: 'center' }}
        onPress={() => router.push({ pathname: '/student-attendance', params: { student: JSON.stringify(item) } })}
      >
        <Text style={[styles.tableCell, { flex: 1.5 }]}>{item.student_id}</Text>
        <Text style={[styles.tableCell, { flex: 2.5 }]}>{item.name}</Text>
        <Text style={[styles.tableCell, { flex: 1.5 }]}>{item.course_year}</Text>
      </TouchableOpacity>
      <View style={[styles.tableCell, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
        <TouchableOpacity
          style={{ padding: 8 }}
          onPress={() => handleUnregister(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#dc3545" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ textAlign: "center", marginTop: 10 }}>Loading students...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ textAlign: "center", color: "red", marginTop: 20 }}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.listTitle}>📋 Registered Students</Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingHorizontal: 10 }}>
        <Ionicons name="search" size={20} color="#666" style={{ marginRight: 10 }} />
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
          placeholder="Search by name or student ID..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Student ID</Text>
        <Text style={[styles.tableHeaderText, { flex: 2.5 }]}>Name</Text>
        <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Course & Year</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}></Text>
      </View>

      <FlatList
        data={displayedStudents}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007bff']}
            tintColor="#007bff"
          />
        }
        onEndReached={loadMoreStudents}
        onEndReachedThreshold={0.1}
        ListFooterComponent={
          loadingMore ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#007bff" />
              <Text style={{ marginTop: 10, color: '#666' }}>Loading more students...</Text>
            </View>
          ) : hasMoreData ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#666' }}>Scroll down to load more</Text>
            </View>
          ) : displayedStudents.length > 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#666' }}>No more students to load</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            {searchTerm ? "No students found matching your search." : "No students registered yet."}
          </Text>
        }
      />
    </SafeAreaView>
  );
}
