// Supabase configuration
const supabaseConfig = {
    url: 'https://ebwcyrfagheqvsmrfzlm.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVid2N5cmZhZ2hlcXZzbXJmemxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NDkzNDksImV4cCI6MjA1OTMyNTM0OX0.XfTcvEB7U199Fz2Q_clQRGDii0ypM6RIWiRkuf6x_gU',
    storageBucket: 'media' // The bucket name in Supabase Storage
};

// Initialize Supabase client
const supabase = window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey);

// Function to upload image to Supabase Storage
export async function uploadImageToSupabase(file, userId, messageId) {
    try {
        // Create a unique file path using timestamp to avoid conflicts
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop();
        
        // Set path to public folder to avoid RLS issues
        // Using 'public' directory which typically has less restrictive RLS policies
        const filePath = `public/${userId}_${messageId}_${timestamp}.${fileExt}`;
        
        console.log('Attempting to upload to path:', filePath);
        
        // Upload the file with improved parameters
        const { data, error } = await supabase
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
        const { data: { publicUrl } } = supabase
            .storage
            .from(supabaseConfig.storageBucket)
            .getPublicUrl(filePath);
            
        console.log('Public URL generated:', publicUrl);
        return publicUrl;
    } catch (error) {
        console.error('Error uploading to Supabase:', error);
        // If Supabase fails, we could add a fallback method here
        throw error;
    }
}

// Function to get the public URL of an image from Supabase Storage
export function getImageUrl(filePath) {
    try {
        // Get the public URL for the specified file path
        const { data: { publicUrl } } = supabase
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