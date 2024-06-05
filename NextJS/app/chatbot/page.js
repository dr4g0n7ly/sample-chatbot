'use client'
import { useState } from 'react';
import UserMessage from '../components/user-message';
import ModelMessage from '../components/model-message';
import ChatInput from '../components/chat-input';

function Header({ title }) {
  return <h1>{title ? title : 'Default title'}</h1>;
}

const Chatbot = () => {
  const [userQuery, setUserQuery] = useState(null);
  const [modelResponse, setModelResponse] = useState(null);

  const updateModelResponse = (token) => {
    setModelResponse((prevModelResponse) =>
      prevModelResponse === null ? token : `${prevModelResponse} ${token}`
    );
  };

  const handleSendQuery = async (input) => {
    setUserQuery(input);
    setModelResponse(null);

    const message = {
      query: input,
      createdAt: new Date(),
      user: {
        _id: 1,
        name: "user1",
      }
    };

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
      const id = data.id;
      const res = data.response;

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
          eventSource.close();
        } else {
          const token = res_data.token;
          console.log('tokenStream', token);
          updateModelResponse(token);
        }
      });

      eventSource.onerror = (error) => {
        console.error('EventSource failed', error);
        eventSource.close();
      };

    } catch (error) {
      console.error('Error:', error);
      setModelResponse('Internal Server Error')
    }
  };

  return (
    <div>
      <Header title="Chatbot." />
      {userQuery && <UserMessage text={userQuery} />}
      {modelResponse && <ModelMessage text={modelResponse} />}
      <ChatInput onSendQuery={handleSendQuery} />
    </div>
  );
}

export default Chatbot