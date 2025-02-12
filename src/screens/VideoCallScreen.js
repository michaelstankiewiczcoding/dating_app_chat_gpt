import React, { useEffect, useRef, useState } from "react";
import { View, Button, Text, TouchableOpacity } from "react-native";
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