import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    TextField,
    InputAdornment
} from '@mui/material';
import { Search, Clock } from 'lucide-react';
import axios from '../../api/axios';
import { format } from 'date-fns';

const AuditLogList = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await axios.get('/api/admin/audit-logs');
                setLogs(res.data.data || []);
            } catch (err) {
                console.error('Failed to fetch audit logs', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom>System Audit Trail</Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Immutable record of all sensitive actions performed across the tenant.
            </Typography>

            <TextField
                fullWidth
                placeholder="Search logs by action, resource, or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 4 }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Search size={20} />
                        </InputAdornment>
                    ),
                }}
            />

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                            <TableCell>Timestamp</TableCell>
                            <TableCell>User</TableCell>
                            <TableCell>Action</TableCell>
                            <TableCell>Resource</TableCell>
                            <TableCell>IP Address</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} align="center">Loading...</TableCell></TableRow>
                        ) : filteredLogs.length === 0 ? (
                            <TableRow><TableCell colSpan={6} align="center">No audit logs found</TableCell></TableRow>
                        ) : filteredLogs.map((log) => (
                            <TableRow key={log._id}>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Clock size={14} />
                                        {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                                    </Box>
                                </TableCell>
                                <TableCell>{log.user?.email || 'System'}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={log.action}
                                        size="small"
                                        color={log.action.startsWith('DELETE') ? 'error' : 'primary'}
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>{log.resource} ({log.resourceId})</TableCell>
                                <TableCell>{log.ipAddress || '—'}</TableCell>
                                <TableCell>
                                    <Chip
                                        label="Success"
                                        size="small"
                                        color="success"
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default AuditLogList;
