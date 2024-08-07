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
    const maxPixelsBeforeDelay = 10; // Max pixels before delay
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
                    return;
                }
                if (pixelsPlaced >= maxPixelsBeforeDelay) {
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

    // Authentication
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const userInfo = document.getElementById('user-info');
    const usernameModal = document.getElementById('username-modal');
    const usernameInput = document.getElementById('username-input');
    const setUsernameButton = document.getElementById('set-username-button');

    loginButton.addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider);
    });

    logoutButton.addEventListener('click', () => {
        auth.signOut();
    });

    auth.onAuthStateChanged(user => {
        if (user) {
            const userId = user.uid;
            db.ref('users/' + userId).once('value').then((snapshot) => {
                if (!snapshot.exists()) {
                    // Show the username modal if the user doesn't have a username set
                    usernameModal.style.display = 'block';
                } else {
                    const userData = snapshot.val();
                    userInfo.textContent = `Logged in as ${userData.username}`;
                }
            });
            loginButton.style.display = 'none';
            logoutButton.style.display = 'block';
        } else {
            userInfo.textContent = 'Not logged in';
            loginButton.style.display = 'block';
            logoutButton.style.display = 'none';
        }
    });

    setUsernameButton.addEventListener('click', () => {
        const username = usernameInput.value;
        if (username) {
            const userId = auth.currentUser.uid;
            db.ref('users/' + userId).set({
                username: username
            }).then(() => {
                usernameModal.style.display = 'none';
                userInfo.textContent = `Logged in as ${username}`;
            });
        }
    });

    // Start delay countdown
    function startDelay() {
        delayTimeout = 3; // Set delay time
        pixelsPlaced = 0; // Reset pixel counter
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
        countdownInterval = setInterval(() => {
            delayTimeout--;
            if (delayTimeout <= 0) {
                clearInterval(countdownInterval);
                delayTimeout = 0;
                userInfo.textContent = `Logged in as ${auth.currentUser.displayName}`; // Reset to username after delay
            } else {
                userInfo.textContent = `Logged in as ${auth.currentUser.displayName} - Wait ${delayTimeout}s to place more pixels`;
            }
        }, 1000);
    }
});