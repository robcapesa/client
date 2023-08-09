import React, { useState } from 'react';
import moment from 'moment';
import { Table, TimePicker, Button, Modal } from 'antd';
import { FileAddOutlined, FileDoneOutlined } from '@ant-design/icons';
import axios from 'axios';
import Loading from './Loading';
import NotesModal from './NotesModal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const apiUrl = import.meta.env.VITE_SERVER_URL;

function generateDates(startDate, endDate) {
  const dates = [];
  const currentDate = moment(startDate).startOf('day'); // Set the time to the beginning of the day

  const end = moment(endDate).startOf('day'); // Set the time to the beginning of the day

  while (currentDate.isSameOrBefore(end)) {
    dates.push(currentDate.format('(ddd) YYYY-MM-DD'));
    currentDate.add(1, 'days');
  }

  return dates;
}


// ... (rest of the code)
/*
function generateDates(startDate, endDate) {
  const dates = [];
  const currentDate = moment(startDate);

  while (currentDate.isSameOrBefore(endDate)) {
    dates.push(currentDate.format('(ddd) YYYY-MM-DD'));
    currentDate.add(1, 'days');
  }

  return dates;
}*/

function TimeSheetTable({
  employees,
  startDate,
  endDate,
  getTimesheetsByPeriod,
}) {
  
  const formattedStartDate = moment(startDate?.$d).format('(ddd) YYYY-MM-DD');
  const formattedEndDate = moment(endDate?.$d).format('(ddd) YYYY-MM-DD');
  const allDates = generateDates(startDate?.$d, endDate?.$d);
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);

  const [employeeData, setEmployeeData] = useState(() => {
    // Initialize the employee data with empty hours for each date
    const data = employees.map(employee => ({
      key: employee._id,
      name: employee.name,
      ...allDates.reduce((acc, date) => ({ ...acc, [date]: null }), {}),
    }));
    return data;
  });

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);

  const showNotesModal = employee => {
    setCurrentEmployee(employee);
    setIsModalVisible(true);
  };

  const handleNotesCancel = () => {
    setIsModalVisible(false);
    setCurrentEmployee(null);
  };

  const handleNotesSave = notes => {
    if (currentEmployee) {
      setEmployeeData(prevData => {
        const newData = prevData.map(employee => {
          if (employee.key === currentEmployee.key) {
            return {
              ...employee,
              notes: {
                ...employee.notes,
                ...notes,
              },
            };
          }
          return employee;
        });
        return newData;
      });

      setIsModalVisible(false);
      setCurrentEmployee(null);
    }
  };

  const handleInputChange = (employeeKey, date, time) => {
    if (time) {
      const value = time.format('HH:mm'); // Format the time as "HH:mm"

      setEmployeeData(prevData => {
        const newData = prevData.map(employee => {
          if (employee.key === employeeKey) {
            return { ...employee, [date]: value };
          }
          return employee;
        });
        return newData;
      });
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    ,
    ...allDates.map(date => ({
      title: date,
      dataIndex: date,
      key: date,
      render: (text, record) => {
        const hasNotes = record.notes && record.notes[date]; // Check if the date has notes
        return (
          <div className="flex items-center">
            <TimePicker
              format="HH:mm"
              value={
                record.hoursWorked[date]
                  ? moment(record.hoursWorked[date], 'HH:mm')
                  : null
              }
              onChange={time => handleInputChange(record.key, date, time)}
              onOk={time => handleInputChange(record.key, date, time)}
              clearIcon={null}
            />
            {hasNotes && (
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
        const totalHoursWorked = Object.values(record.hoursWorked).reduce(
          (total, time) => addTime(total, time),
          '00:00'
        );

        return totalHoursWorked;
      },
    },
    {
      title: 'Ot 1',
      dataIndex: 'overtime1',
      key: 'overtime1',
      render: (text, record) => {
        const totalHoursWorked = Object.values(record.hoursWorked).reduce(
          (total, time) => addTime(total, time),
          '00:00'
        );

        const hoursWorked = parseFloat(hoursToNumber(totalHoursWorked));

        let overtime1 = '00:00';

        if (hoursWorked > 40 && hoursWorked <= 50) {
          overtime1 = subtractTime(totalHoursWorked, '40:00');
        } else if (hoursWorked > 50) {
          overtime1 = '10:00'; // Cap overtime1 at 10 hours (50 - 40)
        }

        return overtime1;
      },
    },
    {
      title: 'Ot 2',
      dataIndex: 'overtime2',
      key: 'overtime2',
      render: (text, record) => {
        const totalHoursWorked = Object.values(record.hoursWorked).reduce(
          (total, time) => addTime(total, time),
          '00:00'
        );

        const hoursWorked = parseFloat(hoursToNumber(totalHoursWorked));

        let overtime2 = '00:00';

        if (hoursWorked > 50) {
          overtime2 = subtractTime(totalHoursWorked, '50:00');
        }

        return overtime2;
      },
    },

    {
      title: 'Notes',
      dataIndex: 'notes', // Use the "notes" field for rendering
      key: 'notes',
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => showNotesModal(record)}
          icon={<FileAddOutlined />}
        />
      ),
    },
  ];

  // Function to add two time strings in "HH:mm" format
  function addTime(time1, time2) {
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

  // Function to subtract two time strings in "HH:mm" format
  function subtractTime(time1, time2) {
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

  const hoursWorkedData = employeeData.map(employee => {
    const hoursWorked = allDates.reduce((acc, date) => {
      const time = employee[date];
      acc[date] = time || '00:00'; // Use "00:00" for empty time slots
      return acc;
    }, {});

    const notes = {}; // Initialize an empty notes object

    // Loop through all dates for the employee and add notes to the notes object if available
    allDates.forEach(date => {
      const noteForDate = employee.notes && employee.notes[date];
      if (noteForDate) {
        notes[date] = noteForDate;
      }
    });

    return {
      key: employee.key,
      name: employee.name,
      hoursWorked,
      notes, // Include the notes separately in the return object
    };
  });

  console.log(hoursWorkedData);
  const handleSave = () => {
    setLoading(true);
    const dataToSave = hoursWorkedData.map(employee => {
      const { key: user, name, hoursWorked, notes } = employee;
      const timesheetData = allDates.map(date => {
        return {
          date,
          hours: hoursWorked[date] || '00:00',
        };
      });

      // Create an array of notes with the "date" field for each date in allDates
      const notesData = allDates.map(date => {
        return {
          date,
          notes: notes[date] || '',
        };
      });

      return {
        user,
        key: `${user}_${moment(startDate.$d).format('YYYY-MM-DD')}`,
        period: {
          startDate: startDate.$d,
          endDate: endDate.$d,
        },
        hoursWorked: timesheetData,
        notes: notesData,
        status: 'editing',
      };
    });
    console.log(dataToSave);

    axios
      .post(`${apiUrl}/api/timesheet`, dataToSave)
      .then(response => {
        toast('Timesheet data saved');
        setLoading(false);
        getTimesheetsByPeriod(startDate.$d, endDate.$d);
      })
      .catch(error => {
        toast('Error saving timesheet data');
        setLoading(false);
      });
  };

  const hoursToNumber = timeString => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return parseFloat(`${hours}.${minutes.toString().padStart(2, '0')}`);
  };

  const handleSubmit = () => {
    setLoading2(true);
    const dataToSave = hoursWorkedData.map(employee => {
      const { key: user, name, hoursWorked, notes } = employee;
      const timesheetData = allDates.map(date => {
        return {
          date,
          hours: hoursWorked[date] || '00:00',
        };
      });

      // Create an array of notes with the "date" field for each date in allDates
      const notesData = allDates.map(date => {
        return {
          date,
          notes: notes[date] || '',
        };
      });

      return {
        user,
        key: `${user}_${moment(startDate.$d).format('YYYY-MM-DD')}`,
        period: {
          startDate: startDate.$d,
          endDate: endDate.$d,
        },
        hoursWorked: timesheetData,
        notes: notesData,
        status: 'pending',
      };
    });
    console.log(dataToSave);

    axios
      .post(`${apiUrl}/api/timesheet`, dataToSave)
      .then(response => {
        toast('Timesheet data saved');
        setLoading2(false);
        getTimesheetsByPeriod(startDate.$d, endDate.$d);
      })
      .catch(error => {
        toast('Error saving timesheet data');
        setLoading2(false);
      });
  };

  const handleReset = () => {
    console.log('reset');
  };

  //console.log(hoursWorkedData);

  return (
    <div>
      <ToastContainer autoClose={2000} />

      <div className="flex justify-center mt-2 mb-4 space-x-1">
        <h1>Work Week:</h1>
        <div className="flex space-x-2">
          <p>( {formattedStartDate}</p>
          <p>-</p>
          <p>{formattedEndDate} )</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table
          dataSource={hoursWorkedData}
          columns={columns}
          pagination={false}
        />
        <NotesModal
          visible={isModalVisible}
          dates={allDates}
          onCancel={handleNotesCancel}
          onSave={handleNotesSave}
          employee={currentEmployee}
        />
      </div>

      <div className="flex justify-center space-x-4 mt-4">
        <Button
          className="bg-blue-600 text-white"
          type="primary px-10"
          onClick={handleReset}
        >
          {loading ? 'loading...' : 'Reset'}
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

export default TimeSheetTable;
