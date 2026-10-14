import React, { useState } from 'react';
import {
    Box,
    Stepper,
    Step,
    StepLabel,
    Button,
    Typography,
    TextField,
    MenuItem,
    Paper,
    CircularProgress,
    Alert
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../api/axios';

const steps = ['Basic Info', 'Identity Details', 'Assignment', 'Verification'];

const ClientOnboardingWizard = ({ onComplete }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState({
        name: '',
        entityType: 'Individual',
        pan: '',
        gstins: '',
        assignedTo: '',
    });
    const [error, setError] = useState(null);

    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: (data) => axios.post('/api/clients', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['clients']);
            if (onComplete) onComplete();
        },
        onError: (err) => setError(err.response?.data?.message || 'Failed to create client')
    });

    const handleNext = () => {
        if (activeStep === steps.length - 1) {
            handleSubmit();
        } else {
            setActiveStep((prev) => prev + 1);
        }
    };

    const handleBack = () => setActiveStep((prev) => prev - 1);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        const payload = {
            ...formData,
            gstins: formData.gstins.split(',').map(s => s.trim()).filter(Boolean)
        };
        createMutation.mutate(payload);
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Client Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            select
                            label="Entity Type"
                            name="entityType"
                            value={formData.entityType}
                            onChange={handleChange}
                            margin="normal"
                        >
                            {['Individual', 'HUF', 'Partnership', 'Company', 'LLP', 'Trust', 'AOP/BOI'].map((opt) => (
                                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                            ))}
                        </TextField>
                    </Box>
                );
            case 1:
                return (
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="PAN"
                            name="pan"
                            value={formData.pan}
                            onChange={handleChange}
                            margin="normal"
                            required
                            placeholder="ABCDE1234F"
                        />
                        <TextField
                            fullWidth
                            label="GSTINs (comma separated)"
                            name="gstins"
                            value={formData.gstins}
                            onChange={handleChange}
                            margin="normal"
                            placeholder="27AAAAA0000A1Z5, ..."
                        />
                    </Box>
                );
            case 2:
                return (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                            Assign this client to a staff member or partner for case management.
                        </Typography>
                        <TextField
                            fullWidth
                            label="Assigned To (User ID or Name)"
                            name="assignedTo"
                            value={formData.assignedTo}
                            onChange={handleChange}
                            margin="normal"
                        />
                    </Box>
                );
            case 3:
                return (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Typography variant="h6">Review & Confirm</Typography>
                        <Box sx={{ textAlign: 'left', mt: 2 }}>
                            <Typography><strong>Name:</strong> {formData.name}</Typography>
                            <Typography><strong>PAN:</strong> {formData.pan}</Typography>
                            <Typography><strong>Type:</strong> {formData.entityType}</Typography>
                        </Box>
                        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                    </Box>
                );
            default:
                return null;
        }
    };

    return (
        <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
            <Typography variant="h5" gutterBottom align="center">
                New Client Boarding
            </Typography>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
            </Stepper>

            {renderStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button disabled={activeStep === 0} onClick={handleBack}>
                    Back
                </Button>
                <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={createMutation.isLoading}
                >
                    {createMutation.isLoading ? <CircularProgress size={24} /> : (activeStep === steps.length - 1 ? 'Finish' : 'Next')}
                </Button>
            </Box>
        </Paper>
    );
};

export default ClientOnboardingWizard;
