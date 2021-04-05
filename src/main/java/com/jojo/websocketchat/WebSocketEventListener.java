package com.jojo.websocketchat;

import com.jojo.websocketchat.models.ChatMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

public class WebSocketEventListener {

    private static final Logger LOGGER = LoggerFactory.getLogger(WebSocketEventListener.class);
    @Autowired
    private SimpMessageSendingOperations sendingOperations;

    // Listen for new connection
    @EventListener
    public void connectionListener(SessionConnectedEvent event){
        LOGGER.info("New connection detected.");
    }

    // Disconnection listener
    @EventListener
    public void disconnectionListener(SessionDisconnectEvent event){
        // Accessing the message's header to get the username of whoever left the chat
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String username = (String)headerAccessor.getSessionAttributes().get("username");

        if(username == null)
            return;

        // Instantiating a leave message
        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setSender(username);
        chatMessage.setType(ChatMessage.MessageType.LEAVE);

        // Sending the leave message as a payload to the chat
        sendingOperations.convertAndSend("topic/public", chatMessage);

        // Logging the disconnection event
        LOGGER.info("User " + username + " disconnected.");
    }
}
