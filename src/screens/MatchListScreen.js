import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Button } from "react-native";
import { getUserProfile } from "../services/api";

const MatchListScreen = ({ navigation }) => {
    const [matches, setMatches] = useState([]);
    const token = "YOUR_AUTH_TOKEN"; // Replace with stored token

    useEffect(() => {
        const fetchMatches = async () => {
            const response = await getUserProfile(token);
            setMatches(response.data.matches);
        };
        fetchMatches();
    }, []);

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold" }}>Your Matches</Text>
            <FlatList
                data={matches}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={{ padding: 10, backgroundColor: "#fff", marginVertical: 5, borderRadius: 10 }}>
                        <Text style={{ fontSize: 16 }}>{item.name}</Text>
                        <Button title="Start Video Call" onPress={() => navigation.navigate("VideoCall", { roomId: item.id })} />
                    </View>
                )}
            />
        </View>
    );
};

export default MatchListScreen;