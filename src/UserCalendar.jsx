import React, { useState, useEffect } from 'react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import Modal from 'react-modal';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';
import { getDatabase, ref, push, onValue } from 'firebase/database';
import './modal.css';
import { database } from './firebase';

const localizer = momentLocalizer(moment);

const eventPropGetter = (event) => {
  const backgroundColor = '#fe616f'; // Set a single color for all events
  return {
    style: {
      backgroundColor,
      padding: '5px',
      borderRadius: '2px',
    },
  };
};

const CustomEvent = ({ event }) => {
  return (
    <div style={{ height: '100%' }}>
      {/* Custom Event Rendering */}
    </div>
  );
};

Modal.setAppElement('#root');

export default function MyCalendar() {
  const [eventsState, setEventsState] = useState([]);
  const [newEventModalOpen, setNewEventModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', phone: '', startDate: new Date(), startTime: dayjs(), endTime: dayjs() });

  useEffect(() => {
    const eventsRef = ref(database, 'events');
    onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      console.log("Data received from Firebase:", data);
      if (data) {
        const eventsArray = Object.keys(data).map((key) => {
          const event = data[key];
          const startDate = dayjs(event.startDate);
          const startDateTime = startDate.hour(parseInt(event.startTime.split(':')[0])).minute(parseInt(event.startTime.split(':')[1]));
          const endDateTime = startDate.hour(parseInt(event.endTime.split(':')[0])).minute(parseInt(event.endTime.split(':')[1]));
          return {
            ...event,
            start: startDateTime.toDate(),
            end: endDateTime.toDate()
          };
        });
        console.log("Transformed events:", eventsArray);
        setEventsState(eventsArray);
      } else {
        setEventsState([]); // Ensure eventsState is empty if no data is received
      }
    });
  }, []);

  const hasConflict = (newEvent, existingEvents) => {
    return existingEvents.some((existingEvent) => {
      // Check for overlapping time ranges (considering both start and end times)
      return (
        (newEvent.start < existingEvent.end && newEvent.end > existingEvent.start) ||
        (newEvent.start === existingEvent.start && newEvent.end === existingEvent.end) // Handle exact time slot overlap
      );
    });
  };

  const addNewEvent = (newEvent) => {
    const hasOverlappingEvent = hasConflict(newEvent, eventsState);

    if (hasOverlappingEvent) {
      console.error("Error: Conflicting reservation found. Please choose a different time slot.");
      return; // Prevent adding the event if there's a conflict
    }

    console.log("Adding new event:", newEvent);
    setEventsState([...eventsState, newEvent]);
    setNewEventModalOpen(false);

    // Push event to Firebase
    const eventsRef = ref(database, 'events');
    push(eventsRef, {
      title: newEvent.title,
      phone: newEvent.phone,
      startDate: newEvent.startDate,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime
    }).then(() => {
      console.log('Event added to Firebase successfully');
    }).catch((error) => {
      console.error('Error adding event to Firebase:', error);
    });
  };

  const handleInputChange = (name, value) => {
    setNewEvent((prevEvent) => ({
      ...prevEvent,
      [name]: value
    }));
  };

  const handleAddEvent = (e) => {
    e.preventDefault();

    const startDate = dayjs(newEvent.startDate).format('YYYY-MM-DD');
    // const startDateTime = startDate.hour(newEvent.startTime.hour()).minute(newEvent.startTime.minute());
    // const endDateTime = startDate.hour(newEvent.endTime.hour()).minute(newEvent.endTime.minute());

    const startTimeString = dayjs(newEvent.startTime).format('HH:mm');
    const endTimeString = dayjs(newEvent.endTime).format('HH:mm');

    addNewEvent({ ...newEvent, startTime: startTimeString, endTime: endTimeString, startDate });
  };

  useEffect(() => {
    console.log("Events State updated:", eventsState);
  }, [eventsState]);

  return (
    <div style={{ height: '500px' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button className="add-event-button" onClick={() => setNewEventModalOpen(true)}>Reserve the court</button>
      </div>

      <Modal isOpen={newEventModalOpen} onRequestClose={() => setNewEventModalOpen(false)} className="modal-content" overlayClassName="modal-overlay">
        <h2>Reserve the court</h2>
        <form className="modal-form" onSubmit={handleAddEvent}>
          <label htmlFor="title">Name:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={newEvent.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            required
          />

          <label htmlFor="phone">Phone Number:</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={newEvent.phone || ''}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            required
          />

          <label htmlFor="startDate"> Date:</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={dayjs(newEvent.startDate).format('YYYY-MM-DD')}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            required
          />

          <label htmlFor="startTime">Start Time:</label>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <TimePicker
              value={newEvent.startTime}
              onChange={(time) => handleInputChange('startTime', time)}
              renderInput={(params) => <input {...params} className="time-picker-input" />}
              required
            />
          </LocalizationProvider>

          <label htmlFor="endTime">End Time:</label>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <TimePicker
              value={newEvent.endTime}
              onChange={(time) => handleInputChange('endTime', time)}
              renderInput={(params) => <input {...params} className="time-picker-input" />}
              required
            />
          </LocalizationProvider>

          <button type="submit">Reserve</button>
        </form>
      </Modal>

      <Calendar
        localizer={localizer}
        events={eventsState}
        startAccessor="start"
        endAccessor="end"
        style={{ margin: '50px' }}
        selectable={true}
        eventPropGetter={eventPropGetter}
        components={{
          event: CustomEvent,
        }}
        defaultView={Views.DAY}
      />
    </div>
  );
}
