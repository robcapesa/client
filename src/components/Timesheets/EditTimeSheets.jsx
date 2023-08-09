import React, { useState, useEffect } from 'react';
import { Table, TimePicker, Button, Modal } from 'antd';
import moment from 'moment';
import axios from 'axios';
import Loading from './Loading';
import { FileAddOutlined, FileDoneOutlined } from '@ant-design/icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import EditNoteModal from './EditNoteModal';
const apiUrl = import.meta.env.VITE_SERVER_URL;

function EditTimeSheets({ timesheets }) {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const [currentDate, setCurrentDate] = useState('');
  const [currentNotes, setCurrentNotes] = useState('');

  // ... (your existing code)

  const showNotes = (e, notes) => {
    if (notes && notes.notes.length > 0) {
      setEditModalVisible(true);
      setCurrentNotes(notes.notes);
    } else {
      setEditModalVisible(true);
      setCurrentNotes([]);
    }
  };

  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  // Extract all unique dates from the timesheets to dynamically generate columns
  const allDates = Array.from(
    new Set(
      timesheets.flatMap(timesheet =>
        timesheet.hoursWorked.map(entry =>
          moment(entry.date).format('(ddd) YYYY-MM-DD')
        )
      )
    )
  );

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    ...allDates.map(date => ({
      title: date,
      dataIndex: date,
      key: date,
      render: (text, record) => {
        const timeValue = record[date] ? moment(record[date], 'HH:mm') : null;
        const notes = record.notes
          ? record.notes.find(
              note => moment(note.date).format('YYYY-MM-DD') === date
            )
          : null;

        return (
          <div className="flex items-center">
            <TimePicker
              format="HH:mm"
              value={timeValue}
              onChange={time => handleInputChange(record.key, date, time)}
              onOk={time => handleInputChange(record.key, date, time)}
              clearIcon={null}
            />
            {notes && notes.notes.length > 0 && (
              <span className="text-blue-600 ml-1" role="img" aria-label="note">
                <FileDoneOutlined />
              </span>
            )}
          </div>
        );
      },
      className:
      date.includes('(Sun)') || date.includes('(Sat)')
        ? 'border-y-2 border-indigo-500'
        : '',
    })),
    {
      title: 'Total Hrs',
      dataIndex: 'totalHoursWorked',
      key: 'totalHoursWorked',
      render: (text, record) => {
        const totalHoursWorked = allDates.reduce((sum, date) => {
          const workedHours = record[date] ? record[date] : '00:00';
          return addTime(sum, workedHours);
        }, '00:00');
  
        return totalHoursWorked;
      },
    },
    {
      title: 'Ot 1',
      dataIndex: 'overtime1',
      key: 'overtime1',
      render: (text, record) => {
        const totalHoursWorked = allDates.reduce((sum, date) => {
          const workedHours = record[date] ? record[date] : '00:00';
          return addTime(sum, workedHours);
        }, '00:00');
  
        const { q1 } = calculateQ1AndQ2(totalHoursWorked);
  
        return q1;
      },
    },
    {
      title: 'Ot 2',
      dataIndex: 'overtime2',
      key: 'overtime2',
      render: (text, record) => {
        const totalHoursWorked = allDates.reduce((sum, date) => {
          const workedHours = record[date] ? record[date] : '00:00';
          return addTime(sum, workedHours);
        }, '00:00');
  
        const { q2 } = calculateQ1AndQ2(totalHoursWorked);
  
        return q2;
      },
    },

    {
      title: 'Edit',
      key: 'edit',
      render: (text, record) => (
        <Button
          className="text-blue-600"
          type="primary"
          onClick={() => handleEditButtonClick(record)}
        >
          <FileAddOutlined />
        </Button>
      ),
    },
  ];

  // Function to calculate Q1 and Q2 based on totalHoursWorked
function calculateQ1AndQ2(totalHoursWorked) {
  const totalHours = hoursToNumber(totalHoursWorked);

  let q1 = "00:00";
  let q2 = "00:00";

  if (totalHours > 40 && totalHours <= 50) {
    q1 = subtractTime(totalHoursWorked, "40:00");
  } else if (totalHours > 50) {
    q1 = "10:00"; // Cap q1 at 10 hours (50 - 40)
    q2 = subtractTime(totalHoursWorked, "50:00");
  }

  return { q1, q2 };
}


   // Function to subtract two time strings in "HH:mm" format
   function subtractTime(time1, time2) {
    // Check if either time1 or time2 is null or not a valid time string
  if (!time1 || !time2 || typeof time1 !== "string" || typeof time2 !== "string") {
    return "00:00"; // Return a default value or handle the error as per your requirement
  }
    const [hours1, minutes1] = time1.split(':').map(Number);
    const [hours2, minutes2] = time2.split(':').map(Number);

    let totalHours = hours1 - hours2;
    let totalMinutes = minutes1 - minutes2;

    if (totalMinutes < 0) {
      totalHours -= 1;
      totalMinutes += 60;
    }

    const formattedHours = totalHours.toString().padStart(2, '0');
    const formattedMinutes = totalMinutes.toString().padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}`;
  }


  // Function to add two time strings in "hh:mm" format
function addTime(time1, time2) {
  // Check if either time1 or time2 is null or not a valid time string
  if (!time1 || !time2 || typeof time1 !== "string" || typeof time2 !== "string") {
    return "00:00"; // Return a default value or handle the error as per your requirement
  }
  const [hours1, minutes1] = time1.split(':').map(Number);
  const [hours2, minutes2] = time2.split(':').map(Number);

  let totalHours = hours1 + hours2;
  let totalMinutes = minutes1 + minutes2;

  if (totalMinutes >= 60) {
    totalHours += Math.floor(totalMinutes / 60);
    totalMinutes %= 60;
  }

  const formattedHours = totalHours.toString().padStart(2, '0');
  const formattedMinutes = totalMinutes.toString().padStart(2, '0');

  return `${formattedHours}:${formattedMinutes}`;
}

  const [timesheetsData, setTimesheetsData] = useState(
    timesheets.map(timesheet => ({
      key: timesheet._id,
      name: timesheet?.user?.name || "n/a",
      user: timesheet.user,
      _id: timesheet._id,
      hours: timesheet.hoursWorked.map(entry => {
        const workedHours = parseFloat(entry.hours).toFixed(2); // Convert to string with two decimal places
        return workedHours === '0.00' ? '00:00' : workedHours; // Convert "0.00" to "00:00"
      }),
      notes: timesheet.notes,
      period: timesheet.period,
      status: timesheet.status,
      ...timesheet.hoursWorked.reduce((acc, entry) => {
        acc[moment(entry.date).format('(ddd) YYYY-MM-DD')] = moment(
          entry.hours,
          'HH:mm'
        ).format('HH:mm');
        return acc;
      }, {}),
    }))
  );

  console.log(timesheetsData);
  // Function to handle the edit button click and set the current timesheet being edited
  const handleEditButtonClick = timesheet => {
    //console.log("timesheet",timesheet)
    setCurrentNotes(timesheet || {}); // Set the current notes for the modal
    setEditModalVisible(true);
    setSelectedRow(timesheet);
  };

  // Function to handle saving the edited notes in the modal
  const handleEditModalSave = (selectedRow, updatedNotes) => {
    console.log(updatedNotes);

    if (selectedRow) {
      // If a row is selected, update the notes for that timesheet
      setTimesheetsData(prevData =>
        prevData.map(timesheet =>
          timesheet.key === selectedRow.key
            ? { ...timesheet, notes: updatedNotes }
            : timesheet
        )
      );
    }

    setEditModalVisible(false);
  };

  console.log('timesheet', timesheetsData);

  const handleEditModalCancel = () => {
    setEditModalVisible(false);
  };

  // New state to track the changes in TimePicker values
  const [timePickerValues, setTimePickerValues] = useState({});

  const handleInputChange = (timesheetKey, date, time) => {
    if (time) {
      const value = time.format('HH:mm'); // Format the time as "HH:mm"

      setTimesheetsData(prevData =>
        prevData.map(timesheet => {
          if (timesheet.key === timesheetKey) {
            return { ...timesheet, [date]: value };
          }
          return timesheet;
        })
      );
    }
  };

  useEffect(() => {
    // When the TimePicker values change, update the corresponding state values
    setTimesheetsData(prevData =>
      prevData.map(timesheet => {
        const newData = { ...timesheet };
        allDates.forEach(date => {
          const key = `${timesheet.key}-${date}`;
          if (timePickerValues.hasOwnProperty(key)) {
            const timeValue = timePickerValues[key];
            const totalHours = timeValue
              ? moment.duration(timeValue).asHours()
              : 0;
            newData[date] = totalHours.toFixed(2);
          }
        });
        return newData;
      })
    );
  }, [timePickerValues]);

  console.log(timesheetsData);

  const handleSave = () => {
    setLoading(true);
    // Create a new array with the data to be sent to the backend
    // Create a new array with the data to be sent to the backend
    const dataToUpdate = timesheetsData.map(timesheet => {
      // Extract relevant data from each timesheet object
      const { _id, user, status, period, hours, notes, ...hoursWorked } =
        timesheet;

      const { startDate, endDate } = period;

      return {
        _id,
        user: user._id, // Assuming timesheet.user has the user ID
        period: {
          startDate: new Date(startDate).toISOString(), // Convert startDate to ISOString
          endDate: new Date(endDate).toISOString(), // Convert endDate to ISOString
        },
        hoursWorked: Object.entries(hoursWorked)
          .filter(
            ([date, hours]) =>
              date !== 'key' && date !== 'name' && date !== 'delete'
          )
          .map(([date, hours]) => ({
            date: moment(date, 'YYYY-MM-DD').toISOString(),
            hours: hours || '00:00', // Use the hoursToNumber function here
          })),
        notes,
        status,
      };
    });

    setLoading(true);

    // Send the PUT request to update multiple timesheets
    axios
      .put(`${apiUrl}/api/timesheet`, dataToUpdate)
      .then(response => {
        toast('Timesheets data updated:');
        setLoading(false);
        // Perform any necessary actions after successful update
      })
      .catch(error => {
        toast('Error updating timesheets data:');
        setLoading(false);
        // Perform any error handling
      });
  };

  const hoursToNumber = timeString => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return parseFloat(`${hours}.${minutes.toString().padStart(2, '0')}`);
  };

  const handleSubmit = () => {
    setLoading2(true);
    // Create a new array with the data to be sent to the backend
    // Create a new array with the data to be sent to the backend
    const dataToUpdate = timesheetsData.map(timesheet => {
      // Extract relevant data from each timesheet object
      const { _id, user, status, period, hours, notes, ...hoursWorked } =
        timesheet;

      const { startDate, endDate } = period;

      return {
        _id,
        user: user._id, // Assuming timesheet.user has the user ID
        period: {
          startDate: new Date(startDate).toISOString(), // Convert startDate to ISOString
          endDate: new Date(endDate).toISOString(), // Convert endDate to ISOString
        },
        hoursWorked: Object.entries(hoursWorked)
          .filter(
            ([date, hours]) =>
              date !== 'key' && date !== 'name' && date !== 'delete'
          )
          .map(([date, hours]) => ({
            date: moment(date, 'YYYY-MM-DD').toISOString(),
            hours: hours || '00:00', // Use the hoursToNumber function here
          })),
        notes,
        status: 'pending',
      };
    });

    setLoading2(true);

    // Send the PUT request to update multiple timesheets
    axios
      .put(`${apiUrl}/api/timesheet`, dataToUpdate)
      .then(response => {
        toast('Timesheets data updated:');
        setLoading2(false);
        // Perform any necessary actions after successful update
      })
      .catch(error => {
        toast('Error updating timesheets data:');
        setLoading2(false);
        // Perform any error handling
      });
  };

  const handleReset = () => {
    console.log('reset');
  };

  //console.log(currentNotes)

  return (
    <div>
      <ToastContainer autoClose={2000} />

      <div className="overflow-x-auto">
        <Table
          dataSource={timesheetsData}
          columns={columns}
          pagination={false}
        />
        {/* Add a button for editing notes */}
        <EditNoteModal
          visible={editModalVisible}
          existingNotes={currentNotes.notes || []}
          allDates={allDates}
          onSave={handleEditModalSave}
          onCancel={handleEditModalCancel}
          selectedRow={selectedRow}
        />
      </div>
      <div className="flex justify-center space-x-4 mt-4">
        <Button
          className="bg-blue-600 text-white"
          type="primary px-10"
          onClick={handleReset}
        >
          Reset
        </Button>
        <Button
          className="bg-green-600 text-white px-10"
          type="primary"
          onClick={handleSave}
        >
          {loading ? 'loading...' : 'Save'}
        </Button>
        <Button
          className="bg-purple-600 text-white px-10"
          type="primary"
          onClick={handleSubmit}
        >
          {loading2 ? 'loading...' : 'Submit'}
        </Button>
      </div>
    </div>
  );
}

export default EditTimeSheets;
