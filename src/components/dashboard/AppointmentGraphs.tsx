import React, { useMemo } from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';
import { Appointment } from '../../redux/types';

interface AppointmentGraphsProps {
  appointments: Appointment[];
}

const AppointmentGraphs: React.FC<AppointmentGraphsProps> = ({ appointments }) => {
  // Graph 1: Form Completion Status (Pie Chart)
  const formCompletionData = useMemo(() => {
    let completed = 0;
    let incomplete = 0;

    appointments.forEach((apt) => {
      apt.filledForms.forEach((form) => {
        if (form.status === 'completed') {
          completed++;
        } else {
          incomplete++;
        }
      });
    });

    return [
      { name: 'Completed', value: completed, color: '#4caf50' },
      { name: 'Incomplete', value: incomplete, color: '#f44336' },
    ];
  }, [appointments]);

  // Graph 2: Appointments by Service Type (Bar Chart)
  const appointmentsByServiceData = useMemo(() => {
    const serviceMap: { [key: string]: number } = {};

    appointments.forEach((apt) => {
      apt.serviceDetails.forEach((service) => {
        serviceMap[service.service] = (serviceMap[service.service] || 0) + 1;
      });
    });

    return Object.entries(serviceMap)
      .map(([service, count]) => ({
        name: service,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 services
  }, [appointments]);

  // Graph 3: Appointments Distribution by Date (Line Chart)
  const appointmentsByDateData = useMemo(() => {
    const dateMap: { [key: string]: number } = {};

    appointments.forEach((apt) => {
      const dateKey = dayjs(apt.date).format('MMM DD');
      dateMap[dateKey] = (dateMap[dateKey] || 0) + 1;
    });

    return Object.entries(dateMap)
      .sort(([dateA], [dateB]) => {
        return dayjs(dateA, 'MMM DD').diff(dayjs(dateB, 'MMM DD'));
      })
      .map(([date, count]) => ({
        date,
        count,
      }));
  }, [appointments]);

  // Graph 4: Appointments vs Form Completion Correlation (Bar Chart)
  const appointmentCompletionData = useMemo(() => {
    return appointments
      .map((apt) => {
        const completedForms = apt.filledForms.filter(
          (f) => f.status === 'completed'
        ).length;
        const completionPercentage =
          apt.formsToFillCount > 0
            ? Math.round((completedForms / apt.formsToFillCount) * 100)
            : 0;

        return {
          date: dayjs(apt.date).format('MMM DD'),
          serviceName: apt.serviceDetails[0]?.service || 'Unknown',
          scheduled: apt.formsToFillCount,
          completed: completedForms,
          completionPercentage,
          appointmentId: apt.id,
        };
      })
      .slice(0, 12); // Last 12 appointments
  }, [appointments]);

  // Graph 5: Service Complexity Analysis (Scatter Chart)
  const serviceComplexityData = useMemo(() => {
    const serviceStats: {
      [key: string]: {
        frequency: number;
        totalForms: number;
        appointments: number;
      };
    } = {};

    appointments.forEach((apt) => {
      apt.serviceDetails.forEach((service) => {
        if (!serviceStats[service.service]) {
          serviceStats[service.service] = {
            frequency: 0,
            totalForms: 0,
            appointments: 0,
          };
        }
        serviceStats[service.service].frequency++;
        serviceStats[service.service].totalForms += apt.formsToFillCount;
        serviceStats[service.service].appointments++;
      });
    });

    return Object.entries(serviceStats)
      .map(([service, stats]) => ({
        name: service,
        frequency: stats.frequency,
        avgForms:
          stats.appointments > 0
            ? Math.round(stats.totalForms / stats.appointments)
            : 0,
        appointments: stats.appointments,
      }))
      .slice(0, 15); // Top 15 services
  }, [appointments]);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  return (
    <Box sx={{ py: 4 }}>
      <Typography
        variant="h5"
        sx={{ mb: 3, fontWeight: 'bold', color: '#333' }}
      >
        Appointment Analytics
      </Typography>

      <Grid container spacing={3}>
        {/* Graph 1: Form Completion Status */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Form Completion Status
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={formCompletionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {formCompletionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <Typography variant="caption" sx={{ mt: 2, textAlign: 'center' }}>
              Total Forms:{' '}
              {formCompletionData.reduce((sum, item) => sum + item.value, 0)}
            </Typography>
          </Paper>
        </Grid>

        {/* Graph 2: Appointments by Service Type */}
        <Grid item xs={12} sm={6} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Top Services by Appointment Count
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={appointmentsByServiceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Graph 3: Appointments Distribution by Date */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Appointments Distribution Over Time
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={appointmentsByDateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ fill: '#8884d8', r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Appointments"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Graph 4: Appointments vs Form Completion Correlation */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Form Completion by Appointment
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={appointmentCompletionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#f9f9f9',
                    border: '1px solid #ccc',
                  }}
                />
                <Legend />
                <Bar
                  dataKey="scheduled"
                  fill="#82ca9d"
                  name="Forms to Fill"
                />
                <Bar
                  dataKey="completed"
                  fill="#4caf50"
                  name="Forms Completed"
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Graph 5: Service Complexity Analysis */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Service Complexity Analysis (Frequency vs Avg Forms Required)
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="frequency"
                  type="number"
                  name="Frequency"
                  unit=" appointments"
                />
                <YAxis
                  dataKey="avgForms"
                  type="number"
                  name="Avg Forms"
                  unit=" forms"
                />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Legend />
                <Scatter
                  name="Services"
                  data={serviceComplexityData}
                  fill="#8884d8"
                  shape="circle"
                >
                  {serviceComplexityData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" component="div">
                Legend: Each circle represents a service. Size/position shows
                how frequently it's booked vs average forms required.
              </Typography>
              {serviceComplexityData.slice(0, 5).map((service, index) => (
                <Typography key={index} variant="caption" component="div">
                  • {service.name}: {service.frequency} appointments,{' '}
                  {service.avgForms} avg forms
                </Typography>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AppointmentGraphs;
