I will optimize the recording engine in `LiveCopilot.tsx` to reduce file size by switching from WAV to WebM/AAC and add a safety mechanism to prevent data loss.

### 1. Upgrade Recording Engine (WAV -> WebM/AAC)
*   **Remove Legacy Encoding**: Delete manual WAV encoding functions (`encodeWAV`, `floatTo16BitPCM`) and the memory-intensive `pcmDataRef`.
*   **Implement MediaRecorder**:
    *   Initialize `MediaRecorder` alongside the existing `ScriptProcessor` (which will be kept strictly for the real-time AI stream).
    *   **Smart Format Selection**: Automatically detect browser support:
        *   Chrome/Edge: `audio/webm;codecs=opus`
        *   Safari: `audio/mp4;codecs=mp4a.40.2` (AAC)
    *   **Optimization**: Set bitrate to `64kbps` for clear voice capture with minimal file size.
*   **File Generation**: Update `saveAudioFile` to generate the correct Blob type based on the recording format.

### 2. Add Data Safety Interception
*   **State Tracking**: Add `hasDownloaded` state to track if the user has saved the file.
*   **Interception Logic**: Modify the "Save & Analyze" button to check `hasDownloaded`.
    *   If downloaded: Proceed to analysis immediately.
    *   If not downloaded: Block navigation and show the safety dialog.

### 3. Implement Safety Dialog UI
*   Create a Modal/Dialog component (matching the existing Slate/Dark theme) with three distinct actions:
    *   **Download & Continue**: Saves the file locally, then proceeds to analysis.
    *   **Continue without Saving**: Proceeds to analysis (risking data loss if page refreshes).
    *   **Cancel**: Closes dialog, stays on current page.

### 4. Verification
*   Verify recording starts/stops correctly.
*   Verify file download has correct extension (.webm or .mp4) and is significantly smaller.
*   Verify "Save & Analyze" triggers the warning if not downloaded.
*   Verify all dialog options work as expected.
