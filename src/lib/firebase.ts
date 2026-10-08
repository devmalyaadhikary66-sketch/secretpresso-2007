import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, deleteDoc, onSnapshot, getDocFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAuth, signInAnonymously } from 'firebase/auth';
import config from '../../firebase-applet-config.json';
import { MediaItem } from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(config) : getApp();

// Initialize Services
export const db = config.firestoreDatabaseId
  ? getFirestore(app, config.firestoreDatabaseId)
  : getFirestore(app);

export const storage = getStorage(app, `gs://${config.storageBucket}`);
export const auth = getAuth(app);

// Authenticate anonymously so rules with auth succeed
signInAnonymously(auth).catch((err) => {
  console.warn('Anonymous auth failed or not enabled:', err);
});

// Test Firestore connection on boot
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is offline or check configuration.');
    }
  }
}
testFirestoreConnection();

// =========================================================================
// HIGH-CAPACITY PERSISTENT LOCAL INDEXEDDB MEDIA CACHE
// (Prevents quota errors from localStorage and ensures offline resilience)
// =========================================================================
const IDB_NAME = 'secretpresso_media_db';
const IDB_STORE = 'media_store';

function openMediaDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function idbSaveMedia(item: MediaItem): Promise<void> {
  try {
    const db = await openMediaDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(item);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB save failed:', err);
  }
}

export async function idbGetAllMedia(): Promise<MediaItem[]> {
  try {
    const db = await openMediaDB();
    const tx = db.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB load failed:', err);
    return [];
  }
}

export async function idbDeleteMedia(id: string): Promise<void> {
  try {
    const db = await openMediaDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB delete failed:', err);
  }
}

// =========================================================================
// FIREBASE STORAGE UPLOAD & DELETE WITH METADATA SYNC
// =========================================================================
export async function uploadMediaToStorage(
  file: File,
  folder: string = 'media',
  onProgress?: (progressPercent: number) => void
): Promise<{ downloadURL: string; storagePath: string }> {
  const timestamp = Date.now();
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `${folder}/${timestamp}_${cleanName}`;
  const storageRef = ref(storage, storagePath);

  try {
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(Math.round(progress));
        },
        (error) => {
          console.warn('Firebase Storage upload error, using persistent data URL:', error);
          // Fallback to robust Base64 data URL stored in Firestore and IndexedDB
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              downloadURL: reader.result as string,
              storagePath: `local_${timestamp}_${cleanName}`,
            });
          };
          reader.onerror = () => reject(error);
          reader.readAsDataURL(file);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({ downloadURL, storagePath });
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  } catch (error) {
    // If Firebase Storage is temporarily unreachable, create a persistent data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          downloadURL: reader.result as string,
          storagePath: `local_${timestamp}_${cleanName}`,
        });
      };
      reader.onerror = () => reject(error);
      reader.readAsDataURL(file);
    });
  }
}

export async function deleteMediaFromStorage(storagePath: string): Promise<void> {
  if (!storagePath || storagePath.startsWith('local_')) return;
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn('Could not delete file from Firebase Storage:', err);
  }
}

// =========================================================================
// FIRESTORE MEDIA RECORD PERSISTENCE
// =========================================================================
export async function saveMediaRecord(item: MediaItem): Promise<void> {
  // 1. Save to IndexedDB immediately for instant offline guarantee
  await idbSaveMedia(item);

  try {
    const mediaKey = item.id || item.mediaId || `med_${Date.now()}`;
    const docRef = doc(db, 'media', mediaKey);
    await setDoc(docRef, item, { merge: true });
  } catch (err) {
    console.warn('Firestore setDoc failed, cached in IndexedDB:', err);
  }
}

export async function deleteMediaRecord(mediaId: string): Promise<void> {
  // 1. Delete from IndexedDB
  await idbDeleteMedia(mediaId);

  // 2. Delete from Firestore
  try {
    const docRef = doc(db, 'media', mediaId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore deleteDoc failed:', err);
  }
}

export async function fetchAllMediaRecords(): Promise<MediaItem[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'media'));
    const items: MediaItem[] = [];
    querySnapshot.forEach((docSnap) => {
      items.push(docSnap.data() as MediaItem);
    });
    if (items.length > 0) return items;
  } catch (err) {
    console.warn('Firestore fetch media failed, falling back to IndexedDB:', err);
  }

  return await idbGetAllMedia();
}
