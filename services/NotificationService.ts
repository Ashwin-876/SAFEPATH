import emailjs from '@emailjs/browser';

// EmailJS Configuration
const SERVICE_ID = 'service_mbvlssp';
const TEMPLATE_ID = 'template_361axhg';
const PUBLIC_KEY = 'xPYC4ehQWFbeimnRG'; // Public Key from Account Settings

export interface EmailPayload {
    recipient: string;
    recipientName?: string; // e.g. "Mom"
    userName?: string;      // e.g. "Alice"
    subject: string;
    body: string;
    timestamp: string;
    location: { lat: number; lng: number } | null;
}

export const NotificationService = {
    /**
     * Sends an emergency email using EmailJS.
     */
    sendEmergencyEmail: async (payload: EmailPayload): Promise<boolean> => {
        console.log(" [NotificationService] Preparing to send EmailJS alert...");

        const templateParams = {
            to_email: payload.recipient,
            to_name: payload.recipientName || 'Caregiver',
            from_name: payload.userName || 'SafePath User',
            message: payload.body,
            location_lat: payload.location?.lat.toFixed(6) || 'Unknown',
            location_lng: payload.location?.lng.toFixed(6) || 'Unknown',
            google_maps_link: payload.location
                ? `https://www.google.com/maps?q=${payload.location.lat},${payload.location.lng}`
                : 'N/A',
            timestamp: payload.timestamp,
            subject: payload.subject
        };

        try {
            // Note: In a real scenario, you initialize this once in App.tsx, but here we can do per-call or rely on params
            // emailjs.init(PUBLIC_KEY); 

            const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);

            if (response.status === 200) {
                console.log(" [NotificationService] EmailJS Success:", response.text);
                return true;
            } else {
                console.error(" [NotificationService] EmailJS Unexpected Status:", response.status);
                return false;
            }
        } catch (error) {
            console.error(" [NotificationService] EmailJS FAILED:", error);
            // Fallback to console log for demo purposes if keys are invalid
            console.warn(" [NotificationService] Fallback: Logged alert to console since EmailJS failed (likely invalid keys).");
            return false;
        }
    }
};
