import React, { useState } from "react";
import { View, TextInput, Button, Text, Alert } from "react-native";
import { loginUser } from "../services/api";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const response = await loginUser(email, password);
      Alert.alert("Success", "Login Successful");
      navigation.navigate("Home");
    } catch (error) {
      Alert.alert("Error", "Invalid credentials");
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Email:</Text>
      <TextInput value={email} onChangeText={setEmail} style={{ borderWidth: 1, marginBottom: 10 }} />
      <Text>Password:</Text>
      <TextInput secureTextEntry value={password} onChangeText={setPassword} style={{ borderWidth: 1, marginBottom: 10 }} />
      <Button title="Login" onPress={handleLogin} />
      <Button title="Register" onPress={() => navigation.navigate("Register")} />
    </View>
  );
};

export default LoginScreen;