# Code Citations

## License: unknown
https://github.com/Mandragoro/webrtc-ipcamera/tree/a541b54502bc898b77fe11ceef877c702cca3d6f/README.md

```
javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.
```

