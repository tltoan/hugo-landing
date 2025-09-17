import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { theme } from '../styles/theme';
import { submitToNetlify } from '../utils/netlifyForms';

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 1rem;
  animation: ${slideUp} 0.6s ease-out 0.1s backwards;
`;

const FormTitle = styled.h2`
  font-size: 28px;
  color: ${theme.colors.primary};
  font-family: ${theme.fonts.header};
  margin-bottom: 0.5rem;
  text-align: center;
  animation: ${slideUp} 0.5s ease-out 0.2s backwards;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  animation: ${fadeIn} 0.4s ease-out 0.4s backwards;
`;

const Label = styled.label`
  font-size: ${theme.fontSizes.formLabel};
  color: ${theme.colors.primary};
  font-weight: 500;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 2px solid rgba(65, 83, 120, 0.2);
  border-radius: 10px;
  font-size: ${theme.fontSizes.button};
  background-color: ${theme.colors.white};
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(65, 83, 120, 0.1);
  }

  &::placeholder {
    color: rgba(65, 83, 120, 0.4);
  }
`;

const Select = styled.select`
  padding: 12px 16px;
  border: 2px solid rgba(65, 83, 120, 0.2);
  border-radius: 10px;
  font-size: ${theme.fontSizes.button};
  background-color: ${theme.colors.white};
  transition: all 0.3s ease;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(65, 83, 120, 0.1);
  }
`;

const SubmitButton = styled.button`
  padding: 16px 32px;
  background-color: ${theme.colors.buttonPrimary};
  color: ${theme.colors.white};
  border: none;
  border-radius: 50px;
  font-size: ${theme.fontSizes.button};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
  animation: ${slideUp} 0.5s ease-out 0.6s backwards;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(65, 83, 120, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.span`
  color: #e74c3c;
  font-size: 14px;
  margin-top: 0.25rem;
  animation: ${slideUp} 0.3s ease-out;
`;

interface FormData {
  name: string;
  email: string;
  university: string;
  currentStatus: string;
  financeExperience: string;
}

interface UserAccessFormProps {
  onSubmit: (data: FormData) => void;
}

const UserAccessForm: React.FC<UserAccessFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    university: '',
    currentStatus: '',
    financeExperience: '',
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.university.trim()) {
      newErrors.university = 'University is required';
    }

    if (!formData.currentStatus) {
      newErrors.currentStatus = 'Please select your current status';
    }

    if (!formData.financeExperience) {
      newErrors.financeExperience = 'Please select your finance experience';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Submit to Netlify Forms
      const success = await submitToNetlify('user-access', formData);
      
      if (success) {
        onSubmit(formData);
      } else {
        // Fallback to localStorage if Netlify submission fails
        console.log('Netlify submission failed, saving locally');
        onSubmit(formData);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <FormContainer onSubmit={handleSubmit}>
      <FormTitle>Sign Up</FormTitle>
      
      {/* Hidden input for Netlify Forms */}
      <input type="hidden" name="form-name" value="user-access" />
      
      <FormGroup>
        <Label>Name *</Label>
        <Input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter your full name"
        />
        {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
      </FormGroup>

      <FormGroup>
        <Label>Email Address *</Label>
        <Input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
        />
        {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
      </FormGroup>

      <FormGroup>
        <Label>University *</Label>
        <Input
          type="text"
          name="university"
          value={formData.university}
          onChange={handleChange}
          placeholder="Enter your university"
        />
        {errors.university && <ErrorMessage>{errors.university}</ErrorMessage>}
      </FormGroup>

      <FormGroup>
        <Label>Current Status *</Label>
        <Select
          name="currentStatus"
          value={formData.currentStatus}
          onChange={handleChange}
        >
          <option value="">Select your status</option>
          <option value="undergraduate">Undergraduate Student</option>
          <option value="mba">MBA Student</option>
          <option value="graduate">Recent Graduate</option>
          <option value="professional">Working Professional</option>
        </Select>
        {errors.currentStatus && <ErrorMessage>{errors.currentStatus}</ErrorMessage>}
      </FormGroup>

      <FormGroup>
        <Label>Finance Experience *</Label>
        <Select
          name="financeExperience"
          value={formData.financeExperience}
          onChange={handleChange}
        >
          <option value="">Select your experience</option>
          <option value="none">No Experience</option>
          <option value="interned">Interned at IB/PE</option>
          <option value="recruiting">Recruiting for IB/PE</option>
          <option value="working">Working Professional</option>
        </Select>
        {errors.financeExperience && <ErrorMessage>{errors.financeExperience}</ErrorMessage>}
      </FormGroup>

      <SubmitButton type="submit">Sign Up</SubmitButton>
    </FormContainer>
  );
};

export default UserAccessForm;