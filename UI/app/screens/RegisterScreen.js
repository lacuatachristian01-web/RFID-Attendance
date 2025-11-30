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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import styles from "../styles";

const API_BASE_URL = "http://13.214.102.163:8000"; // Replace with your backend URL



export default function RegisterScreen({ navigation }) {
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [uid, setUid] = useState("");
  const [courseYear, setCourseYear] = useState("");

  // WebSocket connection for RFID UID
  useEffect(() => {
    const ws = new WebSocket('ws://13.214.102.163:8000/ws');

    ws.onopen = () => console.log('✅ WebSocket Connected');

    ws.onmessage = (event) => {
      console.log('📡 Received UID:', event.data);
      setUid(event.data); // ✅ This updates your input box automatically
    };

    ws.onerror = (err) => console.error('❌ WebSocket Error:', err);
    ws.onclose = () => console.log('🔌 WebSocket Closed');

    return () => {
      ws.close();
    };
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
          course_year: courseYear.trim(),
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
        // Handle API errors
        if (response.status === 400) {
          Alert.alert("Registration Failed", data.detail || "This account is already registered.");
        } else {
          Alert.alert("Something went wrong", "Please try again later.");
        }
      }
    } catch (error) {
      console.error("Error registering student:", error);
      Alert.alert("Something went wrong", "Could not connect to the server. Please check your connection.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="position"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.container, { padding: 0 }]}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <Text style={styles.title}>📘 Student Registration</Text>

            <TextInput
              style={styles.input}
              placeholder="Student ID (e.g. 231-1234)"
              value={studentId}
              onChangeText={setStudentId}
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              placeholder="RFID UID (e.g. 56EEC2B8)"
              value={uid}               // <-- controlled by state
              onChangeText={setUid}     // <-- user can still edit manually
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
              onPress={() => navigation.navigate("ViewStudents")}
            >
              <Text style={styles.buttonText}>View Registered Students</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
