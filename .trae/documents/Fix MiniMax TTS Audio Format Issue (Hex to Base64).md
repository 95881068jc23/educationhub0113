I will fix the audio playback issue by correctly handling the Hex string format returned by the MiniMax TTS API.

**Root Cause:**
The MiniMax TTS API (v2) returns audio data as a **Hexadecimal string**, but the current backend and frontend code treat it as a **Base64 string**. When the frontend attempts to decode this Hex string using `atob` (which expects Base64), it results in corrupted binary data, causing the `NotSupportedError` in the browser's audio player.

**Implementation Plan:**

1.  **Modify Backend (`api/minimax-tts.ts`)**:
    *   Add detection logic to check if the returned audio data is a Hex string (matches `^[0-9a-fA-F]+$`).
    *   If it is a Hex string, convert it to a valid Base64 string using `Buffer.from(hex, 'hex').toString('base64')`.
    *   This ensures the frontend always receives a standard Base64 string, matching its expectation.

2.  **Verify Frontend (`src/apps/lesson-generator/components/LessonView.tsx`)**:
    *   The existing `atob` -> `Blob` logic in the frontend is correct for Base64 data. Once the backend sends valid Base64, this code will work as intended. No major changes needed here, but I will ensure error logging is robust.

This backend-side conversion is the most reliable fix as it standardizes the data format before it reaches the client.