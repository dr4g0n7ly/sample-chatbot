'use client'
import styles from './chat-input.module.css'
import { useState } from "react"

const ChatInput = () => {
  
    const [prompt, setPrompt] = useState('')
    const [userQuery, setUserQuery] = useState(null)
    const [modelResponse, setModelResponse] = useState(null)

    const updateModelResponse = (token) => {
      setModelResponse((prevModelResponse) =>
        prevModelResponse === null ? token : `${prevModelResponse} ${token}`
      );
    };
  
    const handleSendQuery = async (e) => {
      e.preventDefault()
      if (!prompt) {
        console.log("prompt cannot be empty")
        return
      }
  
      const input = prompt.trim()
      setUserQuery(input)
      setPrompt("")
      setModelResponse(null)
  
      const message = {
        query: input,
        createdAt: new Date(),
        user: {
          _id: 1,
          name: "user1", 
        }
      }

      try {
        const response = await fetch('http://127.0.0.1:8000/initiate-response', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...message }),
        });

        if (!response.ok) {
          throw new Error('Failed to initiate connection');
        }

        const data = await response.json();
        const id = data.id
        const res = data.response

        if (id === undefined || id === null) {
          throw new Error('id is undefined or null');
        }

        console.log(id, res);  // Output: the actual id and response

        const eventSource = new EventSource(`http://127.0.0.1:8000/get-response/${id}`);

        eventSource.onopen = () => {
            console.log('EventSource connected');
        };

        eventSource.addEventListener('tokenStream', function (event) {
            const res_data = JSON.parse(event.data);
            if (res_data.status == "completed") {
                console.log("exited");
                eventSource.close();
            }
            else if (res_data.status == "error") {
              console.log("error");
              setModelResponse("Internal Server Error")
              eventSource.close();
            } else {
                const token = res_data.token
                console.log('tokenStream', token);
                updateModelResponse(token)
            }
        });

        eventSource.onerror = (error) => {
            console.error('EventSource failed', error);
            eventSource.close();
        };

      } catch (error) {
        setModelResponse("Internal Server Error")
        if (error.message.includes('Failed to fetch')) {
          console.error('CORS error or Network issue:', error);
        } else {
          console.error('Error:', error);
        }
      }
    }
  
    return (
      <div>
        {userQuery && (
          <div className={styles.userText}>
            <p className={styles.innerUserText}>User: {userQuery}</p>
          </div>
        )}
        {modelResponse && (
          <div className={styles.modelText}>
            <p>AI: {modelResponse}</p>
          </div>
        )}
        <div className={styles.chatInput}>
          <form onSubmit={handleSendQuery} className={styles.chatInputForm} >
            <input
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              type="text" 
              placeholder="Type your message here..." 
              className={styles.chatInputInput}
            />
            <button type="submit" className={styles.chatInputButton} disabled={prompt===''}>
              <img
                src='/assets/send-icon.svg'
                alt='send-icon'
                width={22}
                height={22}
                className={styles.chatInputImg}
              />
            </button>
          </form>
        </div>
      </div>
    )
  }
  
  export default ChatInput