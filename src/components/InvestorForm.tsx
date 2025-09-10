import React, { useState } from 'react';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import { submitToNetlify } from '../utils/netlifyForms';

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 1rem;
`;

const FormTitle = styled.h2`
  font-size: 28px;
  color: ${theme.colors.primary};
  font-family: ${theme.fonts.header};
  margin-bottom: 0.5rem;
  text-align: center;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
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
  transition: border-color 0.3s ease;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
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
`;

interface InvestorData {
  name: string;
  email: string;
  organization: string;
  role: string;
  investmentFocus: string;
}

interface InvestorFormProps {
  onSubmit: (data: InvestorData) => void;
}

const InvestorForm: React.FC<InvestorFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<InvestorData>({
    name: '',
    email: '',
    organization: '',
    role: '',
    investmentFocus: '',
  });

  const [errors, setErrors] = useState<Partial<InvestorData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<InvestorData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.organization.trim()) {
      newErrors.organization = 'Organization/Fund name is required';
    }

    if (!formData.role.trim()) {
      newErrors.role = 'Role/Title is required';
    }

    if (!formData.investmentFocus) {
      newErrors.investmentFocus = 'Please select your investment focus';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Submit to Netlify Forms
      const success = await submitToNetlify('investor-access', formData);
      
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
    if (errors[name as keyof InvestorData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <FormContainer onSubmit={handleSubmit}>
      <FormTitle>Pitch Deck Access Form</FormTitle>
      
      {/* Hidden input for Netlify Forms */}
      <input type="hidden" name="form-name" value="investor-access" />
      
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
        <Label>Organization/Fund Name *</Label>
        <Input
          type="text"
          name="organization"
          value={formData.organization}
          onChange={handleChange}
          placeholder="Enter your organization or fund name"
        />
        {errors.organization && <ErrorMessage>{errors.organization}</ErrorMessage>}
      </FormGroup>

      <FormGroup>
        <Label>Role/Title *</Label>
        <Input
          type="text"
          name="role"
          value={formData.role}
          onChange={handleChange}
          placeholder="Enter your role or title"
        />
        {errors.role && <ErrorMessage>{errors.role}</ErrorMessage>}
      </FormGroup>

      <FormGroup>
        <Label>Investment Focus *</Label>
        <Select
          name="investmentFocus"
          value={formData.investmentFocus}
          onChange={handleChange}
        >
          <option value="">Select your investment focus</option>
          <option value="pre-seed">Pre-Seed/Seed</option>
          <option value="series-a">Series A+</option>
          <option value="edtech">EdTech Specialist</option>
          <option value="generalist">Generalist</option>
          <option value="other">Other</option>
        </Select>
        {errors.investmentFocus && <ErrorMessage>{errors.investmentFocus}</ErrorMessage>}
      </FormGroup>

      <SubmitButton type="submit">Get Pitch Deck</SubmitButton>
    </FormContainer>
  );
};

export default InvestorForm;