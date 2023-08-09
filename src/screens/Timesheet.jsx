import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Common/Sidebar';
import Topbar from '../components/Common/Topbar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TimeSheetTable from '../components/Timesheets/TimeSheetTable';
import { DatePicker, Form, Button } from 'antd';
import moment from 'moment';
import EditTimeSheets from '../components/Timesheets/EditTimeSheets';
import TimeSheetTable2 from '../components/Timesheets/TimeSheetTable2';
import EditTimeSheet2 from '../components/Timesheets/EditTimeSheet2';
import DateDiffModal from '../components/Timesheets/DateDiffModal';
const apiUrl = import.meta.env.VITE_SERVER_URL;

function Timesheet() {
  const [collapsed, setCollapsed] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [weeklyEmployees, setWeeklyEmployees] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [weeklyTimeSheets, setWeeklyTimeSheets] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [valid, setValid] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);

  const handleModalOpen = () => {
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
  };

  // This holds the information about dark mode/light mode
  const [mode, setMode] = useState();

  useEffect(() => {
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', event => {
        const colorScheme = event.matches ? 'dark' : 'light';
        console.log(colorScheme); // "dark" or "light"
        setMode(colorScheme);
      });
  }, []);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}/api/employee?page=1&limit=100`
        );
        setEmployees(response.data.employees);
        setWeeklyEmployees(response.data.weeklyEmployees);
      } catch (error) {
        console.error(error);
        toast('Failed to fetch employees');
      }
    };

    fetchEmployees();
  }, []); // Empty dependency array to run the effect only once on component mount
  console.log('weekly employees', weeklyEmployees);

  const handleDateChange = dates => {
    setStartDate(null);
    setEndDate(null);
    setValid(false);
    if (dates) {
      const [start, end] = dates;
      if (end.diff(start, 'days') !== 6) {
        // Show toast for invalid work week duration
        toast('A work week can only be 7 days or less');
        setValid(false);
      } else {
        setStartDate(start);
        setEndDate(end);
        getTimesheetsByPeriod(start?.$d, end?.$d);
        getTimesheetsByPeriod2(start?.$d, end?.$d);
        setValid(true);
      }
    } else {
      return;
    }
  };

  // Function to get timesheets by period
  const getTimesheetsByPeriod = async (startDate, endDate) => {
    //console.log(startDate, endDate);
    try {
      const response = await axios.get(
        `${apiUrl}/api/timesheet?startDate=${startDate}&endDate=${endDate}`
      );
      //console.log(response);
      const timesheets = response.data;
      //console.log('Timesheets fetched:', timesheets);
      setTimesheets(timesheets);
      // Perform any necessary actions with the fetched timesheets
      return timesheets;
    } catch (error) {
      console.error('Error fetching timesheets:', error);
      // Perform any error handling
      return [];
    }
  };

  // Function to get timesheets by period
  const getTimesheetsByPeriod2 = async (startDate, endDate) => {
    //console.log(startDate, endDate);
    try {
      const response = await axios.get(
        `${apiUrl}/api/timesheet2?startDate=${startDate}&endDate=${endDate}`
      );
      console.log(response);
      const timesheets = response.data;
      console.log('Timesheets fetched:', timesheets);
      setWeeklyTimeSheets(timesheets);
      // Perform any necessary actions with the fetched timesheets
      return timesheets;
    } catch (error) {
      console.error('Error fetching timesheets:', error);
      // Perform any error handling
      return [];
    }
  };

  console.log('weekly', weeklyTimeSheets);

  return (
    <div className={`${mode === 'dark' ? 'bg-white' : 'bg-white'} font-lato`}>
      <Topbar collapsed={collapsed} />
      <ToastContainer autoClose={2000} />

      <div className="flex">
        {/* Left */}
        <div>
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        </div>

        {/* Right */}
        <div className="w-10/12 mb-20">
          {/* Content of the right div */}
          <div className="w-5/12 mt-36 space-x-6  mx-auto  flex flex-row justify-center align-middle">
            {/* Start Date */}
            <Form.Item label="Start Date">
              <DatePicker.RangePicker
                value={[startDate, endDate]}
                format="YYYY-MM-DD"
                onChange={handleDateChange}
              />
            </Form.Item>
          </div>
          <Button className='flex justify-center bg-[#853FC1] mx-auto' type="primary" onClick={handleModalOpen}>
           Calculator
         </Button>
         <DateDiffModal visible={modalVisible} onCancel={handleModalClose} />
 
          <div className="w-12/12 flex flex-row justify-center align-middle">
          
            {timesheets?.length == 0 && valid && (
              <TimeSheetTable
                employees={employees}
                startDate={startDate}
                endDate={endDate}
                getTimesheetsByPeriod={getTimesheetsByPeriod}
              />
            )}
            {timesheets?.length > 0 && valid && (
              <EditTimeSheets timesheets={timesheets} />
            )}
          </div>
          {weeklyEmployees?.length > 0 && (
            <div className="w-12/12 mt-10 flex flex-row justify-center align-middle">
              {weeklyTimeSheets?.length == 0 && valid && (
                <TimeSheetTable2
                  employees={weeklyEmployees}
                  startDate={startDate}
                  endDate={endDate}
                  getTimesheetsByPeriod2={getTimesheetsByPeriod2}
                />
              )}
              {weeklyTimeSheets?.length > 0 && valid && (
                <EditTimeSheet2 timesheets={weeklyTimeSheets} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Timesheet;
