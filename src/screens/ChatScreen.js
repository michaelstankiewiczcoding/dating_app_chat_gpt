import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, FlatList } from "react-native";
import { io } from "socket.io-client";
import { getUserProfile } from "../services/api";

const socket = io("http://localhost:5001");

const ChatScreen = ({ route }) => {
    const { receiverId, receiverName } = route.params;
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [userId, setUserId] = useState(null);
    const [typing, setTyping] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const response = await getUserProfile("YOUR_AUTH_TOKEN");
            setUserId(response.data.id);
            socket.emit("userConnected", response.data.id);
        };
        fetchUser();

        socket.on("receiveMessage", (data) => {
            if (data.receiverId === userId) {
                setMessages((prevMessages) => [...prevMessages, data]);
            }
        });

        socket.on("userTyping", (data) => {
            if (data.senderId === receiverId) {
                setTyping(true);
                setTimeout(() => setTyping(false), 1000);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [receiverId, userId]);

    const sendMessage = () => {
        if (message.trim() === "") return;

        const data = { senderId: userId, receiverId, message };
        socket.emit("sendMessage", data);
        setMessages([...messages, data]);
        setMessage("");
    };

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold" }}>Chat with {receiverName}</Text>
            
            <FlatList
                data={messages}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <View style={{ padding: 10, alignSelf: item.senderId === userId ? "flex-end" : "flex-start", backgroundColor: item.senderId === userId ? "#DCF8C6" : "#E5E5EA", margin: 5, borderRadius: 10 }}>
                        <Text>{item.message}</Text>
                    </View>
                )}
            />

            {typing && <Text style={{ fontStyle: "italic" }}>Typing...</Text>}

            <TextInput
                value={message}
                onChangeText={(text) => {
                    setMessage(text);
                    socket.emit("typing", { senderId: userId, receiverId });
                }}
                placeholder="Type a message..."
                style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
            />
            <Button title="Send" onPress={sendMessage} />
        </View>
    );
};

export default ChatScreen;