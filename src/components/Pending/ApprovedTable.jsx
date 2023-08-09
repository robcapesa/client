import React, { useState } from 'react';
import moment from 'moment';
import { Table, Button, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import PDFModal from './PDFModal';

function ApprovedTable({ timesheets }) {
  const navigate = useNavigate();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  console.log(timesheets);
  // Function to calculate earnings based on overtime, pay rate, deductions, and additions

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
  // Calculate total hours, overtime1, and overtime2 for each approved timesheet
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

    //console.log(totalHoursDecimal,overtime1,overtime2)
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
      sin: timesheet.user?.sin,
      period: timesheet.period,
      total: timesheet?.user?.total || 0,
      finalHours: finalHours.toFixed(2) || 0,
      status: timesheet.status,
      rate: `$${timesheet.user?.payRate}` || 'N/A',
      deductions: `$${timesheet.deductions || 0}`,
      additions: `$${timesheet.additions || 0}`,
      totalHours: totalHoursWorked,
      overtime1: formattedOvertime1,
      overtime2: formattedOvertime2,
      beforeEarnings: `$${totalEarnings.toFixed(2)}`,
      totalEarnings: `$${totalEarnings.toFixed(2)}`,
    };
  });

  const columns = [
    // Define the columns for the approved timesheet table
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
      title: 'Total Hours',
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
          <div className="flex space-x-2">
            <Button
              className="bg-blue-600 text-white"
              type="primary"
              onClick={() => {
                setSelectedRecord(record); // Save the selected record to state
                setModalVisible(true); // Open the modal
              }}
            >
              Generate Pdf
            </Button>

            <Button
              className="bg-red-700 text-white"
              type="danger"
              onClick={() => console.log(record)}
            >
              Email
            </Button>
          </div>
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
      <div className="flex justify-center mt-2 mb-4 space-x-1">
        <h1>Work Week:</h1>
        <div className="flex space-x-2">
          <p>{formattedWorkWeekStartDate}</p>
          <p>-</p>
          <p>{formattedWorkWeekEndDate}</p>
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
    </div>
  );
}

export default ApprovedTable;
