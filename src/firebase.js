import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBIr3vBJt_BA7r6Ex3pk0rULiF9sa5Cw7I",
  authDomain: "psdsm-5c63a.firebaseapp.com",
  projectId: "psdsm-5c63a",
  storageBucket: "psdsm-5c63a.firebasestorage.app",
  messagingSenderId: "250811633936",
  appId: "1:250811633936:web:303a5862a042ebf8cdd595",
  measurementId: "G-1T3HZP0E7J"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use modern persistent local cache (replaces deprecated enableIndexedDbPersistence)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Firestore helper functions
export const addPestReport = (data) =>
  addDoc(collection(db, 'pestReports'), { ...data, createdAt: serverTimestamp() });

export const addRequestForm = (data) =>
  addDoc(collection(db, 'requestForms'), { ...data, createdAt: serverTimestamp() });

export const addSatisfactionSurvey = (data) =>
  addDoc(collection(db, 'satisfactionSurveys'), { ...data, createdAt: serverTimestamp() });

export const getPestReports = () =>
  getDocs(query(collection(db, 'pestReports'), orderBy('createdAt', 'desc')));

// Update helpers
export const updatePestReport     = (id, data) => updateDoc(doc(db, 'pestReports',           id), data);
export const updateRequestForm    = (id, data) => updateDoc(doc(db, 'requestForms',          id), data);
export const updateSatisfactionSurvey = (id, data) => updateDoc(doc(db, 'satisfactionSurveys', id), data);

// Delete helpers
export const deletePestReport         = (id) => deleteDoc(doc(db, 'pestReports',           id));
export const deleteRequestForm        = (id) => deleteDoc(doc(db, 'requestForms',          id));
export const deleteSatisfactionSurvey = (id) => deleteDoc(doc(db, 'satisfactionSurveys',   id));

export { collection, getDocs, query, where, orderBy, serverTimestamp, doc };
