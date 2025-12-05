import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { decodeData } from './codec.js';

const firebaseConfig = {
  apiKey: "AIzaSyClZuFFFxtiwJar_YLrC8-G4ZSC5kSJJdU",
  authDomain: "group-payment-tracker.firebaseapp.com",
  projectId: "group-payment-tracker",
  storageBucket: "group-payment-tracker.firebasestorage.app",
  messagingSenderId: "208078945785",
  appId: "1:208078945785:web:5164201a43e0bd37c8d128"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Build possible UID variants to allow searching with/without suffixes like '@GPT'
function buildUidVariants(rawUid) {
  if (!rawUid || typeof rawUid !== 'string') return [];

  const input = rawUid.trim();
  if (!input) return [];

  const variants = new Set();

  // Always include exact input
  variants.add(input);

  // Try to extract the base UID token (before '@' if present, otherwise first alphanumeric chunk)
  let base = '';
  const atIndex = input.indexOf('@');
  if (atIndex !== -1) {
    base = input.slice(0, atIndex);
  } else {
    // find alphanumeric tokens of reasonable length (>=6)
    const tokens = input.match(/[A-Za-z0-9]{6,}/g);
    if (tokens && tokens.length > 0) {
      // prefer the longest token (most likely the UID)
      base = tokens.reduce((a, b) => (b.length > a.length ? b : a), tokens[0]);
    }
  }

  if (!base) {
    // fallback: if input contains no clear base, return the raw input only
    return Array.from(variants).filter(Boolean);
  }

  variants.add(base);
  variants.add(base.toLowerCase());
  variants.add(base.toUpperCase());

  // Common suffixes the user mentioned (we generate both with and without '@')
  const suffixes = [
    'gpt',
    'gptracker',
    'gpaymenttracker',
    'grouppaymenttracker',
    'grouppaymentt',
    'grouppt'
  ];

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  for (const s of suffixes) {
    // with @
    variants.add(`${base}@${s}`);
    variants.add(`${base}@${s.toUpperCase()}`);
    variants.add(`${base}@${capitalize(s)}`);

    // without @ (in case user omitted it)
    variants.add(`${base}${s}`);
    variants.add(`${base}${s.toUpperCase()}`);
    variants.add(`${base}${capitalize(s)}`);
  }

  // Also include common forms for bare base with common suffixes appended (lower/upper)
  // Keep original raw input included already

  return Array.from(variants).filter(Boolean);
}

// Search Firestore for documents with matching UID
export async function searchFirestoreByUID(uid) {
  try {
    console.log('Searching for UID:', uid);
    
    const membersRef = collection(db, "members");
    const variants = buildUidVariants(uid);

    let q;
    if (variants.length === 0) {
      console.warn('No UID variants generated for search');
      return null;
    } else if (variants.length === 1) {
      q = query(membersRef, where('uid', '==', variants[0]));
    } else {
      // Use 'in' to match any of the generated variants. Firestore supports up to 10 values.
      q = query(membersRef, where('uid', 'in', variants.slice(0, 10)));
    }

    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      console.log('Found document:', doc.id, data);
      
      // Decode the blob data
      let decodedData = {};
      if (data.blob_data) {
        try {
          decodedData = decodeData(data.blob_data) || {};
          console.log('Decoded data:', decodedData);
        } catch (decodeError) {
          console.error('Error decoding blob data:', decodeError);
        }
      }
      
      return {
        docId: doc.id,
        tabName: data.tabName,
        uid: data.uid,
        user: data.user,
        decodedData: decodedData,
        tabDefaultAmounts: decodedData.tabDefaultAmounts || {}
      };
    } else {
      console.log('No document found with UID:', uid);
      return null;
    }
  } catch (error) {
    console.error('Error searching Firestore:', error);
    throw error;
  }
}

// Subscribe to realtime updates for a document matching the UID.
// onUpdate will be called with the same object returned by searchFirestoreByUID or null.
// Returns an unsubscribe() function.
export function subscribeToFirestoreByUID(uid, onUpdate, onError) {
  try {
    const membersRef = collection(db, "members");
    const variants = buildUidVariants(uid);

    let q;
    if (variants.length === 0) {
      console.warn('No UID variants generated for realtime subscription');
      // create a query that will return nothing by searching for an impossible value
      q = query(membersRef, where('uid', '==', '__NO_UID__'));
    } else if (variants.length === 1) {
      q = query(membersRef, where('uid', '==', variants[0]));
    } else {
      q = query(membersRef, where('uid', 'in', variants.slice(0, 10)));
    }

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      try {
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const data = doc.data();

          // Decode the blob data
          let decodedData = {};
          if (data.blob_data) {
            try {
              decodedData = decodeData(data.blob_data) || {};
            } catch (decodeError) {
              console.error('Error decoding blob data (realtime):', decodeError);
            }
          }

          onUpdate({
            docId: doc.id,
            tabName: data.tabName,
            uid: data.uid,
            user: data.user,
            decodedData: decodedData,
            tabDefaultAmounts: decodedData.tabDefaultAmounts || {}
          });
        } else {
          onUpdate(null);
        }
      } catch (err) {
        console.error('Realtime processing error:', err);
        if (onError) onError(err);
      }
    }, (err) => {
      console.error('Firestore realtime listener error:', err);
      if (onError) onError(err);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Failed to create realtime listener:', error);
    if (onError) onError(error);
    return () => {};
  }
}