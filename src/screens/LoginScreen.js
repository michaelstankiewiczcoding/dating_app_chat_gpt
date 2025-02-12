import React, { useState, useEffect } from "react";
import { View, TextInput, Button, Alert } from "react-native";
import messaging from "@react-native-firebase/messaging";
import { loginUser } from "../services/api";

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fcmToken, setFcmToken] = useState("");

    useEffect(() => {
        const getToken = async () => {
            const token = await messaging().getToken();
            setFcmToken(token);
        };
        getToken();
    }, []);

    const handleLogin = async () => {
        try {
            const response = await loginUser(email, password, fcmToken);
            Alert.alert("Success", "Login Successful");
            navigation.navigate("Home");
        } catch (error) {
            Alert.alert("Error", "Invalid credentials");
        }
    };

    return (
        <View style={{ padding: 20 }}>
            <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={{ borderWidth: 1, marginBottom: 10 }} />
            <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={{ borderWidth: 1, marginBottom: 10 }} />
            <Button title="Login" onPress={handleLogin} />
        </View>
    );
};

export default LoginScreen;