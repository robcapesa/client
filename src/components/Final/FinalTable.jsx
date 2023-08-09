import React from 'react';
import moment from 'moment';
import { Table, Button } from 'antd';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function FinalTable({ dataObj }) {
  // Calculate total hours, overtime1, and overtime2 for each approved timesheet
  const data2 = dataObj.map((data) => {
    const date2 = moment(data?.period).format('(ddd) DD MMMM YYYY');

    return {
      key: data._id,
      name: data?.name || 'N/A',
      rate: data?.rate || 'N/A',
      period: date2,
      type: data?.type,
      worked: data?.worked,
      totalHours: data?.totalHours,
      ot1: data?.ot1,
      ot2: data?.ot2,
      totalEarnings: data?.totalEarnings,
      finalHours: data?.finalHours,
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
      title: 'Rate',
      dataIndex: 'rate',
      key: 'rate',
    },
    {
      title: 'Period',
      dataIndex: 'period',
      key: 'period',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Worked',
      dataIndex: 'worked',
      key: 'worked',
    },
    {
      title: 'Worked Hours',
      dataIndex: 'totalHours',
      key: 'totalHours',
    },
    {
      title: 'Ot1',
      dataIndex: 'ot1',
      key: 'ot1',
    },
    {
      title: 'Ot2',
      dataIndex: 'ot2',
      key: 'ot2',
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
  ];


  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data2);

    // Adjust column widths based on content
    const columnWidths = columns.map((col) => {
      return {
        wch: col.title.length > 10 ? col.title.length + 2 : 10, // Set a minimum width of 10 for each column
      };
    });
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, 'approved_timesheets.xlsx');
  };

  const exportToPDF = () => {
    const tableRef = document.getElementById('table-to-export');
    html2canvas(tableRef).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight);
      pdf.save('approved_timesheets.pdf');
    });
  };

  return (
    <div>
       <div className="flex space-x-2 mb-8">
      <Button className="bg-blue-600" type="primary" onClick={exportToExcel}>
        Export to Excel
      </Button>

      <Button className="bg-blue-600" type="primary" onClick={exportToPDF}>
        Export to PDF
      </Button>
      </div>

      <div id="table-to-export">
      <Table dataSource={data2} columns={columns} pagination={false} />
      </div>
    </div>
  );
}

export default FinalTable;
