import LikeButton from './like-button';
 
function Header({ title }) {
  return <h1>{title ? title : 'Default title'}</h1>;
}
 
export default function HomePage() {
  const names = ["Lewis Hamilton", "Max Verstappen", "Charles Leclerc"];
 
  return (
    <div>
      <Header title="Testing out stuff." />
      <ul>
        {names.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
      <LikeButton/>
    </div>
  );
}

