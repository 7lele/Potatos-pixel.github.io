// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCuuaQT8y89R6zsq7yunl3_NDTuc1kARKA",
    authDomain: "potato-s.firebaseapp.com",
    databaseURL: "https://potato-s-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "potato-s",
    storageBucket: "potato-s.appspot.com",
    messagingSenderId: "757808950099",
    appId: "1:757808950099:web:c7d5eeffd4c68ef2ad4fa6",
    
  };


// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Reference to the database
const db = firebase.database();

// Create the grid
const grid = document.getElementById('grid');
for (let i = 0; i < 100; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell';
    cell.addEventListener('click', () => {
        const color = document.getElementById('color-picker').value;
        cell.style.backgroundColor = color;
        // Save the color to Firebase
        db.ref('grid/' + i).set(color);
    });
    grid.appendChild(cell);
}

// Load the grid colors from Firebase
db.ref('grid').on('value', (snapshot) => {
    const colors = snapshot.val();
    if (colors) {
        Object.keys(colors).forEach(index => {
            grid.children[index].style.backgroundColor = colors[index];
        });
    }
});

// Chat functionality
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
const messages = document.getElementById('messages');

sendButton.addEventListener('click', () => {
    const message = chatInput.value;
    if (message) {
        // Save the message to Firebase
        db.ref('chat').push({
            message,
            timestamp: new Date().toISOString()
        });
        chatInput.value = '';
    }
});

// Load chat messages from Firebase
db.ref('chat').on('child_added', (snapshot) => {
    const messageData = snapshot.val();
    const messageElement = document.createElement('div');
    messageElement.textContent = messageData.message;
    messages.appendChild(messageElement);
    messages.scrollTop = messages.scrollHeight;
});
