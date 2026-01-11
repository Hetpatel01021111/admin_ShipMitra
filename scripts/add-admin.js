// Run this script to add admin user to Firestore
// Execute in browser console at https://console.firebase.google.com/project/shipmitra-d250b/firestore

/*
  MANUAL STEPS TO ADD ADMIN:

  1. Go to Firebase Console: https://console.firebase.google.com/project/shipmitra-d250b/firestore
  2. Click "Start collection" or "+ Add Collection"
  3. Collection ID: admins
  4. Click "Next"
  5. Document ID: (auto-generate or use the user's UID)
  6. Add these fields:

     Field Name       | Type    | Value
     ----------------|---------|---------------------------
     email           | string  | het7660@gmail.com
     name            | string  | Het Patel
     role            | string  | super_admin
     createdAt       | timestamp | (current date)
     permissions     | array   | ["orders", "riders", "customers", "analytics", "settings", "reports", "banking", "gst"]

  7. Click "Save"

  That's it! Now het7660@gmail.com can login to the admin panel.
*/

// Alternative: Use Firebase Admin SDK (if running on server)
// const admin = require('firebase-admin');
// admin.firestore().collection('admins').add({
//     email: 'het7660@gmail.com',
//     name: 'Het Patel',
//     role: 'super_admin',
//     createdAt: admin.firestore.FieldValue.serverTimestamp(),
//     permissions: ['orders', 'riders', 'customers', 'analytics', 'settings', 'reports', 'banking', 'gst']
// });
