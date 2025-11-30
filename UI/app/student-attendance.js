import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import styles from "./styles";

const API_BASE_URL = "http://13.214.102.163:8000"; // Replace with your backend URL

export default function StudentAttendanceScreen() {
  const { student: studentParam } = useLocalSearchParams();
  const student = JSON.parse(studentParam);

  const [events, setEvents] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all events
      const eventsResponse = await fetch(`${API_BASE_URL}/events`);
      if (!eventsResponse.ok) {
        throw new Error('Failed to fetch events');
      }
      const eventsData = await eventsResponse.json();

      // Fetch all attendance logs
      const attendanceResponse = await fetch(`${API_BASE_URL}/attendance`);
      if (!attendanceResponse.ok) {
        throw new Error('Failed to fetch attendance logs');
      }
      const attendanceData = await attendanceResponse.json();

      setEvents(eventsData);
      setAttendanceLogs(attendanceData);
    } catch (e) {
      console.error("Error fetching data:", e);
      setError("Failed to load attendance data. Please try again later.");
      Alert.alert("Error", "Failed to load attendance data. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Check if student attended a specific event and get attendance details
  const getAttendanceInfo = (eventId) => {
    const attendance = attendanceLogs.find(log =>
      log.student_id === student.id && log.event_id === eventId
    );
    return attendance ? {
      attended: true,
      timestamp: new Date(attendance.scan_timestamp)
    } : {
      attended: false,
      timestamp: null
    };
  };

  const renderEventItem = ({ item }) => {
    const attendanceInfo = getAttendanceInfo(item.event_id);

    return (
      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, { flex: 1.8 }]}>{item.event_name}</Text>
        <Text style={[styles.tableCell, { flex: 1.2 }]}>
          {new Date(item.event_date).toLocaleDateString()}
        </Text>
        <Text style={[styles.tableCell, { flex: 1 }]}>
          {attendanceInfo.attended ? attendanceInfo.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
        </Text>
        <View style={[styles.tableCell, { flex: 0.8, alignItems: 'center', justifyContent: 'center' }]}>
          {attendanceInfo.attended ? (
            <Ionicons name="checkmark-circle" size={24} color="#28a745" />
          ) : (
            <Text style={{ fontSize: 20, color: '#dc3545', fontWeight: 'bold' }}>✗</Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ textAlign: "center", marginTop: 10 }}>Loading attendance data...</Text>
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
      <Text style={styles.listTitle}>📊 Attendance History</Text>

      <View style={{ backgroundColor: '#f8f9fa', padding: 15, marginBottom: 15, borderRadius: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 5 }}>{student.name}</Text>
        <Text style={{ fontSize: 16, color: '#666' }}>Student ID: {student.student_id}</Text>
        <Text style={{ fontSize: 16, color: '#666' }}>Course: {student.course_year}</Text>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { flex: 1.8 }]}>Event Name</Text>
        <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>Date</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Time</Text>
        <Text style={[styles.tableHeaderText, { flex: 0.8 }]}>Attended</Text>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.event_id.toString()}
        renderItem={renderEventItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007bff']}
            tintColor="#007bff"
          />
        }
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            No events found.
          </Text>
        }
      />
    </SafeAreaView>
  );
}
