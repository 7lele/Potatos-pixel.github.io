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
    const auth = firebase.auth();

    // Initialize selected color and brush mode
    let selectedColor = '#000000'; // Default color
    let isBrushMode = false; // Track brush mode status
    let pixelsPlaced = 0; // Counter for placed pixels
    const maxPixelsBeforeDelay = 30; // Max pixels before delay
    let delayTimeout = 0; // For managing delay timeout
    let countdownInterval; // For managing countdown interval

    // Handle color button clicks
    document.querySelectorAll('.color-button').forEach(button => {
        button.addEventListener('click', () => {
            selectedColor = button.getAttribute('data-color');
        });
    });

    // Create the grid
    const grid = document.getElementById('grid');
    for (let i = 0; i < 1000000; i++) {  // 1000x1000 = 1000000
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.addEventListener('click', () => {
            if (auth.currentUser) {
                if (delayTimeout > 0) {
                    // Skip coloring and inform user to wait
                    return;
                }
                if (pixelsPlaced >= maxPixelsBeforeDelay) {
                    // Start delay timer
                    startDelay();
                    return;
                }
                cell.style.backgroundColor = selectedColor;
                // Save the color to Firebase
                db.ref('grid/' + i).set(selectedColor);
                pixelsPlaced++;
            } else {
                alert("You need to be logged in to place a pixel.");
            }
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
            if (auth.currentUser) {
                const userId = auth.currentUser.uid;
                // Retrieve the user's username from the database
                db.ref('users/' + userId + '/username').once('value').then((snapshot) => {
                    const username = snapshot.val();
                    if (username) {
                        // Save the message to Firebase
                        db.ref('chat').push({
                            message,
                            timestamp: new Date().toISOString(),
                            user: username
                        });
                        chatInput.value = '';
                    } else {
                        alert("Username not set.");
                    }
                });
            } else {
                alert("You need to be logged in to send a message.");
            }
        }
    });

    // Load chat messages from Firebase
    db.ref('chat').on('child_added', (snapshot) => {
        const messageData = snapshot.val();
        const messageElement = document.createElement('div');
        messageElement.textContent = `${messageData.user}: ${messageData.message}`;
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

    // Toggle brush mode
    const toggleBrushButton = document.getElementById('toggle-brush');
    toggleBrushButton.addEventListener('click', () => {
        isBrushMode = !isBrushMode;
        toggleBrushButton.textContent = isBrushMode ? "Brush Mode ON" : "Brush Mode OFF";
    });

    // Add brush functionality
    let isPainting = false;

    const paintCell = (cell) => {
        if (auth.currentUser && isBrushMode) {
            if (delayTimeout > 0) {
                return;
            }
            if (pixelsPlaced >= maxPixelsBeforeDelay) {
                startDelay();
                return;
            }
            cell.style.backgroundColor = selectedColor;
            const index = Array.from(grid.children).indexOf(cell);
            db.ref('grid/' + index).set(selectedColor);
            pixelsPlaced++;
        }
    };

    grid.addEventListener('mousedown', (e) => {
        if (isBrushMode) {
            isPainting = true;
            paintCell(e.target);
        }
    });

    grid.addEventListener('mouseup', () => {
        isPainting = false;
    });

    grid.addEventListener('mousemove', (e) => {
        if (isPainting && isBrushMode) {
            paintCell(e.target);
        }
    });

    // Add touch functionality for brush mode on mobile devices
    grid.addEventListener('touchstart', (e) => {
        if (isBrushMode) {
            isPainting = true;
            paintCell(e.target);
        }
    });

    grid.addEventListener('touchend', () => {
        isPainting = false;
    });

    grid.addEventListener('touchmove', (e) => {
        if (isPainting && isBrushMode) {
            paintCell(e.target);
        }
    });

    // Start delay function
    const startDelay = () => {
        pixelsPlaced = 0;
        delayTimeout = 3; // 3 seconds delay
        updateDelayText();
        countdownInterval = setInterval(() => {
            delayTimeout--;
            updateDelayText();
            if (delayTimeout <= 0) {
                clearInterval(countdownInterval);
                document.getElementById('user-info').textContent = auth.currentUser.displayName;
            }
        }, 1000);
    };

    // Update delay text function
    const updateDelayText = () => {
        if (auth.currentUser) {
            document.getElementById('user-info').textContent = `${auth.currentUser.displayName} - Wait ${delayTimeout}s`;
        }
    };

    // Firebase authentication
    auth.onAuthStateChanged((user) => {
        if (user) {
            document.getElementById('user-info').textContent = user.displayName;
            document.getElementById('login-button').style.display = 'none';
            document.getElementById('logout-button').style.display = 'inline';
            // Check if username is set
            db.ref('users/' + user.uid + '/username').once('value').then((snapshot) => {
                if (!snapshot.val()) {
                    document.getElementById('username-modal').style.display = 'block';
                }
            });
        } else {
            document.getElementById('user-info').textContent = 'Not logged in';
            document.getElementById('login-button').style.display = 'inline';
            document.getElementById('logout-button').style.display = 'none';
        }
    });

    document.getElementById('login-button').addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider);
    });

    document.getElementById('logout-button').addEventListener('click', () => {
        auth.signOut();
    });

    // Set username
    document.getElementById('set-username-button').addEventListener('click', () => {
        const username = document.getElementById('username-input').value;
        if (auth.currentUser && username) {
            db.ref('users/' + auth.currentUser.uid).set({
                username: username
            }).then(() => {
                document.getElementById('username-modal').style.display = 'none';
            });
        } else {
            alert('Please enter a username.');
        }
    });
});