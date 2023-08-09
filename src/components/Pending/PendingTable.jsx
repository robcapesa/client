import React, { useState } from 'react';
import moment from 'moment';
import { Table, Button, Modal, Form, Input, InputNumber } from 'antd';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const apiUrl = import.meta.env.VITE_SERVER_URL;
import Loading from "./Loading"

function PendingTable({ timesheets, handleSearch }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTimesheetId, setSelectedTimesheetId] = useState(null);
  const [form] = Form.useForm();
  const[loading,setLoading]=useState(false)
  const [deductions, setDeductions] = useState({}); // Object to store deductions for each timesheet
  const [additions, setAdditions] = useState({}); // Object to store additions for each timesheet

  const approveTimesheet = async (timesheetId, record) => {
    setLoading(true)
    // Get the deductions and additions for the selected timesheet ID
    const total = record.totalEarnings || 0;
    const id = record.userId;

    const selectedDeductions = deductions[timesheetId] || 0;
    const selectedAdditions = additions[timesheetId] || 0;

    const custom = {
      deductions: selectedDeductions,
      additions: selectedAdditions,
    };

    const dateOnlyString = moment(record?.period).format('YYYY-MM-DD');


    try {
      // Send a PUT request to the server to update the timesheet status to "approved"
      await axios.put(`${apiUrl}/api/timesheet/status2`, [
        {
          _id: timesheetId,
          status: 'approved',
          custom: custom,
          total: total,
          id: id,
          //added fields for source of truth
          name:record?.name || "n/a",
          rate:record?.rate || "n/a",
          period:dateOnlyString || 'n/a',
          worked: 'n/a',
          type:record?.type || 'n/a',
          totalHours:record?.totalHours || "n/a",
          ot1:record?.overtime1 || "n/a",
          ot2:record?.overtime2 || "n/a",
          totalEarnings:record?.totalEarnings || "n/a",
          finalHours:record?.finalHours || "n/a"
        }
      ]);

      // Assuming the status update is successful, you may want to update the UI or perform any other actions
      toast(`Timesheet with ID ${timesheetId} has been approved.`);
      setLoading(false)
      handleSearch();
    } catch (error) {
      toast('Error updating timesheet status:');
      setLoading(false)
    }
  };

  const denyTimesheet = async timesheetId => {
    // Open the modal for entering email and message
    setModalVisible(true);
    setSelectedTimesheetId(timesheetId);
  };

  const handleModalSave = async () => {
    try {
      form.validateFields();
      const values = await form.validateFields();

      // Send a PUT request to the server to update the timesheet status to "denied"
      await axios.put(`${apiUrl}/api/timesheet/status`, [
        { _id: selectedTimesheetId, status: 'denied', values: values },
      ]);

      // Assuming the status update is successful, you may want to update the UI or perform any other actions
      toast(`Timesheet with ID ${selectedTimesheetId} has been denied.`);
      handleSearch();
      setModalVisible(false); // Close the modal after saving
      form.resetFields(); // Reset the form fields
    } catch (error) {
      toast('Error updating timesheet status:', error);
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false); // Close the modal without saving
    form.resetFields(); // Reset the form fields
  };

  const handleDeductionsChange = (value, timesheetId) => {
    setDeductions(prevDeductions => ({
      ...prevDeductions,
      [timesheetId]: value,
    }));
  };

  const handleAdditionsChange = (value, timesheetId) => {
    setAdditions(prevAdditions => ({ ...prevAdditions, [timesheetId]: value }));
  };

  const emailTimesheet = timesheetId => {
    // Implement the logic to send an email for the timesheet with the given ID
    console.log(`Send email for timesheet with ID: ${timesheetId}`);
  };

  // Function to calculate total hours worked as "hh:mm" format
  function calculateTotalTime(hoursWorked) {
    let totalHoursWorked = '00:00';

    hoursWorked.forEach(entry => {
      // Parse the time in "hh:mm" format to extract hours and minutes
      const [entryHours, entryMinutes] = entry.hours.split(':').map(Number);
      const [totalHours, totalMinutes] = totalHoursWorked
        .split(':')
        .map(Number);

      // Add hours and minutes, carrying over the extra minutes (if any)
      let hoursSum = entryHours + totalHours;
      let minutesSum = entryMinutes + totalMinutes;

      if (minutesSum >= 60) {
        hoursSum += 1;
        minutesSum -= 60;
      }

      totalHoursWorked = `${hoursSum.toString().padStart(2, '0')}:${minutesSum
        .toString()
        .padStart(2, '0')}`;
    });

    return totalHoursWorked;
  }

  // Function to convert "hh:mm" time to a decimal number
  function hoursToDecimal(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours + minutes / 60;
  }

  function roundToDecimal(number, decimalPlaces) {
    const factor = 10 ** decimalPlaces;
    return Math.round(number * factor) / factor;
  }

  // Function to calculate earnings based on overtime, pay rate, overtime1, and overtime2
  const calculateTotalEarnings = (
    payRate,
    totalHours,
    overtime1,
    overtime2
  ) => {
    const regularHours = Math.min(totalHours, 40);
    const overtime1Hours = Math.min(overtime1, 10); // Cap overtime1 at 9 hours (49 - 40)
    const overtime2Hours = overtime2;

    const regularHoursEarnings = regularHours * payRate;
    const overtime1Earnings = overtime1Hours * payRate * 1.5;
    const overtime2Earnings = overtime2Hours * payRate * 2;

    const totalEarnings =
      regularHoursEarnings + overtime1Earnings + overtime2Earnings;
    return totalEarnings;
  };
  // ...

  // Calculate total hours, overtime1, and overtime2 for each timesheet
  const data = timesheets.map(timesheet => {
    const totalHoursWorked = calculateTotalTime(timesheet.hoursWorked);

    // Convert total hours worked to a decimal number
    const totalHoursDecimal = hoursToDecimal(totalHoursWorked);

    let overtime1 = 0;
    let overtime2 = 0;

    if (totalHoursDecimal > 40) {
      overtime1 = Math.min(totalHoursDecimal - 40, 10);
      overtime2 = Math.max(totalHoursDecimal - 50, 0);
    }

    // Convert overtime1 and overtime2 back to "hh:mm" format
    const formattedOvertime1 = `${Math.floor(overtime1)
      .toString()
      .padStart(2, '0')}:${((overtime1 % 1) * 60).toFixed(0).padStart(2, '0')}`;

    const formattedOvertime2 = `${Math.floor(overtime2)
      .toString()
      .padStart(2, '0')}:${((overtime2 % 1) * 60).toFixed(0).padStart(2, '0')}`;

    console.log("hours as decimal",totalHoursDecimal,overtime1,overtime2)
    // Calculate total earnings
    const payRate = timesheet.user?.payRate || 0; // Assuming payRate is available in the user object
    const totalEarnings = calculateTotalEarnings(
      payRate,
      totalHoursDecimal.toFixed(2),
      overtime1.toFixed(2),
      overtime2.toFixed(2)
    );

    const finalHours = totalEarnings / payRate;

    return {
      key: timesheet._id,
      name: timesheet.user?.name || 'N/A',
      userId: timesheet.user?._id || 'N/A',
      status: timesheet.status,
      period:timesheet?.period?.startDate || 'n/a',
      rate: `$${timesheet.user?.payRate}` || 'N/A',
      type:timesheet.user?.payType,
      finalHours: `${finalHours.toFixed(2)}(dec)` || 0,
      deductions: (
        <InputNumber
          value={deductions[timesheet._id]}
          onChange={value => handleDeductionsChange(value, timesheet._id)}
          style={{ width: 100 }}
        />
      ),
      additions: (
        <InputNumber
          value={additions[timesheet._id]}
          onChange={value => handleAdditionsChange(value, timesheet._id)}
          style={{ width: 100 }}
        />
      ),
      totalHours: totalHoursWorked,
      overtime1: formattedOvertime1,
      overtime2: formattedOvertime2,
      totalEarnings: `$${totalEarnings.toFixed(2)}`,
    };
  });

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
      title: 'Rate',
      dataIndex: 'rate',
      key: 'rate',
    },
    ,
    /*{
      title: 'Deductions',
      dataIndex: 'deductions',
      key: 'deductions',
    },
    {
      title: 'Additions',
      dataIndex: 'additions',
      key: 'additions',
    }*/ {
      title: 'Hours Worked',
      dataIndex: 'totalHours',
      key: 'totalHours',
    },
    {
      title: 'Ot 1',
      dataIndex: 'overtime1',
      key: 'overtime1',
    },
    {
      title: 'Ot 2',
      dataIndex: 'overtime2',
      key: 'overtime2',
    },
    {
      title: 'Total Earnings',
      dataIndex: 'totalEarnings',
      key: 'totalEarnings',
    },
    {
      title: 'Final Hours',
      dataIndex: 'finalHours',
      key: 'finalHours',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div className="space-x-2">
          {record.status !== 'editing' ? (
            <div className="flex space-x-2">
              {record.status !== 'approved' && (
                <Button
                  className="bg-blue-600 text-white"
                  type="primary"
                  onClick={() => approveTimesheet(record.key, record)}
                >
                  Approve
                </Button>
              )}
              {record.status === 'pending' && (
                <Button
                  className="bg-red-700 text-white"
                  type="danger"
                  onClick={() => denyTimesheet(record.key)}
                >
                  Deny
                </Button>
              )}
            </div>
          ) : (
            <>Still Editing</>
          )}
        </div>
      ),
    },
  ];

  // ...

  // Get the work week start date from the first item in timesheets
  const workWeekStartDate =
    timesheets.length > 0 ? timesheets[0].period.startDate : null;
  const workWeekEndDate =
    timesheets.length > 0 ? timesheets[0].period.endDate : null;
  const formattedWorkWeekStartDate = workWeekStartDate
    ? moment(workWeekStartDate).format('(ddd) MMM Do YYYY')
    : '';

  const formattedWorkWeekEndDate = workWeekEndDate
    ? moment(workWeekEndDate).format('(ddd) MMM Do YYYY')
    : '';

  return (
    <div>
      <ToastContainer autoClose={2000} />

      <div className="flex justify-center mt-2 mb-4 space-x-1">
        <h1>Work Week:</h1>
        <div className="flex space-x-2">
          <p> {formattedWorkWeekStartDate}</p>
          <p>-</p>
          <p>{formattedWorkWeekEndDate} </p>  
          {
            loading? <><Loading color={"black"}/></>:<></>
          }
        </div>
      </div>

      <Table dataSource={data} columns={columns} pagination={false} />

      {/* Modal for Denying Timesheet */}
      <Modal
        title="Deny Timesheet"
        visible={modalVisible}
        onCancel={handleModalCancel}
        onOk={handleModalSave}
      >
        <Form form={form}>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: 'Please enter your email' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Message"
            name="message"
            rules={[{ required: true, message: 'Please enter a message' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default PendingTable;
