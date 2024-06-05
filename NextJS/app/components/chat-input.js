import styles from './chat-input.module.css';
import { useState } from "react";

const ChatInput = ({ onSendQuery }) => {
  const [prompt, setPrompt] = useState('');

  const handleSendQuery = (e) => {
    e.preventDefault();
    if (prompt.trim() !== '') {
      onSendQuery(prompt.trim());
      setPrompt('');
    }
  };

  return (
    <div className={styles.chatInput}>
      <form onSubmit={handleSendQuery} className={styles.chatInputForm}>
        <input
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          type="text"
          placeholder="Type your message here..."
          className={styles.chatInputInput}
        />
        <button type="submit" className={styles.chatInputButton} disabled={prompt === ''}>
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
  );
};

export default ChatInput;
