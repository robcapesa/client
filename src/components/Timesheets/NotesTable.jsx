import React from 'react';
import { Table } from 'antd';
import moment from 'moment';

// Utility function to transform timesheets data and fill in missing dates with blank notes
const transformTimesheetsData = timesheets => {
  const allDates = Array.from(
    new Set(
      timesheets.flatMap(timesheet => timesheet.notes.map(note => note.date))
    )
  );

  return timesheets.map(timesheet => {
    const notesByDate = timesheet.notes.reduce((acc, note) => {
      acc[note.date] = note.notes;
      return acc;
    }, {});

    return {
      key: timesheet._id,
      name: timesheet?.user?.name || '', // Add a fallback value for name
      ...allDates.reduce((acc, date) => {
        acc[date] = notesByDate[date] || ''; // Fill in missing dates with blank notes
        return acc;
      }, {}),
    };
  });
};

function NotesTable({ timesheets }) {
  // Ensure the timesheets data contains all dates with blank notes
  const transformedTimesheets = transformTimesheetsData(timesheets) || [];

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    // Add columns for each date in the timesheets data
    ...Object.keys(transformedTimesheets[0] || {}).map(date => {
      if (date === 'key' || date === 'name') {
        return null; // Skip 'key' and 'name' columns
      }

      // Format the date in the desired format (e.g., "Mon 12 July 2023")
      const formattedDate = moment(date).format('ddd D MMMM YYYY');

      return {
        title: formattedDate, // Display the formatted date as the column title
        dataIndex: date, // Make sure this matches the key in the data object
        key: date,
      };
    }),
  ].filter(Boolean); // Filter out null columns

  return <Table dataSource={transformedTimesheets} columns={columns} />;
}

export default NotesTable;
