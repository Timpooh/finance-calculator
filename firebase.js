// firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyAiy8scA-djQ8gjGja4ficc0bzGqy6zgBI",
  authDomain: "finance-calculator-8f222.firebaseapp.com",
  projectId: "finance-calculator-8f222",
  storageBucket: "finance-calculator-8f222.appspot.com",
  messagingSenderId: "169620318442",
  appId: "1:169620318442:web:1d720f06127574a235cf93",
  measurementId: "G-BMH021SFKF"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// ใช้ global variable สำหรับ login
const auth = firebase.auth();
