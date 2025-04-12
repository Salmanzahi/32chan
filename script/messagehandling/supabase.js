
import { supabaseConfig } from "../config/supabaseConfig.js";
// Initialize Supabase client
let supabase = null;
let initializationPromise = null;

// Initialize Supabase client with proper async handling
async function initSupabase() {
    if (supabase) return supabase;
    
    if (!initializationPromise) {
        initializationPromise = new Promise((resolve, reject) => {
            const maxAttempts = 10;
            let attempts = 0;

            const tryInit = () => {
                if (typeof window.supabase !== 'undefined') {
                    const client = window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey);
                    supabase = client;
                    resolve(client);
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(tryInit, 500);
                } else {
                    reject(new Error('Failed to initialize Supabase client after multiple attempts'));
                }
            };

            tryInit();
        });
    }

    return initializationPromise;
}

// Function to upload image to Supabase Storage
export async function uploadImageToSupabase(file, userId, messageId) {
    const client = await initSupabase();
    
    try {
        // Create a unique file path using timestamp to avoid conflicts
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop();
        
        // Set path to public folder to avoid RLS issues
        // Using 'public' directory which typically has less restrictive RLS policies
        const filePath = `public/${userId}_${messageId}_${timestamp}.${fileExt}`;
        
        console.log('Attempting to upload to path:', filePath);
        
        // Upload the file with improved parameters
        const { data, error } = await client
            .storage
            .from(supabaseConfig.storageBucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true, // Allow overwriting if file exists
                contentType: file.type, // Set correct content type
                // Use public access for the upload
                public: true
            });
            
        if (error) {
            console.error('Supabase upload error:', error);
            throw error;
        }
        
        console.log('Upload successful:', data);
        
        // Get the public URL
        const { data: { publicUrl } } = client
            .storage
            .from(supabaseConfig.storageBucket)
            .getPublicUrl(filePath);
            
        console.log('Public URL generated:', publicUrl);
        return publicUrl;
    } catch (error) {
        console.error('Error uploading to Supabase:', error);
        throw error;
    }
}

// Function to get the public URL of an image from Supabase Storage
export async function getImageUrl(filePath) {
    const client = await initSupabase();

    try {
        // Get the public URL for the specified file path
        const { data: { publicUrl } } = client
            .storage
            .from(supabaseConfig.storageBucket)
            .getPublicUrl(filePath);
            
        console.log('Image URL retrieved:', publicUrl);
        return publicUrl;
    } catch (error) {
        console.error('Error getting image URL from Supabase:', error);
        throw error;
    }
}

// Initialize when the module loads
initSupabase().catch(error => {
    console.error('Initial Supabase initialization failed:', error);
});