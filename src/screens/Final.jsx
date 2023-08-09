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
import FinalTable from '../components/Final/FinalTable';
const apiUrl = import.meta.env.VITE_SERVER_URL;

const { Option } = Select;

function Final() {
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [periodStartDates, setPeriodStartDates] = useState([]);
  const [data, setData] = useState([]);
  const [selectedStartDate, setSelectedStartDate] = useState('');
  const [error, setError] = useState(null);
  const [show, setShow] = useState(false);
  const [valid, setValid] = useState(false);
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
      .get(`${apiUrl}/api/timesheet/periods`)
      .then(response => {
        console.log(response)
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


  const handleSearch = () => {
    getTimesheetsByPeriod(selectedStartDate);
  };

  // Function to get timesheets by period
  const getTimesheetsByPeriod = async (selectedStartDate) => {
    setLoading(true);
    setValid(false);

    try {
        const response = await axios.get(
          `${apiUrl}/api/timesheet/period/${selectedStartDate}`
        );
        const timesheets = response?.data;
        setValid(true);
        setData(timesheets);
        setLoading(false);
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

console.log(data)
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
                          key={startDateObj}
                          value={startDateObj}
                        >
                          {formatDate(startDateObj)}
                        </Option>
                      ))}
                    </Select>
                  )}
                </Form.Item>
                <div className="w-5/12 space-x-2 flex">
                  <Form.Item>
                    <Button
                      className="bg-blue-600"
                      type="primary"
                      onClick={handleSearch}
                    >
                      {loading ? 'loading...' : 'Get Records'}
                    </Button>
                  </Form.Item>
                </div>
              </>
            )}
            {!show && <h1 className="text-center text-3xl">Access Denied</h1>}
          </div>
          <div className="w-12/12 mt-10 mb-10 flex flex-row justify-center align-middle">
            
            {valid && <FinalTable dataObj={data} /> }
          </div>

         
        </div>
      </div>
    </div>
  );
}

export default Final;
