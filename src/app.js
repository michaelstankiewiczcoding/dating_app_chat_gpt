import React, { useEffect } from "react";
import messaging from "@react-native-firebase/messaging";
import { Alert } from "react-native";

const App = () => {
    useEffect(() => {
        const requestPermission = async () => {
            const authStatus = await messaging().requestPermission();
            if (authStatus === messaging.AuthorizationStatus.AUTHORIZED) {
                console.log("Notification permission granted.");
            } else {
                console.log("Notification permission denied.");
            }
        };

        requestPermission();

        const unsubscribe = messaging().onMessage(async (remoteMessage) => {
            Alert.alert(remoteMessage.notification.title, remoteMessage.notification.body);
        });

        return unsubscribe;
    }, []);

    return <YourNavigationComponent />;
};

export default App;