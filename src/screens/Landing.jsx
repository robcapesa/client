import React, { useEffect } from 'react';
import {
  ClockCircleOutlined,
  CalculatorOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import { Button } from 'antd';
import 'react-toastify/dist/ReactToastify.css';
import LandingCards from '../components/Pending/LandingCards';

const Landing = () => {
  const logout = () => {
    // Remove token and type from local storage
    localStorage.removeItem('token');
    localStorage.removeItem('type');
    // Navigate to '/'
    window.location.href = '/'; // Redirect to the home page
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('ok');
    } else {
      window.location.href = '/'; // Redirect to the home page
    }
  }, []);

  return (
    <div className="bg-custom-background bg-cover bg-center bg-no-repeat ">
      <div className="flex flex-wrap bg-gradient-to-tl from-[#672A8F] to-transparent">
        <div className="w-full md:w-1/4 px-4">{/* Left column */}</div>
        <div className="w-full md:w-2/4 px-4">
          {/* Middle column */}
          <div
            className="flex flex-col justify-center space-x-10 items-center"
            style={{ minHeight: '100vh' }}
          >
            <div className="flex justify-center mx-auto my-auto space-x-10 items-center">
              <LandingCards
                to={'/home'}
                text={'Time Sheets'}
                icon={
                  <ClockCircleOutlined className="text-[60px] 2xl:text-[100px]" />
                }
              />
              <LandingCards
                to={'/materials'}
                text={'Materials Cal'}
                icon={
                  <CalculatorOutlined className="text-[60px] 2xl:text-[100px]" />
                }
              />
              <LandingCards
                to={'/management'}
                text={'Management'}
                icon={<CodeOutlined className="text-[60px] 2xl:text-[100px]" />}
              />
            </div>
            <Button
              onClick={logout}
              className="bg-[#9773AF] shadow-lg hover:text-gray-600 bg-opacity-10  mb-16 w-4/12 text-base h-12 font-semibold text-white"
              style={{ backdropFilter: 'blur(15px)' }}
            >
              <>Logout</>
            </Button>
          </div>
        </div>
        <div className="w-full md:w-1/4 px-4">
          {/* Right column */}
          <div className="flex p-10 justify-end items-end h-full">
            <img
              src="/logo.png"
              alt="Logo"
              style={{ width: '200px', height: '100px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
