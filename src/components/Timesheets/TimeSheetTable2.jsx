import React, { useState } from 'react';
import moment from 'moment';
import { Table, Button, Input, Switch } from 'antd';
import { FileAddOutlined, FileDoneOutlined } from '@ant-design/icons';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const apiUrl = import.meta.env.VITE_SERVER_URL;

// ... (rest of the code)

function TimeSheetTable2({
  employees,
  startDate,
  endDate,
  getTimesheetsByPeriod2,
}) {
  const formattedStartDate = moment(startDate?.$d).format('(ddd) YYYY-MM-DD');
  const formattedEndDate = moment(endDate?.$d).format('(ddd) YYYY-MM-DD');

  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);

  const [employeeData, setEmployeeData] = useState(() => {
    // Initialize the employee data with empty hours for each date
    const data = employees.map(employee => ({
      key: employee._id,
      name: employee.name,
      notes: '', // Default empty notes
      worked: false, // Default worked as false
      type: 'weekly',
      period: {
        startDate: startDate?.$d,
        endDate: endDate?.$d,
      },
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
              notes: notes,
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

  const handleSave = () => {
    setLoading(true);
    // Create a new array with the data to be sent to the backend
    const dataToSave = employeeData.map(employee => ({
      user: employee?.key, // Assuming employee.key is the user ID
      key: employee?.key + moment(startDate?.$d).format('YYYY-MM-DD'),
      hours: employee.worked, // Include the worked status
      notes: employee.notes, // Include the notes
      period: {
        startDate: startDate?.$d,
        endDate: endDate?.$d,
      },
      status: 'editing', // Set the default status as 'editing'
    }));

    console.log(dataToSave);

    // Send the POST request to the backend API
    axios
      .post(`${apiUrl}/api/timesheet2`, dataToSave)
      .then(response => {
        toast('Timesheet data saved');
        // Perform any necessary actions after successful save
        getTimesheetsByPeriod2(startDate.$d, endDate.$d);
        setLoading(false);
      })
      .catch(error => {
        toast('Error saving timesheet data');
        setLoading(false);
        // Perform any error handling
      });

    setLoading(false);
  };

  const handleSubmit = () => {
    setLoading2(true);
    // Create a new array with the data to be sent to the backend
    const dataToSave = employeeData.map(employee => ({
      user: employee?.key, // Assuming employee.key is the user ID
      key: employee?.key + moment(startDate?.$d).format('YYYY-MM-DD'),
      hours: employee.worked, // Include the worked status
      notes: employee.notes, // Include the notes
      period: {
        startDate: startDate?.$d,
        endDate: endDate?.$d,
      },
      status: 'pending', // Set the default status as 'editing'
    }));
    // Send the POST request to the backend API
    axios
      .post(`${apiUrl}/api/timesheet2`, dataToSave)
      .then(response => {
        toast('Timesheet data saved');
        // Perform any necessary actions after successful save
        getTimesheetsByPeriod2(startDate.$d, endDate.$d);
        setLoading2(false);
      })
      .catch(error => {
        toast('Error saving timesheet data');
        setLoading2(false);
        // Perform any error handling
      });

    setLoading2(false);
  };

  const handleReset = () => {
    console.log('reset');
  };

  const renderWorkedCell = (_, record) => (
    <Switch
      className="bg-black"
      checked={record.worked}
      onChange={checked =>
        setEmployeeData(prevData => {
          return prevData.map(employee => {
            if (employee.key === record.key) {
              return { ...employee, worked: checked };
            }
            return employee;
          });
        })
      }
    />
  );

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Pay Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      render: (_, record) => (
        <Input
          value={record.notes}
          onChange={e =>
            setEmployeeData(prevData => {
              return prevData.map(employee => {
                if (employee.key === record.key) {
                  return { ...employee, notes: e.target.value };
                }
                return employee;
              });
            })
          }
          placeholder="Enter notes"
        />
      ),
    },
    {
      title: 'Worked',
      dataIndex: 'worked',
      key: 'worked',
      render: renderWorkedCell,
    },
  ];

  //console.log(employeeData);

  return (
    <div>
      <ToastContainer autoClose={2000} />

      {/* ... (rest of the code) */}

      <div className="overflow-x-auto">
        <Table dataSource={employeeData} columns={columns} pagination={false} />
      </div>

      {/* ... (rest of the code) */}
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

export default TimeSheetTable2;
