import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Common/Sidebar';
import Topbar from '../components/Common/Topbar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DatePicker, Form, Button, Select } from 'antd';
import moment from 'moment';
import PendingTable from '../components/Pending/PendingTable';
import Loading from '../components/Common/Loading';
import NotesTable from '../components/Timesheets/NotesTable';
import ApprovedTable from '../components/Pending/ApprovedTable';
import PendingWeekly from '../components/Pending/PendingWeekly';
const apiUrl = import.meta.env.VITE_SERVER_URL;

const { Option } = Select;

function Pending() {
  const [collapsed, setCollapsed] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [valid, setValid] = useState(false);
  const [approved, setApproved] = useState(false);
  const [approvedData, setApprovedData] = useState(false);
  const [notes, setNotes] = useState(false);
  const [notesData, setNotesData] = useState(false);
  const [weekly, setWeekly] = useState(false);
  const [weeklyData, setWeeklyData] = useState(false);
  const [timesheets, setTimesheets] = useState([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [periodStartDates, setPeriodStartDates] = useState([]);
  const [selectedStartDate, setSelectedStartDate] = useState('');
  const [error, setError] = useState(null);
  const [show, setShow] = useState(false);
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
    const type = localStorage.getItem('type');
    const token = localStorage.getItem('token');

    if (token) {
      console.log('ok');
    } else {
      navigate('/');
    }

    if (type == 'admin') {
      setShow(true);
    } else {
      setShow(false);
    }
  }, []);

  console.log(show);

  // Fetch the unique period start dates from the backend
  useEffect(() => {
    setLoading(true);
    setError(null);
    axios
      .get(`${apiUrl}/api/timesheet/period-start-dates`)
      .then(response => {
        setLoading(false);
        setPeriodStartDates(response.data);
      })
      .catch(error => {
        setLoading(false);
        console.error('Error fetching period start dates:', error);
        setError('Error fetching period start dates');
      });
  }, []);

  const handleStartDateChange = selectedValue => {
    setSelectedStartDate(selectedValue);
    console.log('Selected Start Date:', selectedValue);
    // Use the selected start date for filtering timesheets or any other required functionality
  };

  const formatDate = date => {
    return moment(date).format('(ddd) DD MMMM YYYY');
  };

  const handleStatusChange = value => {
    setStatus(value);
  };

  const handleSearch = () => {
    getTimesheetsByPeriod(selectedStartDate, status);
  };

  // Function to get timesheets by period
  const getTimesheetsByPeriod = async (selectedStartDate, status) => {
    setLoading(true);
    setValid(false);
    setNotes(false);

    try {
      if (status === 'notes') {
        const status2 = 'pending';
        const response = await axios.get(
          `${apiUrl}/api/timesheet/withstart?startDate=${selectedStartDate}&status=${status2}`
        );
        const timesheets = response?.data?.timesheets;
        const timesheets2 = response?.data?.timesheets2;
        setValid(false);
        setApproved(false);
        setNotes(true);
        setWeekly(false);
        setNotesData(timesheets);
        setLoading(false);
      } else if (status === 'approved') {
        const response = await axios.get(
          `${apiUrl}/api/timesheet/withstart?startDate=${selectedStartDate}&status=${status}`
        );
        console.log(response);
        const timesheets = response?.data?.timesheets;
        const timesheets2 = response?.data?.timesheets2;
        console.log('Timesheets fetched:', timesheets);
        setValid(false);
        setNotes(false);
        setApproved(true);
        setWeekly(true);
        setWeeklyData(timesheets2);
        setApprovedData(timesheets);
        setLoading(false);
      } /*else if (status === 'weekly') {
        const response = await axios.get(
          `${apiUrl}/api/timesheet2/withstart?startDate=${selectedStartDate}&status=${status}`
        );
        console.log(response);
        const timesheets = response?.data?.timesheets;
        const timesheets2 = response?.data?.timesheets2;
        console.log('Timesheets fetched:', timesheets);
        setValid(false);
        setNotes(false);
        setApproved(false);
        setWeekly(true);
        setWeeklyData(timesheets);
        setLoading(false);
      } */ else {
        const response = await axios.get(
          `${apiUrl}/api/timesheet/withstart?startDate=${selectedStartDate}&status=${status}`
        );
        console.log(response);
        const timesheets = response?.data?.timesheets;
        const timesheets2 = response?.data?.timesheets2;
        console.log('Timesheets fetched:', timesheets);
        setValid(true);
        setNotes(false);
        setApproved(false);
        setWeekly(true);
        setWeeklyData(timesheets2);
        setTimesheets(timesheets);
        setLoading(false);
        // Perform any necessary actions with the fetched timesheets
      }
      return timesheets;
    } catch (error) {
      console.error('Error fetching timesheets:', error);
      setValid(false);
      // Perform any error handling
      setLoading(false);
      return [];
    }
    setLoading(false);
  };

  console.log(weeklyData);

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
        <div className="w-10/12">
          {/* Content of the right div */}
          <div className="w-full lg:w-10/12 mt-36 space-x-6  mx-auto  flex flex-row justify-center align-middle">
            {show && (
              <>
                {/* Start Date */}
                <Form.Item className="w-6/12" label="Period Start Date">
                  {loading ? (
                    <>
                      <div className="flex items-center justify-center">
                        <div
                          className={`animate-spin rounded-full border-t-2 border-b-2 border-black h-4 w-4`}
                        />
                      </div>
                    </>
                  ) : error ? (
                    <div>{error}</div>
                  ) : periodStartDates.length === 0 ? (
                    <div>No period start dates found.</div>
                  ) : (
                    <Select
                      value={selectedStartDate}
                      onChange={handleStartDateChange}
                    >
                      {periodStartDates.map(startDateObj => (
                        <Option
                          key={startDateObj._id}
                          value={startDateObj.startDate}
                        >
                          {formatDate(startDateObj.startDate)}
                        </Option>
                      ))}
                    </Select>
                  )}
                </Form.Item>
                <div className="w-5/12 space-x-2 flex">
                  {/* Status Dropdown */}
                  <Form.Item className="w-6/12" label="Status">
                    <Select value={status} onChange={handleStatusChange}>
                      <Option value="pending">Pending</Option>
                      <Option value="editing">Editing</Option>
                      <Option value="approved">Approved</Option>
                      <Option value="denied">Denied</Option>
                      <Option value="notes">Notes</Option>
                      {/*<Option value="weekly">Weekly (ALL)</Option>*/}
                    </Select>
                  </Form.Item>

                  <Form.Item>
                    <Button
                      className="bg-blue-600"
                      type="primary"
                      onClick={handleSearch}
                    >
                      {loading ? 'loading...' : 'Search'}
                    </Button>
                  </Form.Item>
                </div>
              </>
            )}
            {!show && <h1 className="text-center text-3xl">Access Denied</h1>}
          </div>
          <div className="w-12/12 flex flex-row justify-center align-middle">
            {valid && (
              <PendingTable
                handleSearch={handleSearch}
                timesheets={timesheets}
              />
            )}
            {notes && <NotesTable timesheets={notesData} />}
            {approved && <ApprovedTable timesheets={approvedData} />}
          </div>

          <div className="w-12/12 mt-10 mb-20 flex flex-row justify-center align-middle">
            {weekly && (
              <PendingWeekly
                handleSearch={handleSearch}
                timesheets={weeklyData}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Pending;
