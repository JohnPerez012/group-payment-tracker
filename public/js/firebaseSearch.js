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

// Search Firestore for documents with matching UID
export async function searchFirestoreByUID(uid) {
  try {
    console.log('Searching for UID:', uid);
    
    const membersRef = collection(db, "members");
    const q = query(membersRef, where("uid", "==", uid));
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
    const q = query(membersRef, where("uid", "==", uid));

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