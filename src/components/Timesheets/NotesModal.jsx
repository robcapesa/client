import { useState, useEffect } from 'react';
import { Modal, Button, Input } from 'antd';

function NotesModal({ visible, dates, onCancel, onSave, employee }) {
  const [notes, setNotes] = useState({});

  useEffect(() => {
    if (employee && employee.notes) {
      setNotes(employee.notes);
    } else {
      setNotes({});
    }
  }, [employee]);

  const handleInputChange = (date, value) => {
    setNotes(prevNotes => ({
      ...prevNotes,
      [date]: value,
    }));
  };

  const handleSave = () => {
    onSave(notes);
    setNotes({});
  };

  return (
    <Modal
      title="Add Notes"
      visible={visible}
      onCancel={onCancel}
      onOk={handleSave}
    >
      {dates.map(date => (
        <div key={date} className="mb-2">
          <label htmlFor={date}>{date}</label>
          <Input
            id={date}
            value={notes[date] || ''}
            onChange={e => handleInputChange(date, e.target.value)}
            placeholder={`Add notes for ${date}`}
          />
        </div>
      ))}
    </Modal>
  );
}

export default NotesModal;
