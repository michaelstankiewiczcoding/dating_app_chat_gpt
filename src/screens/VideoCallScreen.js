import React, { useEffect, useRef, useState } from "react";
import { View, Button, Text } from "react-native";
import { RTCPeerConnection, RTCView, mediaDevices, RTCSessionDescription, RTCIceCandidate } from "react-native-webrtc";
import { io } from "socket.io-client";

const socket = io("http://localhost:5002");

const VideoCallScreen = ({ route }) => {
    const { roomId } = route.params;
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const peerConnection = useRef(new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    })).current;

    useEffect(() => {
        startLocalStream();
        socket.emit("joinCall", roomId);

        socket.on("userJoined", async (peerId) => {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(new RTCSessionDescription(offer));
            socket.emit("offer", { target: peerId, sdp: offer, sender: socket.id });
        });

        socket.on("offer", async (data) => {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(new RTCSessionDescription(answer));
            socket.emit("answer", { target: data.sender, sdp: answer, sender: socket.id });
        });

        socket.on("answer", async (data) => {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
        });

        socket.on("iceCandidate", async (data) => {
            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (e) {
                console.error("Error adding ice candidate", e);
            }
        });

        peerConnection.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("iceCandidate", { target: roomId, candidate: event.candidate, sender: socket.id });
            }
        };

        return () => {
            peerConnection.close();
            socket.disconnect();
        };
    }, []);

    const startLocalStream = async () => {
        const stream = await mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
    };

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            {localStream && <RTCView streamURL={localStream.toURL()} style={{ width: "100%", height: 300 }} />}
            {remoteStream && <RTCView streamURL={remoteStream.toURL()} style={{ width: "100%", height: 300 }} />}
            <Button title="End Call" onPress={() => socket.disconnect()} />
        </View>
    );
};

export default VideoCallScreen;