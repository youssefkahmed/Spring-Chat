'use strict';

// Grabbing view items
var usernamePage = document.querySelector('#username-page');
var chatPage = document.querySelector('#chat-page');
var usernameForm = document.querySelector('#usernameForm');
var messageForm = document.querySelector('#messageForm');
var messageInput = document.querySelector('#message');
var messageArea = document.querySelector('#messageArea');
var connectingElement = document.querySelector('.connecting');

var stompClient = null;
var username = null;

// Static array of message colors
var colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];

function connect(event) {
    // Getting the typed-in username
    username = document.querySelector('#name').value.trim();

    if(!username)
        return;

    // Hiding the username page and showing the chat page
    usernamePage.classList.add('hidden');
    chatPage.classList.remove('hidden');

    // Instantiating and sending a connection socket to the "ws" endpoint
    var socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);

    stompClient.connect({}, onConnected, onError);
    event.preventDefault();
}

// Handler for successful connection state
function onConnected() {
    // Subscribe to the Public Topic
    stompClient.subscribe('/topic/public', onMessageReceived);

    /* Sending the username to the
    server with a join message */
    stompClient.send("/app/add_user",
        {},
        JSON.stringify({sender: username, type: 'JOIN'})
    )

    connectingElement.classList.add('hidden');
}

// Handler for unsuccessful connection attempt
function onError(error) {
    connectingElement.textContent = 'Connection failed. Please refresh to try again!';
    connectingElement.style.color = 'red';
}

// Handler for sending messages
function sendMessage(event) {
    var messageContent = messageInput.value.trim();

    if(!messageContent || !stompClient)
        return;
    // Creating a message JSON object and sending it to our endpoint
    var chatMessage = {
        sender: username,
        content: messageContent,
        type: 'CHAT'
    };
    stompClient.send("/app/send_message", {}, JSON.stringify(chatMessage));

    // Clearing the message text field
    messageInput.value = '';
    event.preventDefault();
}

// Handler for receiving messages
function onMessageReceived(payload) {
    var message = JSON.parse(payload.body);

    /* Creating messages as list items to
    be added to the message area unordered list */
    var messageElement = document.createElement('li');

    // Checking for message type and adding content accordingly
    if(message.type === 'JOIN') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' joined!';
    } else if (message.type === 'LEAVE') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' left!';
    } else {
        messageElement.classList.add('chat-message');

        // Adding sender icon to the message element
        var avatarElement = document.createElement('i');
        var avatarText = document.createTextNode(message.sender[0]);
        avatarElement.appendChild(avatarText);
        avatarElement.style['background-color'] = getAvatarColor(message.sender);
        messageElement.appendChild(avatarElement);

        // Adding sender username to the message element
        var usernameElement = document.createElement('span');
        var usernameText = document.createTextNode(message.sender);
        usernameElement.appendChild(usernameText);
        messageElement.appendChild(usernameElement);
    }

    // Adding sender's message to the message element
    var textElement = document.createElement('p');
    var messageText = document.createTextNode(message.content);
    textElement.appendChild(messageText);
    messageElement.appendChild(textElement);

    // Adding the message list item to the messages unordered list
    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;
}

// Hash function to get a color for the message sender's avatar
function getAvatarColor(messageSender) {
    var hash = 0;
    for (var i = 0; i < messageSender.length; i++) {
        hash = 31 * hash + messageSender.charCodeAt(i);
    }
    var index = Math.abs(hash % colors.length);
    return colors[index];
}

// Adding onSubmit listeners to the forms
usernameForm.addEventListener('submit', connect, true)
messageForm.addEventListener('submit', sendMessage, true)