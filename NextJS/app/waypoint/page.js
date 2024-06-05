'use client'

import React, { useState } from 'react';

const LiveCoordinates = () => {
  const [coords, setCoords] = useState(null);

  const handleClick = () => {
    const eventSource = new EventSource('http://127.0.0.1:8000/get-waypoints');

    const handleOpen = () => {
        console.log('EventSource connected');
        setCoords(null);
    };

    const handleLocationUpdate = (event) => {
        const new_coords = JSON.parse(event.data);
        if (new_coords.lat === -1 && new_coords.lng === -1) {
            console.log("exited");
            setCoords(null);
            eventSource.close();
        } else {
            console.log('LocationUpdate', new_coords);
            setCoords(new_coords);
        }
    };

    const handleError = (error) => {
        console.error('EventSource failed', error);
        eventSource.close();
        // Optionally, implement retry logic or user feedback here
    };

    eventSource.onopen = handleOpen;
    eventSource.addEventListener('locationUpdate', handleLocationUpdate);
    eventSource.onerror = handleError;
};
  return (
    <div>
      <h2>Live Vehicle Coordinates</h2>
      <button onClick={handleClick}>Start Tracking</button>
      {coords && (
        <div>
          <p>Latitude: {coords.lat}</p>
          <p>Longitude: {coords.lng}</p>
        </div>
      )}
    </div>
  );
};

export default LiveCoordinates;

