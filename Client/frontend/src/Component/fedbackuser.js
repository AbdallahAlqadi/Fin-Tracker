import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../cssStyle/fedbackuser.css';

const FedbackUser = () => {
    const [feedbacks, setFeedbacks] = useState([]);

    useEffect(() => {
        const fetchFeedbacks = async () => {
            try {
                const response = await axios.get('https://fin-tracker-ncbx.onrender.com/fedback');
                setFeedbacks(response.data); // البيانات تحتوي على username و message
            } catch (error) {
                console.error('Error fetching feedbacks:', error);
            }
        };

        fetchFeedbacks();
    }, []);

    return (
        <div className="chat-container">
            <div className="chat-window">
                {feedbacks.map((feedback, index) => (
                    <div key={index} className="chat-message left">
                        <div className="message-bubble">
                            <div className="message-header">
                                <img 
                                    src="https://static.vecteezy.com/system/resources/previews/019/879/186/large_2x/user-icon-on-transparent-background-free-png.png" 
                                    alt="User Avatar" 
                                    className="user-avatar"
                                />
                                <span className="username">{feedback.username}</span>
                            </div>
                            <div className="message-text">
                                <p>{feedback.message}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FedbackUser;