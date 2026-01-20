
import express, { Request, Response } from 'express';
import multer from 'multer';
import cors from 'cors';
import { uploadChunk, mergeChunks, createAudioRecord, updateAudioStatus } from './services/storageService';
import { processAudioWithGemini } from './services/geminiService';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// 1. Upload Chunk
app.post('/api/express/audio/upload-chunk', upload.single('chunk'), async (req: Request, res: Response): Promise<any> => {
    try {
        const { uploadId, partNumber } = req.body;
        const file = req.file;

        if (!file || !uploadId || !partNumber) {
            return res.status(400).json({ error: 'Missing chunk, uploadId, or partNumber' });
        }

        // Upload to Supabase Storage (Temp)
        await uploadChunk(uploadId, Number(partNumber), file.buffer);

        return res.json({ success: true, message: 'Chunk uploaded' });
    } catch (error: any) {
        console.error('Upload Chunk Error:', error);
        return res.status(500).json({ error: error.message });
    }
});

// 2. Merge & Process
app.post('/api/express/audio/merge', async (req: Request, res: Response): Promise<any> => {
    try {
        const { uploadId, totalParts, fileName, fileType, userId } = req.body;

        if (!uploadId || !totalParts || !fileName || !userId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 1. Create DB Record (Status: Uploading)
        const record = await createAudioRecord(userId, fileName, '', 0);
        
        // 2. Merge Chunks
        const finalPath = `audio_files/${userId}/${Date.now()}_${fileName}`;
        const mimeType = fileType || 'audio/mp3';
        
        // This might take a few seconds
        const publicUrl = await mergeChunks(uploadId, Number(totalParts), finalPath, mimeType);

        // 3. Update Record with URL
        await updateAudioStatus(record.id, 'queued');

        // 4. Trigger Gemini Async
        // Note: On Vercel Serverless, background tasks may be killed when response is sent.
        // We attempt to start it. ideally use a queue or ensure execution finishes.
        // For <100MB, upload + merge + inference might exceed 10s (Hobby limit).
        // Recommendation: Use Vercel Pro (60s+) or deploy to a container.
        
        processAudioWithGemini(record.id, publicUrl, mimeType).catch(err => 
            console.error("Async Processing Error:", err)
        );

        return res.json({ 
            success: true, 
            recordId: record.id, 
            message: 'Merge complete, processing started',
            fileUrl: publicUrl
        });

    } catch (error: any) {
        console.error('Merge Error:', error);
        return res.status(500).json({ error: error.message });
    }
});

// 3. Check Status
app.get('/api/express/audio/status/:recordId', async (req: Request, res: Response) => {
    // Client should query Supabase directly for status updates via realtime or polling
    // But we provide a helper endpoint if needed
    // For now, return a placeholder or implement Supabase fetch
    // Since frontend uses Supabase client, it's better to query DB directly.
    return res.json({ message: 'Please query Supabase audio_records table for status' });
});

// Root Route
app.get('/api/express', (req, res) => {
    res.send('Audio Processing API Running');
});

// Export for Vercel
export default app;
