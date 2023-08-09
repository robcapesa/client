import React, { useState } from 'react';
import { Row, Col, Input, Button, Form, Typography, Modal } from 'antd';
import moment from 'moment';

const { Title } = Typography;

function DateDiffModal({ visible, onCancel }) {
  const [timeDiff, setTimeDiff] = useState(null);

  const calculateTimeDiff = (values) => {
    const { startTime, endTime } = values;
    const startMoment = moment(startTime, 'HH:mm');
    const endMoment = moment(endTime, 'HH:mm');

    if (!startMoment.isValid() || !endMoment.isValid()) {
      setTimeDiff(null);
      return;
    }

    const diffInMinutes = endMoment.diff(startMoment, 'minutes');
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;

    setTimeDiff(`${hours} hours and ${minutes} minutes`);
  };

  return (
    <Modal
      visible={visible}
      title="Time Difference Calculator"
      onCancel={onCancel}
      footer={null}
    >
      <Form onFinish={calculateTimeDiff}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="startTime"
              label="Start Time"
              rules={[{ required: true, message: 'Please enter the start time' }]}
            >
              <Input placeholder="HH:mm" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="endTime"
              label="End Time"
              rules={[{ required: true, message: 'Please enter the end time' }]}
            >
              <Input placeholder="HH:mm" />
            </Form.Item>
          </Col>
        </Row>
        <Button className='bg-blue-600' type="primary" htmlType="submit">
          Calculate
        </Button>
      </Form>
      {timeDiff && (
        <div style={{ marginTop: '20px' }}>
          <Title level={4}>Time Worked:</Title>
          <p>{timeDiff}</p>
        </div>
      )}
    </Modal>
  );
}

export default DateDiffModal;
