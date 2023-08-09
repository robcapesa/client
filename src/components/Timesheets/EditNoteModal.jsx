import React, { useState, useEffect } from 'react';
import { Modal, Form, Input } from 'antd';
import moment from 'moment';

function EditNoteModal({
  visible,
  existingNotes,
  allDates,
  onSave,
  onCancel,
  selectedRow,
}) {
  const [form] = Form.useForm();
  const [notes, setNotes] = useState([]);

  console.log(notes);

  // Update the 'notes' state when 'existingNotes' prop changes
  useEffect(() => {
    setNotes(existingNotes.map(note => ({ ...note })));
  }, [existingNotes]);

  const handleSave = () => {
    form.validateFields().then(values => {
      onSave(
        selectedRow,
        notes.map(note => ({ ...note, notes: values.notes[note.date] || '' }))
      );
      form.resetFields();
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      title="Edit Notes"
      onCancel={handleCancel}
      onOk={handleSave}
    >
      <Form form={form}>
        {existingNotes.map(note => {
          const formattedDate = moment(note.date).format('YYYY-MM-DD');
          return (
            <Form.Item
              key={note._id}
              label={formattedDate}
              name={['notes', note.date]}
              initialValue={note.notes || ''}
            >
              <Input.TextArea
                onChange={e =>
                  setNotes(prevNotes =>
                    prevNotes.map(n =>
                      n.date === note.date ? { ...n, notes: e.target.value } : n
                    )
                  )
                }
              />
            </Form.Item>
          );
        })}
      </Form>
    </Modal>
  );
}

export default EditNoteModal;
