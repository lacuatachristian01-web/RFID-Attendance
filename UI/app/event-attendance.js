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
} from "react-native";
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import styles from "./styles";

const API_BASE_URL = "http://13.214.102.163:8000"; // Replace with your backend URL

export default function EventAttendanceScreen() {
  const { eventId, eventName } = useLocalSearchParams();
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAttendance = async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/attendance?event_id=${eventId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAttendanceLogs(data);
    } catch (e) {
      console.error("Error fetching attendance:", e);
      setError("Failed to load attendance. Please try again later.");
      Alert.alert("Error", "Failed to load attendance. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAttendance();
    }, [eventId])
  );

  // Filter attendance logs based on search term (search by name, student ID, or course/year)
  const filteredAttendanceLogs = attendanceLogs.filter(log =>
    log.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.course_year.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, { flex: 1 }]}>{item.student_id}</Text>
      <Text style={[styles.tableCell, { flex: 2 }]}>{item.name}</Text>
      <Text style={[styles.tableCell, { flex: 1.5 }]}>{item.course_year}</Text>
      <View style={[styles.tableCell, { flex: 1.5 }]}>
        <Text>{new Date(item.scan_timestamp).toLocaleString()}</Text>
        {item.duplicate && (
          <Text style={styles.duplicateText}>⚠️ Duplicate</Text>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ textAlign: "center", marginTop: 10 }}>Loading attendance...</Text>
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
      <View style={styles.titleContainer}>
        <Ionicons name="calendar-outline" size={24} color="#4CAF50" />
        <Text style={styles.titleText}>{eventName || "Event Attendance"}</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#007bff", marginBottom: 15 }]}
        onPress={fetchAttendance}
      >
        <Ionicons name="refresh" size={20} color="#fff" />
        <Text style={styles.buttonTextWithIcon}>Refresh</Text>
      </TouchableOpacity>

      <Text style={styles.attendanceCount}>Total Scans: {attendanceLogs.length}</Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingHorizontal: 10 }}>
        <Ionicons name="search" size={20} color="#666" style={{ marginRight: 10 }} />
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
          placeholder="Search by name, ID, or section..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>ID</Text>
        <Text style={[styles.tableHeaderText, { flex: 2 }]}>Name</Text>
        <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Section</Text>
        <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Time</Text>
      </View>

      <FlatList
        data={filteredAttendanceLogs}
        keyExtractor={(item) => item.log_id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="information-circle-outline" size={50} color="#999" />
            <Text style={styles.emptyText}>
              {searchTerm ? "No attendance records found matching your search." : "No attendance recorded for this event yet."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
