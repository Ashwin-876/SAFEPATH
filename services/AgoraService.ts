
import AgoraRTC, { IAgoraRTCClient, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";

// TODO: Replace with your actual Agora App ID
const APP_ID = import.meta.env.VITE_AGORA_APP_ID || "";
const CHANNEL_NAME = "emergency-channel";
// Token is optional if testing in "App ID only" mode, otherwise you need a token server.
// For this demo, we assume "App ID only" or user provides a temp token.
const TOKEN = null;

let client: IAgoraRTCClient | null = null;
let localAudioTrack: IMicrophoneAudioTrack | null = null;

export const AgoraService = {

    initialize: () => {
        if (!client) {
            client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        }
        return client;
    },

    startCall: async (onStatusChange: (status: string) => void) => {
        if (!client) AgoraService.initialize();
        if (!client) return;

        try {
            onStatusChange("Connecting to Voice Channel...");

            // Event Listeners for Remote Users
            client.on("user-published", async (user, mediaType) => {
                await client!.subscribe(user, mediaType);
                if (mediaType === "audio") {
                    user.audioTrack?.play();
                    onStatusChange("Caregiver Connected (Voice Active)");
                }
            });

            client.on("user-unpublished", (user) => {
                onStatusChange("Caregiver Disconnected");
            });

            // Join Channel
            // Use a random UID
            await client.join(APP_ID, CHANNEL_NAME, TOKEN, null);

            // Create and Publish Local Audio
            localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            await client.publish([localAudioTrack]);

            onStatusChange("Voice Call Active. Waiting for Caregiver...");
            console.log("Agora Call Started Successfully");

        } catch (error: any) {
            console.error("Agora Error:", error);
            onStatusChange(`Call Failed: ${error.message || "Unknown Error"}`);
        }
    },

    endCall: async () => {
        if (localAudioTrack) {
            localAudioTrack.close();
            localAudioTrack = null;
        }
        if (client) {
            await client.leave();
            client.removeAllListeners();
            // Do not destroy client instance to reuse, or recreate if needed.
        }
        console.log("Agora Call Ended");
    }
};
