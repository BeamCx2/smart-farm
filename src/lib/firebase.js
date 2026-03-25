<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyBaYn459JOBoCX3PGfEUUW9pzuCxXiFCuA",
    authDomain: "smart-farm-c69be.firebaseapp.com",
    databaseURL: "https://smart-farm-c69be-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "smart-farm-c69be",
    storageBucket: "smart-farm-c69be.firebasestorage.app",
    messagingSenderId: "139389413918",
    appId: "1:139389413918:web:46fd439d179bebd051dc0f",
    measurementId: "G-80E67N6X08"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
