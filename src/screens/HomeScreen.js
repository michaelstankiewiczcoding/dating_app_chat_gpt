import React, { useState, useEffect } from "react";
import { View, Text, Button } from "react-native";
import Swiper from "react-native-deck-swiper";
import { swipeUser, getUserProfile } from "../services/api";

const HomeScreen = ({ navigation }) => {
  const [profiles, setProfiles] = useState([]);
  const token = "YOUR_AUTH_TOKEN"; // Replace with stored token

  useEffect(() => {
    const fetchProfiles = async () => {
      const response = await getUserProfile(token);
      setProfiles(response.data);
    };
    fetchProfiles();
  }, []);

  const handleSwipe = async (index, action) => {
    await swipeUser(token, profiles[index].id, action);
  };

  return (
    <View style={{ flex: 1 }}>
      {profiles.length > 0 ? (
        <Swiper
          cards={profiles}
          renderCard={(profile) => (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff", borderRadius: 10 }}>
              <Text>{profile.name}, {profile.age}</Text>
            </View>
          )}
          onSwipedRight={(index) => handleSwipe(index, "liked")}
          onSwipedLeft={(index) => handleSwipe(index, "disliked")}
        />
      ) : (
        <Text>No profiles available</Text>
      )}
      <Button title="Go to Chat" onPress={() => navigation.navigate("Chat")} />
    </View>
  );
};

export default HomeScreen;