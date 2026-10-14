import React from 'react';
import {
    Grid,
    Paper,
    Typography,
    Box,
    Card,
    CardContent,
    Divider
} from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const COLORS = ['#2563EB', '#D97706', '#DC2626', '#059669'];

const DashboardStats = ({ stats = {} }) => {
    const departmentData = [
        { name: 'Income Tax', notices: stats.byDepartment?.IncomeTax || 0 },
        { name: 'GST', notices: stats.byDepartment?.GST || 0 },
        { name: 'TDS', notices: stats.byDepartment?.TDS || 0 },
    ];

    const statusData = [
        { name: 'New', value: stats.new || 0 },
        { name: 'In Progress', value: stats.inProgress || 0 },
        { name: 'Overdue', value: stats.overdue || 0 },
        { name: 'Closed', value: stats.closed || 0 },
    ];

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Enterprise Analytics</Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Notice Volume by Department</Typography>
                        <Box sx={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={departmentData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                                    <Bar dataKey="notices" fill="#2563EB" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Status Distribution</Typography>
                        <Box sx={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardStats;
