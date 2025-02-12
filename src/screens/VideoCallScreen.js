import React, { useEffect, useRef, useState } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { RTCPeerConnection, RTCView, mediaDevices, RTCSessionDescription, RTCIceCandidate } from "react-native-webrtc";
import { io } from "socket.io-client";

const socket = io("http://localhost:5002");

const VideoCallScreen = ({ route, navigation }) => {
    const { roomId } = route.params;
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isFrontCamera, setIsFrontCamera] = useState(true);

    const peerConnection = useRef(new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    })).current;

    useEffect(() => {
        startLocalStream();
        socket.emit("joinCall", roomId);

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
        const stream = await mediaDevices.getUserMedia({ 
            video: { facingMode: isFrontCamera ? "user" : "environment" }, 
            audio: true 
        });
        setLocalStream(stream);
        stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
    };

    const toggleMute = () => {
        localStream.getAudioTracks().forEach(track => (track.enabled = !track.enabled));
        setIsMuted(!isMuted);
    };

    const toggleVideo = () => {
        localStream.getVideoTracks().forEach(track => (track.enabled = !track.enabled));
        setIsVideoEnabled(!isVideoEnabled);
    };

    const flipCamera = async () => {
        setIsFrontCamera(!isFrontCamera);
        const newStream = await mediaDevices.getUserMedia({
            video: { facingMode: isFrontCamera ? "environment" : "user" },
            audio: true
        });

        // Replace video track in the peer connection
        const videoTrack = newStream.getVideoTracks()[0];
        const sender = peerConnection.getSenders().find((s) => s.track.kind === "video");
        if (sender) sender.replaceTrack(videoTrack);

        setLocalStream(newStream);
    };

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" }}>
            {localStream && <RTCView streamURL={localStream.toURL()} style={{ width: "100%", height: 300, borderRadius: 10, borderWidth: 2, borderColor: "#fff" }} />}
            {remoteStream && <RTCView streamURL={remoteStream.toURL()} style={{ width: "100%", height: 300, borderRadius: 10, borderWidth: 2, borderColor: "#fff", marginTop: 10 }} />}

            {/* Video Call Controls */}
            <View style={{ flexDirection: "row", marginTop: 20 }}>
                {/* Mute/Unmute Button */}
                <TouchableOpacity onPress={toggleMute} style={{ margin: 10, padding: 10, borderRadius: 50, backgroundColor: isMuted ? "red" : "green" }}>
                    <Text style={{ color: "white", fontWeight: "bold" }}>{isMuted ? "Unmute" : "Mute"}</Text>
                </TouchableOpacity>

                {/* Video On/Off Button */}
                <TouchableOpacity onPress={toggleVideo} style={{ margin: 10, padding: 10, borderRadius: 50, backgroundColor: isVideoEnabled ? "blue" : "gray" }}>
                    <Text style={{ color: "white", fontWeight: "bold" }}>{isVideoEnabled ? "Turn Off Video" : "Turn On Video"}</Text>
                </TouchableOpacity>

                {/* Flip Camera Button */}
                <TouchableOpacity onPress={flipCamera} style={{ margin: 10, padding: 10, borderRadius: 50, backgroundColor: "purple" }}>
                    <Text style={{ color: "white", fontWeight: "bold" }}>Flip Camera</Text>
                </TouchableOpacity>

                {/* End Call Button */}
                <TouchableOpacity onPress={() => socket.disconnect()} style={{ margin: 10, padding: 10, borderRadius: 50, backgroundColor: "black" }}>
                    <Text style={{ color: "white", fontWeight: "bold" }}>End Call</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default VideoCallScreen;