import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#4CAF50" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
        headerBackTitle: "Back",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Student Registration" }} />
      <Stack.Screen name="view-students" options={{ title: "Registered Students" }} />
      <Stack.Screen name="events" options={{ title: "Events" }} />
      <Stack.Screen name="create-event" options={{ title: "Create Event" }} />
      <Stack.Screen name="event-attendance" options={{ title: "Event Attendance" }} />
      <Stack.Screen name="student-attendance" options={{ title: "Student Attendance" }} />
    </Stack>
  );
}
