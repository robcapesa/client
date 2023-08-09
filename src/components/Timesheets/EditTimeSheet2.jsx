import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { Table, Button, Input, Switch } from 'antd';
import { FileAddOutlined, FileDoneOutlined } from '@ant-design/icons';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const apiUrl = import.meta.env.VITE_SERVER_URL;

function EditTimeSheet2({ timesheets, onSave, onSubmit }) {
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);

  //console.log(timesheets);

  // Initialize the employee data with the data from timesheets prop
  const [employeeData, setEmployeeData] = useState(() => {
    const data = timesheets.map(timesheet => ({
      _id: timesheet._id,
      key: timesheet.user._id,
      name: timesheet.user.name,
      status: timesheet.status,
      type: 'weekly',
      notes: timesheet.notes || '',
      hours: timesheet.hours,
      period: {
        startDate: timesheet.period.startDate,
        endDate: timesheet.period.endDate,
      },
    }));
    return data;
  });

  useEffect(() => {
    // Update the employeeData state when timesheets prop changes
    setEmployeeData(prevData => {
      const newData = timesheets.map(timesheet => ({
        _id: timesheet._id,
        key: timesheet?.user?._id || "N/A",
        name: timesheet?.user?.name || "N/A",
        status: timesheet.status,
        type: 'weekly',
        notes: timesheet.notes || '',
        hours: timesheet.hours || false,
        period: {
          startDate: timesheet.period.startDate,
          endDate: timesheet.period.endDate,
        },
      }));
      return newData;
    });
  }, [timesheets]);

  const handleSave = () => {
    setLoading(true);

    // Create a new array with the data to be saved
    const dataToUpdate = employeeData.map(employee => ({
      _id: employee._id,
      user: employee?.key,
      hours: employee.hours,
      notes: employee.notes,
      period: {
        startDate: employee.period.startDate,
        endDate: employee.period.endDate,
      },
      status: 'editing',
    }));
    //console.log(dataToUpdate);
    setLoading(true);
    // Send the POST request to the backend API
    axios
      .put(`${apiUrl}/api/timesheet2`, dataToUpdate)
      .then(response => {
        toast('Timesheet data saved');
        setLoading(false);
        // Perform any necessary actions after successful save
      })
      .catch(error => {
        console.log(error);
        toast('Error saving timesheet data');
        setLoading(false);
        // Perform any error handling
      });

    //setLoading(false);
  };

  //console.log(employeeData);

  const handleSubmit = () => {
    setLoading2(true);
    // Create a new array with the data to be saved
    const dataToUpdate = employeeData.map(employee => ({
      _id: employee._id,
      user: employee?.key,
      hours: employee.hours,
      notes: employee.notes,
      period: {
        startDate: employee.period.startDate,
        endDate: employee.period.endDate,
      },
      status: 'pending',
    }));
    //console.log(dataToUpdate);
    setLoading2(true);
    // Send the POST request to the backend API
    axios
      .put(`${apiUrl}/api/timesheet2`, dataToUpdate)
      .then(response => {
        toast('Timesheet data saved');
        setLoading2(false);
        // Perform any necessary actions after successful save
      })
      .catch(error => {
        console.log(error);
        toast('Error saving timesheet data');
        setLoading2(false);
        // Perform any error handling
      });

    //setLoading(false);
  };

  const handleReset = () => {
    console.log('reset');
    // You can reset the data if needed
  };

  const renderWorkedCell = (_, record) => (
    <Switch
      checked={record.hours}
      onChange={checked =>
        setEmployeeData(prevData => {
          return prevData.map(employee => {
            if (employee.key === record.key) {
              return { ...employee, hours: checked };
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
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
      dataIndex: 'hours',
      key: 'hours',
      render: renderWorkedCell,
    },
  ];

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

export default EditTimeSheet2;
