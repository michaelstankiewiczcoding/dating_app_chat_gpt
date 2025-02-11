import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
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
                    <TouchableOpacity onPress={() => navigation.navigate("Chat", { receiverId: item.id, receiverName: item.name })}>
                        <View style={{ padding: 10, backgroundColor: "#fff", marginVertical: 5, borderRadius: 10 }}>
                            <Text style={{ fontSize: 16 }}>{item.name}</Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
};

export default MatchListScreen;