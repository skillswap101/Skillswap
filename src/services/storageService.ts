import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { auth } from '../firebase';

export interface AvatarUploadResult {
  publicUrl: string;
  storagePath: string;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function uploadAvatar(file: File, userId: string): Promise<AvatarUploadResult> {
  if (!file) {
    throw new Error('No image file selected.');
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Unsupported file format. Please upload JPEG, PNG, WEBP, or GIF.');
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    throw new Error('File size exceeds the 5MB limit.');
  }

  if (!userId) {
    throw new Error('User authentication required for avatar upload.');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `avatar-${Date.now()}.${ext}`;
  const filePath = `${userId}/${fileName}`;

  // Helper to convert file to data URL
  const fileToDataUrl = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

  const configured =
    typeof isSupabaseConfigured === 'function'
      ? isSupabaseConfigured()
      : Boolean(isSupabaseConfigured);

  // 1. If Supabase is unconfigured, return local Data URL directly
  if (!configured) {
    const localDataUrl = await fileToDataUrl(file);
    return {
      publicUrl: localDataUrl,
      storagePath: filePath,
    };
  }

  // 2. Upload file to Supabase Storage bucket 'avatars'
  let publicUrl = '';
  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.warn('[Storage] Direct storage upload warning:', uploadError.message);
      // Attempt backend proxy upload if direct storage failed or bucket permissions require backend
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        const formData = new FormData();
        formData.append('avatar', file);
        const serverRes = await fetch(`/api/users/${userId}/avatar`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        if (serverRes.ok) {
          const resData = await serverRes.json();
          if (resData.avatarUrl) {
            publicUrl = resData.avatarUrl;
          }
        }
      }
      if (!publicUrl) {
        // Fall back to data URL rather than failing
        publicUrl = await fileToDataUrl(file);
      }
    } else if (uploadData) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(uploadData.path || filePath);
      publicUrl = data.publicUrl;
    }
  } catch (err: any) {
    console.warn('[Storage] Supabase storage upload warning:', err?.message || err);
    // Fall back to data URL
    publicUrl = await fileToDataUrl(file);
  }

  if (!publicUrl) {
    throw new Error('Could not obtain public URL for avatar.');
  }

  // 3. Persist avatar URL into public.users table in Supabase
  try {
    const { error: dbError } = await supabase
      .from('users')
      .update({
        avatar: publicUrl,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', userId);

    if (dbError) {
      console.warn('[Storage] Warning updating avatar in users table:', dbError);
    }
  } catch (dbErr: any) {
    console.warn('[Storage] Database connection warning:', dbErr?.message || dbErr);
  }

  return {
    publicUrl,
    storagePath: filePath,
  };
}
