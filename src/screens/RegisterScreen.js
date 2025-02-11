import React, { useState } from "react";
import { View, TextInput, Button, Alert } from "react-native";
import { registerUser } from "../services/api";

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      await registerUser(email, password);
      Alert.alert("Success", "User Registered");
      navigation.navigate("Login");
    } catch (error) {
      Alert.alert("Error", "Registration Failed");
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={{ borderWidth: 1, marginBottom: 10 }} />
      <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={{ borderWidth: 1, marginBottom: 10 }} />
      <Button title="Register" onPress={handleRegister} />
    </View>
  );
};

export default RegisterScreen;