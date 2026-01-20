
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Optional: Use service role for backend ops if available

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
}

// Use Service Role if available for backend (bypasses RLS), otherwise Anon
const supabase = createClient(supabaseUrl!, serviceRoleKey || supabaseKey!);

const BUCKET_NAME = 'user-files'; // Ensure this bucket exists

export const uploadChunk = async (
  uploadId: string,
  partNumber: number,
  fileBuffer: Buffer
) => {
  const filePath = `temp_chunks/${uploadId}/${partNumber}`;
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, fileBuffer, {
      contentType: 'application/octet-stream',
      upsert: true,
    });

  if (error) throw error;
  return data;
};

export const mergeChunks = async (
  uploadId: string,
  totalParts: number,
  finalPath: string,
  contentType: string
): Promise<string> => {
  // 1. Download all chunks
  const chunks: Buffer[] = [];
  
  // Note: For very large files, this might hit memory limits. 
  // For <100MB on Vercel (1024MB limit), it's acceptable.
  for (let i = 0; i < totalParts; i++) {
    const chunkPath = `temp_chunks/${uploadId}/${i}`;
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(chunkPath);

    if (error) throw error;
    if (data) {
        const buffer = await data.arrayBuffer();
        chunks.push(Buffer.from(buffer));
    }
  }

  // 2. Concatenate
  const finalBuffer = Buffer.concat(chunks);

  // 3. Upload merged file
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(finalPath, finalBuffer, {
      contentType,
      upsert: true,
    });

  if (error) throw error;

  // 4. Cleanup chunks (Async, don't wait)
  cleanupChunks(uploadId, totalParts).catch(console.error);

  // 5. Get Public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(finalPath);

  return urlData.publicUrl;
};

const cleanupChunks = async (uploadId: string, totalParts: number) => {
  const paths = Array.from({ length: totalParts }).map(
    (_, i) => `temp_chunks/${uploadId}/${i}`
  );
  await supabase.storage.from(BUCKET_NAME).remove(paths);
};

export const createAudioRecord = async (
  userId: string,
  fileName: string,
  fileUrl: string,
  fileSize: number
) => {
  const { data, error } = await supabase
    .from('audio_records')
    .insert({
      user_id: userId,
      file_name: fileName,
      file_url: fileUrl,
      file_size: fileSize,
      status: 'uploading', // Initial status
      processed: false
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateAudioStatus = async (
  recordId: string,
  status: string,
  result?: any
) => {
  const updateData: any = { status };
  if (result) {
    updateData.analysis_result = result;
    updateData.processed = true;
  }

  const { error } = await supabase
    .from('audio_records')
    .update(updateData)
    .eq('id', recordId);

  if (error) throw error;
};
