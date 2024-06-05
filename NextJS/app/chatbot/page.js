import ChatInput from "../components/chat-input";

function Header({ title }) {
    return <h1>{title ? title : 'Default title'}</h1>;
}

export default function Chatbot() {
 
  return (
    <div>
      <Header title="Chatbot." />
      <ChatInput/>
    </div>
  );
}

