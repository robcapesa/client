import React, { useState } from 'react';
import moment from 'moment';
import { Table, Button, InputNumber, Modal, Form, Input } from 'antd';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const apiUrl = import.meta.env.VITE_SERVER_URL;
import PDFModal from './PDFModal';

function PendingWeekly({ timesheets, handleSearch }) {
  const [deductions, setDeductions] = useState(() => {
    const initialDeductions = {};
    timesheets.forEach(timesheet => {
      initialDeductions[timesheet._id] =
        timesheet.deductions !== undefined ? timesheet.deductions : 0;
    });
    return initialDeductions;
  });

  const [additions, setAdditions] = useState(() => {
    const initialAdditions = {};
    timesheets.forEach(timesheet => {
      initialAdditions[timesheet._id] =
        timesheet.additions !== undefined ? timesheet.additions : 0;
    });
    return initialAdditions;
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [form] = Form.useForm();
  const [selectedTimesheetId, setSelectedTimesheetId] = useState(null);

  const approveTimesheet = async (timesheetId,record) => {
    const selectedDeductions = deductions[timesheetId] || 0;
    const selectedAdditions = additions[timesheetId] || 0;

    const custom = {
      deductions: selectedDeductions,
      additions: selectedAdditions,
    };

    const dateOnlyString = moment(record?.period).format('YYYY-MM-DD');



    try {
      await axios.put(`${apiUrl}/api/timesheet2/status2`, [
        { 
           _id: timesheetId, 
           status: 'approved', 
           custom: custom ,
           //added fields for source of truth
           name:record?.name || "n/a",
           rate:record?.rate || "n/a",
           period:dateOnlyString || 'n/a',
           worked:record.worked? "yes":"no" || 'n/a',
           type:record?.type || 'n/a',
           totalHours: "n/a",
           ot1: "n/a",
           ot2: "n/a",
           totalEarnings:record?.totalEarnings || "n/a",
           finalHours: "n/a"
        },
      ]);

      toast(`Timesheet with ID ${timesheetId} has been approved.`);
      handleSearch();
    } catch (error) {
      toast('Error updating timesheet status:');
    }
  };

  const denyTimesheet = async timesheetId => {
    // Open the modal for entering email and message
    setModalVisible2(true);
    setSelectedTimesheetId(timesheetId);
  };

  const handleModalSave = async () => {
    try {
      form.validateFields();
      const values = await form.validateFields();

      // Send a PUT request to the server to update the timesheet status to "denied"
      await axios.put(`${apiUrl}/api/timesheet2/status`, [
        { _id: selectedTimesheetId, status: 'denied', values: values },
      ]);

      // Assuming the status update is successful, you may want to update the UI or perform any other actions
      toast(`Timesheet with ID ${selectedTimesheetId} has been denied.`);
      handleSearch();
      setModalVisible2(false); // Close the modal after saving
      form.resetFields(); // Reset the form fields
    } catch (error) {
      toast('Error updating timesheet status:', error);
    }
  };

  const handleModalCancel = () => {
    setModalVisible2(false); // Close the modal without saving
    form.resetFields(); // Reset the form fields
  };

  const handleDeductionsChange = (value, timesheetId) => {
    // Update the deductions state
    setDeductions(prevDeductions => ({
      ...prevDeductions,
      [timesheetId]: value,
    }));

    // Update the record object with the new deduction value
    setSelectedRecord(prevRecord => ({
      ...prevRecord,
      deductions: value,
    }));
  };

  const handleAdditionsChange = (value, timesheetId) => {
    // Update the additions state
    setAdditions(prevAdditions => ({
      ...prevAdditions,
      [timesheetId]: value,
    }));

    // Update the record object with the new addition value
    setSelectedRecord(prevRecord => ({
      ...prevRecord,
      additions: value,
    }));
  };

  const handleGeneratePDF = record => {
    // Get the numeric values for deductions and additions from state
    const selectedDeductions = deductions[record.key] || 0;
    const selectedAdditions = additions[record.key] || 0;

    // Update the selected record with the numeric values
    setSelectedRecord({
      ...record,
      deductions: selectedDeductions,
      additions: selectedAdditions,
    });

    // Open the modal
    setModalVisible(true);
  };

  const calculateTotalEarned = (payRate, additions, deductions) => {
    return payRate + (additions || 0) - (deductions || 0);
  };

  const data = timesheets.map(timesheet => {
    const payRate = timesheet.user?.payRate || 0;
    const timesheetId = timesheet._id;

    // Check if the timesheet has existing deductions and additions
    const existingDeductions = timesheet.deductions || 0;
    const existingAdditions = timesheet.additions || 0;

    // Check if hoursWorked is available
    const hours = timesheet.hoursWorked || [];
    console.log('weekly', timesheet.hours);

    // Calculate total earned using the existing or updated deductions and additions
    const totalEarned = calculateTotalEarned(
      payRate,
      additions[timesheetId] !== undefined
        ? additions[timesheetId]
        : existingAdditions,
      deductions[timesheetId] !== undefined
        ? deductions[timesheetId]
        : existingDeductions
    );

    return {
      key: timesheet._id,
      name: timesheet.user?.name || 'N/A',
      status: timesheet.status,
      worked: timesheet.hours === true ? 'yes' : 'no',
      rate: `$${payRate.toFixed(2)}`,
      type: timesheet.user?.payType,
      period:timesheet?.period?.startDate || 'n/a',
      notes: timesheet.notes,
      sin: timesheet.user?.sin,
      deductions: (
        <InputNumber
          value={
            deductions[timesheetId] !== undefined
              ? deductions[timesheetId]
              : existingDeductions
          }
          onChange={value => handleDeductionsChange(value, timesheetId)}
          style={{ width: 100 }}
        />
      ),
      additions: (
        <InputNumber
          value={
            additions[timesheetId] !== undefined
              ? additions[timesheetId]
              : existingAdditions
          }
          onChange={value => handleAdditionsChange(value, timesheetId)}
          style={{ width: 100 }}
        />
      ),
      totalEarned: `$${totalEarned.toFixed(2)}`,
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
      title: 'Worked',
      dataIndex: 'worked',
      key: 'worked',
    },
    {
      title: 'Rate',
      dataIndex: 'rate',
      key: 'rate',
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
    },
    {
      title: 'Total Earned',
      dataIndex: 'totalEarned',
      key: 'totalEarned',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div className="space-x-2">
          {timesheets.find(t => t._id === record.key)?.status !== 'editing' ? (
            <div className="flex space-x-2">
              {timesheets.find(t => t._id === record.key)?.status !==
                'approved' && (
                <Button
                  className="bg-blue-600 text-white"
                  type="primary"
                  onClick={() => approveTimesheet(record.key,record)}
                >
                  Approve
                </Button>
              )}
              {timesheets.find(t => t._id === record.key)?.status ===
                'pending' && (
                <Button
                  className="bg-red-700 text-white"
                  type="danger"
                  onClick={() => denyTimesheet(record.key)}
                >
                  Deny
                </Button>
              )}
              {timesheets.find(t => t._id === record.key)?.status ===
                'approved' && (
                <Button
                  className="bg-blue-600 text-white"
                  type="danger"
                  onClick={() => {
                    handleGeneratePDF(record);
                    //setSelectedRecord(record); // Save the selected record to state
                    //setModalVisible(true); // Open the modal
                  }}
                >
                  Generate Pdf
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
        </div>
      </div>

      <Table dataSource={data} columns={columns} pagination={false} />
      {/* Ant Design Modal */}
      <div>
        <Modal
          width={860}
          bodyStyle={{ height: 400, width: 820 }}
          title="Generate PayStub As Pdf"
          visible={modalVisible}
          onCancel={() => setModalVisible(false)} // Close the modal when the user clicks outside of it
          footer={null} // No footer (remove this line if you want a footer with buttons)
        >
          {modalVisible && <PDFModal record={selectedRecord} />}
        </Modal>
      </div>
      {/* Modal for Denying Timesheet */}
      <Modal
        title="Deny Timesheet"
        visible={modalVisible2}
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

export default PendingWeekly;
