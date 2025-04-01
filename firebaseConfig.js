import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyCDbsOpgAQOHpo4XPQfA1S6zU5XJZsJmiA',

  authDomain: 'tarefas-f4889.firebaseapp.com',

  databaseURL: 'https://tarefas-f4889-default-rtdb.firebaseio.com',

  projectId: 'tarefas-f4889',

  storageBucket: 'tarefas-f4889.firebasestorage.app',

  messagingSenderId: '61134688811',

  appId: '1:61134688811:web:97d5bc539c376f41cd106e',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
