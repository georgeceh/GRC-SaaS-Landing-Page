import React, { useState, useCallback } from 'react';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const useEmailValidation = (initialValue = '') => {
  const [email, setEmail] = useState(initialValue);
  const [emailError, setEmailError] = useState('');

  const validate = useCallback((value: string): boolean => {
    if (!value) {
      setEmailError('Email address is required.');
      return false;
    }
    if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email format.');
      return false;
    }
    setEmailError('');
    return true;
  }, []);
  
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setEmail(value);
    if (emailError) {
      validate(value);
    }
  };

  const onBlur = () => {
    validate(email);
  };
  
  const reset = () => {
    setEmail(initialValue);
    setEmailError('');
  }

  return { email, emailError, onChange, onBlur, validate, reset };
};
