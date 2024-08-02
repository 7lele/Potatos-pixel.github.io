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


// Wait for the DOM to be fully loaded before initializing Firebase
document.addEventListener("DOMContentLoaded", () => {
    firebase.initializeApp(firebaseConfig);

    // Reference to the database
    const db = firebase.database();

    // Create the grid
    const grid = document.getElementById('grid');
    for (let i = 0; i < 2500; i++) {  // 50x50 = 2500
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

    // Toggle scroll mode
    const toggleScrollButton = document.getElementById('toggle-scroll');
    let isScrollable = true;

    toggleScrollButton.addEventListener('click', () => {
        isScrollable = !isScrollable;
        grid.style.overflow = isScrollable ? 'auto' : 'hidden';
    });

    // Add drag functionality for moving the grid
    let isDragging = false;
    let startX, startY, scrollLeft, scrollTop;

    grid.addEventListener('mousedown', (e) => {
        if (!isScrollable) {
            isDragging = true;
            startX = e.pageX - grid.offsetLeft;
            startY = e.pageY - grid.offsetTop;
            scrollLeft = grid.scrollLeft;
            scrollTop = grid.scrollTop;
        }
    });

    grid.addEventListener('mouseleave', () => {
        isDragging = false;
    });

    grid.addEventListener('mouseup', () => {
        isDragging = false;
    });

    grid.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - grid.offsetLeft;
        const y = e.pageY - grid.offsetTop;
        const walkX = (x - startX) * 2; // Multiply by 2 for faster scrolling
        const walkY = (y - startY) * 2;
        grid.scrollLeft = scrollLeft - walkX;
        grid.scrollTop = scrollTop - walkY;
    });

    // Add touch functionality for moving the grid on mobile devices
    grid.addEventListener('touchstart', (e) => {
        if (!isScrollable) {
            isDragging = true;
            startX = e.touches[0].pageX - grid.offsetLeft;
            startY = e.touches[0].pageY - grid.offsetTop;
            scrollLeft = grid.scrollLeft;
            scrollTop = grid.scrollTop;
        }
    });

    grid.addEventListener('touchend', () => {
        isDragging = false;
    });

    grid.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.touches[0].pageX - grid.offsetLeft;
        const y = e.touches[0].pageY - grid.offsetTop;
        const walkX = (x - startX) * 2;
        const walkY = (y - startY) * 2;
        grid.scrollLeft = scrollLeft - walkX;
        grid.scrollTop = scrollTop - walkY;
    });
});