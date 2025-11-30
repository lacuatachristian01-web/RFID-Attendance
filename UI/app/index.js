import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Alert,
} from "react-native";
import { router } from 'expo-router';
import styles from "./styles";

const API_BASE_URL = "http://13.214.102.163:8000"; // Replace with your backend URL

export default function RegisterScreen() {
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [uid, setUid] = useState("");
  const [courseYear, setCourseYear] = useState("");
  const [serverOnline, setServerOnline] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [showEventSelector, setShowEventSelector] = useState(false);
  const [eventsLoaded, setEventsLoaded] = useState(false);

  // ✅ Check server connectivity
  const checkServerStatus = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${API_BASE_URL}/`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      setServerOnline(response.ok);
    } catch (error) {
      console.log("Server check failed:", error.message);
      setServerOnline(false);
    }
  };

  // ✅ Fetch active event and events list
  const fetchActiveEvent = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/active-event`);
      if (response.ok) {
        const data = await response.json();
        setActiveEvent(data.active_event);
      }
    } catch (error) {
      console.error("Error fetching active event:", error);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/events`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  // ✅ Check server status on mount and every 30 seconds
  useEffect(() => {
    checkServerStatus();
    fetchActiveEvent();
    fetchEvents();
    const interval = setInterval(() => {
      checkServerStatus();
      fetchActiveEvent();
    }, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // ✅ Validation
  const validateInputs = () => {
    if (!studentId || !name.trim() || !uid.trim() || !courseYear.trim()) {
      Alert.alert("Please fill the registration form.");
      return false;
    }

    const idPattern = /^\d{3}-\d{4}$/;
    const uidPattern = /^[A-Fa-f0-9]{8}$/; // 8-character hex UID

    if (!idPattern.test(studentId)) {
      Alert.alert("Invalid ID format", "Example: 123-4567");
      return false;
    }

    if (!uidPattern.test(uid.trim())) {
      Alert.alert("Invalid UID format", "UID should be 8 hexadecimal characters (e.g. 56EEC2B8)");
      return false;
    }
    return true;
  };

  // ✅ Register student
  const handleRegister = async () => {
    if (!validateInputs()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId.trim(),
          rfid_id: uid.trim().toUpperCase(),
          name: name.trim(),
          course_year: courseYear,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("✅ Success", "Student registered successfully!");
        setStudentId("");
        setName("");
        setUid("");
        setCourseYear("");
      } else {
        Alert.alert("Registration Failed", data.detail || "An error occurred.");
      }
    } catch (error) {
      console.error("Error registering student:", error);
      Alert.alert("Error", "Could not connect to the server.");
    }
  };

  // ✅ Handle setting active event
  const handleSetActiveEvent = async (eventId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/active-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ event_id: eventId }),
      });

      if (response.ok) {
        const data = await response.json();
        setActiveEvent(data.active_event);
        setShowEventSelector(false);
        Alert.alert("Success", `Event "${data.active_event.event_name}" is now active for scanning!`);
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.detail || "Failed to set active event");
      }
    } catch (error) {
      console.error("Error setting active event:", error);
      Alert.alert("Error", "Could not set active event.");
    }
  };

  // ✅ Handle clearing active event
  const handleClearActiveEvent = async () => {
    Alert.alert(
      "Clear Active Event",
      "Are you sure you want to clear the active event? RFID scans will require explicit event_id.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/active-event`, {
                method: 'DELETE',
              });

              if (response.ok) {
                setActiveEvent(null);
                Alert.alert("Success", "Active event cleared.");
              } else {
                Alert.alert("Error", "Failed to clear active event");
              }
            } catch (error) {
              console.error("Error clearing active event:", error);
              Alert.alert("Error", "Could not clear active event.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.container, { padding: 0 }]}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <Text style={styles.title}>📘 Student Registration</Text>

            {/* Server Status Indicator */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 20,
              padding: 10,
              backgroundColor: serverOnline === null ? '#FFF3CD' : serverOnline ? '#D4EDDA' : '#F8D7DA',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: serverOnline === null ? '#FFEAA7' : serverOnline ? '#C3E6CB' : '#F5C6CB'
            }}>
              <Text style={{
                fontSize: 18,
                marginRight: 8
              }}>
                {serverOnline === null ? '⏳' : serverOnline ? '🟢' : '🔴'}
              </Text>
              <Text style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: serverOnline === null ? '#856404' : serverOnline ? '#155724' : '#721C24'
              }}>
                {serverOnline === null ? 'Checking server...' : serverOnline ? 'Server Online' : 'Server Offline'}
              </Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Student ID (e.g. 231-1234)"
              value={studentId}
              onChangeText={setStudentId}
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              placeholder="Full Names"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              placeholder="RFID UID (e.g. 56EEC2B8)"
              value={uid}
              onChangeText={setUid}
              autoCapitalize="characters"
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              placeholder="Course and Section (e.g. BSCS 3B)"
              value={courseYear}
              onChangeText={setCourseYear}
              autoCapitalize="characters"
              placeholderTextColor="#999"
            />

            <TouchableOpacity style={styles.button} onPress={handleRegister}>
              <Text style={styles.buttonText}>Register</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#2196F3", marginTop: 10 }]}
              onPress={() => router.push('/view-students')}
            >
              <Text style={styles.buttonText}>View Registered Students</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#FF9800", marginTop: 10 }]}
              onPress={() => router.push('/events')}
            >
              <Text style={styles.buttonText}>Events</Text>
            </TouchableOpacity>

            {/* Active Event Section */}
            <View style={styles.activeEventSection}>
              <Text style={styles.sectionTitle}>🎯 Active Event for Scanning</Text>
              <View style={styles.activeEventDisplay}>
                {activeEvent ? (
                  <View style={styles.activeEventInfo}>
                    <Text style={styles.activeEventName}>{activeEvent.event_name}</Text>
                    <Text style={styles.activeEventDate}>
                      {new Date(activeEvent.event_date).toLocaleDateString()}
                    </Text>
                    <Text style={styles.activeEventStatus}>🟢 Active - All RFID scans go here</Text>
                  </View>
                ) : (
                  <View style={styles.activeEventInfo}>
                    <Text style={styles.noActiveEvent}>⚠️ No Active Event</Text>
                    <Text style={styles.activeEventStatus}>🔴 RFID scans require explicit event_id</Text>
                  </View>
                )}

                <View style={styles.activeEventActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: "#4CAF50" }]}
                    onPress={() => {
                      fetchEvents(); // Refresh events list
                      setShowEventSelector(!showEventSelector);
                    }}
                  >
                    <Text style={styles.actionButtonText}>
                      {activeEvent ? "Change Event" : "Set Active Event"}
                    </Text>
                  </TouchableOpacity>

                  {activeEvent && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: "#ff5252" }]}
                      onPress={handleClearActiveEvent}
                    >
                      <Text style={styles.actionButtonText}>Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {showEventSelector && (
                <View style={styles.eventSelector}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={styles.selectorTitle}>Select Event to Activate:</Text>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: "#2196F3", paddingHorizontal: 12, paddingVertical: 6 }]}
                      onPress={fetchEvents}
                    >
                      <Text style={[styles.actionButtonText, { fontSize: 12 }]}>Refresh</Text>
                    </TouchableOpacity>
                  </View>
                  {events.length > 0 ? (
                    <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={true}>
                      {[...events].sort((a, b) => b.event_id - a.event_id).map((event) => (
                        <TouchableOpacity
                          key={event.event_id}
                          style={[
                            styles.eventOption,
                            activeEvent && activeEvent.event_id === event.event_id && styles.activeEventOption
                          ]}
                          onPress={() => handleSetActiveEvent(event.event_id)}
                        >
                          <Text style={styles.eventOptionName}>{event.event_name}</Text>
                          <Text style={styles.eventOptionDate}>
                            {new Date(event.event_date).toLocaleDateString()}
                          </Text>
                          {activeEvent && activeEvent.event_id === event.event_id && (
                            <Text style={styles.currentActiveText}>✓ Current Active</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : (
                    <Text style={styles.noEventsText}>No events available. Create an event first.</Text>
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}
